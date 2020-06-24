import { createAction } from "typesafe-actions";
import { FeatureCollection, MultiPolygon } from "geojson";
import { DistrictProperties, IProject, IStaticMetadata, ProjectId } from "../../shared/entities";

export const projectDataFetch = createAction("Project data fetch")<ProjectId>();

export const projectFetch = createAction("Project fetch")<ProjectId>();
export const projectFetchGeoJson = createAction("Project fetch geojson")<ProjectId>();
export const projectFetchSuccess = createAction("Project fetch success")<IProject>();
export const projectFetchFailure = createAction("Project fetch failure")<string>();
export const projectFetchGeoJsonSuccess = createAction("Project fetch GeoJSON success")<
  FeatureCollection<MultiPolygon, DistrictProperties>
>();
export const projectFetchGeoJsonFailure = createAction("Project fetch GeoJSON failure")<string>();

export const staticMetadataFetchSuccess = createAction("Static metadata fetch success")<
  IStaticMetadata
>();
export const staticMetadataFetchFailure = createAction("Static metadata fetch failure")<string>();

export const staticGeoLevelsFetchSuccess = createAction("Static geoLevels fetch success")<
  ReadonlyArray<Uint8Array | Uint16Array | Uint32Array>
>();
export const staticGeoLevelsFetchFailure = createAction("Static geoLevels fetch failure")<string>();

export const staticDemographicsFetchSuccess = createAction("Static demographics fetch success")<
  ReadonlyArray<Uint8Array | Uint16Array | Uint32Array>
>();
export const staticDemographicsFetchFailure = createAction("Static demographics fetch failure")<
  string
>();

export const setSelectedDistrictId = createAction("Set selected district id")<number>();

export const addSelectedGeounitIds = createAction("Add selected geounit ids")<
  ReadonlySet<number>
>();
export const removeSelectedGeounitIds = createAction("Remove selected geounit ids")<
  ReadonlySet<number>
>();
export const clearSelectedGeounitIds = createAction("Clear selected geounit ids")();

export const saveDistrictsDefinition = createAction("Save districts definition")();

export const patchDistrictsDefinitionSuccess = createAction("Patch districts definition success")<
  IProject
>();
export const patchDistrictsDefinitionFailure = createAction("Patch districts definition failure")<
  string
>();
