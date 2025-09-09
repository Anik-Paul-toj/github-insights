import React, { useEffect, useState } from 'react';
import LandingPage from './components/js/LandingPage';
import SearchForm from './components/js/SearchForm';
import RepositoryList from './components/js/RepositoryList';
import RepositoryModal from './components/js/RepositoryModal';
import Dashboard from './components/js/Dashboard';
import LoadingSpinner from './components/js/LoadingSpinner';
import githubService from './services/githubService';
import aiService from './services/aiService';
import './App.css';
import './responsive.css';

function App() {
  const [showDashboard, setShowDashboard] = useState(false);
  const [showRepositories, setShowRepositories] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [loading, setLoading] = useState(false);
  const [repositories, setRepositories] = useState([]);
  const [selectedRepository, setSelectedRepository] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [repoData, setRepoData] = useState(null);
  const [languages, setLanguages] = useState(null);
  const [commitActivity, setCommitActivity] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [contributorsData, setContributorsData] = useState(null);

  // Restore last page stage on refresh so we don't jump back to landing
  useEffect(() => {
    const stage = localStorage.getItem('appStage');
    if (stage === 'dashboard' || stage === 'repositories' || stage === 'insights') {
      setShowDashboard(true);
      // We intentionally do not auto-restore repositories/insights data on refresh
      // to avoid stale API data; user will see the dashboard search view instead.
    }
  }, []);

  const setStage = (stage) => {
    localStorage.setItem('appStage', stage);
  };

  const generateAIInsights = async (repoInfo, languagesData, contributorsData) => {
    setAiLoading(true);
    setAiError(null);
    
    try {
      const readmeContent = await githubService.getReadme(repoInfo.owner.login, repoInfo.name);
      const insights = {};
      
      // Generate insights sequentially to avoid hitting rate limits
      try {
        console.log('Generating repository summary...');
        insights.repositorySummary = await aiService.generateRepositorySummary(repoInfo, readmeContent);
        console.log('Repository summary generated successfully');
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        console.warn('Failed to generate repository summary:', err.message);
      }

      if (languagesData && Object.keys(languagesData).length > 0) {
        try {
          console.log('Generating language analysis...');
          insights.languageAnalysis = await aiService.generateLanguageAnalysis(languagesData, repoInfo);
          console.log('Language analysis generated successfully');
          
          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (err) {
          console.warn('Failed to generate language analysis:', err.message);
        }
      }

      if (contributorsData && contributorsData.length > 0) {
        try {
          console.log('Generating contribution analysis...');
          insights.contributionAnalysis = await aiService.generateContributionAnalysis(contributorsData, repoInfo);
          console.log('Contribution analysis generated successfully');
        } catch (err) {
          console.warn('Failed to generate contribution analysis:', err.message);
        }
      }

      setAiInsights(insights);
    } catch (aiErr) {
      setAiError(aiErr.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleRetryAI = () => {
    if (repoData) {
      generateAIInsights(repoData, languages, contributorsData);
    }
  };

  const handleGetStarted = () => {
    setShowDashboard(true);
    setStage('dashboard');
  };

  const handleSearchUser = async (username) => {
    setLoading(true);
    setError(null);
    setRepositories([]);
    
    try {
      const repos = await githubService.getUserRepositories(username);
      setRepositories(repos);
      setShowRepositories(true);
      setStage('repositories');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRepositorySelect = (repository) => {
    setSelectedRepository(repository);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedRepository(null);
  };

  const handleViewInsights = async (owner, repo) => {
    setLoading(true);
    setError(null);
    setAiError(null);
    setRepoData(null);
    setLanguages(null);
    setCommitActivity(null);
    setAiInsights(null);
    setShowRepositories(false);
    setShowInsights(true);
    setStage('insights');

    try {
      // Fetch basic repository data
      const repoInfo = await githubService.getRepository(owner, repo);
      setRepoData(repoInfo);

      // Fetch additional data in parallel
      const [languagesData, commitActivityData, contributorsData] = await Promise.allSettled([
        githubService.getLanguages(owner, repo),
        githubService.getCommitActivity(owner, repo),
        githubService.getContributors(owner, repo)
      ]);

      if (languagesData.status === 'fulfilled') {
        setLanguages(languagesData.value);
      }

      if (commitActivityData.status === 'fulfilled') {
        console.log('Commit activity data:', commitActivityData.value);
        console.log('Commit activity length:', commitActivityData.value?.length);
        setCommitActivity(commitActivityData.value);
      } else {
        console.warn('Failed to fetch commit activity:', commitActivityData.reason);
        setCommitActivity([]); // Set empty array explicitly
      }

      if (contributorsData.status === 'fulfilled') {
        setContributorsData(contributorsData.value);
      } else {
        console.warn('Failed to fetch contributors:', contributorsData.reason);
      }

      // Generate AI insights
      generateAIInsights(
        repoInfo, 
        languagesData.status === 'fulfilled' ? languagesData.value : null,
        contributorsData.status === 'fulfilled' ? contributorsData.value : null
      );

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToRepositories = () => {
    setShowInsights(false);
    setShowRepositories(true);
    setStage('repositories');
    setRepoData(null);
    setLanguages(null);
    setCommitActivity(null);
    setAiInsights(null);
    setError(null);
    setAiError(null);
  };

  const handleBackToSearch = () => {
    setShowRepositories(false);
    setShowInsights(false);
    setStage('dashboard');
    setRepositories([]);
    setError(null);
  };

  const handleBackToLanding = () => {
    setShowDashboard(false);
    setShowRepositories(false);
    setShowInsights(false);
    setStage('landing');
    setRepositories([]);
    setError(null);
    setAiError(null);
  };

  return (
    <div className="App">
      {!showDashboard ? (
        <LandingPage onGetStarted={handleGetStarted} />
      ) : (
        <div className="container">
          {!showRepositories && !showInsights && (
            <>
              <div className="navigation-header">
                <button onClick={handleBackToLanding} className="back-button">
                  ← Back to Home
                </button>
              </div>
              <SearchForm 
                onSearchUser={handleSearchUser} 
                loading={loading} 
              />
            </>
          )}

          {showRepositories && (
            <>
              <div className="navigation-header">
                <button onClick={handleBackToSearch} className="back-button">
                  ← Back to Search
                </button>
              </div>
              <RepositoryList 
                repositories={repositories}
                loading={loading}
                onRepositorySelect={handleRepositorySelect}
              />
            </>
          )}

          {showInsights && repoData && (
            <>
              <div className="navigation-header">
                <button onClick={handleBackToRepositories} className="back-button">
                  ← Back to Repositories
                </button>
              </div>
              <Dashboard 
                repoData={repoData}
                languages={languages}
                commitActivity={commitActivity}
                contributorsData={contributorsData}
                aiInsights={aiInsights}
                aiLoading={aiLoading}
                aiError={aiError}
                onRetryAI={handleRetryAI}
              />
            </>
          )}
          
          {error && (
            <div className="error-message">
              <p>Error: {error}</p>
              {showRepositories && (
                <button onClick={handleBackToSearch} className="retry-button">
                  Try Another User
                </button>
              )}
            </div>
          )}

          <RepositoryModal 
            repository={selectedRepository}
            isOpen={showModal}
            onClose={handleCloseModal}
            onViewInsights={handleViewInsights}
          />
        </div>
      )}
    </div>
  );
}

export default App;
