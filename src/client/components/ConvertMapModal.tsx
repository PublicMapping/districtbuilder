/** @jsx jsx */
import React, { useState } from "react";
import AriaModal from "react-aria-modal";
import { connect } from "react-redux";
import { useHistory } from "react-router-dom";
import { Box, Button, Flex, Heading, jsx, ThemeUIStyleObject, Spinner } from "theme-ui";

import { isUserLoggedIn } from "../jwt";
import { IProject, IUser } from "../../shared/entities";
import { showConvertMapModal } from "../actions/projectModals";
import { resetProjectState } from "../actions/root";
import { convertAndCopyProject } from "../api";
import { showActionFailedToast } from "../functions";
import { State } from "../reducers";
import store from "../store";
import { AuthModalContent } from "./AuthComponents";
import { Resource } from "../resource";

const style: Record<string, ThemeUIStyleObject> = {
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
    overflow: "visible"
  }
};

const ConvertMapModal = ({
  project,
  user,
  showModal
}: {
  readonly project: IProject;
  readonly user: Resource<IUser>;
  readonly showModal: boolean;
}) => {
  const [saving, setSaving] = useState(false);
  const history = useHistory();

  const hideModal = () => store.dispatch(showConvertMapModal(false));
  const attributedName = `${project.name} by ${project.user.name}`;
  const isLoggedIn = "resource" in user && isUserLoggedIn();

  function goToProject(project: IProject) {
    history.push(`/projects/${project.id}`);
  }

  return showModal ? (
    <AriaModal
      titleId="convert-map-modal-header"
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
              <Heading as="h1" sx={style.heading} id="convert-map-modal-header">
                Copy this map to use 2020 Census data?
              </Heading>
            </Box>
            <Flex
              as="form"
              sx={{ flexDirection: "column" }}
              onSubmit={(e: React.FormEvent) => {
                e.preventDefault();
                setSaving(true);
                convertAndCopyProject(project.id)
                  .then((newProject: IProject) => {
                    // Need to reset the project state here, so when the redirect kicks in we don't have any
                    // old state hanging around (undo history, etc.)
                    store.dispatch(resetProjectState());
                    goToProject(newProject);
                  })
                  .finally(() => setSaving(false))
                  .catch(showActionFailedToast);
              }}
            >
              <Box>
                This will create a copy of <strong>{attributedName}</strong> in your account,
                converted to use 2020 Census data. You will be able to make changes to the copied
                version.
              </Box>
              <Flex sx={style.footer}>
                {saving ? (
                  <React.Fragment>
                    <Spinner variant="styles.spinner.large" sx={{ alignSelf: "center", mb: 4 }} />
                    <Button
                      id="primary-action"
                      sx={{ marginBottom: 3 }}
                      type="submit"
                      disabled={true}
                    >
                      Converting
                    </Button>
                  </React.Fragment>
                ) : (
                  <Button id="primary-action" sx={{ marginBottom: 3 }} type="submit">
                    Yes, copy to my account
                  </Button>
                )}
                <Button
                  id="cancel-convert-map-modal"
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
    showModal: state.projectModals.showConvertMapModal,
    user: state.user
  };
}

export default connect(mapStateToProps)(ConvertMapModal);
