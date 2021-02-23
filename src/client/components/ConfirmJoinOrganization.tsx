/** @jsx jsx */
import React from "react";
import { connect } from "react-redux";
import { Box, Button, Flex, Heading, jsx, ThemeUIStyleObject } from "theme-ui";

import { IOrganization, IUser } from "../../shared/entities";
import { State } from "../reducers";
import store from "../store";
import { Resource } from "../resource";
import { joinOrganization } from "../actions/organizationJoin";
import { showCopyMapModal } from "../actions/districtDrawing";

const style: ThemeUIStyleObject = {
  footer: {
    display: "flex",
    flexDirection: "column",
    marginTop: 5
  },
  header: {
    mb: 5
  },
  heading: {
    fontFamily: "heading",
    fontWeight: "light",
    fontSize: 4
  },
  modal: {
    bg: "muted",
    p: 5,
    width: "small",
    maxWidth: "90vw",
    overflow: "hidden"
  }
};

const ConfirmJoinOrganization = ({
  organization,
  user
}: {
  readonly organization: IOrganization;
  readonly user: Resource<IUser>;
}) => {
  const hideModal = () => store.dispatch(showCopyMapModal(false));

  function joinOrg() {
    "resource" in user &&
      user.resource &&
      store.dispatch(
        joinOrganization({ organization: organization.slug, user: user.resource.id })
      ) &&
      store.dispatch(showCopyMapModal(false));
  }

  return (
    <React.Fragment>
      <Box sx={style.header}>
        <Heading as="h1" sx={style.heading} id="copy-map-modal-header">
          Join {organization.name}
        </Heading>
      </Box>
      <Flex sx={{ flexDirection: "column" }}>
        <Box>
          Joining an organization allows you to create maps using their templates, participate in
          contents and...
        </Box>
        <Box>
          This organization will be able to see some information about you when you build out a map
          using one of their templates
          <ul>
            <li>View your name and email address</li>
            <li>View any maps you create using their templates</li>
          </ul>
        </Box>
        <Flex sx={style.footer}>
          <Button id="primary-action" sx={{ marginBottom: 3 }} onClick={joinOrg}>
            Join now
          </Button>
          <Button
            id="cancel-copy-map-modal"
            onClick={hideModal}
            sx={{ variant: "buttons.linkStyle", margin: "0 auto" }}
          >
            Go back
          </Button>
        </Flex>
      </Flex>
    </React.Fragment>
  );
};

function mapStateToProps(state: State) {
  return {
    showModal: state.project.showCopyMapModal,
    user: state.user
  };
}

export default connect(mapStateToProps)(ConfirmJoinOrganization);
