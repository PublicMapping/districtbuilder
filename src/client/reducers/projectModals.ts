import { Loop, LoopReducer } from "redux-loop";
import { getType } from "typesafe-actions";

import { Action } from "../actions";

import {
  showAdvancedEditingModal,
  showCopyMapModal,
  setImportFlagsModal,
  toggleKeyboardShortcutsModal
} from "../actions/projectModals";
import { resetProjectState } from "../actions/root";

export interface ProjectModalsState {
  readonly showAdvancedEditingModal: boolean;
  readonly showCopyMapModal: boolean;
  readonly showKeyboardShortcutsModal: boolean;
  readonly showImportFlagsModal: boolean;
}

export const initialProjectModalsState: ProjectModalsState = {
  showAdvancedEditingModal: false,
  showCopyMapModal: false,
  showImportFlagsModal: false,
  showKeyboardShortcutsModal: false
};

const districtDrawingReducer: LoopReducer<ProjectModalsState, Action> = (
  state: ProjectModalsState = initialProjectModalsState,
  action: Action
): ProjectModalsState | Loop<ProjectModalsState, Action> => {
  switch (action.type) {
    case getType(resetProjectState):
      return {
        ...state,
        ...initialProjectModalsState
      };
    case getType(showAdvancedEditingModal):
      return {
        ...state,
        showAdvancedEditingModal: action.payload
      };
    case getType(toggleKeyboardShortcutsModal):
      return {
        ...state,
        showKeyboardShortcutsModal: !state.showKeyboardShortcutsModal
      };
    case getType(showCopyMapModal):
      return {
        ...state,
        showCopyMapModal: action.payload
      };
    case getType(setImportFlagsModal):
      return {
        ...state,
        showImportFlagsModal: action.payload
      };
    default:
      return state as never;
  }
};

export default districtDrawingReducer;
