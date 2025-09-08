import React from 'react';
import { Brain, Code, Users, AlertTriangle, RefreshCw } from 'lucide-react';
import '../css/AIInsights.css';

const AIInsights = ({ insights, loading, error, onRetry }) => {
  const isRateLimit = error && (
    error.includes('rate limit') || 
    error.includes('quota') || 
    error.includes('429')
  );

  if (error) {
    return (
      <div className="ai-insights">
        <h3>AI-Generated Insights</h3>
        <div className="error-message">
          <AlertTriangle size={20} />
          <div>
            <div>Failed to generate AI insights: {error}</div>
            {isRateLimit && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', opacity: 0.8 }}>
                💡 Tip: The Cohere API has limited requests per minute. 
                Wait a moment and try again, or consider upgrading your API plan.
              </div>
            )}
            {onRetry && (
              <button 
                onClick={onRetry}
                style={{
                  marginTop: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: '#0366d6',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                <RefreshCw size={16} />
                Retry AI Analysis
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="ai-insights">
        <h3>AI-Generated Insights</h3>
        <div className="insights-grid">
          <div className="insight-card loading">
            <div className="insight-header">
              <Brain className="insight-icon" />
              <h4>Repository Summary</h4>
            </div>
            <div className="loading-skeleton"></div>
            <p style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.5rem' }}>
              Analyzing repository purpose and features...
            </p>
          </div>
          
          <div className="insight-card loading">
            <div className="insight-header">
              <Code className="insight-icon" />
              <h4>Language Analysis</h4>
            </div>
            <div className="loading-skeleton"></div>
            <p style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.5rem' }}>
              Evaluating technology stack...
            </p>
          </div>
          
          <div className="insight-card loading">
            <div className="insight-header">
              <Users className="insight-icon" />
              <h4>Contribution Patterns</h4>
            </div>
            <div className="loading-skeleton"></div>
            <p style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.5rem' }}>
              Examining collaboration patterns...
            </p>
          </div>
        </div>
        <p style={{ textAlign: 'center', marginTop: '1rem', opacity: 0.8, fontSize: '0.9rem' }}>
          🤖 Generating insights sequentially to respect API rate limits...
        </p>
      </div>
    );
  }

  if (!insights) {
    return null;
  }

  return (
    <div className="ai-insights">
      <h3>AI-Generated Insights</h3>
      <p className="insights-subtitle">
        Powered by Cohere AI - Deep analysis of repository patterns and characteristics
      </p>
      
      <div className="insights-grid">
        {insights.repositorySummary && (
          <div className="insight-card">
            <div className="insight-header">
              <Brain className="insight-icon" />
              <h4>Repository Summary</h4>
            </div>
            <div className="insight-content">
              {insights.repositorySummary.split('\n').map((line, index) => (
                line.trim() && (
                  <div key={index} className="insight-point">
                    {line.trim().startsWith('•') || line.trim().startsWith('-') ? (
                      <span className="bullet-point">{line.trim()}</span>
                    ) : (
                      <span className="bullet-point">• {line.trim()}</span>
                    )}
                  </div>
                )
              ))}
            </div>
          </div>
        )}
        
        {insights.languageAnalysis && (
          <div className="insight-card">
            <div className="insight-header">
              <Code className="insight-icon" />
              <h4>Technology Stack Analysis</h4>
            </div>
            <div className="insight-content">
              {insights.languageAnalysis.split('\n').map((line, index) => (
                line.trim() && (
                  <div key={index} className="insight-point">
                    {line.trim().startsWith('•') || line.trim().startsWith('-') ? (
                      <span className="bullet-point">{line.trim()}</span>
                    ) : (
                      <span className="bullet-point">• {line.trim()}</span>
                    )}
                  </div>
                )
              ))}
            </div>
          </div>
        )}
        
        {insights.contributionAnalysis && (
          <div className="insight-card">
            <div className="insight-header">
              <Users className="insight-icon" />
              <h4>Collaboration Patterns</h4>
            </div>
            <div className="insight-content">
              {insights.contributionAnalysis.split('\n').map((line, index) => (
                line.trim() && (
                  <div key={index} className="insight-point">
                    {line.trim().startsWith('•') || line.trim().startsWith('-') ? (
                      <span className="bullet-point">{line.trim()}</span>
                    ) : (
                      <span className="bullet-point">• {line.trim()}</span>
                    )}
                  </div>
                )
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsights;
