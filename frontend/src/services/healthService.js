import api from "./api.js";

export const getHealth = () => api.get("/health").then((r) => r.data);
export const getDatabaseHealth = () => api.get("/health/db").then((r) => r.data);
