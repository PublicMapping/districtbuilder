/** @jsx jsx */
import React, { useState } from "react";
import { Link, Redirect } from "react-router-dom";
import { Box, Button, Flex, Heading, jsx, Styled } from "theme-ui";

import { JWT, Login } from "../../shared/entities";
import { authenticateUser } from "../api";
import CenteredCard from "../components/CenteredCard";
import Field from "../components/Field";
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

  const footer = (
    <Box>
      Need an account?{" "}
      <Styled.a as={Link} to="/register" sx={{ color: "primary" }}>
        Sign up for free
      </Styled.a>
    </Box>
  );

  return "resource" in loginResource && !jwtIsExpired(loginResource.resource) ? (
    <Redirect to="/" />
  ) : (
    <CenteredCard footer={footer}>
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
        <Field
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
        <Field
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
    </CenteredCard>
  );
};

export default LoginScreen;
