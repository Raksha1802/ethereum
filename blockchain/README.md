## Commands to integrate the flow

1. npm install

2. Install Ganache-cli
   a) Run command
	* npm install -g ganache-cli

3. Run ganache-cli
   a) Run command 
	* ganache-cli

4. Complile and Deploy Contracts
   a) Run commands
	* truffle compile
	* truffle migrate(truffle migrate --reset //incase of redeploying the contract to the same instance of testnet)

5. Start Waste management Service
    a) Run commands
	* cd services/Waste-Mgmt 
	* node onboardServices.js // Onboards different services(Waste-Mgmt,Storage Tank,Disposal Tank) to the blockchain.
	* node wastemgmt.js
	* node eventlistener.js ip // replace the ip with the IP where redis server is running(Listens to blockchain events and publishes to redis,which is subscribed by other services.)

6. Start Stoarge Tank Service
   a) Run Command
	* cd services/Storage node storage.js

7. Start Disposal Tank Service
   a) Run command 
	* cd services/Disposal node disposal.js  

OR

1. Run Commands 
	* npm init
	* npm install -g ganache-cli
2. Replace the ip in run.sh/node eventlistener.js, with the ip where redis server is running. 

3. Run command sh run.sh
        OR
   Run command sh run1.sh  //prepopulated with openTrips.

NOTE : Before building docker image, make sure to set the ip at run.sh/eventlistener.js or       run1.sh/eventlistener.js