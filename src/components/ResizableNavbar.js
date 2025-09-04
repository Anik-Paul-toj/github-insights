import React, { useState, useEffect } from 'react';
import { Menu, X, Github, Zap } from 'lucide-react';
import './ResizableNavbar.css';

const ResizableNavbar = ({ onGetStarted }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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
    },
    {
      name: "About",
      link: "#about",
    },
    {
      name: "Contact",
      link: "#contact",
    },
  ];

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
                className="nav-item"
              >
                {item.name}
              </a>
            ))}
          </div>
          
          <div className="navbar-actions">
            <button className="navbar-button secondary">
              <Zap size={16} />
              Demo
            </button>
            <button 
              className="navbar-button primary"
              onClick={onGetStarted}
            >
              Get Started
            </button>
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
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="mobile-nav-item"
                >
                  {item.name}
                </a>
              ))}
              <div className="mobile-nav-actions">
                <button 
                  className="navbar-button secondary mobile"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Zap size={16} />
                  Demo
                </button>
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
