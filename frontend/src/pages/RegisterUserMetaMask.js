import React, { useState, useEffect } from 'react';
//import crypto from 'crypto';
// eslint-disable-next-line
import { initWeb3, initContract, web3Instance } from '../web3';
import { Link } from 'react-router-dom';
import logo from '../assets/trustkey2.png';
import { CONTRACT_ADDRESS } from '../config';
import { FaArrowLeft } from 'react-icons/fa';
import './RegisterUserMetaMask.css';

const RegisterUserMetaMask = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // eslint-disable-next-line
  const [success, setSuccess] = useState('');
  const [contract, setContract] = useState(null);
  // No public/private key state needed for registration anymore
  // const [publicKey, setPublicKey] = useState('');
  // const [privateKey, setPrivateKey] = useState('');
  // const [copied, setCopied] = useState(false);

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

  // Key pair generation removed. Registration no longer requires a key pair.

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !username) {
      setError('Please fill in email and username');
      return;
    }
  
    setLoading(true);
    setError('');
  
    try {
      console.log('1. Getting accounts from MetaMask...');
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const metaMaskAccount = accounts[0];
      console.log('2. MetaMask account:', metaMaskAccount);
  
      // No public key conversion or key bytes needed. Prepare transaction without public key.
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
          username
        ).encodeABI()
      };
      try {
        console.log('8. Sending transaction...');
        // First, estimate gas
        const gasEstimate = await contract.methods.registerUser(
          email, 
          username
        ).estimateGas({ from: metaMaskAccount });
        
        console.log('Estimated gas:', gasEstimate);
        
        // Add 20% buffer to the gas estimate using web3 utils
        const gasWithBuffer = Math.floor(Number(gasEstimate) * 1.2);
        const gasLimitHex = web3Instance.utils.toHex(gasWithBuffer);
        
        // Get current gas price
        const gasPrice = await web3Instance.eth.getGasPrice();
        console.log('Current gas price:', gasPrice);
        
        // Update transaction with proper hex values
        const tx = {
          from: metaMaskAccount,
          to: CONTRACT_ADDRESS,
          nonce: web3Instance.utils.toHex(nonce),
          gasPrice: gasPrice,
          gasLimit: gasLimitHex,
          data: contract.methods.registerUser(
            email, 
            username
          ).encodeABI()
        };
        
        console.log('Transaction details:', {
          ...tx,
          gasLimit: gasLimitHex,
          gasPrice: gasPrice.toString()
        });
        
        // Send the transaction
        const receipt = await web3Instance.eth.sendTransaction(tx);
        console.log('9. Transaction receipt:', receipt);
      } catch (error) {
        console.error('Transaction error:', error);
        if (error.message.includes('revert')) {
          console.error('Transaction reverted. Check if:');
          console.error('1. Contract is paused');
          console.error('2. You have the required permissions');
          console.error('3. Input parameters are correct');
        }
        throw error;
      }
  
      // Store the private key securely (in a real app, use proper encryption)
      // For demo purposes only - in production, use secure storage solutions
      const userData = {
        email,
        username,
        address: metaMaskAccount
      };
      console.log('User data to be stored:', userData);
  
      // Reset form
      setEmail('');
      setUsername('');
      alert('Registration successful!');
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
                type="submit"
                className="btn btn-primary"
                disabled={loading || !contract}
              >
                {loading ? 'Processing...' : 'Register with MetaMask'}
              </button>
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
