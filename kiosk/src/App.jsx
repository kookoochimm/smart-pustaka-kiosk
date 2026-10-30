import { useEffect, useState } from "react";
import { kioskService } from "./services/kioskService";

import TapCard from "./pages/Tapcard";
import TapBook from "./pages/Tapbook";
import Borrow from "./pages/borrow";
import Fine from "./pages/Fine";
import Error from "./pages/Error";

const initialState = {
    screen: "tapcard",
    user: null,
    book: null,
    transaction: null,
    error: null,
    updatedAt: null,
};

export default function App() {
    const [state, setState] = useState(initialState);

    // Backend receives the RFID scan from ESP32 and controls which page appears.
    useEffect(() => {
        let mounted = true;

        const pollState = async () => {
            try {
                const response = await kioskService.state();
                if (mounted) setState({ ...initialState, ...response.data });
            } catch (error) {
                console.error("Cannot read kiosk state from backend:", error.message);
            }
        };

        pollState();
        const intervalId = setInterval(pollState, 500);

        return () => {
            mounted = false;
            clearInterval(intervalId);
        };
    }, []);

    // TapBook inactivity timeout: if no new scan/state update happens for
    // 7 seconds while waiting for the book UID, return to TapCard.
    useEffect(() => {
        if (state.screen !== "tapbook") return;

        const timeoutId = setTimeout(async () => {
            try {
                await kioskService.reset();
            } catch (error) {
                console.error("Cannot reset kiosk after TapBook timeout:", error.message);
            }
        }, 7000);

        return () => clearTimeout(timeoutId);
    }, [state.screen, state.updatedAt]);

    // Keep the existing 7-second reset for result/error screens.
    useEffect(() => {
        if (!["borrow", "fines", "error"].includes(state.screen)) return;

        const timeoutId = setTimeout(async () => {
            try {
                await kioskService.reset();
            } catch (error) {
                console.error("Cannot reset kiosk result screen:", error.message);
            }
        }, 7000);

        return () => clearTimeout(timeoutId);
    }, [state.screen, state.updatedAt]);

    switch (state.screen) {
        case "tapcard":
            return <TapCard />;
        case "tapbook":
            return <TapBook user={state.user} />;
        case "borrow":
            return <Borrow user={state.user} book={state.book} transaction={state.transaction} />;
        case "fines":
            return <Fine user={state.user} book={state.book} transaction={state.transaction} />;
        case "error":
            return <Error message={state.error} />;
        default:
            return <TapCard />;
    }
}
