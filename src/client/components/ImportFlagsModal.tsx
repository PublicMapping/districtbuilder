/** @jsx jsx */
import AriaModal from "react-aria-modal";
import { connect } from "react-redux";

import { Box, Heading, jsx, ThemeUIStyleObject, Button } from "theme-ui";

import { setImportFlagsModal } from "../actions/projectModals";
import { State } from "../reducers";
import store from "../store";
import { ImportRowFlag } from "../../shared/entities";
import { MAX_IMPORT_ERRORS } from "../../shared/constants";

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
    fontSize: 4,
    bg: "warning"
  },
  modal: {
    bg: "muted",
    p: 5,
    width: "small",
    maxWidth: "90vw",
    overflow: "hidden"
  },
  fieldValue: {
    color: "black",
    fontWeight: 500
  },
  buttonRow: {
    display: "inline-block",
    mt: "3"
  },
  button: {
    mr: "3"
  },
  flags: { marginTop: 4, maxHeight: "60vh", overflowY: "scroll" }
};

const ImportFlagsModal = ({
  importFlags,
  numFlags,
  showModal,
  onContinue,
  onCancel
}: {
  readonly importFlags: readonly ImportRowFlag[];
  readonly numFlags: number;
  readonly showModal: boolean;
  readonly onContinue: () => void;
  readonly onCancel: () => void;
}) => {
  const hideModal = () => {
    store.dispatch(setImportFlagsModal(false));
  };

  return showModal ? (
    <AriaModal
      titleId="import-flags-modal-header"
      onExit={hideModal}
      initialFocus="#flags-cancel"
      getApplicationNode={() => document.getElementById("root") as Element}
      underlayStyle={{ paddingTop: "4.5rem" }}
    >
      <Box sx={style.modal}>
        <Heading sx={style.heading}>
          There are {numFlags > importFlags.length ? `${MAX_IMPORT_ERRORS}+` : numFlags} rows with
          flags in your import{" "}
        </Heading>
        <Box>
          We were able to read your block equivalency file, but we ran into a few issues. Please
          review the flags below and decide if you want to continue with this file or start over
          with a new file.
        </Box>
        {numFlags > importFlags.length && (
          <Box sx={{ pt: 2 }}>
            Displaying the first <b>{importFlags.length}</b> of <b>{numFlags}</b> errors
          </Box>
        )}
        <Box sx={style.flags}>
          {importFlags.map(flag => (
            <Box key={flag.rowNumber}>
              <Box>
                <span style={{ marginRight: "10px" }}>Row {flag.rowNumber + 1}</span>
                <span>{flag.errorText}</span>
              </Box>
              <Box>
                <span sx={style.fieldValue}>
                  {flag.field === "BLOCKID" ? flag.rowValue[0] : flag.rowValue[1]}
                </span>
              </Box>
            </Box>
          ))}
        </Box>
        <Box sx={style.buttonRow}>
          <Button sx={style.button} onClick={() => onContinue()} id="flags-cancel">
            Continue with this file
          </Button>
          <Button sx={style.button} onClick={() => onCancel()}>
            Start over with a new file
          </Button>
        </Box>
      </Box>
    </AriaModal>
  ) : null;
};

function mapStateToProps(state: State) {
  return {
    showModal: state.projectModals.showImportFlagsModal
  };
}

export default connect(mapStateToProps)(ImportFlagsModal);
