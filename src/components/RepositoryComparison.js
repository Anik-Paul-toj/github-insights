import React, { useState, useEffect } from 'react';
import { GitCompare, Star, GitFork, Eye, Calendar, Code, Shield, RefreshCw, ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import comparisonService from '../services/comparisonService';
import githubService from '../services/githubService';
import aiService from '../services/aiService';
import './RepositoryComparison.css';

const RepositoryComparison = ({ repoData, onError }) => {
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [userRepos, setUserRepos] = useState([]);
  const [userRepoSel, setUserRepoSel] = useState('');
  const [userLoading, setUserLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [aiSuggestionsLoading, setAiSuggestionsLoading] = useState(false);
  const [enableRandomComparison, setEnableRandomComparison] = useState(true);

  const fetchComparison = async () => {
    if (!repoData || !enableRandomComparison) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const randomRepo = await comparisonService.getRandomSimilarRepository(repoData);
      const comparisonData = await comparisonService.getDetailedComparison(repoData, randomRepo);
      
      // Add domain information to the comparison
      const domain = comparisonService.identifyRepositoryDomain(repoData);
      comparisonData.domain = domain;
      
      setComparison(comparisonData);
      
      // Generate AI suggestions after comparison is loaded
      generateAISuggestions(repoData, randomRepo, comparisonData);
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch comparison data';
      setError(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const generateAISuggestions = async (yourRepo, comparedRepo, comparisonData) => {
    setAiSuggestionsLoading(true);
    try {
      const suggestions = await aiService.generateComparisonSuggestions(yourRepo, comparedRepo, comparisonData);
      setAiSuggestions(suggestions);
    } catch (error) {
      console.warn('Failed to generate AI suggestions:', error.message);
    } finally {
      setAiSuggestionsLoading(false);
    }
  };

  useEffect(() => {
    fetchComparison();
  }, [repoData, enableRandomComparison]);

  const handleRefresh = () => {
    setAiSuggestions(null);
    if (enableRandomComparison) {
      fetchComparison();
    }
  };

  const handleToggleRandomComparison = () => {
    const newValue = !enableRandomComparison;
    setEnableRandomComparison(newValue);
    
    if (!newValue) {
      // If disabling, clear the current comparison
      setComparison(null);
      setAiSuggestions(null);
    }
  };

  const handleLoadUserRepos = async () => {
    const raw = userInput.trim();
    let username = raw;
    // Support pasted repo URLs like https://github.com/owner/name
    const urlMatch = raw.match(/^https?:\/\/github\.com\/([^\/#?\s]+)(?:\/([^\/#?\s]+))?/i);
    let presetFullName = '';
    if (urlMatch) {
      username = urlMatch[1];
      if (urlMatch[2]) presetFullName = `${urlMatch[1]}/${urlMatch[2]}`;
    }
    if (!username) return;
    setUserLoading(true);
    setError(null);
    try {
      const repos = await githubService.getAnyOwnerRepositories(username, 1, 100);
      // sort by stars, exclude forks to focus on originals
      const sorted = (repos || []).filter(r => !r.fork).sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0));
      setUserRepos(sorted);
      if (presetFullName && sorted.some(r => r.full_name === presetFullName)) {
        setUserRepoSel(presetFullName);
      } else {
        setUserRepoSel(sorted[0]?.full_name || '');
      }
    } catch (e) {
      setError(e?.message || 'Failed to load user repositories');
    } finally {
      setUserLoading(false);
    }
  };

  const handleCompareWithSelected = async () => {
    const full = userRepoSel;
    if (!full) return;
    setLoading(true);
    setError(null);
    try {
      const [owner, name] = full.split('/');
      const otherRepo = await githubService.getRepository(owner, name);
      const comparisonData = await comparisonService.getDetailedComparison(repoData, otherRepo);
      const domain = comparisonService.identifyRepositoryDomain(repoData);
      comparisonData.domain = domain;
      setComparison(comparisonData);
      
      // Generate AI suggestions for this comparison too
      generateAISuggestions(repoData, otherRepo, comparisonData);
    } catch (e) {
      setError(e?.message || 'Comparison failed');
    } finally {
      setLoading(false);
    }
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
          <div className="header-content">
            <h3>
              <GitCompare size={20} />
              Repository Comparison
            </h3>
          </div>
          <div className="header-controls">
            <div className="toggle-container">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={enableRandomComparison}
                  onChange={handleToggleRandomComparison}
                  className="toggle-checkbox"
                />
                <span className="toggle-slider"></span>
                <span className="toggle-text">Auto-compare with similar repos</span>
              </label>
            </div>
            <button className="refresh-button" onClick={handleRefresh} disabled>
              <RefreshCw size={16} className="spinning" />
            </button>
          </div>
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
          <div className="header-content">
            <h3>
              <GitCompare size={20} />
              Repository Comparison
            </h3>
          </div>
          <div className="header-controls">
            <div className="toggle-container">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={enableRandomComparison}
                  onChange={handleToggleRandomComparison}
                  className="toggle-checkbox"
                />
                <span className="toggle-slider"></span>
                <span className="toggle-text">Auto-compare with similar repos</span>
              </label>
            </div>
            <button className="refresh-button" onClick={handleRefresh} disabled={!enableRandomComparison}>
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
        <div className="comparison-error">
          <p>Error: {error}</p>
          <button className="retry-button" onClick={handleRefresh} disabled={!enableRandomComparison}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!comparison && !enableRandomComparison) {
    return (
      <div className="comparison-container">
        <div className="comparison-header">
          <div className="header-content">
            <h3>
              <GitCompare size={20} />
              Repository Comparison
            </h3>
          </div>
          <div className="header-controls">
            <div className="toggle-container">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={enableRandomComparison}
                  onChange={handleToggleRandomComparison}
                  className="toggle-checkbox"
                />
                <span className="toggle-slider"></span>
                <span className="toggle-text">Auto-compare with similar repos</span>
              </label>
            </div>
            <button className="refresh-button" onClick={handleRefresh} disabled={!enableRandomComparison}>
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Custom user comparison section when auto-compare is disabled */}
        <div className="custom-compare">
          <div className="comparison-disabled-message">
            <h4>Manual Repository Comparison</h4>
            <p>Auto-comparison is disabled. Use the form below to manually compare with any repository.</p>
          </div>
          <div className="row">
            <input
              type="text"
              placeholder="GitHub username to compare"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="user-input"
            />
            <button onClick={handleLoadUserRepos} className="load-button" disabled={userLoading}>
              {userLoading ? 'Loading…' : 'Load Repos'}
            </button>
          </div>
          {userRepos.length > 0 && (
            <div className="row">
              <select value={userRepoSel} onChange={(e) => setUserRepoSel(e.target.value)} className="repo-select">
                {userRepos.slice(0, 20).map(r => (
                  <option key={r.full_name} value={r.full_name}>{r.full_name} ★{r.stargazers_count}</option>
                ))}
              </select>
              <button onClick={handleCompareWithSelected} className="compare-button">Compare Selected</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!comparison) {
    return null;
  }

  const { repository1, repository2, comparison: comp, winner } = comparison;

  const buildSuggestions = (yourQuality, comparedRepo) => {
    if (!yourQuality || !comparedRepo) return [];
    const suggestions = [];
    const comparedQuality = comparedRepo.quality;
    
    // Base suggestions on what the compared repository has that yours doesn't
    if (comparedQuality) {
      // Prioritize suggestions based on score differences
      const categoryGaps = [];
      
      // Calculate gaps in each category
      if (comparedQuality.scalability.score > yourQuality.scalability.score) {
        categoryGaps.push({ 
          category: 'scalability', 
          gap: comparedQuality.scalability.score - yourQuality.scalability.score,
          signals: comparedQuality.scalability.signals 
        });
      }
      if (comparedQuality.security.score > yourQuality.security.score) {
        categoryGaps.push({ 
          category: 'security', 
          gap: comparedQuality.security.score - yourQuality.security.score,
          signals: comparedQuality.security.signals 
        });
      }
      if (comparedQuality.structure.score > yourQuality.structure.score) {
        categoryGaps.push({ 
          category: 'structure', 
          gap: comparedQuality.structure.score - yourQuality.structure.score,
          signals: comparedQuality.structure.signals 
        });
      }
      if (comparedQuality.management.score > yourQuality.management.score) {
        categoryGaps.push({ 
          category: 'management', 
          gap: comparedQuality.management.score - yourQuality.management.score,
          signals: comparedQuality.management.signals 
        });
      }
      
      // Sort by gap size (prioritize biggest improvements)
      categoryGaps.sort((a, b) => b.gap - a.gap);
      
      // Generate suggestions for the biggest gaps first
      categoryGaps.forEach(({ category, signals }) => {
        if (category === 'scalability') {
          if (!yourQuality.scalability.signals.ci && signals.ci) {
            suggestions.push(`Add CI workflows to run tests and lint on PRs (like ${comparedRepo.name}).`);
          }
          if (!yourQuality.scalability.signals.docker && signals.docker) {
            suggestions.push(`Provide Dockerfile/Compose for reproducible deployments (similar to ${comparedRepo.name}).`);
          }
          if (!yourQuality.scalability.signals.kubernetes && signals.kubernetes) {
            suggestions.push(`Include Kubernetes/Helm manifests for scalable ops (like ${comparedRepo.name}).`);
          }
        } else if (category === 'security') {
          if (!yourQuality.security.signals.codeql && signals.codeql) {
            suggestions.push(`Enable CodeQL security scanning (following ${comparedRepo.name}'s approach).`);
          }
          if (!yourQuality.security.signals.dependabot && signals.dependabot) {
            suggestions.push(`Configure Dependabot for dependency updates (like ${comparedRepo.name}).`);
          }
          if (!yourQuality.security.signals.securityPolicy && signals.securityPolicy) {
            suggestions.push(`Add SECURITY.md for vulnerability reporting (similar to ${comparedRepo.name}).`);
          }
        } else if (category === 'structure') {
          if (!yourQuality.structure.signals.tests && signals.tests) {
            suggestions.push(`Add automated tests and testing framework (following ${comparedRepo.name}'s pattern).`);
          }
          if (!yourQuality.structure.signals.lint && signals.lint) {
            suggestions.push(`Add code linting and formatting tools (like ${comparedRepo.name}).`);
          }
          if (!yourQuality.structure.signals.typescript && signals.typescript) {
            suggestions.push(`Consider TypeScript for better type safety (similar to ${comparedRepo.name}).`);
          }
        } else if (category === 'management') {
          if (!yourQuality.management.signals.contributing && signals.contributing) {
            suggestions.push(`Add CONTRIBUTING.md to guide contributors (following ${comparedRepo.name}'s example).`);
          }
          if (!yourQuality.management.signals.issueTemplates && signals.issueTemplates) {
            suggestions.push(`Provide issue templates for better bug reports (like ${comparedRepo.name}).`);
          }
          if (!yourQuality.management.signals.prTemplate && signals.prTemplate) {
            suggestions.push(`Add a pull request template (similar to ${comparedRepo.name}).`);
          }
          if (!yourQuality.management.signals.changelog && signals.changelog) {
            suggestions.push(`Maintain a CHANGELOG.md for releases (like ${comparedRepo.name}).`);
          }
        }
      });
      
      // Add repository-specific suggestions based on stats comparison
      if (comparedRepo.stars > repoData.stargazers_count * 2) {
        suggestions.push(`Focus on documentation and examples to increase community adoption (${comparedRepo.name} has ${formatNumber(comparedRepo.stars)} stars).`);
      }
      
      if (comparedRepo.forks > repoData.forks_count * 2) {
        suggestions.push(`Make your project more fork-friendly with clear setup instructions (${comparedRepo.name} has ${formatNumber(comparedRepo.forks)} forks).`);
      }
    }
    
    // If no comparison-based suggestions, fall back to general ones for missing features
    if (suggestions.length === 0) {
      if (!yourQuality.scalability.signals.ci) suggestions.push('Add CI workflows to run tests and lint on PRs.');
      if (!yourQuality.scalability.signals.docker) suggestions.push('Provide Dockerfile/Compose for reproducible deployments.');
      if (!yourQuality.security.signals.dependabot) suggestions.push('Configure Dependabot for dependency updates.');
      if (!yourQuality.structure.signals.tests) suggestions.push('Add automated tests and a testing framework.');
      if (!yourQuality.management.signals.contributing) suggestions.push('Add CONTRIBUTING.md to guide contributors.');
    }
    
    return suggestions.slice(0, 5);
  };

  const buildBasicSuggestions = (yourRepo, comparedRepo) => {
    const suggestions = [];
    
    // Compare basic metrics
    if (comparedRepo.stars > yourRepo.stars * 2) {
      suggestions.push(`Improve documentation and README to increase visibility (${comparedRepo.name} has ${formatNumber(comparedRepo.stars)} stars vs your ${formatNumber(yourRepo.stars)}).`);
    }
    
    if (comparedRepo.forks > yourRepo.forks * 2) {
      suggestions.push(`Make your project more contributor-friendly with clear setup instructions (${comparedRepo.name} has ${formatNumber(comparedRepo.forks)} forks vs your ${formatNumber(yourRepo.forks)}).`);
    }
    
    // Language-specific suggestions
    if (yourRepo.language && yourRepo.language === comparedRepo.language) {
      suggestions.push(`Consider adopting similar ${yourRepo.language} best practices as ${comparedRepo.name}.`);
    }
    
    // Topic suggestions
    if (comparedRepo.topics && comparedRepo.topics.length > 0) {
      const relevantTopics = comparedRepo.topics.slice(0, 3).join(', ');
      suggestions.push(`Add relevant topics to improve discoverability (${comparedRepo.name} uses: ${relevantTopics}).`);
    }
    
    // General suggestions
    suggestions.push(`Study ${comparedRepo.name}'s repository structure and documentation approach.`);
    suggestions.push(`Consider implementing similar features that make ${comparedRepo.name} successful.`);
    
    return suggestions.slice(0, 4);
  };

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
        <div className="header-controls">
          <div className="toggle-container">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={enableRandomComparison}
                onChange={handleToggleRandomComparison}
                className="toggle-checkbox"
              />
              <span className="toggle-slider"></span>
              <span className="toggle-text">Auto-compare with similar repos</span>
            </label>
          </div>
          <button className="refresh-button" onClick={handleRefresh} disabled={!enableRandomComparison}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Custom user comparison */}
      <div className="custom-compare">
        <div className="custom-compare-header">
          <h4>Compare with Specific Repository</h4>
          <p>Want to compare with a different repository? Search for any GitHub user or organization below.</p>
          {enableRandomComparison && (
            <div className="auto-compare-notice">
              <small>Auto-comparison is enabled. This will replace the current random comparison.</small>
            </div>
          )}
        </div>
        <div className="row">
          <input
            type="text"
            placeholder="GitHub username or organization"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            className="user-input"
          />
          <button onClick={handleLoadUserRepos} className="load-button" disabled={userLoading}>
            {userLoading ? 'Loading…' : 'Load Repos'}
          </button>
        </div>
        {userRepos.length > 0 && (
          <div className="row">
            <select value={userRepoSel} onChange={(e) => setUserRepoSel(e.target.value)} className="repo-select">
              {userRepos.slice(0, 20).map(r => (
                <option key={r.full_name} value={r.full_name}>{r.full_name} ★{r.stargazers_count}</option>
              ))}
            </select>
            <button onClick={handleCompareWithSelected} className="compare-button">Compare Selected</button>
          </div>
        )}
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
          {(repository1.quality || repository2.quality) && (
            <div className="quality-section">
              <h4>Engineering Quality</h4>
              <div className="quality-grid">
                {[{label: 'Scalability', key: 'scalability'}, {label: 'Security', key: 'security'}, {label: 'Structure', key: 'structure'}, {label: 'Management', key: 'management'}].map(cat => (
                  <div key={cat.key} className="quality-card">
                    <div className="quality-header">{cat.label}</div>
                    <div className="quality-scores">
                      <div>
                        <div className="repo-tag">You</div>
                        <div className="score">{repository1.quality ? repository1.quality[cat.key].score : 0}</div>
                      </div>
                      <div>
                        <div className="repo-tag">Other</div>
                        <div className="score alt">{repository2.quality ? repository2.quality[cat.key].score : 0}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Suggestions for your repo */}
              {(repository1.quality || repository2) && (
                <div className="suggestions">
                  <div className="suggestions-title">Suggestions to improve your repo</div>
                  <div className="suggestions-subtitle">Based on comparison with {repository2.name}</div>
                  
                  {/* AI Suggestions */}
                  {aiSuggestionsLoading && (
                    <div className="ai-suggestions-loading">
                      <div className="loading-text">Generating AI-powered suggestions...</div>
                    </div>
                  )}
                  
                  {aiSuggestions && aiSuggestions.length > 0 && (
                    <div className="ai-suggestions-section">
                      <div className="section-header">AI-Powered Suggestions</div>
                      <ul className="ai-suggestions">
                        {aiSuggestions.map((suggestion, i) => (
                          <li key={i}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Rule-based suggestions */}
                  {repository1.quality && (
                    <div className="rule-suggestions-section">
                      <div className="section-header">Quick Wins</div>
                      <ul className="rule-suggestions">
                        {buildSuggestions(repository1.quality, repository2).map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Basic suggestions when no quality data available */}
                  {!repository1.quality && !aiSuggestions && !aiSuggestionsLoading && (
                    <div className="basic-suggestions-section">
                      <div className="section-header">General Suggestions</div>
                      <ul className="basic-suggestions">
                        {buildBasicSuggestions(repository1, repository2).map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RepositoryComparison;
