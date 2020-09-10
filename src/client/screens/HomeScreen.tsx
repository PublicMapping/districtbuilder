/** @jsx jsx */
import { Button as MenuButton, Wrapper, Menu, MenuItem } from "react-aria-menubutton";
import Avatar from "react-avatar";
import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { Link, RouteComponentProps } from "react-router-dom";
import * as H from "history";
import Icon from "../components/Icon";
import {
  Alert,
  Box,
  Button,
  Divider,
  Flex,
  Heading,
  Text,
  jsx,
  Styled,
  ThemeUIStyleObject
} from "theme-ui";
import { ReactComponent as Logo } from "../media/logos/logo.svg";
import { ReactComponent as NoMapsIllustration } from "../media/no-maps-illustration.svg";

import { resetState } from "../actions/root";
import { projectsFetch } from "../actions/projects";
import { userFetch } from "../actions/user";
import { resendConfirmationEmail } from "../api";
import { clearJWT, getJWT } from "../jwt";
import { State } from "../reducers";
import { ProjectsState } from "../reducers/projects";
import { UserState } from "../reducers/user";
import { WriteResource } from "../resource";
import store from "../store";

interface StateProps {
  readonly projects: ProjectsState;
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
  guideLink: {
    fontSize: 1,
    borderRadius: "small",
    bg: "peach.1",
    color: "peach.8",
    px: 2,
    py: 1,
    display: "flex",
    alignItems: "center",
    ml: "auto",
    mr: "3",
    "&:visited": {
      color: "peach.8"
    },
    "> svg": {
      mr: 1
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
  },
  projectRow: {
    textDecoration: "none",
    display: "flex",
    alignItems: "baseline",
    borderRadius: "med",
    px: 1,
    "&:hover:not([disabled])": {
      bg: "rgba(256,256,256,0.2)",
      h2: {
        color: "primary",
        textDecoration: "underline"
      },
      p: {
        color: "blue.6"
      }
    },
    "&:focus": {
      outline: "none",
      boxShadow: "focus"
    }
  }
};

const HomeScreen = ({ projects, user, history }: StateProps & RouteComponentProps<"history">) => {
  const [resendEmail, setResendEmail] = useState<WriteResource<void, void>>({ data: void 0 });
  const isLoggedIn = getJWT() !== null;
  useEffect(() => {
    isLoggedIn && store.dispatch(projectsFetch());
    isLoggedIn && store.dispatch(userFetch());
  }, [isLoggedIn]);

  return (
    <Flex sx={{ flexDirection: "column" }}>
      {"resource" in user && !user.resource.isEmailVerified && (
        <Alert sx={{ borderRadius: "0" }}>
          <Box>
            Please confirm your email in the next 14 days.{" "}
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
            <Styled.a
              sx={style.guideLink}
              href="https://github.com/PublicMapping/districtbuilder/wiki/Getting-Started-with-DistrictBuilder"
              target="_blank"
            >
              <Icon name="book-spells" />
              Getting Started Guide
            </Styled.a>
            <Wrapper onSelection={handleSelection(history)}>
              <MenuButton sx={style.menuButton}>
                <Avatar
                  name={user.resource.name}
                  round={true}
                  size={"2.5rem"}
                  color={"#2c485e"}
                  maxInitials={3}
                  sx={style.avatar}
                />
                <div sx={{ ml: 2 }}>
                  <Icon name="chevron-down" />
                </div>
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
      <Flex
        as="main"
        sx={{ width: "100%", maxWidth: "large", my: 6, mx: "auto", flexDirection: "column", px: 4 }}
      >
        {"resource" in projects && projects.resource.length > 0 && (
          <Flex sx={{ justifyContent: "space-between", mb: 3 }}>
            <Heading as="h1" sx={{ variant: "text.h3" }}>
              Maps
            </Heading>
            <Styled.a
              as={Link}
              to="/create-project"
              sx={{ variant: "links.button", fontSize: 3, px: 4, py: 2 }}
            >
              <Icon name="plus-circle" />
              New map
            </Styled.a>
          </Flex>
        )}

        {"resource" in projects ? (
          projects.resource.length ? (
            projects.resource.map(project => (
              <React.Fragment key={project.id}>
                <Link to={`/projects/${project.id}`} sx={style.projectRow}>
                  <Heading
                    as="h2"
                    sx={{ fontFamily: "heading", variant: "text.h5", fontWeight: "light", mr: 3 }}
                  >
                    {project.name}
                  </Heading>
                  <p sx={{ fontSize: 2, color: "gray.7" }}>
                    ({project.regionConfig.name}, {project.numberOfDistricts} districts)
                  </p>
                </Link>
                <Divider />
              </React.Fragment>
            ))
          ) : (
            <Flex
              sx={{
                flexDirection: "column",
                alignItems: "center",
                maxWidth: "500px",
                mt: 7,
                mx: "auto"
              }}
            >
              <Box sx={{ mb: 5, mx: "auto" }}>
                <NoMapsIllustration />
              </Box>
              <Heading sx={{ variant: "text.h4", textAlign: "center" }}>
                Welcome to DistrictBuilder!
              </Heading>

              <Text sx={{ fontSize: 3, color: "text", textAlign: "center", mb: 5 }}>
                Start building your first map or check out our{" "}
                <Styled.a
                  href="https://github.com/PublicMapping/districtbuilder/wiki/Getting-Started-with-DistrictBuilder"
                  target="_blank"
                >
                  Getting Started Guide
                </Styled.a>{" "}
                to learn how!
              </Text>
              <Styled.a
                as={Link}
                to="/create-project"
                sx={{ variant: "links.button", fontSize: 3, px: 4, py: 2 }}
              >
                <Icon name="plus-circle" />
                Create a map
              </Styled.a>
            </Flex>
          )
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

function mapStateToProps(state: State): StateProps {
  return {
    projects: state.projects,
    user: state.user
  };
}

export default connect(mapStateToProps)(HomeScreen);
