/** @jsx jsx */
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Link, Redirect } from "react-router-dom";
import { Box, Button, Card, Flex, Heading, jsx, Styled } from "theme-ui";

import { showPasswordResetNotice } from "../actions/auth";
import { resetPassword } from "../api";
import CenteredContent from "../components/CenteredContent";
import { InputField } from "../components/Field";
import FormError from "../components/FormError";
import { WriteResource } from "../resource";
import store from "../store";

const isFormInvalid = (form: ResetPasswordForm): boolean =>
  Object.values(form).some(value => value.trim() === "") || form.password !== form.confirmPassword;

interface ResetPasswordForm {
  readonly password: string;
  readonly confirmPassword: string;
}

interface ResetPasswordScreenParams {
  readonly token: string;
}

const ResetPasswordScreen = () => {
  const { token } = useParams<ResetPasswordScreenParams>();
  const [passwordResource, setPasswordResource] = useState<WriteResource<ResetPasswordForm, void>>({
    data: {
      password: "",
      confirmPassword: ""
    }
  });
  const { data } = passwordResource;

  return "resource" in passwordResource ? (
    <Redirect to="/login" />
  ) : (
    <CenteredContent>
      <Heading as="h1">DistrictBuilder</Heading>
      <Card sx={{ backgroundColor: "muted", my: 4, p: 4 }}>
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
          <Heading as="h2" sx={{ textAlign: "left" }}>
            Reset your password
          </Heading>
          <FormError resource={passwordResource} />
          <InputField
            field="password"
            label="Password"
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
          <InputField
            field="confirmPassword"
            label="Confirm password"
            resource={passwordResource}
            inputProps={{
              required: true,
              type: "password",
              onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                setPasswordResource({
                  data: { ...data, confirmPassword: e.currentTarget.value }
                })
            }}
          />
          <Button type="submit" disabled={isFormInvalid(data)}>
            Reset password
          </Button>
        </Flex>
      </Card>
      <Box>
        Know your password?{" "}
        <Styled.a as={Link} to="/login" sx={{ color: "primary" }}>
          Log in
        </Styled.a>
      </Box>
      <Box>
        Need an account?{" "}
        <Styled.a as={Link} to="/register" sx={{ color: "primary" }}>
          Sign up for free
        </Styled.a>
      </Box>
    </CenteredContent>
  );
};

export default ResetPasswordScreen;
