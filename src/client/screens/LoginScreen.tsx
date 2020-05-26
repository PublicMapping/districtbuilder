/** @jsx jsx */
import React, { useState } from "react";
import { connect } from "react-redux";
import { Link, Redirect } from "react-router-dom";
import { Alert, Box, Button, Card, Close, Flex, Heading, jsx, Styled } from "theme-ui";

import { JWT, Login } from "../../shared/entities";
import { showPasswordResetNotice } from "../actions/auth";
import { authenticateUser } from "../api";
import CenteredContent from "../components/CenteredContent";
import { InputField } from "../components/Field";
import FormError from "../components/FormError";
import { jwtIsExpired } from "../jwt";
import { State } from "../reducers";
import { WriteResource } from "../resource";
import store from "../store";

interface StateProps {
  readonly passwordResetNoticeShown: boolean;
}

const LoginScreen = ({ passwordResetNoticeShown }: StateProps) => {
  const [loginResource, setLoginResource] = useState<WriteResource<Login, JWT>>({
    data: {
      email: "",
      password: ""
    }
  });
  const { data } = loginResource;

  return "resource" in loginResource && !jwtIsExpired(loginResource.resource) ? (
    <Redirect to="/" />
  ) : (
    <CenteredContent>
      <Heading as="h1">DistrictBuilder</Heading>
      <Card sx={{ backgroundColor: "muted", my: 4, p: 4 }}>
        <Flex
          as="form"
          sx={{ flexDirection: "column" }}
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
          <Heading as="h2" sx={{ textAlign: "left" }}>
            Log in
          </Heading>
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
          <Button type="submit">Log in</Button>
        </Flex>
      </Card>
      <Box>
        Need an account?{" "}
        <Styled.a as={Link} to="/register" sx={{ color: "primary" }}>
          Sign up for free
        </Styled.a>
      </Box>
      <Box>
        Forgot password?{" "}
        <Styled.a as={Link} to="/forgot-password" sx={{ color: "primary" }}>
          Password reset
        </Styled.a>
      </Box>
    </CenteredContent>
  );
};

function mapStateToProps(state: State): StateProps {
  return {
    passwordResetNoticeShown: state.auth.passwordResetNoticeShown
  };
}

export default connect(mapStateToProps)(LoginScreen);
