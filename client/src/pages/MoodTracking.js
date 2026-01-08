import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { FiSmile, FiFrown, FiMeh } from 'react-icons/fi';
import './MoodTracking.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const MoodTracking = () => {
  const [mood, setMood] = useState(5);
  const [stressLevel, setStressLevel] = useState(5);
  const [sleepHours, setSleepHours] = useState(7);
  const [notes, setNotes] = useState('');
  const [emoji, setEmoji] = useState('😊');
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const emojis = ['😢', '😔', '😐', '🙂', '😊', '😄', '🤩'];

  useEffect(() => {
    fetchMoodHistory();
    fetchDashboard();
  }, []);

  const fetchMoodHistory = async () => {
    try {
      const response = await api.get('/mood/history');
      setHistory(response.data.history || []);
    } catch (error) {
      console.error('Error fetching mood history:', error);
    }
  };

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/mood/dashboard?days=7');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post('/mood/check-in', {
        mood: mood,
        emoji: emoji,
        stressLevel: stressLevel,
        sleepHours: sleepHours,
        notes: notes
      });

      setNotes('');
      fetchMoodHistory();
      fetchDashboard();
      alert('Mood check-in saved successfully!');
    } catch (error) {
      alert('Failed to save mood check-in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const chartData = {
    labels: history.slice(0, 7).reverse().map(entry => 
      new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    ),
    datasets: [
      {
        label: 'Mood (1-10)',
        data: history.slice(0, 7).reverse().map(entry => entry.mood),
        borderColor: 'rgb(102, 126, 234)',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        tension: 0.4
      },
      {
        label: 'Stress Level (1-10)',
        data: history.slice(0, 7).reverse().map(entry => entry.stress_level),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Mood & Stress Trends (Last 7 Days)'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 10
      }
    }
  };

  return (
    <div className="mood-tracking">
      <div className="container">
        <h1>Mood & Wellbeing Tracking</h1>
        <p className="subtitle">Track your daily mood and wellbeing to better understand your mental health journey</p>

        <div className="mood-grid">
          <div className="mood-card">
            <h2>Today's Check-in</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>How are you feeling today? (1-10)</label>
                <div className="mood-slider-container">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={mood}
                    onChange={(e) => setMood(parseInt(e.target.value))}
                    className="mood-slider"
                  />
                  <div className="slider-labels">
                    <span>Very Low</span>
                    <span>Very High</span>
                  </div>
                  <div className="mood-value">{mood}/10</div>
                </div>
              </div>

              <div className="form-group">
                <label>Select an emoji</label>
                <div className="emoji-selector">
                  {emojis.map((em, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`emoji-btn ${emoji === em ? 'selected' : ''}`}
                      onClick={() => setEmoji(em)}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Stress Level (1-10)</label>
                <div className="mood-slider-container">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={stressLevel}
                    onChange={(e) => setStressLevel(parseInt(e.target.value))}
                    className="mood-slider"
                  />
                  <div className="slider-labels">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                  <div className="mood-value">{stressLevel}/10</div>
                </div>
              </div>

              <div className="form-group">
                <label>Sleep Hours (Last Night)</label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea
                  className="form-textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="How are you feeling? Any specific concerns?"
                  rows="3"
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Check-in'}
              </button>
            </form>
          </div>

          <div className="mood-card">
            <h2>Statistics</h2>
            {stats ? (
              <div className="stats-container">
                <div className="stat-item">
                  <h3>Average Mood</h3>
                  <p className="stat-value">{stats.averageMood || 'N/A'}</p>
                </div>
                <div className="stat-item">
                  <h3>Average Stress</h3>
                  <p className="stat-value">{stats.averageStress || 'N/A'}</p>
                </div>
                <div className="stat-item">
                  <h3>Average Sleep</h3>
                  <p className="stat-value">{stats.averageSleep ? `${stats.averageSleep} hrs` : 'N/A'}</p>
                </div>
                <div className="stat-item">
                  <h3>Trend</h3>
                  <p className={`stat-value trend-${stats.trend}`}>
                    {stats.trend === 'improving' ? '📈 Improving' : 
                     stats.trend === 'declining' ? '📉 Declining' : 
                     '➡️ Stable'}
                  </p>
                </div>
              </div>
            ) : (
              <p>No data available yet. Start tracking your mood!</p>
            )}
          </div>
        </div>

        {history.length > 0 && (
          <div className="mood-card">
            <h2>Mood History</h2>
            <div className="chart-container">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        )}

        <div className="mood-card">
          <h2>Recent Check-ins</h2>
          {history.length > 0 ? (
            <div className="history-list">
              {history.slice(0, 10).map((entry) => (
                <div key={entry.id} className="history-item">
                  <div className="history-date">
                    {new Date(entry.date).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div className="history-emoji">{entry.emoji || '😊'}</div>
                  <div className="history-mood">Mood: {entry.mood}/10</div>
                  {entry.stress_level && (
                    <div className="history-stress">Stress: {entry.stress_level}/10</div>
                  )}
                  {entry.notes && (
                    <div className="history-notes">{entry.notes}</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>No mood check-ins yet. Start tracking today!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MoodTracking;
