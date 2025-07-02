import React, { useState, useEffect } from 'react';
import { FaUsers, FaCopy, FaDownload, FaSpinner, FaBars, FaVial } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../styles/CertificateManager.css';
import { CopyToClipboard } from 'react-copy-to-clipboard';

const UserManager = ({ userAddress }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/auth/users`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (Array.isArray(response.data)) {
        setUsers(response.data);
        setError('');
      } else {
        setError('Invalid response format from server');
        toast.error('Failed to load users: Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'Failed to load users');
      toast.error(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAddress = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/auth/users/export`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `users_export_${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      toast.success('Users exported successfully');
    } catch (err) {
      console.error('Error exporting users:', err);
      toast.error(err.response?.data?.message || 'Failed to export users');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error" style={{maxWidth:'100%', margin:'0 0'}}>
        <div className="error-message">
          <h3>Error Loading Users</h3>
          <p>{error}</p>
          <button onClick={fetchUsers} className="btn primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      <div className="card user-manager">
        <div className="card-header">
          <h3>Registered Users</h3>
          <div className="header-actions">
            <button className="btn btn-primary" onClick={handleExportUsers}>
              <FaDownload /> Export Users
            </button>
          </div>
        </div>
        
        {users.length > 0 ? (
          <table className="user-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Address</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={index}>
                  <td>{user.username || 'N/A'}</td>
                  <td>{user.email || 'N/A'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>{user.address}</span>
                      <CopyToClipboard text={user.address} onCopy={handleCopyAddress}>
                        <button className="icon-btn" style={{ padding: '0.25rem' }} title="Copy Address">
                          <FaCopy size={14} />
                        </button>
                      </CopyToClipboard>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-content">
            <h3>No Registered Users Found</h3>
            <p>There are currently no registered users in the system.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManager;
