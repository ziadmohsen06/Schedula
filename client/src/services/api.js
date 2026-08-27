import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://schedula-production-de35.up.railway.app/api'
});

API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null');
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
export const updateTask = (id, data) => API.patch(`/tasks/${id}`, data);
export const scheduleTask = (id) => API.post(`/ai/schedule/${id}`);
export const getWorkloadInsights = () => API.get('/ai/workload');
export const getCourses = () => API.get('/courses');
export const createCourse = (data) => API.post('/courses', data);
export const updateCourse = (id, data) => API.patch(`/courses/${id}`, data);
export const deleteCourse = (id) => API.delete(`/courses/${id}`);
export const getGPA = () => API.get('/courses/gpa');
export const getAssignments = () => API.get('/assignments');
export const createAssignment = (data) => API.post('/assignments', data);
export const updateAssignment = (id, data) => API.patch(`/assignments/${id}`, data);
export const deleteAssignment = (id) => API.delete(`/assignments/${id}`);
export const getClassSchedule = () => API.get('/class-schedule');
export const createClassSlot = (data) => API.post('/class-schedule', data);
export const createClassSlots = (slots) => API.post('/class-schedule/bulk', { slots });
export const parseSchedulePhoto = (text) => API.post('/class-schedule/parse', { text });
export const deleteClassSlot = (id) => API.delete(`/class-schedule/${id}`);
export const getSemesterDates = () => API.get('/auth/semester');
export const updateSemesterDates = (data) => API.put('/auth/semester', data);
export const getGoals = () => API.get('/goals');
export const createGoal = (data) => API.post('/goals', data);
export const toggleMilestone = (goalId, milestoneId) => API.patch(`/goals/${goalId}/milestones/${milestoneId}`);
export const deleteGoal = (id) => API.delete(`/goals/${id}`);
export const getHabits = () => API.get('/habits');
export const createHabit = (data) => API.post('/habits', data);
export const toggleHabit = (id) => API.post(`/habits/${id}/toggle`);
export const deleteHabit = (id) => API.delete(`/habits/${id}`);
export const getWeeklyReview = () => API.get('/tasks/weekly-review');
export const setTaskScheduleHour = (id, date, hour) => API.patch(`/tasks/${id}/schedule-hour`, { date, hour });
export const getMood = () => API.get('/auth/mood');
export const updateMood = (mood) => API.put('/auth/mood', { mood });
export const getSmartSuggestions = () => API.get('/ai/suggestions');
export const sendFriendRequest = (email) => API.post('/social/friends/request', { email });
export const getIncomingRequests = () => API.get('/social/friends/requests');
export const respondToRequest = (id, action) => API.post(`/social/friends/requests/${id}/${action}`);
export const getFriends = () => API.get('/social/friends');
export const removeFriend = (id) => API.delete(`/social/friends/${id}`);
export const getLeaderboard = () => API.get('/social/leaderboard');
export const getAccountabilityPartner = () => API.get('/auth/accountability-partner');
export const updateAccountabilityPartner = (email) => API.put('/auth/accountability-partner', { email });
export const getThemePreference = () => API.get('/auth/theme');
export const updateThemePreference = (data) => API.put('/auth/theme', data);
export const addTaskNote = (id, text) => API.post(`/tasks/${id}/notes`, { text });
export const sendChatCommand = (message) => API.post('/chat/command', { message });
export const sendTestDigest = () => API.post('/digest/test');
export const getSecurityScore = () => API.get('/security/score');
export const getLoginHistory = () => API.get('/security/login-history');
export const getSessions = () => API.get('/security/sessions');
export const revokeSession = (id) => API.delete(`/security/sessions/${id}`);
export const exportAccountData = () => API.get('/account/export', { responseType: 'blob' });
export const deleteAccount = (password) => API.delete('/account', { data: { password } });