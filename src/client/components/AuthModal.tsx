/** @jsx jsx */
import { useState } from "react";
import AriaModal from "react-aria-modal";
import { connect } from "react-redux";
import { Box, Button, Flex, Heading, jsx, ThemeUIStyleObject } from "theme-ui";

import { ProjectId } from "../../shared/entities";
import { showAuthModal } from "../actions/districtDrawing";
import { patchProject } from "../api";
import { State } from "../reducers";
import store from "../store";

const style: ThemeUIStyleObject = {
  modal: {
    bg: "muted",
    p: 3,
    width: "small",
    maxWidth: "90vw"
  },
  header: {
    bg: "primary",
    padding: "16px 12px",
    margin: "-12px -12px 24px"
  },
  footer: {
    flex: "auto",
    textAlign: "right",
    fontVariant: "tabular-nums",
    py: 2,
    mt: 2,
    fontSize: 1
  }
};

const AuthModal = ({ id, showModal }: { readonly id: ProjectId; readonly showModal: boolean }) => {
  const [isPending, setIsPending] = useState(false);
  const hideModal = () => store.dispatch(showAuthModal(false));

  return showModal ? (
    <AriaModal
      titleId="auth-modal-header"
      onExit={hideModal}
      initialFocus="#cancel-auth-modal"
      getApplicationNode={() => document.getElementById("root") as Element}
      underlayStyle={{ paddingTop: "4.5rem" }}
    >
      <Box sx={style.modal}>
        <Box sx={style.header}>
          <Heading
            as="h3"
            sx={{ marginBottom: "0", fontWeight: "medium", display: "flex", alignItems: "center" }}
            id="auth-modal-header"
          >
            Log In or Register
          </Heading>
        </Box>
        <Box>
          <p>TODO description</p>
        </Box>
        <Flex sx={style.footer}>
          <Button
            id="cancel-auth-modal"
            onClick={hideModal}
            sx={{ variant: "buttons.secondary", mr: 2 }}
          >
            Cancel
          </Button>
          <Button
            disabled={isPending}
            onClick={() => {
              setIsPending(true);
              patchProject(id, { advancedEditingEnabled: true })
                .then(() => {
                  // TODO: dispatch things
                  hideModal();
                })
                .finally(() => setIsPending(false));
              return;
            }}
          >
            OK
          </Button>
        </Flex>
      </Box>
    </AriaModal>
  ) : null;
};

function mapStateToProps(state: State) {
  return {
    showModal: state.project.showAuthModal
  };
}

export default connect(mapStateToProps)(AuthModal);
