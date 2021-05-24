/** @jsx jsx */
import React from "react";
import AriaModal from "react-aria-modal";
import { Box, Button, Flex, Heading, jsx, ThemeUIStyleObject } from "theme-ui";
import { connect } from "react-redux";

import { showKeyboardShortcutsModal } from "../../actions/districtDrawing";
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
    width: "90%"
  },
  keyRow: {
    height: 6,
    mb: 2
  },
  keyItem: {
    ml: "5%",
    mr: "5%",
    textAlign: "left",
    height: "30px"
  },
  keyCode: {
    border: "1px solid",
    padding: "5px"
  },
  keyFunction: {
    float: "right"
  }
};

const KeyboardShortcutsModal = ({
  showModal,
  isReadOnly
}: {
  readonly showModal: boolean;
  readonly isReadOnly: boolean;
}) => {
  const hideModal = () => void store.dispatch(showKeyboardShortcutsModal(false));
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
                  {KEYBOARD_SHORTCUTS.filter(shortcut => !isReadOnly || shortcut.allowReadOnly).map(
                    (shortcut, index) => {
                      const key = (
                        <span sx={style.keyCode}>
                          {shortcut.label || shortcut.key.toUpperCase()}
                        </span>
                      );
                      return (
                        <tr sx={style.keyRow} key={index}>
                          <td>
                            <Box sx={style.keyItem}>
                              {shortcut.meta ? (
                                shortcut.shift ? (
                                  <span>
                                    <span sx={style.keyCode}>{meta}</span>+
                                    <span sx={style.keyCode}>SHIFT</span>+{key}
                                  </span>
                                ) : (
                                  <span>
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
                    }
                  )}
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
