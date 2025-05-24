import React, { useState, useEffect } from 'react';
import { initWeb3, initContract, getCurrentAccount, web3Instance } from '../web3';

const RegisterUser = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [publicKeyHex, setPublicKeyHex] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [web3Initialized, setWeb3Initialized] = useState(false);
  const [contractInitialized, setContractInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Initializing application...');
        const initialized = await initWeb3();
        setWeb3Initialized(initialized);
        
        if (!initialized) {
          setError('Failed to initialize web3');
          return;
        }

        const currentAccount = await getCurrentAccount();
        if (!currentAccount) {
          setError('Failed to get current account');
          return;
        }
        setAccount(currentAccount);

        const contractInstance = await initContract();
        if (!contractInstance) {
          setError('Failed to initialize contract');
          return;
        }
        setContract(contractInstance);
        setContractInitialized(true);

      } catch (error) {
        console.error('Initialization error:', error);
        setError('Failed to initialize application');
      }
    };

    initializeApp();
  }, []);

  const validatePublicKey = (hexString) => {
    // Public key should be a valid hex string
    if (!hexString) return false;
    if (!/^0x[0-9a-fA-F]+$/.test(hexString)) return false;
    // Public key length should be 64 bytes (128 hex chars + 0x prefix)
    if (hexString.length !== 130) return false;
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!email || !username || !publicKeyHex) {
      setError('Please fill in all fields');
      return;
    }

    // Validate public key format
    if (!validatePublicKey(publicKeyHex)) {
      setError('Invalid public key format. Please provide a valid ECDSA public key in hex format');
      return;
    }

    try {
      setError('');
      setLoading(true);
      
      // Convert hex string to bytes
      const publicKeyBytes = web3Instance.utils.hexToBytes(publicKeyHex);

      // Register the user
      await contract.methods.registerPublicKey(email, username, publicKeyBytes).send({
        from: account
      });

      // Reset form
      setEmail('');
      setUsername('');
      setPublicKeyHex('');
    } catch (error) {
      console.error('Registration failed:', error);
      setError(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (!web3Initialized) {
    return (
      <div>
        <h2>Please connect your Ethereum wallet</h2>
        <button onClick={() => initWeb3().then(setWeb3Initialized)}>Connect Wallet</button>
      </div>
    );
  }

  if (!contractInitialized) {
    return (
      <div>
        <h2>Initializing contract...</h2>
        <p>Please wait while we connect to the blockchain.</p>
        <p>Current account: {account}</p>
        <p>Network: {web3Instance?.currentProvider?.networkVersion}</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Register User</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Public Key (hex):</label>
          <input
            type="text"
            value={publicKeyHex}
            onChange={(e) => setPublicKeyHex(e.target.value)}
            required
            placeholder="0x... (128 hex characters)"
          />
          <p style={{ fontSize: '0.8em', color: '#666' }}>
            Public key should be 64 bytes (128 hex characters) in hex format with 0x prefix
          </p>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
};

export default RegisterUser;
