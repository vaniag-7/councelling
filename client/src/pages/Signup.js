import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createClient } from '@supabase/supabase-js';
import api from '../utils/api';
import './Signup.css';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

const Signup = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    year: '',
    course: '',
    gender: '',
    contactInfo: '',
    department: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      // Sign up with Supabase
      const { data, error: supabaseError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      });

      if (supabaseError) {
        setError(supabaseError.message);
        setLoading(false);
        return;
      }

      // Create profile via API
      await api.post('/profiles/student', {
        name: formData.name,
        year: formData.year,
        course: formData.course,
        gender: formData.gender,
        contactInfo: formData.contactInfo,
        department: formData.department
      }, {
        headers: {
          Authorization: `Bearer ${data.session?.access_token}`
        }
      });

      // Sign in automatically
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (signInError) {
        setError('Account created but login failed. Please login manually.');
        navigate('/login');
        return;
      }

      login(signInData.session.access_token, {
        id: signInData.user.id,
        email: signInData.user.email,
        userType: 'student'
      });

      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="signup-header">
          <h1>Create Your Account</h1>
          <p>Fill in your details to get started</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="signup-form">
          <div className="form-row">
            <div className="form-group">
              <label>College Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your.email@college.edu"
                required
              />
            </div>
            <div className="form-group">
              <label>Name (Optional)</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your name"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Minimum 6 characters"
                required
              />
            </div>
            <div className="form-group">
              <label>Confirm Password *</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Re-enter password"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Year</label>
              <select
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              >
                <option value="">Select Year</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>
            <div className="form-group">
              <label>Course</label>
              <input
                type="text"
                value={formData.course}
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                placeholder="e.g., Computer Science"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="Your department"
              />
            </div>
            <div className="form-group">
              <label>Gender (Optional)</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="">Prefer not to say</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Contact Info (Optional)</label>
            <input
              type="text"
              value={formData.contactInfo}
              onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
              placeholder="Phone number or alternate contact"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          <p className="login-link">
            Already have an account? <a href="/login">Login here</a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;
