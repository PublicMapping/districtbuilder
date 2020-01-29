import axios from "axios";
import { IUser } from "../shared/entities";

export async function fetchUsers(): Promise<ReadonlyArray<IUser>> {
  return new Promise((resolve, reject) => {
    axios
      .get("/users")
      .then(response => resolve(response.data))
      .catch(error => reject(error.message));
  });
}
