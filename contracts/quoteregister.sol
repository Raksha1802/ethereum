pragma solidity ^0.4.11;

contract Quoteregistry{

    address public owner;
    
    struct Quote{
        string quote;
        address sender;
    }
    
    mapping(bytes32 => Quote) quotesregistry;
    
    constructor()public{
        owner= msg.sender;
    }
    
    modifier checkfee{
        if(msg.value == 500000000000000000){
           _;
        }
        else{
            revert("WRONG");
         }
    }
   modifier onlyOwner(string _quote) {
       bytes32 quoteId = keccak256(abi.encodePacked(_quote));
        require(
            msg.sender ==  quotesregistry[quoteId].sender,
            "Only owner can call this function."
        );
        _;
    }

    
    function register(string _quote) public
    {
        address sender = msg.sender;
        bytes32 quoteId = keccak256(abi.encodePacked(_quote));
        quotesregistry[quoteId] = Quote(_quote,sender); 
    }
    
    function ownership(string _quote) view public returns(address)
    {
        bytes32 quoteId = keccak256(abi.encodePacked(_quote));
        return quotesregistry[quoteId].sender;
    }
    
    function transferowner(string _quote,address newowner) public payable onlyOwner(_quote) checkfee returns(address _newowner)
    {
       bytes32 quoteId = keccak256(abi.encodePacked(_quote));
       quotesregistry[quoteId].sender = newowner;
       return quotesregistry[quoteId].sender = newowner;
       msg.sender.transfer(msg.value);
    }
    
    function balance(address _sender) public view returns(uint)
    {
        return address(_sender).balance;
    }
}
