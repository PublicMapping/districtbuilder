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
- `PROJECT_UUIDS`: Space-separated list of UUIDs to use in place of the UUIDs
  in the HAR file (optional). Each request will be batched and run once per UUID
  (simulating concurrent user requests).

## Running

Below is an example of how to invoke an instance of the load test with Docker
Compose:

```shell
JWT_AUTH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1YzdjMDFmNS1jNWJmLTQzYjMtODczYi0wM2I3ZTA3Njg0MmEiLCJpZCI6IjVjN2MwMWY1LWM1YmYtNDNiMy04NzNiLTAzYjdlMDc2ODQyYSIsIm5hbWUiOiJNaWtlIiwiZW1haWwiOiJtbWF1cml6aUBhemF2ZWEuY29tIiwiaXNFbWFpbFZlcmlmaWVkIjp0cnVlLCJoYXNTZWVuVG91ciI6dHJ1ZSwiaWF0IjoxNjM0Njc0MDc2LCJleHAiOjE2MzUyNzg4NzZ9.GWvlk8b1tvF7r3Hqc_RAjgvD9hKyDkrdfj_VaajFr7I" HAR_FILE=patch-local-pa-project.har PROJECT_UUIDS="23f9bdca-33ae-4a86-a0b5-684a3f00a6a0 346f84d8-edc0-4fe6-82be-d36b4080f429 02a767f6-9c57-443e-9687-391650452d00 461fd73e-bcc3-4d4d-965e-52c26a603dd7 74ba0c9d-dd80-4880-9c82-e5c533907aa1 374e0d77-da3d-454d-89ee-62b1e18b0fee 8f2efda4-d945-4c64-b73d-814882011d44 fc80fdea-283a-4850-88d4-ee71915cddb2 6cb2ec1e-f382-4fa2-9312-2c617c220b3c fb38356f-dc79-496f-b065-a6030cbdf42f" REQ_ORIGIN="http://host.docker.internal:3003" \
docker-compose run --rm k6

          /\      |‾‾| /‾‾/   /‾‾/   
     /\  /  \     |  |/  /   /  /    
    /  \/    \    |     (   /   ‾‾\  
   /          \   |  |\  \ |  (‾)  | 
  / __________ \  |__| \__\ \_____/ .io

  execution: local
     script: /scripts/harness.js
     output: -

  scenarios: (100.00%) 1 scenario, 1 max VUs, 10m30s max duration (incl. graceful stop):
           * default: 1 iterations shared among 1 VUs (maxDuration: 10m0s, gracefulStop: 30s)


running (03m55.3s), 0/1 VUs, 1 complete and 0 interrupted iterations
default ✓ [======================================] 1 VUs  03m55.2s/10m0s  1/1 shared iters

     █ setup

     █ patch-local-pa-project.har

       ✓ is status 200

   ✓ checks.........................: 100.00% ✓ 140      ✗ 0  
     data_received..................: 141 MB  598 kB/s
     data_sent......................: 1.3 MB  5.7 kB/s
     group_duration.................: avg=3m55s    min=3m55s   med=3m55s   max=3m55s   p(90)=3m55s    p(95)=3m55s   
     http_req_blocked...............: avg=3.9ms    min=1.13ms  med=2.86ms  max=9.33ms  p(90)=8.49ms   p(95)=8.88ms  
     http_req_connecting............: avg=3.61ms   min=1.03ms  med=2.74ms  max=8.89ms  p(90)=7.88ms   p(95)=8.39ms  
     http_req_duration..............: avg=4.43s    min=58.69ms med=1.2s    max=15.78s  p(90)=13.56s   p(95)=15.04s  
       { expected_response:true }...: avg=4.43s    min=58.69ms med=1.2s    max=15.78s  p(90)=13.56s   p(95)=15.04s  
     http_req_failed................: 0.00%   ✓ 0        ✗ 140
     http_req_receiving.............: avg=251.83ms min=49.4µs  med=4.83ms  max=1.21s   p(90)=781.01ms p(95)=859.24ms
     http_req_sending...............: avg=208.57µs min=35.9µs  med=171.7µs max=732.6µs p(90)=372.43µs p(95)=584.17µs
     http_req_tls_handshaking.......: avg=0s       min=0s      med=0s      max=0s      p(90)=0s       p(95)=0s      
     http_req_waiting...............: avg=4.18s    min=58.47ms med=441.1ms max=15.78s  p(90)=13.56s   p(95)=15.03s  
     http_reqs......................: 140     0.59489/s
     iteration_duration.............: avg=1m57s    min=2.64ms  med=1m57s   max=3m55s   p(90)=3m31s    p(95)=3m43s   
     iterations.....................: 1       0.004249/s
     vus............................: 1       min=1      max=1
     vus_max........................: 1       min=1      max=1
```