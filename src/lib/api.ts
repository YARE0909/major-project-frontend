import axios from "axios";

export const api = axios.create({
  // Using a relative path automatically points to the current domain
  baseURL: "/api", 
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  // Check if we are running in the browser to prevent SSR crashes
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});