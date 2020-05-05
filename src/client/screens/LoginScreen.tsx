import React, { useState } from "react";
import { Redirect } from "react-router-dom";

import { JWT, Login } from "../../shared/entities";
import { authenticateUser } from "../api";
import { jwtIsExpired } from "../jwt";
import { WriteResource } from "../resource";
import { buildErrors, getErrorMessage, getFieldErrors } from "../utility";

const LoginScreen = () => {
  const [loginResource, setLoginResource] = useState<WriteResource<Login, JWT>>({
    data: {
      email: "",
      password: ""
    }
  });
  const { data } = loginResource;
  const errorMessage = getErrorMessage(loginResource);
  const fieldErrors = getFieldErrors(loginResource);

  return "resource" in loginResource && !jwtIsExpired(loginResource.resource) ? (
    <Redirect to="/" />
  ) : (
    <form
      onSubmit={(e: React.FormEvent) => {
        e.preventDefault();
        setLoginResource({ data, isPending: true });
        authenticateUser(data.email, data.password)
          .then(jwt => setLoginResource({ data, resource: jwt }))
          .catch(errors => {
            setLoginResource({ data, errors });
          });
      }}
    >
      {errorMessage ? <div style={{ color: "red" }}>{errorMessage}</div> : null}
      <div>
        <input
          type="text"
          placeholder="Email"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setLoginResource({
              data: { ...data, email: e.currentTarget.value }
            })
          }
        />
        {buildErrors("email", fieldErrors)}
      </div>
      <div>
        <input
          type="password"
          placeholder="Password"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setLoginResource({
              data: { ...data, password: e.currentTarget.value }
            })
          }
        />
        {buildErrors("password", fieldErrors)}
      </div>
      <div>
        <button type="submit">Log in</button>
      </div>
    </form>
  );
};

export default LoginScreen;
