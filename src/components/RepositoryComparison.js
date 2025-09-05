import React, { useState, useEffect } from 'react';
import { GitCompare, Star, GitFork, Eye, Calendar, Code, Shield, RefreshCw, ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import comparisonService from '../services/comparisonService';
import './RepositoryComparison.css';

const RepositoryComparison = ({ repoData, onError }) => {
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchComparison = async () => {
    if (!repoData) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const randomRepo = await comparisonService.getRandomSimilarRepository(repoData);
      const comparisonData = await comparisonService.getDetailedComparison(repoData, randomRepo);
      
      // Add domain information to the comparison
      const domain = comparisonService.identifyRepositoryDomain(repoData);
      comparisonData.domain = domain;
      
      setComparison(comparisonData);
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch comparison data';
      setError(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparison();
  }, [repoData]);

  const handleRefresh = () => {
    fetchComparison();
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDifferenceIcon = (difference) => {
    if (difference > 0) return <TrendingUp className="trend-up" />;
    if (difference < 0) return <TrendingDown className="trend-down" />;
    return <Minus className="trend-neutral" />;
  };

  const getDifferenceClass = (difference) => {
    if (difference > 0) return 'positive';
    if (difference < 0) return 'negative';
    return 'neutral';
  };

  const getWinnerClass = (isWinner) => {
    return isWinner ? 'winner' : '';
  };

  if (loading) {
    return (
      <div className="comparison-container">
        <div className="comparison-header">
          <h3>
            <GitCompare size={20} />
            Repository Comparison
          </h3>
          <button className="refresh-button" onClick={handleRefresh} disabled>
            <RefreshCw size={16} className="spinning" />
          </button>
        </div>
        <div className="comparison-loading">
          <div className="loading-spinner"></div>
          <p>Finding a similar repository to compare...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="comparison-container">
        <div className="comparison-header">
          <h3>
            <GitCompare size={20} />
            Repository Comparison
          </h3>
          <button className="refresh-button" onClick={handleRefresh}>
            <RefreshCw size={16} />
          </button>
        </div>
        <div className="comparison-error">
          <p>Error: {error}</p>
          <button className="retry-button" onClick={handleRefresh}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!comparison) {
    return null;
  }

  const { repository1, repository2, comparison: comp, winner } = comparison;

  return (
    <div className="comparison-container">
      <div className="comparison-header">
        <div className="header-content">
          <h3>
            <GitCompare size={20} />
            Repository Comparison
          </h3>
          {comparison?.domain && (
            <div className="domain-badge">
              <span className="domain-label">Domain:</span>
              <span className="domain-name">{comparison.domain.name}</span>
            </div>
          )}
        </div>
        <button className="refresh-button" onClick={handleRefresh}>
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="comparison-content">
        <div className="repositories-comparison">
          {/* Your Repository */}
          <div className={`repository-card ${getWinnerClass(winner === 'repository1')}`}>
            <div className="repo-header">
              <div className="repo-title">
                <h4>{repository1.name}</h4>
                <span className="repo-owner">by {repository1.owner}</span>
              </div>
              {winner === 'repository1' && <div className="winner-badge">Winner!</div>}
            </div>
            
            <div className="repo-stats">
              <div className="stat-row">
                <Star size={16} />
                <span className="stat-value">{formatNumber(repository1.stars)}</span>
                <span className="stat-label">Stars</span>
              </div>
              <div className="stat-row">
                <GitFork size={16} />
                <span className="stat-value">{formatNumber(repository1.forks)}</span>
                <span className="stat-label">Forks</span>
              </div>
              <div className="stat-row">
                <Eye size={16} />
                <span className="stat-value">{formatNumber(repository1.watchers)}</span>
                <span className="stat-label">Watchers</span>
              </div>
            </div>

            <div className="repo-details">
              {repository1.language && (
                <div className="detail-item">
                  <Code size={14} />
                  <span>{repository1.language}</span>
                </div>
              )}
              <div className="detail-item">
                <Calendar size={14} />
                <span>Updated {formatDate(repository1.updatedAt)}</span>
              </div>
              {repository1.license && (
                <div className="detail-item">
                  <Shield size={14} />
                  <span>{repository1.license}</span>
                </div>
              )}
            </div>

            {repository1.description && (
              <p className="repo-description">{repository1.description}</p>
            )}

            {repository1.topics.length > 0 && (
              <div className="repo-topics">
                {repository1.topics.slice(0, 3).map((topic, index) => (
                  <span key={index} className="topic-tag">{topic}</span>
                ))}
              </div>
            )}
          </div>

          {/* VS Divider */}
          <div className="vs-divider">
            <div className="vs-circle">VS</div>
          </div>

          {/* Random Similar Repository */}
          <div className={`repository-card ${getWinnerClass(winner === 'repository2')}`}>
            <div className="repo-header">
              <div className="repo-title">
                <h4>{repository2.name}</h4>
                <span className="repo-owner">by {repository2.owner}</span>
              </div>
              {winner === 'repository2' && <div className="winner-badge">Winner!</div>}
            </div>
            
            <div className="repo-stats">
              <div className="stat-row">
                <Star size={16} />
                <span className="stat-value">{formatNumber(repository2.stars)}</span>
                <span className="stat-label">Stars</span>
              </div>
              <div className="stat-row">
                <GitFork size={16} />
                <span className="stat-value">{formatNumber(repository2.forks)}</span>
                <span className="stat-label">Forks</span>
              </div>
              <div className="stat-row">
                <Eye size={16} />
                <span className="stat-value">{formatNumber(repository2.watchers)}</span>
                <span className="stat-label">Watchers</span>
              </div>
            </div>

            <div className="repo-details">
              {repository2.language && (
                <div className="detail-item">
                  <Code size={14} />
                  <span>{repository2.language}</span>
                </div>
              )}
              <div className="detail-item">
                <Calendar size={14} />
                <span>Updated {formatDate(repository2.updatedAt)}</span>
              </div>
              {repository2.license && (
                <div className="detail-item">
                  <Shield size={14} />
                  <span>{repository2.license}</span>
                </div>
              )}
            </div>

            {repository2.description && (
              <p className="repo-description">{repository2.description}</p>
            )}

            {repository2.topics.length > 0 && (
              <div className="repo-topics">
                {repository2.topics.slice(0, 3).map((topic, index) => (
                  <span key={index} className="topic-tag">{topic}</span>
                ))}
              </div>
            )}

            <a 
              href={`https://github.com/${repository2.fullName}`}
              target="_blank"
              rel="noopener noreferrer"
              className="github-link"
            >
              <ExternalLink size={14} />
              View on GitHub
            </a>
          </div>
        </div>

        {/* Comparison Metrics */}
        <div className="comparison-metrics">
          <h4>Comparison Metrics</h4>
          <div className="metrics-grid">
            <div className="metric-item">
              <div className="metric-header">
                <Star size={16} />
                <span>Stars Difference</span>
              </div>
              <div className={`metric-value ${getDifferenceClass(comp.starsDifference)}`}>
                {getDifferenceIcon(comp.starsDifference)}
                <span>{comp.starsDifference > 0 ? '+' : ''}{formatNumber(comp.starsDifference)}</span>
              </div>
            </div>

            <div className="metric-item">
              <div className="metric-header">
                <GitFork size={16} />
                <span>Forks Difference</span>
              </div>
              <div className={`metric-value ${getDifferenceClass(comp.forksDifference)}`}>
                {getDifferenceIcon(comp.forksDifference)}
                <span>{comp.forksDifference > 0 ? '+' : ''}{formatNumber(comp.forksDifference)}</span>
              </div>
            </div>

            <div className="metric-item">
              <div className="metric-header">
                <Eye size={16} />
                <span>Watchers Difference</span>
              </div>
              <div className={`metric-value ${getDifferenceClass(comp.watchersDifference)}`}>
                {getDifferenceIcon(comp.watchersDifference)}
                <span>{comp.watchersDifference > 0 ? '+' : ''}{formatNumber(comp.watchersDifference)}</span>
              </div>
            </div>

            <div className="metric-item">
              <div className="metric-header">
                <Calendar size={16} />
                <span>Last Update</span>
              </div>
              <div className={`metric-value ${getDifferenceClass(-comp.lastUpdateDifference)}`}>
                {getDifferenceIcon(-comp.lastUpdateDifference)}
                <span>{Math.abs(comp.lastUpdateDifference)} days {comp.lastUpdateDifference > 0 ? 'older' : 'newer'}</span>
              </div>
            </div>

            {comp.commonTopics.length > 0 && (
              <div className="metric-item">
                <div className="metric-header">
                  <Code size={16} />
                  <span>Common Topics</span>
                </div>
                <div className="metric-value">
                  <span>{comp.commonTopics.length} shared</span>
                </div>
              </div>
            )}

            <div className="metric-item">
              <div className="metric-header">
                <Shield size={16} />
                <span>Language Match</span>
              </div>
              <div className={`metric-value ${comp.languageMatch ? 'positive' : 'negative'}`}>
                <span>{comp.languageMatch ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RepositoryComparison;
