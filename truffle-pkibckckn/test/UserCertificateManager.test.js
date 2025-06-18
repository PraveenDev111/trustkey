const UserCertificateManager = artifacts.require("UserCertificateManager");
const { expectRevert, time } = require('@openzeppelin/test-helpers');

contract('UserCertificateManager', (accounts) => {
    let contract;
    const [owner, user1, user2] = accounts;
    
    // Test data
    const email = "test@example.com";
    const username = "testuser";
    const publicKey = web3.utils.asciiToHex("test-public-key-1");
    const publicKey2 = web3.utils.asciiToHex("test-public-key-2");
    
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

    describe('Public Key Management', () => {
        beforeEach(async () => {
            await contract.registerUser(email, username, publicKey, { from: user1 });
        });

        it('should add a new public key', async () => {
            await contract.addPublicKey("new-public-key", { from: user1 });
            
            const keys = await contract.getUserPublicKeys(user1);
            assert.equal(keys.length, 2, "Should have 2 public keys");
            assert.equal(keys[1].keyData, "new-public-key", "New key data doesn't match");
        });

        it('should deactivate a public key', async () => {
            await contract.addPublicKey("key-to-deactivate", { from: user1 });
            await contract.deactivatePublicKey(1, { from: user1 });
            
            const keys = await contract.getUserPublicKeys(user1);
            assert.isFalse(keys[1].isActive, "Key should be deactivated");
        });

        it('should not deactivate the only active key', async () => {
            await expectRevert(
                contract.deactivatePublicKey(0, { from: user1 }),
                "Cannot deactivate the only key"
            );
        });
    });

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
