pragma solidity ^0.4.24;

contract Services{

    struct Optimization{
        address optimizationservice;
    }
     
    struct Disposal{
        address disposalservice;
    }
    
    struct Storage{
        address storageservice;
    }
    
    struct WasteMgmt{
        address wastemanagement;
    }
    
    mapping(address => Optimization) Optimizations;
    mapping(address => Disposal) DisposalUsers;
    mapping(address => Storage) StorageUsers;
    mapping(address => WasteMgmt) WasteMgmtUsers;
    
    address public owner;
    address private user = 0xCA35b7d915458EF540aDe6068dFe2F44E8fa733c;
    
    constructor() public{
        
        owner = msg.sender;
    }
    
    modifier User(address _user)
    {
        require (_user == user);
        _;
    }
    
    function OnboardOptimization(address _optimizer)public {
        
        Optimizations[_optimizer] = Optimization(_optimizer);
        
    }
    
    function OnboardStorage(address _storageuser)public {
        
        StorageUsers[_storageuser] = Storage(_storageuser);
        
    }
    
    function OnboardDisposal(address _disposaluser)public {
        
        DisposalUsers[_disposaluser] = Disposal(_disposaluser);
        
    }
    
    function OnboardWasteMgmt(address _wastemanagement) public {
        
        WasteMgmtUsers[_wastemanagement] = WasteMgmt(_wastemanagement);
    }
    
    function checkOptimizer(address _optimizer) public view returns(bool)
    {
        if(Optimizations[_optimizer].optimizationservice == _optimizer)
        {
            return true;
        }
        else{
            return false;
        }
    }
    
    function checkStorage(address _storageuser) public view returns(bool)
    {
        if(StorageUsers[_storageuser].storageservice == _storageuser)
        {
            return true;
        }
        else{
            return false;
        }
    }
    
    function checkDisposal(address _disposaluser) public view returns(bool)
    {
        if(DisposalUsers[_disposaluser].disposalservice == _disposaluser)
        {
            return true;
        }
        else{
            return false;
        }
    }
    
     function checkWasteMgmt(address _wastemanagement) public view returns(bool)
    {
        if(WasteMgmtUsers[_wastemanagement].wastemanagement == _wastemanagement)
        {
            return true;
        }
        else{
            return false;
        }
    }
    
}
