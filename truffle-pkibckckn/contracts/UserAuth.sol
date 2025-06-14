// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract UserAuth {
    struct User {
        bool exists;
        string username;
        string email;
        bytes publicKey;
    }

    mapping(address => User) private users;
    mapping(bytes => address) private publicKeyToAddress;
    address[] private registeredUsers; // Track all registered user addresses

    event UserRegistered(address indexed user, string email, string username);
    event PublicKeyUpdated(address indexed user, bytes publicKey);

    // Register user with generated public key
    function registerUser(string memory email, string memory username, bytes memory publicKey) public {
        require(bytes(email).length > 0, "Email cannot be empty");
        require(bytes(username).length > 0, "Username cannot be empty");
        require(publicKey.length > 0, "Public key cannot be empty");
        require(!users[msg.sender].exists, "User already registered");
        require(publicKeyToAddress[publicKey] == address(0), "Public key already registered");

        users[msg.sender] = User({
            exists: true,
            username: username,
            email: email,
            publicKey: publicKey
        });

        publicKeyToAddress[publicKey] = msg.sender;
        registeredUsers.push(msg.sender);

        emit UserRegistered(msg.sender, email, username);
    }

    // Generate challenge for authentication
    function generateChallenge(address user) public view returns (bytes memory challenge) {
        require(users[user].exists, "User not registered");
        
        // Generate random number for challenge
        uint256 random = uint256(keccak256(
            abi.encodePacked(
                block.timestamp,
                block.difficulty,
                user
            )
        ));

        // Combine random number with user's public key
        challenge = abi.encodePacked(random, users[user].publicKey);
        return challenge;
    }

    // Verify solution
    function verifySolution(address user, bytes memory solution) public view returns (bool) {
        require(users[user].exists, "User not registered");
        
        // Generate the same challenge
        bytes memory challenge = generateChallenge(user);
        
        // Verify solution matches challenge
        return keccak256(solution) == keccak256(challenge);
    }

    // Get user details
    function getUserDetails(address user) public view returns (string memory, string memory, bytes memory) {
        require(users[user].exists, "User not registered");
        return (users[user].username, users[user].email, users[user].publicKey);
    }

    // Check if user exists
    function isUserRegistered(address user) public view returns (bool) {
        return users[user].exists;
    }

    // Get total number of registered users
    function getUserCount() public view returns (uint) {
        return registeredUsers.length;
    }

    // Get user address by index
    function getUserByIndex(uint index) public view returns (address) {
        require(index < registeredUsers.length, "Index out of bounds");
        return registeredUsers[index];
    }

    // Get all registered users (use with caution for large numbers of users)
    function getAllUsers() public view returns (address[] memory) {
        return registeredUsers;
    }
}
