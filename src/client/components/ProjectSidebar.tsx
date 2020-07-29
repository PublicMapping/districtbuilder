/** @jsx jsx */
import { Feature, FeatureCollection, MultiPolygon } from "geojson";
import { Button, Flex, Heading, jsx, Styled } from "theme-ui";

import {
  DistrictsDefinition,
  DistrictProperties,
  GeoUnitHierarchy,
  GeoUnits,
  IProject,
  IStaticMetadata
} from "../../shared/entities";
import { getAllIndices, getDemographics } from "../../shared/functions";
import {
  getDistrictColor,
  negativeChangeColor,
  positiveChangeColor,
  selectedDistrictColor
} from "../constants/colors";
import Loading from "./Loading";

import {
  clearSelectedGeounitIds,
  saveDistrictsDefinition,
  setSelectedDistrictId
} from "../actions/districtDrawing";
import store from "../store";

interface LoadingProps {
  readonly isLoading: boolean;
}

const ProjectSidebar = ({
  project,
  geojson,
  isLoading,
  staticMetadata,
  staticGeoLevels,
  staticDemographics,
  selectedDistrictId,
  selectedGeounits,
  geoLevelIndex,
  geoUnitHierarchy
}: {
  readonly project?: IProject;
  readonly geojson?: FeatureCollection<MultiPolygon, DistrictProperties>;
  readonly staticMetadata?: IStaticMetadata;
  readonly staticGeoLevels?: ReadonlyArray<Uint8Array | Uint16Array | Uint32Array>;
  readonly staticDemographics?: ReadonlyArray<Uint8Array | Uint16Array | Uint32Array>;
  readonly selectedDistrictId: number;
  readonly selectedGeounits: GeoUnits;
  readonly geoLevelIndex: number;
  readonly geoUnitHierarchy?: GeoUnitHierarchy;
} & LoadingProps) => {
  // TODO: Make demographic calculations work for all geolevels (#202)
  const topLevelSelectedGeounitIds = new Set([...selectedGeounits].map(geounit => geounit[0]));
  return (
    <Flex
      sx={{
        background: "#fff",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        zIndex: 20,
        position: "relative",
        flexShrink: 0,
        boxShadow: "0 0 1px #a9acae",
        minWidth: "300px"
      }}
    >
      {project && geoUnitHierarchy && (
        <SidebarHeader selectedGeounits={selectedGeounits} isLoading={isLoading} />
      )}
      <Styled.table>
        <thead>
          <Styled.tr>
            <Styled.th>Number</Styled.th>
            <Styled.th>Population</Styled.th>
            <Styled.th>Deviation</Styled.th>
            <Styled.th>Race</Styled.th>
            <Styled.th>Pol.</Styled.th>
            <Styled.th>Comp.</Styled.th>
          </Styled.tr>
        </thead>
        <tbody>
          {project &&
            geojson &&
            staticMetadata &&
            staticGeoLevels &&
            staticDemographics &&
            getSidebarRows(
              project,
              geojson,
              staticMetadata,
              staticGeoLevels,
              staticDemographics,
              selectedDistrictId,
              topLevelSelectedGeounitIds,
              geoLevelIndex
            )}
        </tbody>
      </Styled.table>
    </Flex>
  );
};

const SidebarHeader = ({
  selectedGeounits,
  isLoading
}: {
  readonly selectedGeounits: GeoUnits;
} & LoadingProps) => {
  return (
    <Flex sx={{ variant: "header.app" }}>
      <Flex sx={{ variant: "header.left" }}>
        <Heading as="h3" sx={{ m: "0" }}>
          Districts
        </Heading>
      </Flex>
      {isLoading ? (
        <Loading />
      ) : selectedGeounits.size ? (
        <Flex sx={{ variant: "header.right" }}>
          <Button
            variant="circularSubtle"
            sx={{ mr: "2", cursor: "pointer" }}
            onClick={() => {
              store.dispatch(clearSelectedGeounitIds());
            }}
          >
            Cancel
          </Button>
          <Button
            variant="circular"
            sx={{ cursor: "pointer" }}
            onClick={() => {
              store.dispatch(saveDistrictsDefinition());
            }}
          >
            Approve
          </Button>
        </Flex>
      ) : null}
    </Flex>
  );
};

