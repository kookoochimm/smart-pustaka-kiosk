import "bootstrap/dist/css/bootstrap.min.css";
import "./tapcard.css";
import maraLogo from "../assets/Mara.png";
import tvetmaraLogo from "../assets/Tmsp.png";

function Tapcard({ isVerifying = false }) {
    return (
        <div className="tapcard-screen container-fluid">

            <div className="tapcard-container container">

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

                <div className="row w-100">
                    <div className="col-12 text-center">

                        <h3>Welcome To</h3>
                        <h2>SMART PUSTAKA</h2>
                        <h3>TVETMARA Sungai Petani</h3>

                    </div>
                </div>

                <div className="row w-100 justify-content-center">
                    <div className="col-12 d-flex flex-column align-items-center text-center">

                        <h1>
                        {isVerifying
                            ? "VERIFYING YOUR CARD"
                            : "TAP YOUR CARD"}
                        </h1>
                        <h3>at the reader</h3>

                        <div className="card-icon">
                            <span className="card-symbol">🪪</span>
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

export default Tapcard;
