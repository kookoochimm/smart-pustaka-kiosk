import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
  timeout: 5000,
});

export const kioskService = {
  state: () => api.get("/kiosk/state"),
  reset: () => api.post("/kiosk/reset"),
};
