/** @jsx jsx */
import React, { useEffect, useState } from "react";
import { projectsFetch } from "../actions/projects";
import { userFetch } from "../actions/user";
import { connect } from "react-redux";
import { Link, RouteComponentProps } from "react-router-dom";
import Icon from "../components/Icon";
import AvatarMenu from "../components/AvatarMenu";
import store from "../store";
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

import { resendConfirmationEmail } from "../api";
import { getJWT } from "../jwt";
import { State } from "../reducers";
import { ProjectsState } from "../reducers/projects";
import { UserState } from "../reducers/user";
import { WriteResource } from "../resource";

interface StateProps {
  readonly projects: ProjectsState;
  readonly user: UserState;
}

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
        <AvatarMenu user={user} history={history} />
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
                Start building your first map. DistrictBuilder gives you access to the same
                block-level data used in legal redistricting plans.
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

function mapStateToProps(state: State): StateProps {
  return {
    projects: state.projects,
    user: state.user
  };
}

export default connect(mapStateToProps)(HomeScreen);
