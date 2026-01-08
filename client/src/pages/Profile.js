import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    year: '',
    course: '',
    gender: '',
    contactInfo: '',
    department: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get(`/profiles/student/${user.id}`);
      if (response.data.profile) {
        setProfile(response.data.profile);
        setFormData({
          name: response.data.profile.name || '',
          year: response.data.profile.year || '',
          course: response.data.profile.course || '',
          gender: response.data.profile.gender || '',
          contactInfo: response.data.profile.contact_info || '',
          department: response.data.profile.department || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');

    try {
      await api.post('/profiles/student', formData);
      setSuccess('Profile updated successfully!');
      fetchProfile();
    } catch (error) {
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  return (
    <div className="profile-page">
      <div className="container">
        <h1>My Profile</h1>

        {success && <div className="alert alert-success">{success}</div>}

        <div className="profile-card">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Name (Optional)</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your name"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="form-input disabled"
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

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
