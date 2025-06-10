import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { initWeb3 } from '../web3';
import logo from '../assets/trustkey2.png';
import './Home.css';

const Home = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      setIsConnecting(true);
      setError('');
      const isConnected = await initWeb3();
      if (!isConnected) {
        setError('Failed to connect to MetaMask. Please install or unlock it.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred while connecting to MetaMask');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="home-container">
      <div className="auth-section">
        <div className="auth-card">
          <div className="logo">
            <img src={logo} alt="TrustKey Logo" className="logo-image" />
          </div>
          <h2>Welcome Back</h2>
          <p className="subtitle">Sign in to access your secure account</p>

          <div className="login-section">
            <button 
              className="login-button" 
              onClick={handleLogin}
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Sign in'}
            </button>

            {error && <p className="error-message">{error}</p>}

            <div className="divider">
              <span>OR</span>
            </div>

            <p className="register-text">
              Don't have an account?{' '}
              <Link to="/register" className="register-link">
                Register with MetaMask
              </Link>
            </p>
          </div>
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