const SidebarRow = ({
  district,
  selected,
  selectedPopulationDifference,
  deviation
}: {
  readonly district: Feature<MultiPolygon, DistrictProperties>;
  readonly selected: boolean;
  readonly selectedPopulationDifference: number;
  readonly deviation: number;
}) => {
  const showPopulationChange = selectedPopulationDifference !== 0;
  const textColor = showPopulationChange
    ? selectedPopulationDifference > 0
      ? positiveChangeColor
      : negativeChangeColor
    : "inherit";
  const intermediatePopulation = district.properties.population + selectedPopulationDifference;
  const intermediateDeviation = deviation + selectedPopulationDifference;
  const populationDisplay = intermediatePopulation.toLocaleString();
  const deviationDisplay = `${intermediateDeviation > 0 ? "+" : ""}${Math.round(
    intermediateDeviation
  ).toLocaleString()}`;
  const compactnessDisplay =
    typeof district.properties.compactness === "number" ? (
      <span title="Polsby-Popper score">{Math.floor(district.properties.compactness * 100)}%</span>
    ) : district.properties.compactness === null ? (
      "–"
    ) : (
      <span title="Non-contiguous">&#x274C;</span>
    );

  return (
    <Styled.tr
      sx={{ backgroundColor: selected ? selectedDistrictColor : "inherit", cursor: "pointer" }}
      onClick={() => {
        store.dispatch(setSelectedDistrictId(district.id as number));
      }}
    >
      <Styled.td sx={{ textAlign: "left" }}>
        <span
          sx={{
            backgroundColor: getDistrictColor(district.id),
            marginRight: "7px"
          }}
        >
          &nbsp;&nbsp;&nbsp;
        </span>
        {district.id || "∅"}
      </Styled.td>
      <Styled.td sx={{ color: textColor }}>{populationDisplay}</Styled.td>
      <Styled.td sx={{ color: textColor }}>{deviationDisplay}</Styled.td>
      <Styled.td>–</Styled.td>
      <Styled.td>–</Styled.td>
      <Styled.td>{compactnessDisplay}</Styled.td>
    </Styled.tr>
  );
};

// Aggregate all demographics that are included in the selection
const getTotalSelectedDemographics = (
  staticMetadata: IStaticMetadata,
  staticGeoLevels: ReadonlyArray<Uint8Array | Uint16Array | Uint32Array>,
  staticDemographics: ReadonlyArray<Uint8Array | Uint16Array | Uint32Array>,
  selectedGeounitIds: ReadonlySet<number>,
  geoLevelIndex: number
) => {
  // TODO: Make demographic calculations work for all geolevels (#202)
  const baseIndices = staticGeoLevels.slice().reverse()[geoLevelIndex];
  const selectedBaseIndices = baseIndices
    ? getAllIndices(baseIndices, selectedGeounitIds)
    : Array.from(selectedGeounitIds);
  return getDemographics(selectedBaseIndices, staticMetadata, staticDemographics);
};

