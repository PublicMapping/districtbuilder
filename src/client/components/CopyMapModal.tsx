/** @jsx jsx */
import { useState } from "react";
import AriaModal from "react-aria-modal";
import { connect } from "react-redux";
import { Redirect } from "react-router-dom";
import { Box, Button, Flex, Heading, jsx, ThemeUIStyleObject } from "theme-ui";

import { IProject } from "../../shared/entities";
import { showCopyMapModal } from "../actions/districtDrawing";
import { resetProjectState } from "../actions/root";
import { createProject } from "../api";
import { showActionFailedToast } from "../functions";
import { State } from "../reducers";
import store from "../store";
import { Resource } from "../resource";

const style: ThemeUIStyleObject = {
  footer: {
    display: "block",
    fontSize: 1
  },
  footerButton: {
    width: "100%"
  },
  header: {
    padding: "16px 12px",
    margin: "-12px -12px 24px"
  },
  modal: {
    bg: "muted",
    p: 3,
    width: "small",
    maxWidth: "90vw"
  }
};

const CopyMapModal = ({
  project,
  showModal
}: {
  readonly project: IProject;
  readonly showModal: boolean;
}) => {
  const hideModal = () => store.dispatch(showCopyMapModal(false));

  const [createProjectResource, setCreateProjectResource] = useState<Resource<IProject>>();

  const attributedName = `Copy of ${project.name} by ${project.user.name}`;

  return createProjectResource && "resource" in createProjectResource ? (
    <Redirect to={`/projects/${createProjectResource.resource.id}`} />
  ) : showModal ? (
    <AriaModal
      titleId="copy-map-modal-header"
      onExit={hideModal}
      initialFocus="#cancel-copy-map-modal"
      getApplicationNode={() => document.getElementById("root") as Element}
      underlayStyle={{ paddingTop: "4.5rem" }}
    >
      <Box sx={style.modal}>
        <Box sx={style.header}>
          <Heading
            as="h3"
            sx={{ marginBottom: "0", fontWeight: "medium", display: "flex", alignItems: "center" }}
            id="copy-map-modal-header"
          >
            Copy this map?
          </Heading>
        </Box>

        <Flex
          as="form"
          sx={{ flexDirection: "column" }}
          onSubmit={(e: React.FormEvent) => {
            e.preventDefault();
            createProject({ ...project, name: attributedName })
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
            This will create a copy of <strong>{attributedName}</strong> in your account. You will
            be able to make changes to the copied version.
          </Box>
          <Flex sx={style.footer}>
            <Box>
              <Button sx={style.footerButton} type="submit">
                Yes, copy to my account
              </Button>
            </Box>
            <Box>
              <Button
                id="cancel-copy-map-modal"
                onClick={hideModal}
                sx={{ ...style.footerButton, variant: "buttons.secondary" }}
              >
                Cancel
              </Button>
            </Box>
          </Flex>
        </Flex>
      </Box>
    </AriaModal>
  ) : null;
};

function mapStateToProps(state: State) {
  return {
    showModal: state.project.showCopyMapModal
  };
}

export default connect(mapStateToProps)(CopyMapModal);
