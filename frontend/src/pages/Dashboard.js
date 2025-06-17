import React, { useState, useEffect } from 'react';
import { FaBars, FaCog, FaSignOutAlt, FaUserShield, FaTachometerAlt, FaVial } from 'react-icons/fa';
import logo from '../assets/trustkey1.png';
import { useNavigate } from 'react-router-dom';
import { saveAs } from 'file-saver';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { FaCopy, FaDownload } from 'react-icons/fa';
import '../styles/Dashboard.css';
import { ADMIN_ADDRESS } from '../config';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [publicKey, setPublicKey] = useState('');
  const [userDetails, setUserDetails] = useState({
    username: '',
    email: '',
    address: ''
  });
  const [copied, setCopied] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  
  // Check if current user is admin and fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userAddress = localStorage.getItem('userAddress');
        if (!userAddress) {
          navigate('/');
          return;
        }

        if (userAddress.toLowerCase() === ADMIN_ADDRESS.toLowerCase()) {
          setIsAdmin(true);
        }

        const token = localStorage.getItem('token');
        
        // Try to fetch user details from the backend
        try {
          const response = await fetch('http://localhost:3001/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.user) {
              setUserDetails({
                username: data.user.username || 'User',
                email: data.user.email || 'Not provided',
                address: data.user.address || userAddress
              });
              
              if (data.user.publicKey) {
                setPublicKey(data.user.publicKey);
              } else {
                // Fallback to mock public key if not provided
                const mockPublicKey = `-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA${userAddress.replace('0x', '')}\n-----END PUBLIC KEY-----`;
                setPublicKey(mockPublicKey);
              }
              return; // Exit early if successful
            }
          }
        } catch (error) {
          console.warn('Could not fetch user details:', error);
          // Continue to fallback behavior
        }
        
        // Fallback if the endpoint doesn't exist or fails
        const username = localStorage.getItem('username') || 'User';
        const email = localStorage.getItem('email') || 'Not provided';
        
        setUserDetails({
          username,
          email,
          address: userAddress
        });
        
        // Set a mock public key based on the address
        const mockPublicKey = `-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA${userAddress.replace('0x', '')}\n-----END PUBLIC KEY-----`;
        setPublicKey(mockPublicKey);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleCopyKey = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadKey = () => {
    const blob = new Blob([publicKey], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, 'public_key.pem');
  };

  const handleLogout = () => {
    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('userAddress');
    
    // Redirect to home page
    navigate('/');
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <div className="error-message">
          <h3>Error Loading Dashboard</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="btn primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const userAddress = localStorage.getItem('userAddress') || '0x0...';

  return (
    <div className={`dashboard-layout${sidebarOpen ? ' sidebar-open' : ''}`}
  style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* Sidebar - only render if open */}
      {sidebarOpen && (
        <>
          <aside className="dashboard-sidebar visible" aria-label="Sidebar Navigation">
            <div className="sidebar-header">
              <img src={logo} alt="TrustKey Logo" className="sidebar-logo" />
              <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
                ×
              </button>
            </div>
            <nav className="sidebar-nav">
              <ul>
                <li className="active">
                  <a href="#" onClick={() => setSidebarOpen(false)} aria-current="page"><FaTachometerAlt /><span>Overview</span></a>
                </li>
                <li>
                  <a href="#" onClick={() => setSidebarOpen(false)}><FaVial /><span>Test</span></a>
                </li>
              </ul>
            </nav>
          </aside>
          <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-label="Sidebar overlay"></div>
        </>
      )}
      {/* Main Content */}
      <div className="main-content-wrapper" >
        <header className="dashboard-header">
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(prev => !prev)}><FaBars /></button>
          <h1 className="dashboard-title">TrustKey Dashboard</h1>
          <div className="header-actions">
            <div className="settings-menu">
              <button onClick={() => setSettingsOpen(!settingsOpen)} className="settings-btn" title="Settings">
                <FaCog />
              </button>
              {settingsOpen && (
                <div className="settings-dropdown">
                  {isAdmin && (
                    <button onClick={() => { navigate('/admin'); setSettingsOpen(false); }} className="dropdown-item">
                    Admin
                    </button>
                  )}
                  <button onClick={() => { handleLogout(); setSettingsOpen(false); }} className="dropdown-item">
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="dashboard-content">
          <div className="dashboard-grid">
          {/* User Profile Card */}
          <div className="card user-card user-details">
              <div className="profile-header">
                <div className="user-avatar">
                  {userDetails.username ? userDetails.username.substring(0, 2).toUpperCase() : 'US'}
                </div>
                <h3 style={{ margin: 0, color: '#1e293b' }}>Profile Information</h3>
              </div>
              <table>
                <tbody>
                  <tr>
                    <th>Name</th>
                    <td className="value">{userDetails.username || 'Not set'}</td>
                  </tr>
                  <tr>
                    <th>Email</th>
                    <td className="value">{userDetails.email || 'Not provided'}</td>
                  </tr>
                  <tr>
                    <th>Wallet Address</th>
                    <td className="value">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>{userDetails.address || 'Not available'}</span>
                        <CopyToClipboard text={userDetails.address} onCopy={handleCopyKey}>
                          <button className="icon-btn" style={{ padding: '0.25rem' }} title="Copy Address">
                            <FaCopy size={14} />
                          </button>
                        </CopyToClipboard>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            
          </div>
          {/* Public Key Card */}
          <div className="card public-key-card">
            <div className="card-header">
              <h3>Your Public Key</h3>
              <button 
                onClick={handleDownloadKey}
                className="btn download-btn"
                title="Download Public Key"
              >
                <FaDownload /> Download
              </button>
            </div>
            
            <div className="public-key-container">
              <pre className="public-key">
                {publicKey || 'No public key found'}
              </pre>
              <CopyToClipboard text={publicKey} onCopy={handleCopyKey}>
                <button className="copy-btn">
                  <FaCopy /> {copied ? 'Copied!' : 'Copy'}
                </button>
              </CopyToClipboard>
            </div>
            
            <div className="key-actions">
              <button className="btn primary">Generate New Key Pair</button>
              <button className="btn secondary">Import Existing Key</button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card quick-actions">
            <h3>Quick Actions</h3>
            <div className="action-buttons">
              <button className="btn primary">Sign Document</button>
              <button className="btn secondary">Verify Signature</button>
              <button className="btn">View Activity Log</button>
            </div>
          </div>
        </div>

      </main>
      
      {/* Copy Success Notification */}
      {copied && (
        <div className="copy-notification">
          Copied to clipboard!
        </div>
      )}
    </div>
    {/* Close main-content-wrapper */}
  </div>
  );
};

export default Dashboard;
