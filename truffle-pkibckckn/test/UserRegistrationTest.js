const UserCertificateManager = artifacts.require("UserCertificateManager");

contract('UserRegistration', (accounts) => {
    let contract;
    const [owner, user1, user2] = accounts;
    
    // Test data
    const email = "test@example.com";
    const username = "testuser";
    const publicKey = web3.utils.asciiToHex("test-public-key-1");

    beforeEach(async () => {
        contract = await UserCertificateManager.new({ from: owner });
    });

    describe('isUserRegistered Functionality', () => {
        it('should return false for unregistered user', async () => {
            // Act
            const isRegistered = await contract.isUserRegistered(user1);
            
            // Assert
            assert.isFalse(isRegistered, "Should return false for unregistered user");
        });

        it('should return true after user registration', async () => {
            // Arrange
            await contract.registerUser(email, username, publicKey, { from: user1 });
            
            // Act
            const isRegistered = await contract.isUserRegistered(user1);
            
            // Assert
            assert.isTrue(isRegistered, "Should return true for registered user");
        });

        it('should return false for zero address', async () => {
            // Arrange
            const zeroAddress = '0x0000000000000000000000000000000000000000';
            
            // Act
            const isRegistered = await contract.isUserRegistered(zeroAddress);
            
            // Assert
            assert.isFalse(isRegistered, "Should return false for zero address");
        });

        it('should return false for different unregistered address', async () => {
            // Arrange
            await contract.registerUser(email, username, publicKey, { from: user1 });
            
            // Act
            const isRegistered = await contract.isUserRegistered(user2);
            
            // Assert
            assert.isFalse(isRegistered, "Should return false for different unregistered address");
        });

        it('should maintain registration state after multiple operations', async () => {
            // Register user
            await contract.registerUser(email, username, publicKey, { from: user1 });
            
            // Check registration
            let isRegistered = await contract.isUserRegistered(user1);
            assert.isTrue(isRegistered, "User should be registered after registration");
            
            // Perform some other operations (e.g., add public key)
            const newPublicKey = web3.utils.asciiToHex("another-public-key");
            await contract.addPublicKey(newPublicKey, { from: user1 });
            
            // Check registration again
            isRegistered = await contract.isUserRegistered(user1);
            assert.isTrue(isRegistered, "User should still be registered after other operations");
        });
    });
});
