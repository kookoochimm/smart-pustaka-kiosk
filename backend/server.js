import "dotenv/config";
import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";

const app = express();
const PORT = Number(process.env.PORT || 5001);
const FINE_PER_DAY = Number(process.env.FINE_PER_DAY || 0.5);
const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(cors(allowedOrigins.length ? { origin: allowedOrigins } : {}));
app.use(express.json());

// Enable TLS for managed cloud MySQL. If Aiven provides a CA certificate,
// paste its PEM contents into DB_SSL_CA as a Render environment variable.
const dbSsl = process.env.DB_SSL === "true"
  ? {
      ...(process.env.DB_SSL_CA
        ? { ca: process.env.DB_SSL_CA.replace(/\\n/g, "\n") }
        : {}),
      rejectUnauthorized: true,
    }
  : undefined;

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "library_db",
  ...(dbSsl ? { ssl: dbSsl } : {}),
  waitForConnections: true, connectionLimit: 10, dateStrings: true,
});

const state = { screen: "tapcard", user: null, book: null, transaction: null, error: null, updatedAt: Date.now() };
let activeUser = null;
let activeBook = null;
const normalizeUID = (v) => String(v ?? "").replace(/\s+/g, "").trim().toUpperCase();
const setState = (patch) => Object.assign(state, patch, { updatedAt: Date.now() });
const wait = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));
const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "kiosk" }));
app.get("/api/kiosk/state", (_req, res) => res.json(state));
app.post("/api/kiosk/reset", (_req, res) => {
  activeUser = null; activeBook = null;
  setState({ screen: "tapcard", user: null, book: null, transaction: null, error: null });
  res.json({ success: true, state });
});


// The kiosk ESP32 sends 8-character user-card UIDs here.
app.post("/api/kiosk/scan-user", asyncRoute(async (req, res) => {
  const uid = normalizeUID(req.body?.uid);

  if (!/^[0-9A-F]{8}$/.test(uid)) {
    return res.status(400).json({
      success: false,
      message: "Invalid user card UID."
    });
  }

  // Display card verification screen
  setState({
    screen: "verifying",
    user: null,
    book: null,
    transaction: null,
    error: null
  });

  // Allow frontend to display verification message
  await wait(700);

  // Verify user UID in database
  const [users] = await pool.query(
    `SELECT user_id, uid, fullname, username,
            matric_number, role, program, is_deleted
     FROM users
     WHERE uid = ?
     LIMIT 1`,
    [uid]
  );

  if (!users.length || Number(users[0].is_deleted) === 1) {
    activeUser = null;

    setState({
      screen: "error",
      user: null,
      book: null,
      transaction: null,
      error: "User not found."
    });

    return res.status(404).json({
      success: false,
      message: "User card not found."
    });
  }

  activeUser = users[0];
  activeBook = null;

  // User successfully verified
  setState({
    screen: "tapbook",
    user: activeUser,
    book: null,
    transaction: null,
    error: null
  });

  res.json({
    success: true,
    user: {
      user_id: activeUser.user_id,
      fullname: activeUser.fullname,
      username: activeUser.username
    }
  });
}));

