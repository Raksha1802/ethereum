const csvFilePath = './input.csv'
const csv = require('csvtojson')
const Web3 = require('web3');
var solc = require('solc');
var fs = require('fs');
var web3 = new Web3();
const contractTripJSON = require('../../build/contracts/Trip.json')
const contractrequestJSON = require('../../build/contracts/Request.json')
const contractJSON = require('../../build/contracts/Services.json')
//const contractReputJSON = require('../../build/contracts/Reputation.json')


web3.setProvider(new web3.providers.WebsocketProvider('ws://127.0.0.1:8545'));

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
        //const deployedreputaddress = contractReputJSON.networks[networkId].address;
        //console.log("reput" + deployedreputaddress);
        const deployedrequestAddress = contractrequestJSON.networks[networkId].address;
        console.log(deployedrequestAddress);
        const RequestContract = new web3.eth.Contract(contractrequestJSON.abi, deployedrequestAddress);
        const ServiceContract = new web3.eth.Contract(contractJSON.abi, deployedAddress)
        //const ReputContract = new web3.eth.Contract(contractReputJSON.abi, deployedreputaddress)


        csv()
            .fromFile(csvFilePath)
            .then(function (jsonObj) {

                jsonObj.forEach(function (item) {
                    //console.log(item);
                    opentrips(item);
                })
            });

        function onboard() {

            ServiceContract.methods.OnboardDisposal(accounts[0]).send({
                    from: accounts[0],
                    gas: 4000000
                })
                .on('transactionHash', function (transactionHash) {
                    console.log(transactionHash);
                })
                .on('receipt', function (receipt) {
                    ServiceContract.methods.checkDisposal(accounts[0]).call()
                        .then(function (tripId) {
                            console.log("Disposal=" + tripId);
                        })
                })

            ServiceContract.methods.OnboardStorage(accounts[0]).send({
                    from: accounts[0],
                    gas: 4000000
                })
                .on('transactionHash', function (transactionHash) {
                    console.log(transactionHash)
                })
                .on('receipt', function (receipt) {
                    ServiceContract.methods.checkStorage(accounts[0]).call()
                        .then(function (tripId) {
                            console.log("Storage=" + tripId);
                        })
                })

            ServiceContract.methods.OnboardWasteMgmt(accounts[0]).send({
                    from: accounts[0],
                    gas: 4000000
                })
                .on('transactionHash', function (transactionHash) {
                    console.log(transactionHash);

                })
                .on('receipt', function (receipt) {
                    ServiceContract.methods.checkWasteMgmt(accounts[0]).call()
                        .then(function (tripId) {
                            console.log("wasteMgmt=" + tripId);
                        })
                })
        }
        onboard();

        function opentrips(data) {
            //console.log("data=" + data);
            var flan = data.flan;
            var str = " ";
            var flon = data.flon;
            var dlan = data.dlan;
            var dlon = data.dlon;
            var rlat = flan.concat(str, flon, str, dlan, str, dlon);
            console.log(rlat);
            var val1 = web3.utils.fromAscii(data.fieldId);
            var val2 = web3.utils.fromAscii(data.tankId);
            var val3 = web3.utils.fromAscii(data.disposalTankId);
            RequestContract.methods.FetchOnboardContract(deployedAddress).send({
                    from: accounts[0],
                    gas: 400000
                })
                .on('receipt', function (receipt) {
                    RequestContract.methods.createTrip(parseInt(data.capacity), val1, val2, val3, rlat, parseInt(data.cost), parseInt(data.hours), new Date().getTime()).send({
                            from: accounts[0],
                            gas: 5000000
                        })
                        .on('transactionHash', function (transactionHash) {
                            console.log(transactionHash)
                        })
                        .on('error', function (err) {
                            console.log(err);
                        })
                })
        }
    })