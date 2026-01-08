import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { FiVideo, FiVideoOff, FiMic, FiMicOff, FiX } from 'react-icons/fi';
import './VideoSession.css';

const VideoSession = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [meetingData, setMeetingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);

  useEffect(() => {
    fetchMeetingData();
  }, []);

  const fetchMeetingData = async () => {
    try {
      const response = await api.get(`/zoom/meeting/${appointmentId}`);
      setMeetingData(response.data);
    } catch (error) {
      console.error('Error fetching meeting data:', error);
      alert('Failed to load meeting. Please try again.');
      navigate('/appointments');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading meeting...</div>;
  }

  if (!meetingData) {
    return (
      <div className="video-session">
        <div className="session-error">
          <h2>Meeting not available</h2>
          <p>The meeting link is not ready yet. Please try again later.</p>
          <button className="btn btn-primary" onClick={() => navigate('/appointments')}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="video-session">
      <div className="session-header">
        <h2>Video Session</h2>
        <button className="btn btn-secondary" onClick={() => navigate('/appointments')}>
          <FiX /> Leave Session
        </button>
      </div>

      <div className="session-container">
        <div className="video-area">
          <div className="video-placeholder">
            <FiVideo size={64} />
            <p>Video session will start here</p>
            <p className="meeting-info">
              Meeting ID: {meetingData.meeting.meeting_number}
            </p>
          </div>
        </div>

        <div className="session-controls">
          <button
            className={`control-btn ${videoEnabled ? 'active' : ''}`}
            onClick={() => setVideoEnabled(!videoEnabled)}
          >
            {videoEnabled ? <FiVideo /> : <FiVideoOff />}
            <span>{videoEnabled ? 'Video On' : 'Video Off'}</span>
          </button>
          <button
            className={`control-btn ${audioEnabled ? 'active' : ''}`}
            onClick={() => setAudioEnabled(!audioEnabled)}
          >
            {audioEnabled ? <FiMic /> : <FiMicOff />}
            <span>{audioEnabled ? 'Audio On' : 'Audio Off'}</span>
          </button>
          <a
            href={meetingData.meeting.join_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            Open in Zoom
          </a>
        </div>

        <div className="session-info">
          <p><strong>Note:</strong> For the best experience, use the Zoom desktop app or mobile app.</p>
          <p>Meeting Password: {meetingData.meeting.meeting_password}</p>
        </div>
      </div>
    </div>
  );
};

export default VideoSession;
