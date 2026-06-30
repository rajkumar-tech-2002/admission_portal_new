import axios from 'axios';

const API_URL = import.meta.env.PROD ? `${import.meta.env.BASE_URL}api` : 'http://localhost:5002/api';

const apiService = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add a request interceptor to inject the token
apiService.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // Let axios set Content-Type automatically for FormData (multipart/form-data)
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle unauthorized errors (e.g. token expired)
apiService.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Clear all data and redirect to login
            sessionStorage.clear();
            localStorage.clear();
            // We can't easily use navigate here as it's not a React component
            // but window.location.href works for immediate redirection
            const base = import.meta.env.BASE_URL || '/';
            if (window.location.pathname.startsWith(`${base}admin`) && !window.location.pathname.includes('login')) {
                window.location.href = `${base}login`;
            }
        }
        return Promise.reject(error);
    }
);

export default apiService;
