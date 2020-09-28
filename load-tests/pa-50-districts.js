import { fail, sleep, group } from "k6";
import http from "k6/http";

if (!__ENV.DB_JWT_AUTH_TOKEN) fail("DB_JWT_AUTH_TOKEN must be set!");
if (!__ENV.DB_PROJECT_ID) fail("DB_PROJECT_ID must be set!");
if (!__ENV.DB_DOMAIN) fail("DB_DOMAIN must be set!");

export const options = {
  maxRedirects: 0,
  vus: 20,
  duration: "3m",
  thresholds: {
    "failed requests": ["rate<0.1"],
  },
  discardResponseBodies: true,
};

export default function main() {
  let response;

  group("Picking PA districts", function () {
    response = http.patch(
      `https://${__ENV.DB_DOMAIN}/api/projects/${__ENV.DB_PROJECT_ID}`,
      '{"districtsDefinition":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0]}',
      {
        headers: {
          accept: "application/json, text/plain, */*",
          dnt: "1",
          authorization: `Bearer ${__ENV.DB_JWT_AUTH_TOKEN}`,
          "content-type": "application/json;charset=UTF-8",
          origin: `https://${__ENV.DB_DOMAIN}`,
          "sec-fetch-site": "same-origin",
          "sec-fetch-mode": "cors",
          "sec-fetch-dest": "empty",
          referer: `https://${__ENV.DB_DOMAIN}/projects/${__ENV.DB_PROJECT_ID}`,
          "accept-encoding": "gzip, deflate, br",
          "accept-language": "en-US,en;q=0.9",
          "Content-Type": "application/json;charset=UTF-8",
        },
      }
    );

    response = http.get(
      `https://${__ENV.DB_DOMAIN}/api/projects/${__ENV.DB_PROJECT_ID}/export/geojson`,
      {
        headers: {
          accept: "application/json, text/plain, */*",
          dnt: "1",
          authorization: `Bearer ${__ENV.DB_JWT_AUTH_TOKEN}`,
          "sec-fetch-site": "same-origin",
          "sec-fetch-mode": "cors",
          "sec-fetch-dest": "empty",
          referer: `https://${__ENV.DB_DOMAIN}/projects/${__ENV.DB_PROJECT_ID}`,
          "accept-encoding": "gzip, deflate, br",
          "accept-language": "en-US,en;q=0.9",
          "if-none-match": 'W/"1c0f6-ns78/pffBdzM6rVVDt6j6JXZ/mo"',
        },
      }
    );

    response = http.patch(
      `https://${__ENV.DB_DOMAIN}/api/projects/${__ENV.DB_PROJECT_ID}`,
      '{"districtsDefinition":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,1,0,0,0,0,0]}',
      {
        headers: {
          accept: "application/json, text/plain, */*",
          dnt: "1",
          authorization: `Bearer ${__ENV.DB_JWT_AUTH_TOKEN}`,
          "content-type": "application/json;charset=UTF-8",
          origin: `https://${__ENV.DB_DOMAIN}`,
          "sec-fetch-site": "same-origin",
          "sec-fetch-mode": "cors",
          "sec-fetch-dest": "empty",
          referer: `https://${__ENV.DB_DOMAIN}/projects/${__ENV.DB_PROJECT_ID}`,
          "accept-encoding": "gzip, deflate, br",
          "accept-language": "en-US,en;q=0.9",
          "Content-Type": "application/json;charset=UTF-8",
        },
      }
    );

    response = http.get(
      `https://${__ENV.DB_DOMAIN}/api/projects/${__ENV.DB_PROJECT_ID}/export/geojson`,
      {
        headers: {
          accept: "application/json, text/plain, */*",
          dnt: "1",
          authorization: `Bearer ${__ENV.DB_JWT_AUTH_TOKEN}`,
          "sec-fetch-site": "same-origin",
          "sec-fetch-mode": "cors",
          "sec-fetch-dest": "empty",
          referer: `https://${__ENV.DB_DOMAIN}/projects/${__ENV.DB_PROJECT_ID}`,
          "accept-encoding": "gzip, deflate, br",
          "accept-language": "en-US,en;q=0.9",
          "if-none-match": 'W/"21087-jtjfyP2jLCL5m84n8t+nXmxIb+4"',
        },
      }
    );

    response = http.patch(
      `https://${__ENV.DB_DOMAIN}/api/projects/${__ENV.DB_PROJECT_ID}`,
      '{"districtsDefinition":[0,0,0,0,0,0,0,0,0,3,0,3,0,0,0,3,0,0,0,1,0,0,0,3,1,0,2,0,0,0,0,0,3,0,0,0,3,0,0,0,0,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,1,0,0,0,0,0]}',
      {
        headers: {
          accept: "application/json, text/plain, */*",
          dnt: "1",
          authorization: `Bearer ${__ENV.DB_JWT_AUTH_TOKEN}`,
          "content-type": "application/json;charset=UTF-8",
          origin: `https://${__ENV.DB_DOMAIN}`,
          "sec-fetch-site": "same-origin",
          "sec-fetch-mode": "cors",
          "sec-fetch-dest": "empty",
          referer: `https://${__ENV.DB_DOMAIN}/projects/${__ENV.DB_PROJECT_ID}`,
          "accept-encoding": "gzip, deflate, br",
          "accept-language": "en-US,en;q=0.9",
          "Content-Type": "application/json;charset=UTF-8",
        },
      }
    );

    response = http.get(
      `https://${__ENV.DB_DOMAIN}/api/projects/${__ENV.DB_PROJECT_ID}/export/geojson`,
      {
        headers: {
          accept: "application/json, text/plain, */*",
          dnt: "1",
          authorization: `Bearer ${__ENV.DB_JWT_AUTH_TOKEN}`,
          "sec-fetch-site": "same-origin",
          "sec-fetch-mode": "cors",
          "sec-fetch-dest": "empty",
          referer: `https://${__ENV.DB_DOMAIN}/projects/${__ENV.DB_PROJECT_ID}`,
          "accept-encoding": "gzip, deflate, br",
          "accept-language": "en-US,en;q=0.9",
          "if-none-match": 'W/"2aed0-7EiNhf1DLs50nWLADSTVtmPqd+k"',
        },
      }
    );

    response = http.patch(
      `https://${__ENV.DB_DOMAIN}/api/projects/${__ENV.DB_PROJECT_ID}`,
      '{"districtsDefinition":[0,4,4,4,0,0,0,0,0,3,0,3,0,0,0,3,4,4,0,1,0,0,0,3,1,0,2,0,0,0,0,4,3,0,0,0,3,0,0,0,0,2,2,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,2,1,0,0,0,0,0]}',
      {
        headers: {
          accept: "application/json, text/plain, */*",
          dnt: "1",
          authorization: `Bearer ${__ENV.DB_JWT_AUTH_TOKEN}`,
          "content-type": "application/json;charset=UTF-8",
          origin: `https://${__ENV.DB_DOMAIN}`,
          "sec-fetch-site": "same-origin",
          "sec-fetch-mode": "cors",
          "sec-fetch-dest": "empty",
          referer: `https://${__ENV.DB_DOMAIN}/projects/${__ENV.DB_PROJECT_ID}`,
          "accept-encoding": "gzip, deflate, br",
          "accept-language": "en-US,en;q=0.9",
          "Content-Type": "application/json;charset=UTF-8",
        },
      }
    );

    response = http.get(
      `https://${__ENV.DB_DOMAIN}/api/projects/${__ENV.DB_PROJECT_ID}/export/geojson`,
      {
        headers: {
          accept: "application/json, text/plain, */*",
          dnt: "1",
          authorization: `Bearer ${__ENV.DB_JWT_AUTH_TOKEN}`,
          "sec-fetch-site": "same-origin",
          "sec-fetch-mode": "cors",
          "sec-fetch-dest": "empty",
          referer: `https://${__ENV.DB_DOMAIN}/projects/${__ENV.DB_PROJECT_ID}`,
          "accept-encoding": "gzip, deflate, br",
          "accept-language": "en-US,en;q=0.9",
          "if-none-match": 'W/"3e61f-KZxvos+nlyFHaW7MtSOjsh2EDC0"',
        },
      }
    );

    response = http.patch(
      `https://${__ENV.DB_DOMAIN}/api/projects/${__ENV.DB_PROJECT_ID}`,
      '{"districtsDefinition":[0,4,4,4,0,0,0,0,0,3,5,3,0,5,0,3,4,4,0,1,0,0,0,3,1,0,2,0,0,0,0,4,3,0,0,0,3,0,0,0,5,2,2,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,5,0,2,1,5,0,5,0,0]}',
      {
        headers: {
          accept: "application/json, text/plain, */*",
          dnt: "1",
          authorization: `Bearer ${__ENV.DB_JWT_AUTH_TOKEN}`,
          "content-type": "application/json;charset=UTF-8",
          origin: `https://${__ENV.DB_DOMAIN}`,
          "sec-fetch-site": "same-origin",
          "sec-fetch-mode": "cors",
          "sec-fetch-dest": "empty",
          referer: `https://${__ENV.DB_DOMAIN}/projects/${__ENV.DB_PROJECT_ID}`,
          "accept-encoding": "gzip, deflate, br",
          "accept-language": "en-US,en;q=0.9",
          "Content-Type": "application/json;charset=UTF-8",
        },
      }
    );

    response = http.get(
      `https://${__ENV.DB_DOMAIN}/api/projects/${__ENV.DB_PROJECT_ID}/export/geojson`,
      {
        headers: {
          accept: "application/json, text/plain, */*",
          dnt: "1",
          authorization: `Bearer ${__ENV.DB_JWT_AUTH_TOKEN}`,
          "sec-fetch-site": "same-origin",
          "sec-fetch-mode": "cors",
          "sec-fetch-dest": "empty",
          referer: `https://${__ENV.DB_DOMAIN}/projects/${__ENV.DB_PROJECT_ID}`,
          "accept-encoding": "gzip, deflate, br",
          "accept-language": "en-US,en;q=0.9",
          "if-none-match": 'W/"69d27-jkjxggxhGDLOoIhT87890TkXYjc"',
        },
      }
    );

    response = http.patch(
      `https://${__ENV.DB_DOMAIN}/api/projects/${__ENV.DB_PROJECT_ID}`,
      '{"districtsDefinition":[0,4,4,4,0,0,6,6,0,3,5,3,0,6,0,3,4,4,0,1,0,0,0,3,1,6,2,0,0,6,0,4,3,0,0,0,3,0,0,0,5,2,2,6,0,0,0,0,6,0,0,0,4,0,0,6,6,0,5,6,2,1,5,0,5,0,0]}',
      {
        headers: {
          accept: "application/json, text/plain, */*",
          dnt: "1",
          authorization: `Bearer ${__ENV.DB_JWT_AUTH_TOKEN}`,
          "content-type": "application/json;charset=UTF-8",
          origin: `https://${__ENV.DB_DOMAIN}`,
          "sec-fetch-site": "same-origin",
          "sec-fetch-mode": "cors",
          "sec-fetch-dest": "empty",
          referer: `https://${__ENV.DB_DOMAIN}/projects/${__ENV.DB_PROJECT_ID}`,
          "accept-encoding": "gzip, deflate, br",
          "accept-language": "en-US,en;q=0.9",
          "Content-Type": "application/json;charset=UTF-8",
        },
      }
    );

    response = http.get(
      `https://${__ENV.DB_DOMAIN}/api/projects/${__ENV.DB_PROJECT_ID}/export/geojson`,
      {
        headers: {
          accept: "application/json, text/plain, */*",
          dnt: "1",
          authorization: `Bearer ${__ENV.DB_JWT_AUTH_TOKEN}`,
          "sec-fetch-site": "same-origin",
          "sec-fetch-mode": "cors",
          "sec-fetch-dest": "empty",
          referer: `https://${__ENV.DB_DOMAIN}/projects/${__ENV.DB_PROJECT_ID}`,
          "accept-encoding": "gzip, deflate, br",
          "accept-language": "en-US,en;q=0.9",
          "if-none-match": 'W/"8b3ed-9n1nEuCsm9vcTF+B7UoiGudLboQ"',
        },
      }
    );

    response = http.patch(
      `https://${__ENV.DB_DOMAIN}/api/projects/${__ENV.DB_PROJECT_ID}`,
      '{"districtsDefinition":[0,4,4,4,7,0,6,6,0,3,5,3,0,6,0,3,4,4,7,1,0,0,0,3,1,6,2,7,7,6,7,4,3,7,0,0,3,0,0,7,5,2,2,6,0,0,7,0,6,0,0,0,4,0,7,6,6,7,5,6,2,1,5,0,5,7,0]}',
      {
        headers: {
          accept: "application/json, text/plain, */*",
          dnt: "1",
          authorization: `Bearer ${__ENV.DB_JWT_AUTH_TOKEN}`,
          "content-type": "application/json;charset=UTF-8",
          origin: `https://${__ENV.DB_DOMAIN}`,
          "sec-fetch-site": "same-origin",
          "sec-fetch-mode": "cors",
          "sec-fetch-dest": "empty",
          referer: `https://${__ENV.DB_DOMAIN}/projects/${__ENV.DB_PROJECT_ID}`,
          "accept-encoding": "gzip, deflate, br",
          "accept-language": "en-US,en;q=0.9",
          "Content-Type": "application/json;charset=UTF-8",
        },
      }
    );

    response = http.get(
      `https://${__ENV.DB_DOMAIN}/api/projects/${__ENV.DB_PROJECT_ID}/export/geojson`,
      {
        headers: {
          accept: "application/json, text/plain, */*",
          dnt: "1",
          authorization: `Bearer ${__ENV.DB_JWT_AUTH_TOKEN}`,
          "sec-fetch-site": "same-origin",
          "sec-fetch-mode": "cors",
          "sec-fetch-dest": "empty",
          referer: `https://${__ENV.DB_DOMAIN}/projects/${__ENV.DB_PROJECT_ID}`,
          "accept-encoding": "gzip, deflate, br",
          "accept-language": "en-US,en;q=0.9",
          "if-none-match": 'W/"af20b-5MA8MjXe61/beCHQdiFrA9DPqRE"',
        },
      }
    );

    response = http.patch(
      `https://${__ENV.DB_DOMAIN}/api/projects/${__ENV.DB_PROJECT_ID}`,
      '{"districtsDefinition":[8,4,4,4,7,0,6,6,0,3,5,3,8,6,0,3,4,4,7,1,8,8,0,3,1,6,2,7,7,6,7,4,3,7,8,0,3,0,0,7,5,2,2,6,8,0,7,0,6,8,0,0,4,8,7,6,6,7,5,6,2,1,5,8,5,7,0]}',
      {
        headers: {
          accept: "application/json, text/plain, */*",
          dnt: "1",
          authorization: `Bearer ${__ENV.DB_JWT_AUTH_TOKEN}`,
          "content-type": "application/json;charset=UTF-8",
          origin: `https://${__ENV.DB_DOMAIN}`,
          "sec-fetch-site": "same-origin",
          "sec-fetch-mode": "cors",
          "sec-fetch-dest": "empty",
          referer: `https://${__ENV.DB_DOMAIN}/projects/${__ENV.DB_PROJECT_ID}`,
          "accept-encoding": "gzip, deflate, br",
          "accept-language": "en-US,en;q=0.9",
          "Content-Type": "application/json;charset=UTF-8",
        },
      }
    );

    response = http.get(
      `https://${__ENV.DB_DOMAIN}/api/projects/${__ENV.DB_PROJECT_ID}/export/geojson`,
      {
        headers: {
          accept: "application/json, text/plain, */*",
          dnt: "1",
          authorization: `Bearer ${__ENV.DB_JWT_AUTH_TOKEN}`,
          "sec-fetch-site": "same-origin",
          "sec-fetch-mode": "cors",
          "sec-fetch-dest": "empty",
          referer: `https://${__ENV.DB_DOMAIN}/projects/${__ENV.DB_PROJECT_ID}`,
          "accept-encoding": "gzip, deflate, br",
          "accept-language": "en-US,en;q=0.9",
          "if-none-match": 'W/"c7c43-7pFXk1FDTv9OsCj4qRVzlMXSHsU"',
        },
      }
    );

    response = http.patch(
      `https://${__ENV.DB_DOMAIN}/api/projects/${__ENV.DB_PROJECT_ID}`,
      '{"districtsDefinition":[8,4,4,4,7,9,6,6,0,3,5,3,8,6,0,3,4,4,7,1,8,8,0,3,1,6,2,7,7,6,7,4,3,7,8,0,3,9,9,7,5,2,2,6,8,0,7,9,6,8,0,9,4,8,7,6,6,7,5,6,2,1,5,8,5,7,9]}',
      {
        headers: {
          accept: "application/json, text/plain, */*",
          dnt: "1",
          authorization: `Bearer ${__ENV.DB_JWT_AUTH_TOKEN}`,
          "content-type": "application/json;charset=UTF-8",
          origin: `https://${__ENV.DB_DOMAIN}`,
          "sec-fetch-site": "same-origin",
          "sec-fetch-mode": "cors",
          "sec-fetch-dest": "empty",
          referer: `https://${__ENV.DB_DOMAIN}/projects/${__ENV.DB_PROJECT_ID}`,
          "accept-encoding": "gzip, deflate, br",
          "accept-language": "en-US,en;q=0.9",
          "Content-Type": "application/json;charset=UTF-8",
        },
      }
    );

    response = http.get(
      `https://${__ENV.DB_DOMAIN}/api/projects/${__ENV.DB_PROJECT_ID}/export/geojson`,
      {
        headers: {
          accept: "application/json, text/plain, */*",
          dnt: "1",
          authorization: `Bearer ${__ENV.DB_JWT_AUTH_TOKEN}`,
          "sec-fetch-site": "same-origin",
          "sec-fetch-mode": "cors",
          "sec-fetch-dest": "empty",
          referer: `https://${__ENV.DB_DOMAIN}/projects/${__ENV.DB_PROJECT_ID}`,
          "accept-encoding": "gzip, deflate, br",
          "accept-language": "en-US,en;q=0.9",
          "if-none-match": 'W/"e62f0-oixPCWfh6+ra3UAgkUKbJn9Y82c"',
        },
      }
    );

    response = http.patch(
      `https://${__ENV.DB_DOMAIN}/api/projects/${__ENV.DB_PROJECT_ID}`,
      '{"districtsDefinition":[8,4,4,4,7,9,6,6,10,3,5,3,8,6,10,3,4,4,7,1,8,8,0,3,1,6,2,7,7,6,7,4,3,7,8,10,3,9,9,7,5,2,2,6,8,10,7,9,6,8,0,9,4,8,7,6,6,7,5,6,2,1,5,8,5,7,9]}',
      {
        headers: {
          accept: "application/json, text/plain, */*",
          dnt: "1",
          authorization: `Bearer ${__ENV.DB_JWT_AUTH_TOKEN}`,
          "content-type": "application/json;charset=UTF-8",
          origin: `https://${__ENV.DB_DOMAIN}`,
          "sec-fetch-site": "same-origin",
          "sec-fetch-mode": "cors",
          "sec-fetch-dest": "empty",
          referer: `https://${__ENV.DB_DOMAIN}/projects/${__ENV.DB_PROJECT_ID}`,
          "accept-encoding": "gzip, deflate, br",
          "accept-language": "en-US,en;q=0.9",
          "Content-Type": "application/json;charset=UTF-8",
        },
      }
    );

    response = http.get(
      `https://${__ENV.DB_DOMAIN}/api/projects/${__ENV.DB_PROJECT_ID}/export/geojson`,
      {
        headers: {
          accept: "application/json, text/plain, */*",
          dnt: "1",
          authorization: `Bearer ${__ENV.DB_JWT_AUTH_TOKEN}`,
          "sec-fetch-site": "same-origin",
          "sec-fetch-mode": "cors",
          "sec-fetch-dest": "empty",
          referer: `https://${__ENV.DB_DOMAIN}/projects/${__ENV.DB_PROJECT_ID}`,
          "accept-encoding": "gzip, deflate, br",
          "accept-language": "en-US,en;q=0.9",
          "if-none-match": 'W/"f244b-sbA3nDMGg74/EYe93IaFQVT1IvA"',
        },
      }
    );

    response = http.patch(
      `https://${__ENV.DB_DOMAIN}/api/projects/${__ENV.DB_PROJECT_ID}`,
      '{"districtsDefinition":[8,4,4,4,7,9,6,6,10,3,5,3,8,6,10,3,4,4,7,1,8,8,11,3,1,6,2,7,7,6,7,4,3,7,8,10,3,9,9,7,5,2,2,6,8,10,7,9,6,8,11,9,4,8,7,6,6,7,5,6,2,1,5,8,5,7,9]}',
      {
        headers: {
          accept: "application/json, text/plain, */*",
          dnt: "1",
          authorization: `Bearer ${__ENV.DB_JWT_AUTH_TOKEN}`,
          "content-type": "application/json;charset=UTF-8",
          origin: `https://${__ENV.DB_DOMAIN}`,
          "sec-fetch-site": "same-origin",
          "sec-fetch-mode": "cors",
          "sec-fetch-dest": "empty",
          referer: `https://${__ENV.DB_DOMAIN}/projects/${__ENV.DB_PROJECT_ID}`,
          "accept-encoding": "gzip, deflate, br",
          "accept-language": "en-US,en;q=0.9",
          "Content-Type": "application/json;charset=UTF-8",
        },
      }
    );

    response = http.get(
      `https://${__ENV.DB_DOMAIN}/api/projects/${__ENV.DB_PROJECT_ID}/export/geojson`,
      {
        headers: {
          accept: "application/json, text/plain, */*",
          dnt: "1",
          authorization: `Bearer ${__ENV.DB_JWT_AUTH_TOKEN}`,
          "sec-fetch-site": "same-origin",
          "sec-fetch-mode": "cors",
          "sec-fetch-dest": "empty",
          referer: `https://${__ENV.DB_DOMAIN}/projects/${__ENV.DB_PROJECT_ID}`,
          "accept-encoding": "gzip, deflate, br",
          "accept-language": "en-US,en;q=0.9",
          "if-none-match": 'W/"fd940-f/5GUFz3SiRRUF9xDQa7J7v5KHU"',
        },
      }
    );
  });

  // Automatically added sleep
  sleep(1);
}
