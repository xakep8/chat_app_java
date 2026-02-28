import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// Create an Axios instance
const api = axios.create({
    baseURL: '', // The Vite proxy will handle forwarding to VITE_API_ENDPOINT
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
            originalRequest._retry = true;

            // Prevent infinite loops if the refresh endpoint itself returns 401
            if (originalRequest.url === '/auth/refresh') {
                useAuthStore.getState().logout();
                return Promise.reject(error);
            }

            try {
                // Attempt to refresh the token using the HttpOnly cookie
                const response = await api.post('/auth/refresh');
                const newAccessToken = response.data.accessToken;

                // Update Zustand store
                useAuthStore.getState().setAccessToken(newAccessToken);

                // Retry the original request
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed (cookie expired, missing, etc.)
                console.warn('Unauthorized and refresh failed. Logging out...');
                useAuthStore.getState().logout();
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
