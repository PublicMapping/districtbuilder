import React, { useState } from "react";
import { connect } from "react-redux";
import { Redirect } from "react-router-dom";

import { JWT, Login } from "../../shared/entities";
import { authenticate } from "../actions/auth";
import { jwtIsExpired } from "../jwt";
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
  return "resource" in jwt && !jwtIsExpired(jwt.resource) ? (
    <Redirect to="/" />
  ) : (
    <form
      onSubmit={(e: React.FormEvent) => {
        e.preventDefault();
        store.dispatch(authenticate(loginForm));
      }}
    >
      <div>
        <input
          type="text"
          placeholder="Email"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setLoginForm({
              ...loginForm,
              email: e.currentTarget.value
            })
          }
        />
      </div>
      <div>
        <input
          type="password"
          placeholder="Password"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setLoginForm({
              ...loginForm,
              password: e.currentTarget.value
            })
          }
        />
      </div>
      <div>
        <button type="submit">Log in</button>
      </div>
      {"errorMessage" in jwt ? <div style={{ color: "red" }}>{jwt.errorMessage}</div> : null}
    </form>
  );
};

function mapStateToProps(state: State): StateProps {
  return {
    jwt: state.auth
  };
}

export default connect(mapStateToProps)(LoginScreen);
