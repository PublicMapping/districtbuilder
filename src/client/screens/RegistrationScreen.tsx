/** @jsx jsx */
import React, { useState } from "react";
import { Link, Redirect } from "react-router-dom";
import { Box, Button, Card, Flex, Heading, jsx, Styled } from "theme-ui";
import { ReactComponent as Logo } from "../media/logos/logo.svg";

import { Register } from "../../shared/entities";
import { registerUser } from "../api";
import CenteredContent from "../components/CenteredContent";
import { InputField, PasswordField } from "../components/Field";
import FormError from "../components/FormError";
import { WriteResource } from "../resource";

const isFormInvalid = (form: Register): boolean =>
  Object.values(form).some(value => value.trim() === "");

const RegistrationScreen = () => {
  const [registrationResource, setRegistrationResource] = useState<WriteResource<Register, void>>({
    data: {
      email: "",
      password: "",
      name: ""
    }
  });
  const { data } = registrationResource;

  const setForm = (field: keyof Register) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setRegistrationResource({
      data: { ...data, [field]: e.currentTarget.value }
    });

  return (
    <CenteredContent>
      {"resource" in registrationResource ? (
        <Redirect to="/" />
      ) : (
        <React.Fragment>
          <Heading as="h1" sx={{ textAlign: "center" }}>
            <Logo sx={{ maxWidth: "15rem" }} />
          </Heading>
          <Card sx={{ variant: "card.floating" }}>
            <Flex
              as="form"
              sx={{ flexDirection: "column" }}
              onSubmit={(e: React.FormEvent) => {
                e.preventDefault();
                setRegistrationResource({ data, isPending: true });
                registerUser(
                  registrationResource.data.name,
                  registrationResource.data.email,
                  registrationResource.data.password
                )
                  .then(() => setRegistrationResource({ data, resource: void 0 }))
                  .catch(errors => {
                    setRegistrationResource({ data, errors });
                  });
              }}
            >
              <Heading as="h2" sx={{ mb: 5, textAlign: "left" }}>
                Create an account
              </Heading>
              <FormError resource={registrationResource} />
              <Box sx={{ mb: 3 }}>
                <InputField
                  field="name"
                  label="Name"
                  resource={registrationResource}
                  inputProps={{ onChange: setForm("name") }}
                />
              </Box>
              <Box sx={{ mb: 3 }}>
                <InputField
                  field="email"
                  label="Email"
                  resource={registrationResource}
                  inputProps={{ onChange: setForm("email") }}
                />
              </Box>
              <Box sx={{ mb: 3 }}>
                <PasswordField
                  field="password"
                  userAttributes={[data.email, data.name]}
                  password={data.password}
                  label="Password"
                  resource={registrationResource}
                  inputProps={{ onChange: setForm("password") }}
                />
              </Box>
              <Button
                type="submit"
                disabled={
                  ("isPending" in registrationResource && registrationResource.isPending) ||
                  isFormInvalid(data)
                }
              >
                Let’s go!
              </Button>
            </Flex>
          </Card>
          <Box sx={{ fontSize: 1, textAlign: "center" }}>
            Already have an account?{" "}
            <Styled.a as={Link} to="/login" sx={{ color: "primary" }}>
              Log in
            </Styled.a>
          </Box>
        </React.Fragment>
      )}
    </CenteredContent>
  );
};

export default RegistrationScreen;
