import axios from "axios";
import { IUser, JWT } from "../shared/entities";
import { getJWT, setJWT } from "./jwt";

function setAxiosAuthHeaders(jwt: JWT): void {
  // tslint:disable-next-line no-object-mutation no-unused-expression
  axios.defaults.headers.common.Authorization = `Bearer ${jwt}`;
}

const authToken = getJWT();
// tslint:disable-next-line no-if-statement
if (authToken) {
  setAxiosAuthHeaders(authToken);
}

function saveJWT(jwt: JWT): void {
  setJWT(jwt);
  setAxiosAuthHeaders(jwt);
}

export async function authenticateUser(email: string, password: string): Promise<JWT> {
  return new Promise((resolve, reject) => {
    axios
      .post("/api/auth/email/login", { email, password })
      .then(response => {
        const jwt = response.data;
        saveJWT(jwt);
        resolve(jwt);
      })
      .catch(error => reject(error.message));
  });
}

export async function fetchUser(): Promise<IUser> {
  return new Promise((resolve, reject) => {
    axios
      .get("/api/user")
      .then(response => resolve(response.data))
      .catch(error => reject(error.message));
  });
}

export async function registerUser(name: string, email: string, password: string): Promise<IUser> {
  return new Promise((resolve, reject) => {
    axios
      .post("/api/auth/email/register", { name, email, password })
      .then(() => resolve())
      .catch(error => reject(error.message));
  });
}

export async function activateAccount(token: string): Promise<JWT> {
  return new Promise((resolve, reject) => {
    axios
      .post(`/api/auth/email/verify/${token}`)
      .then(response => {
        const jwt = response.data;
        saveJWT(jwt);
        resolve(jwt);
      })
      .catch(error => reject(error.message));
  });
}
