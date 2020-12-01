/** @jsx jsx */
import React, { useState } from "react";
import { connect } from "react-redux";
import { Link, Redirect, useLocation } from "react-router-dom";
import { Alert, Box, Button, Card, Close, Flex, Heading, jsx, Styled } from "theme-ui";
import { ReactComponent as Logo } from "../media/logos/logo.svg";

import { Login, IUser, JWT } from "../../shared/entities";
import { showPasswordResetNotice } from "../actions/auth";
import { userFetch } from "../actions/user";
import { authenticateUser } from "../api";
import CenteredContent from "../components/CenteredContent";
import { InputField } from "../components/Field";
import FormError from "../components/FormError";
import { State } from "../reducers";
import { Resource, WriteResource } from "../resource";
import store from "../store";
import { AuthLocationState } from "../types";

interface StateProps {
  readonly passwordResetNoticeShown: boolean;
  readonly user: Resource<IUser>;
}

const LoginScreen = ({ passwordResetNoticeShown, user }: StateProps) => {
  const isLoggedIn = "resource" in user;
  const location = useLocation<AuthLocationState>();
  const to = location.state?.from || { pathname: "/" };
  const toParams = new URLSearchParams(to.search);
  const [showStartProjectAlert, setShowStartProjectAlert] = useState(
    to.pathname === "/start-project" && toParams.has("name")
  );

  const [loginResource, setLoginResource] = useState<WriteResource<Login, JWT>>({
    data: {
      email: "",
      password: ""
    }
  });
  const { data } = loginResource;

  return isLoggedIn ? (
    <Redirect to={to} />
  ) : (
    <CenteredContent>
      <Heading as="h1" sx={{ textAlign: "center" }}>
        <Logo sx={{ maxWidth: "15rem" }} />
      </Heading>
      <Card sx={{ variant: "card.floating" }}>
        <Flex
          as="form"
          sx={{ flexDirection: "column" }}
          onSubmit={(e: React.FormEvent) => {
            e.preventDefault();
            setLoginResource({ data, isPending: true });
            authenticateUser(data.email, data.password)
              .then(jwt => {
                setLoginResource({ data, resource: jwt });
                store.dispatch(userFetch());
              })
              .catch(errors => {
                setLoginResource({ data, errors });
              });
          }}
        >
          <Heading as="h2" sx={{ fontSize: 4, mb: 5 }}>
            Log in
          </Heading>
          {showStartProjectAlert && (
            <Alert sx={{ mb: 3 }}>
              <Flex>
                <Box>
                  Log in or{" "}
                  <Styled.a
                    as={Link}
                    sx={{ variant: "links.alert" }}
                    to={{ pathname: "/register", state: location.state }}
                  >
                    sign&nbsp;up
                  </Styled.a>{" "}
                  for a new account to create your &ldquo;{toParams.get("name")}&rdquo; map.
                </Box>
                <Close
                  as="a"
                  onClick={() => setShowStartProjectAlert(false)}
                  sx={{ ml: "auto", p: 0 }}
                />
              </Flex>
            </Alert>
          )}
          {passwordResetNoticeShown && (
            <Alert>
              Your password has been reset
              <Close
                as="a"
                onClick={() => store.dispatch(showPasswordResetNotice(false))}
                sx={{ ml: "auto", p: 0 }}
              />
            </Alert>
          )}
          <FormError resource={loginResource} />
          <Box sx={{ mb: 3 }}>
            <InputField
              field="email"
              label="Email"
              resource={loginResource}
              inputProps={{
                onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                  setLoginResource({
                    data: { ...data, email: e.currentTarget.value }
                  })
              }}
            />
          </Box>
          <Box sx={{ mb: 4 }}>
            <InputField
              field="password"
              label="Password"
              resource={loginResource}
              inputProps={{
                type: "password",
                onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                  setLoginResource({
                    data: { ...data, password: e.currentTarget.value }
                  })
              }}
            />
          </Box>
          <Button type="submit">Log in</Button>
        </Flex>
      </Card>
      <Box sx={{ fontSize: 1, mt: 3, textAlign: "center" }}>
        Need an account?{" "}
        <Styled.a as={Link} to={{ pathname: "/register", state: location.state }}>
          Sign up for free
        </Styled.a>
      </Box>
      <Box sx={{ fontSize: 1, textAlign: "center" }}>
        Forgot password?{" "}
        <Styled.a as={Link} to={{ pathname: "/forgot-password", state: location.state }}>
          Password reset
        </Styled.a>
      </Box>
    </CenteredContent>
  );
};

function mapStateToProps(state: State): StateProps {
  return {
    passwordResetNoticeShown: state.auth.passwordResetNoticeShown,
    user: state.user
  };
}

export default connect(mapStateToProps)(LoginScreen);
