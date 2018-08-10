# Assumptions:
## Assumptions we made about Optimization Service while writing Smart Contracts.

1. The Waste Management Service emits a requests for picking the water from OilTank at Oilfields and Optimization Service listens to these requests and searches for a Truck with a capacity to pick water as specified in the requests.

2. Optimization service picks up the requests and it can modify these requests or create more requests to match the capacity of waste water mentioned in the request.i.e, the Optimization Service listens to one request and may modify it into multiple requests while scheduling it to a truck with some capacity.

3. When the request is created by the Waste Management Service, we will create the contract for trip and the Optimization service can modify/recreate the request if the request is not accepted for some time and this will be tracked in the BlockChain.