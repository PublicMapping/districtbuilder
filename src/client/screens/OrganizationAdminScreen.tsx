/** @jsx jsx */
import { useEffect, useState } from "react";
import { connect } from "react-redux";
import { useHistory, useParams } from "react-router-dom";
import { Box, Button, Flex, Heading, Image, Link, jsx, Text } from "theme-ui";

import { organizationFetch } from "../actions/organization";
import { organizationProjectsFetch } from "../actions/organizationProjects";
import { getJWT } from "../jwt";
import { State } from "../reducers";
import { OrganizationState } from "../reducers/organization";
import { ProjectState } from "../reducers/project";
import { UserState } from "../reducers/user";
import store from "../store";
import SiteHeader from "../components/SiteHeader";
import Icon from "../components/Icon";
import { showCopyMapModal } from "../actions/districtDrawing";
import JoinOrganizationModal from "../components/JoinOrganizationModal";
import Tooltip from "../components/Tooltip";
import {
  IProject,
  IOrganization,
  IUser,
  IProjectTemplate,
  CreateProjectData
} from "../../shared/entities";
import { createProject } from "../api";
import PageNotFoundScreen from "./PageNotFoundScreen";

interface StateProps {
  readonly organization: OrganizationState;
  readonly user: UserState;
}

const style = {
  main: { width: "100%", mx: 0, flexDirection: "column" },
  header: {
    bg: "gray.0",
    borderBottom: "1px solid",
    borderColor: "gray.1",
    boxShadow: "small",
    p: 5,
    "> *": {
      m: 5
    }
  },
  logo: {
    flex: "none",
    objectFit: "contain"
  },
  item: {
    pr: 2
  },
  join: {
    whiteSpace: "nowrap"
  },
  joinText: {
    fontSize: 0,
    maxWidth: "200px",
    p: 1,
    pt: 3,
    textAlign: "center"
  },
  templates: {
    p: 5
  },
  templateContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, 300px)",
    gridGap: "30px",
    justifyContent: "space-between"
  },
  template: {
    flexDirection: "column"
  }
} as const;

const OrganizationAdminScreen = ({ organization, user }: StateProps) => {
  const { organizationSlug } = useParams();

  useEffect(() => {
    store.dispatch(organizationFetch(organizationSlug));
  }, [organizationSlug]);

  useEffect(() => {
    store.dispatch(organizationProjectsFetch(organizationSlug));
  }, [organizationSlug]);

  return (
    <Flex sx={{ flexDirection: "column" }}>
      <SiteHeader user={user} />
      <Flex as="main" sx={style.main}>
        {"resource" in organization ? (
          <Box>
            <Flex sx={style.header}>
              <Box>
                <Heading as="h3">{organization.resource.name}</Heading>
                <Heading>Maps</Heading>
                <Box>
                  Published maps that were created by members of your organization. You can select
                  up to 12 maps to feature on your organization profile page.
                </Box>
              </Box>
            </Flex>
          </Box>
        ) : "statusCode" in organization && organization.statusCode === 404 ? (
          <PageNotFoundScreen model={"organization"} />
        ) : (
          <Box>Loading...</Box>
        )}
      </Flex>
    </Flex>
  );
};

function mapStateToProps(state: State): StateProps {
  return {
    organization: state.organization,
    user: state.user
  };
}

export default connect(mapStateToProps)(OrganizationAdminScreen);
