var Web3 = require('web3');
var web3 = new Web3();

web3.setProvider(new web3.providers.HttpProvider('http://127.0.0.1:8545'));

 web3.eth.getAccounts()
.then(function(accounts){    
        console.log(accounts)
        
        function tohex(msg){
            var hexmsg = "";
            for(var i=0; i<msg.length; i++){
                hexmsg += msg.charCodeAt(i).toString(16);
            }
            return   "0x"+hexmsg;
        }
        
        
        function verificationScheme(str){
            var msghex = tohex(str);
            var sig = web3.eth.sign(web3.eth.accounts[0], msghex);
        
            var r = sig.slice(0, 66);
            var s = '0x' + sig.slice(66, 130);
            var v = '0x' + sig.slice(130, 132);
            v = web3.toDecimal(v);
        
            var verificationMessage = "\x19Ethereum Signed Message:\n" + str.length + str;
            var verificationMessageHash = web3.sha3(verificationMessage);
        
            return [verificationMessageHash, v, r, s];
        }
            
        verificationScheme("hello")
 });



// var balance = web3.eth.getBalance(coinbase);
// console.log(balance.toString(10));
