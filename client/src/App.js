import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Appointments from './pages/Appointments';
import BookAppointment from './pages/BookAppointment';
import MoodTracking from './pages/MoodTracking';
import Resources from './pages/Resources';
import Emergency from './pages/Emergency';
import VideoSession from './pages/VideoSession';
import Feedback from './pages/Feedback';
import Navbar from './components/Navbar';
import './App.css';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Navbar />
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Navbar />
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/appointments"
            element={
              <PrivateRoute>
                <Navbar />
                <Appointments />
              </PrivateRoute>
            }
          />
          <Route
            path="/book-appointment"
            element={
              <PrivateRoute>
                <Navbar />
                <BookAppointment />
              </PrivateRoute>
            }
          />
          <Route
            path="/mood"
            element={
              <PrivateRoute>
                <Navbar />
                <MoodTracking />
              </PrivateRoute>
            }
          />
          <Route
            path="/resources"
            element={
              <PrivateRoute>
                <Navbar />
                <Resources />
              </PrivateRoute>
            }
          />
          <Route
            path="/emergency"
            element={
              <PrivateRoute>
                <Navbar />
                <Emergency />
              </PrivateRoute>
            }
          />
          <Route
            path="/session/:appointmentId"
            element={
              <PrivateRoute>
                <VideoSession />
              </PrivateRoute>
            }
          />
          <Route
            path="/feedback/:appointmentId"
            element={
              <PrivateRoute>
                <Navbar />
                <Feedback />
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
