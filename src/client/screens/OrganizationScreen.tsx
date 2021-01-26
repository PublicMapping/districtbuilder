/** @jsx jsx */
import { useEffect } from "react";
import { connect } from "react-redux";
import { useParams } from "react-router-dom";
import { Box, Flex, jsx } from "theme-ui";

import { organizationFetch } from "../actions/organization";
import { userFetch } from "../actions/user";
import { getJWT } from "../jwt";
import { State } from "../reducers";
import { OrganizationState } from "../reducers/organization";
import { UserState } from "../reducers/user";
import store from "../store";
import SiteHeader from "../components/SiteHeader";

interface StateProps {
  readonly organization: OrganizationState;
  readonly user: UserState;
}

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
      <Flex
        as="main"
        sx={{ width: "100%", maxWidth: "large", my: 6, mx: "auto", flexDirection: "column", px: 4 }}
      >
        {"resource" in organization ? (
          <Box>Organization: {organization.resource.name}</Box>
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
