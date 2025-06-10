import React, { useState, useEffect } from 'react';
import { initWeb3, web3Instance } from '../web3';
import UserAuthABI from '../contracts/UserAuth.json';
import { CONTRACT_ADDRESS } from '../config';
//const CONTRACT_ADDRESS = '0x30EBE9b9d22C160d1754B2f470509b73946Ec52a';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-message">
          <h3>Something went wrong</h3>
          <p>{this.state.error?.message}</p>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [allAccounts, setAllAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [contract, setContract] = useState(null);

  // Initialize contract and fetch accounts
  useEffect(() => {
    const init = async () => {
      try {
        if (!web3Instance) {
          console.log('Web3 instance not initialized');
          await initWeb3();
        }
        
        const contractInstance = new web3Instance.eth.Contract(
          UserAuthABI.abi,
          CONTRACT_ADDRESS
        );
        
        // Get all accounts
        const accounts = await web3Instance.eth.getAccounts();
        console.log('Available accounts:', accounts);
        setAllAccounts(accounts);
        
        // Log contract methods for debugging
        console.log('Contract methods:', Object.keys(contractInstance.methods));
        
        // Test isRegistered call
        if (accounts.length > 0) {
          try {
            const isRegistered = await contractInstance.methods
              .isUserRegistered(accounts[0])
              .call({ from: accounts[0] });
            console.log('Test isRegistered call result:', isRegistered);
          } catch (err) {
            console.error('Error testing isRegistered:', err);
          }
        }
        
        setContract(contractInstance);
      } catch (err) {
        console.error('Initialization error:', err);
        setError(`Failed to initialize: ${err.message}`);
        setLoading(false);
      }
    };

    init();
  }, []);

  // Fetch users and balances
  useEffect(() => {
    const fetchData = async () => {
      if (!contract || allAccounts.length === 0) return;

      try {
        setLoading(true);
        setError('');
        console.log('Fetching data for accounts:', allAccounts);
        
        // Get balances for all accounts
        const balancePromises = allAccounts.map(account => 
          web3Instance.eth.getBalance(account)
        );
        const balances = await Promise.all(balancePromises);

        // Get user registration status and details
    const userPromises = allAccounts.map(async (account, index) => {
    try {
      console.log(`Checking registration for account: ${account}`);
      let isRegistered = false;
      
      try {
        isRegistered = await contract.methods
          .isUserRegistered(account)
          .call({ from: allAccounts[0] });
      } catch (err) {
        console.log(`Account ${account} is not registered or error checking:`, err.message);
      }
  
      console.log(`Account ${account} is registered:`, isRegistered);
  
      // Get balance for the account
      const balance = await web3Instance.eth.getBalance(account);
      const ethBalance = web3Instance.utils.fromWei(balance, 'ether');
  
      let userDetails = { 
        account, 
        balance: ethBalance,
        isRegistered,
        username: 'N/A',
        email: 'N/A',
        publicKey: 'N/A'
      };
  
      if (isRegistered) {
        try {
          console.log(`Fetching details for registered account: ${account}`);
          const result = await contract.methods
            .getUserDetails(account)
            .call({ from: allAccounts[0] });
  
          console.log('Raw user details:', result);
  
          if (result) {
            if (Array.isArray(result)) {
              const [username, email, publicKey] = result;
              userDetails = { 
                ...userDetails, 
                username: username || 'N/A',
                email: email || 'N/A',
                publicKey: publicKey || 'N/A'
              };
            } else if (typeof result === 'object') {
              userDetails = {
                ...userDetails,
                username: result.username || result[0] || 'N/A',
                email: result.email || result[1] || 'N/A',
                publicKey: result.publicKey || result[2] || 'N/A'
              };
            }
          }
        } catch (detailErr) {
          console.error(`Error getting details for ${account}:`, detailErr);
        }
      }
  
      return userDetails;
    } catch (err) {
      console.error(`Error processing account ${account}:`, err);
      return {
        account,
        balance: '0',
        isRegistered: false,
        username: 'Error',
        email: 'Error',
        publicKey: 'Error'
      };
    }
  });

        const userList = (await Promise.all(userPromises)).filter(Boolean);
        console.log('Processed user list:', userList);
        setUsers(userList);
      } catch (err) {
        console.error('Error in fetchData:', err);
        setError(`Failed to load data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [contract, allAccounts]);

  if (loading) {
    return (
      <div className="metaverse-container">
        <div className="loading-spinner"></div>
        <h2>Loading blockchain data...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="metaverse-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
    <div className="metaverse-container">
      <h1 className="metaverse-title">Blockchain Accounts</h1>
      <div className="metaverse-grid">
        {users.map((user, index) => (
          <div key={index} className={`metaverse-card ${user.isRegistered ? 'registered' : 'unregistered'}`}>
            <div className="card-header">
              <h3>Account #{index + 1}</h3>
              <span className={`status-badge ${user.isRegistered ? 'registered' : 'unregistered'}`}>
                {user.isRegistered ? 'Registered' : 'Not Registered'}
              </span>
            </div>
            
            <div className="account-info">
              <div className="info-row">
                <span className="label">Address:</span>
                <span className="value address" title={user.account}>
                  {user.account}
                </span>
              </div>
              
              <div className="info-row">
                <span className="label">Balance:</span>
                <span className="value">{parseFloat(user.balance).toFixed(4)} ETH</span>
              </div>
              
              <div className="info-row">
                <span className="label">Username:</span>
                <span className="value">{user.username}</span>
              </div>
              
              <div className="info-row">
                <span className="label">Email:</span>
                <span className="value">{user.email}</span>
              </div>
              
              <div className="info-row">
                <span className="label">Public Key:</span>
                <span className="value public-key" title={user.publicKey}>
                  {user.publicKey !== 'N/A' 
                    ? `${user.publicKey.slice(0, 12)}...${user.publicKey.slice(-10)}` 
                    : 'N/A'}
                </span>
              </div>
            </div>
            
            <div className="card-footer">
              <span className="account-index">Account {index + 1} of {users.length}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </ErrorBoundary>
  );
};

export default UserList;