/** @jsx jsx */
import React from "react";
import AriaModal from "react-aria-modal";
import { Box, Button, Flex, Heading, jsx, ThemeUIStyleObject } from "theme-ui";
import { connect } from "react-redux";

import { toggleKeyboardShortcutsModal } from "../../actions/districtDrawing";
import { State } from "../../reducers";
import store from "../../store";
import { KEYBOARD_SHORTCUTS } from "./keyboardShortcuts";

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
    overflow: "visible"
  },
  table: {
    width: "100%"
  },
  keyRow: {
    height: 6,
    mb: 2
  },
  keyItem: {
    ml: "0",
    mr: "0",
    textAlign: "left",
    height: "30px",
    display: "flex"
  },
  keyCode: {
    bg: "gray.1",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "gray.2",
    borderRadius: "3px",
    fontSize: "1",
    fontFamily: "Menlo, Consolas, Monaco, Liberation Mono, Lucida Console, monospace",
    padding: "2px 4px"
  },
  keyCombo: {
    width: "140px"
  }
};

const KeyboardShortcutsModal = ({
  showModal,
  isReadOnly,
  evaluateMode
}: {
  readonly showModal: boolean;
  readonly isReadOnly: boolean;
  readonly evaluateMode: boolean;
}) => {
  const hideModal = () => void store.dispatch(toggleKeyboardShortcutsModal());
  const os = navigator.appVersion.indexOf("Mac") !== -1 ? "Mac" : "pc";
  const meta = os === "Mac" ? "⌘" : "CTRL";

  return showModal ? (
    <AriaModal
      titleId="keyboard-shortcuts-header"
      onExit={hideModal}
      initialFocus="#cancel-keyboard-shortcut-modal"
      getApplicationNode={() => document.getElementById("root") as Element}
      underlayStyle={{ paddingTop: "4.5rem" }}
    >
      <Box sx={style.modal}>
        <React.Fragment>
          <Box sx={style.header}>
            <Heading as="h1" sx={style.heading} id="keyboard-shortcuts-header">
              Keyboard Shortcuts
            </Heading>
          </Box>
          <Flex sx={{ flexDirection: "column" }}>
            <Box>
              <table sx={style.table}>
                <tbody>
                  {KEYBOARD_SHORTCUTS.filter(
                    shortcut =>
                      (!isReadOnly || shortcut.allowReadOnly) &&
                      (!evaluateMode || shortcut.allowInEvaluateMode)
                  ).map((shortcut, index) => {
                    const key = (
                      <span sx={style.keyCombo}>
                        <span sx={style.keyCode}>
                          {shortcut.label || shortcut.key.toUpperCase()}
                        </span>
                      </span>
                    );
                    return (
                      <tr sx={style.keyRow} key={index}>
                        <td>
                          <Box sx={style.keyItem}>
                            {shortcut.meta ? (
                              shortcut.shift ? (
                                <span sx={style.keyCombo}>
                                  <span sx={style.keyCode}>{meta}</span>+
                                  <span sx={style.keyCode}>SHIFT</span>+{key}
                                </span>
                              ) : (
                                <span sx={style.keyCombo}>
                                  <span sx={style.keyCode}>{meta}</span>+{key}
                                </span>
                              )
                            ) : (
                              key
                            )}
                            <span sx={style.keyFunction}>{shortcut.text}</span>
                          </Box>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Box>
            <Flex sx={style.footer}>
              <Button
                id="cancel-keyboard-shortcut-modal"
                onClick={hideModal}
                sx={{ variant: "buttons.linkStyle", margin: "0 auto" }}
              >
                Close
              </Button>
            </Flex>
          </Flex>
        </React.Fragment>
      </Box>
    </AriaModal>
  ) : null;
};

function mapStateToProps(state: State) {
  return {
    showModal: state.project.showKeyboardShortcutsModal
  };
}

export default connect(mapStateToProps)(KeyboardShortcutsModal);
