/** @jsx jsx */
import React, { useState } from "react";
import { Box, Button, Flex, Heading, jsx, ThemeUIStyleObject } from "theme-ui";
import { toast } from "react-toastify";

import { Login, JWT, Register } from "../../shared/entities";
import { authenticateUser, registerUser } from "../api";
import { InputField, PasswordField } from "../components/Field";
import FormError from "../components/FormError";
import { WriteResource } from "../resource";
import { userFetch } from "../actions/user";
import { assertNever } from "../functions";
import { IProject } from "../../shared/entities";
import store from "../store";

const style: ThemeUIStyleObject = {
  footer: {
    flex: "auto",
    textAlign: "center",
    fontVariant: "tabular-nums",
    py: 2,
    mt: 2,
    fontSize: 1
  },
  footerButton: {
    width: "100%"
  },
  header: {
    padding: "16px 12px",
    margin: "-12px -12px 24px"
  },
  link: {
    cursor: "pointer",
    color: "blue.5"
  }
};

export const LoginContent = ({ children }: { readonly children: React.ReactNode }) => {
  const [loginResource, setLoginResource] = useState<WriteResource<Login, JWT>>({
    data: {
      email: "",
      password: ""
    }
  });
  const { data } = loginResource;

  return (
    <Flex
      as="form"
      sx={{ flexDirection: "column" }}
      onSubmit={(e: React.FormEvent) => {
        e.preventDefault();
        setLoginResource({ data, isPending: true });
        authenticateUser(data.email, data.password)
          .then(jwt => {
            setLoginResource({ data, resource: jwt });
            store.dispatch(userFetch());
          })
          .catch(errors => {
            setLoginResource({ data, errors });
          });
      }}
    >
      {children}
      <FormError resource={loginResource} />
      <Box sx={{ mb: 3 }}>
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
      </Box>
      <Box sx={{ mb: 4 }}>
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
      </Box>
      <Button type="submit">Log in</Button>
    </Flex>
  );
};

export const RegisterContent = ({ children }: { readonly children: React.ReactNode }) => {
  const isFormInvalid = (form: Register): boolean =>
    Object.values(form).some(value => value.trim() === "");

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
          .then(() => {
            setRegistrationResource({ data, resource: void 0 });
            store.dispatch(userFetch());
            toast.success("Successfully registered");
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

export const AuthModalContent = ({ project }: { readonly project: IProject }) => {
  type ModalIntent = "initial" | "register" | "login";

  const [modalIntent, setModalIntent] = useState<ModalIntent>("initial");

  const initialContent = (
    <React.Fragment>
      <Box sx={style.header}>
        <Heading
          as="h3"
          sx={{ marginBottom: "0", fontWeight: "medium", display: "flex", alignItems: "center" }}
          id="modal-header"
        >
          {project.user.name} builds maps with DistrictBuilder
        </Heading>
      </Box>
      <Box>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt
          ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation
          ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
        <ul>
          <li>100% free to use, forever</li>
          <li>Makes district drawing easy</li>
          <li>Another selling point to convince user that this is good</li>
        </ul>
      </Box>
      <Flex sx={style.footer}>
        <Button sx={style.footerButton} onClick={() => setModalIntent("register")}>
          Create a free account
        </Button>
      </Flex>
      <p sx={style.footer}>
        Already have an account?{" "}
        <span sx={style.link} onClick={() => setModalIntent("login")}>
          Log in
        </span>
      </p>
    </React.Fragment>
  );

  const loginContent = (
    <React.Fragment>
      <LoginContent>
        <Heading id="modal-header" as="h2" sx={{ mb: 5, textAlign: "left" }}>
          Log in
        </Heading>
      </LoginContent>
      <Box sx={{ fontSize: 1, textAlign: "center" }}>
        Need an account?{" "}
        <span sx={style.link} onClick={() => setModalIntent("register")}>
          Sign up for free
        </span>
      </Box>
    </React.Fragment>
  );

  const registerContent = (
    <React.Fragment>
      <RegisterContent>
        <Heading id="modal-header" as="h2" sx={{ mb: 5, textAlign: "left" }}>
          Create an account
        </Heading>
      </RegisterContent>
      <Box sx={{ fontSize: 1, textAlign: "center" }}>
        Already have an account?{" "}
        <span sx={style.link} onClick={() => setModalIntent("login")}>
          Log in
        </span>
      </Box>
    </React.Fragment>
  );

  return modalIntent === "initial"
    ? initialContent
    : modalIntent === "register"
    ? registerContent
    : modalIntent === "login"
    ? loginContent
    : assertNever(modalIntent);
};
