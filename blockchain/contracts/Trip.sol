pragma solidity ^0.4.24;

import "./Request.sol";
import "./Services.sol";


contract Trip{
    
    event TripAccepted(uint _maxcapacity,bytes32 _truckId,bytes32 _tripId,uint _amount,uint time,uint reqtime);
    event PumpWateratOilfield(address indexed _driver,bytes32 indexed _truckId,bytes32 _fieldId,bytes32 _disposalTankId,bytes32 _tripId,string latlon,uint _time,uint reqtime);
    event LeavefromOilfield(address indexed _driver,bytes32 indexed _truckId,bytes32 _fieldId,bytes32 _disposalTankId,uint _waterfilled,bytes32 _tripId,uint _time,uint reqtime);
    event PumpWateratDisposal(address indexed _driver,bytes32 indexed _truckId,bytes32 _fieldId,bytes32 _disposalTankId,bytes32 _tripId,string latlon,uint _time,uint reqtime);
    event LeavefromDisposal(address indexed _driver,bytes32 indexed _truckId,bytes32 _fieldId,bytes32 _disposalTankId,uint _waterdisposed,bytes32 _tripId,uint _repScore,uint _time,uint reqtime);
    event InvoiceGenerated(uint _tankCapacity,bytes32 _fieldId,bytes32 indexed _tankId,bytes32  _disposalTankId,uint _maxcapacity,uint _waterfilled,uint _waterdisposed,uint _amount,bytes32 indexed _truckId,bytes32 _Status,bytes32 _tripId,uint _repScore,bytes32 _invoiceno,uint time);
    event Waterfilled(uint _waterfilled,bytes32 _tripId,uint _time,uint reqtime);
    event Waterdisposed(uint _waterdisposed,bytes32 _tripId,uint _time,uint reqtime);
    
    address public owner;
    Services public service;
    Request public requests ;
    
    
    constructor(uint _tankCapacity,bytes32 _fieldId,string _latlon,bytes32 _tankId,bytes32 _disposalTankId,uint _amount,address _servicecontract,bytes32 _tripId,uint _reqtime) public {
        trip.tankCapacity =_tankCapacity;
        trip.tankId = _tankId;
        trip.disposalTankId = _disposalTankId;
        trip.amount = _amount;
        trip.tripId = _tripId;
        trip.fieldId = _fieldId;
        trip.latlon = _latlon;
        trip.reqtime = _reqtime;
        service = Services(_servicecontract);
        owner = msg.sender;
        requests = Request(msg.sender);
    }
    
    struct TripDetails{
        uint  tankCapacity;
        bytes32 fieldId;
        bytes32 tankId;
        bytes32 disposalTankId;
        string latlon;
        uint amount;
        bytes32 tripId;
        address driver;
        uint maxcapacity;
        uint waterfilled;
        uint waterdisposed;
        bytes32 truckId;
        uint reqtime;
        bytes32 Status;
    }
    
    
    TripDetails public trip;
    
    mapping(bytes32=>address) public InvoicesCreated;
    mapping(bytes32 => uint) Reput;
    
    modifier checkSenderAdd(address _sender){
        
        bool _res = service.checkStorage(_sender);
        
        if(_res==true){
            _;
        }
        else{
            revert("User Doesnt exist or doesn't have permission for this operation");
        }
    }
    
    modifier checkDisposalAdd(address _sender){
        
        bool _res = service.checkDisposal(_sender);
        
        if(_res==true){
            _;
        }
        else{
            revert("User Doesnt exist or doesn't have permission for this operation");
        }
    }
    
    modifier checkDriver(address _driver){
        
        require(_driver == trip.driver);
        _;
    }
    
    modifier checkTrip(bytes32 _tripId)
    {
        require(_tripId == trip.tripId);
        _;
    }

    modifier checkdriverstatus(bytes32 _truckId)
    {
        bool _res = requests.checkTruckStatus(_truckId);
        require(_res == false);
        _;
        
    }
    modifier checkSender(address _sender){
        
         bool _res = service.checkOptimizer(_sender);
        
        if(_res==true){
            _;
        }
        else{
            revert("Waste Management User Doesnt exist");
        }
        
    }
    
    modifier checkPump(){
        require(trip.Status == bytes32("accepted"),"Trip Not Accepted");
        _;
    }
    
    modifier checkLeave(){
        require(trip.waterfilled != 0 && trip.Status == bytes32("WaterPumped"),"WaterFilled not Updated");
        _;
    }
    
    modifier checkDisp(){
         require(trip.Status == bytes32("LeaveOilfield"),"Truck hasnt left Oil Filed");
         _;
    }
    
    modifier checkLeaveDisp(){
        require(trip.waterdisposed != 0 && trip.Status == bytes32("WaterDisposed"),"wrong");
        _;
    }
    
    modifier checkInvoice(){
         require(trip.Status == bytes32("LeavefromDisposal"),"Cant perform this action");
         _;
    }
    
    modifier checkStatus()
    {
     require(trip.Status == bytes32("PumpatOilfield"),"Water Not Pumped at Oil Field");
     _;
     
    }
    
    modifier checkStatusDisp()
    {
         require(trip.Status == bytes32("PumpWateratDisposal"),"Water Not Dumped at Disposal Site");
         _;
    }
    
    modifier checkReputStatus()
    {
        require(trip.Status == bytes32("PumpatOilfield"),"Trip not started");
        _;
    }
    
    function modifyTrip(uint _capacity,uint _amount,bytes32 _disposaltankid,bytes32 _tripId) public checkSender(msg.sender)
    {
      
      require(trip.Status == "" , "Can't Modify an Active Trip");  
      if(trip.tripId == _tripId) { 
      trip.tankCapacity = _capacity;
      trip.amount = _amount;
      trip.disposalTankId = _disposaltankid;
      }
      
      else{
          revert("You are trying to modify a non-existant trip");
      }
        
    }
    
    function tripAccept(uint _maxcapacity,bytes32 _truckId,bytes32 _tripId,uint reqtime) public checkTrip(_tripId) {  
        
        require(trip.Status == "","Trip Not Free");
        trip.driver = msg.sender;
        trip.truckId = _truckId;
        trip.maxcapacity = _maxcapacity;
        trip.Status = bytes32("accepted");
        requests.deleteOpenTrips(_tripId,address(this));
        requests.acceptedTrips(_tripId);
        requests.setdriverstatus(_truckId,_tripId,address(this));
        emit TripAccepted(_maxcapacity,_truckId,_tripId,trip.amount,block.timestamp,reqtime);
    }
    
    function PumpatOilfield(bytes32 _tripId,uint reqtime) public checkdriverstatus(trip.truckId) checkDriver(msg.sender) checkPump()
    {
        uint time = block.timestamp;
        requests.TripStarted(trip.truckId,_tripId,address(this));
        emit PumpWateratOilfield(msg.sender,trip.truckId,trip.fieldId,trip.disposalTankId,_tripId,trip.latlon,time,reqtime);
        trip.Status = bytes32("PumpatOilfield");
        reputationScore(trip.truckId);
        
    }
    
    function WaterPumped(uint _waterfilled,bytes32 _tripId,uint reqtime) public checkSenderAdd(msg.sender) checkTrip(_tripId) checkStatus() returns(uint)
    {
     trip.waterfilled = _waterfilled;
     trip.Status = bytes32("WaterPumped");
     emit Waterfilled(_waterfilled,_tripId,block.timestamp,reqtime);
     return _waterfilled;
        
    }
    
    function LeaveOilfield(bytes32 _tripId,uint reqtime) public checkDriver(msg.sender) checkLeave()
    {
        uint time = block.timestamp;
        emit LeavefromOilfield(msg.sender,trip.truckId,trip.fieldId,trip.disposalTankId,trip.waterfilled,_tripId,time,reqtime);
        trip.Status = bytes32("LeaveOilfield");
        
    }
    
    function PumpatDisposal(bytes32 _tripId,uint reqtime) public  checkDriver(msg.sender) checkDisp() returns(uint) 
    {
        uint time = block.timestamp;
        emit PumpWateratDisposal(msg.sender,trip.truckId,trip.fieldId,trip.disposalTankId,_tripId,trip.latlon,time,reqtime);
        trip.Status = bytes32("PumpWateratDisposal");
        return time;
        
    }
    
    function WaterDisposed(uint _waterdisposed,bytes32 _tripId,uint reqtime) public checkDisposalAdd(msg.sender) checkTrip(_tripId) checkStatusDisp() returns(uint)
    {
    
     trip.waterdisposed = _waterdisposed;
     trip.Status = bytes32("WaterDisposed");
     emit Waterdisposed(_waterdisposed,_tripId,block.timestamp,reqtime);
     return _waterdisposed;
        
    }
    
    
    function LeaveDisposalSite(bytes32 _tripId,uint reqtime) public  checkDriver(msg.sender) checkLeaveDisp() returns(bytes32)
    {
        uint time = block.timestamp;
        emit LeavefromDisposal(msg.sender,trip.truckId,trip.fieldId,trip.disposalTankId,trip.waterdisposed,_tripId,Reput[trip.truckId],time,reqtime);
        trip.Status = bytes32("LeavefromDisposal");
        bytes32 INVOICE = createInvoice(_tripId);
        require(INVOICE != bytes32(""), "Invoice not created correctly");
        return INVOICE;
    }
    
    function createInvoice(bytes32 _tripId) checkInvoice() public returns(bytes32)
    {
        bytes32 invoice_no =  keccak256(abi.encodePacked(_tripId));
        InvoicesCreated[_tripId] = address(this);
        requests.CompletedTrip(_tripId,trip.truckId,invoice_no);
        requests.getInvoicesforDriver(trip.truckId,_tripId,address(this));
        emit InvoiceGenerated(trip.tankCapacity,trip.fieldId,trip.tankId,trip.disposalTankId,trip.maxcapacity,trip.waterfilled,trip.waterdisposed,trip.amount,trip.truckId,trip.Status,_tripId,Reput[trip.truckId],invoice_no,block.timestamp);
        return invoice_no;
    }
    
    function invoicePaid() checkInvoice() public
    {
        
        trip.Status = bytes32("Invoice Paid");
    }
    
    function reputationScore(bytes32 _truckId) public checkReputStatus()
    {
       if(block.timestamp >= trip.reqtime+3600)
       {
           Reput[_truckId] = 10;
       }
       else if(block.timestamp >= trip.reqtime+(3600*2))
       {
           Reput[_truckId] = 8;
       }
       else if(block.timestamp >= trip.reqtime+(3600*3))
       {
           Reput[_truckId] = 6;
       }
       else 
       {
           Reput[_truckId] =4 ;
       }
    }
    
    function getReputforTrip(bytes32 _truckId) public view returns(uint)
    {
        return Reput[_truckId];
    }
}
