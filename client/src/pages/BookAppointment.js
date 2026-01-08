import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './BookAppointment.css';

const BookAppointment = () => {
  const navigate = useNavigate();
  const [counsellors, setCounsellors] = useState([]);
  const [selectedCounsellor, setSelectedCounsellor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCounsellors();
  }, []);

  useEffect(() => {
    if (selectedCounsellor && selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedCounsellor, selectedDate]);

  const fetchCounsellors = async () => {
    try {
      const response = await api.get('/profiles/counsellors');
      setCounsellors(response.data.counsellors || []);
    } catch (error) {
      console.error('Error fetching counsellors:', error);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedCounsellor) return;

    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await api.get(`/appointments/slots/${selectedCounsellor.user_id}?date=${dateStr}`);
      setAvailableSlots(response.data.slots || []);
    } catch (error) {
      console.error('Error fetching slots:', error);
      setAvailableSlots([]);
    }
  };

  const handleBook = async () => {
    if (!selectedCounsellor || !selectedSlot || !selectedDate) {
      setError('Please select counsellor, date, and time slot');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await api.post('/appointments/book', {
        counsellorId: selectedCounsellor.user_id,
        date: dateStr,
        startTime: selectedSlot.start_time,
        endTime: selectedSlot.end_time,
        notes: notes
      });

      setSuccess('Appointment booked successfully! You will receive a confirmation email.');
      setTimeout(() => {
        navigate('/appointments');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="book-appointment">
      <div className="container">
        <h1>Book an Appointment</h1>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="booking-steps">
          <div className="step">
            <h2>Step 1: Select Counsellor</h2>
            <div className="counsellors-grid">
              {counsellors.map((counsellor) => (
                <div
                  key={counsellor.id}
                  className={`counsellor-card ${selectedCounsellor?.id === counsellor.id ? 'selected' : ''}`}
                  onClick={() => setSelectedCounsellor(counsellor)}
                >
                  <h3>{counsellor.name}</h3>
                  <p>{counsellor.designation}</p>
                  <p className="department">{counsellor.department}</p>
                  {counsellor.room_no && <p>Room: {counsellor.room_no}</p>}
                </div>
              ))}
            </div>
          </div>

          {selectedCounsellor && (
            <>
              <div className="step">
                <h2>Step 2: Select Date</h2>
                <div className="calendar-container">
                  <Calendar
                    onChange={setSelectedDate}
                    value={selectedDate}
                    minDate={new Date()}
                    tileDisabled={({ date }) => date < new Date()}
                  />
                </div>
              </div>

              <div className="step">
                <h2>Step 3: Select Time Slot</h2>
                {availableSlots.length > 0 ? (
                  <div className="slots-grid">
                    {availableSlots.map((slot, index) => (
                      <button
                        key={index}
                        className={`slot-btn ${selectedSlot?.start_time === slot.start_time ? 'selected' : ''}`}
                        onClick={() => setSelectedSlot(slot)}
                      >
                        {slot.start_time} - {slot.end_time}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="no-slots">No available slots for this date. Please select another date.</p>
                )}
              </div>

              <div className="step">
                <h2>Step 4: Additional Notes (Optional)</h2>
                <textarea
                  className="form-textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any specific concerns or topics you'd like to discuss..."
                  rows="4"
                />
              </div>

              <div className="booking-summary">
                <h3>Appointment Summary</h3>
                <div className="summary-item">
                  <strong>Counsellor:</strong> {selectedCounsellor.name}
                </div>
                <div className="summary-item">
                  <strong>Date:</strong> {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                {selectedSlot && (
                  <div className="summary-item">
                    <strong>Time:</strong> {selectedSlot.start_time} - {selectedSlot.end_time}
                  </div>
                )}
              </div>

              <button
                className="btn btn-primary btn-large"
                onClick={handleBook}
                disabled={loading || !selectedSlot}
              >
                {loading ? 'Booking...' : 'Confirm Booking'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;
