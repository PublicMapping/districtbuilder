import { createAction } from "typesafe-actions";
import { DistrictId, GeoUnits } from "../../shared/entities";
import { SavingState } from "../types";

export enum SelectionTool {
  Default = "DEFAULT",
  Rectangle = "RECTANGLE"
}

export const setSelectedDistrictId = createAction("Set selected district id")<number>();

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
export const setSelectedGeounits = createAction("Set selected geounits")<GeoUnits>();

export const setHighlightedGeounits = createAction("Add highlighted geounit ids")<GeoUnits>();
export const clearHighlightedGeounits = createAction("Clear highlighted geounit ids")();

export const setSelectionTool = createAction("Set selection tool")<SelectionTool>();

export const setGeoLevelIndex = createAction("Set geoLevel index")<number>();

export const setGeoLevelVisibility = createAction("Set geolevel visibility")<readonly boolean[]>();

export const toggleDistrictLocked = createAction("Toggle district locked")<DistrictId>();

export const showAdvancedEditingModal = createAction("Show advanced editing warning modal")<
  boolean
>();

export const undo = createAction("Undo project action")();
export const redo = createAction("Redo project action")();

export const toggleFind = createAction("Toggle find menu visibility")<boolean>();
export const setFindIndex = createAction("Set find menu polygon index")<number | undefined>();

export const saveDistrictsDefinition = createAction("Save districts definition")();

export const setSavingState = createAction("Set saving state")<SavingState>();
