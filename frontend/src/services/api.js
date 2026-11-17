import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1",
  timeout: 10000,
});

// The JWT request interceptor and 401 handling are added in Phase 3.
export default api;
