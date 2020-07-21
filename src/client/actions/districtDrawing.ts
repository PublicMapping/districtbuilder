import { createAction } from "typesafe-actions";
import { GeoUnits, GeoUnitHierarchy, IProject } from "../../shared/entities";

export enum SelectionTool {
  Default = "DEFAULT",
  Rectangle = "RECTANGLE"
}

export const setSelectedDistrictId = createAction("Set selected district id")<number>();

export const addSelectedGeounitIds = createAction("Add selected geounit ids")<GeoUnits>();
export const removeSelectedGeounitIds = createAction("Remove selected geounit ids")<GeoUnits>();
export const clearSelectedGeounitIds = createAction("Clear selected geounit ids")();

export const saveDistrictsDefinition = createAction("Save districts definition")<{
  readonly project: IProject;
  readonly geoUnitHierarchy: GeoUnitHierarchy;
}>();

export const patchDistrictsDefinitionSuccess = createAction("Patch districts definition success")<
  IProject
>();
export const patchDistrictsDefinitionFailure = createAction("Patch districts definition failure")<
  string
>();

export const setSelectionTool = createAction("Set selection tool")<SelectionTool>();

export const setGeoLevelIndex = createAction("Set geoLevel index")<number>();
