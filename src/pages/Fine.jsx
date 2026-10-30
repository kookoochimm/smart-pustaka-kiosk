
import "bootstrap/dist/css/bootstrap.min.css";
import "./fine.css";

import maraLogo from "../assets/Mara.png";
import tvetmaraLogo from "../assets/Tmsp.png";

function formatDatabaseDate(value) {
    if (!value) return "-";
    const datePart = String(value).split(" ")[0].split("T")[0];
    const parts = datePart.split("-");
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : datePart;
}

function Fine({ user, book, transaction }) {
    const fine = transaction?.fine ?? "-";
    const lateDays = transaction?.late_days ?? "-";
    const paymentStatus = transaction?.payment_status || "-";
    const hasFine = transaction?.has_fine === 1 || transaction?.has_fine === true;

    return (
        <div className="fine-screen container-fluid">
            <div className="fine-container">

                {/* LOGOS */}
                <div className="logos">
                    <img
                        src={maraLogo}
                        alt="MARA Logo"
                        className="mara-logo"
                    />

                    <img
                        src={tvetmaraLogo}
                        alt="TVETMARA Logo"
                        className="tvetmara-logo"
                    />
                </div>

                {/* HEADER */}
                <div className="row w-100">
                    <div className="col-12 text-center">
                    <h3>Thank You</h3>

                    <h2>
                        {user?.username || user?.fullname || "-"}
                    </h2>

                    <h3>for returning the book</h3>
                    </div>
                </div>

                {/* RETURN STATUS */}
                <div className="fine-content text-center">
                    <h1>
                        RETURNED <span className="fine-success-check">✅</span>
                    </h1>

                    <h3>
                        {hasFine
                            ? "Kindly pay your fine at the counter"
                            : "Book returned successfully"}
                    </h3>
                </div>

                {/* WHITE CARD: BOOK IMAGE + BOOK INFORMATION */}
                <div className="fine-card">

                    {/* BOOK IMAGE ON THE LEFT */}
                    <div className="fine-book-image">
                        {book?.figure ? (
                            <img
                                src={book.figure}
                                alt={book?.title || "Book cover"}
                                className="fine-book-figure"
                            />
                        ) : (
                            <div className="fine-no-image">
                                No image available
                            </div>
                        )}
                    </div>

                    {/* BOOK INFORMATION ON THE RIGHT */}
                    <div className="fine-info">

                        <div className="fine-info-row">
                            <span className="fine-info-label">
                                Book's Title :
                            </span>

                            <span className="fine-info-value">
                                {book?.title || "-"}
                            </span>
                        </div>

                        <div className="fine-info-row">
                            <span className="fine-info-label">
                                Author :
                            </span>

                            <span className="fine-info-value">
                                {book?.author || "-"}
                            </span>
                        </div>

                        {/* BORROWED DATE + DUE DATE */}
                        <div className="fine-paired-row">

                            <div className="fine-pair-item">
                                <span className="fine-info-label">
                                    Borrowed Date :
                                </span>

                                <span className="fine-info-value">
                                    {formatDatabaseDate(transaction?.borrow_date)}
                                </span>
                            </div>

                            <div className="fine-pair-item">
                                <span className="fine-info-label">
                                    Due Date :
                                </span>

                                <span className="fine-info-value">
                                    {formatDatabaseDate(transaction?.due_date)}
                                </span>
                            </div>

                        </div>

                        {/* RETURNED DATE + LATE DAYS */}
                        <div className="fine-paired-row">

                            <div className="fine-pair-item">
                                <span className="fine-info-label">
                                    Returned Date :
                                </span>

                                <span className="fine-info-value">
                                    {formatDatabaseDate(transaction?.return_date)}
                                </span>
                            </div>

                            <div className="fine-pair-item">
                                <span className="fine-info-label">
                                    Late Days :
                                </span>

                                <span className="fine-info-value">
                                    {lateDays} days
                                </span>
                            </div>

                        </div>

                        {/* FINE VALUE + PAYMENT STATUS */}
                        <div className="fine-paired-row fine-last-row">

                            <div className="fine-pair-item">
                                <span className="fine-info-label">
                                    Fine Value :
                                </span>

                                <span className="fine-info-value">
                                    RM {fine}
                                </span>
                            </div>

                            <div className="fine-pair-item">
                                <span className="fine-info-label">
                                    Payment Status :
                                </span>

                                <span
                                    className={`fine-payment-status ${
                                        String(paymentStatus).toLowerCase() === "unpaid"
                                            ? "unpaid"
                                            : String(paymentStatus).toLowerCase() === "paid"
                                            ? "paid"
                                            : ""
                                    }`}
                                >
                                    {paymentStatus}
                                </span>
                            </div>

                        </div>

                    </div>
                </div>

                {/* FOOTER */}
                <div className="fine-slogan">
                    Building Talent | Generating Future
                </div>

            </div>
        </div>
    );
}

export default Fine;
