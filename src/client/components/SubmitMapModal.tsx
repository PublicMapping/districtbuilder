/** @jsx jsx */
import AriaModal from "react-aria-modal";
import { connect } from "react-redux";
import { Box, Button, Flex, Heading, jsx, ThemeUIStyleObject } from "theme-ui";

import { IProject } from "../../shared/entities";
import { showSubmitMapModal } from "../actions/projectModals";
import { State } from "../reducers";
import store from "../store";

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

const SubmitMapModal = ({
  project,
  showModal
}: {
  readonly project: IProject;
  readonly showModal: boolean;
}) => {
  const hideModal = () => store.dispatch(showSubmitMapModal(false));

  return showModal ? (
    <AriaModal
      titleId="submit-map-modal-header"
      onExit={hideModal}
      initialFocus="#cancel-submit-map-modal"
      getApplicationNode={() => document.getElementById("root") as Element}
      underlayStyle={{ paddingTop: "4.5rem" }}
    >
      <Box sx={style.modal}>
        <Box sx={style.header}>
          <Heading as="h1" sx={style.heading} id="submit-map-modal-header">
            Next steps
          </Heading>
        </Box>
        <Flex as="form" sx={{ flexDirection: "column" }}>
          <Box
            dangerouslySetInnerHTML={{
              __html:
                project?.projectTemplate?.contestNextSteps || "Thank you for submitting your form."
            }}
          ></Box>
          <Flex sx={style.footer}>
            <Button
              id="cancel-submit-map-modal"
              onClick={hideModal}
              sx={{ variant: "buttons.primary", m: 0, mr: "auto" }}
            >
              Done
            </Button>
          </Flex>
        </Flex>
      </Box>
    </AriaModal>
  ) : null;
};

function mapStateToProps(state: State) {
  return {
    showModal: state.projectModals.showSubmitMapModal,
    user: state.user
  };
}

export default connect(mapStateToProps)(SubmitMapModal);
