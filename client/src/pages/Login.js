import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createClient } from '@supabase/supabase-js';
import api from '../utils/api';
import './Login.css';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isStudent, setIsStudent] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    teacherId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStudentLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: supabaseError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (supabaseError) {
        setError(supabaseError.message);
        setLoading(false);
        return;
      }

      // Get user profile
      const response = await api.get('/auth/me', {
        headers: {
          Authorization: `Bearer ${data.session.access_token}`
        }
      });

      login(data.session.access_token, {
        id: data.user.id,
        email: data.user.email,
        userType: 'student'
      });

      // Check if profile exists, if not redirect to signup
      const profileResponse = await api.get('/profiles/student/' + data.user.id, {
        headers: {
          Authorization: `Bearer ${data.session.access_token}`
        }
      });

      if (!profileResponse.data.profile) {
        navigate('/signup');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCounsellorLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/counsellor/login', {
        teacherId: formData.teacherId
      });

      login(response.data.token, response.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your Teacher ID.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>College Counselling App</h1>
          <p>Welcome back! Please login to continue.</p>
        </div>

        <div className="login-tabs">
          <button
            className={`tab ${isStudent ? 'active' : ''}`}
            onClick={() => setIsStudent(true)}
          >
            Student Login
          </button>
          <button
            className={`tab ${!isStudent ? 'active' : ''}`}
            onClick={() => setIsStudent(false)}
          >
            Counsellor Login
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {isStudent ? (
          <form onSubmit={handleStudentLogin} className="login-form">
            <div className="form-group">
              <label>College Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your.email@college.edu"
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter your password"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <p className="signup-link">
              Don't have an account? <a href="/signup">Sign up here</a>
            </p>
          </form>
        ) : (
          <form onSubmit={handleCounsellorLogin} className="login-form">
            <div className="form-group">
              <label>Teacher ID</label>
              <input
                type="text"
                value={formData.teacherId}
                onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                placeholder="Enter your Teacher ID"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Logging in...' : 'Login as Counsellor'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
