/** @jsx jsx */
import AriaModal from "react-aria-modal";
import { connect } from "react-redux";
import { Box, Button, Flex, Heading, jsx } from "theme-ui";

import Icon from "./Icon";
import { IProject } from "@districtbuilder/shared/entities";
import { projectArchive, setDeleteProject } from "../actions/projects";
import { State } from "../reducers";
import store from "../store";

const DeleteProjectModal = ({
  project,
  isPending
}: {
  readonly project?: IProject;
  readonly isPending?: boolean;
}) => {
  const hideModal = () => store.dispatch(setDeleteProject(undefined));

  return project !== undefined ? (
    <AriaModal
      titleId="delete-project-modal-header"
      onExit={hideModal}
      initialFocus="#cancel-delete-project"
      getApplicationNode={() => document.getElementById("root") as Element}
      underlayStyle={{ paddingTop: "4.5rem" }}
    >
      <Box sx={{ variant: "styles.confirmationModal.modal" }}>
        <Box sx={{ variant: "styles.confirmationModal.errorHeader" }}>
          <Heading
            as="h3"
            sx={{
              marginBottom: "0",
              fontWeight: "medium",
              display: "flex",
              alignItems: "center",
              color: "muted"
            }}
            id="delete-project-modal-header"
          >
            <span sx={{ fontSize: 4, mr: 2, display: "flex" }}>
              <Icon name="alert-triangle" />
            </span>
            Delete Map
          </Heading>
        </Box>
        <Box>
          <p>{`Are you sure you want to delete “${project.name}”? This can’t be undone.`}</p>
        </Box>
        <Flex sx={{ variant: "styles.confirmationModal.footer" }}>
          <Button
            id="cancel-delete-project"
            onClick={hideModal}
            sx={{ variant: "buttons.secondary", mr: 2 }}
          >
            Cancel
          </Button>
          <Button
            sx={{ variant: "buttons.danger" }}
            disabled={isPending}
            onClick={() => {
              store.dispatch(projectArchive(project.id));
              return;
            }}
          >
            Delete
          </Button>
        </Flex>
      </Box>
    </AriaModal>
  ) : null;
};

function mapStateToProps(state: State) {
  return {
    project: state.projects.deleteProject,
    isPending: state.projects.archiveProjectPending
  };
}

export default connect(mapStateToProps)(DeleteProjectModal);
