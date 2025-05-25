import React, { useState, useEffect } from 'react';
import crypto from 'crypto';
import { initWeb3, initContract, web3Instance } from '../web3';

const Login = () => {
  const [username, setUsername] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [challenge, setChallenge] = useState('');
  const [contract, setContract] = useState(null);
  const [userAddress, setUserAddress] = useState(null);

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

  const generateChallenge = async () => {
    if (!username) {
      setError('Please enter username');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Get user's address from username
      const userAddress = await contract.methods.getUserAddress(username).call();
      if (userAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('User not found');
      }
      setUserAddress(userAddress);

      // Generate challenge
      const challenge = await contract.methods.generateChallenge(userAddress).call();
      setChallenge(`0x${challenge}`);
    } catch (error) {
      console.error('Challenge generation error:', error);
      setError(error.message || 'Failed to generate challenge');
    } finally {
      setLoading(false);
    }
  };

  const solveChallenge = async () => {
    if (!privateKey || !challenge) {
      setError('Please enter private key and generate challenge first');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Convert hex strings to bytes
      const privateKeyBytes = web3Instance.utils.hexToBytes(privateKey);
      const challengeBytes = web3Instance.utils.hexToBytes(challenge);

      // Solve challenge using private key
      const keyPair = crypto.createECDH('secp256k1');
      keyPair.setPrivateKey(privateKeyBytes);
      
      // Generate solution
      const solution = keyPair.computeSecret(challengeBytes);
      const solutionHex = `0x${solution.toString('hex')}`;

      // Verify solution on-chain
      const isValid = await contract.methods.verifySolution(userAddress, solutionHex).call();
      
      if (isValid) {
        alert('Login successful!');
        // Here you would typically redirect to the main application
      } else {
        throw new Error('Invalid solution');
      }
    } catch (error) {
      console.error('Challenge solution error:', error);
      setError(error.message || 'Login failed');
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
      <h2>Login</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
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
        <button type="button" onClick={generateChallenge} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Challenge'}
        </button>
      </div>
      {challenge && (
        <div>
          <label>Private Key:</label>
          <input
            type="password"
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            required
          />
          <button type="button" onClick={solveChallenge} disabled={loading}>
            {loading ? 'Verifying...' : 'Solve Challenge'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Login;