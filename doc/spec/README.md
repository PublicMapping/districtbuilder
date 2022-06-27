# API Spec

## List global projects

Get a paginated list of global projects.

**URL** : `/api/globalProjects`

**Method** : `GET`

**Auth required** : NO

**Permissions required** : N/A

**Query Parameters** :
- `page`: Integer; Page number; Default: `1`; Optional
- `limit`: Integer; Number of global projects per page; Default: `10`; Optional
- `completed`: Boolean; Filter to return completed projects or not; Default: `false`; Optional
- `region`: String; Filter to the projects matching specified region code; Default: `undefined`; Optional

## Success Response

**Code** : `200 OK`

**Content examples**

```json
{
    "items": [
        {
            "id": "UUID of a global project",
            "name": "Example project name",
            "numberOfDistricts": 10,
            "simplifiedDistricts": {
                "type": "FeatureCollection",
                "features": [
                    {
                        "id": 0,
                        "type": "Feature",
                        "geometry": {
                            "type": "MultiPolygon",
                            "coordinates": [...
                            ]
                        },
                        "properties": {
                            "voting": {
                                "democrat16": 0,
                                "republican16": 0,
                                "other party16": 0
                            },
                            "contiguity": "",
                            "compactness": 0,
                            "demographics": {
                                "VAP": 0,
                                "CVAP": 0,
                                "asian": 0,
                                "black": 0,
                                "white": 0,
                                "native": 0,
                                "pacific": 0,
                                "hispanic": 0,
                                "VAP Asian": 0,
                                "VAP Black": 0,
                                "VAP White": 0,
                                "CVAP Asian": 0,
                                "CVAP Black": 0,
                                "CVAP White": 0,
                                "VAP Native": 0,
                                "population": 0,
                                "CVAP Native": 0,
                                "VAP Pacific": 0,
                                "CVAP Pacific": 0,
                                "VAP Hispanic": 0,
                                "CVAP Hispanic": 0
                            }
                        }
                    },
                    ...
                ],
                "metadata": {
                    "creator": {
                        "id": "UUID of user",
                        "name": "Example user name"
                    },
                    "completed": true,
                    "regionConfig": {
                        "id": "UUID of config",
                        "name": "Example region config name",
                        "s3URI": "s3://path/to/example/config/location",
                        "regionCode": "Example region code",
                        "countryCode": "Example country code"
                    }
                }
            },
            "createdDt": "2022-06-24T00:00:00.000Z",
            "updatedDt": "2022-06-24T00:00:00.000Z",
            "submittedDt": null,
            "regionConfig": {
                "id": "UUID of config",
                "name": "Example region config name",
                "s3URI": "s3://path/to/example/config/location",
                "archived": false
            },
            "user": {
                "id": "UUID of user",
                "name": "Example user name"
            },
            "chamber": null
        },
        ...
    ],
    "meta": {
        "totalItems": 70,
        "itemCount": 8,
        "itemsPerPage": 8,
        "totalPages": 9,
        "currentPage": 1
    }
}
```
