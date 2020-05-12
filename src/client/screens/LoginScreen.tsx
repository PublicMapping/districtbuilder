/** @jsx jsx */
import React, { useState } from "react";
import { Link, Redirect } from "react-router-dom";
import { Box, Button, Card, Flex, Heading, Input, jsx, Label, Styled } from "theme-ui";

import { JWT, Login } from "../../shared/entities";
import { authenticateUser } from "../api";
import { FieldErrors, getErrorMessage, getFieldErrors } from "../components/FieldErrors";
import { jwtIsExpired } from "../jwt";
import { WriteResource } from "../resource";

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
    <Flex
      sx={{
        flexDirection: "column",
        minHeight: "100vh"
      }}
    >
      <Flex as="main" sx={{ width: "100%" }}>
        <Flex
          sx={{
            width: "100%",
            maxWidth: "form",
            mx: "auto",
            flexDirection: "column",
            justifyContent: "center"
          }}
        >
          <Heading as="h1">DistrictBuilder</Heading>
          <Card
            as="form"
            sx={{ backgroundColor: "muted", my: 4, p: 4 }}
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
            <Flex
              sx={{
                flexDirection: "column"
              }}
            >
              <Heading as="h2" sx={{ textAlign: "left" }}>
                Log in
              </Heading>
              {errorMessage ? (
                <Box sx={{ backgroundColor: "warning", color: "white" }}>{errorMessage}</Box>
              ) : null}
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                sx={{ borderColor: "email" in fieldErrors ? "warning" : undefined }}
                type="text"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setLoginResource({
                    data: { ...data, email: e.currentTarget.value }
                  })
                }
              />
              <FieldErrors field="email" errors={fieldErrors} />
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                sx={{ borderColor: "password" in fieldErrors ? "warning" : undefined }}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setLoginResource({
                    data: { ...data, password: e.currentTarget.value }
                  })
                }
              />
              <FieldErrors field="password" errors={fieldErrors} />
              <Button type="submit">Log in</Button>
            </Flex>
          </Card>
          <Box>
            Need an account?{" "}
            <Styled.a as={Link} to="/register" sx={{ color: "primary" }}>
              Sign up for free
            </Styled.a>
          </Box>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default LoginScreen;
