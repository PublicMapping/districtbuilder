import { createAction } from "typesafe-actions";
import { DistrictId, GeoUnits } from "../../shared/entities";

export enum SelectionTool {
  Default = "DEFAULT",
  Rectangle = "RECTANGLE"
}

export const setSelectedDistrictId = createAction("Set selected district id")<number>();

export const addSelectedGeounitIds = createAction("Add selected geounit ids")<GeoUnits>();
export const removeSelectedGeounitIds = createAction("Remove selected geounit ids")<GeoUnits>();
export const clearSelectedGeounitIds = createAction("Clear selected geounit ids")();

export const setSelectionTool = createAction("Set selection tool")<SelectionTool>();

export const setGeoLevelIndex = createAction("Set geoLevel index")<number>();

export const setGeoLevelVisibility = createAction("Set geolevel visibility")<readonly boolean[]>();

export const saveDistrictsDefinition = createAction("Save districts definition")();

export const toggleDistrictLocked = createAction("Toggle district locked")<DistrictId>();
