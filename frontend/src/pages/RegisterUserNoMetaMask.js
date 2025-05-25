import React, { useState, useEffect } from 'react';
import crypto from 'crypto';
import { initWeb3, initContract, web3Instance } from '../web3';

const RegisterUserNoMetaMask = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [contract, setContract] = useState(null);
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');

  useEffect(() => {
    const initializeContract = async () => {
      try {
        const contractInstance = await initContract();
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
      // Generate private key (32 bytes)
      const privateKeyBytes = crypto.randomBytes(32);
      const privateKeyHex = `0x${privateKeyBytes.toString('hex')}`;
      setPrivateKey(privateKeyHex);

      // Generate public key from private key using ECDSA
      const keyPair = crypto.createECDH('secp256k1');
      keyPair.setPrivateKey(privateKeyBytes);
      const publicKeyBytes = keyPair.getPublicKey();
      const publicKeyHex = `0x${publicKeyBytes.toString('hex')}`;
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

      // Register the user
      await contract.methods.registerUser(email, username, publicKeyBytes).send({
        from: '0x0000000000000000000000000000000000000000' // Using a special address for non-MetaMask
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
