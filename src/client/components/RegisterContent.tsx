/** @jsx jsx */
import React, { useEffect, useState } from "react";
import { Box, Button, Checkbox, Flex, jsx, Label, Link, Themed } from "theme-ui";
import { toast } from "react-toastify";
import { connect } from "react-redux";
import { useLocation } from "react-router-dom";

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
import { AuthLocationState } from "../types";

const RegisterContent = ({
  children,
  organization
}: {
  readonly children: React.ReactNode;
  readonly organization: Resource<IOrganization>;
}) => {
  const location = useLocation<AuthLocationState>();
  const [registrationResource, setRegistrationResource] = useState<WriteResource<Register, void>>({
    data: {
      email: "",
      password: "",
      name: "",
      isMarketingEmailOn: true
    }
  });
  const { data } = registrationResource;

  const isFormInvalid = (form: Register): boolean =>
    Object.values(form)
      .filter(val => typeof val === "string")
      .some(value => value.trim() === "");

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
        ("resource" in organization
          ? registerUser(
              registrationResource.data.name,
              registrationResource.data.email,
              registrationResource.data.password,
              registrationResource.data.isMarketingEmailOn,
              organization.resource.slug
            )
          : registerUser(
              registrationResource.data.name,
              registrationResource.data.email,
              registrationResource.data.password,
              registrationResource.data.isMarketingEmailOn
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
      <Box sx={{ mb: 3 }}>
        <Label sx={{ display: "inline-flex" }}>
          <Checkbox
            name="user-is-marketing-email-on"
            checked={registrationResource.data.isMarketingEmailOn}
            onChange={() => {
              setRegistrationResource({
                data: { ...data, isMarketingEmailOn: !registrationResource.data.isMarketingEmailOn }
              });
            }}
          />
          <Flex as="span" sx={{ textTransform: "none", fontWeight: "normal" }}>
            I want to receive product updates and announcements via email
          </Flex>
        </Label>
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
      <Box sx={{ fontSize: 1, textAlign: "center", mt: 3 }}>
        Already have an account?{" "}
        <Themed.a
          as={Link}
          to={{ pathname: "/login", state: location.state }}
          sx={{ color: "primary" }}
        >
          Log in
        </Themed.a>
      </Box>
    </Flex>
  );
};

function mapStateToProps(state: State) {
  return {
    organization: state.organization
  };
}

export default connect(mapStateToProps)(RegisterContent);
function validatePassword(password: any, arg1: string[]) {
  throw new Error("Function not implemented.");
}
