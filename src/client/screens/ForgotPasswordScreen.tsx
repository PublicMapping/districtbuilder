/** @jsx jsx */
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Box, Button, Card, Flex, Heading, jsx, Styled } from "theme-ui";

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
      <Heading as="h1">DistrictBuilder</Heading>
      <Card sx={{ backgroundColor: "muted", my: 4, p: 4 }}>
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
          <Heading as="h2" sx={{ textAlign: "left" }}>
            Reset your password
          </Heading>
          {"resource" in emailResource ? (
            <React.Fragment>
              <p>
                Password reset email sent to <b>{data.email}</b>
              </p>
              <p>
                Used the wrong email address?{" "}
                <Styled.a
                  as={Link}
                  to="/forgot-password"
                  onClick={(e: React.MouseEvent<HTMLAnchorElement>): void => {
                    e.preventDefault();
                    setEmailResource({ data: { email: "" } });
                  }}
                  sx={{ color: "primary" }}
                >
                  Reset your password again
                </Styled.a>
              </p>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <FormError resource={emailResource} />
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
              <Button type="submit" disabled={isFormInvalid(data)}>
                Reset password
              </Button>
            </React.Fragment>
          )}
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

export default ForgotPasswordScreen;
