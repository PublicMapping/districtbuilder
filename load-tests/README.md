# Load Testing

This [k6](https://k6.io/)-based load testing project makes use of HAR files to
automate user requests that are known to stress parts of the application. All of
the components necessary to execute a load test are encapsulated in this
directory.

## Generating a HAR File

- Use either Safari or Firefox. Google Chrome does not have the ability to
  export filtered HAR files.
- Open the network tab of your browser's developer tools.
- Navigate to the application.
- Clear all requests.
- Begin the flow that you'd like to record.
- In the search box, filter by `/api/`.
- In Safari, select **Export**. In Firefox, right click any request and select
  **Save All As HAR**.

## Variables

- `HAR_FILE`: HAR file containing requests to simulate
- `JWT_AUTH_TOKEN`: JWT access token used to authenticate requests
- `REQ_ORIGIN`: Domain, hostname and (optionally) port to use for each request (e.g. `http://localhost:3003`). Overrides all hostnames
  specified in the HAR file (optional)

## Running

Below is an example of how to invoke an instance of the load test with Docker
Compose: