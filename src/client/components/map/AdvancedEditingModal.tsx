/** @jsx jsx */
import { useState } from "react";
import AriaModal from "react-aria-modal";
import { connect } from "react-redux";
import { Box, Button, Flex, Heading, jsx } from "theme-ui";

import Icon from "../Icon";
import { GeoLevelInfo, ProjectId } from "../../../shared/entities";
import { setGeoLevelIndex } from "../../actions/districtDrawing";
import { showAdvancedEditingModal } from "../../actions/projectModals";
import { projectFetch } from "../../actions/projectData";
import { patchProject } from "../../api";
import { State } from "../../reducers";
import store from "../../store";

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
      <Box sx={{ variant: "styles.confirmationModal.modal" }}>
        <Box sx={{ variant: "styles.confirmationModal.warningHeader" }}>
          <Heading
            as="h3"
            sx={{ marginBottom: "0", fontWeight: "medium", display: "flex", alignItems: "center" }}
            id="advanced-editing-header"
          >
            <span sx={{ fontSize: 4, mr: 2, display: "flex" }}>
              <Icon name="alert-triangle" />
            </span>
            {`${geoLevelTitle} Editing (for advanced builders)`}
          </Heading>
        </Box>
        <Box>
          <p>
            {geoLevelTitle} Editing is our most advanced editing mode, which enables the most
            accurate redistricting possible. It is used to fine-tune your districts when your map is
            nearly complete (e.g. to achieve zero population deviation). {geoLevelTitle} Editing is
            only recommended for experienced users who are comfortable navigating around the map and
            drawing controls.
          </p>
          <Heading sx={{ fontWeight: "medium", mt: 5, mb: 3 }} as="h4">
            Limitations of {geoLevelTitle} Editing
          </Heading>
          <ul>
            <li>
              {geoLevelTitle}s are only visible when you zoom in. If you zoom out too far, the{" "}
              {geoLevel}s will be hidden (but don&lsquo;t worry, they&lsquo;ll still be there for
              you when you zoom back in!)
            </li>
            <li>
              Once you select one or more {geoLevel}s, you will need to resolve pending changes
              (click Accept or Cancel before you can leave {geoLevelTitle} Editing.
            </li>
          </ul>
        </Box>
        <Flex sx={{ variant: "styles.confirmationModal.footer" }}>
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
                  store.dispatch(
                    setGeoLevelIndex({
                      index: geoLevels.length - 1,
                      isReadOnly: false,
                      skipModal: true
                    })
                  );
                  store.dispatch(projectFetch(id));
                  hideModal();
                })
                .finally(() => setIsPending(false));
              return;
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
    showModal: state.projectModals.showAdvancedEditingModal
  };
}

export default connect(mapStateToProps)(AdvancedEditingModal);
