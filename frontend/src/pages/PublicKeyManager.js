import React, { useState, useEffect } from 'react';
import { FaCertificate, FaDownload, FaSpinner, FaKey, FaTachometerAlt, FaCopy,FaBars, FaVial } from 'react-icons/fa';

import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { saveAs } from 'file-saver';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../styles/CertificateManager.css';
import { CopyToClipboard } from 'react-copy-to-clipboard';

const PublicKeyManager = ({ userAddress, onPublicKeyUpdate }) => {
  const [publicKey, setPublicKey] = useState('');
  const [publicKeys, setPublicKeys] = useState([]);
  const [copied, setCopied] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [logo, setLogo] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [userDetails, setUserDetails] = useState({
    username: '',
    email: '',
    address: ''
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPublicKeyForm, setShowPublicKeyForm] = useState(false);
  const [formData, setFormData] = useState({
    publicKey: '',
    signatureAlgorithm: 'sha256WithRSAEncryption',
    validDays: 365
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPublicKey = async () => {
      if (!userAddress) return;
      
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('token');
        
        if (!token) {
          navigate('/login');
          return;
        }
        
        console.log('Fetching public key for address:', userAddress);
        const response = await axios.get(`${API_BASE_URL}/certificates/keys/${userAddress}`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('Public key API response:', response.data);

        // Handle successful response
        if (response.data.success) {
          const keys = response.data.publicKeys || [];
          setPublicKey(keys.length > 0 ? keys[0].keyData : ''); // Set the first key as active by default
          setPublicKeys(keys);
          setError(keys.length === 0 ? 'No public key found for this account.' : '');
        } else {
          setPublicKey('');
          setError(response.data.message || 'Failed to load public key information');
          toast.warning(response.data.message || 'No public key found');
        }
      } catch (err) {
        console.error('Error fetching public key:', err);
        console.log('Error response data:', err.response?.data);
        console.log('Error status:', err.response?.status);
        
        // Handle specific error cases
        if (err.response?.status === 401) {
          // Unauthorized - token expired or invalid
          localStorage.removeItem('token');
          navigate('/');
          return;
        } else if (err.response?.status === 403) {
          // Forbidden - user not authorized
          setError('You are not authorized to view this public key');
          toast.error('Access denied');
        } else if (err.response?.status === 404 && err.response?.data?.code === 'USER_NOT_REGISTERED') {
          // User not registered in the smart contract
          const errorMessage = err.response?.data?.message || 'User not registered in the system';
          setError(errorMessage);
          toast.warning(errorMessage);
        } else {
          // Handle other error cases
          setError(err.response?.data?.message || 'Failed to load public key information');
          toast.error(err.response?.data?.message || 'Failed to load public key information');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchPublicKey();
  }, [userAddress]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/certificates/keys`,
        {
          address: userAddress,
          keyData: formData.publicKey
        },
        {
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        // Refetch keys after adding
        setShowPublicKeyForm(false);
        setError('');
        toast.success('Public key created successfully!');
        // Refetch all keys
        const keysResponse = await axios.get(`${API_BASE_URL}/certificates/keys/${userAddress}`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (keysResponse.data.success) {
          setPublicKeys(keysResponse.data.publicKeys || []);
          setPublicKey(keysResponse.data.publicKeys?.[0]?.keyData || '');
        }
        if (onPublicKeyUpdate && typeof onPublicKeyUpdate === 'function') {
          onPublicKeyUpdate();
        }
      }
    } catch (err) {
      console.error('Error creating public key:', err);
      const errorMsg = err.response?.data?.message || 'Failed to create public key';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyKey = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadKey = () => {
    const blob = new Blob([publicKey], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, 'public_key.pem');
  };

  // Download a specific key
  const handleDownloadKeyRow = (keyData, index) => {
    const blob = new Blob([keyData], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `public_key_${index}.pem`);
  };

  // Revoke a specific key
  const handleRevokeKey = async (keyIndex) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/certificates/keys/${keyIndex}`, {
        data: { address: userAddress },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      toast.success('Public key revoked successfully!');
      // Refetch keys
      const response = await axios.get(`${API_BASE_URL}/certificates/keys/${userAddress}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.data.success) {
        setPublicKeys(response.data.publicKeys || []);
        setPublicKey(response.data.publicKeys?.[0]?.keyData || '');
      }
    } catch (err) {
      toast.error('Failed to revoke public key');
    } finally {
      setLoading(false);
    }
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

  // Refined error handling: Only show error block for real errors, not for 'no public key' cases
  if (error && error !== 'No public key found for this account.' && error !== 'No public key found') {
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

  // Table for public keys
  return (
    <div className="card public-key-card" style={{ height: 'fit-content', maxWidth: 800, margin: '2rem auto', padding: '2rem', boxShadow: '0 2px 16px #e0e7ef', borderRadius: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>Public Keys</h2>
        <button style={{ width: 'fit-content' }} className="btn btn-primary" onClick={() => setShowPublicKeyForm(true)}>
          + Add Public Key
        </button>
      </div>
      {showPublicKeyForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: 24, background: '#f8fafc', padding: 16, borderRadius: 8 }}>
          <label>
            Public Key:
            <input
              type="text"
              value={formData.publicKey}
              onChange={e => setFormData({ ...formData, publicKey: e.target.value })}
              style={{ width: '100%', marginBottom: 10 }}
              required
            />
          </label>
          <button className="btn btn-primary" type="submit" style={{ marginRight: 8 }}>Add</button>
          <button className="btn btn-secondary" type="button" onClick={() => setShowPublicKeyForm(false)}>Cancel</button>
        </form>
      )}
      <div>
        <table className="public-key-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              <th style={{ padding: 8, border: '1px solid #e5e7eb' }}>Index</th>
              <th style={{ padding: 8, border: '1px solid #e5e7eb' }}>Public Key</th>
              <th style={{ padding: 8, border: '1px solid #e5e7eb' }}>Added At</th>
              <th style={{ padding: 8, border: '1px solid #e5e7eb' }}>Active</th>
              <th style={{ padding: 8, border: '1px solid #e5e7eb' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {publicKeys.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 16, color: '#64748b' }}>No public keys found.</td>
              </tr>
            ) : (
              publicKeys.map((key, idx) => (
                <tr key={key.index} style={{ background: idx % 2 === 0 ? '#fff' : '#f9fafb' }}>
                  <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>{key.index}</td>
                  <td style={{ padding: 8, border: '1px solid #e5e7eb', maxWidth: 240, wordBreak: 'break-all' }}>{key.keyData}</td>
                  <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>{key.addedAt || '-'}</td>
                  <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>{key.isActive ? 'Yes' : 'No'}</td>
                  <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>
                    <button className="btn btn-secondary" style={{ marginRight: 8 }} onClick={() => handleDownloadKeyRow(key.keyData, key.index)}>Download</button>
                    <button className="btn btn-danger" onClick={() => handleRevokeKey(key.index)} disabled={!key.isActive}>Revoke</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default PublicKeyManager;
