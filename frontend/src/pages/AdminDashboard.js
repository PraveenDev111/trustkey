import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { API_BASE_URL, ADMIN_ADDRESS } from '../config';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('logs');
  const [logFiles, setLogFiles] = useState([]);
  const [logContent, setLogContent] = useState(null);
  const [currentFile, setCurrentFile] = useState('');
  const [systemStats, setSystemStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    // Check if user is admin
    const userAddress = localStorage.getItem('userAddress');
    if (userAddress?.toLowerCase() !== ADMIN_ADDRESS.toLowerCase()) {
      toast.error('Unauthorized: Admin access required');
      navigate('/dashboard');
      return;
    }
    
    fetchLogFiles();
    fetchSystemStats();
    fetchUsers();
  }, [navigate]);

  const fetchLogFiles = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/admin/logs`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch log files');
      
      const data = await response.json();
      setLogFiles(data.files || []);
    } catch (error) {
      console.error('Error fetching log files:', error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogContent = async (filename) => {
    try {
      setIsLoading(true);
      setCurrentFile(filename);
      const response = await fetch(`${API_BASE_URL}/admin/logs/${filename}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch log content');
      
      const data = await response.json();
      setLogContent(data);
    } catch (error) {
      console.error('Error fetching log content:', error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    setSelectedUser(null);
    setUserDetails(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error(error.message || 'Failed to fetch users');
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchUserDetails = async (address) => {
    setUserDetails(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/user/${address}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch user details');
      const data = await response.json();
      setUserDetails(data.user || data);
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast.error(error.message || 'Failed to fetch user details');
      setUserDetails(null);
    }
  };

  const fetchSystemStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch system stats');
      
      const data = await response.json();
      setSystemStats(data.stats);
    } catch (error) {
      console.error('Error fetching system stats:', error);
    }
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const renderLogContent = () => {
    if (!logContent) return <div className="no-content">Select a log file to view its content</div>;
    
    if (isLoading) return <div className="loading">Loading...</div>;
    
    if (logContent.isJson) {
      return (
        <div className="json-viewer">
          <pre>{JSON.stringify(logContent.content, null, 2)}</pre>
        </div>
      );
    }
    
    return (
      <div className="log-content">
        <pre>{logContent.content}</pre>
      </div>
    );
  };

  const renderSystemStats = () => {
    if (!systemStats) return <div className="loading">Loading system stats...</div>;
    
    return (
      <div className="system-stats">
        <div className="stat-card">
          <h3>Node.js Version</h3>
          <p>{systemStats.nodeVersion}</p>
        </div>
        <div className="stat-card">
          <h3>Platform</h3>
          <p>{systemStats.platform}</p>
        </div>
        <div className="stat-card">
          <h3>Environment</h3>
          <p>{systemStats.env}</p>
        </div>
        <div className="stat-card">
          <h3>Uptime</h3>
          <p>{Math.floor(systemStats.uptime / 60)} minutes</p>
        </div>
        <div className="stat-card">
          <h3>Memory Usage</h3>
          <p>RSS: {formatBytes(systemStats.memoryUsage.rss)}</p>
          <p>Heap Total: {formatBytes(systemStats.memoryUsage.heapTotal)}</p>
          <p>Heap Used: {formatBytes(systemStats.memoryUsage.heapUsed)}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>Admin Dashboard</h1>
        <button 
          className="btn btn-logout"
          onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('userAddress');
            navigate('/');
          }}
        >
          Logout
        </button>
      </header>
      
      <div className="admin-container">
        <nav className="admin-sidebar">
          <button 
            className={`sidebar-btn ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            Logs
          </button>
          <button 
            className={`sidebar-btn ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            System Stats
          </button>
          <button
            className={`sidebar-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
        </nav>
        
        <main className="admin-main">
          {activeTab === 'logs' ? (
            <div className="logs-container">
              <div className="log-files">
                <h2>Log Files</h2>
                <div className="file-list">
                  {logFiles.map((file, index) => (
                    <div 
                      key={index} 
                      className={`file-item ${currentFile === file.name ? 'active' : ''}`}
                      onClick={() => fetchLogContent(file.name)}
                    >
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">{formatBytes(file.size)}</span>
                      <span className="file-modified">{formatDate(file.modified)}</span>
                    </div>
                  ))}
                  {logFiles.length === 0 && !isLoading && (
                    <div className="no-files">No log files found</div>
                  )}
                </div>
              </div>
              <div className="log-viewer">
                <h2>{currentFile || 'Select a log file'}</h2>
                {renderLogContent()}
              </div>
            </div>
          ) : activeTab === 'users' ? (
            <div className="logs-container">
              <div className="log-files">
                <h2>Users</h2>
                {usersLoading ? (
                  <div className="loading">Loading users...</div>
                ) : users && users.length > 0 ? (
                  <div className="file-list">
                    {users.map((user, idx) => (
                      <div
                        key={user.address}
                        className={`file-item${selectedUser === user.address ? ' active' : ''}`}
                        style={{ cursor: 'pointer', marginBottom: '0.5rem', padding: '0.75rem', borderRadius: '6px', background: selectedUser === user.address ? '#f3f4f6' : 'transparent' }}
                        onClick={() => {
                          setSelectedUser(user.address);
                          fetchUserDetails(user.address);
                        }}
                      >
                        <span className="file-name" style={{ fontWeight: 500 }}>{user.username || 'N/A'}</span>
                        <span className="file-size" style={{ fontSize: '0.85em', color: '#888', marginLeft: 8 }}>{user.email || 'N/A'}</span>
                        <span className="file-modified" style={{ display: 'block', fontFamily: 'monospace', fontSize: '0.85em', color: '#666' }}>{user.address}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-files">No users found</div>
                )}
              </div>
              <div className="user-details-panel">
                {selectedUser && userDetails ? (
                  <>
                    <h2>User Details</h2>
                    <table className="user-details-table">
                      <tbody>
                        <tr>
                          <th>Username</th>
                          <td>{userDetails.username || 'N/A'}</td>
                        </tr>
                        <tr>
                          <th>Email</th>
                          <td>{userDetails.email || 'N/A'}</td>
                        </tr>
                        <tr>
                          <th>Address</th>
                          <td style={{fontFamily: 'monospace'}}>{userDetails.address}</td>
                        </tr>
                        <tr>
                          <th>Registered</th>
                          <td>{userDetails.isRegistered ? 'Yes' : 'No'}</td>
                        </tr>
                        <tr>
                          <th>Public Key</th>
                          <td style={{fontFamily: 'monospace'}}>{userDetails.publicKey || 'N/A'}</td>
                        </tr>
                        {/* Add more details as needed */}
                      </tbody>
                    </table>
                    <button className="btn btn-close-details" style={{ width: 'fit-content', marginTop: '1.5rem' }} onClick={() => {
                      setSelectedUser(null);
                      setUserDetails(null);
                    }}>Close</button>
                  </>
                ) : (
                  <div className="no-content">Select a user to view details</div>
                )}
              </div>
            </div>
          ) : (
            <div className="stats-container">
              <h2>System Statistics</h2>
              {renderSystemStats()}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
