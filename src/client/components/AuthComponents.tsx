/** @jsx jsx */
import React, { useState } from "react";
import { Box, Button, Flex, Heading, Text, jsx, ThemeUIStyleObject } from "theme-ui";
import { toast } from "react-toastify";

import { Login, JWT, Register, IOrganization } from "../../shared/entities";
import { authenticateUser, registerUser } from "../api";
import { InputField, PasswordField } from "../components/Field";
import FormError from "../components/FormError";
import { WriteResource } from "../resource";
import { userFetch } from "../actions/user";
import { assertNever } from "../functions";
import { IProject } from "../../shared/entities";
import store from "../store";
import { ReactComponent as SignupIconAudience } from "../media/signup-icon-audience.svg";
import { ReactComponent as SignupIconDollar } from "../media/signup-icon-dollar.svg";
import { ReactComponent as SignupIconSearch } from "../media/signup-icon-search.svg";

const style: ThemeUIStyleObject = {
  footer: {
    flex: "auto",
    display: "flex",
    flexDirection: "column",
    textAlign: "center",
    fontVariant: "tabular-nums",
    py: 2,
    mt: 2
  },
  footerMicrocopy: {
    textAlign: "center",
    mt: 2,
    fontSize: 1
  },
  header: {
    mb: 7,
    color: "gray.8"
  },
  headerFancy: {
    position: "relative",
    zIndex: "0",
    "&:before": {
      content: "''",
      position: "absolute",
      left: "-35px",
      right: "-35px",
      top: "-55px",
      bottom: "-30px",
      bg: "warning",
      opacity: "0.1",
      zIndex: "-1",
      transform: "rotate(1deg)"
    },
    "&:after": {
      content: "''",
      position: "absolute",
      left: "-35px",
      right: "-35px",
      top: "-55px",
      bottom: "-30px",
      bg: "warning",
      opacity: "0.1",
      zIndex: "-1",
      transform: "rotate(5deg)"
    }
  },
  heading: {
    fontFamily: "heading",
    fontWeight: "light",
    fontSize: 4
  },
  link: {
    cursor: "pointer",
    color: "blue.5"
  },
  featuresList: {
    listStyleType: "none",
    pl: 0
  },
  featuresListItem: {
    pl: 0,
    pb: 4,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    "&:last-of-type": {
      pb: 0
    }
  },
  featuresListHeading: {
    fontSize: 3,
    my: 0
  },
  featuresListIcon: {
    height: "auto",
    flex: "0 0 40px",
    mr: 3
  },
  featuresListDesc: {
    my: 2
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
      <Button id="primary-action" type="submit">
        Log in
      </Button>
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

export const AuthModalContent = ({
  project,
  organization
}: {
  readonly project?: IProject;
  readonly organization?: IOrganization | undefined;
}) => {
  type ModalIntent = "initial" | "register" | "login";

  const [modalIntent, setModalIntent] = useState<ModalIntent>("initial");

  const initialContent = (
    <React.Fragment>
      <Box sx={{ ...style.header, ...style.headerFancy }}>
        <Heading as="h1" sx={style.heading} id="modal-header">
          {project ? project.user.name : organization ? organization.name : ""} builds maps with
          DistrictBuilder
        </Heading>
        <Text>
          DistrictBuilder is a <strong>free</strong> and <strong>open</strong> redistricting tool
          that puts the power of drawing electoral maps in your hands.
        </Text>
      </Box>
      <Box>
        <ul sx={style.featuresList}>
          <li sx={style.featuresListItem}>
            <SignupIconDollar sx={style.featuresListIcon} />
            <div>
              <Heading as="h2" sx={style.featuresListHeading}>
                100% free, forever
              </Heading>
              <Text sx={style.featuresListDesc}>
                DistrictBuilder is completely free to use and open source.
              </Text>
            </div>
          </li>
          <li sx={style.featuresListItem}>
            <SignupIconSearch sx={style.featuresListIcon} />
            <div>
              <Heading as="h2" sx={style.featuresListHeading}>
                Uncover inequalities
              </Heading>
              <Text sx={style.featuresListDesc}>
                Built-in population demographics and real-time updates make drawing fair districts
                easy.
              </Text>
            </div>
          </li>
          <li sx={style.featuresListItem}>
            <SignupIconAudience sx={style.featuresListIcon} />
            <div>
              <Heading as="h2" sx={style.featuresListHeading}>
                Engage your audience, friends, and family
              </Heading>
              <Text sx={style.featuresListDesc}>
                Easily export your custom map. Share it in an article, on social media, or with a
                friend!
              </Text>
            </div>
          </li>
        </ul>
      </Box>
      <Flex sx={style.footer}>
        <Button id="primary-action" onClick={() => setModalIntent("register")}>
          Create a free account
        </Button>
        <Text sx={style.footerMicrocopy}>
          Already have an account?{" "}
          <span sx={style.link} onClick={() => setModalIntent("login")}>
            Log in
          </span>
        </Text>
      </Flex>
    </React.Fragment>
  );

  const loginContent = (
    <React.Fragment>
      <LoginContent>
        <Heading as="h1" sx={{ ...{ mb: 4 }, ...style.heading }} id="modal-header">
          Log in
        </Heading>
      </LoginContent>
      <Text sx={style.footerMicrocopy}>
        Need an account?{" "}
        <span id="primary-action" sx={style.link} onClick={() => setModalIntent("register")}>
          Sign up for free
        </span>
      </Text>
    </React.Fragment>
  );

  const registerContent = (
    <React.Fragment>
      <RegisterContent>
        <Heading id="modal-header" as="h1" sx={{ ...{ mb: 4 }, ...style.heading }}>
          Create an account
        </Heading>
      </RegisterContent>
      <Text sx={style.footerMicrocopy}>
        Already have an account?{" "}
        <span id="primary-action" sx={style.link} onClick={() => setModalIntent("login")}>
          Log in
        </span>
      </Text>
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
