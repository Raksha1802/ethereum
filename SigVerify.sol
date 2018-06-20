pragma solidity ^0.4.11;

import "./identity.sol";

contract SigVerify {

    function testRecovery(bytes32 h, uint8 v, bytes32 r, bytes32 s) public pure returns (address) {
       /* prefix might be needed for geth only
        * https://github.com/ethereum/go-ethereum/issues/3731
        */
        // bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        // h = sha3(prefix, h);
        address addr = ecrecover(h, v, r, s);

        return addr;
    }
}