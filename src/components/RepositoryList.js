import React from 'react';
import { Star, GitFork, Eye } from 'lucide-react';
import './RepositoryList.css';

const RepositoryList = ({ repositories, loading, onRepositorySelect }) => {
  if (loading) {
    return (
      <div className="repository-list loading">
        <div className="loading-spinner">Loading repositories...</div>
      </div>
    );
  }

  if (!repositories || repositories.length === 0) {
    return (
      <div className="repository-list empty">
        <p>No repositories found for this user.</p>
      </div>
    );
  }

  return (
    <div className="repository-list">
      <h2>Select a Repository</h2>
      <div className="repositories-grid">
        {repositories.map((repo) => (
          <div 
            key={repo.id} 
            className="repository-card"
            onClick={() => onRepositorySelect(repo)}
          >
            <div className="repo-header">
              <h3 className="repo-name">{repo.name}</h3>
              {repo.private && <span className="private-badge">Private</span>}
            </div>
            
            <p className="repo-description">
              {repo.description || 'No description available'}
            </p>
            
            <div className="repo-stats">
              <div className="stat">
                <Star size={16} />
                <span>{repo.stargazers_count}</span>
              </div>
              <div className="stat">
                <GitFork size={16} />
                <span>{repo.forks_count}</span>
              </div>
              <div className="stat">
                <Eye size={16} />
                <span>{repo.watchers_count}</span>
              </div>
            </div>
            
            {repo.language && (
              <div className="repo-language">
                <span className="language-dot" style={{backgroundColor: getLanguageColor(repo.language)}}></span>
                {repo.language}
              </div>
            )}
            
            <div className="repo-updated">
              Updated {new Date(repo.updated_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Simple language color mapping
const getLanguageColor = (language) => {
  const colors = {
    JavaScript: '#f1e05a',
    TypeScript: '#2b7489',
    Python: '#3572A5',
    Java: '#b07219',
    HTML: '#e34c26',
    CSS: '#563d7c',
    React: '#61dafb',
    Vue: '#4FC08D',
    PHP: '#4F5D95',
    Ruby: '#701516',
    Go: '#00ADD8',
    Rust: '#dea584',
    Swift: '#ffac45',
    Kotlin: '#F18E33',
    C: '#555555',
    'C++': '#f34b7d',
    'C#': '#239120',
  };
  return colors[language] || '#586069';
};

export default RepositoryList;
