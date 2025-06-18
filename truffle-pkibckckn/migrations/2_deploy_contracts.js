const UserAuth = artifacts.require("UserAuth");
const UserCertificateManager = artifacts.require("UserCertificateManager");

module.exports = function (deployer) {
    //deployer.deploy(UserAuth);
    deployer.deploy(UserCertificateManager);
};
