import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

const Signup = () => {
  const { signUpWithEmail } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [githubUsername, setGithubUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signUpWithEmail({ email, password, githubUsername });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Create account</h1>
          <p className="auth-subtitle">Start exploring your repositories with AI insights</p>
        </div>
        {error && <div className="error-inline">{error}</div>}
        <form className="auth-form" onSubmit={onSubmit}>
          <input className="auth-input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="auth-input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <input className="auth-input" type="text" placeholder="GitHub username (required)" value={githubUsername} onChange={(e) => setGithubUsername(e.target.value)} required />
          <button className="auth-button primary" type="submit" disabled={loading}>{loading ? 'Loading...' : 'Create account'}</button>
        </form>
        <div className="auth-footer">
          <span>Already have an account? <Link to="/login">Log in</Link></span>
        </div>
      </div>
    </div>
  );
};

export default Signup;


