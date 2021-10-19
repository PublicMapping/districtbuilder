import http from "k6/http";
import { check, fail, group, sleep } from "k6";

if (!__ENV.HAR_FILE) fail("HAR_FILE must be set!");
if (!__ENV.JWT_AUTH_TOKEN) fail("JWT_AUTH_TOKEN must be set!");

export const options = {
  vus: 1,
  iterations: 1,
  discardResponseBodies: true,
  maxRedirects: 0
};

const har = JSON.parse(open(`./${__ENV.HAR_FILE}`));

export function setup() {
  const requests = {};

  har.log.entries.forEach(entry => {
    const startedDateTime = new Date(entry.startedDateTime);
    startedDateTime.setMilliseconds(0);

    const url = entry.request.url.replace(
      /(http|https):\/\/([^\/]+)\//,
      __ENV.REQ_ORIGIN ? `${__ENV.REQ_ORIGIN}/` : "$1://$2/"
    );

    const referer = entry.request.headers
      .find(header => header.name === "Referer")
      .value.replace(
        /(http|https):\/\/([^\/]+)\//,
        __ENV.REQ_ORIGIN ? `${__ENV.REQ_ORIGIN}/` : "$1://$2/"
      );

    const authorization = entry.request.headers
      .find(header => header.name === "Authorization")
      .value.replace(/^Bearer .*$/, `Bearer ${__ENV.JWT_AUTH_TOKEN}`);

    // We want to batch requests that occured within the same second
    const batchTime = startedDateTime.getTime();

    if (!requests.hasOwnProperty(batchTime)) {
      requests[batchTime] = [];
    }

    requests[batchTime].push([
      entry.request.method,
      url,
      entry.request.postData ? entry.request.postData.text : null,
      {
        headers: {
          // Specifically, for POST requests
          "Content-Type": "application/json",
          authorization,
          // Without this referer, CloudFront will throw a 401
          referer
        }
      }
    ]);
  });

  // Sort requests in ascending order
  let batches = Object.keys(requests);
  batches = batches.sort((a, b) => a - b);

  // Return a list of batches, and a map of batches to requests
  return [batches, requests];
}

export default data => {
  const batches = data[0];
  const requests = data[1];

  group(__ENV.HAR_FILE, () => {
    for (var i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const nextBatch = batches[i + 1];

      const responses = http.batch(requests[batch]);

      responses.forEach(res => {
        check(res, {
          "is status 200": r => r.status === 200
        });
      });

      // If there's another batch of requests, sleep for the appropriate duration
      if (nextBatch) {
        sleep(Math.floor((nextBatch - batch) / 1000));
      }
    }
  });
};
