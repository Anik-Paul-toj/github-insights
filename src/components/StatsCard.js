import React from 'react';
import { Star, GitFork, AlertCircle, Scale, ExternalLink } from 'lucide-react';
import './StatsCard.css';

const StatsCard = ({ repoData }) => {
  if (!repoData) return null;

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="stats-card">
      <div className="repo-header">
        <h2 className="repo-title">
          <a href={repoData.html_url} target="_blank" rel="noopener noreferrer">
            {repoData.full_name}
            <ExternalLink size={20} />
          </a>
        </h2>
        {repoData.description && (
          <p className="repo-description">{repoData.description}</p>
        )}
      </div>

      <div className="stats-grid">
        <div className="stat-item">
          <Star className="stat-icon" />
          <div className="stat-content">
            <span className="stat-value">{formatNumber(repoData.stargazers_count)}</span>
            <span className="stat-label">Stars</span>
          </div>
        </div>

        <div className="stat-item">
          <GitFork className="stat-icon" />
          <div className="stat-content">
            <span className="stat-value">{formatNumber(repoData.forks_count)}</span>
            <span className="stat-label">Forks</span>
          </div>
        </div>

        <div className="stat-item">
          <AlertCircle className="stat-icon" />
          <div className="stat-content">
            <span className="stat-value">{formatNumber(repoData.open_issues_count)}</span>
            <span className="stat-label">Open Issues</span>
          </div>
        </div>

        <div className="stat-item">
          <Scale className="stat-icon" />
          <div className="stat-content">
            <span className="stat-value">{repoData.license?.name || 'No License'}</span>
            <span className="stat-label">License</span>
          </div>
        </div>
      </div>

      <div className="repo-meta">
        <div className="meta-item">
          <strong>Language:</strong> {repoData.language || 'Not specified'}
        </div>
        <div className="meta-item">
          <strong>Created:</strong> {formatDate(repoData.created_at)}
        </div>
        <div className="meta-item">
          <strong>Updated:</strong> {formatDate(repoData.updated_at)}
        </div>
        <div className="meta-item">
          <strong>Size:</strong> {formatNumber(repoData.size)} KB
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
