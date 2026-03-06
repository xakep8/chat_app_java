import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// Create an Axios instance
const api = axios.create({
    baseURL: import.meta.env.VITE_API_ENDPOINT, // The Vite proxy will handle forwarding to VITE_API_ENDPOINT
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Crucial for sending/receiving HttpOnly cookies
});

// Request Interceptor: Attach access token to headers
api.interceptors.request.use(
    (config) => {
        // Get the latest tokens from the Zustand store
        const { accessToken } = useAuthStore.getState();

        if (accessToken) {
            config.headers['Authorization'] = `Bearer ${accessToken}`;
            const maskedToken = `${accessToken.substring(0, 5)}...${accessToken.substring(accessToken.length - 5)}`;
            console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url} - Token attached: ${maskedToken}`);
        } else {
            console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url} - No Access Token in store`);
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Handle errors globally (e.g., 401 Unauthorized -> refresh token or logout)
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // If we receive a 401 and haven't retried yet
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            console.warn(`[API 401] ${originalRequest.method?.toUpperCase()} ${originalRequest.url} returned 401. Data:`, error.response.data);
            originalRequest._retry = true;

            // Prevent infinite loops if the refresh endpoint itself returns 401
            if (originalRequest.url === '/auth/refresh') {
                useAuthStore.getState().logout();
                return Promise.reject(error);
            }

            try {
                // Attempt to refresh the token using the HttpOnly cookie
                const response = await api.post('/auth/refresh');
                const newAccessToken = response.data.token.accessToken;

                // Update Zustand store
                useAuthStore.getState().setAccessToken(newAccessToken);

                // Retry the original request
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                const maskedToken = `${newAccessToken.substring(0, 5)}...${newAccessToken.substring(newAccessToken.length - 5)}`;
                console.log(`[API Retry] Retrying ${originalRequest.url} with new token: ${maskedToken}`);
                return api(originalRequest);
            } catch (refreshError: any) {
                // Refresh failed (cookie expired, missing, etc.)
                console.error('[API Refresh Failed] Logging out...', refreshError.response?.data || refreshError.message);
                useAuthStore.getState().logout();
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
