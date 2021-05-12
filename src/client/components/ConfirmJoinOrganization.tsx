/** @jsx jsx */
import React from "react";
import { connect } from "react-redux";
import { Box, Button, Flex, Heading, jsx, ThemeUIStyleObject } from "theme-ui";

import { CreateProjectData, IOrganization, IUser, IProject } from "../../shared/entities";
import { useHistory } from "react-router-dom";
import { State } from "../reducers";
import store from "../store";
import { Resource } from "../resource";
import { joinOrganization } from "../actions/organizationJoin";
import { showCopyMapModal } from "../actions/districtDrawing";
import { createProject } from "../api";

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
  user,
  projectTemplate,
  onCancel
}: {
  readonly organization: IOrganization;
  readonly user: Resource<IUser>;
  readonly projectTemplate?: CreateProjectData;
  readonly onCancel: () => void;
}) => {
  const history = useHistory();

  function joinOrg() {
    "resource" in user &&
      user.resource &&
      store.dispatch(
        joinOrganization({ organization: organization.slug, user: user.resource.id })
      ) &&
      store.dispatch(showCopyMapModal(false));

    projectTemplate && createProjectFromTemplate();
  }

  function closeModal() {
    onCancel();
    store.dispatch(showCopyMapModal(false));
  }

  function createProjectFromTemplate() {
    projectTemplate &&
      void createProject(projectTemplate).then((project: IProject) =>
        history.push(`/projects/${project.id}`)
      );
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
          Joining an organization allows you to participate their public mapping activities. 
          You can create maps from their templates and have your maps featured on the 
          organization&#39;s page.
        </Box>
        <Box>
          This organization will be able to see some of your information when you join:
          <ul>
            <li>View your name and email address</li>
            <li>View any non-private maps you create using their templates</li>
          </ul>
          You still have control over your maps. You can mark any of your maps 
          &#34;Private&#34; and they will only be visible to you.
        </Box>
        <Flex sx={style.footer}>
          <Button id="primary-action" sx={{ marginBottom: 3 }} onClick={joinOrg}>
            Join now
          </Button>
          <Button
            id="cancel-copy-map-modal"
            onClick={closeModal}
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
