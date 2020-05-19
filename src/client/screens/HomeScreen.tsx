/** @jsx jsx */
import React, { useEffect } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { Box, Divider, Flex, Heading, jsx, Styled } from "theme-ui";

import { projectsFetch } from "../actions/projects";
import { State } from "../reducers";
import { ProjectsState } from "../reducers/projects";
import store from "../store";

interface StateProps {
  readonly projects: ProjectsState;
}

const HomeScreen = ({ projects }: StateProps) => {
  useEffect(() => {
    store.dispatch(projectsFetch());
  }, []);

  return (
    <Flex sx={{ flexDirection: "column" }}>
      <Flex as="header" sx={{ justifyContent: "flex-end" }}>
        <Heading as="h2" sx={{ mb: "0px", mr: "auto", p: 2 }}>
          DistrictBuilder
        </Heading>
        <Link to="/login" sx={{ p: 2 }}>
          Login
        </Link>{" "}
        <Link to="/register" sx={{ p: 2 }}>
          Register
        </Link>
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
    projects: state.projects
  };
}

export default connect(mapStateToProps)(HomeScreen);
