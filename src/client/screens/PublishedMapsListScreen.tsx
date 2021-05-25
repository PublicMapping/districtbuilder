/** @jsx jsx */
import MapboxGL from "mapbox-gl";
import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { useParams } from "react-router-dom";
import { Flex, jsx, Spinner, ThemeUIStyleObject, Box, Heading, Text } from "theme-ui";

import { areAnyGeoUnitsSelected, destructureResource } from "../functions";
import { DistrictsGeoJSON } from "../types";
import { IProject, ProjectNest } from "../../shared/entities";
import { projectDataFetch } from "../actions/projectData";
import { DistrictDrawingState } from "../reducers/districtDrawing";
import { resetProjectState } from "../actions/root";
import { userFetch } from "../actions/user";
import "../App.css";
import { getJWT } from "../jwt";
import { State } from "../reducers";
import { Resource } from "../resource";
import store from "../store";
import { useBeforeunload } from "react-beforeunload";
import SiteHeader from "../components/SiteHeader";
import { globalProjectsFetch } from "../actions/projects";
import { UserState } from "../reducers/user";
import FeaturedProjectCard from "../components/FeaturedProjectCard";

interface StateProps {
  readonly globalProjects?: readonly IProject[];
  readonly user: UserState;
}

const style = {
  projects: {
    pt: 4,
    pb: 8,
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
  featuredProjectContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gridGap: "15px",
    justifyContent: "space-between",
    marginTop: "4"
  }
};

const PublishedMapsListScreen = ({ globalProjects, user }: StateProps) => {
  useEffect(() => {
    console.log("fetching global projects");
    store.dispatch(globalProjectsFetch());
  }, []);

  return (
    <Flex sx={{ height: "100%", flexDirection: "column" }}>
      <SiteHeader user={user} />
      <Box>
        {globalProjects ? (
          // @ts-ignore
          <Box sx={style.projects}>
            <Heading as="h2" sx={{ mb: "3" }}>
              <span>All published maps</span>
            </Heading>
            <Text>A collection of maps built by all DistrictBuilder users globally</Text>
            <Box sx={style.featuredProjectContainer}>
              {globalProjects.length > 0 ? (
                globalProjects.map((project: ProjectNest) => (
                  <FeaturedProjectCard project={project} key={project.id} />
                ))
              ) : (
                <Box>There are no published maps yet.</Box>
              )}
            </Box>
          </Box>
        ) : (
          <Flex sx={{ justifyContent: "center" }}>
            <Spinner variant="spinner.large" />
          </Flex>
        )}
      </Box>
    </Flex>
  );
};

function mapStateToProps(state: State): StateProps {
  return {
    globalProjects:
      "resource" in state.projects.globalProjects
        ? state.projects.globalProjects.resource
        : undefined,
    user: state.user
  };
}

export default connect(mapStateToProps)(PublishedMapsListScreen);
