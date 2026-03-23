import axios from "axios";

const API_BASE_URL: string | undefined = process.env.NEXT_PUBLIC_API_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const authDataString = localStorage.getItem("auth-storage");
    if (authDataString) {
      try {
        const authData = JSON.parse(authDataString);
        // Zustand persist stores state under a "state" key by default
        const accessToken = authData?.state?.accessToken;

        if (accessToken) {
          config.headers["Authorization"] = `Bearer ${accessToken}`;
        }
      } catch (e) {
        console.error("Failed to parse auth-storage from localStorage", e);
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

apiClient.interceptors.response.use(
  (response) => {
    console.log("API response from interceptor:", response);
    return response.data;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("auth-storage");
      window.location.href = "/login";
    }
    if (error.response) {
      console.error("API error response:", {
        status: error.response.status,
        data: error.response.data,
      });
    } else {
      console.error("API error:", error.message);
    }
    return Promise.reject(error);
  },
);

export default apiClient;
