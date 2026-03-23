import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({
  baseURL,
  withCredentials: true,
});

export async function getAuthUrl() {
  const { data } = await api.get('/auth/url');
  return data.authUrl;
}

export async function getAuthStatus() {
  const { data } = await api.get('/auth/status');
  return data;
}

export async function logout() {
  const { data } = await api.get('/auth/logout');
  return data;
}

export async function generateDocument(formData) {
  const { data } = await api.post('/generate', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 5 * 60 * 1000,
  });
  return data;
}

export default api;
