import React, { useState } from 'react';
import StatsCard from './StatsCard';
import LanguageChart from './LanguageChart';
import CommitChart from './CommitChart';
import AIInsights from './AIInsights';
import RepositoryComparison from './RepositoryComparison';
import { BarChart3, Brain, GitCompare } from 'lucide-react';
import '../css/Dashboard.css';

const Dashboard = ({ 
  repoData, 
  languages, 
  commitActivity, 
  contributorsData,
  aiInsights, 
  aiLoading, 
  aiError, 
  onRetryAI 
}) => {
  const [activeTab, setActiveTab] = useState('insights'); // 'insights', 'ai', or 'comparison'

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>{repoData.name} - Repository Analysis</h2>
        <div className="tab-switcher">
          <button 
            className={`tab-button ${activeTab === 'insights' ? 'active' : ''}`}
            onClick={() => setActiveTab('insights')}
          >
            <BarChart3 size={20} />
            Insights
          </button>
          <button 
            className={`tab-button ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            <Brain size={20} />
            AI Analysis
          </button>
          <button 
            className={`tab-button ${activeTab === 'comparison' ? 'active' : ''}`}
            onClick={() => setActiveTab('comparison')}
          >
            <GitCompare size={20} />
            Comparison
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {activeTab === 'insights' ? (
          <div className="insights-tab">
            <StatsCard repoData={repoData} />
            <div className="charts-container">
              <div className="chart-item language-chart">
                <LanguageChart languages={languages} />
              </div>
              <div className="chart-item commit-chart">
                <CommitChart commitActivity={commitActivity} />
              </div>
            </div>
          </div>
        ) : activeTab === 'ai' ? (
          <div className="ai-tab">
            <AIInsights 
              insights={aiInsights} 
              loading={aiLoading} 
              error={aiError}
              onRetry={onRetryAI}
            />
          </div>
        ) : (
          <div className="comparison-tab">
            <RepositoryComparison 
              repoData={repoData}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
