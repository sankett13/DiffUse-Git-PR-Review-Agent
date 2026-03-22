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
    const authData = localStorage.getItem("auth-storage");
    if (authData) {
      const { accessToken } = JSON.parse(authData);
      if (accessToken) {
        config.headers["Authorization"] = `Bearer ${accessToken}`;
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
