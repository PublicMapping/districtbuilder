/** @jsx jsx */
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Link, Redirect } from "react-router-dom";
import { Box, Button, Card, Flex, Heading, jsx, Themed } from "theme-ui";
import { ReactComponent as Logo } from "../media/logos/logo.svg";

import { showPasswordResetNotice } from "../actions/auth";
import { resetPassword } from "../api";
import CenteredContent from "../components/CenteredContent";
import { PasswordField } from "../components/Field";
import FormError from "../components/FormError";
import { WriteResource } from "../resource";
import store from "../store";

const isFormInvalid = (form: ResetPasswordForm): boolean =>
  Object.values(form).some(value => value.trim() === "");

interface ResetPasswordForm {
  readonly password: string;
}

interface ResetPasswordScreenParams {
  readonly token: string;
}

const ResetPasswordScreen = () => {
  const { token } = useParams<ResetPasswordScreenParams>();
  const [passwordResource, setPasswordResource] = useState<WriteResource<ResetPasswordForm, void>>({
    data: {
      password: ""
    }
  });
  const { data } = passwordResource;

  return "resource" in passwordResource ? (
    <Redirect to="/login" />
  ) : (
    <CenteredContent>
      <Heading as="h1" sx={{ textAlign: "center" }}>
        <Logo sx={{ maxWidth: "15rem" }} />
      </Heading>
      <Card sx={{ variant: "cards.floating" }}>
        <Flex
          as="form"
          sx={{ flexDirection: "column", textAlign: "left" }}
          onSubmit={(e: React.FormEvent) => {
            e.preventDefault();
            setPasswordResource({ data, isPending: true });
            resetPassword(token, data.password)
              .then(() => {
                setPasswordResource({ data, resource: void 0 });
                store.dispatch(showPasswordResetNotice(true));
              })
              .catch(errors => {
                setPasswordResource({ data, errors });
              });
          }}
        >
          <Heading as="h2" sx={{ mb: 5, textAlign: "left" }}>
            Reset your password
          </Heading>
          <FormError resource={passwordResource} />
          {/* Note 'userAttributes' below is empty because we don't have access to user data yet as we're not logged in. A full validation will happen server-side*/}
          <Box sx={{ mb: 3 }}>
            <PasswordField
              field="password"
              label="Password"
              password={passwordResource.data.password}
              userAttributes={[]}
              resource={passwordResource}
              inputProps={{
                required: true,
                type: "password",
                onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                  setPasswordResource({
                    data: { ...data, password: e.currentTarget.value }
                  })
              }}
            />
          </Box>
          <Button type="submit" disabled={isFormInvalid(data)}>
            Reset password
          </Button>
        </Flex>
      </Card>
      <Box sx={{ fontSize: 1, textAlign: "center" }}>
        Know your password?{" "}
        <Themed.a as={Link} to="/login" sx={{ color: "primary" }}>
          Log in
        </Themed.a>
      </Box>
      <Box sx={{ fontSize: 1, textAlign: "center" }}>
        Need an account?{" "}
        <Themed.a as={Link} to="/register" sx={{ color: "primary" }}>
          Sign up for free
        </Themed.a>
      </Box>
    </CenteredContent>
  );
};

export default ResetPasswordScreen;
