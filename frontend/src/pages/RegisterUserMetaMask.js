import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { EC } from 'elliptic';
import { initContract, web3Instance } from '../utils/web3';
import { logEvent, withPerformanceLogging } from '../utils/logger';
import '../styles/RegisterUserMetaMask.css';
import logo from '../assets/trustkey2.png';
import { CONTRACT_ADDRESS } from '../config';
import { FaArrowLeft, FaKey, FaCopy, FaCheck } from 'react-icons/fa';

const RegisterUserMetaMask = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [contract, setContract] = useState(null);
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  // Initialize web3 and contract
  useEffect(() => {
    console.log('Component mounted, initializing contract and web3...');
    
    const initialize = async () => {
      try {
        console.log('Initializing web3 and contract...');
        const contractInstance = await initContract();
        console.log('Contract instance:', contractInstance ? 'Success' : 'Failed');
        
        if (window.ethereum && contractInstance) {
          // Request account access if needed
          await window.ethereum.enable();
          setContract(contractInstance);
          
          // Log successful initialization
          await logEvent('web3_initialized', null, {
            networkId: await web3Instance.eth.net.getId(),
            contractAddress: CONTRACT_ADDRESS
          });
        } else {
          throw new Error('Failed to initialize Web3 or contract');
        }
      } catch (error) {
        console.error('Initialization error:', error);
        setError('Failed to initialize Web3 and contract');
        logEvent('initialization_error', null, {
          error: error.message,
          stack: error.stack
        });
      }
    };
    
    initialize();
  }, []);

  // Generate key pair
  const generateKeys = async () => {
    try {
      await logEvent('key_generation_started', null);
      
      const { result: keys, duration } = await withPerformanceLogging(
        'generate_keys',
        async () => {
          // Generate random private key
          const privateKeyHex = ethers.utils.hexlify(ethers.utils.randomBytes(32));
          
          // Generate public key from private key
          const ec = new EC('secp256k1');
          const keyPair = ec.keyFromPrivate(privateKeyHex.replace('0x', ''), 'hex');
          const publicKeyHex = '0x' + keyPair.getPublic('hex');
          
          return { publicKeyHex, privateKeyHex };
        },
        { step: 'key_generation' }
      );
      
      setPrivateKey(keys.privateKeyHex);
      setPublicKey(keys.publicKeyHex);
      
      // Log successful key generation
      await logEvent('key_generation_success', null, { 
        duration,
        publicKey: keys.publicKeyHex,
        privateKeyLength: keys.privateKeyHex.length
      });
      
      return keys;
    } catch (error) {
      console.error('Key generation error:', error);
      setError('Failed to generate keys');
      
      // Log key generation failure
      await logEvent('key_generation_error', null, {
        error: error.message,
        stack: error.stack
      });
      
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    setError('');
    
    let metaMaskAccount;
    
    try {
      // Log registration attempt
      await logEvent('registration_started', null, { username, email });
      
      // 1. Get accounts from MetaMask
      await logEvent('metamask_connection_started', null);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      metaMaskAccount = accounts[0];
      await logEvent('metamask_connected', metaMaskAccount, { accountCount: accounts.length });
  
      // 2. Generate keys if not already generated
      if (!publicKey || !privateKey) {
        await logEvent('key_generation_required', metaMaskAccount);
        const keys = await generateKeys();
        if (!keys) throw new Error('Failed to generate keys');
      }
      
      // 3. Convert public key to bytes
      await logEvent('preparing_public_key', metaMaskAccount);
      const cleanPublicKey = publicKey.startsWith('0x') ? publicKey : `0x${publicKey}`;
      const publicKeyBytes = web3Instance.utils.hexToBytes(cleanPublicKey);
      
      // 4. Check account balance
      await logEvent('checking_balance', metaMaskAccount);
      const balance = await web3Instance.eth.getBalance(metaMaskAccount);
      const balanceEth = web3Instance.utils.fromWei(balance, 'ether');
      await logEvent('balance_checked', metaMaskAccount, { balance: balanceEth });
      
      if (parseFloat(balanceEth) < 0.001) {
        throw new Error('Insufficient balance for transaction');
      }
  
      // 5. Get transaction nonce
      await logEvent('getting_nonce', metaMaskAccount);
      const nonce = await web3Instance.eth.getTransactionCount(metaMaskAccount, 'pending');
      
      // 6. Prepare transaction
      await logEvent('preparing_transaction', metaMaskAccount, { nonce });
      const gasPrice = await web3Instance.eth.getGasPrice();
      const tx = {
        from: metaMaskAccount,
        to: CONTRACT_ADDRESS,
        nonce: web3Instance.utils.toHex(nonce),
        gasPrice,
        gasLimit: web3Instance.utils.toHex(300000),
        data: contract.methods.registerUser(
          email, 
          username, 
          publicKeyBytes
        ).encodeABI()
      };
  
      // 7. Send transaction
      await logEvent('sending_transaction', metaMaskAccount, {
        to: tx.to,
        value: '0',
        gasPrice: gasPrice.toString(),
        gasLimit: tx.gasLimit
      });
      
      const receipt = await web3Instance.eth.sendTransaction(tx);
      
      // 8. Log successful transaction
      await logEvent('transaction_successful', metaMaskAccount, {
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed
      });
  
      // 9. Prepare user data (without private key for security)
      const userData = {
        email,
        username,
        publicKey,
        address: metaMaskAccount,
        registeredAt: new Date().toISOString()
      };
      
      // 10. Log successful registration
      await logEvent('registration_complete', metaMaskAccount, {
        username,
        email,
        publicKey: publicKey.substring(0, 10) + '...' // Log partial key for reference
      });
  
      // Reset form
      setEmail('');
      setUsername('');
      setPublicKey('');
      setPrivateKey('');
  
      setSuccess('Registration successful! Please keep your private key secure.');
      
      // Navigate to login after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (error) {
      console.error('Registration failed:', error);
      
      // Log the error with detailed information
      await logEvent('registration_failed', metaMaskAccount, {
        error: error.message,
        errorCode: error.code,
        username,
        email,
        stack: error.stack?.substring(0, 500) // Log first 500 chars of stack trace
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
