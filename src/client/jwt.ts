import jwtDecode from "jwt-decode";

import { JWT, JWTPayload } from "../shared/entities";

const JWT_ITEM_KEY = "jwt";

export const getJWT = () => localStorage.getItem(JWT_ITEM_KEY);
export const setJWT = (jwt: JWT) => localStorage.setItem(JWT_ITEM_KEY, jwt);
export const clearJWT = () => localStorage.removeItem(JWT_ITEM_KEY);
export const jwtIsExpired = (jwt: JWT) => {
  const payload = jwtDecode(jwt) as JWTPayload;
  return payload.exp < Math.round(new Date().getTime() / 1000);
};
