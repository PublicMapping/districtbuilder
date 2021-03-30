/** @jsx jsx */
import { useEffect, useState } from "react";
import { connect } from "react-redux";
import { useHistory, useParams } from "react-router-dom";
import { Box, Button, Flex, Heading, Image, jsx, Link, Spinner, Text } from "theme-ui";
import { formatDate } from "../functions";

import { showCopyMapModal } from "../actions/districtDrawing";
import { organizationFetch } from "../actions/organization";
import { leaveOrganization } from "../actions/organizationJoin";
import { userFetch } from "../actions/user";
import { organizationFeaturedProjectsFetch } from "../actions/organizationProjects";
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
    mb: 4
  },
  logo: {
    flex: "none",
    objectFit: "contain",
    maxHeight: "60px"
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
    py: 5
  },
  featuredProjects: {
    pt: 4,
    pb: 8
  },
  container: {
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
  templateContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gridGap: "15px",
    justifyContent: "space-between",
    marginTop: "4"
  },
  featuredProjectContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gridGap: "15px",
    justifyContent: "space-between",
    marginTop: "4"
  },
  template: {
    flexDirection: "column",
    padding: "15px",
    bg: "#fff",
    borderRadius: "2px",
    boxShadow: "small"
  },
  featuredProject: {
    flexDirection: "column",
    border: "1px solid black",
    padding: "15px",
    minHeight: "200px"
  },
  useTemplateBtn: {
    width: "100%",
    background: "lightgray",
    color: "black"
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
    "resource" in organizationProjects.featuredProjects
      ? organizationProjects.featuredProjects.resource
          .map(pt => {
            return pt.projects.map(p => {
              return {
                ...p,
                updatedAgo: formatDate(p.updatedDt),
                creator: { name: p.user.name, email: p.user.email },
                project: { name: p.name, id: p.id },
                templateName: pt.name,
                regionConfig: pt.regionConfig,
                numberOfDistricts: pt.numberOfDistricts
              };
            });
          })
          .flat()
      : undefined;

  useEffect(() => {
    isLoggedIn && store.dispatch(userFetch());
  }, [isLoggedIn]);

  useEffect(() => {
    store.dispatch(organizationFetch(organizationSlug));
    store.dispatch(organizationFeaturedProjectsFetch(organizationSlug));
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

  function createProjectFromTemplate(template: CreateProjectData) {
    void createProject(template).then((project: IProject) =>
      history.push(`/projects/${project.id}`)
    );
  }

  function setupProjectFromTemplate(template: IProjectTemplate) {
    const { id, name, regionConfig, numberOfDistricts, districtsDefinition, chamber } = template;
    const currentTemplate = {
      name,
      regionConfig,
      numberOfDistricts,
      districtsDefinition,
      chamber,
      projectTemplate: { id }
    };
    // Set project template so we can redirect unauthenticated users after they login
    setProjectTemplate(currentTemplate);
    userInOrg ? createProjectFromTemplate(currentTemplate) : store.dispatch(showCopyMapModal(true));
  }

  const joinButton = (
    <Flex
      sx={{
        flexDirection: "column",
        flex: "1",
        textAlign: "right",
        alignItems: "flex-end"
      }}
    >
      <Box sx={{ textAlign: "center" }}>
        <Button sx={style.join} disabled={isLoggedIn && !userIsVerified} onClick={signupAndJoinOrg}>
          Join organization
        </Button>
        <Box sx={style.joinText}>Join to start making district maps with this organization</Box>
      </Box>
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
        <Heading
          as="h3"
          sx={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            mb: "0"
          }}
        >
          {template.name}
        </Heading>
        <Text
          sx={{
            fontSize: "2",
            margin: "4px 0 2px"
          }}
        >
          {template.regionConfig.name} · {template.numberOfDistricts} districts
        </Text>
        <Text
          sx={{
            fontSize: "1",
            mb: "3"
          }}
        >
          {template.description}
        </Text>
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
              <Flex sx={style.container}>
                {organization.resource.logoUrl && (
                  <Box>
                    <Image src={organization.resource.logoUrl} sx={style.logo} />
                  </Box>
                )}
                <Box sx={{ width: "620px" }}>
                  <Heading as="h1">{organization.resource.name}</Heading>
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
                  <Box
                    sx={{
                      flexDirection: "column",
                      flex: "1",
                      textAlign: "right",
                      alignItems: "flex-end"
                    }}
                    onClick={leaveOrg}
                  >
                    <Button
                      sx={{
                        borderColor: "primary",
                        borderWidth: "1px",
                        borderStyle: "solid",
                        bg: "transparent",
                        color: "primary",
                        "&:hover": {
                          bg: "#f06543 !important",
                          borderColor: "#f06543 !important"
                        }
                      }}
                    >
                      Leave organization
                    </Button>
                  </Box>
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
            </Flex>
            <Box sx={style.container}>
              {organization.resource.projectTemplates.length > 0 && (
                <Box sx={style.templates}>
                  <Heading as="h2" sx={{ mb: "3" }}>
                    Templates
                  </Heading>
                  <Text>
                    Start a new map using the official settings from {organization.resource.name}
                  </Text>
                  <Box sx={style.templateContainer}>
                    {organization.resource.projectTemplates.map(template => (
                      <TemplateCard template={template} key={template.id} />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
            <Box>
              {featuredProjects ? (
                <Box sx={{ ...style.featuredProjects, ...style.container }}>
                  <Heading as="h2" sx={{ mb: "3" }}>
                    Featured maps
                  </Heading>
                  <Text>
                    A collection of highlighted maps built by members of{" "}
                    {organization.resource.name}
                  </Text>
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
                <Flex sx={{ justifyContent: "center" }}>
                  <Spinner variant="spinner.large" />
                </Flex>
              )}
            </Box>
          </Box>
        ) : "statusCode" in organization && organization.statusCode === 404 ? (
          <PageNotFoundScreen model={"organization"} />
        ) : (
          <Flex sx={{ justifyContent: "center", marginTop: "6" }}>
            <Spinner variant="spinner.large" />
          </Flex>
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
