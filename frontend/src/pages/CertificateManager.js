import React, { useState, useEffect } from 'react';
import { FaCertificate, FaDownload, FaPlus, FaInfoCircle, FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { saveAs } from 'file-saver';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../styles/CertificateManager.css';

const CertificateManager = ({ userAddress }) => {
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCertificateForm, setShowCertificateForm] = useState(false);
  const [formData, setFormData] = useState({
    serialNumber: `CERT-${Date.now()}`,
    country: '',
    state: '',
    locality: '',
    organization: '',
    commonName: '',
    publicKey: '',
    signatureAlgorithm: 'sha256WithRSAEncryption',
    validDays: 365
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCertificate = async () => {
      if (!userAddress) return;
      
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('token');
        
        if (!token) {
          navigate('/login');
          return;
        }
        
        const response = await axios.get(`${API_BASE_URL}/certificates/${userAddress}`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        // Handle successful response
        if (response.data.success) {
          if (response.data.hasCertificate) {
            // User has a certificate
            setCertificate({
              ...response.data,
              userAddress: userAddress
            });
            setError('');
          } else {
            // User is registered but has no certificate
            setCertificate(null);
            setError(response.data.message || 'No certificate found for this account.');
          }
        } else {
          // Handle API success:false case
          setError(response.data.message || 'Failed to load certificate information');
          toast.warning(response.data.message || 'No certificate found');
        }
      } catch (err) {
        console.error('Error fetching certificate:', err);
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
          setError('You are not authorized to view this certificate');
          toast.error('Access denied');
        } else if (err.response?.status === 404 && err.response?.data?.code === 'USER_NOT_REGISTERED') {
          // User not registered in the smart contract
          const errorMessage = err.response?.data?.message || 'User not registered in the system';
          setError(errorMessage);
          toast.warning(errorMessage);
          setCertificate(null);
        } else if (err.response?.status === 200 && err.response?.data?.hasCertificate === false) {
          // User exists but has no certificate
          setCertificate(null);
          setError(err.response.data.message || 'No certificate found');
          // Don't show toast for this case as it's a normal state
        } else {
          // Other errors
          const errorMsg = err.response?.data?.message || 'Failed to load certificate information';
          setError(errorMsg);
          toast.error(errorMsg);
        }
      } finally {
        setLoading(false);
      }
    };

    if (userAddress) {
      fetchCertificate();
    }
  }, [userAddress]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/certificates/${userAddress}/create`,
        formData,
        {
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setCertificate(response.data.certificate);
        setShowCertificateForm(false);
        toast.success('Certificate created successfully!');
      }
    } catch (err) {
      console.error('Error creating certificate:', err);
      const errorMsg = err.response?.data?.message || 'Failed to create certificate';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = () => {
    if (!certificate) return;
    
    const certData = {
      serialNumber: certificate.serialNumber,
      commonName: certificate.commonName,
      organization: certificate.organization,
      validFrom: new Date(certificate.validFrom * 1000).toISOString(),
      validTo: new Date(certificate.validTo * 1000).toISOString(),
      status: certificate.isRevoked ? 'REVOKED' : 'ACTIVE'
    };
    
    const blob = new Blob([JSON.stringify(certificate, null, 2)], { type: 'application/json' });
    saveAs(blob, `certificate_${certificate.serialNumber}.json`);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <FaSpinner className="spinner-icon" spin="true" />
        <p>Loading certificate information...</p>
      </div>
    );
  }

  return (
    <div className="certificate-manager">
      <div className="certificate-header">
        <h2><FaCertificate /> Certificate Management</h2>
        {!certificate && (
          <button 
            className="btn primary" 
            onClick={() => setShowCertificateForm(true)}
            disabled={loading}
          >
            <FaPlus /> Create Certificate
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {showCertificateForm ? (
        <div className="certificate-form-container">
          <h3>Create New Certificate</h3>
          <form onSubmit={handleSubmit} className="certificate-form">
            <div className="form-group">
              <label>Serial Number</label>
              <input 
                type="text" 
                name="serialNumber" 
                value={formData.serialNumber}
                onChange={handleInputChange}
                required 
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Country (2-letter code)</label>
                <input 
                  type="text" 
                  name="country" 
                  value={formData.country}
                  onChange={handleInputChange}
                  placeholder="e.g., US"
                  maxLength="2"
                  required 
                />
              </div>
              
              <div className="form-group">
                <label>State/Province</label>
                <input 
                  type="text" 
                  name="state" 
                  value={formData.state}
                  onChange={handleInputChange}
                  required 
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Locality (City)</label>
              <input 
                type="text" 
                name="locality" 
                value={formData.locality}
                onChange={handleInputChange}
                required 
              />
            </div>
            
            <div className="form-group">
              <label>Organization</label>
              <input 
                type="text" 
                name="organization" 
                value={formData.organization}
                onChange={handleInputChange}
                required 
              />
            </div>
            
            <div className="form-group">
              <label>Common Name (Your Name)</label>
              <input 
                type="text" 
                name="commonName" 
                value={formData.commonName}
                onChange={handleInputChange}
                required 
              />
            </div>
            
            <div className="form-group">
              <label>Public Key</label>
              <textarea 
                name="publicKey" 
                value={formData.publicKey}
                onChange={handleInputChange}
                placeholder="Paste your public key here"
                rows="4"
                required 
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Signature Algorithm</label>
                <select 
                  name="signatureAlgorithm" 
                  value={formData.signatureAlgorithm}
                  onChange={handleInputChange}
                  required
                >
                  <option value="sha256WithRSAEncryption">SHA-256 with RSA</option>
                  <option value="sha384WithRSAEncryption">SHA-384 with RSA</option>
                  <option value="sha512WithRSAEncryption">SHA-512 with RSA</option>
                  <option value="ecdsa-with-SHA256">ECDSA with SHA-256</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Validity (Days)</label>
                <input 
                  type="number" 
                  name="validDays" 
                  min="1" 
                  value={formData.validDays}
                  onChange={handleInputChange}
                  required 
                />
              </div>
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                className="btn secondary"
                onClick={() => setShowCertificateForm(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn primary"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Certificate'}
              </button>
            </div>
          </form>
        </div>
      ) : certificate ? (
        <div className="certificate-details">
          <div className="certificate-card">
            <div className="certificate-header">
              <h3>Digital Certificate</h3>
              <span className={`status-badge ${certificate.isRevoked ? 'revoked' : 'active'}`}>
                {certificate.isRevoked ? 'REVOKED' : 'ACTIVE'}
              </span>
            </div>
            
            <div className="certificate-info">
              <div className="info-row">
                <span className="label">Serial Number:</span>
                <span className="value">{certificate.serialNumber}</span>
              </div>
              
              <div className="info-row">
                <span className="label">Common Name:</span>
                <span className="value">{certificate.commonName}</span>
              </div>
              
              <div className="info-row">
                <span className="label">Organization:</span>
                <span className="value">{certificate.organization}</span>
              </div>
              
              <div className="info-row">
                <span className="label">Valid From:</span>
                <span className="value">
                  {new Date(certificate.validFrom * 1000).toLocaleDateString()}
                </span>
              </div>
              
              <div className="info-row">
                <span className="label">Valid To:</span>
                <span className="value">
                  {new Date(certificate.validTo * 1000).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            <div className="certificate-actions">
              <button 
                className="btn primary"
                onClick={downloadCertificate}
              >
                <FaDownload /> Download Certificate
              </button>
              
              {!certificate.isRevoked && (
                <button 
                  className="btn danger"
                  onClick={() => {
                    // TODO: Implement certificate revocation
                    if (window.confirm('Are you sure you want to revoke this certificate? This action cannot be undone.')) {
                      // Call revokeCertificate method
                      setCertificate(prev => ({ ...prev, isRevoked: true }));
                    }
                  }}
                >
                  Revoke Certificate
                </button>
              )}
            </div>
            
            <div className="certificate-note">
              <FaInfoCircle /> This is a digital certificate issued on the blockchain. Keep it secure and do not share your private key.
            </div>
          </div>
        </div>
      ) : (
        <div className="no-certificate">
          <div className="info-card">
            <FaCertificate className="info-icon" />
            <h3>No Certificate Found</h3>
            <p>You haven't created a digital certificate yet. Click the button below to create one.</p>
            <button 
              className="btn primary" 
              onClick={() => setShowCertificateForm(true)}
            >
              <FaPlus /> Create Certificate
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateManager;
