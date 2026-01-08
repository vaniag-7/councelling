import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './Feedback.css';

const Feedback = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post('/feedback', {
        appointmentId,
        rating,
        comment,
        isAnonymous
      });
      setSubmitted(true);
      setTimeout(() => {
        navigate('/appointments');
      }, 2000);
    } catch (error) {
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="feedback-page">
        <div className="container">
          <div className="feedback-success">
            <h2>Thank you for your feedback!</h2>
            <p>Your feedback helps us improve our services.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-page">
      <div className="container">
        <h1>Session Feedback</h1>
        <p className="subtitle">Help us improve by sharing your experience</p>

        <form onSubmit={handleSubmit} className="feedback-form">
          <div className="form-group">
            <label>How would you rate this session? *</label>
            <div className="rating-selector">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`rating-star ${rating >= star ? 'active' : ''}`}
                  onClick={() => setRating(star)}
                >
                  ★
                </button>
              ))}
            </div>
            <p className="rating-text">
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
            </p>
          </div>

          <div className="form-group">
            <label>Additional Comments (Optional)</label>
            <textarea
              className="form-textarea"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts about the session..."
              rows="5"
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
              Submit feedback anonymously
            </label>
          </div>

          <div className="feedback-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/appointments')}
            >
              Skip
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Feedback;
