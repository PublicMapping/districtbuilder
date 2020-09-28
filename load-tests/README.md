# Load Testing

This [k6](https://k6.io/) based load testing project is focused on automating
user requests that are known to stress parts of the application. All of the
components necessary to execute a load test are encapsulated in this directory.

## Variables

- `JWT_AUTH_TOKEN`: A DistrictBuilder JWT authentication token
- `DB_PROJECT_ID`: A DistrictBuilder project UUID (PA; 50 districts)
- `DB_DOMAIN`: The DistrictBuilder instance domain where the project above resides

## Running

Below is an example of how to invoke an instance of the load test with Docker
Compose:

```console
$ export DB_JWT_AUTH_TOKEN="..."
$ export DB_PROJECT_ID="f1824edc-588c-43d9-a094-1b914470910d"
$ export DB_DOMAIN="app.staging.districtbuilder.org"
$ docker-compose run --rm k6

          /\      |‾‾| /‾‾/   /‾‾/
     /\  /  \     |  |/  /   /  /
    /  \/    \    |     (   /   ‾‾\
   /          \   |  |\  \ |  (‾)  |
  / __________ \  |__| \__\ \_____/ .io

  execution: local
     script: /scripts/pa-50-districts.js
     output: -

  scenarios: (100.00%) 1 scenario, 20 max VUs, 3m30s max duration (incl. graceful stop):
           * default: 20 looping VUs for 3m0s (gracefulStop: 30s)


running (3m26.9s), 00/20 VUs, 60 complete and 0 interrupted iterations
default ✓ [======================================] 20 VUs  3m0s

    █ Picking PA districts

    data_received..............: 386 MB 1.9 MB/s
    data_sent..................: 1.9 MB 9.3 kB/s
    group_duration.............: avg=1m5s     min=57.16s  med=1m4s     max=1m15s   p(90)=1m14s    p(95)=1m14s
    http_req_blocked...........: avg=1.38ms   min=100ns   med=200ns    max=92.56ms p(90)=500ns    p(95)=600ns
    http_req_connecting........: avg=211.51µs min=0s      med=0s       max=16ms    p(90)=0s       p(95)=0s
    http_req_duration..........: avg=2.98s    min=32.23ms med=2.34s    max=15.69s  p(90)=5.78s    p(95)=8.22s
    http_req_receiving.........: avg=519.78ms min=14.3µs  med=268.25µs max=10.05s  p(90)=1.69s    p(95)=2.42s
    http_req_sending...........: avg=83.68µs  min=21.9µs  med=72.95µs  max=985.8µs p(90)=130.32µs p(95)=142.11µs
    http_req_tls_handshaking...: avg=871.29µs min=0s      med=0s       max=60.4ms  p(90)=0s       p(95)=0s
    http_req_waiting...........: avg=2.46s    min=31.95ms med=1.61s    max=15.69s  p(90)=5.26s    p(95)=7.2s
    http_reqs..................: 1320   6.379084/s
    iteration_duration.........: avg=1m6s     min=58.16s  med=1m5s     max=1m16s   p(90)=1m15s    p(95)=1m15s
    iterations.................: 60     0.289958/s
    vus........................: 4      min=4  max=20
    vus_max....................: 20     min=20 max=20
```
