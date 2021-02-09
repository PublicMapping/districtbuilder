/** @jsx jsx */
import { useEffect } from "react";
import { connect } from "react-redux";
import { useParams } from "react-router-dom";
import { Box, Button, Flex, Heading, Image, Link, jsx } from "theme-ui";

import { organizationFetch } from "../actions/organization";
import { userFetch } from "../actions/user";
import { getJWT } from "../jwt";
import { State } from "../reducers";
import { OrganizationState } from "../reducers/organization";
import { UserState } from "../reducers/user";
import store from "../store";
import SiteHeader from "../components/SiteHeader";
import Icon from "../components/Icon";

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
  }
} as const;

const OrganizationScreen = ({ organization, user }: StateProps) => {
  const { organizationSlug } = useParams();
  const isLoggedIn = getJWT() !== null;

  useEffect(() => {
    isLoggedIn && store.dispatch(userFetch());
  }, [isLoggedIn]);

  useEffect(() => {
    store.dispatch(organizationFetch(organizationSlug));
  }, [organizationSlug]);

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
                {/* TODO #226: Show actual number of followers/members */}
                <Box as="span" sx={style.item}>
                  <Icon name="tools" /> 0 builders
                </Box>
              </Box>
              {organization.resource.description && <Box>{organization.resource.description}</Box>}
            </Flex>
            <Flex sx={{ flexDirection: "column", flex: "none" }}>
              <Button disabled={true} sx={style.join}>
                Join organization
              </Button>
              <Box sx={style.joinText}>
                Join to start making district maps with this organization
              </Box>
            </Flex>
          </Flex>
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

export default connect(mapStateToProps)(OrganizationScreen);
