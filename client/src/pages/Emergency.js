import React, { useState, useEffect } from 'react';
import { FiPhone, FiMail } from 'react-icons/fi';
import './Emergency.css';

const Emergency = () => {
  const [contacts] = useState([
    {
      name: 'KIRAN Helpline',
      phone: '9152987821',
      type: 'national',
      description: 'National Mental Health Helpline - 24/7 Support'
    },
    {
      name: 'Campus Helpline',
      phone: 'YOUR_CAMPUS_PHONE',
      type: 'campus',
      description: 'College Campus Emergency Helpline'
    }
  ]);

  const handleCall = (phone) => {
    if (phone && phone !== 'YOUR_CAMPUS_PHONE') {
      window.location.href = `tel:${phone}`;
    } else {
      alert('Please contact your college administration for the campus helpline number.');
    }
  };

  return (
    <div className="emergency-page">
      <div className="container">
        <div className="emergency-header">
          <h1>Emergency Helplines</h1>
          <p className="subtitle">If you're in crisis or need immediate help, please reach out</p>
        </div>

        <div className="emergency-cards">
          {contacts.map((contact, index) => (
            <div key={index} className="emergency-card">
              <div className="emergency-icon">
                <FiPhone />
              </div>
              <h2>{contact.name}</h2>
              <p className="emergency-description">{contact.description}</p>
              <div className="emergency-phone">
                <strong>{contact.phone}</strong>
              </div>
              <button
                className="btn btn-danger btn-large"
                onClick={() => handleCall(contact.phone)}
              >
                <FiPhone /> Call Now
              </button>
            </div>
          ))}
        </div>

        <div className="emergency-info">
          <h2>Remember</h2>
          <ul>
            <li>These helplines are available 24/7</li>
            <li>All conversations are confidential</li>
            <li>You're not alone - help is available</li>
            <li>In case of immediate danger, call your local emergency services</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Emergency;
