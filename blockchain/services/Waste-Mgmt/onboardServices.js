var express = require("express");
var bodyParser = require("body-parser");
var app = express();
const Web3 = require('web3');
var solc = require('solc');
var fs = require('fs');
var web3 = new Web3();

web3.setProvider(new web3.providers.HttpProvider('http://127.0.0.1:8545'));

const contractJSON = require('../../build/contracts/Services.json')
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

var accounts = [];

web3.eth.getAccounts()
  .then(function (account) {
    accounts = account;
  })


web3.eth.net.getId()
  .then(function (networkId) {
    console.log(networkId);
    const deployedAddress = contractJSON.networks[networkId].address
    console.log(deployedAddress);
    const ServiceContract = new web3.eth.Contract(contractJSON.abi, deployedAddress)

    app.post("/OnboardWaste", function (req, res) {

      ServiceContract.methods.OnboardWasteMgmt(accounts[0]).send({
          from: accounts[0],
          gas: 4000000
        })
        .on('transactionHash', function (transactionHash) {
          res.status(200).send(transactionHash);
        })
        .on('receipt', function (receipt) {
          ServiceContract.methods.checkWasteMgmt(accounts[0]).call()
            .then(function (tripId) {
              console.log("wasteMgmt=" + tripId);
            })
        })
        .on('error', function (err) {
          res.status(500).send(err);
        })
    });
    app.post("/OnboardOptimizer", function (req, res) {

      ServiceContract.methods.OnboardOptimization(accounts[0]).send({
          from: accounts[0],
          gas: 4000000
        })
        .on('transactionHash', function (transactionHash) {
          res.status(200).send(transactionHash);
        })
        .on('receipt', function (receipt) {
          ServiceContract.methods.checkOptimizer(accounts[0]).call()
            .then(function (tripId) {
              console.log("Optimizer=" + tripId);
            })
        })
        .on('error', function (err) {
          res.status(500).send(err);
        })
    });
    app.post("/OnboardStorage", function (req, res) {

      ServiceContract.methods.OnboardStorage(accounts[0]).send({
          from: accounts[0],
          gas: 4000000
        })
        .on('transactionHash', function (transactionHash) {
          res.status(200).send(transactionHash);
        })
        .on('receipt', function (receipt) {
          ServiceContract.methods.checkStorage(accounts[0]).call()
            .then(function (tripId) {
              console.log("Storage=" + tripId);
            })
        })
        .on('error', function (err) {
          res.status(500).send(err);
        })
    });
    app.post("/OnboardDisposal", function (req, res) {

      ServiceContract.methods.OnboardDisposal(accounts[0]).send({
          from: accounts[0],
          gas: 4000000
        })
        .on('transactionHash', function (transactionHash) {
          res.status(200).send(transactionHash);
        })
        .on('receipt', function (receipt) {
          ServiceContract.methods.checkDisposal(accounts[0]).call()
            .then(function (tripId) {
              console.log("Disposal=" + tripId);
            })
        })
        .on('error', function (err) {
          res.status(500).send(err);
        })
    });


    var server = app.listen(2000, function () {
      console.log("app running on port.", server.address().port);
    });
  })