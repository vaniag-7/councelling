import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { FiCalendar, FiHeart, FiBook, FiPhone, FiArrowRight } from 'react-icons/fi';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    totalAppointments: 0,
    moodEntries: 0
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch appointments
      const apptResponse = await api.get('/appointments/my-appointments');
      const appointments = apptResponse.data.appointments || [];
      
      const upcoming = appointments
        .filter(apt => {
          const aptDate = new Date(`${apt.date}T${apt.start_time}`);
          return aptDate > new Date() && apt.status !== 'cancelled';
        })
        .sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.start_time}`);
          const dateB = new Date(`${b.date}T${b.start_time}`);
          return dateA - dateB;
        })
        .slice(0, 3);

      setUpcomingAppointments(upcoming);
      setStats({
        upcomingAppointments: upcoming.length,
        totalAppointments: appointments.length,
        moodEntries: 0 // Will be updated when mood tracking is implemented
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!</h1>
          <p>Here's what's happening with your counselling journey</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#667eea' }}>
              <FiCalendar />
            </div>
            <div className="stat-content">
              <h3>{stats.upcomingAppointments}</h3>
              <p>Upcoming Appointments</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#f093fb' }}>
              <FiHeart />
            </div>
            <div className="stat-content">
              <h3>{stats.totalAppointments}</h3>
              <p>Total Sessions</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#4facfe' }}>
              <FiBook />
            </div>
            <div className="stat-content">
              <h3>Resources</h3>
              <p>Available</p>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="card-header">
              <h2>Upcoming Appointments</h2>
              <button className="btn btn-primary" onClick={() => navigate('/book-appointment')}>
                Book New
              </button>
            </div>
            {upcomingAppointments.length > 0 ? (
              <div className="appointments-list">
                {upcomingAppointments.map((apt) => (
                  <div key={apt.id} className="appointment-item">
                    <div className="appointment-date">
                      <span className="date-day">{new Date(apt.date).getDate()}</span>
                      <span className="date-month">{new Date(apt.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                    </div>
                    <div className="appointment-details">
                      <h4>{apt.counsellor?.name || 'Counsellor'}</h4>
                      <p>{apt.start_time} - {apt.end_time}</p>
                      <span className={`badge badge-${apt.status === 'scheduled' ? 'info' : 'success'}`}>
                        {apt.status}
                      </span>
                    </div>
                    <button
                      className="btn-icon"
                      onClick={() => navigate(`/session/${apt.id}`)}
                    >
                      <FiArrowRight />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No upcoming appointments</p>
                <button className="btn btn-primary" onClick={() => navigate('/book-appointment')}>
                  Book Your First Appointment
                </button>
              </div>
            )}
          </div>

          <div className="dashboard-card">
            <div className="card-header">
              <h2>Quick Actions</h2>
            </div>
            <div className="quick-actions">
              <button
                className="action-btn"
                onClick={() => navigate('/book-appointment')}
              >
                <FiCalendar />
                <span>Book Appointment</span>
              </button>
              <button
                className="action-btn"
                onClick={() => navigate('/mood')}
              >
                <FiHeart />
                <span>Track Mood</span>
              </button>
              <button
                className="action-btn"
                onClick={() => navigate('/resources')}
              >
                <FiBook />
                <span>View Resources</span>
              </button>
              <button
                className="action-btn"
                onClick={() => navigate('/emergency')}
              >
                <FiPhone />
                <span>Emergency Help</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
