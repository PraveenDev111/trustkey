const UserAuth = artifacts.require("UserAuth");
const CertificateManager = artifacts.require("CertificateManager");
const UserCertificateManager = artifacts.require("UserCertificateManager");

module.exports = function(deployer) {
  // Deploy the original contracts (for backward compatibility)
  deployer.deploy(UserAuth);
  deployer.deploy(CertificateManager);
  
  // Deploy the new merged contract
  deployer.deploy(UserCertificateManager);
};
