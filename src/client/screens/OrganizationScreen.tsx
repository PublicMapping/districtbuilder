/** @jsx jsx */
import { useEffect, useState } from "react";
import { connect } from "react-redux";
import { useHistory, useParams } from "react-router-dom";
import { Box, Button, Flex, Heading, Image, jsx, Link, Text } from "theme-ui";
import { formatDate } from "../functions";

import { showCopyMapModal } from "../actions/districtDrawing";
import { organizationFetch } from "../actions/organization";
import { leaveOrganization } from "../actions/organizationJoin";
import { userFetch } from "../actions/user";
import { organizationProjectsFetch } from "../actions/organizationProjects";
import { createProject } from "../api";
import { getJWT } from "../jwt";
import { State } from "../reducers";
import { OrganizationState } from "../reducers/organization";
import { UserState } from "../reducers/user";
import { OrganizationProjectsState } from "../reducers/organizationProjects";
import store from "../store";

import {
  CreateProjectData,
  IOrganization,
  IProject,
  IProjectTemplate,
  IUser
} from "../../shared/entities";
import { OrgProject } from "../types";

import Icon from "../components/Icon";
import JoinOrganizationModal from "../components/JoinOrganizationModal";
import SiteHeader from "../components/SiteHeader";
import Tooltip from "../components/Tooltip";
import FeaturedProjectCard from "../components/FeaturedProjectCard";

import PageNotFoundScreen from "./PageNotFoundScreen";

interface StateProps {
  readonly organization: OrganizationState;
  readonly organizationProjects: OrganizationProjectsState;
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
  featuredProjects: {
    p: 5
  },
  templateContainer: {
    display: "grid",
    gridTemplateColumns: "350px 350px 350px",
    gridGap: "30px",
    justifyContent: "space-between"
  },
  featuredProjectContainer: {
    display: "grid",
    gridTemplateColumns: "350px 350px 350px",
    gridGap: "30px",
    justifyContent: "space-between"
  },
  template: {
    flexDirection: "column",
    border: "1px solid black",
    padding: "20px"
  },
  featuredProject: {
    flexDirection: "column",
    border: "1px solid black",
    padding: "20px",
    minHeight: "200px"
  },
  useTemplateBtn: {
    width: "100%",
    background: "lightgray",
    color: "black"
  },
  projectMap: {
    height: "100px",
    width: "100px"
  }
} as const;


const OrganizationScreen = ({ organization, organizationProjects, user }: StateProps) => {
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

  const featuredProjects =
    "resource" in organizationProjects.projectTemplates
      ? organizationProjects.projectTemplates.resource
          .map(pt => {
            return pt.projects.map(p => {
              return {
                ...p,
                updatedAgo: formatDate(p.updatedDt),
                creator: p.user.name,
                templateName: pt.name,
                regionConfig: pt.regionConfig,
                numberOfDistricts: pt.numberOfDistricts
              };
            });
          })
          .flat()
          .filter(p => p.isFeatured)
      : undefined;

  useEffect(() => {
    isLoggedIn && store.dispatch(userFetch());
  }, [isLoggedIn]);

  useEffect(() => {
    store.dispatch(organizationFetch(organizationSlug));
    store.dispatch(organizationProjectsFetch(organizationSlug));
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

  const joinButton = (
    <Flex sx={{ flexDirection: "column", flex: "none" }}>
      <Button sx={style.join} disabled={isLoggedIn && !userIsVerified} onClick={signupAndJoinOrg}>
        Join organization
      </Button>
      <Box sx={style.joinText}>Join to start making district maps with this organization</Box>
    </Flex>
  );

  const TemplateCard = ({ template }: { readonly template: IProjectTemplate }) => {
    const useButton = (
      <Button
        disabled={isLoggedIn && !userIsVerified}
        onClick={() => setupProjectFromTemplate(template)}
        sx={style.useTemplateBtn}
      >
        Use this template
      </Button>
    );

    return (
      <Flex sx={style.template}>
        <Heading>{template.name}</Heading>
        <Text>
          {template.regionConfig.name} · {template.numberOfDistricts}
        </Text>
        <Text>{template.description}</Text>
        {userIsVerified || !isLoggedIn ? (
          useButton
        ) : (
          <Tooltip
            key={template.id}
            content={
              <div>
                {userInOrg
                  ? "You must confirm your email before using your organization's template"
                  : "You must confirm your email before using this organization's template"}
              </div>
            }
          >
            <Box>{useButton}</Box>
          </Tooltip>
        )}
      </Flex>
    );
  };

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
              {userInOrg && userIsVerified ? (
                <Flex sx={{ flexDirection: "column", flex: "none" }} onClick={leaveOrg}>
                  <Button sx={style.join}>Leave organization</Button>
                </Flex>
              ) : "resource" in user && user.resource ? (
                userIsVerified ? (
                  joinButton
                ) : (
                  <Tooltip
                    key={1}
                    content={
                      <div>
                        {userInOrg
                          ? "Confirm your email to finish joining this organization"
                          : "You must confirm your email before joining an organization"}
                      </div>
                    }
                  >
                    {joinButton}
                  </Tooltip>
                )
              ) : (
                joinButton
              )}
            </Flex>
            <Flex>
              {organization.resource.projectTemplates.length > 0 && (
                <Box sx={style.templates}>
                  <Heading>Templates</Heading>
                  Start a new map using the official settings from {organization.resource.name}
                  <Box sx={style.templateContainer}>
                    {organization.resource.projectTemplates.map(template => (
                      <TemplateCard template={template} key={template.id} />
                    ))}
                  </Box>
                </Box>
              )}
            </Flex>
            <Flex>
              {featuredProjects ? (
                <Box sx={style.featuredProjects}>
                  <Heading>Featured maps</Heading>
                  <Box sx={style.featuredProjectContainer}>
                    {featuredProjects.length > 0 ? (
                      featuredProjects.map((project: OrgProject) => (
                        <FeaturedProjectCard project={project} key={project.id} />
                      ))
                    ) : (
                      <Box>{organization.resource.name} has no featured maps yet.</Box>
                    )}
                  </Box>
                </Box>
              ) : (
                <div>Loading</div>
              )}
            </Flex>
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
    organizationProjects: state.organizationProjects,
    user: state.user
  };
}

export default connect(mapStateToProps)(OrganizationScreen);
