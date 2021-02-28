# Give-A-Fork - A fork endpoint generator service for Ethereum

Upon request, a temporary Ethereum HTTP endpoint is created which represents a fork of the current Ethereum network. It can than be used by clients to run simulations that contain state-changing transactions.
Under the hood it creates a pool of Ganache-Core servers.
- The pool has a maximum capacity of 2 servers.
- A server cannot be up for more that 1 minute.
- A server that hasn't been used for more than 5 seconds is removed.

All hard limits are configurable, currently by modifying a const config object in the code.

## API
All endpoints take and/or return a JSON encoded body.

- `POST /create`.   
  body: `{providerOptions: {...}}`. 
  returns: `{id: "new-instance-id"}`

  Creates a new fork instance and returns its ID. 
  
  `providerOptions` goes straight into Ganache and allows configuring the instance (e.g. setting a list of unlocked accounts). See https://github.com/trufflesuite/ganache-core/tree/master#options.  
  The endpoint is than available at `/instances/[instance-id]`.

- `POST /destroy`.   
  body: `{id: "instance-id-to-destroy"}` 

  Destroys an active instance. 
  
## Usage

Set the ETHEREUM_ENDPOINT_URL environment variable with an Ethereum endpoint that will be used by the service.

1. build with `npm install`.
2. test with `npm test`.
3. run with `npm start`.
