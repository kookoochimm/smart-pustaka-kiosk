import "bootstrap/dist/css/bootstrap.min.css";
import "./tapbook.css";

import maraLogo from "../assets/Mara.png";
import tvetmaraLogo from "../assets/Tmsp.png";

function Tapbook({ user }) {
    return (
        <div className="tapbook-screen container-fluid">
            <div className="tapbook-container container">

                {/* MARA & TVETMARA LOGOS */}
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

                {/* USER INFORMATION */}
                <div className="row w-100">
                    <div className="col-12 text-center">
                        <h3>Welcome Back</h3>

                        <h2>
                            {user?.username || "-"}
                        </h2>

                        <h3>What Can I Help?</h3>
                    </div>
                </div>

                {/* SCAN BOOK INTERFACE */}
                <div className="row w-100 justify-content-center">
                    <div className="col-12 d-flex flex-column align-items-center text-center">

                        <h1>TAP BOOK'S STICKER</h1>

                        <h3>at the reader</h3>

                        <div className="book-icon">
                            <span
                                className="book-symbol"
                                role="img"
                                aria-label="Book"
                            >
                                📓
                            </span>
                        </div>

                        <div className="slogan">
                            Building Talent | Generating Future
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}

export default Tapbook;