import jwtDecode from "jwt-decode";
import React, { useState } from "react";
import { connect } from "react-redux";
import { Redirect } from "react-router-dom";

import { JWT, JWTPayload, Login } from "../../shared/entities";
import { authenticate } from "../actions/auth";
import { State } from "../reducers";
import store from "../store";
import { Resource } from "../types";

interface StateProps {
  readonly jwt: Resource<JWT>;
}

const LoginScreen = ({ jwt }: StateProps) => {
  const [loginForm, setLoginForm] = useState<Login>({
    email: "",
    password: ""
  });
  return "resource" in jwt && (jwtDecode(jwt.resource) as JWTPayload).exp > new Date().getTime() ? (
    <Redirect to="/" />
  ) : (
    <div>
      <label>
        Email:{" "}
        <input
          type="text"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setLoginForm({
              ...loginForm,
              email: e.currentTarget.value
            })
          }
        />
      </label>
      <label>
        Password:{" "}
        <input
          type="password"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setLoginForm({
              ...loginForm,
              password: e.currentTarget.value
            })
          }
        />
      </label>
      <button onClick={() => store.dispatch(authenticate(loginForm))}>Log in</button>
    </div>
  );
};

function mapStateToProps(state: State): StateProps {
  return {
    jwt: state.auth
  };
}

export default connect(mapStateToProps)(LoginScreen);
