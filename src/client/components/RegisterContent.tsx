/** @jsx jsx */
import React, { useState } from "react";
import { Box, Button, Flex, jsx } from "theme-ui";
import { toast } from "react-toastify";
import { connect } from "react-redux";

import { Register, IOrganization } from "../../shared/entities";
import { State } from "../reducers";

import { registerUser } from "../api";
import { InputField, PasswordField } from "./Field";
import FormError from "./FormError";
import { WriteResource } from "../resource";
import { userFetch } from "../actions/user";
import { showCopyMapModal } from "../actions/projectModals";
import store from "../store";
import { Resource } from "../resource";

const RegisterContent = ({
  children,
  organization
}: {
  readonly children: React.ReactNode;
  readonly organization: Resource<IOrganization>;
}) => {
  const isFormInvalid = (form: Register): boolean =>
    Object.values(form).some(value => {
      return value && value.trim() === "";
    });

  const [registrationResource, setRegistrationResource] = useState<WriteResource<Register, void>>({
    data: {
      email: "",
      password: "",
      name: "",
      organization: "resource" in organization ? organization.resource.slug : undefined
    }
  });
  const { data } = registrationResource;

  const setForm = (field: keyof Register) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegistrationResource({
      data: { ...data, [field]: e.currentTarget.value }
    });
  };

  return (
    <Flex
      as="form"
      sx={{ flexDirection: "column" }}
      onSubmit={(e: React.FormEvent) => {
        e.preventDefault();
        setRegistrationResource({ data, isPending: true });
        (registrationResource.data.organization
          ? registerUser(
              registrationResource.data.name,
              registrationResource.data.email,
              registrationResource.data.password,
              registrationResource.data.organization
            )
          : registerUser(
              registrationResource.data.name,
              registrationResource.data.email,
              registrationResource.data.password
            )
        )
          .then(() => {
            setRegistrationResource({ data, resource: void 0 });
            store.dispatch(userFetch());
            toast.success("Successfully registered");
            store.dispatch(showCopyMapModal(false));
          })
          .catch(errors => {
            setRegistrationResource({ data, errors });
          });
      }}
    >
      {children}
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
        id="primary-action"
        type="submit"
        disabled={
          ("isPending" in registrationResource && registrationResource.isPending) ||
          isFormInvalid(data)
        }
      >
        Let’s go!
      </Button>
    </Flex>
  );
};

function mapStateToProps(state: State) {
  return {
    organization: state.organization
  };
}

export default connect(mapStateToProps)(RegisterContent);
