/** @jsx jsx */
import { useState } from "react";
import AriaModal from "react-aria-modal";
import { connect } from "react-redux";
import { Box, Button, Flex, Heading, jsx, ThemeUIStyleObject } from "theme-ui";

import { GeoLevelInfo, ProjectId } from "../../../shared/entities";
import { setGeoLevelIndex, showAdvancedEditingModal } from "../../actions/districtDrawing";
import { projectFetch } from "../../actions/projectData";
import { patchProject } from "../../api";
import { State } from "../../reducers";
import store from "../../store";

const style: ThemeUIStyleObject = {
  modal: {
    backgroundColor: "muted",
    p: 3,
    width: "medium",
    maxWidth: "90vw"
  },
  footer: {
    flex: "auto",
    textAlign: "right",
    fontVariant: "tabular-nums",
    py: 0,
    fontSize: 1
  }
};

const AdvancedEditingModal = ({
  id,
  geoLevels,
  showModal
}: {
  readonly id: ProjectId;
  readonly geoLevels: readonly GeoLevelInfo[];
  readonly showModal: boolean;
}) => {
  const [isPending, setIsPending] = useState(false);
  const geoLevel = geoLevels[0].id;
  const geoLevelTitle = geoLevel[0].toUpperCase() + geoLevel.slice(1);
  const hideModal = () => store.dispatch(showAdvancedEditingModal(false));

  return showModal ? (
    <AriaModal
      titleId="advanced-editing-header"
      onExit={hideModal}
      initialFocus="#cancel-advanced-editing"
      getApplicationNode={() => document.getElementById("root") as Element}
      underlayStyle={{ paddingTop: "4.5rem" }}
    >
      <Box sx={style.modal}>
        <Heading as="h3" id="advanced-editing-header">{`${geoLevelTitle} Editing`}</Heading>
        <Box>
          <p>
            {geoLevelTitle} editing is our advanced editing mode, which enables the most accurate
            redistricting possible. It can be used to create redistricting planes with 0 deviation
            and is most useful as a way to change fine level details after you’ve built a
            redistricting plan that is nearly complete.
          </p>
          <b>Limitations of {geoLevel} level editing:</b>
          <ul>
            <li>
              You are limited in how far you can zoom out your map while still seeing your changes
            </li>
            <li>
              You will need to resolve any changes to your map (“Reject” or “Accept changes”) before
              you leave {geoLevel} editing.
            </li>
          </ul>
        </Box>
        <Flex sx={style.footer}>
          <Button
            id="cancel-advanced-editing"
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
                  store.dispatch(setGeoLevelIndex(geoLevels.length - 1));
                  store.dispatch(projectFetch(id));
                  hideModal();
                })
                .finally(() => setIsPending(false));
            }}
          >
            Start {geoLevel} editing
          </Button>
        </Flex>
      </Box>
    </AriaModal>
  ) : null;
};

function mapStateToProps(state: State) {
  return {
    showModal: state.project.showAdvancedEditingModal
  };
}

export default connect(mapStateToProps)(AdvancedEditingModal);
