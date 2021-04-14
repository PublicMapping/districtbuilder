/** @jsx jsx */
import React, { useState } from "react";
import AriaModal from "react-aria-modal";
import { connect } from "react-redux";
import { Redirect } from "react-router-dom";
import { Box, Button, Flex, Heading, jsx, ThemeUIStyleObject } from "theme-ui";

import { IProject, IUser } from "../../shared/entities";
import { showCopyMapModal } from "../actions/districtDrawing";
import { resetProjectState } from "../actions/root";
import { createProject } from "../api";
import { showActionFailedToast } from "../functions";
import { State } from "../reducers";
import store from "../store";
import { AuthModalContent } from "./AuthComponents";
import { Resource } from "../resource";

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

const CopyMapModal = ({
  project,
  user,
  showModal
}: {
  readonly project: IProject;
  readonly user: Resource<IUser>;
  readonly showModal: boolean;
}) => {
  const hideModal = () => store.dispatch(showCopyMapModal(false));
  const [createProjectResource, setCreateProjectResource] = useState<Resource<IProject>>();
  const attributedName = `${project.name} by ${project.user.name}`;
  const isLoggedIn = "resource" in user;

  return createProjectResource && "resource" in createProjectResource ? (
    <Redirect to={`/projects/${createProjectResource.resource.id}`} />
  ) : showModal ? (
    <AriaModal
      titleId="copy-map-modal-header"
      onExit={hideModal}
      initialFocus="#primary-action"
      getApplicationNode={() => document.getElementById("root") as Element}
      underlayStyle={{ paddingTop: "4.5rem" }}
    >
      <Box sx={style.modal}>
        {!isLoggedIn ? (
          <AuthModalContent project={project} />
        ) : (
          <React.Fragment>
            <Box sx={style.header}>
              <Heading as="h1" sx={style.heading} id="copy-map-modal-header">
                Copy this map?
              </Heading>
            </Box>
            <Flex
              as="form"
              sx={{ flexDirection: "column" }}
              onSubmit={(e: React.FormEvent) => {
                e.preventDefault();
                createProject({
                  ...project,
                  name: `Copy of ${attributedName}`,
                  chamber: project.chamber || undefined
                })
                  .then((project: IProject) => {
                    setCreateProjectResource({ resource: project });

                    // Need to reset the project state here, so when the redirect kicks in we don't have any
                    // old state hanging around (undo history, etc.)
                    store.dispatch(resetProjectState());
                  })
                  .catch(showActionFailedToast);
              }}
            >
              <Box>
                This will create a copy of <strong>{attributedName}</strong> in your account. You
                will be able to make changes to the copied version.
              </Box>
              <Flex sx={style.footer}>
                <Button id="primary-action" sx={{ marginBottom: 3 }} type="submit">
                  Yes, copy to my account
                </Button>
                <Button
                  id="cancel-copy-map-modal"
                  onClick={hideModal}
                  sx={{ variant: "buttons.linkStyle", margin: "0 auto" }}
                >
                  Cancel
                </Button>
              </Flex>
            </Flex>
          </React.Fragment>
        )}
      </Box>
    </AriaModal>
  ) : null;
};

function mapStateToProps(state: State) {
  return {
    showModal: state.project.showCopyMapModal,
    user: state.user
  };
}

export default connect(mapStateToProps)(CopyMapModal);
