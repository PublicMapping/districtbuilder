/** @jsx jsx */
import { Button as MenuButton, Wrapper, Menu, MenuItem } from "react-aria-menubutton";
import Avatar from "react-avatar";
import React, { useState } from "react";
import { Link, useHistory } from "react-router-dom";
import * as H from "history";
import Icon from "../components/Icon";
import SupportMenu from "../components/SupportMenu";
import OrganizationDropdown from "../components/OrganizationDropdown";
import { Alert, Styled, Box, Button, Flex, Heading, jsx, ThemeUIStyleObject } from "theme-ui";

import { ReactComponent as Logo } from "../media/logos/logo.svg";

import { resetState } from "../actions/root";
import { clearJWT, getJWT } from "../jwt";
import { UserState } from "../reducers/user";
import store from "../store";
import { resendConfirmationEmail } from "../api";
import { WriteResource } from "../resource";

interface Props {
  readonly user: UserState;
}

enum UserMenuKeys {
  Logout = "logout"
}

const logout = () => {
  clearJWT();
  store.dispatch(resetState());
};

const style: ThemeUIStyleObject = {
  header: {
    alignItems: "center",
    justifyContent: "space-between",
    py: 3,
    px: 3,
    bg: "gray.0",
    borderBottom: "1px solid",
    borderColor: "gray.1",
    boxShadow: "small"
  },
  logoLink: {
    borderRadius: "small",
    "&:focus": {
      outline: "none",
      boxShadow: "focus"
    }
  },
  avatar: {
    fontFamily: "heading",
    cursor: "pointer",
    ".sb-avatar__text": {
      "&:hover": {
        backgroundColor: "#395c78 !important"
      },
      "&:active": {
        backgroundColor: "#2c485e !important"
      }
    }
  },
  menuButton: {
    display: "flex",
    alignItems: "center",
    bg: "transparent",
    p: 1,
    borderRadius: "small",
    "&:focus": {
      outline: "none",
      boxShadow: "focus"
    }
  },
  menu: {
    width: "150px",
    position: "absolute",
    mt: 2,
    right: 2,
    bg: "muted",
    py: 1,
    px: 1,
    border: "1px solid",
    borderColor: "gray.2",
    boxShadow: "small",
    borderRadius: "small"
  },
  menuList: {
    p: "0",
    m: "0",
    listStyleType: "none"
  },
  menuListItem: {
    borderRadius: "small",
    py: 1,
    px: 2,
    "&:hover:not([disabled])": {
      bg: "gray.0",
      cursor: "pointer"
    },
    "&[disabled]": {
      color: "gray.3",
      cursor: "not-allowed"
    },
    "&:focus": {
      bg: "gray.0",
      outline: "none",
      boxShadow: "focus"
    },
    "&:active": {
      bg: "gray.1"
    }
  }
};

const SiteHeader = ({ user }: Props) => {
  const history = useHistory();
  const isLoggedIn = getJWT() !== null;
  const [resendEmail, setResendEmail] = useState<WriteResource<void, void>>({ data: void 0 });

  return (
    <Flex sx={{ flexDirection: "column" }}>
      {"resource" in user && !user.resource.isEmailVerified && (
        <Alert sx={{ borderRadius: "0" }}>
          <Box>
            Please confirm your email.{" "}
            <Box sx={{ display: "inline-block", p: 1 }}>
              {"resource" in resendEmail ? (
                <span sx={{ fontWeight: "body" }}>
                  Confirmation email sent to <b>{user.resource.email}</b>!
                </span>
              ) : (
                <React.Fragment>
                  <Button
                    sx={{
                      height: "auto",
                      cursor: "pointer",
                      textDecoration: "underline",
                      p: 0
                    }}
                    disabled={"isPending" in resendEmail && resendEmail.isPending}
                    onClick={() => {
                      setResendEmail({ ...resendEmail, isPending: true });
                      resendConfirmationEmail(user.resource.email)
                        .then(resource => setResendEmail({ data: resendEmail.data, resource }))
                        .catch(errors => setResendEmail({ data: resendEmail.data, errors }));
                    }}
                  >
                    Resend Email
                  </Button>
                </React.Fragment>
              )}
            </Box>
            {"errors" in resendEmail && (
              <Box sx={{ fontWeight: "body" }}>
                Error resending email. If this error persists, please contact us at{" "}
                <Styled.a sx={{ color: "muted" }} href="mailto:support@districtbuilder.org">
                  support@districtbuilder.org
                </Styled.a>
                .
              </Box>
            )}
          </Box>
        </Alert>
      )}
      <Flex as="header" sx={style.header}>
        <Heading as="h1" sx={{ mb: "0px", mr: "auto", p: 2 }}>
          <Link to="/" sx={style.logoLink}>
            <Logo sx={{ width: "15rem" }} />
          </Link>
        </Heading>
        {!isLoggedIn ? (
          <React.Fragment>
            <Link to="/login" sx={{ p: 2 }}>
              Login
            </Link>{" "}
            <Link to="/register" sx={{ p: 2 }}>
              Register
            </Link>
          </React.Fragment>
        ) : "resource" in user ? (
          <React.Fragment>
            <SupportMenu />
            {user.resource.organizations.length > 0 && (
              <OrganizationDropdown organizations={user.resource.organizations} />
            )}
            <Wrapper onSelection={handleSelection(history)} sx={{ ml: 3 }}>
              <MenuButton sx={style.menuButton}>
                <Avatar
                  name={user.resource.name}
                  round={true}
                  size={"2.5rem"}
                  color={"#2c485e"}
                  maxInitials={3}
                  sx={style.avatar}
                />
                <Box sx={{ ml: 2, color: "heading" }}>
                  <Icon name="angle-down" />
                </Box>
              </MenuButton>
              <Menu sx={style.menu}>
                <ul sx={style.menuList}>
                  <li key={UserMenuKeys.Logout}>
                    <MenuItem value={UserMenuKeys.Logout} sx={style.menuListItem}>
                      Logout
                    </MenuItem>
                  </li>
                </ul>
              </Menu>
            </Wrapper>
          </React.Fragment>
        ) : null}
      </Flex>
    </Flex>
  );
};

const handleSelection = (history: H.History) => (key: string | number) => {
  // eslint-disable-next-line
  if (key === UserMenuKeys.Logout) {
    logout();
    history.push("/login");
  }
};

export default SiteHeader;
