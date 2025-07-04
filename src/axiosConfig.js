import axios from 'axios';

const api = axios.create({
  // CORREÇÃO: Apontar para o seu backend local
  baseURL: 'https://api-geral-g6bc.onrender.com/', 
});

// Interceptor para adicionar o token JWT no header Authorization
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

export default api;