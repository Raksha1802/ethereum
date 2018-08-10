var express = require("express");
var bodyParser = require("body-parser");
var app = express();
const Web3 = require('web3');
var solc = require('solc');
var web3 = new Web3(new Web3.providers.WebsocketProvider('ws://localhost:8545'));
var redis = require("redis")
var publisher = redis.createClient();
//var subscriber = redis.createClient();
var subscriber = redis.createClient(6379, process.argv[2]);
subscriber.auth('password123', function (err) {
  console.log(err);
})
// change the IP address to the IP of redis server

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

subscriber.on("message", function (channel, message) {
  console.log("Event" + message + " was emitted.");
});

subscriber.subscribe("EV-2");
subscriber.subscribe("EV-3");
subscriber.subscribe("EV-7");
subscriber.subscribe("EV-7A")
subscriber.subscribe("EV-8");
subscriber.subscribe("EV-11");
subscriber.subscribe("EV-11A")
subscriber.subscribe("EV-12");
subscriber.subscribe("EV-13");

var server = app.listen(6100, function () {
  console.log("app running on port.", server.address().port);
});