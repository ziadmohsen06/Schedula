import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ChangePassword from './pages/ChangePassword';
import Dashboard from './pages/Dashboard';
import AddTaskPage from './pages/AddTaskPage';
import ProfilePage from './pages/ProfilePage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import StreakPage from './pages/StreakPage';
import CurrentTasksPage from './pages/CurrentTasksPage';
import CalendarPage from './pages/CalendarPage';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/dashboard" element={
            <PrivateRoute><Dashboard /></PrivateRoute>
          } />
          <Route path="/add-task" element={
            <PrivateRoute><AddTaskPage /></PrivateRoute>
          } />
          <Route path="/profile" element={
            <PrivateRoute><ProfilePage /></PrivateRoute>
          } />
          <Route path="/history" element={
            <PrivateRoute><HistoryPage /></PrivateRoute>
          } />
          <Route path="/settings" element={
            <PrivateRoute><SettingsPage /></PrivateRoute>
          } />
          <Route path="/streak" element={
            <PrivateRoute><StreakPage /></PrivateRoute>
          } />
          <Route path="/current-tasks" element={
            <PrivateRoute><CurrentTasksPage /></PrivateRoute>
          } />
          <Route path="/calendar" element={
            <PrivateRoute><CalendarPage /></PrivateRoute>
          } />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;