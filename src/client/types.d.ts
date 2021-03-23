import { FeatureCollection, MultiPolygon } from "geojson";
import * as H from "history";
import {
  IProject,
  IStaticMetadata,
  UintArrays,
  GeoUnitHierarchy,
  DistrictProperties,
  DistrictsDefinition
} from "../shared/entities";

export type DistrictGeoJSON = Feature<MultiPolygon, DistrictProperties>;
export type DistrictsGeoJSON = FeatureCollection<MultiPolygon, DistrictProperties>;

export interface DynamicProjectData {
  readonly project: IProject;
  readonly geojson: DistrictsGeoJSON;
}

export interface StaticProjectData {
  readonly staticMetadata: IStaticMetadata;
  readonly staticGeoLevels: UintArrays;
  readonly geoUnitHierarchy: GeoUnitHierarchy;
}

export interface WorkerProjectData {
  readonly staticDemographics: UintArrays;
  readonly geoUnitHierarchy: GeoUnitHierarchy;
}

export type ProjectData = DynamicProjectData & StaticProjectData;

export type SavingState = "unsaved" | "saving" | "saved" | "failed";

export interface AuthLocationState {
  readonly from: H.Location;
}

interface OrgProject {
  readonly id: ProjectId;
  readonly name: string;
  readonly templateName: string;
  readonly updatedAgo: string;
  readonly isFeatured: boolean;
  readonly user: Pick<IUser, PublicUserProperties>;
  readonly districts?: DistrictsGeoJSON;
  readonly districtsDefinition?: DistrictsDefinition;
  readonly creator: string;
}
