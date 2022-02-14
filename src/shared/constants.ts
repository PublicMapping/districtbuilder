export enum ForgotPasswordResponse {
  SUCCESS = "SUCCESS",
  NOT_FOUND = "NOT_FOUND"
}

export enum LoginErrors {
  NOT_FOUND = "NOT_FOUND",
  INVALID_PASSWORD = "INVALID_PASSWORD"
}

export enum MakeDistrictsErrors {
  TOPOLOGY_NOT_FOUND = "TOPOLOGY_NOT_FOUND",
  INVALID_DEFINITION = "INVALID_DEFINITION"
}

export enum JoinOrganizationErrors {
  USER_NOT_FOUND = "USER_NOT_FOUND",
  ORGANIZATION_NOT_FOUND = "ORGANIZATION_NOT_FOUND"
}

export enum RegisterResponse {
  SUCCESS = "SUCCESS",
  DUPLICATE = "DUPLICATE",
  INVALID = "INVALID"
}

export enum ResendResponse {
  SUCCESS = "SUCCESS",
  NOT_FOUND = "NOT_FOUND"
}

export enum ResetPasswordResponse {
  SUCCESS = "SUCCESS",
  NOT_FOUND = "NOT_FOUND"
}

export enum VerifyEmailErrors {
  NOT_FOUND = "NOT_FOUND"
}

export enum ProjectVisibility {
  Private = "PRIVATE",
  Visible = "VISIBLE",
  Published = "PUBLISHED"
}

export enum CensusDate {
  Census2010 = "2010",
  Census2020 = "2020"
}

export enum ReferenceLayerTypes {
  Polygon = "POLYGON",
  Point = "POINT"
}

export const DEFAULT_POPULATION_DEVIATION = 5;

export const DEFAULT_PINNED_METRIC_FIELDS = [
  "population",
  "populationDeviation",
  "raceChart",
  "pvi",
  "compactness"
];

export const CORE_METRIC_FIELDS = [
  "population",
  "populationDeviation",
  "raceChart",
  "majorityRace",
  "pvi",
  "compactness",
  "contiguity"
];

export const DEMOGRAPHIC_FIELDS_ORDER = [
  "white",
  "black",
  "asian",
  "hispanic",
  "native",
  "pacific",
  "multiracial",
  "other"
] as const;

export const FIPS: { readonly [fips: string]: string } = {
  "10": "DE",
  "11": "DC",
  "12": "FL",
  "13": "GA",
  "15": "HI",
  "16": "ID",
  "17": "IL",
  "18": "IN",
  "19": "IA",
  "20": "KS",
  "21": "KY",
  "22": "LA",
  "23": "ME",
  "24": "MD",
  "25": "MA",
  "26": "MI",
  "27": "MN",
  "28": "MS",
  "29": "MO",
  "30": "MT",
  "31": "NE",
  "32": "NV",
  "33": "NH",
  "34": "NJ",
  "35": "NM",
  "36": "NY",
  "37": "NC",
  "38": "ND",
  "39": "OH",
  "40": "OK",
  "41": "OR",
  "42": "PA",
  "44": "RI",
  "45": "SC",
  "46": "SD",
  "47": "TN",
  "48": "TX",
  "49": "UT",
  "50": "VT",
  "51": "VA",
  "53": "WA",
  "54": "WV",
  "55": "WI",
  "56": "WY",
  "60": "AS",
  "66": "GU",
  "69": "MP",
  "72": "PR",
  "74": "UM",
  "78": "VI",
  "01": "AL",
  "02": "AK",
  "04": "AZ",
  "05": "AR",
  "06": "CA",
  "08": "CO",
  "09": "CT"
};

export const REGION_TO_FIPS = Object.fromEntries(
  Object.entries(FIPS).map(([fips, state]) => [state, fips])
);

// Maximum allowable upload size, in bytes
export const MAX_UPLOAD_FILE_SIZE = 25_000_000;

export const MAX_IMPORT_ERRORS = 1_000;
