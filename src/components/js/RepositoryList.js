import React, { useMemo, useState, useEffect } from 'react';
import { Star, GitFork, Eye } from 'lucide-react';
import '../css/RepositoryList.css';

const RepositoryList = ({ repositories, loading, onRepositorySelect }) => {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const totalPages = useMemo(() => {
    if (!repositories || repositories.length === 0) return 1;
    return Math.ceil(repositories.length / pageSize);
  }, [repositories]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const currentItems = useMemo(() => {
    if (!repositories) return [];
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return repositories.slice(start, end);
  }, [repositories, page]);

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

      <div className="repositories-list">
        <div className="list-header">
          <div className="col name">Name</div>
          <div className="col desc">Description</div>
          <div className="col stat">Stars</div>
          <div className="col stat">Forks</div>
          <div className="col stat">Watchers</div>
          <div className="col lang">Language</div>
          <div className="col updated">Updated</div>
        </div>

        {currentItems.map((repo) => (
          <button
            type="button"
            key={repo.id}
            className="list-row"
            onClick={() => onRepositorySelect(repo)}
          >
            <div className="col name">
              <span className="repo-name">{repo.name}</span>
              {repo.private && <span className="private-badge">Private</span>}
            </div>
            <div className="col desc">{repo.description || 'No description available'}</div>
            <div className="col stat"><Star size={14} /> {repo.stargazers_count}</div>
            <div className="col stat"><GitFork size={14} /> {repo.forks_count}</div>
            <div className="col stat"><Eye size={14} /> {repo.watchers_count}</div>
            <div className="col lang">
              {repo.language ? (
                <>
                  <span className="language-dot" style={{ backgroundColor: getLanguageColor(repo.language) }}></span>
                  {repo.language}
                </>
              ) : (
                '-'
              )}
            </div>
            <div className="col updated">{new Date(repo.updated_at).toLocaleDateString()}</div>
          </button>
        ))}
      </div>

      <div className="pagination">
        <button className="page-btn" disabled={page === 1} onClick={() => setPage(1)}>First</button>
        <button className="page-btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
        <span className="page-info">Page {page} of {totalPages}</span>
        <button className="page-btn" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
        <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(totalPages)}>Last</button>
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