// The kiosk ESP32 sends 14-character book-tag UIDs here.
app.post("/api/books/scan-book", asyncRoute(async (req, res) => {
  const uid = normalizeUID(req.body?.uid);

  if (!/^[0-9A-F]{14}$/.test(uid)) {
    return res.status(400).json({
      success: false,
      message: "Invalid book tag UID."
    });
  }

  if (!activeUser) {
    setState({
      screen: "error",
      error: "Scan a user card first."
    });

    return res.status(409).json({
      success: false,
      message: "Scan a user card first."
    });
  }

  // Display book verification screen
  setState({
    screen: "verifyingBook",
    user: activeUser,
    book: null,
    transaction: null,
    error: null
  });

  // Allow frontend to display verification message
  await wait(700);

  // Verify book UID in database
  const [books] = await pool.query(
    "SELECT * FROM books WHERE uid=? LIMIT 1",
    [uid]
  );

  if (!books.length) {
    setState({
      screen: "error",
      user: activeUser,
      book: null,
      transaction: null,
      error: "Book not found."
    });

    return res.status(404).json({
      success: false,
      message: "Book not found."
    });
  }

  const book = books[0];
  activeBook = book;

  const [unpaid] = await pool.query(
    `SELECT
       COALESCE(SUM(fine), 0) AS unpaid_total,
       FORMAT(COALESCE(SUM(fine), 0), 2) AS unpaid_total_display
     FROM borrow
     WHERE user_id = ?
       AND fine > 0
       AND LOWER(TRIM(payment_status)) <> 'paid'`,
    [activeUser.user_id]
  );

  const unpaidTotal = unpaid[0]?.unpaid_total || 0;
  const unpaidTotalDisplay = unpaid[0]?.unpaid_total_display || "0.00";

  const [activeLoans] = await pool.query(
    `SELECT *
     FROM borrow
     WHERE book_id = ? AND return_date IS NULL
     ORDER BY borrow_id DESC
     LIMIT 1`,
    [book.book_id]
  );

  if (activeLoans.length) {
    const loan = activeLoans[0];

    if (Number(loan.user_id) !== Number(activeUser.user_id)) {
      const message = "This book already been borrowed by other person";

      activeUser = null;
      activeBook = null;

      setState({
        screen: "error",
        user: null,
        book,
        transaction: null,
        error: message
      });

      return res.status(403).json({
        success: false,
        error: "BOOK_BORROWED_BY_OTHER_USER",
        message
      });
    }

    await pool.query(`
      UPDATE borrow
      SET return_date = NOW(),
          late_days = GREATEST(DATEDIFF(CURDATE(), DATE(due_date)), 0),
          fine = ROUND(GREATEST(DATEDIFF(CURDATE(), DATE(due_date)), 0) * ?, 2),
          payment_status = CASE
            WHEN GREATEST(DATEDIFF(CURDATE(), DATE(due_date)), 0) * ? > 0
            THEN 'not pay'
            ELSE 'paid'
          END
      WHERE borrow_id = ? AND return_date IS NULL
    `, [FINE_PER_DAY, FINE_PER_DAY, loan.borrow_id]);

    await pool.query(
      "UPDATE books SET status='returned' WHERE book_id=?",
      [book.book_id]
    );

    const [savedTransactions] = await pool.query(
      "SELECT borrow.*, CASE WHEN fine > 0 THEN 1 ELSE 0 END AS has_fine FROM borrow WHERE borrow_id=? LIMIT 1",
      [loan.borrow_id]
    );

    const transaction = savedTransactions[0];

    setState({
      screen: "fines",
      user: activeUser,
      book,
      transaction,
      error: null
    });

    activeUser = null;
    activeBook = null;

    return res.json({
      success: true,
      action: "return",
      transaction
    });
  }

  if (unpaidTotal > 0) {
    setState({
      screen: "error",
      user: activeUser,
      book,
      transaction: null,
      error: `New borrowing is blocked because you have an outstanding fine of RM ${unpaidTotalDisplay}.`
    });

    activeUser = null;
    activeBook = null;

    return res.status(403).json({
      success: false,
      message: "Outstanding fines prevent borrowing."
    });
  }

  const [insert] = await pool.query(`
    INSERT INTO borrow (
      user_id, book_id, username, matric_number, program,
      book_title, author, book_publisher, book_published,
      book_isbn, book_call_number, book_edition, book_page_count,
      borrow_date, due_date, return_date, late_days, fine,
      payment_status, synopsis, figure
    )
    VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      NOW(), DATE_ADD(NOW(), INTERVAL 14 DAY),
      NULL, 0, 0, 'paid', ?, ?
    )
  `, [
    activeUser.user_id,
    book.book_id,
    activeUser.username || activeUser.fullname,
    activeUser.matric_number || "-",
    activeUser.program || "-",
    book.title,
    book.author,
    book.publisher || "-",
    book.published || "-",
    book.isbn || "-",
    book.call_number || "-",
    book.edition || "-",
    book.page_count || 0,
    book.synopsis || null,
    book.figure || null
  ]);

  await pool.query(
    "UPDATE books SET status='borrowed' WHERE book_id=?",
    [book.book_id]
  );

  const [savedTransactions] = await pool.query(
    "SELECT * FROM borrow WHERE borrow_id=? LIMIT 1",
    [insert.insertId]
  );

  const transaction = savedTransactions[0];

  setState({
    screen: "borrow",
    user: activeUser,
    book,
    transaction,
    error: null
  });

  activeUser = null;
  activeBook = null;

  res.json({
    success: true,
    action: "borrow",
    transaction
  });
}));

app.use((err, _req, res, _next) => {
  console.error("Kiosk API error:", err);
  res.status(500).json({ success: false, message: "Kiosk server error. Check the server terminal." });
});
app.listen(PORT, "0.0.0.0", () => console.log(`Kiosk backend running on port ${PORT}`));
