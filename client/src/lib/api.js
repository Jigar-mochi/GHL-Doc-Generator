import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
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
    timeout: 5 * 60 * 1000, // 5 min timeout for large files
  });
  return data;
}

export default api;
