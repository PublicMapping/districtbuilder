/** @jsx jsx */
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  Checkbox,
  Divider,
  Flex,
  Heading,
  Label,
  Themed,
  Text,
  ThemeUIStyleObject,
  jsx,
  Spinner
} from "theme-ui";

import { userFetch } from "../actions/user";
import { InputField } from "../components/Field";
import { State } from "../reducers";
import { WriteResource } from "../resource";
import SiteHeader from "../components/SiteHeader";
import { IUser } from "../../shared/entities";
import RegisterTermsText from "../components/RegisterTermsText";
import FormError from "../components/FormError";
import { patchUser } from "../api";
import { showActionFailedToast } from "../functions";

const style: Record<string, ThemeUIStyleObject> = {
  page: {
    height: "100%",
    flexDirection: "column"
  },
  main: {
    width: "100%",
    mx: 0,
    flexDirection: "column"
  },
  section: {
    py: 5
  },
  subSection: {
    pt: 4
  },
  container: {
    flexDirection: "row",
    width: "large",
    mx: "auto",
    "> *": {
      mx: 5
    },
    "> *:last-of-type": {
      mr: 0
    },
    "> *:first-of-type": {
      ml: 0
    }
  },
  inputLabel: {
    textTransform: "none",
    variant: "text.h5",
    display: "block",
    mb: 1,
    fontSize: 1
  },
  textBox: {
    fontSize: 1,
    fontWeight: "normal"
  },
  header: {
    mb: "3"
  },
  userFields: {
    flexDirection: "column",
    width: "300px",
    mr: 3
  }
};

interface UserForm {
  readonly name: string;
  readonly email: string;
  readonly isMarketingEmailOn: boolean;
}

interface ValidUserForm extends UserForm {
  readonly valid: true;
}

interface InvalidUserForm extends UserForm {
  readonly valid: false;
}

const accountDeleteEmail = "districtbuilder@azavea.com";

const validate = (form: UserForm) =>
  form.name.trim() !== "" && form.email.trim() !== ""
    ? ({ ...form, valid: true } as ValidUserForm)
    : ({ ...form, valid: false } as InvalidUserForm);

