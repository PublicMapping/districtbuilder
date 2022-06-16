/** @jsx jsx */
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Box, Button, Card, Flex, Heading, jsx, Themed } from "theme-ui";
import { ReactComponent as Logo } from "../media/logos/logo.svg";

import { initiateForgotPassword } from "../api";
import CenteredContent from "../components/CenteredContent";
import { InputField } from "../components/Field";
import FormError from "../components/FormError";
import { WriteResource } from "../resource";
import { AuthLocationState } from "../types";

const isFormInvalid = (form: ForgotPasswordForm): boolean =>
  Object.values(form).some(value => value.trim() === "") || !form.email.includes("@");

interface ForgotPasswordForm {
  readonly email: string;
}

export interface ResetPasswordLocationState {
  readonly email?: string;
}

const ForgotPasswordScreen = () => {
  const location = useLocation<(AuthLocationState & ResetPasswordLocationState) | undefined>();
  const { email } = location.state || {};
  const [emailResource, setEmailResource] = useState<WriteResource<ForgotPasswordForm, void>>({
    data: {
      email: email === undefined ? "" : email
    }
  });
  const { data } = emailResource;

  return (
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
            setEmailResource({ data, isPending: true });
            initiateForgotPassword(data.email)
              .then(() => setEmailResource({ data, resource: void 0 }))
              .catch(errors => {
                setEmailResource({ data, errors });
              });
          }}
        >
          <Heading as="h2" sx={{ mb: 5, textAlign: "left" }}>
            Reset your password
          </Heading>
          {"resource" in emailResource ? (
            <Box
              sx={{
                textAlign: "center",
                backgroundColor: "success.0",
                color: "success.7",
                pt: 1,
                pb: 3,
                px: 3
              }}
            >
              <p>
                Password reset email sent to <b>{data.email}</b>
              </p>
              <p sx={{ fontSize: 1, lineHeight: "1", mb: "0" }}>Used the wrong email address?</p>
              <Themed.a
                as={Link}
                to={{ pathname: "/forgot-password", state: location.state }}
                onClick={(e: React.MouseEvent<HTMLAnchorElement>): void => {
                  e.preventDefault();
                  setEmailResource({ data: { email: "" } });
                }}
                sx={{ fontSize: 1, color: "success.6" }}
              >
                Reset your password again
              </Themed.a>
            </Box>
          ) : (
            <React.Fragment>
              <FormError resource={emailResource} />
              <Box sx={{ mb: 4 }}>
                <InputField
                  field="email"
                  label="Email"
                  resource={emailResource}
                  inputProps={{
                    value: data.email,
                    required: true,
                    type: "email",
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                      setEmailResource({
                        data: { ...data, email: e.currentTarget.value }
                      })
                  }}
                />
              </Box>
              <Button type="submit" disabled={isFormInvalid(data)}>
                Reset password
              </Button>
            </React.Fragment>
          )}
        </Flex>
      </Card>
      <Box sx={{ fontSize: 1, textAlign: "center" }}>
        Know your password?{" "}
        <Themed.a
          as={Link}
          to={{ pathname: "/login", state: location.state }}
          sx={{ color: "primary" }}
        >
          Log in
        </Themed.a>
      </Box>
      <Box sx={{ fontSize: 1, textAlign: "center" }}>
        Need an account?{" "}
        <Themed.a
          as={Link}
          to={{ pathname: "/register", state: location.state }}
          sx={{ color: "primary" }}
        >
          Sign up for free
        </Themed.a>
      </Box>
    </CenteredContent>
  );
};

export default ForgotPasswordScreen;
