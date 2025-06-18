import React, { useState, useEffect } from 'react';
import { initWeb3, web3Instance, contractInstance } from '../web3';
import { CONTRACT_ADDRESS } from '../config';

const ContractUserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        console.log('1. Initializing web3...');
        await initWeb3();
        
        if (!web3Instance) {
          throw new Error('Web3 not initialized');
        }

        console.log('2. Web3 initialized, getting contract instance...');
        const contract = contractInstance || new web3Instance.eth.Contract(
          require('../contracts/UserCertificateManager.json').abi,
          CONTRACT_ADDRESS
        );

        console.log('3. Contract instance created, fetching users...');
        
        // First try to get all users directly
        console.log('4. Fetching all user addresses...');
        let userAddresses = [];
        
        try {
          // Try to get all users at once
          userAddresses = await contract.methods.getAllUsers().call();
          console.log('User addresses from getAllUsers():', userAddresses);
        } catch (err) {
          console.log('getAllUsers() failed, trying alternative approach...', err);
          // If getAllUsers fails, try to get users one by one using getUserByIndex
          try {
            const userCount = await contract.methods.getUserCount().call();
            console.log('Total users in contract (getUserCount):', userCount);
            
            if (userCount > 0) {
              userAddresses = [];
              for (let i = 0; i < userCount; i++) {
                const address = await contract.methods.getUserByIndex(i).call();
                if (address && address !== '0x0000000000000000000000000000000000000000') {
                  userAddresses.push(address);
                }
              }
              console.log('User addresses from getUserByIndex:', userAddresses);
            }
          } catch (err2) {
            console.error('Error getting users:', err2);
            throw new Error('Failed to fetch users from the contract');
          }
        }
        
        // If still no users, check if the admin is registered
        if (!userAddresses || userAddresses.length === 0) {
          console.log('5. No users found, checking if admin is registered...');
          const adminAddress = '0x77c7710051E3e9E135a98525fF496F9cfEc45fc6';
          try {
            const isAdminRegistered = await contract.methods.isUserRegistered(adminAddress).call();
            console.log(`Is admin (${adminAddress}) registered?`, isAdminRegistered);
            
            if (isAdminRegistered) {
              const adminDetails = await contract.methods.getUserDetails(adminAddress).call();
              console.log('Admin details:', adminDetails);
              setUsers([{
                address: adminAddress,
                username: adminDetails[0] || 'Admin',
                email: adminDetails[1] || 'admin@example.com',
                publicKey: adminDetails[2] ? '0x' + adminDetails[2].substring(2).toLowerCase() : 'N/A',
                isRegistered: true
              }]);
              setLoading(false);
              return;
            }
          } catch (err) {
            console.error('Error checking admin registration:', err);
          }
        }
        
        if (!userAddresses || userAddresses.length === 0) {
          console.log('No users found in the contract');
          setUsers([]);
          setLoading(false);
          return;
        }

        console.log(`Found ${userAddresses.length} users, fetching details...`);
        const userPromises = userAddresses.map(async (address) => {
          try {
            console.log(`Checking registration for ${address}`);
            const isRegistered = await contract.methods.isUserRegistered(address).call();
            console.log(`User ${address} registered:`, isRegistered);
            
            if (isRegistered) {
              const details = await contract.methods.getUserDetails(address).call();
              console.log(`Details for ${address}:`, details);
              return {
                address,
                username: details[0] || 'N/A',
                email: details[1] || 'N/A',
                publicKey: details[2] ? '0x' + details[2].substring(2).toLowerCase() : 'N/A',
                isRegistered: true
              };
            }
            return {
              address,
              username: 'Not Registered',
              email: 'N/A',
              publicKey: 'N/A',
              isRegistered: false
            };
          } catch (err) {
            console.error(`Error processing user ${address}:`, err);
            return {
              address,
              username: 'Error',
              email: 'Error',
              publicKey: 'Error',
              isRegistered: false,
              error: err.message
            };
          }
        });

        const userList = await Promise.all(userPromises);
        console.log('Final user list:', userList);
        setUsers(userList);
      } catch (err) {
        console.error('Error in fetchUsers:', err);
        setError(`Failed to load users: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading users from blockchain...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '20px' }}>Users from Smart Contract</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Address</th>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Username</th>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Email</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={user.address} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '12px', border: '1px solid #ddd', fontFamily: 'monospace' }}>
                  {user.address}
                </td>
                <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                  <span style={{
                    color: user.isRegistered ? 'green' : 'red',
                    fontWeight: 'bold'
                  }}>
                    {user.isRegistered ? 'Registered' : 'Not Registered'}
                  </span>
                </td>
                <td style={{ padding: '12px', border: '1px solid #ddd' }}>{user.username}</td>
                <td style={{ padding: '12px', border: '1px solid #ddd' }}>{user.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ContractUserList;
