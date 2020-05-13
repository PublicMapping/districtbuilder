/** @jsx jsx */
import React, { useState } from "react";
import { Link, Redirect } from "react-router-dom";
import { Box, Button, Card, Flex, Heading, jsx, Styled } from "theme-ui";

import { JWT, Login } from "../../shared/entities";
import { authenticateUser } from "../api";
import CenteredContent from "../components/CenteredContent";
import { InputField } from "../components/Field";
import FormError from "../components/FormError";
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
    </CenteredContent>
  );
};

export default LoginScreen;
