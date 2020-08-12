/** @jsx jsx */
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Box, Button, Card, Flex, Heading, jsx, Styled } from "theme-ui";
import { ReactComponent as Logo } from "../media/logos/logo.svg";

import { initiateForgotPassword } from "../api";
import CenteredContent from "../components/CenteredContent";
import { InputField } from "../components/Field";
import FormError from "../components/FormError";
import { WriteResource } from "../resource";

const isFormInvalid = (form: ForgotPasswordForm): boolean =>
  Object.values(form).some(value => value.trim() === "") || !form.email.includes("@");

interface ForgotPasswordForm {
  readonly email: string;
}

const ForgotPasswordScreen = () => {
  const [emailResource, setEmailResource] = useState<WriteResource<ForgotPasswordForm, void>>({
    data: {
      email: ""
    }
  });
  const { data } = emailResource;

  return (
    <CenteredContent>
      <Heading as="h1" sx={{ textAlign: "center" }}>
        <Logo sx={{ maxWidth: "15rem" }} />
      </Heading>
      <Card sx={{ variant: "card.floating" }}>
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
              <Styled.a
                as={Link}
                to="/forgot-password"
                onClick={(e: React.MouseEvent<HTMLAnchorElement>): void => {
                  e.preventDefault();
                  setEmailResource({ data: { email: "" } });
                }}
                sx={{ fontSize: 1, color: "success.6" }}
              >
                Reset your password again
              </Styled.a>
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
        <Styled.a as={Link} to="/login" sx={{ color: "primary" }}>
          Log in
        </Styled.a>
      </Box>
      <Box sx={{ fontSize: 1, textAlign: "center" }}>
        Need an account?{" "}
        <Styled.a as={Link} to="/register" sx={{ color: "primary" }}>
          Sign up for free
        </Styled.a>
      </Box>
    </CenteredContent>
  );
};

export default ForgotPasswordScreen;
