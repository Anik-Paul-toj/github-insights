import React, { useState, useEffect } from 'react';
import { Menu, X, Github } from 'lucide-react';
import './ResizableNavbar.css';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ResizableNavbar = ({ onGetStarted }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, githubUsername, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    {
      name: "Features",
      link: "#features",
    }
  ];

  const handleScrollTo = (selector) => (e) => {
    if (!selector.startsWith('#')) return;
    const el = document.querySelector(selector);
    if (el) {
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className={`resizable-navbar ${isScrolled ? 'scrolled' : ''}`}>
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        {/* Desktop Navigation */}
        <div className="navbar-body">
          <div className="navbar-logo">
            <Github className="logo-icon" />
            <span className="logo-text">GitHub Insights</span>
          </div>
          
          <div className="navbar-items">
            {navItems.map((item, idx) => (
              <a
                key={`nav-link-${idx}`}
                href={item.link}
                onClick={handleScrollTo(item.link)}
                className="nav-item"
              >
                {item.name}
              </a>
            ))}
            <a href="#commit-activity" onClick={handleScrollTo('#commit-activity')} className="nav-item">Commit Activity</a>
          </div>
          
          <div className="navbar-actions">
            {user ? (
              <>
                <span className="nav-item">{githubUsername}</span>
                <button className="navbar-button" onClick={() => logout()}>Logout</button>
              </>
            ) : (
              <>
                <button className="navbar-button" onClick={() => navigate('/login')}>Login</button>
                <button className="navbar-button primary" onClick={() => navigate('/signup')}>Sign Up</button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="mobile-nav">
          <div className="mobile-nav-header">
            <div className="navbar-logo">
              <Github className="logo-icon" />
              <span className="logo-text">GitHub Insights</span>
            </div>
            <button
              className="mobile-nav-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {isMobileMenuOpen && (
            <div className="mobile-nav-menu">
              {navItems.map((item, idx) => (
                <a
                  key={`mobile-link-${idx}`}
                  href={item.link}
                  onClick={(e) => { handleScrollTo(item.link)(e); setIsMobileMenuOpen(false); }}
                  className="mobile-nav-item"
                >
                  {item.name}
                </a>
              ))}
              <a
                href="#commit-activity"
                onClick={(e) => { handleScrollTo('#commit-activity')(e); setIsMobileMenuOpen(false); }}
                className="mobile-nav-item"
              >
                Commit Activity
              </a>
              <div className="mobile-nav-actions">
                <button 
                  className="navbar-button primary mobile"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onGetStarted();
                  }}
                >
                  Get Started
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
};

export default ResizableNavbar;
