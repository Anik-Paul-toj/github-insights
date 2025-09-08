import React, { useEffect, useMemo, useState } from 'react';
import { Github, Brain, Zap, TrendingUp, Code, BarChart3 } from 'lucide-react';
import ResizableNavbar from './ResizableNavbar';
import './LandingPage.css';
import githubService from '../services/githubService';
import { useAuth } from '../context/AuthContext';
import CommitActivitySection from './CommitActivitySection';

const LandingPage = ({ onGetStarted }) => {
  const { githubUsername } = useAuth();
  const [totals, setTotals] = useState({ stars: 0, forks: 0 });
  const [scrollKey, setScrollKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!githubUsername) return;
      try {
        const repos = await githubService.getAllUserRepositories(githubUsername, 3);
        if (cancelled) return;
        const stars = repos.reduce((s, r) => s + (r.stargazers_count || 0), 0);
        const forks = repos.reduce((s, r) => s + (r.forks_count || 0), 0);
        setTotals({ stars, forks });
      } catch {}
    };
    load();
    return () => { cancelled = true; };
  }, [githubUsername]);

  return (
    <div className="landing-page">
      <ResizableNavbar onGetStarted={onGetStarted} />
      <div className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              <Github className="hero-icon" />
              GitHub Repository Insights
            </h1>
            <p className="hero-subtitle">
              Unlock powerful insights into any GitHub repository with AI-driven analysis, 
              interactive visualizations, and comprehensive metrics.
            </p>
            <div className="hero-features">
              <div className="feature">
                <BarChart3 className="feature-icon" />
                <span>Interactive Charts</span>
              </div>
              <div className="feature">
                <Brain className="feature-icon" />
                <span>AI Analysis</span>
              </div>
              <div className="feature">
                <TrendingUp className="feature-icon" />
                <span>Activity Tracking</span>
              </div>
            </div>
            <button className="cta-button" onClick={onGetStarted}>
              <Zap className="button-icon" />
              Get Started
            </button>
          </div>
          <div className="hero-visual">
            <div className="dashboard-preview">
              <div className="preview-header">
                <div className="preview-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className="preview-title">Repository Dashboard</span>
              </div>
              <div className="preview-content">
                <div className="preview-stats">
                  <div className="stat-card">
                    <Code className="stat-icon" />
                    <div className="stat-info">
                      <span className="stat-number">{new Intl.NumberFormat('en', { notation: 'compact' }).format(totals.stars)}</span>
                      <span className="stat-label">Stars</span>
                    </div>
                  </div>
                  <div className="stat-card">
                    <Github className="stat-icon" />
                    <div className="stat-info">
                      <span className="stat-number">{new Intl.NumberFormat('en', { notation: 'compact' }).format(totals.forks)}</span>
                      <span className="stat-label">Forks</span>
                    </div>
                  </div>
                </div>
                <div className="preview-chart">
                  <div className="chart-placeholder" onClick={() => {
                    const el = document.getElementById('commit-activity');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    } else {
                      // force render attempt if not mounted yet
                      setScrollKey(k => k + 1);
                      setTimeout(() => {
                        const el2 = document.getElementById('commit-activity');
                        if (el2) el2.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 100);
                    }
                  }} style={{ cursor: 'pointer' }}>
                    <TrendingUp className="chart-icon" />
                    <span>Commit Activity</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CommitActivitySection key={scrollKey} githubUsername={githubUsername} />

      <div id="features" className="features-section">
        <div className="container">
          <h2 className="section-title">Powerful Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <BarChart3 className="feature-card-icon" />
              </div>
              <h3>Interactive Visualizations</h3>
              <p>Beautiful charts showing language composition, commit activity, and repository statistics with real-time data.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Brain className="feature-card-icon" />
              </div>
              <h3>AI-Powered Insights</h3>
              <p>Get intelligent analysis of repository patterns, technology choices, and contribution dynamics using advanced AI.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Github className="feature-card-icon" />
              </div>
              <h3>Real-Time Data</h3>
              <p>Access live GitHub repository data including stars, forks, issues, and detailed contributor information.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <TrendingUp className="feature-card-icon" />
              </div>
              <h3>Activity Tracking</h3>
              <p>Monitor commit patterns, collaboration health, and project momentum with comprehensive timeline views.</p>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default LandingPage;
