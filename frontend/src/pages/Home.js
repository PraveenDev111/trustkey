import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Home.css';
import logo from '../assets/trustkey2.png';

const Home = () => {
  const [token, setToken] = useState(null);
  const [userAddress, setUserAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Check for an existing token in localStorage when the component mounts
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedAddress = localStorage.getItem('userAddress');
    if (storedToken && storedAddress) {
      setToken(storedToken);
      setUserAddress(storedAddress);
      // Redirect to dashboard if already logged in
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleLogin = async () => {
    setLoading(true);
    setError('');

    if (!window.ethereum) {
      setError('MetaMask is not installed. Please install it to continue.');
      setLoading(false);
      return;
    }

    try {
      // 1. Get user's address from MetaMask
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts[0];

      // 2. Get nonce from backend
      const nonceResponse = await fetch(`http://localhost:3001/api/auth/nonce/${address}`);
      if (!nonceResponse.ok) throw new Error('Failed to fetch nonce.');
      const { nonce } = await nonceResponse.json();

      // 3. Sign the nonce
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [nonce, address],
      });

      // 4. Verify signature with backend
      const verifyResponse = await fetch('http://localhost:3001/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, signature }),
      });

      if (!verifyResponse.ok) {
        const errData = await verifyResponse.json();
        throw new Error(errData.error || 'Signature verification failed.');
      }
      const { token: receivedToken } = await verifyResponse.json();

      // 5. Store token and update auth state
      localStorage.setItem('token', receivedToken);
      localStorage.setItem('userAddress', address);
      setToken(receivedToken);
      setUserAddress(address);
      
      // 6. Redirect to dashboard
      navigate('/dashboard');

    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userAddress');
    setToken(null);
    setUserAddress(null);
    setError('');
    // Redirect to home after logout
    navigate('/');
  };

  return (
    <div className="home-container">
      <div className="auth-section">
        <div className="auth-card">
          <img src={logo} alt="TrustKey Logo" className="auth-logo" />
          
          {userAddress ? (
            <div className="session-info">
              <h2>Welcome!</h2>
              <p className="user-address">Logged in as: <strong>{`${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)}`}</strong></p>
              <div className="auth-buttons">
                <Link to="/dashboard" className="btn btn-primary">
                  Go to Dashboard
                </Link>
                <button className="btn btn-secondary" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2>Welcome Back</h2>
              <p>Login or create an account to get started.</p>
              <button className="btn btn-primary" onClick={handleLogin} disabled={loading}>
                {loading ? 'Connecting...' : 'Login with MetaMask'}
              </button>
              <div className="register-link">
                <p>Don't have an account? <Link to="/register">Register now</Link></p>
              </div>
            </>
          )}

          {error && <p className="error-message">{error}</p>}

        </div>
      </div>
      <div className="banner-section">
        <div className="banner-content">
            <h3>Secure Authentication</h3>
            <p>Blockchain-powered identity protection with military-grade security.</p>
            
            <div className="features-grid">
              <div className="feature-card">
                  <div className="feature-icon">🔒</div>
                  <h4>End-to-End Encrypted</h4>
                  <p>Military-grade encryption for maximum privacy</p>
              </div>
              <div className="feature-card">
                  <div className="feature-icon">⚡</div>
                  <h4>Lightning Fast</h4>
                  <p>Quick authentication without delays</p>
              </div>
              <div className="feature-card">
                  <div className="feature-icon">🌐</div>
                  <h4>Decentralized</h4>
                  <p>No single point of failure</p>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Home;