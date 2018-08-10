var express = require("express");
var bodyParser = require("body-parser");
var app = express();
const Web3 = require('web3');
var solc = require('solc');
var web3 = new Web3(new Web3.providers.WebsocketProvider('ws://localhost:8545'));
const contractTripJSON = require('../../build/contracts/Trip.json')
const contractrequestJSON = require('../../build/contracts/Request.json')
const contractJSON = require('../../build/contracts/Services.json')
var redis = require("redis")
var subscriber = redis.createClient();
//var publisher = redis.createClient();
var publisher = redis.createClient(6379, process.argv[2]);
publisher.auth('password123', function (err) {
  console.log(err);
})
// change the IP address to the IP of redis server

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

    var sub2 = web3.eth.subscribe('logs', {
      topics: ["0xcb0654cfa7c5317373f1a2a91865c3cd2470aa8e604b29e964c87bb2af7af84f"]
    });
    sub2.on('data', (log) => {
      //console.log(log)
      var data = web3.eth.abi.decodeLog([{
          "indexed": true,
          "name": "_driver",
          "type": "address"
        },
        {
          "indexed": true,
          "name": "_truckId",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "name": "_fieldId",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "name": "_disposalTankId",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "name": "_tripId",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "name": "latlon",
          "type": "string"
        },
        {
          "indexed": false,
          "name": "_time",
          "type": "uint256"
        },
        {
          "indexed": false,
          "name": "reqtime",
          "type": "uint256"
        }
      ], log.data, log.topics.slice(1));
      var Latlon = data.latlon;
      console.log(Latlon);
      var arr = Latlon.split(" ");
      console.log("--------EV-7-----------");
      var details = {
        eventId: "EV-7",
        eventTimestamp: new Date().getTime(),
        driveraddress: data._driver,
        truckId: web3.utils.hexToAscii(data._truckId).replace(/\u0000/g, ""),
        fieldId: web3.utils.hexToAscii(data._fieldId).replace(/\u0000/g, ""),
        disposalTankId: web3.utils.hexToAscii(data._disposalTankId).replace(/\u0000/g, ""),
        tripId: data._tripId,
        fieldLatitude: arr[0],
        fieldLongitude: arr[1],
        reqTimestamp: data.reqtime,
        timestamp: data._time
      }
      publisher.publish("EV-7", JSON.stringify(details));
    })
    sub2.on('changed', (log) => {
      console.log(log)
    })
    sub2.on('error', (log) => {
      console.log(log)
    })

    var sub3 = web3.eth.subscribe('logs', {
      topics: ["0x29fcb7a081213c4e59ce0c560a55d83c6f352d3162076c619e514bae3f0e1981"]
    });
    sub3.on('data', (log) => {
      //console.log(log)
      var data = web3.eth.abi.decodeLog([{
          "indexed": true,
          "name": "_driver",
          "type": "address"
        },
        {
          "indexed": true,
          "name": "_truckId",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "name": "_fieldId",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "name": "_disposalTankId",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "name": "_waterfilled",
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
          "name": "reqtime",
          "type": "uint256"
        }
      ], log.data, log.topics.slice(1));
      console.log("------EV-8-----------");
      var details = {
        eventId: "EV-8",
        eventTimestamp: new Date().getTime(),
        truckId: web3.utils.hexToAscii(data._truckId).replace(/\u0000/g, ""),
        fieldId: web3.utils.hexToAscii(data._fieldId).replace(/\u0000/g, ""),
        disposalTankId: web3.utils.hexToAscii(data._disposalTankId).replace(/\u0000/g, ""),
        waterFilled: data._waterfilled,
        tripId: data._tripId,
        reqTimestamp: data.reqtime,
        timestamp: data._time
      }
      publisher.publish("EV-8", JSON.stringify(details));
    })
    sub3.on('changed', (log) => {
      console.log(log)
    })
    sub3.on('error', (log) => {
      console.log(log)
    })

    var sub11 = web3.eth.subscribe('logs', {
      topics: ["0x85e084d5606606c55553e1ce61796339f52523a5c97278b476fb3c9337cf805a"]
    });
    sub11.on('data', (log) => {
      //console.log(log)
      var data = web3.eth.abi.decodeLog([{
          "indexed": false,
          "name": "_waterfilled",
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
          "name": "reqtime",
          "type": "uint256"
        }
      ], log.data, log.topics.slice(1));
      console.log("------EV-7A-----------");
      var details = {
        eventId: "EV-7A",
        eventTimestamp: new Date().getTime(),
        waterFilled: data._waterfilled,
        tripId: data._tripId,
        reqTimestamp: data.reqtime,
        timestamp: data._time
      }
      publisher.publish("EV-7A", JSON.stringify(details));
    })
    sub11.on('changed', (log) => {
      console.log(log)
    })
    sub11.on('error', (log) => {
      console.log(log)
    })

    var sub4 = web3.eth.subscribe('logs', {
      topics: ["0x900f609021f07b7e6a2109cf57fc4920746705a64032d5c1508ac548ada8e8a0"]
    });
    sub4.on('data', (log) => {
      //console.log(log)
      var data = web3.eth.abi.decodeLog([{
          "indexed": true,
          "name": "_driver",
          "type": "address"
        },
        {
          "indexed": true,
          "name": "_truckId",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "name": "_fieldId",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "name": "_disposalTankId",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "name": "_tripId",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "name": "latlon",
          "type": "string"
        },
        {
          "indexed": false,
          "name": "_time",
          "type": "uint256"
        },
        {
          "indexed": false,
          "name": "reqtime",
          "type": "uint256"
        }
      ], log.data, log.topics.slice(1));
      console.log("------EV-11-----------");
      var Latlon = data.latlon;
      console.log(Latlon);
      var arr = Latlon.split(" ");
      var details = {
        eventId: "EV-11",
        eventTimestamp: new Date().getTime(),
        truckId: web3.utils.hexToAscii(data._truckId).replace(/\u0000/g, ""),
        fieldId: web3.utils.hexToAscii(data._fieldId).replace(/\u0000/g, ""),
        disposalTankId: web3.utils.hexToAscii(data._disposalTankId).replace(/\u0000/g, ""),
        tripId: data._tripId,
        disposalLatitude: arr[2],
        disposalLongitude: arr[3],
        reqTimestamp: data.reqtime,
        timestamp: data._time
      }
      publisher.publish("EV-11", JSON.stringify(details));
    })
    sub4.on('changed', (log) => {
      console.log(log)
    })
    sub4.on('error', (log) => {
      console.log(log)
    })

    var sub5 = web3.eth.subscribe('logs', {
      topics: ["0x20fd8d154954cd9b6e3579b378bd233de09816e265ef5bb640c1ead5ea634db6"]
    });
    sub5.on('data', (log) => {
      //console.log(log)
      var data = web3.eth.abi.decodeLog([{
          "indexed": true,
          "name": "_driver",
          "type": "address"
        },
        {
          "indexed": true,
          "name": "_truckId",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "name": "_fieldId",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "name": "_disposalTankId",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "name": "_waterdisposed",
          "type": "uint256"
        },
        {
          "indexed": false,
          "name": "_tripId",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "name": "_repScore",
          "type": "uint256"
        },
        {
          "indexed": false,
          "name": "_time",
          "type": "uint256"
        },
        {
          "indexed": false,
          "name": "reqtime",
          "type": "uint256"
        }
      ], log.data, log.topics.slice(1));
      console.log("------EV-12-----------");
      var details = {
        eventId: "EV-12",
        eventTimestamp: new Date().getTime(),
        truckId: web3.utils.hexToAscii(data._truckId).replace(/\u0000/g, ""),
        fieldId: web3.utils.hexToAscii(data._fieldId).replace(/\u0000/g, ""),
        disposalTankId: web3.utils.hexToAscii(data._disposalTankId).replace(/\u0000/g, ""),
        waterDisposed: data._waterdisposed,
        tripId: data._tripId,
        reputationScore: data._repScore,
        reqTimestamp: data.reqtime,
        timestamp: data._time
      }
      publisher.publish("EV-12", JSON.stringify(details));
    })
    sub5.on('changed', (log) => {
      console.log(log)
    })
    sub5.on('error', (log) => {
      console.log(log)
    })

    var sub6 = web3.eth.subscribe('logs', {
      topics: ["0x850685466f2f586b02c3544fef7c221122d56dee93fb1b11a83f6850e1d220ef"]
    });
    sub6.on('data', (log) => {
      // console.log(log)
      var data = web3.eth.abi.decodeLog([{
          "indexed": false,
          "name": "_tankCapacity",
          "type": "uint256"
        },
        {
          "indexed": false,
          "name": "_fieldId",
          "type": "bytes32"
        },
        {
          "indexed": true,
          "name": "_tankId",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "name": "_disposalTankId",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "name": "_maxcapacity",
          "type": "uint256"
        },
        {
          "indexed": false,
          "name": "_waterfilled",
          "type": "uint256"
        },
        {
          "indexed": false,
          "name": "_waterdisposed",
          "type": "uint256"
        },
        {
          "indexed": false,
          "name": "_amount",
          "type": "uint256"
        },
        {
          "indexed": true,
          "name": "_truckId",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "name": "_Status",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "name": "_tripId",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "name": "_repScore",
          "type": "uint256"
        },
        {
          "indexed": false,
          "name": "_invoiceno",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "name": "time",
          "type": "uint256"
        }
      ], log.data, log.topics.slice(1));
      console.log("------EV-13-----------");
      var details = {
        eventId: "EV-13",
        eventTimestamp: new Date().getTime(),
        fieldId: web3.utils.hexToAscii(data._fieldId).replace(/\u0000/g, ""),
        tankVolume: data._tankCapacity,
        tankId: web3.utils.hexToAscii(data._tankId).replace(/\u0000/g, ""),
        disposalTankId: web3.utils.hexToAscii(data._disposalTankId).replace(/\u0000/g, ""),
        truckVolume: data._maxcapacity,
        waterFilled: data._waterfilled,
        waterDisposed: data._waterdisposed,
        truckId: web3.utils.hexToAscii(data._truckId).replace(/\u0000/g, ""),
        cost: data._amount,
        tripId: data._tripId,
        reputationScore: data._repScore,
        timestamp: data.time
      }
      publisher.publish("EV-13", JSON.stringify(details));
    })
    sub6.on('changed', (log) => {
      console.log(log)
    })
    sub6.on('error', (log) => {
      console.log(log)
    })

    var sub12 = web3.eth.subscribe('logs', {
      topics: ["0xd3bdf87fed04816bcf83e7e96290a8559756dcef5682825b953b0715a2c7aa0a"]
    });
    sub12.on('data', (log) => {
      //console.log(log)
      var data = web3.eth.abi.decodeLog([{
          "indexed": false,
          "name": "_waterdisposed",
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
          "name": "reqtime",
          "type": "uint256"
        }
      ], log.data, log.topics.slice(1));
      console.log("------EV-11A-----------");
      var details = {
        eventId: "EV-11A",
        eventTimestamp: new Date().getTime(),
        waterFilled: data._waterfilled,
        tripId: data._tripId,
        reqTimestamp: data.reqtime,
        timestamp: data._time
      }
      publisher.publish("EV-11A", JSON.stringify(details));
    })
    sub12.on('changed', (log) => {
      console.log(log)
    })
    sub12.on('error', (log) => {
      console.log(log)
    })

    var server = app.listen(6001, function () {
      console.log("app running on port.", server.address().port);
    });

  })