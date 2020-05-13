/** @jsx jsx */
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Box, Button, Card, Flex, Heading, jsx, Styled } from "theme-ui";

import { Register } from "../../shared/entities";
import { registerUser } from "../api";
import CenteredContent from "../components/CenteredContent";
import { InputField } from "../components/Field";
import FormError from "../components/FormError";
import { WriteResource } from "../resource";

const isFormInvalid = (form: RegistrationForm): boolean =>
  Object.values(form).some(value => value.trim() === "") || form.password !== form.confirmPassword;

interface RegistrationForm extends Register {
  readonly confirmPassword: string;
}

const RegistrationScreen = () => {
  const [registrationResource, setRegistrationResource] = useState<
    WriteResource<RegistrationForm, void>
  >({
    data: {
      email: "",
      password: "",
      confirmPassword: "",
      name: ""
    }
  });
  const { data } = registrationResource;

  const setForm = (field: keyof RegistrationForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setRegistrationResource({
      data: { ...data, [field]: e.currentTarget.value }
    });

  return (
    <CenteredContent>
      {"resource" in registrationResource ? (
        <div>
          Thanks for signing up for DistrictBuilder! Please click the link in your registration
          email to continue.
        </div>
      ) : (
        <React.Fragment>
          <Heading as="h1">DistrictBuilder</Heading>
          <Card sx={{ backgroundColor: "muted", my: 4, p: 4 }}>
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
              <Heading as="h2" sx={{ textAlign: "left" }}>
                Create an account
              </Heading>
              <FormError resource={registrationResource} />
              <InputField
                field="name"
                label="Name"
                resource={registrationResource}
                inputProps={{ onChange: setForm("name") }}
              />
              <InputField
                field="email"
                label="Email"
                resource={registrationResource}
                inputProps={{ onChange: setForm("email") }}
              />
              <InputField
                field="password"
                label="Password"
                resource={registrationResource}
                inputProps={{ onChange: setForm("password"), type: "password" }}
              />
              <InputField
                field="confirmPassword"
                label="Confirm password"
                resource={registrationResource}
                inputProps={{ onChange: setForm("confirmPassword"), type: "password" }}
              />
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
          <Box>
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
