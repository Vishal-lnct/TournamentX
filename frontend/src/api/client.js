import axios from "axios";

const STORAGE_KEYS = {
  access: "ctms_access",
  refresh: "ctms_refresh",
};

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const tokenStorage = {
  getAccess: () => localStorage.getItem(STORAGE_KEYS.access),
  getRefresh: () => localStorage.getItem(STORAGE_KEYS.refresh),
  setTokens: ({ access, refresh }) => {
    if (access) {
      localStorage.setItem(STORAGE_KEYS.access, access);
    }
    if (refresh) {
      localStorage.setItem(STORAGE_KEYS.refresh, refresh);
    }
  },
  clear: () => {
    localStorage.removeItem(STORAGE_KEYS.access);
    localStorage.removeItem(STORAGE_KEYS.refresh);
  },
};

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const accessToken = tokenStorage.getAccess();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      tokenStorage.getRefresh()
    ) {
      originalRequest._retry = true;
      try {
        const refreshResponse = await axios.post(`${API_BASE_URL}/api/auth/refresh/`, {
          refresh: tokenStorage.getRefresh(),
        });
        tokenStorage.setTokens(refreshResponse.data);
        originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        tokenStorage.clear();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

export default api;
