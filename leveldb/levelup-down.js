//get ethereum account balance using leveldb

var Trie = require('merkle-patricia-tree/secure');
var levelup = require('levelup');
var leveldown = require('leveldown');
var utils = require('ethereumjs-util');
var BN = utils.BN;
var Account = require('ethereumjs-account');

//Connecting to the leveldb database
var db = levelup(leveldown('/home/rakshamp/Desktop/eth/data/geth/chaindata'));

//Adding the "stateRoot" value from the block so that we can inspect the state root at that block height.
var root = '0x4ef95d1280975c6a6a0286fca818636678c4f936c461c1f32c15a6f8498e1917';

var trie = new Trie(db, root);

var address = '0xefa7e8d5d449adb96631a3f9a53f1b120f0e8fd7';
trie.get(address, function (err, raw) {
    if (err) return cb(err)
    //Using ethereumjs-account to create an instance of an account
    var account = new Account(raw)
    console.log('Account Address: ' + address);
    //Using ethereumjs-util to decode and present the account balance 
    console.log('Balance: ' + (new BN(account.balance)).toString());
})
