/** @jsx jsx */
import AriaModal from "react-aria-modal";
import { connect } from "react-redux";
import { Box, Button, Flex, Heading, jsx, ThemeUIStyleObject } from "theme-ui";

import Icon from "./Icon";
import { IReferenceLayer } from "../../shared/entities";
import { State } from "../reducers";
import store from "../store";
import { referenceLayerDelete, setDeleteReferenceLayer } from "../actions/projectData";

const style: Record<string, ThemeUIStyleObject> = {
  modal: {
    bg: "muted",
    p: 3,
    width: "small",
    maxWidth: "90vw"
  },
  header: {
    bg: "error",
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

const DeleteReferenceLayerModal = ({
  layer,
  isPending
}: {
  readonly layer?: IReferenceLayer;
  readonly isPending?: boolean;
}) => {
  const hideModal = () => {
    store.dispatch(setDeleteReferenceLayer(undefined));
  };

  return layer !== undefined ? (
    <AriaModal
      titleId="delete-reference-layer-modal-header"
      onExit={hideModal}
      initialFocus="#cancel-delete-reference-layer"
      getApplicationNode={() => document.getElementById("root") as Element}
      underlayStyle={{ paddingTop: "4.5rem" }}
    >
      <Box sx={style.modal}>
        <Box sx={style.header}>
          <Heading
            as="h3"
            sx={{
              marginBottom: "0",
              fontWeight: "medium",
              display: "flex",
              alignItems: "center",
              color: "muted"
            }}
            id="delete-reference-layer-modal-header"
          >
            <span sx={{ fontSize: 4, mr: 2, display: "flex" }}>
              <Icon name="alert-triangle" />
            </span>
            Delete Reference Layer
          </Heading>
        </Box>
        <Box>
          <p>{`Are you sure you want to delete the “${layer.name}” layer? This can’t be undone.`}</p>
        </Box>
        <Flex sx={style.footer}>
          <Button
            id="cancel-delete-reference-layer"
            onClick={hideModal}
            sx={{ variant: "buttons.secondary", mr: 2 }}
          >
            Cancel
          </Button>
          <Button
            sx={{ variant: "buttons.danger" }}
            disabled={isPending}
            onClick={() => {
              store.dispatch(referenceLayerDelete(layer.id));
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
    layer: state.project.deleteReferenceLayer,
    isPending:
      "isPending" in state.project.referenceLayers && state.project.referenceLayers.isPending
  };
}

export default connect(mapStateToProps)(DeleteReferenceLayerModal);
