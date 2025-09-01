import React, { useState } from 'react';
import { Search } from 'lucide-react';
import './SearchForm.css';

const SearchForm = ({ onSearchUser, loading }) => {
  const [owner, setOwner] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (owner.trim()) {
      onSearchUser(owner.trim());
    }
  };

  return (
    <div className="search-form">
      <h1>GitHub Repository Insights</h1>
      <p>Enter a GitHub username to explore their repositories and get detailed insights with AI-powered analysis</p>
      
      <form onSubmit={handleSubmit} className="search-container">
        <div className="input-group">
          <input
            type="text"
            placeholder="GitHub Username (e.g., facebook, google, microsoft)"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            disabled={loading}
            required
          />
        </div>
        
        <button type="submit" disabled={loading} className="search-button">
          <Search size={20} />
          {loading ? 'Loading Repositories...' : 'Find Repositories'}
        </button>
      </form>
    </div>
  );
};

export default SearchForm;