// Drill into the district definition and collect the base geounits for
// every district that's part of the selection
const getSavedDistrictSelectedDemographics = (
  project: IProject,
  staticMetadata: IStaticMetadata,
  staticGeoLevels: ReadonlyArray<Uint8Array | Uint16Array | Uint32Array>,
  staticDemographics: ReadonlyArray<Uint8Array | Uint16Array | Uint32Array>,
  selectedGeounitIds: ReadonlySet<number>,
  geoLevelIndex: number
) => {
  // eslint-disable-next-line
  const mutableDistrictGeounitAccum: number[][] = Array(project.numberOfDistricts + 1).fill([]);

  // Note: this function was originally intended to be recursive, and had logic to go through
  // the district definition tree and collect all base geounits found in the tree.
  // However, there currently isn't enough information on the client-side to be able to
  // effectively accomplish this, so it is only working with the top-most geolevel at the moment.
  // We will need to determine a way to make this work with all geolevels. In order to allow that
  // to happen, there are a couple potential options:
  //   1) Perform this logic on the server-side, where we have access to the topology
  //      (not ideal, since we want very fast updates)
  //   2) Send more data to the client-side in order to allow matching up base geounits to
  //      the district definition. This may be prohibitively large, so it will require research.
  const accumulateGeounits = (
    geounitIndex: number,
    subDefinition: DistrictsDefinition,
    levelIndex: number
  ) => {
    const item = subDefinition[geounitIndex];
    // eslint-disable-next-line
    if (typeof item === "number") {
      // TODO: Make demographic calculations work for all geolevels (#202)
      const baseIndices = staticGeoLevels.slice().reverse()[levelIndex];
      const selectedBaseIndices = baseIndices
        ? getAllIndices(baseIndices, selectedGeounitIds)
        : Array.from(selectedGeounitIds);
      // eslint-disable-next-line
      mutableDistrictGeounitAccum[item] = mutableDistrictGeounitAccum[item].concat(
        selectedBaseIndices
      );
    }
  };
  selectedGeounitIds.forEach(selectedGeounitId => {
    accumulateGeounits(selectedGeounitId, project.districtsDefinition, geoLevelIndex);
  });

  return mutableDistrictGeounitAccum.map(baseGeounitIdsForDistrict =>
    getDemographics(baseGeounitIdsForDistrict, staticMetadata, staticDemographics)
  );
};

const getSidebarRows = (
  project: IProject,
  geojson: FeatureCollection<MultiPolygon, DistrictProperties>,
  staticMetadata: IStaticMetadata,
  staticGeoLevels: ReadonlyArray<Uint8Array | Uint16Array | Uint32Array>,
  staticDemographics: ReadonlyArray<Uint8Array | Uint16Array | Uint32Array>,
  selectedDistrictId: number,
  selectedGeounitIds: ReadonlySet<number>,
  geoLevelIndex: number
) => {
  // Aggregated demographics for the geounit selection
  const totalSelectedDemographics = getTotalSelectedDemographics(
    staticMetadata,
    staticGeoLevels,
    staticDemographics,
    selectedGeounitIds,
    geoLevelIndex
  );

  // The demographic composition of the selection for each saved district
  const savedDistrictSelectedDemographics = getSavedDistrictSelectedDemographics(
    project,
    staticMetadata,
    staticGeoLevels,
    staticDemographics,
    selectedGeounitIds,
    geoLevelIndex
  );

  // The target population is based on the average population of all districts,
  // not including the unassigned district, so we use the number of districts,
  // rather than the district feature count (which includes the unassigned district)
  const averagePopulation =
    geojson.features.reduce(
      (population, feature) => population + feature.properties.population,
      0
    ) / project.numberOfDistricts;

  return geojson.features.map(feature => {
    const districtId = typeof feature.id === "number" ? feature.id : 0;
    const selected = districtId === selectedDistrictId;
    const selectedPopulation = savedDistrictSelectedDemographics[districtId].population;
    const selectedPopulationDifference = selected
      ? totalSelectedDemographics.population - selectedPopulation
      : -1 * selectedPopulation;

    return (
      <SidebarRow
        district={feature}
        selected={selected}
        selectedPopulationDifference={selectedPopulationDifference}
        deviation={
          // The population goal for the unassigned district is 0,
          // so it's deviation is equal to its population
          districtId === 0
            ? feature.properties.population
            : feature.properties.population - averagePopulation
        }
        key={districtId}
      />
    );
  });
};

export default ProjectSidebar;
