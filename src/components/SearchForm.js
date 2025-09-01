import React, { useState } from 'react';
import { Search } from 'lucide-react';
import './SearchForm.css';

const SearchForm = ({ onSearch, loading, onToggleDemo, demoMode }) => {
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (owner.trim() && repo.trim()) {
      onSearch(owner.trim(), repo.trim());
    }
  };

  return (
    <div className="search-form">
      <h1>GitHub Repository Insights</h1>
      <p>Enter a GitHub repository to get detailed insights and AI-powered analysis</p>
      
      <div className="demo-toggle">
        <label className="toggle-container">
          <input
            type="checkbox"
            checked={demoMode}
            onChange={onToggleDemo}
          />
          <span className="toggle-slider"></span>
          <span className="toggle-label">
            {demoMode ? '🚀 Demo Mode (No API calls)' : '🤖 Live AI Mode (Uses API)'}
          </span>
        </label>
        <p className="demo-info">
          {demoMode 
            ? 'Demo mode shows realistic AI insights without using your API quota'
            : 'Live mode uses real AI but may hit rate limits on free tier'
          }
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="search-container">
        <div className="input-group">
          <input
            type="text"
            placeholder="Repository Owner (e.g., facebook)"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            disabled={loading}
            required
          />
          <span className="separator">/</span>
          <input
            type="text"
            placeholder="Repository Name (e.g., react)"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            disabled={loading}
            required
          />
        </div>
        
        <button type="submit" disabled={loading} className="search-button">
          <Search size={20} />
          {loading ? 'Analyzing...' : 'Analyze Repository'}
        </button>
      </form>
    </div>
  );
};

export default SearchForm;
