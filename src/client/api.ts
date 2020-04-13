import axios from "axios";
import { IUser, JWT } from "../shared/entities";
import { getJWT, setJWT } from "./jwt";

const authToken = getJWT();
// tslint:disable-next-line no-if-statement
if (authToken) {
  // tslint:disable-next-line no-object-mutation no-unused-expression
  axios.defaults.headers.common.Authorization = `Bearer ${authToken}`;
}

export async function authenticateUser(email: string, password: string): Promise<JWT> {
  return new Promise((resolve, reject) => {
    axios
      .post("/api/auth/email/login", { email, password })
      .then(response => {
        // Save JWT so it can be in headers for subsequent requests
        setJWT(response.data);
        resolve(response.data);
      })
      .catch(error => reject(error.message));
  });
}

export async function fetchUsers(): Promise<ReadonlyArray<IUser>> {
  return new Promise((resolve, reject) => {
    axios
      .get("/api/users")
      .then(response => resolve(response.data))
      .catch(error => reject(error.message));
  });
}
