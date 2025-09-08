import React from 'react';
import { X, Star, GitFork, Eye, ExternalLink } from 'lucide-react';
import '../css/RepositoryModal.css';

const RepositoryModal = ({ repository, isOpen, onClose, onViewInsights }) => {
  if (!isOpen || !repository) return null;

  const handleViewInsights = () => {
    onViewInsights(repository.owner.login, repository.name);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{repository.name}</h2>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="repo-details">
            <div className="repo-owner">
              <img 
                src={repository.owner.avatar_url} 
                alt={repository.owner.login}
                className="owner-avatar"
              />
              <span className="owner-name">{repository.owner.login}</span>
            </div>

            <div className="repo-description">
              <h3>Description</h3>
              <p>{repository.description || 'No description available'}</p>
            </div>

            <div className="repo-stats-detailed">
              <div className="stat-item">
                <Star size={20} />
                <div>
                  <span className="stat-number">{repository.stargazers_count}</span>
                  <span className="stat-label">Stars</span>
                </div>
              </div>
              <div className="stat-item">
                <GitFork size={20} />
                <div>
                  <span className="stat-number">{repository.forks_count}</span>
                  <span className="stat-label">Forks</span>
                </div>
              </div>
              <div className="stat-item">
                <Eye size={20} />
                <div>
                  <span className="stat-number">{repository.watchers_count}</span>
                  <span className="stat-label">Watchers</span>
                </div>
              </div>
            </div>

            <div className="repo-metadata">
              {repository.language && (
                <div className="metadata-item">
                  <span className="label">Primary Language:</span>
                  <span className="value">{repository.language}</span>
                </div>
              )}
              <div className="metadata-item">
                <span className="label">Created:</span>
                <span className="value">{new Date(repository.created_at).toLocaleDateString()}</span>
              </div>
              <div className="metadata-item">
                <span className="label">Last Updated:</span>
                <span className="value">{new Date(repository.updated_at).toLocaleDateString()}</span>
              </div>
              <div className="metadata-item">
                <span className="label">Size:</span>
                <span className="value">{(repository.size / 1024).toFixed(1)} MB</span>
              </div>
              {repository.license && (
                <div className="metadata-item">
                  <span className="label">License:</span>
                  <span className="value">{repository.license.name}</span>
                </div>
              )}
            </div>

            {repository.topics && repository.topics.length > 0 && (
              <div className="repo-topics">
                <h4>Topics</h4>
                <div className="topics-list">
                  {repository.topics.map((topic, index) => (
                    <span key={index} className="topic-tag">{topic}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <a 
            href={repository.html_url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="github-link"
          >
            <ExternalLink size={18} />
            View on GitHub
          </a>
          <button 
            className="view-insights-button" 
            onClick={handleViewInsights}
          >
            View Insights
          </button>
        </div>
      </div>
    </div>
  );
};

export default RepositoryModal;
