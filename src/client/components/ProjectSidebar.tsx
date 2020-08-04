/** @jsx jsx */
import { Feature, FeatureCollection, MultiPolygon } from "geojson";
import { useState } from "react";
import { Box, Button, Flex, Heading, jsx, Styled } from "theme-ui";

import {
  CompactnessScore,
  DistrictsDefinition,
  DistrictProperties,
  GeoUnitHierarchy,
  GeoUnitIndices,
  GeoUnits,
  IProject,
  IStaticMetadata,
  LockedDistricts
} from "../../shared/entities";
import { assertNever, getDemographics, getTotalSelectedDemographics } from "../../shared/functions";
import {
  getDistrictColor,
  negativeChangeColor,
  positiveChangeColor,
  selectedDistrictColor
} from "../constants/colors";
import DemographicsChart from "./DemographicsChart";
import DemographicsTooltip from "./DemographicsTooltip";
import Loading from "./Loading";
import Icon from "./Icon";

import {
  clearSelectedGeounitIds,
  saveDistrictsDefinition,
  setSelectedDistrictId,
  toggleDistrictLocked
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
  geoUnitHierarchy,
  lockedDistricts
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
  readonly lockedDistricts: LockedDistricts;
} & LoadingProps) => {
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
            <Styled.th></Styled.th>
          </Styled.tr>
        </thead>
        <tbody>
          {project &&
            geojson &&
            staticMetadata &&
            staticGeoLevels &&
            staticDemographics &&
            geoUnitHierarchy &&
            getSidebarRows(
              project,
              geojson,
              staticMetadata,
              staticGeoLevels,
              staticDemographics,
              selectedDistrictId,
              selectedGeounits,
              geoLevelIndex,
              geoUnitHierarchy,
              lockedDistricts
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

const BLANK_VALUE = "–";

function getCompactnessDisplay(compactness: CompactnessScore) {
  return compactness === null ? (
    BLANK_VALUE
  ) : typeof compactness === "number" ? (
    <span title="Polsby-Popper score">{Math.floor(compactness * 100)}%</span>
  ) : compactness === "non-contiguous" ? (
    <span title="Non-contiguous">
      <Icon name="times-circle" />
    </span>
  ) : (
    assertNever(compactness)
  );
}

const SidebarRow = ({
  district,
  selected,
  selectedPopulationDifference,
  demographics,
  deviation,
  districtId,
  isDistrictLocked
}: {
  readonly district: Feature<MultiPolygon, DistrictProperties>;
  readonly selected: boolean;
  readonly selectedPopulationDifference: number;
  readonly demographics: { readonly [id: string]: number };
  readonly deviation: number;
  readonly districtId: number;
  readonly isDistrictLocked?: boolean;
}) => {
  const [demographicsTooltipVisible, setDemographicsTooltipVisible] = useState(false);
  const [isHovered, setHover] = useState(false);

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
    districtId === 0 ? BLANK_VALUE : getCompactnessDisplay(district.properties.compactness);
  const toggleHover = () => setHover(!isHovered);
  const toggleLocked = (e: React.MouseEvent) => {
    e.stopPropagation();
    store.dispatch(toggleDistrictLocked(districtId));
  };
  return (
    <Styled.tr
      sx={{ backgroundColor: selected ? selectedDistrictColor : "inherit", cursor: "pointer" }}
      onClick={() => {
        store.dispatch(setSelectedDistrictId(district.id as number));
      }}
      onMouseOver={toggleHover}
      onMouseOut={toggleHover}
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
      <Styled.td
        sx={{ width: "100%", height: "100%" }}
        onMouseOver={() => setDemographicsTooltipVisible(true)}
        onMouseOut={() => setDemographicsTooltipVisible(false)}
      >
        <DemographicsChart demographics={demographics} />
        {demographicsTooltipVisible && demographics.population > 0 && (
          <Box sx={{ position: "absolute", p: 2, backgroundColor: "gray.8" }}>
            <DemographicsTooltip demographics={demographics} />
          </Box>
        )}
      </Styled.td>
      <Styled.td>{BLANK_VALUE}</Styled.td>
      <Styled.td>{compactnessDisplay}</Styled.td>
      <Styled.td>
        {isDistrictLocked ? (
          <span onClick={toggleLocked}>
            <Icon name="lock-locked" />
          </span>
        ) : (
          <span style={{ visibility: isHovered ? "visible" : "hidden" }} onClick={toggleLocked}>
            <Icon name="lock-unlocked" />
          </span>
        )}
      </Styled.td>
    </Styled.tr>
  );
};

// Drill into the district definition and collect the base geounits for
// every district that's part of the selection
const getSavedDistrictSelectedDemographics = (
  project: IProject,
  staticMetadata: IStaticMetadata,
  staticDemographics: ReadonlyArray<Uint8Array | Uint16Array | Uint32Array>,
  selectedGeounits: GeoUnits,
  geoUnitHierarchy: GeoUnitHierarchy
) => {
  /* eslint-disable */
  // Note: not using Array.fill to populate these, because the empty array in memory gets shared
  const mutableDistrictGeounitAccum: number[][] = [];
  for (let i = 0; i <= project.numberOfDistricts; i = i + 1) {
    mutableDistrictGeounitAccum[i] = [];
  }
  /* eslint-enable */

  // Collect all base geounits found in the selection
  const accumulateGeounits = (
    subIndices: GeoUnitIndices,
    subDefinition: DistrictsDefinition | number,
    subHierarchy: GeoUnitHierarchy | number
  ) => {
    if (typeof subHierarchy === "number" && typeof subDefinition === "number") {
      // The base case: we made it to the bottom of the trees and need to assign this
      // base geonunit to the district found in the district definition
      // eslint-disable-next-line
      mutableDistrictGeounitAccum[subDefinition].push(subHierarchy);
      return;
    } else if (subIndices.length === 0 && typeof subHierarchy !== "number") {
      // We've exhausted the base indices. This means we ned to grab all the indices found
      // at this level and accumulate them all
      subHierarchy.forEach((_, ind) => accumulateGeounits([ind], subDefinition, subHierarchy));
      return;
    } else {
      // Recurse by drilling into all three data structures:
      // geounit indices, district definition, and geounit hierarchy
      const currIndex = subIndices[0];
      const currDefn =
        typeof subDefinition === "number"
          ? subDefinition
          : (subDefinition[currIndex] as DistrictsDefinition);
      const currHierarchy =
        typeof subHierarchy === "number" ? subHierarchy : subHierarchy[currIndex];
      accumulateGeounits(subIndices.slice(1), currDefn, currHierarchy);
      return;
    }
  };

  selectedGeounits.forEach(selectedGeounit => {
    accumulateGeounits(selectedGeounit, project.districtsDefinition, geoUnitHierarchy);
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
  selectedGeounits: GeoUnits,
  geoLevelIndex: number,
  geoUnitHierarchy: GeoUnitHierarchy,
  lockedDistricts: LockedDistricts
) => {
  // Aggregated demographics for the geounit selection
  const totalSelectedDemographics = getTotalSelectedDemographics(
    staticMetadata,
    staticGeoLevels,
    staticDemographics,
    selectedGeounits,
    geoLevelIndex
  );

  // The demographic composition of the selection for each saved district
  const savedDistrictSelectedDemographics = getSavedDistrictSelectedDemographics(
    project,
    staticMetadata,
    staticDemographics,
    selectedGeounits,
    geoUnitHierarchy
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
    const demographics = feature.properties;
    const selectedPopulation = savedDistrictSelectedDemographics[districtId].population;
    const selectedPopulationDifference = selected
      ? totalSelectedDemographics.population - selectedPopulation
      : -1 * selectedPopulation;

    return (
      <SidebarRow
        district={feature}
        selected={selected}
        selectedPopulationDifference={selectedPopulationDifference}
        demographics={demographics}
        deviation={
          // The population goal for the unassigned district is 0,
          // so it's deviation is equal to its population
          districtId === 0
            ? feature.properties.population
            : feature.properties.population - averagePopulation
        }
        key={districtId}
        isDistrictLocked={lockedDistricts.has(districtId)}
        districtId={districtId}
      />
    );
  });
};

export default ProjectSidebar;
