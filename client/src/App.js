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
import SecurityPage from './pages/SecurityPage';
import StreakPage from './pages/StreakPage';
import CurrentTasksPage from './pages/CurrentTasksPage';
import CalendarPage from './pages/CalendarPage';
import GPAPage from './pages/GPAPage';
import AssignmentsPage from './pages/AssignmentsPage';
import ClassSchedulePage from './pages/ClassSchedulePage';
import GoalsPage from './pages/GoalsPage';
import HabitsPage from './pages/HabitsPage';
import WeeklyReviewPage from './pages/WeeklyReviewPage';
import SocialPage from './pages/SocialPage';

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
          <Route path="/security" element={
            <PrivateRoute><SecurityPage /></PrivateRoute>
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
          <Route path="/gpa" element={
            <PrivateRoute><GPAPage /></PrivateRoute>
          } />
          <Route path="/assignments" element={
            <PrivateRoute><AssignmentsPage /></PrivateRoute>
          } />
          <Route path="/class-schedule" element={
            <PrivateRoute><ClassSchedulePage /></PrivateRoute>
          } />
          <Route path="/goals" element={
            <PrivateRoute><GoalsPage /></PrivateRoute>
          } />
          <Route path="/habits" element={
            <PrivateRoute><HabitsPage /></PrivateRoute>
          } />
          <Route path="/weekly-review" element={
            <PrivateRoute><WeeklyReviewPage /></PrivateRoute>
          } />
          <Route path="/social" element={
            <PrivateRoute><SocialPage /></PrivateRoute>
          } />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;