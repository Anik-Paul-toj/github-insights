import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import SearchForm from './components/SearchForm';
import StatsCard from './components/StatsCard';
import LanguageChart from './components/LanguageChart';
import CommitChart from './components/CommitChart';
import AIInsights from './components/AIInsights';
import LoadingSpinner from './components/LoadingSpinner';
import githubService from './services/githubService';
import aiService from './services/aiService';
import './App.css';

function App() {
  const [showDashboard, setShowDashboard] = useState(false);
  const [loading, setLoading] = useState(false);
  const [repoData, setRepoData] = useState(null);
  const [languages, setLanguages] = useState(null);
  const [commitActivity, setCommitActivity] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [contributorsData, setContributorsData] = useState(null);

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
  };

  const toggleDemoMode = () => {
    // Remove this function as we're not using demo mode anymore
  };

  const handleSearch = async (owner, repo) => {
    setLoading(true);
    setError(null);
    setAiError(null);
    setRepoData(null);
    setLanguages(null);
    setCommitActivity(null);
    setAiInsights(null);

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
        setCommitActivity(commitActivityData.value);
      } else {
        console.warn('Failed to fetch commit activity:', commitActivityData.reason);
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

  return (
    <div className="App">
      {!showDashboard ? (
        <LandingPage onGetStarted={handleGetStarted} />
      ) : (
        <div className="container">
          <SearchForm 
            onSearch={handleSearch} 
            loading={loading} 
          />
          
          {error && (
            <div className="error-message">
              <p>Error: {error}</p>
            </div>
          )}

          {repoData && (
            <>
              <StatsCard repoData={repoData} />
              <div className="charts-container">
                <div className="chart-item language-chart">
                  <LanguageChart languages={languages} />
                </div>
                <div className="chart-item commit-chart">
                  <CommitChart commitActivity={commitActivity} />
                </div>
              </div>
              <AIInsights 
                insights={aiInsights} 
                loading={aiLoading} 
                error={aiError}
                onRetry={handleRetryAI}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
