import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

const Login = () => {
  const { loginWithEmail, loginWithGithub } = useAuth();
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
      await loginWithEmail({ email, password, githubUsername });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const onGithub = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGithub();
      navigate('/');
    } catch (err) {
      setError(err.message || 'GitHub login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Login</h1>
          <p className="auth-subtitle">Access your GitHub Insights dashboard</p>
        </div>
        {error && <div className="error-inline">{error}</div>}
        <form className="auth-form" onSubmit={onSubmit}>
          <input className="auth-input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="auth-input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <input className="auth-input" type="text" placeholder="GitHub username (required)" value={githubUsername} onChange={(e) => setGithubUsername(e.target.value)} required />
          <button className="auth-button primary" type="submit" disabled={loading}>{loading ? 'Loading...' : 'Login'}</button>
        </form>
        <div className="auth-separator">or</div>
        <div className="auth-alt">
          <button className="github-button" onClick={onGithub} disabled={loading}>
            <span>Continue with GitHub</span>
          </button>
        </div>
        <div className="auth-footer">
          <span>Don't have an account? <Link to="/signup">Sign up</Link></span>
        </div>
      </div>
    </div>
  );
};

export default Login;


