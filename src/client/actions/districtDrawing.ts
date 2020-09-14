import { createAction } from "typesafe-actions";
import { DistrictId, GeoUnits } from "../../shared/entities";

export enum SelectionTool {
  Default = "DEFAULT",
  Rectangle = "RECTANGLE"
}

export const setSelectedDistrictId = createAction("Set selected district id")<number>();

export const addSelectedGeounits = createAction("Add selected geounits")<GeoUnits>();
export const removeSelectedGeounits = createAction("Remove selected geounits")<GeoUnits>();
export const clearSelectedGeounits = createAction("Clear selected geounits")();
export const editSelectedGeounits = createAction("Edit selected geounits")<{
  readonly add?: GeoUnits;
  readonly remove?: GeoUnits;
}>();

export const setHighlightedGeounits = createAction("Add highlighted geounit ids")<GeoUnits>();
export const clearHighlightedGeounits = createAction("Clear highlighted geounit ids")();

export const setSelectionTool = createAction("Set selection tool")<SelectionTool>();

export const setGeoLevelIndex = createAction("Set geoLevel index")<number>();

export const setGeoLevelVisibility = createAction("Set geolevel visibility")<readonly boolean[]>();

export const toggleDistrictLocked = createAction("Toggle district locked")<DistrictId>();

export const showAdvancedEditingModal = createAction("Show advanced editing warning modal")<
  boolean
>();
