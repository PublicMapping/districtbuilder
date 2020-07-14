import { createAction } from "typesafe-actions";
import { IProject } from "../../shared/entities";

export enum SelectionTool {
  Default = "DEFAULT",
  Rectangle = "RECTANGLE"
}

export enum GeoLevel {
  Counties = "COUNTIES",
  Blockgroups = "BLOCKGROUPS",
  Blocks = "BLOCKS"
}

export const setSelectedDistrictId = createAction("Set selected district id")<number>();

export const addSelectedGeounitIds = createAction("Add selected geounit ids")<
  ReadonlySet<number>
>();
export const removeSelectedGeounitIds = createAction("Remove selected geounit ids")<
  ReadonlySet<number>
>();
export const clearSelectedGeounitIds = createAction("Clear selected geounit ids")();

export const saveDistrictsDefinition = createAction("Save districts definition")<IProject>();

export const patchDistrictsDefinitionSuccess = createAction("Patch districts definition success")<
  IProject
>();
export const patchDistrictsDefinitionFailure = createAction("Patch districts definition failure")<
  string
>();

export const setSelectionTool = createAction("Set selection tool")<SelectionTool>();

export const setGeoLevel = createAction("Set geoLevel")<GeoLevel>();
