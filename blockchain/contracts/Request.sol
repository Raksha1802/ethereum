pragma solidity ^0.4.24;

import "./Trip.sol";
import "./Services.sol";

contract Request {
    
    address owner;
    address reputationaddr;
    Services service;
    address serviceaddr;
    mapping(bytes32 => bytes32[]) public completedTrips;
    mapping (bytes32 => uint256) arrayIndexes;
    mapping (bytes32 => uint256) activetripindex;
    mapping (bytes32 => uint256) accceptedtripindex;
    mapping(bytes32=> address) public trips;
    bytes32[] TripsCompleted;
    bytes32[] OpenTrips;
    bytes32[] Active_Trips;
    bytes32[] AcceptedTrips;
    mapping(bytes32 => bytes32[]) public BookedforDriver;
    mapping(bytes32 => bytes32) TruckStatus;
    mapping(bytes32 => bytes32) ActiveTripsforDriver;
    mapping(bytes32 => bytes32[]) InvoicesofDriver;
    
    constructor() public{
        
        owner = msg.sender;
    }
    
    modifier onboard(){
        
        require( serviceaddr != 0x00);
        _;
        
    }
    
    event TripCreated(uint capacity,bytes32 indexed _fieldId, bytes32 indexed tankid,bytes32 indexed disposaltankid,uint _amount,bytes32 _tripId,uint _time,uint time,uint reqtime,string latlon);
    event InvoiceGeneratedFor(bytes32 _tripId,bytes32 indexed _truckId,bytes32 _invoice);
    event TripCompleted(bytes32 indexed _truckId,bytes32 tripId);

    function checkwatermgmtuser(address _watermgmtuser) private view
    {
     bool _res = service.checkWasteMgmt(_watermgmtuser);
     require(_res == true || _watermgmtuser == owner);
    }
   
    modifier onlyOwner {
        
        require(msg.sender == owner);
        _;
    
    }
    
    modifier checkorigin(address _sender, bytes32 _tripId)
    {
        require(_sender == trips[_tripId]);
        _;
    }
    
    function createTrip(uint _capacity,bytes32 _fieldId,bytes32 _tankid,bytes32 _disposaltankid,string latlon,uint _amount,uint _hours,uint reqtime) public onlyOwner() onboard(){
        bytes32 tripId = keccak256(abi.encodePacked(_capacity,_fieldId,_tankid,_disposaltankid,_amount));
        createOpenTrips(tripId);
        checkwatermgmtuser(msg.sender);
        emit TripCreated(_capacity,_fieldId,_tankid,_disposaltankid,_amount,tripId,_hours,block.timestamp,reqtime,latlon);
        address trip = new Trip(_capacity,_fieldId,latlon,_tankid,_disposaltankid,_amount,serviceaddr,tripId,reqtime);
        trips[tripId] = trip;
        Trip(trip);
    }
    
    function createOpenTrips(bytes32 _tripId) private {
        uint id = OpenTrips.length;
        arrayIndexes[_tripId] = id;
        OpenTrips.push(_tripId);
    }
    
    function FetchOnboardContract(address _contract) public{
        
        serviceaddr = _contract;
        service = Services(_contract);
    }
    
    function deleteTrip(bytes32 _tripId) public 
    {
        checkwatermgmtuser(msg.sender);
        address tripcontract = trips[_tripId];
        selfdestruct(tripcontract);
        
    }
    
    function CompletedTrip(bytes32 _tripId,bytes32 _truckId,bytes32 _invoice) public
    {
       completedTrips[_truckId].push(_tripId);
       TripsCompleted.push(_tripId);
       delete TruckStatus[_truckId];

       uint id = activetripindex[_tripId]; 
       _tripId = BookedforDriver[_truckId][id];
       BookedforDriver[_truckId][id] = BookedforDriver[_truckId][BookedforDriver[_truckId].length - 1];
       activetripindex[BookedforDriver[_truckId][BookedforDriver[_truckId].length - 1]] = id;
       delete BookedforDriver[_truckId][BookedforDriver[_truckId].length - 1];
       BookedforDriver[_truckId].length--;

       delete ActiveTripsforDriver[_truckId];

       uint idd = accceptedtripindex[_tripId]; 
       _tripId = AcceptedTrips[id];
       AcceptedTrips[idd] = AcceptedTrips[AcceptedTrips.length - 1];
       accceptedtripindex[AcceptedTrips[AcceptedTrips.length - 1]] = idd;
       delete AcceptedTrips[AcceptedTrips.length - 1];
       AcceptedTrips.length--;
       
       emit InvoiceGeneratedFor(_tripId,_truckId,_invoice);
       emit TripCompleted(_truckId,_tripId);
    }
    
    function getAll_Active_Invoices(bytes32 _truckId) public view returns(bytes32[])
    {
        return InvoicesofDriver[_truckId];
    }
    
    function getAllCompletedTrips() public view returns(bytes32[])
    {
        return TripsCompleted;
    }
    
    function deleteOpenTrips(bytes32 _tripId,address _sender) public checkorigin(_sender,_tripId) returns(uint){
        uint id = arrayIndexes[_tripId]; 
        _tripId = OpenTrips[id];
        OpenTrips[id] = OpenTrips[OpenTrips.length - 1];
        arrayIndexes[OpenTrips[OpenTrips.length - 1]] = id;
        delete OpenTrips[OpenTrips.length - 1];
        OpenTrips.length--;
        return id;
    }

    function getOpenTrips() public view returns(bytes32[])
    {
        return OpenTrips;
    }
    
    function setdriverstatus(bytes32 _truckId,bytes32 _tripId, address _sender) public checkorigin(_sender,_tripId)
    {
        uint id =  BookedforDriver[_truckId].length;
        activetripindex[_tripId] = id;
        BookedforDriver[_truckId].push(_tripId); 
    }
    
    function TripStarted(bytes32 _truckId,bytes32 _tripId,address _sender) public checkorigin(_sender,_tripId)
    {
        bytes32 _status = bytes32("TripStarted");
        ActiveTripsforDriver[_truckId] = _tripId;
        TruckStatus[_truckId] = _status;
    }
    
    function getActiveTrip(bytes32 _truckId) public view returns(bytes32)
    {
        return ActiveTripsforDriver[_truckId];
    }
    
    function checkTruckStatus(bytes32 _truckId) public view returns(bool)
    {
        if(TruckStatus[_truckId] == bytes32("TripStarted"))
        {
        return true;
        }
        else{
            return false;
        }
    }
    
    function getBookedTrips(bytes32 _truckId) public view returns(bytes32[])
    {
        return BookedforDriver[_truckId];
    }
    
    function acceptedTrips(bytes32 _tripId) public
    {
        uint id = AcceptedTrips.length;
        accceptedtripindex[_tripId] = id;
        AcceptedTrips.push(_tripId);   
    }
    
    function getAcceptedTrips() public view returns(bytes32[])
    {
        return AcceptedTrips;
    }
    
    function getInvoicesforDriver(bytes32 _truckId,bytes32 _tripId,address _sender) public checkorigin(_sender,_tripId)
    {
        InvoicesofDriver[_truckId].push(_tripId);    
    }
    
}
