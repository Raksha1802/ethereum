var Request = artifacts.require("./Request.sol");
var Services = artifacts.require("./Services.sol");
var Trip = artifacts.require("./Trip.sol");
//var Reputation = artifacts.require("./Reputation.sol");

module.exports = function (deployer) {
  deployer.deploy(Services);
  deployer.link(Services, [Request]);
  //deployer.deploy(Reputation);
  //deployer.link(Reputation, [Request]);
  deployer.deploy(Request);
  deployer.link(Request, [Trip]);
};
