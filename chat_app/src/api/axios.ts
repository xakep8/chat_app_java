import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// Create an Axios instance
const api = axios.create({
    baseURL: '', // The Vite proxy will handle forwarding to VITE_API_ENDPOINT
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach access token to headers
api.interceptors.request.use(
    (config) => {
        // Get the latest tokens from the Zustand store
        const { tokens } = useAuthStore.getState();

        if (tokens?.accessToken) {
            config.headers['Authorization'] = `Bearer ${tokens.accessToken}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Handle errors globally (e.g., 401 Unauthorized -> logout)
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Optional: If you receive a 401, you might want to automatically logout or refresh the token
        if (error.response && error.response.status === 401) {
            console.warn('Unauthorized. Logging out...');
            useAuthStore.getState().logout();
            // Optional: Redirect to login page if window is defined
            // if (typeof window !== 'undefined') window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
