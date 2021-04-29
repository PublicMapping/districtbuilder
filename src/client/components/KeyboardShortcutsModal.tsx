/** @jsx jsx */
import React from "react";
import AriaModal from "react-aria-modal";
import { Box, Button, Flex, Heading, jsx, ThemeUIStyleObject } from "theme-ui";
import { connect } from "react-redux";

import { showKeyboardShortcutsModal } from "../actions/districtDrawing";
import { State } from "../reducers";
import store from "../store";

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

interface KeybordShortcut {
  readonly key: string;
  readonly text: string;
  readonly mod?: string;
  readonly mod2?: string;
}

type KeyboardShortcutMap = { readonly [shortcut: string]: KeybordShortcut };

const KEYBOARD_SHORTCUTS: KeyboardShortcutMap = {
  PREVIOUS_DISTRICT: {
    key: "e",
    text: "Previous district"
  },
  NEXT_DISTRICT: {
    key: "D",
    text: "Next district"
  },
  ZOOM_OUT_GEOLEVELS: {
    key: "s",
    text: "Use bigger geolevels"
  },
  ZOOM_IN_GEOLEVELS: {
    key: "f",
    text: "Use smaller geolevels"
  },
  PREVIOUS_SELECTION_TOOL: {
    key: "w",
    text: "Use previous selection tool"
  },
  NEXT_SELECTION_TOOL: {
    key: "r",
    text: "Use next selection tool"
  },
  ACCEPT_CHANGES: {
    key: "g",
    text: "Accept changes"
  },
  REJECT_CHANGES: {
    key: "a",
    text: "Reject changes"
  },
  TOGGLE_POPULATION_LABELS: {
    key: "1",
    text: "Toggle population labels"
  },
  TOGGLE_LOCK_ON_SELECTED_DISTRICT: {
    key: "q",
    text: "Toggle lock on selected district"
  },
  TOGGLE_EVALUATE_MODE: {
    key: "t",
    text: "Toggle evaluate mode"
  },
  UNDO: {
    key: "z",
    text: "Undo",
    mod: "⌘"
  },
  REDO: {
    key: "z",
    text: "Redo",
    mod: "⌘",
    mod2: "SHIFT"
  },
  LIMIT_DRAW_TO_CONTAINING_GEOUNIT: {
    key: "c",
    text: "Limit draw to containing geounit"
  },
  TOGGLE_PAN_MAP: {
    key: "SPACE",
    text: "Hold to pan map when using brush / rectangle"
  }
  // Feature not implemented yet
  // LIMIT_DRAW_TO_UNASSIGNED: {
  //   key: "x",
  //   text: "Limit draw to unassigned"
  // }
};

const CopyMapModal = ({ showModal }: { readonly showModal: boolean }) => {
  const hideModal = () => store.dispatch(showKeyboardShortcutsModal(false));
  const keyboardShortcuts = Object.entries(KEYBOARD_SHORTCUTS);
  const os = navigator.appVersion.indexOf("Mac") !== -1 ? "Mac" : "pc";

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
                  {keyboardShortcuts.map(shortcut => (
                    <tr sx={style.keyRow} key={shortcut[0]}>
                      <td>
                        <Box sx={style.keyItem}>
                          {"mod" in shortcut[1] ? (
                            "mod2" in shortcut[1] ? (
                              <span>
                                <span sx={style.keyCode}>
                                  {os === "Mac" ? shortcut[1].mod : "CTRL"}
                                </span>
                                +<span sx={style.keyCode}>{shortcut[1].mod2}</span>+
                                <span sx={style.keyCode}>{shortcut[1].key.toUpperCase()}</span>
                              </span>
                            ) : (
                              <span>
                                <span sx={style.keyCode}>
                                  {os === "Mac" ? shortcut[1].mod : "CTRL"}
                                </span>
                                +<span sx={style.keyCode}>{shortcut[1].key.toUpperCase()}</span>
                              </span>
                            )
                          ) : (
                            <span sx={style.keyCode}>{shortcut[1].key.toUpperCase()}</span>
                          )}

                          <span sx={style.keyFunction}>{shortcut[1].text}</span>
                        </Box>
                      </td>
                    </tr>
                  ))}
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

export default connect(mapStateToProps)(CopyMapModal);
