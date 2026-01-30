import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000', // Backend URL
    withCredentials: true, // For passing cookies (auth)
});

export default api;
