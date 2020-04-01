export enum LoginErrors {
  NOT_FOUND,
  INVALID_PASSWORD,
  ERROR
}

export enum MakeDistrictsErrors {
  TOPOLOGY_NOT_FOUND,
  INVALID_DEFINITION
}

export enum RegisterResponse {
  SUCCESS,
  DUPLICATE,
  INVALID,
  ERROR
}

export enum ResendResponse {
  SUCCESS,
  NOT_FOUND,
  ERROR
}

export enum VerifyEmailErrors {
  NOT_FOUND,
  ERROR
}
