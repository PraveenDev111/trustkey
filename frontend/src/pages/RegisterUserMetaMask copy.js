import React, { useState, useEffect } from 'react';
//import crypto from 'crypto';
// eslint-disable-next-line
import { initWeb3, initContract, web3Instance } from '../web3';
import { Link } from 'react-router-dom';
import logo from '../assets/trustkey2.png';
import { ec as EC } from 'elliptic';
import { CONTRACT_ADDRESS } from '../config';
import { FaArrowLeft, FaKey, FaCopy, FaCheck } from 'react-icons/fa';
import './RegisterUserMetaMask.css';

const RegisterUserMetaMask = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // eslint-disable-next-line
  const [success, setSuccess] = useState('');
  const [contract, setContract] = useState(null);
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    console.log('Component mounted, initializing contract...');
    const initializeContract = async () => {
      try {
        console.log('Calling initContract...');
        const contractInstance = await initContract();
        console.log('Contract instance:', contractInstance ? 'Success' : 'Failed');
        if (contractInstance) {
          setContract(contractInstance);
        }
      } catch (error) {
        console.error('Contract initialization error:', error);
        setError('Failed to initialize contract');
      }
    };
    initializeContract();
  }, []);

  // Generate key pair
  const generateKeys = () => {
    try {
      // Generate random private key
      const privateKeyHex = web3Instance.utils.randomHex(32);
      
      // Generate public key from private key
      const ec = new EC('secp256k1');
      const keyPair = ec.keyFromPrivate(privateKeyHex.replace('0x', ''), 'hex');
      const publicKeyHex = '0x' + keyPair.getPublic('hex');
      
      setPrivateKey(privateKeyHex);
      setPublicKey(publicKeyHex);
      
      return { publicKeyHex, privateKeyHex };
    } catch (error) {
      console.error('Key generation error:', error);
      setError('Failed to generate keys');
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !username) {
      setError('Please fill in email and username');
      return;
    }
  
    if (!publicKey || !privateKey) {
      setError('Please generate keys first');
      return;
    }
  
    setLoading(true);
    setError('');
  
    try {
      console.log('1. Getting accounts from MetaMask...');
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const metaMaskAccount = accounts[0];
      console.log('2. MetaMask account:', metaMaskAccount);
  
      console.log('3. Converting public key to bytes...');
      const cleanPublicKey = publicKey.startsWith('0x') ? publicKey : `0x${publicKey}`;
      const publicKeyBytes = web3Instance.utils.hexToBytes(cleanPublicKey);
      console.log('4. Public key bytes:', publicKeyBytes);
  
      console.log('5. Checking MetaMask account balance...');
      const balance = await web3Instance.eth.getBalance(metaMaskAccount);
      console.log('Account balance:', web3Instance.utils.fromWei(balance, 'ether'), 'ETH');
  
      console.log('6. Getting nonce...');
      const nonce = await web3Instance.eth.getTransactionCount(metaMaskAccount, 'pending');
      
      console.log('7. Preparing transaction...');
      const tx = {
        from: metaMaskAccount,
        to: CONTRACT_ADDRESS,
        nonce: web3Instance.utils.toHex(nonce),
        gasPrice: await web3Instance.eth.getGasPrice(),
        gasLimit: web3Instance.utils.toHex(300000),
        data: contract.methods.registerUser(
          email, 
          username, 
          publicKeyBytes
        ).encodeABI()
      };
  
      console.log('8. Sending transaction...');
      const receipt = await web3Instance.eth.sendTransaction(tx);
      
      console.log('9. Transaction receipt:', receipt);
  
      // Store the private key securely (in a real app, use proper encryption)
      // For demo purposes only - in production, use secure storage solutions
      const userData = {
        email,
        username,
        publicKey,
        //privateKey, // In production, encrypt this before storing
        address: metaMaskAccount
      };
      console.log('User data to be stored:', userData);
  
      // Reset form
      setEmail('');
      setUsername('');
      setPublicKey('');
      setPrivateKey('');
  
      alert('Registration successful! Please keep your private key secure.');
    } catch (error) {
      console.error('Registration failed - Full error:', {
        error,
        message: error.message,
        stack: error.stack,
        data: error.data
      });
      setError(`Registration failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  if (!contract) {
    return (
      <div>
        <h2>Initializing...</h2>
        <p>Please wait while we connect to the blockchain.</p>
      </div>
    );
  }

  return (
    <div className="register-container">
      <div className="register-content">
        <div className="register-page-layout">
          <div className="register-card">
            <div className="register-header">
              <div className="logo">
                <img src={logo} alt="TrustKey Logo" className="logo-image" />
              </div>
              <h1>Create Account</h1>
              <p>Register using MetaMask to get started</p>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  className="form-control"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Choose a username"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                />
              </div>

              <button
                type="button" // Important: type is button to prevent form submission
                onClick={generateKeys}
                className="btn btn-secondary"
                disabled={loading} // Disable if already loading from registration
                style={{ marginBottom: '1rem' }} // Add some space below
              >
                <FaKey style={{ marginRight: '8px' }} /> Generate Keys
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !contract || !publicKey} // Also disable if keys are not generated
              >
                {loading ? 'Processing...' : 'Register with MetaMask'}
              </button>

              {/* Private key display section - moved inside the card */}
              {privateKey && (
                <div className="private-key-warning">
                  <h4>Important: Save Your Private Key</h4>
                  <p>This is the only time you'll see your private key. Save it in a secure location.</p>
                  <div className="private-key-display">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{privateKey}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(privateKey);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          color: '#3b82f6', 
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}
                      >
                        {copied ? <FaCheck style={{ color: '#10b981' }} /> : <FaCopy />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </form>
            <Link to="/" className="back-link">
              <FaArrowLeft /> Back to Login
            </Link>
          </div> {/* This closes register-card */}

          <div className="instructions-panel">
            <h2>How This Works:</h2>
            <ol>
              <li>
                <strong>Fill Details:</strong>
                <p>Enter your desired username and email.</p>
              </li>
              <li>
                <strong>Generate Keys:</strong>
                <p>Click the "Generate Keys" button to create your unique cryptographic public and private keys.</p>
              </li>
              <li>
                <strong>IMPORTANT: Secure Private Key:</strong>
                <p>Your private key will appear below the form. <strong>Copy and store it securely.</strong> Losing it means losing account access.</p>
              </li>
              <li>
                <strong>Register:</strong>
                <p>Click "Register with MetaMask".</p>
              </li>
              <li>
                <strong>MetaMask Confirmation:</strong>
                <p>Approve the transaction in the MetaMask pop-up. This links your public key to your account on the blockchain.</p>
              </li>
              <li>
                <strong>Done!</strong>
                <p>Your registration is complete once the transaction is confirmed.</p>
              </li>
            </ol>
          </div>

         
        </div> {/* This closes register-page-layout */}
      </div> {/* This closes register-content */}
    </div>
  );
};

export default RegisterUserMetaMask;
