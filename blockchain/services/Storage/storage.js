var express = require("express");
var bodyParser = require("body-parser");
var app = express();
const Web3 = require('web3');
var solc = require('solc');
var fs = require('fs');
var RLP = require('rlp');
var web3 = new Web3();
const contractTripJSON = require('../../build/contracts/Trip.json')
const contractrequestJSON = require('../../build/contracts/Request.json')
const contractJSON = require('../../build/contracts/Services.json')

web3.setProvider(new web3.providers.HttpProvider('http://127.0.0.1:8545'));

var accounts = [];

web3.eth.getAccounts()
    .then(function (account) {
        accounts = account;
    })

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));


web3.eth.net.getId()
    .then(function (networkId) {
        console.log(networkId);
        const deployedAddress = contractJSON.networks[networkId].address
        console.log(deployedAddress);
        const deployedrequestAddress = contractrequestJSON.networks[networkId].address;
        console.log(deployedrequestAddress);
        const RequestContract = new web3.eth.Contract(contractrequestJSON.abi, deployedrequestAddress);
        const ServiceContract = new web3.eth.Contract(contractJSON.abi, deployedAddress)

        app.post("/pumpAtOilField", function (req, res) {
            RequestContract.methods.trips(req.body.tripId).call()
                .then(function (address) {
                    const TripContract = new web3.eth.Contract(contractTripJSON.abi, address);
                    TripContract.methods.PumpatOilfield(req.body.tripId, req.body.reqTimestamp).send({
                            from: accounts[0],
                            gas: 500000
                        })
                        .on('transactionHash', function (transactionHash) {
                            console.log(transactionHash);
                            res.status(200).send(transactionHash);
                        })
                        .on('error', function (err) {
                            res.status(500).send(err);
                        })
                })
        });

        app.post("/leaveOilField", function (req, res) {
            console.log(req.body)
            RequestContract.methods.trips(req.body.tripId).call()
                .then(function (address) {
                    //console.log("add" + address);
                    const TripContract = new web3.eth.Contract(contractTripJSON.abi, address);
                    TripContract.methods.LeaveOilfield(req.body.tripId, req.body.reqTimestamp).send({
                            from: accounts[0],
                            gas: 500000
                        })
                        .on('transactionHash', function (transactionHash) {
                            res.status(200).send(transactionHash);
                        })
                        .on('error', function (err) {
                            res.status(500).send(err);
                        })
                })
        });

        app.post("/waterpumped", function (req, res) {
            console.log(req.body.waterfilled)
            RequestContract.methods.trips(req.body.tripId).call()
                .then(function (address) {
                    const TripContract = new web3.eth.Contract(contractTripJSON.abi, address);
                    TripContract.methods.WaterPumped(req.body.waterfilled, req.body.tripId, req.body.reqTimestamp).send({
                            from: accounts[0],
                            gas: 500000
                        })
                        .on('transactionHash', function (transactionHash) {
                            res.status(200).send(transactionHash);
                        })
                        .on('error', function (err) {
                            res.status(500).send(err);
                        })
                })
        });

        var server = app.listen(8000, function () {
            console.log("app running on port.", server.address().port);
        });

    })