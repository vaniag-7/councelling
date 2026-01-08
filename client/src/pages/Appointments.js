import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { FiCalendar, FiClock, FiUser, FiVideo, FiX, FiEdit } from 'react-icons/fi';
import './Appointments.css';

const Appointments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, upcoming, past, cancelled

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await api.get('/appointments/my-appointments');
      setAppointments(response.data.appointments || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      await api.put(`/appointments/cancel/${appointmentId}`);
      fetchAppointments();
    } catch (error) {
      alert('Failed to cancel appointment. Please try again.');
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    const aptDate = new Date(`${apt.date}T${apt.start_time}`);
    const now = new Date();

    switch (filter) {
      case 'upcoming':
        return aptDate > now && apt.status !== 'cancelled';
      case 'past':
        return aptDate < now || apt.status === 'completed';
      case 'cancelled':
        return apt.status === 'cancelled';
      default:
        return true;
    }
  });

  const getStatusBadge = (status) => {
    const badges = {
      scheduled: 'badge-info',
      confirmed: 'badge-success',
      rescheduled: 'badge-warning',
      cancelled: 'badge-danger',
      completed: 'badge-success'
    };
    return badges[status] || 'badge-info';
  };

  if (loading) {
    return <div className="loading">Loading appointments...</div>;
  }

  return (
    <div className="appointments-page">
      <div className="container">
        <div className="page-header">
          <h1>My Appointments</h1>
          <button className="btn btn-primary" onClick={() => navigate('/book-appointment')}>
            Book New Appointment
          </button>
        </div>

        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-tab ${filter === 'upcoming' ? 'active' : ''}`}
            onClick={() => setFilter('upcoming')}
          >
            Upcoming
          </button>
          <button
            className={`filter-tab ${filter === 'past' ? 'active' : ''}`}
            onClick={() => setFilter('past')}
          >
            Past
          </button>
          <button
            className={`filter-tab ${filter === 'cancelled' ? 'active' : ''}`}
            onClick={() => setFilter('cancelled')}
          >
            Cancelled
          </button>
        </div>

        {filteredAppointments.length > 0 ? (
          <div className="appointments-list">
            {filteredAppointments.map((apt) => {
              const aptDate = new Date(`${apt.date}T${apt.start_time}`);
              const isUpcoming = aptDate > new Date() && apt.status !== 'cancelled';

              return (
                <div key={apt.id} className="appointment-card">
                  <div className="appointment-date-badge">
                    <span className="date-day">{aptDate.getDate()}</span>
                    <span className="date-month">{aptDate.toLocaleDateString('en-US', { month: 'short' })}</span>
                  </div>

                  <div className="appointment-content">
                    <div className="appointment-header">
                      <h3>
                        {user?.userType === 'student'
                          ? apt.counsellor?.name || 'Counsellor'
                          : apt.student?.name || 'Student'}
                      </h3>
                      <span className={`badge ${getStatusBadge(apt.status)}`}>
                        {apt.status}
                      </span>
                    </div>

                    <div className="appointment-details">
                      <div className="detail-item">
                        <FiCalendar />
                        <span>{aptDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                      <div className="detail-item">
                        <FiClock />
                        <span>{apt.start_time} - {apt.end_time}</span>
                      </div>
                      {user?.userType === 'student' && apt.counsellor && (
                        <div className="detail-item">
                          <FiUser />
                          <span>{apt.counsellor.designation} - {apt.counsellor.department}</span>
                        </div>
                      )}
                      {apt.notes && (
                        <div className="appointment-notes">
                          <strong>Notes:</strong> {apt.notes}
                        </div>
                      )}
                    </div>

                    <div className="appointment-actions">
                      {isUpcoming && (
                        <>
                          <button
                            className="btn btn-primary"
                            onClick={() => navigate(`/session/${apt.id}`)}
                          >
                            <FiVideo /> Join Session
                          </button>
                          <button
                            className="btn btn-secondary"
                            onClick={() => handleCancel(apt.id)}
                          >
                            <FiX /> Cancel
                          </button>
                        </>
                      )}
                      {!isUpcoming && apt.status === 'completed' && (
                        <button
                          className="btn btn-primary"
                          onClick={() => navigate(`/feedback/${apt.id}`)}
                        >
                          Give Feedback
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <FiCalendar size={64} />
            <h3>No appointments found</h3>
            <p>You don't have any {filter !== 'all' ? filter : ''} appointments yet.</p>
            {filter === 'all' || filter === 'upcoming' ? (
              <button className="btn btn-primary" onClick={() => navigate('/book-appointment')}>
                Book Your First Appointment
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default Appointments;
