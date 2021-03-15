/** @jsx jsx */
import React, { useEffect } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import TimeAgo from "timeago-react";
import ProjectListFlyout from "../components/ProjectListFlyout";
import Icon from "../components/Icon";
import { Box, Divider, Flex, Heading, Text, jsx, Styled, ThemeUIStyleObject } from "theme-ui";
import { ReactComponent as NoMapsIllustration } from "../media/no-maps-illustration.svg";

import { projectsFetch } from "../actions/projects";
import { userFetch } from "../actions/user";
import { getJWT } from "../jwt";
import { State } from "../reducers";
import { UserState } from "../reducers/user";
import { Resource } from "../resource";
import store from "../store";
import { IProject } from "../../shared/entities";
import DeleteProjectModal from "../components/DeleteProjectModal";
import SiteHeader from "../components/SiteHeader";

interface StateProps {
  readonly projects: Resource<readonly IProject[]>;
  readonly user: UserState;
}

const style: ThemeUIStyleObject = {
  projectRow: {
    textDecoration: "none",
    display: "flex",
    alignItems: "baseline",
    borderRadius: "med",
    marginRight: "auto",
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

const HomeScreen = ({ projects, user }: StateProps) => {
  const isLoggedIn = getJWT() !== null;
  const projectList =
    "resource" in projects ? projects.resource.filter(project => !project.archived) : [];

  useEffect(() => {
    isLoggedIn && store.dispatch(projectsFetch());
    isLoggedIn && store.dispatch(userFetch());
  }, [isLoggedIn]);

  return (
    <Flex sx={{ flexDirection: "column" }}>
      <DeleteProjectModal />
      <SiteHeader user={user} />
      <Flex
        as="main"
        sx={{ width: "100%", maxWidth: "large", my: 6, mx: "auto", flexDirection: "column", px: 4 }}
      >
        {projectList.length > 0 && (
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
          projectList.length > 0 ? (
            projectList.map(project => (
              <React.Fragment key={project.id}>
                <Box>
                  <Flex sx={{ position: "relative" }}>
                    <Link to={`/projects/${project.id}`} sx={style.projectRow}>
                      <Heading
                        as="h2"
                        sx={{
                          fontFamily: "heading",
                          variant: "text.h5",
                          fontWeight: "light",
                          mr: 3
                        }}
                      >
                        {project.name}
                      </Heading>
                      <p sx={{ fontSize: 2, color: "gray.7" }}>
                        ({project.regionConfig.name}, {project.numberOfDistricts} districts)
                      </p>
                    </Link>
                    <ProjectListFlyout project={project} />
                  </Flex>
                  <div
                    sx={{
                      fontWeight: "light",
                      color: "gray.5",
                      paddingLeft: "5px"
                    }}
                  >
                    Last updated <TimeAgo datetime={project.updatedDt} />
                  </div>
                  <Divider />
                </Box>
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

function mapStateToProps(state: State): StateProps {
  return {
    projects: state.projects.projects,
    user: state.user
  };
}

export default connect(mapStateToProps)(HomeScreen);
