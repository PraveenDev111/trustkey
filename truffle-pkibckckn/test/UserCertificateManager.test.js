const UserCertificateManager = artifacts.require("UserCertificateManager");
const { expectRevert, time } = require('@openzeppelin/test-helpers');

contract('UserCertificateManager', (accounts) => {
    let contract;
    const [owner, user1, user2] = accounts;
    
    // Test data
    const email = "test@example.com";
    const username = "testuser";
    const publicKeyStr = "test-public-key-1";
    const publicKey2Str = "test-public-key-2";
    const publicKeyHex = web3.utils.asciiToHex(publicKeyStr);
    const publicKey2Hex = web3.utils.asciiToHex(publicKey2Str);
    
    // Certificate data
    const certData = {
        serialNumber: "CERT-123",
        country: "US",
        state: "California",
        locality: "San Francisco",
        organization: "Test Org",
        commonName: "test.example.com",
        signatureAlgorithm: "SHA256withRSA",
        validDays: 365
    };

    beforeEach(async () => {
        contract = await UserCertificateManager.new({ from: owner });
    });
/*
    describe('User Registration', () => {
        it('should register a new user', async () => {
            await contract.registerUser(email, username, publicKey, { from: user1 });
            
            const result = await contract.getUserDetails(user1);
            assert.equal(result[0], username, "Username doesn't match");
            assert.equal(result[1], email, "Email doesn't match");
            assert.equal(result[2], publicKey, "Public key doesn't match");
            
            const isRegistered = await contract.isUserRegistered(user1);
            assert.isTrue(isRegistered, "User should be registered");
        });

        it('should prevent duplicate registration', async () => {
            await contract.registerUser(email, username, publicKey, { from: user1 });
            await expectRevert(
                contract.registerUser(email, username, publicKey, { from: user1 }),
                "User already registered"
            );
        });

        it('should prevent duplicate public key', async () => {
            await contract.registerUser(email, username, publicKey, { from: user1 });
            await expectRevert(
                contract.registerUser("another@email.com", "anotheruser", publicKey, { from: user2 }),
                "Public key already registered"
            );
        });
    });
*/
    describe('Public Key Management', () => {
        beforeEach(async () => {
            // Register user with hex-encoded public key
            await contract.registerUser(email, username, publicKeyHex, { from: user1 });
            // Add the same public key to the public keys array as a string
            await contract.addPublicKey(publicKeyStr, { from: user1 });
        });

        it('should add a new public key', async () => {
            const testKey = 'new-public-key';
            const testKeyHex = web3.utils.asciiToHex(testKey);
            const tx = await contract.addPublicKey(testKey, { from: user1 });
            
            // Check event emission
            assert.equal(tx.logs[0].event, 'PublicKeyAdded', 'PublicKeyAdded event should be emitted');
            assert.equal(tx.logs[0].args.user, user1, 'Event should include user address');
            
            // Check key was added
            const keys = await contract.getUserPublicKeys(user1);
            assert.equal(keys.length, 2, 'Should have 2 public keys');
            assert.equal(keys[1].keyData, testKey, 'New key data should match');
            assert.isTrue(keys[1].isActive, 'New key should be active');
            assert.isAbove(Number(keys[1].addedAt), 0, 'Added timestamp should be set');
        });

        it('should retrieve multiple public keys', async () => {
            // Add two more keys
            const key2 = 'key-2';
            const key3 = 'key-3';
            
            await contract.addPublicKey(key2, { from: user1 });
            await contract.addPublicKey(key3, { from: user1 });
            
            // Get all keys
            const keys = await contract.getUserPublicKeys(user1);
            
            // Verify all keys are present and in order
            assert.equal(keys.length, 3, 'Should have 3 public keys');
            assert.equal(keys[0].keyData, publicKeyStr, 'First key should match registered key');
            assert.equal(keys[1].keyData, key2, 'Second key should match');
            assert.equal(keys[2].keyData, key3, 'Third key should match');
            
            // Verify all keys are active by default
            assert.isTrue(keys[0].isActive, 'First key should be active');
            assert.isTrue(keys[1].isActive, 'Second key should be active');
            assert.isTrue(keys[2].isActive, 'Third key should be active');
        });

        it('should get active public key', async () => {
            // Add a new key (becomes active)
            const activeKey = 'new-active-key';
            await contract.addPublicKey(web3.utils.asciiToHex(activeKey), { from: user1 });
            
            // Get active key
            const activeKeyFromContract = await contract.getActivePublicKey(user1);
            assert.equal(web3.utils.hexToAscii(activeKeyFromContract), activeKey, 'Should return the active key');
            
            // Verify active key index
            const activeIndex = await contract.activeKeyIndex(user1);
            assert.equal(activeIndex.toString(), '1', 'Active key index should be 1');
        });

        it('should deactivate a public key', async () => {
            // Add two more keys
            const key1 = 'key-to-deactivate';
            const key2 = 'backup-key';
            
            await contract.addPublicKey(key1, { from: user1 });
            await contract.addPublicKey(key2, { from: user1 });
            
            // Get keys before deactivation
            const keysBefore = await contract.getUserPublicKeys(user1);
            
            // Deactivate the middle key (index 1)
            const tx = await contract.deactivatePublicKey(1, { from: user1 });
            
            // Check event
            assert.equal(tx.logs[0].event, 'PublicKeyDeactivated', 'PublicKeyDeactivated event should be emitted');
            assert.equal(tx.logs[0].args.user, user1, 'Event should include user address');
            assert.equal(tx.logs[0].args.keyIndex.toString(), '1', 'Event should include key index');
            
            // Verify key is deactivated
            const keys = await contract.getUserPublicKeys(user1);
            assert.isFalse(keys[1].isActive, 'Key at index 1 should be deactivated');
            assert.isTrue(keys[0].isActive, 'First key should remain active');
            assert.isTrue(keys[2].isActive, 'Other keys should remain active');
            
            // Active key should be the most recently added active key (index 2)
            const activeKey = await contract.getActivePublicKey(user1);
            assert.equal(web3.utils.hexToAscii(activeKey), key2, 'Should return the most recent active key');
        });
        
        it('should prevent deactivating the only active key', async () => {
            // Try to deactivate the only key (should fail)
            await expectRevert(
                contract.deactivatePublicKey(0, { from: user1 }),
                "Cannot deactivate the only active key"
            );
            
            // Verify key is still active
            const keys = await contract.getUserPublicKeys(user1);
            assert.isTrue(keys[0].isActive, 'Key should still be active');
        });
        
        it('should track key addition timestamps', async () => {
            // Get current block timestamp
            const block = await web3.eth.getBlock('latest');
            const currentTime = block.timestamp;
            
            // Add a new key
            const newKey = 'new-key-with-timestamp';
            await contract.addPublicKey(newKey, { from: user1 });
            
            // Get the key info
            const keys = await contract.getUserPublicKeys(user1);
            const newKeyInfo = keys[keys.length - 1];
            
            // Verify timestamp is set and reasonable (within 5 seconds)
            const keyTime = Number(newKeyInfo.addedAt);
            assert.isAtLeast(keyTime, currentTime, 'Key timestamp should be after test start');
            assert.isAtMost(keyTime, currentTime + 5, 'Key timestamp should be within 5 seconds');
        });

        
        
       
    });
/*
    describe('Certificate Management', () => {
        beforeEach(async () => {
            await contract.registerUser(email, username, publicKey, { from: user1 });
        });

        it('should issue a certificate', async () => {
            await contract.issueCertificate(
                certData.serialNumber,
                certData.country,
                certData.state,
                certData.locality,
                certData.organization,
                certData.commonName,
                "cert-public-key",
                certData.signatureAlgorithm,
                certData.validDays,
                { from: user1 }
            );

            const cert = await contract.getCertificateInfo(user1);
            assert.equal(cert.serialNumber, certData.serialNumber, "Serial number doesn't match");
            assert.equal(cert.commonName, certData.commonName, "Common name doesn't match");
            assert.isFalse(cert.isRevoked, "Certificate should not be revoked");
        });

        it('should revoke a certificate', async () => {
            await issueTestCertificate(user1);
            
            await contract.revokeCertificate("Test revocation", { from: user1 });
            
            const cert = await contract.getCertificateInfo(user1);
            assert.isTrue(cert.isRevoked, "Certificate should be revoked");
            
            // Check if all keys are deactivated
            const keys = await contract.getUserPublicKeys(user1);
            for (let key of keys) {
                assert.isFalse(key.isActive, "All keys should be deactivated after revocation");
            }
        });
    });

    describe('Authentication', () => {
        beforeEach(async () => {
            await contract.registerUser(email, username, publicKey, { from: user1 });
        });

        it('should generate and verify a challenge', async () => {
            // Generate a challenge
            const challenge = await contract.generateChallenge(user1);
            
            // The challenge is a packed uint256, we'll use it directly as the solution
            // since verifySolution compares keccak256(solution) with keccak256(challenge)
            const solution = challenge;
            
            // Verify the solution
            const isValid = await contract.verifySolution(user1, solution);
            assert.isTrue(isValid, "Solution should be valid");
            
            // Test with an incorrect solution (should fail)
            const wrongSolution = web3.utils.keccak256("wrong-solution");
            const isInvalid = await contract.verifySolution(user1, wrongSolution);
            assert.isFalse(isInvalid, "Incorrect solution should be invalid");
        });
    });

    describe('User Management', () => {
        it('should get user count', async () => {
            let count = await contract.getUserCount();
            assert.equal(count, 0, "Initial user count should be 0");
            
            await contract.registerUser(email, username, publicKey, { from: user1 });
            
            count = await contract.getUserCount();
            assert.equal(count, 1, "User count should be 1 after registration");
        });

        it('should get user by index', async () => {
            await contract.registerUser(email, username, publicKey, { from: user1 });
            
            const userAddress = await contract.getUserByIndex(0);
            assert.equal(userAddress, user1, "User address doesn't match");
        });

        it('should get all users', async () => {
            await contract.registerUser(email, username, publicKey, { from: user1 });
            await contract.registerUser("user2@example.com", "user2", publicKey2, { from: user2 });
            
            const users = await contract.getAllUsers();
            assert.equal(users.length, 2, "Should return all users");
            assert.include(users, user1, "User1 should be in the list");
            assert.include(users, user2, "User2 should be in the list");
        });

        it('should get all user details', async () => {
            await contract.registerUser(email, username, publicKey, { from: user1 });
            await contract.registerUser("user2@example.com", "user2", publicKey2, { from: user2 });
            
            const users = await contract.getAllUsers();
            assert.equal(users.length, 2, "Should return all users");
            assert.include(users, user1, "User1 should be in the list");
            assert.include(users, user2, "User2 should be in the list");
        });

            
    });
    */

    // Helper function to issue a test certificate
    async function issueTestCertificate(user) {
        return contract.issueCertificate(
            certData.serialNumber,
            certData.country,
            certData.state,
            certData.locality,
            certData.organization,
            certData.commonName,
            "cert-public-key",
            certData.signatureAlgorithm,
            certData.validDays,
            { from: user }
        );
    }
});
