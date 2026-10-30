import "bootstrap/dist/css/bootstrap.min.css";
import "./borrow.css";

import maraLogo from "../assets/Mara.png";
import tvetmaraLogo from "../assets/Tmsp.png";

function formatDatabaseDate(value) {
    if (!value) return "-";
    const datePart = String(value).split(" ")[0].split("T")[0];
    const parts = datePart.split("-");
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : datePart;
}

function Borrow({ user, book, transaction }) {
    return (
        <div className="borrow-screen container-fluid">
            <div className="borrow-container container">

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
                <div className="borrow-header text-center">
                    <h3>Thank you</h3>

                    <h2>{user?.username || "-"}</h2>

                    <h3>for borrowing the book</h3>
                </div>

                {/* BORROW STATUS */}
                <div className="borrow-content text-center">
                    <h1>
                        BORROWED <span className="success-check">✅</span>
                    </h1>

                    <h3>Book borrowed successfully</h3>
                </div>

                {/* BOOK INFORMATION + BOOK IMAGE */}
                <div className="borrow-details">
                    <div className="borrow-card">

                        {/* BOOK IMAGE ON THE LEFT */}
                        <div className="borrow-book-image">
                            {book?.figure ? (
                                <img
                                    src={book.figure}
                                    alt={book?.title || "Book cover"}
                                    className="book-figure"
                                />
                            ) : (
                                <div className="no-book-image">
                                    No image available
                                </div>
                            )}
                        </div>

                        {/* BOOK INFORMATION ON THE RIGHT */}
                        <div className="borrow-info">

                            <div className="info-row">
                                <span className="info-label">Book's Title :</span>
                                <span className="info-value">{book?.title || "-"}</span>
                            </div>

                            <div className="info-row">
                                <span className="info-label">Author :</span>
                                <span className="info-value">{book?.author || "-"}</span>
                            </div>

                            <div className="info-row">
                                <span className="info-label">Borrow Date :</span>
                                <span className="info-value">
                                    {formatDatabaseDate(transaction?.borrow_date)}
                                </span>
                            </div>

                            <div className="info-row">
                                <span className="info-label">Due Date :</span>
                                <span className="info-value">
                                    {formatDatabaseDate(transaction?.due_date)}
                                </span>
                            </div>

                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="slogan">
                    Building Talent | Generating Future
                </div>

            </div>
        </div>
    );
}

export default Borrow;