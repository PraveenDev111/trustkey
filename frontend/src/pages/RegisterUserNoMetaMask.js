import React, { useState, useEffect } from 'react';
//import crypto from 'crypto';
import { initWeb3, initContract, web3Instance } from '../web3';
import { ec as EC } from 'elliptic';

const RegisterUserNoMetaMask = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [contract, setContract] = useState(null);
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');

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

    if (!publicKey) {
      setError('Please generate keys first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Convert hex string to bytes
      const publicKeyBytes = web3Instance.utils.hexToBytes(publicKey);
      const account = web3Instance.eth.accounts.privateKeyToAccount(privateKey);
  
      // Add the account to web3's wallet
      web3Instance.eth.accounts.wallet.add(account);
      web3Instance.eth.defaultAccount = account.address;
  
      // Register the user
      await contract.methods.registerUser(email, username, publicKeyBytes).send({
        from: account.address,
        gas: 3000000 // Adjust gas limit as needed
      });
  
      // Reset form
      setEmail('');
      setUsername('');
      setPublicKey('');
      setPrivateKey('');
  
      alert('Registration successful! Please keep your private key secure.');
    } catch (error) {
      console.error('Registration failed:', error);
      setError(error.message || 'Registration failed');
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
          <button type="button" onClick={generateKeys} disabled={loading}>
            {loading ? 'Generating...' : 'Generate Keys'}
          </button>
        </div>
        {publicKey && (
          <div>
            <h3>Generated Keys:</h3>
            <div>
              <label>Public Key:</label>
              <textarea
                value={publicKey}
                readOnly
                rows={2}
              />
            </div>
            <div>
              <label>Private Key (Keep Secure):</label>
              <textarea
                value={privateKey}
                readOnly
                rows={2}
              />
            </div>
          </div>
        )}
        <button type="submit" disabled={loading || !publicKey}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
};

export default RegisterUserNoMetaMask;
