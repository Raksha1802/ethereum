ganache-cli &
sleep 8
truffle compile \n
truffle migrate --reset \n
cd services/Waste-Mgmt \n
node opentrips.js \n
node onboardServices.js &
node wastemgmt.js ip&
sleep 5
cd .. \n
cd Storage \n
node storage.js &
cd .. \n
cd Disposal \n
node disposal.js &
cd .. \n
