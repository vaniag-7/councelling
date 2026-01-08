import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  FiHome,
  FiUser,
  FiCalendar,
  FiHeart,
  FiBook,
  FiPhone,
  FiLogOut,
  FiMenu,
  FiX,
  FiGlobe
} from 'react-icons/fi';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    setLangMenuOpen(false);
  };

  const navItems = [
    { path: '/', icon: FiHome, label: t('nav.home') },
    { path: '/profile', icon: FiUser, label: t('nav.profile') },
    { path: '/appointments', icon: FiCalendar, label: t('nav.appointments') },
    { path: '/mood', icon: FiHeart, label: t('nav.mood') },
    { path: '/resources', icon: FiBook, label: t('nav.resources') },
    { path: '/emergency', icon: FiPhone, label: t('nav.emergency') }
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <FiHeart className="brand-icon" />
          <span>{t('app.name')}</span>
        </Link>

        <div className="navbar-menu">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon />
                <span className="nav-link-text">{item.label}</span>
              </Link>
            );
          })}

          <div className="nav-dropdown">
            <button
              className="nav-link"
              onClick={() => setLangMenuOpen(!langMenuOpen)}
            >
              <FiGlobe />
              <span className="nav-link-text">{i18n.language.toUpperCase()}</span>
            </button>
            {langMenuOpen && (
              <div className="dropdown-menu">
                <button onClick={() => changeLanguage('en')}>English</button>
                <button onClick={() => changeLanguage('hi')}>हिंदी</button>
                <button onClick={() => changeLanguage('ta')}>தமிழ்</button>
                <button onClick={() => changeLanguage('te')}>తెలుగు</button>
              </div>
            )}
          </div>

          <button className="nav-link logout-btn" onClick={handleLogout}>
            <FiLogOut />
            <span className="nav-link-text">{t('nav.logout')}</span>
          </button>
        </div>

        <button
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <FiX /> : <FiMenu />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="mobile-menu">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="mobile-nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <button className="mobile-nav-link" onClick={handleLogout}>
            <FiLogOut />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
