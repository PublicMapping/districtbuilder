import { DistrictId } from "../../../shared/entities";

import {
  setGeoLevelIndex,
  setMapLabel,
  setSelectedDistrictId,
  setSelectionTool,
  SelectionTool,
  saveDistrictsDefinition,
  clearSelectedGeounits,
  toggleDistrictLocked,
  toggleEvaluate,
  undo,
  redo,
  toggleLimitDrawingToWithinCounty,
  showKeyboardShortcutsModal
} from "../../actions/districtDrawing";
import store from "../../store";
import { showMapActionToast } from "../../functions";

interface MapContext {
  readonly selectionTool: SelectionTool;
  readonly geoLevelIndex: number;
  readonly selectedDistrictId: DistrictId;
  readonly label?: string;
  readonly numFeatures: number;
  readonly numGeolevels: number;
  readonly limitSelectionToCounty: boolean;
  readonly evaluateMode: boolean;
  // eslint-disable-next-line
  readonly setTogglePan: (isSet: boolean) => void;
}

interface KeyboardShortcut {
  readonly key: string;
  readonly text: string;
  readonly label?: string;
  readonly meta?: true;
  readonly shift?: true | "optional";
  // eslint-disable-next-line
  readonly action: (context: MapContext) => void;
}

const SelectionToolOrder = [
  SelectionTool.Default,
  SelectionTool.Rectangle,
  SelectionTool.PaintBrush
];

function nextSelectionTool({ selectionTool }: MapContext) {
  // Go to next selection tool, or first selection tool if at end of list
  const currentSelectionTool = SelectionToolOrder.indexOf(selectionTool);
  const nextSelectionTool =
    currentSelectionTool < SelectionToolOrder.length - 1 ? currentSelectionTool + 1 : 0;
  store.dispatch(setSelectionTool(SelectionToolOrder[nextSelectionTool]));
}
function previousSelectionTool({ selectionTool }: MapContext) {
  // Go to previous selection tool, or last selection tool in list if at start
  const currentSelectionTool = SelectionToolOrder.indexOf(selectionTool);
  const previousSelectionTool =
    currentSelectionTool > 0 ? currentSelectionTool - 1 : SelectionToolOrder.length - 1;
  store.dispatch(setSelectionTool(SelectionToolOrder[previousSelectionTool]));
}

function nextGeoLevel({ geoLevelIndex, numGeolevels }: MapContext) {
  // Go to next geolevel if not already on smallest level
  const nextGeoLevelIndex = geoLevelIndex < numGeolevels - 1 ? geoLevelIndex + 1 : geoLevelIndex;
  store.dispatch(setGeoLevelIndex(nextGeoLevelIndex));
}
function previousGeoLevel({ geoLevelIndex }: MapContext) {
  // Go to previous geolevel if not already at largest level
  const previousGeoLevelIndex = geoLevelIndex > 0 ? geoLevelIndex - 1 : geoLevelIndex;
  store.dispatch(setGeoLevelIndex(previousGeoLevelIndex));
}

function setNextDistrict({ selectedDistrictId, numFeatures }: MapContext) {
  // Set the next district as currently selected, or first district if currently at end of list
  const nextDistrictId = selectedDistrictId < numFeatures - 1 ? selectedDistrictId + 1 : 1;
  store.dispatch(setSelectedDistrictId(nextDistrictId));
}
function setPreviousDistrict({ selectedDistrictId, numFeatures }: MapContext) {
  // Set the previous district as currently selected, or last district if currently at start of list
  const previousDistrictId = selectedDistrictId > 1 ? selectedDistrictId - 1 : numFeatures - 1;
  store.dispatch(setSelectedDistrictId(previousDistrictId));
}

function togglePopulationLabel({ label }: MapContext) {
  // Toggle population label
  if (label) {
    store.dispatch(setMapLabel(undefined));
  } else {
    store.dispatch(setMapLabel("population"));
  }
}

export const KEYBOARD_SHORTCUTS: readonly KeyboardShortcut[] = [
  {
    key: "e",
    text: "Previous district",
    action: setPreviousDistrict
  },
  {
    key: "d",
    text: "Next district",
    action: setNextDistrict
  },
  {
    key: "s",
    text: "Use bigger geolevels",
    action: previousGeoLevel
  },
  {
    key: "f",
    text: "Use smaller geolevels",
    action: nextGeoLevel
  },
  {
    key: "w",
    text: "Use previous selection tool",
    action: previousSelectionTool
  },
  {
    key: "r",
    text: "Use next selection tool",
    action: nextSelectionTool
  },
  {
    key: "g",
    text: "Accept changes",
    action: () => {
      store.dispatch(saveDistrictsDefinition());
    }
  },
  {
    key: "a",
    text: "Reject changes",
    action: () => {
      store.dispatch(clearSelectedGeounits(true));
    }
  },
  {
    key: "1",
    text: "Toggle population labels",
    action: togglePopulationLabel
  },
  {
    key: "q",
    text: "Toggle lock on selected district",
    action: ({ selectedDistrictId }: MapContext) => {
      store.dispatch(toggleDistrictLocked(selectedDistrictId - 1));
    }
  },
  // {
  //   key: "t",
  //   text: "Toggle evaluate mode",
  //   action: ({ evaluateMode }: MapContext) => {
  //     store.dispatch(toggleEvaluate(!evaluateMode));
  //   }
  // },
  {
    key: "z",
    text: "Undo",
    meta: true,
    action: () => {
      store.dispatch(undo());
    }
  },
  {
    key: "Z",
    text: "Redo",
    meta: true,
    shift: true,
    action: () => {
      store.dispatch(redo());
    }
  },
  {
    key: "c",
    text: "Limit draw to containing geounit",
    action: ({ limitSelectionToCounty }: MapContext) => {
      store.dispatch(toggleLimitDrawingToWithinCounty()) &&
        showMapActionToast(
          limitSelectionToCounty
            ? "No longer limit selection to county"
            : "Limiting selection to county"
        );
    }
  },
  {
    key: " ",
    label: "SPACE",
    text: "Hold to pan map when using brush / rectangle",
    action: ({ setTogglePan }: MapContext) => {
      setTogglePan(true);
    }
  },
  {
    key: "?",
    text: "Show this help menu",
    shift: true,
    action: () => {
      store.dispatch(showKeyboardShortcutsModal(true));
    }
  }
  // Feature not implemented yet
  // LIMIT_DRAW_TO_UNASSIGNED: {
  //   key: "x",
  //   text: "Limit draw to unassigned"
  // }
];
