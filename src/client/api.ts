import axios from "axios";

import {
  CreateProjectData,
  IProject,
  IRegionConfig,
  IUser,
  JWT,
  ProjectId
} from "../shared/entities";
import { getJWT, setJWT } from "./jwt";

const apiAxios = axios.create();

function setAxiosAuthHeaders(jwt: JWT): void {
  // tslint:disable-next-line no-object-mutation no-unused-expression
  apiAxios.defaults.headers.common.Authorization = `Bearer ${jwt}`;
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
    apiAxios
      .post("/api/auth/email/login", { email, password })
      .then(response => {
        const jwt = response.data;
        saveJWT(jwt);
        resolve(jwt);
      })
      .catch(error => reject(error.response.data));
  });
}

export async function fetchUser(): Promise<IUser> {
  return new Promise((resolve, reject) => {
    apiAxios
      .get("/api/user")
      .then(response => resolve(response.data))
      .catch(error => reject(error.message));
  });
}

export async function registerUser(name: string, email: string, password: string): Promise<IUser> {
  return new Promise((resolve, reject) => {
    apiAxios
      .post("/api/auth/email/register", { name, email, password })
      .then(() => resolve())
      .catch(error => reject(error.response.data));
  });
}

export async function initiateForgotPassword(email: string): Promise<void> {
  return new Promise((resolve, reject) => {
    apiAxios
      .post(`/api/auth/email/forgot-password/${email}`)
      .then(() => resolve())
      .catch(error => reject(error.response.data));
  });
}

export async function activateAccount(token: string): Promise<JWT> {
  return new Promise((resolve, reject) => {
    apiAxios
      .post(`/api/auth/email/verify/${token}`)
      .then(response => {
        const jwt = response.data;
        saveJWT(jwt);
        resolve(jwt);
      })
      .catch(error => reject(error.message));
  });
}

export async function createProject({
  name,
  numberOfDistricts,
  regionConfig
}: CreateProjectData): Promise<IProject> {
  return new Promise((resolve, reject) => {
    apiAxios
      .post(`/api/projects`, { name, numberOfDistricts, regionConfig })
      .then(response => resolve(response.data))
      .catch(error => reject(error.response.data));
  });
}

export async function fetchProject(id: ProjectId): Promise<readonly IProject[]> {
  return new Promise((resolve, reject) => {
    apiAxios
      .get(`/api/projects/${id}`)
      .then(response => resolve(response.data))
      .catch(error => reject(error.message));
  });
}

export async function fetchProjects(): Promise<readonly IProject[]> {
  return new Promise((resolve, reject) => {
    apiAxios
      .get("/api/projects")
      .then(response => resolve(response.data))
      .catch(error => reject(error.message));
  });
}

export async function fetchRegionConfigs(): Promise<IRegionConfig> {
  return new Promise((resolve, reject) => {
    apiAxios
      .get("/api/region-configs")
      .then(response => resolve(response.data))
      .catch(error => reject(error.message));
  });
}
