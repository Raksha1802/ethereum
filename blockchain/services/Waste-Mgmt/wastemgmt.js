var express = require("express");
var bodyParser = require("body-parser");
var app = express();
const Web3 = require('web3');
var solc = require('solc');
var fs = require('fs');
var web3 = new Web3();
const eventlistener = require('./eventlistener.js')
const contractTripJSON = require('../../build/contracts/Trip.json')
const contractrequestJSON = require('../../build/contracts/Request.json')
const contractJSON = require('../../build/contracts/Services.json')
//const contractReputJSON = require('../../build/contracts/Reputation.json')
var redis = require("redis")
var subscriber = redis.createClient();
//var publisher = redis.createClient();
var publisher = redis.createClient(6379, process.argv[2]);

web3.setProvider(new web3.providers.WebsocketProvider('ws://127.0.0.1:8545'));

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
        // const deployedreputaddress = contractReputJSON.networks[networkId].address;
        // console.log("reput" + deployedreputaddress);
        const deployedrequestAddress = contractrequestJSON.networks[networkId].address;
        console.log(deployedrequestAddress);
        const RequestContract = new web3.eth.Contract(contractrequestJSON.abi, deployedrequestAddress);
        const ServiceContract = new web3.eth.Contract(contractJSON.abi, deployedAddress)
        //const ReputContract = new web3.eth.Contract(contractReputJSON.abi, deployedreputaddress)

        var opentriparray = {};
        var blockNo = 0;

        function getEvents(callback) {
            RequestContract.getPastEvents('TripCreated', {
                    fromBlock: blockNo,
                    toBlock: 'latest'
                }, function (error, events) {
                    console.log(error);
                })
                .then(function (events) {
                    web3.eth.getBlockNumber()

                        .then(function (block) {
                            console.log("blockNo=" + block);
                            blockNo = block;
                        });
                    var Events = events;
                    Events.forEach(function (item) {

                        var Latlon = item.returnValues.latlon;
                        //console.log(Latlon);
                        var arr = Latlon.split(" ");
                        //console.log("tripId=" + item.returnValues._tripId);
                        var details = {
                            tripId: item.returnValues_tripId,
                            fieldId: web3.utils.hexToAscii(item.returnValues._fieldId).replace(/\u0000/g, ""),
                            tankId: web3.utils.hexToAscii(item.returnValues.tankid).replace(/\u0000/g, ""),
                            tankVolume: item.returnValues.capacity,
                            disposalTankId: web3.utils.hexToAscii(item.returnValues.disposaltankid).replace(/\u0000/g, ""),
                            cost: item.returnValues._amount,
                            Hours: item.returnValues._time,
                            reqTime: item.returnValues.reqtime,
                            fieldLatitude: arr[0],
                            fieldLongitude: arr[1],
                            disposalLatitude: arr[2],
                            disposalLongitude: arr[3]
                        }
                        getRequestEvents(item.returnValues._tripId);
                        opentriparray[item.returnValues._tripId] = details;
                    })
                });
            if (callback) {
                callback();
            }
            setTimeout(getEvents, 20000);
        };

        function getRequestEvents(tripId, callback) {
            //console.log("TripId=" + tripId);

            RequestContract.methods.trips(tripId).call()
                .then(function (address) {
                    const TripContract = new web3.eth.Contract(contractTripJSON.abi, address)

                    TripContract.getPastEvents('TripAccepted', {
                            fromBlock: blockNo,
                            toBlock: 'latest'
                        }, function (error, events) {
                            //console.log(events);
                        })
                        .then(function (events) {
                            //console.log("requestAccepted=" + events);
                            var Events = events;
                            Events.forEach(function (item) {
                                delete opentriparray[item.returnValues._tripId];
                            })

                        })
                })
            if (callback) {
                callback();
            }
        };

        getEvents();

        app.post("/createTrip", function (req, res) {
            var flan = req.body.flan;
            var str = " ";
            var flon = req.body.flon;
            var dlan = req.body.dlan;
            var dlon = req.body.dlon;
            var rlat = flan.concat(str, flon, str, dlan, str, dlon);
            console.log(rlat);
            console.log(req.body);
            var val1 = web3.utils.fromAscii(req.body.fieldId);
            var val2 = web3.utils.fromAscii(req.body.tankId);
            var val3 = web3.utils.fromAscii(req.body.disposalTankId);
            RequestContract.methods.FetchOnboardContract(deployedAddress).send({
                    from: accounts[0],
                    gas: 400000
                })
                .on('receipt', function (receipt) {
                    RequestContract.methods.createTrip(req.body.capacity, val1, val2, val3, rlat, req.body.cost, req.body.hours, req.body.reqTimestamp).send({
                            from: accounts[0],
                            gas: 5000000
                        })
                        .on('transactionHash', function (transactionHash) {
                            console.log(transactionHash)
                            res.status(200).send(transactionHash);
                        })
                        .on('error', function (err) {
                            res.status(500).send(err);
                        })
                })
        });

        app.post("/acceptTrip", function (req, res) {
            console.log(req.body);
            var val1 = web3.utils.fromAscii(req.body.truckId);
            RequestContract.methods.trips(req.body.tripId).call()
                .then(function (address) {
                    console.log(address);
                    const TripContract = new web3.eth.Contract(contractTripJSON.abi, address);
                    TripContract.methods.tripAccept(req.body.truckVolume, val1, req.body.tripId, req.body.reqTimestamp).send({
                            from: accounts[0],
                            gas: 500000
                        })
                        .on('transactionHash', function (transactionHash) {
                            res.status(200).send(transactionHash);
                        })
                        .on('error', function (err) {
                            console.log(err)
                            res.status(500).send(err);
                        })
                })
        });

        app.get("/openTrips/:cache", function (req, res) {
            var cached = [req.params.cache][0];
            if (cached != "true") {
                console.log("functrip=" + opentriparray);
                res.status(200).send(opentriparray);

            } else if (cached == "true") {
                console.log("functrip=" + opentriparray);
                res.status(200).send(opentriparray);
            }
        });

        app.get("/getBookedTrips/:truckId", function (req, res) {
            var tripdetails = []
            var val1 = web3.utils.fromAscii([req.params.truckId][0]);
            RequestContract.methods.getBookedTrips(val1).call()
                .then(function (tripId) {
                    console.log("BookedTrips=" + tripId);
                    let tripPromises = [];
                    let requestTripPromises = [];
                    tripId.forEach(function (item) {
                        const tripListPromise = RequestContract.methods.trips(item).call();
                        requestTripPromises.push(tripListPromise);
                        tripListPromise.then(function (address) {
                            console.log(address);
                            const TripContract = new web3.eth.Contract(contractTripJSON.abi, address);
                            tripPromises.push(TripContract.methods.trip().call())
                        })
                    })
                    console.log(requestTripPromises)
                    Promise.all(requestTripPromises).then((requestTrips) => {
                        Promise.all(tripPromises).then(function (tripResults) {
                            tripResults.forEach(function (item) {
                                console.log(item.events);
                                var details = {
                                    TripId: item.tripId,
                                    FieldId: web3.utils.hexToAscii(item.fieldId).replace(/\u0000/g, ""),
                                    TankId: web3.utils.hexToAscii(item.tankId).replace(/\u0000/g, ""),
                                    Volume: item.tankCapacity,
                                    DisposalTankId: web3.utils.hexToAscii(item.disposalTankId).replace(/\u0000/g, ""),
                                    Cost: item.amount,
                                }
                                tripdetails.push(details);
                            })
                            res.status(200).send(tripdetails);
                        })
                    }).catch(function (err) {
                        console.error(err);
                    });
                })
        });

        app.get("/getActiveTrip/:truckId", function (req, res) {
            var tripdetails = []
            console.log("activetrip request=" + [req.params.truckId][0])
            var val1 = web3.utils.fromAscii([req.params.truckId][0]);
            RequestContract.methods.getActiveTrip(val1).call()
                .then(function (tripId) {
                    console.log("ActiveTrip=" + tripId);
                    if (tripId != "0x0000000000000000000000000000000000000000000000000000000000000000") {
                        RequestContract.methods.trips(tripId).call()
                            .then(function (address) {
                                console.log(address);
                                const TripContract = new web3.eth.Contract(contractTripJSON.abi, address);
                                TripContract.methods.trip().call()
                                    .then(function (item) {
                                        var details = {
                                            TripId: item.tripId,
                                            FieldId: web3.utils.hexToAscii(item.fieldId).replace(/\u0000/g, ""),
                                            TankId: web3.utils.hexToAscii(item.tankId).replace(/\u0000/g, ""),
                                            Volume: item.tankCapacity,
                                            DisposalTankId: web3.utils.hexToAscii(item.disposalTankId).replace(/\u0000/g, ""),
                                            Cost: item.amount,
                                            Capacity_of_truck: item.maxcapacity,
                                            TruckId: web3.utils.hexToAscii(item.truckId).replace(/\u0000/g, ""),
                                            Status: web3.utils.hexToAscii(item.Status).replace(/\u0000/g, ""),
                                        }
                                        tripdetails.push(details);
                                        res.status(200).send(tripdetails);
                                    })
                            })
                    } else {
                        res.status(200).send(tripdetails)
                    }
                })
        });

        app.get("/getCompletedTrip/:truckId", function (req, res) {
            var tripdetails = []
            var val1 = web3.utils.fromAscii([req.params.truckId][0]);
            RequestContract.methods.getAll_Active_Invoices(val1).call()
                .then(function (tripId) {
                    console.log("CompletedTrips=" + tripId);
                    let tripPromises = [];
                    let requestTripPromises = [];
                    tripId.forEach(function (item) {
                        const tripListPromise = RequestContract.methods.trips(item).call();
                        requestTripPromises.push(tripListPromise);
                        tripListPromise.then(function (address) {
                            console.log(address);
                            const TripContract = new web3.eth.Contract(contractTripJSON.abi, address);
                            tripPromises.push(TripContract.methods.trip().call())
                        })
                    })
                    console.log(requestTripPromises)
                    Promise.all(requestTripPromises).then((requestTrips) => {
                        Promise.all(tripPromises).then(function (tripResults) {
                            tripResults.forEach(function (item) {
                                // console.log(item.events);
                                var details = {
                                    TripId: item.tripId,
                                    FieldId: web3.utils.hexToAscii(item.fieldId).replace(/\u0000/g, ""),
                                    TankId: web3.utils.hexToAscii(item.tankId).replace(/\u0000/g, ""),
                                    Volume: item.tankCapacity,
                                    DisposalTankId: web3.utils.hexToAscii(item.disposalTankId).replace(/\u0000/g, ""),
                                    Cost: item.amount,
                                }
                                tripdetails.push(details);
                            })
                            res.status(200).send(tripdetails);
                        })
                    }).catch(function (err) {
                        console.error(err);
                    });
                })
        });

        app.get("/getDriverStatus/:truckId", function (req, res) {
            var tripdetails = []
            var val1 = web3.utils.fromAscii([req.params.truckId][0]);
            RequestContract.methods.checkTruckStatus(val1).call()
                .then(function (tripId) {
                    console.log("checkTruckStatus=" + tripId);
                    res.status(200).send(tripId);
                })
        });

        // app.get("/getDriverReputation/:truckId", function (req, res) {
        //     var tripdetails = []
        //     var val1 = web3.utils.fromAscii([req.params.truckId][0]);
        //     ReputContract.methods.getReputScore(val1).call()
        //         .then(function (tripId) {
        //             console.log("DriverReputation=" + tripId);
        //             res.status(200).send(tripId);
        //         })
        // });

        app.post("/payInvoice", function (req, res) {
            RequestContract.methods.trips(req.body.tripId).call()
                .then(function (address) {
                    const TripContract = new web3.eth.Contract(contractTripJSON.abi, address);
                    TripContract.methods.invoicePaid().send({
                            from: accounts[0],
                            gas: 500000
                        })
                        .on('transactionHash', function (transactionHash) {
                            res.status(200).send(transactionHash);
                        })
                })
        })

        app.get("/getInvoices/:truckId", function (req, res) {
            var tripdetails = []
            var val1 = web3.utils.fromAscii([req.params.truckId][0]);
            RequestContract.methods.getAll_Active_Invoices(val1).call()
                .then(function (tripId) {
                    console.log("InvoicesforTrips=" + tripId);
                    let tripPromises = [];
                    let requestTripPromises = [];
                    tripId.forEach(function (item) {
                        console.log("trip=" + item);
                        const tripListPromise = RequestContract.methods.trips(item).call();
                        requestTripPromises.push(tripListPromise);
                        tripListPromise.then(function (address) {
                            console.log(address);
                            const TripContract = new web3.eth.Contract(contractTripJSON.abi, address);
                            tripPromises.push(TripContract.methods.trip().call())
                        })
                    })
                    console.log(requestTripPromises)
                    Promise.all(requestTripPromises).then((requestTrips) => {
                        Promise.all(tripPromises).then(function (tripResults) {
                            tripResults.forEach(function (item) {
                                var details = {
                                    TripId: item.tripId,
                                    FieldId: web3.utils.hexToAscii(item.fieldId).replace(/\u0000/g, ""),
                                    TankId: web3.utils.hexToAscii(item.tankId).replace(/\u0000/g, ""),
                                    Volume: item.tankCapacity,
                                    DisposalTankId: web3.utils.hexToAscii(item.disposalTankId).replace(/\u0000/g, ""),
                                    Cost: item.amount,
                                    Capacity_of_truck: item.maxcapacity,
                                    TruckId: web3.utils.hexToAscii(item.truckId).replace(/\u0000/g, ""),
                                    WaterFilled: item.waterfilled,
                                    WaterDisposed: item.waterdisposed,
                                    Status: item._Status
                                }
                                tripdetails.push(details);
                            })
                            res.status(200).send(tripdetails);
                        })
                    }).catch(function (err) {
                        console.error(err);
                    });
                })
        });

        var sub = web3.eth.subscribe('logs', {
            topics: ["0x3ae84b7e4829c4e1bc40c0b25b809bcd4d62e79907bf9a1d077f512847393821"]
        });
        sub.on('data', (log) => {
            //console.log(log)
            var data = web3.eth.abi.decodeLog([{
                    "indexed": false,
                    "name": "capacity",
                    "type": "uint256"
                },
                {
                    "indexed": true,
                    "name": "_fieldId",
                    "type": "bytes32"
                },
                {
                    "indexed": true,
                    "name": "tankid",
                    "type": "bytes32"
                },
                {
                    "indexed": true,
                    "name": "disposaltankid",
                    "type": "bytes32"
                },
                {
                    "indexed": false,
                    "name": "_amount",
                    "type": "uint256"
                },
                {
                    "indexed": false,
                    "name": "_tripId",
                    "type": "bytes32"
                },
                {
                    "indexed": false,
                    "name": "_time",
                    "type": "uint256"
                },
                {
                    "indexed": false,
                    "name": "time",
                    "type": "uint256"
                },
                {
                    "indexed": false,
                    "name": "reqtime",
                    "type": "uint256"
                },
                {
                    "indexed": false,
                    "name": "latlon",
                    "type": "string"
                }
            ], log.data, log.topics.slice(1));
            //console.log(data);
            var Latlon = data.latlon;
            console.log(Latlon);
            var arr = Latlon.split(" ");

            var details = {
                eventId: "EV-2",
                eventTimestamp: new Date().getTime(),
                tankVolume: data.capacity,
                fieldId: web3.utils.hexToAscii(data._fieldId).replace(/\u0000/g, ""),
                tankId: web3.utils.hexToAscii(data.tankid).replace(/\u0000/g, ""),
                disposalTankId: web3.utils.hexToAscii(data.disposaltankid).replace(/\u0000/g, ""),
                cost: data._amount,
                tripId: data._tripId,
                reqTimestamp: data.reqtime,
                timestamp: data.time,
                fieldLatitude: arr[0],
                fieldLongitude: arr[1],
                disposalLatitude: arr[2],
                disposalLongitude: arr[3]
            }
            getEvents(function () {
                console.log("-----------EV-2---------");
                publisher.publish("EV-2", JSON.stringify(details));
            });
        })
        sub.on('changed', (log) => {
            console.log(log)
        })
        sub.on('error', (log) => {
            console.log(log)
        })

        var sub1 = web3.eth.subscribe('logs', {
            topics: ["0x5a95fc4ef8b4db4cda451d9d37b0336fa5960cba835400dcbaa2a7cad045fa86"]
        });
        sub1.on('data', (log) => {
            //console.log(log)
            var data = web3.eth.abi.decodeLog([{
                    "indexed": false,
                    "name": "_maxcapacity",
                    "type": "uint256"
                },
                {
                    "indexed": false,
                    "name": "_truckId",
                    "type": "bytes32"
                },
                {
                    "indexed": false,
                    "name": "_tripId",
                    "type": "bytes32"
                },
                {
                    "indexed": false,
                    "name": "_amount",
                    "type": "uint256"
                },
                {
                    "indexed": false,
                    "name": "time",
                    "type": "uint256"
                },
                {
                    "indexed": false,
                    "name": "reqtime",
                    "type": "uint256"
                }
            ], log.data, log.topics.slice(1));
            console.log("------EV-3-----------");
            var details = {
                eventId: "EV-3",
                eventTimestamp: new Date().getTime(),
                truckVolume: data._maxcapacity,
                truckId: web3.utils.hexToAscii(data._truckId).replace(/\u0000/g, ""),
                cost: data._amount,
                tripId: data._tripId,
                reqTimestamp: data.reqtime,
                timestamp: data.time
            }
            var tripId = data._tripId
            getRequestEvents(tripId, function () {
                publisher.publish("EV-3", JSON.stringify(details));
            })
        })
        sub1.on('changed', (log) => {
            console.log(log)
        })
        sub1.on('error', (log) => {
            console.log(log)
        })

        var server = app.listen(5500, function () {
            console.log("app running on port.", server.address().port);
        });

    })