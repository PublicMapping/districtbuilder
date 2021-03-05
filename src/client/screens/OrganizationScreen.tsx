/** @jsx jsx */
import { useEffect, useState } from "react";
import { connect } from "react-redux";
import { useHistory, useParams } from "react-router-dom";
import { Box, Button, Flex, Heading, Image, jsx, Link, Text } from "theme-ui";

import {
  CreateProjectData,
  IOrganization,
  IProject,
  IProjectTemplate,
  IUser
} from "../../shared/entities";

import { showCopyMapModal } from "../actions/districtDrawing";
import { organizationFetch } from "../actions/organization";
import { leaveOrganization } from "../actions/organizationJoin";
import { userFetch } from "../actions/user";
import { createProject } from "../api";
import Icon from "../components/Icon";
import JoinOrganizationModal from "../components/JoinOrganizationModal";
import SiteHeader from "../components/SiteHeader";
import Tooltip from "../components/Tooltip";
import { getJWT } from "../jwt";
import { State } from "../reducers";
import { OrganizationState } from "../reducers/organization";
import { UserState } from "../reducers/user";
import store from "../store";

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

const OrganizationScreen = ({ organization, user }: StateProps) => {
  const { organizationSlug } = useParams();
  const [projectTemplate, setProjectTemplate] = useState<CreateProjectData | undefined>(undefined);
  const history = useHistory();
  const isLoggedIn = getJWT() !== null;
  const userInOrg =
    "resource" in user &&
    user.resource &&
    "resource" in organization &&
    organization.resource &&
    checkIfUserInOrg(organization.resource, user.resource);

  const userIsVerified = "resource" in user && user.resource && user.resource.isEmailVerified;

  useEffect(() => {
    isLoggedIn && store.dispatch(userFetch());
  }, [isLoggedIn]);

  useEffect(() => {
    store.dispatch(organizationFetch(organizationSlug));
  }, [organizationSlug]);

  function signupAndJoinOrg() {
    store.dispatch(showCopyMapModal(true));
  }

  function leaveOrg() {
    "resource" in user &&
      user.resource &&
      store.dispatch(leaveOrganization({ organization: organizationSlug, user: user.resource.id }));
  }

  function checkIfUserInOrg(org: IOrganization, user: IUser) {
    const userExists = org.users.filter(u => {
      return u.id === user.id;
    });
    return userExists.length > 0;
  }

  function createProjectFromTemplate() {
    projectTemplate &&
      void createProject(projectTemplate).then((project: IProject) =>
        history.push(`/projects/${project.id}`)
      );
  }

  function setupProjectFromTemplate(template: IProjectTemplate) {
    const { id, name, regionConfig, numberOfDistricts, districtsDefinition, chamber } = template;
    setProjectTemplate({
      name,
      regionConfig,
      numberOfDistricts,
      districtsDefinition,
      chamber,
      projectTemplate: { id }
    });
    userInOrg ? createProjectFromTemplate() : store.dispatch(showCopyMapModal(true));
  }

  return (
    <Flex sx={{ flexDirection: "column" }}>
      <SiteHeader user={user} />
      <Flex as="main" sx={style.main}>
        {"resource" in organization ? (
          <Box>
            <Flex sx={style.header}>
              {organization.resource.logoUrl && (
                <Image src={organization.resource.logoUrl} sx={style.logo} />
              )}
              <Box>
                <Heading>{organization.resource.name}</Heading>
                <Box>
                  {(organization.resource.municipality || organization.resource.region) && (
                    <Box as="span" sx={style.item}>
                      <Icon name="map-marker" /> {organization.resource.municipality}
                      {organization.resource.municipality && organization.resource.region && ", "}
                      {organization.resource.region}
                    </Box>
                  )}
                  {organization.resource.linkUrl && (
                    <Box as="span" sx={style.item}>
                      <Icon name="link" />{" "}
                      <Link href={`https://${organization.resource.linkUrl}`}>
                        {organization.resource.linkUrl}
                      </Link>
                    </Box>
                  )}
                  <Box as="span" sx={style.item}>
                    <Icon name="tools" /> {organization.resource.users?.length || 0} builders
                  </Box>
                </Box>
                {organization.resource.description && (
                  <Box>{organization.resource.description}</Box>
                )}
              </Box>
              {userInOrg ? (
                <Flex sx={{ flexDirection: "column", flex: "none" }} onClick={leaveOrg}>
                  <Button sx={style.join}>Leave organization</Button>
                </Flex>
              ) : "resource" in user && user.resource ? (
                userIsVerified ? (
                  <Flex sx={{ flexDirection: "column", flex: "none" }}>
                    <Button sx={style.join} disabled={!userIsVerified} onClick={signupAndJoinOrg}>
                      Join organization
                    </Button>
                    <Box sx={style.joinText}>
                      Join to start making district maps with this organization
                    </Box>
                  </Flex>
                ) : (
                  <Tooltip
                    key={1}
                    content={<div>You must confirm your email before joining an organization</div>}
                  >
                    <Flex sx={{ flexDirection: "column", flex: "none" }}>
                      <Button sx={style.join} disabled={!userIsVerified} onClick={signupAndJoinOrg}>
                        Join organization
                      </Button>
                      <Box sx={style.joinText}>
                        Join to start making district maps with this organization
                      </Box>
                    </Flex>
                  </Tooltip>
                )
              ) : (
                <Flex sx={{ flexDirection: "column", flex: "none" }}>
                  <Button sx={style.join} onClick={signupAndJoinOrg}>
                    Join organization
                  </Button>
                  <Box sx={style.joinText}>
                    Register for an account to start making district maps with this organization
                  </Box>
                </Flex>
              )}
            </Flex>
            {organization.resource.projectTemplates.length > 0 && (
              <Box sx={style.templates}>
                <Heading>Templates</Heading>
                Start a new map using the official settings from {organization.resource.name}
                <Box sx={style.templateContainer}>
                  {organization.resource.projectTemplates.map(template => (
                    <Flex key={template.id} sx={style.template}>
                      <Heading>{template.name}</Heading>
                      <Text>
                        {template.regionConfig.name} · {template.numberOfDistricts}
                      </Text>
                      <Text>{template.description}</Text>
                      <Button onClick={() => setupProjectFromTemplate(template)}>
                        Use this template
                      </Button>
                    </Flex>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        ) : "statusCode" in organization && organization.statusCode === 404 ? (
          <PageNotFoundScreen model={"organization"} />
        ) : (
          <Box>Loading...</Box>
        )}
      </Flex>
      {"resource" in organization && organization.resource && (
        <JoinOrganizationModal
          organization={organization.resource}
          projectTemplate={projectTemplate}
        />
      )}
    </Flex>
  );
};

function mapStateToProps(state: State): StateProps {
  return {
    organization: state.organization,
    user: state.user
  };
}

export default connect(mapStateToProps)(OrganizationScreen);
