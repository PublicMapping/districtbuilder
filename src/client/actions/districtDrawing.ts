import { createAction } from "typesafe-actions";
import { DistrictId, GeoUnits } from "../../shared/entities";
import { SavingState, ElectionYear, EvaluateMetricWithValue } from "../types";

export enum SelectionTool {
  Default = "DEFAULT",
  Rectangle = "RECTANGLE",
  PaintBrush = "PAINTBRUSH"
}

export type PaintBrushSize = 1 | 2 | 3 | 4 | 5;

export enum FindTool {
  Unassigned = "UNASSIGNED",
  NonContiguous = "NON_CONTIGUOUS"
}

export const setSelectedDistrictId = createAction("Set selected district id")<number>();
export const setHoveredDistrictId = createAction("Set hovered district id")<number | null>();
export const setZoomToDistrictId = createAction("Set zoom to district id")<DistrictId | null>();

export const addSelectedGeounits = createAction("Add selected geounits")<GeoUnits>();
export const removeSelectedGeounits = createAction("Remove selected geounits")<GeoUnits>();

// Payload boolean is for "canceled". True when cancel button is pressed, false when cleared
// due to districts being updated. Needed for showing correct status on sidebar.
export const clearSelectedGeounits = createAction("Clear selected geounits")<boolean>();

export const editSelectedGeounits = createAction("Edit selected geounits")<{
  readonly add?: GeoUnits;
  readonly remove?: GeoUnits;
}>();
export const replaceSelectedGeounits = createAction("Replace selected geounits")<{
  readonly add?: GeoUnits;
  readonly remove?: GeoUnits;
}>();

export const setHighlightedGeounits = createAction("Add highlighted geounit ids")<GeoUnits>();
export const clearHighlightedGeounits = createAction("Clear highlighted geounit ids")();

export const setSelectionTool = createAction("Set selection tool")<SelectionTool>();
export const setPaintBrushSize = createAction("Set paint brush size")<PaintBrushSize>();

export const setGeoLevelIndex = createAction("Set geoLevel index")<{
  readonly index: number;
  readonly isReadOnly: boolean;
  readonly skipModal?: boolean;
}>();

export const setMapLabel = createAction("Set map label")<string | undefined>();

export const setGeoLevelVisibility = createAction("Set geolevel visibility")<readonly boolean[]>();

export const toggleDistrictLocked = createAction("Toggle district locked")<DistrictId>();

export const toggleLimitDrawingToWithinCounty = createAction("Limit drawing to within county")();

export const setElectionYear = createAction("Set election year for tooltip data")<ElectionYear>();

export const toggleKeyboardShortcutsModal = createAction("Show keyboard shortcuts modal")();

export const showAdvancedEditingModal = createAction("Show advanced editing warning modal")<
  boolean
>();
export const showCopyMapModal = createAction("Show copy map modal")<boolean>();
export const showConvertMapModal = createAction("Show convert map modal")<boolean>();
export const setImportFlagsModal = createAction("Show import flags modal")<boolean>();

export const undo = createAction("Undo project action")();
export const redo = createAction("Redo project action")();

export const toggleFind = createAction("Toggle find menu visibility")<boolean>();
export const setFindType = createAction("Set find menu search type")<FindTool>();
export const setFindIndex = createAction("Set find menu polygon index")<number | undefined>();

export const toggleEvaluate = createAction("Toggle evaluate mode")<boolean>();
export const toggleExpandedMetrics = createAction("Toggle expanded metrics")<boolean>();
export const selectEvaluationMetric = createAction("Select evaluation metric")<
  EvaluateMetricWithValue | undefined
>();

export const saveDistrictsDefinition = createAction("Save districts definition")();

export const setSavingState = createAction("Set saving state")<SavingState>();
