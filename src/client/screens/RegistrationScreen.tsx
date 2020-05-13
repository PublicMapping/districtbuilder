/** @jsx jsx */
import React, { useState } from "react";
import { Button, Flex, Heading, jsx } from "theme-ui";

import { Register } from "../../shared/entities";
import { registerUser } from "../api";
import CenteredCard from "../components/CenteredCard";
import Field from "../components/Field";
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

  return "resource" in registrationResource ? (
    <div>
      Thanks for signing up for DistrictBuilder! Please click the link in your registration email to
      continue.
    </div>
  ) : (
    <CenteredCard>
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
        <Field
          field="name"
          label="Name"
          resource={registrationResource}
          inputProps={{ onChange: setForm("name") }}
        />
        <Field
          field="email"
          label="Email"
          resource={registrationResource}
          inputProps={{ onChange: setForm("email") }}
        />
        <Field
          field="password"
          label="Password"
          resource={registrationResource}
          inputProps={{ onChange: setForm("password"), type: "password" }}
        />
        <Field
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
    </CenteredCard>
  );
};

export default RegistrationScreen;