const UserAccountScreen = () => {
  const user = useSelector((state: State) => state.user);
  const dispatch = useDispatch();
  const [updateUserResource, setUpdateUserResource] = useState<WriteResource<UserForm, IUser>>({
    data: {
      name: "",
      email: "",
      isMarketingEmailOn: false
    }
  });
  const { data } = updateUserResource;

  useEffect(() => {
    dispatch(userFetch());
  }, []);

  useEffect(() => {
    if ("resource" in user) {
      setUpdateUserResource({
        data: {
          ...data,
          name: user.resource.name,
          email: user.resource.email,
          isMarketingEmailOn: user.resource.isMarketingEmailOn
        }
      });
    }
  }, [user]);

  const isUpdatePending = useMemo(
    () => "isPending" in updateUserResource && updateUserResource.isPending,
    [updateUserResource]
  );

  const isChanged = useMemo(() => {
    if ("resource" in user) {
      return (
        updateUserResource.data.name.trim() !== user.resource.name ||
        updateUserResource.data.isMarketingEmailOn !== user.resource.isMarketingEmailOn
      );
    }
    return false;
  }, [updateUserResource.data, user]);

  const isSubmitDisabled = useMemo(
    () =>
      !isChanged ||
      "errorMessage" in updateUserResource ||
      !validate(data).valid ||
      isUpdatePending,
    [isChanged, data, updateUserResource, isUpdatePending]
  );

  const onNameChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setUpdateUserResource({
      data: { ...data, name: e.currentTarget.value }
    });

  const onCommunicationChange = () =>
    setUpdateUserResource({
      data: {
        ...data,
        isMarketingEmailOn: !data.isMarketingEmailOn
      }
    });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validatedForm = validate(data);
    if (validatedForm.valid === true) {
      setUpdateUserResource({ data, isPending: true });
      const { name, isMarketingEmailOn } = validatedForm;
      try {
        const user = await patchUser({ name, isMarketingEmailOn });
        setUpdateUserResource({ data, resource: user });
        dispatch(userFetch());
      } catch (errors: any) {
        showActionFailedToast();
      }
    }
  };

  return (
    <Flex sx={style.page}>
      {"resource" in user ? (
        <React.Fragment>
          <SiteHeader user={user} />
          <Flex as="main" sx={style.main}>
            <Box sx={style.container}>
              <Box sx={style.section} as="form" onSubmit={onSubmit}>
                <Heading as="h2" sx={style.header}>
                  Account
                </Heading>
                <Box sx={style.subSection}>
                  <Heading as="h3" sx={style.header}>
                    User
                  </Heading>
                  <Flex>
                    <FormError resource={updateUserResource} />
                    <Flex sx={style.userFields}>
                      <InputField
                        field="name"
                        label={
                          <Box as="span" sx={style.inputLabel}>
                            Name
                          </Box>
                        }
                        resource={updateUserResource}
                        inputProps={{
                          value: data.name,
                          required: true,
                          type: "string",
                          onChange: onNameChange
                        }}
                        style={{ background: "gray.0" }}
                        disabled={isUpdatePending}
                      />
                    </Flex>
                    <Flex sx={style.userFields}>
                      <InputField
                        field="email"
                        label={
                          <Box as="span" sx={style.inputLabel}>
                            Email
                          </Box>
                        }
                        resource={updateUserResource}
                        inputProps={{
                          value: data.email,
                          required: true,
                          type: "email"
                        }}
                        disabled={true}
                      />
                    </Flex>
                  </Flex>
                </Box>
                <Box sx={style.subSection}>
                  <Heading as="h3" sx={style.header}>
                    Communications
                  </Heading>
                  <Flex>
                    <Label sx={{ display: "inline-flex" }}>
                      <Checkbox
                        name="user-is-marketing-email-on"
                        checked={data.isMarketingEmailOn}
                        onChange={onCommunicationChange}
                        disabled={isUpdatePending}
                      />
                      <Flex as="span" sx={{ textTransform: "none", fontWeight: "normal" }}>
                        I want to receive product updates and announcements via email
                      </Flex>
                    </Label>
                  </Flex>
                  <RegisterTermsText />
                </Box>
                <Box sx={style.subSection}>
                  <Button
                    type="submit"
                    sx={{ "&[disabled]": { opacity: "0.2" }, width: "130px" }}
                    disabled={isSubmitDisabled}
                  >
                    {isUpdatePending ? <Spinner variant="styles.spinner.small" /> : "Save changes"}
                  </Button>
                </Box>
              </Box>
              <Divider />
              <Box sx={style.section}>
                <Heading as="h3" sx={{ mb: "3" }}>
                  Password
                </Heading>
                <Box sx={style.textBox}>
                  <Text>Forgot your password?</Text>{" "}
                  <Themed.a
                    as={RouterLink}
                    to={{ pathname: `/forgot-password/`, state: { email: data.email } }}
                    sx={{ cursor: "pointer", color: "blue.5" }}
                  >
                    Reset password
                  </Themed.a>
                  .
                </Box>
              </Box>
              <Divider />
              <Box sx={style.section}>
                <Heading as="h3" sx={{ mb: "3" }}>
                  Account deletion
                </Heading>
                <Box sx={style.textBox}>
                  <Text>
                    If you would like your account to be deleted, email{" "}
                    <a
                      href={`mailto:${accountDeleteEmail}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ color: "blue.5" }}
                    >
                      districtbuilder@azavea.com
                    </a>{" "}
                    with your name and email. Deletion of your account will result in the permanent
                    destruction of all your maps.
                  </Text>
                </Box>
              </Box>
            </Box>
          </Flex>
        </React.Fragment>
      ) : (
        <Flex sx={{ justifyContent: "center" }}>
          <Spinner variant="styles.spinner.large" />
        </Flex>
      )}
    </Flex>
  );
};

export default UserAccountScreen;
