/** @jsx jsx */
import Menu, { MenuItem, SubMenu } from "rc-menu";
import "rc-menu/assets/index.css";
import Avatar from "react-avatar";
import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { Alert, Box, Button, Divider, Flex, Heading, jsx, Styled } from "theme-ui";

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

const HomeScreen = ({ projects, user }: StateProps) => {
  const [resendEmail, setResendEmail] = useState<WriteResource<void, void>>({ data: void 0 });
  const isLoggedIn = getJWT() !== null;
  useEffect(() => {
    isLoggedIn && store.dispatch(projectsFetch());
    isLoggedIn && store.dispatch(userFetch());
  }, [isLoggedIn]);

  return (
    <Flex sx={{ flexDirection: "column" }}>
      {"resource" in user && !user.resource.isEmailVerified && (
        <Alert>
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
                Error resending email, please try again or contact support
              </Box>
            )}
          </Box>
        </Alert>
      )}
      <Flex as="header" sx={{ justifyContent: "flex-end" }}>
        <Heading as="h2" sx={{ mb: "0px", mr: "auto", p: 2 }}>
          DistrictBuilder
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
          <Box
            sx={{
              p: 1,

              "& > .rc-menu": {
                m: 0,
                borderBottom: "none",

                "& > .rc-menu-submenu": {
                  borderBottom: "none",
                  "& > .rc-menu-submenu-title": {
                    p: 0
                  }
                },
                "& > .rc-menu-submenu-active, & > .rc-menu-submenu-selected": {
                  background: "none",
                  border: "none"
                },
                "& > .rc-menu-submenu-active": {
                  "& > .rc-menu-submenu-title": {
                    background: "none"
                  },
                  "& .rc-menu-submenu-arrow": {
                    display: "none"
                  }
                }
              }
            }}
          >
            <Menu
              triggerSubMenuAction="click"
              mode="horizontal"
              onSelect={({ key }: { readonly key: string | number }) =>
                key === UserMenuKeys.Logout && logout()
              }
            >
              <SubMenu
                title={
                  <Avatar
                    name={user.resource.name}
                    round={true}
                    size={"2rem"}
                    maxInitials={3}
                    color={"#a0aec0"}
                    sx={{
                      cursor: "pointer",
                      ".sb-avatar__text": {
                        "&:hover": { backgroundColor: "#718096 !important" }
                      }
                    }}
                  />
                }
              >
                <MenuItem key={UserMenuKeys.Logout}>Logout</MenuItem>
              </SubMenu>
            </Menu>
          </Box>
        ) : null}
      </Flex>
      <Divider />
      <Flex as="main" sx={{ flexDirection: "column" }}>
        <Heading sx={{ textAlign: "left", p: 2 }}>
          Maps
          <Styled.a
            as={Link}
            to="/create-project"
            sx={{ variant: "links.button", float: "right", fontSize: 2 }}
          >
            New map
          </Styled.a>
        </Heading>
        {"resource" in projects ? (
          projects.resource.length ? (
            projects.resource.map(project => (
              <React.Fragment key={project.id}>
                <Link to={`/projects/${project.id}`}>{project.name}</Link> (
                {project.regionConfig.name} - {project.numberOfDistricts})
                <Divider />
              </React.Fragment>
            ))
          ) : (
            <Box>No maps created yet</Box>
          )
        ) : null}
      </Flex>
    </Flex>
  );
};

function mapStateToProps(state: State): StateProps {
  return {
    projects: state.projects,
    user: state.user
  };
}

export default connect(mapStateToProps)(HomeScreen);
