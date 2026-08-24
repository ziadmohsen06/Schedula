import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api'
});

API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

// Add response interceptor for debugging
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('401 error - token might be invalid');
    }
    return Promise.reject(error);
  }
);

export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);
export const logoutUser = () => API.post('/auth/logout');
export const forgotPasswordUser = (data) => API.post('/auth/forgot-password', data);
export const resetPasswordUser = (data) => API.post('/auth/reset-password', data);
export const changePasswordUser = (data) => API.post('/auth/change-password', data);
export const updateProfileUser = (data) => API.put('/auth/profile', data);
export const getDailyPreference = () => API.get('/auth/daily-preference');
export const updateDailyPreference = (preference) => API.put('/auth/daily-preference', { preference });
export const getTasks = () => API.get('/tasks');
export const getCompletedTasks = (params) => API.get('/tasks/history', { params });
export const createTask = (data) => API.post('/tasks', data);
export const deleteTask = (id, { series } = {}) => API.delete(`/tasks/${id}`, { params: series ? { series: true } : undefined });
export const completeTask = (id) => API.patch(`/tasks/${id}/complete`);
export const rescheduleTask = (id, data) => API.patch(`/tasks/${id}/reschedule`, data);
export const scheduleTask = (id) => API.post(`/ai/schedule/${id}`);
export const addTaskNote = (id, text) => API.post(`/tasks/${id}/notes`, { text });
export const sendChatCommand = (message) => API.post('/chat/command', { message });
export const sendTestDigest = () => API.post('/digest/test');