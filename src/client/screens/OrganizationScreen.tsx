/** @jsx jsx */
import { useEffect } from "react";
import { connect } from "react-redux";
import { useParams } from "react-router-dom";
import { Box, Button, Flex, Heading, Image, Link, jsx } from "theme-ui";

import { organizationFetch } from "../actions/organization";
import { joinOrganization, leaveOrganization } from "../actions/organizationJoin";
import { userFetch } from "../actions/user";
import { getJWT } from "../jwt";
import { State } from "../reducers";
import { OrganizationState } from "../reducers/organization";
import { ProjectState } from "../reducers/project";
import { UserState } from "../reducers/user";
import store from "../store";
import SiteHeader from "../components/SiteHeader";
import Icon from "../components/Icon";
import { IOrganization, IUser } from "../../shared/entities";
import { showCopyMapModal } from "../actions/districtDrawing";
import JoinOrganizationModal from "../components/JoinOrganizationModal";
interface StateProps {
  readonly organization: OrganizationState;
  readonly project: ProjectState;
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
  }
} as const;

const OrganizationScreen = ({ organization, project, user }: StateProps) => {
  const { organizationSlug } = useParams();
  const isLoggedIn = getJWT() !== null;
  const userInOrg =
    "resource" in user &&
    user.resource &&
    "resource" in organization &&
    organization.resource &&
    checkIfUserInOrg(organization.resource, user.resource);

  useEffect(() => {
    "resource" in user &&
      user.resource &&
      project.showCopyMapModal &&
      store.dispatch(showCopyMapModal(false));
  }, [user, project.showCopyMapModal]);

  useEffect(() => {
    isLoggedIn && store.dispatch(userFetch());
  }, [isLoggedIn]);

  useEffect(() => {
    store.dispatch(organizationFetch(organizationSlug));
  }, [organizationSlug]);

  function joinOrg() {
    "resource" in user &&
      user.resource &&
      store.dispatch(joinOrganization({ organization: organizationSlug, user: user.resource.id }));
  }

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

  return (
    <Flex sx={{ flexDirection: "column" }}>
      <SiteHeader user={user} />
      <Flex as="main" sx={style.main}>
        {"resource" in organization ? (
          <Flex sx={style.header}>
            {organization.resource.logoUrl && (
              <Image src={organization.resource.logoUrl} sx={style.logo} />
            )}
            <Flex sx={{ flexDirection: "column" }}>
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
                  <Icon name="tools" /> {organization.resource.users.length} builders
                </Box>
              </Box>
              {organization.resource.description && <Box>{organization.resource.description}</Box>}
            </Flex>
            {userInOrg ? (
              <Flex sx={{ flexDirection: "column", flex: "none" }} onClick={leaveOrg}>
                <Button sx={style.join}>Leave organization</Button>
              </Flex>
            ) : "resource" in user && user.resource ? (
              <Flex sx={{ flexDirection: "column", flex: "none" }} onClick={joinOrg}>
                <Button sx={style.join}>Join organization</Button>
                <Box sx={style.joinText}>
                  Join to start making district maps with this organization
                </Box>
              </Flex>
            ) : (
              <Flex sx={{ flexDirection: "column", flex: "none" }} onClick={signupAndJoinOrg}>
                <Button sx={style.join}>Join organization</Button>
                <Box sx={style.joinText}>
                  Register for an account to start making district maps with this organization
                </Box>
              </Flex>
            )}
          </Flex>
        ) : (
          <Box>Loading...</Box>
        )}
      </Flex>
      {"resource" in organization && organization.resource && (
        <JoinOrganizationModal organization={organization.resource} />
      )}
    </Flex>
  );
};

function mapStateToProps(state: State): StateProps {
  return {
    organization: state.organization,
    project: state.project,
    user: state.user
  };
}

export default connect(mapStateToProps)(OrganizationScreen);
