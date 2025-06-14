import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ethers } from 'ethers';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/');
          return;
        }

        const response = await fetch('http://localhost:3001/api/auth/protected', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const data = await response.json();
        setDashboardData(data);
      } catch (err) {
        console.error('Dashboard error:', err);
        setError('Failed to load dashboard. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  // Fetch registered users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('http://localhost:3001/api/auth/users', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }

        const data = await response.json();
        if (data.success) {
          setUsers(data.users || []);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
        // Don't show error to user for this non-critical feature
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  const handleLogout = async () => {
    try {
      // Call the logout API
      const response = await fetch('http://localhost:3001/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      
      // Clear local storage and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('userAddress');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local storage and redirect even if the API call fails
      localStorage.removeItem('token');
      localStorage.removeItem('userAddress');
      navigate('/');
    }
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
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>TrustKey Dashboard</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </header>
      
      <main className="dashboard-content">
        {dashboardData && (
          <>
            <section className="welcome-section">
              <h2>{dashboardData.message}</h2>
              <p>Wallet: {dashboardData.user.address}</p>
              <p>Member since: {new Date(dashboardData.user.registrationDate).toLocaleDateString()}</p>
            </section>

            <section className="stats-section">
              <h3>Your Stats</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-value">{dashboardData.dashboardData.stats.documentsSigned}</span>
                  <span className="stat-label">Documents Signed</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{dashboardData.dashboardData.stats.keysManaged}</span>
                  <span className="stat-label">Keys Managed</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{users.length}</span>
                  <span className="stat-label">Total Users</span>
                </div>
              </div>
            </section>

            {/* Registered Users Section */}
            <section className="users-section">
              <div className="section-header">
                <h3>Registered Users</h3>
                <span className="total-count">{users.length} users</span>
              </div>
              
              {loadingUsers ? (
                <div className="loading-users">
                  <div className="spinner small"></div>
                  <p>Loading users...</p>
                </div>
              ) : users.length > 0 ? (
                <div className="users-grid">
                  {users.map((user, index) => (
                    <div key={index} className="user-card">
                      <div className="user-avatar">
                        {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="user-details">
                        <div className="user-name">
                          {user.username || 'Unnamed User'}
                        </div>
                        <div className="user-address">
                          {`${user.address.substring(0, 6)}...${user.address.substring(user.address.length - 4)}`}
                        </div>
                        <div className="user-email" title={user.email}>
                          {user.email || 'No email provided'}
                        </div>
                      </div>
                      <div className="user-actions">
                        <Link 
                          to={`/users/${user.address}`} 
                          className="btn btn-sm btn-outline"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-users">
                  <p>No registered users found.</p>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
