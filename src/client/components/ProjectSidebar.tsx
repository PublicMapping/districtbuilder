/** @jsx jsx */
import { Feature, FeatureCollection, MultiPolygon } from "geojson";
import React, { useState, Fragment } from "react";
import { Box, Button, Flex, Heading, jsx, Spinner, Styled, ThemeUIStyleObject } from "theme-ui";

import {
  UintArrays,
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
import {
  allGeoUnitIndices,
  areAnyGeoUnitsSelected,
  assertNever,
  getDemographics,
  getTotalSelectedDemographics
} from "../functions";
import {
  getDistrictColor,
  negativeChangeColor,
  positiveChangeColor,
  selectedDistrictColor
} from "../constants/colors";
import DemographicsChart from "./DemographicsChart";
import DemographicsTooltip from "./DemographicsTooltip";
import Icon from "./Icon";
import Tooltip from "./Tooltip";

import {
  clearSelectedGeounits,
  saveDistrictsDefinition,
  setSelectedDistrictId,
  toggleDistrictLocked
} from "../actions/districtDrawing";
import store from "../store";

interface LoadingProps {
  readonly isLoading: boolean;
}

const style: ThemeUIStyleObject = {
  header: {
    variant: "header.app",
    borderBottom: "1px solid",
    borderColor: "gray.2"
  },
  sidebar: {
    bg: "muted",
    boxShadow: "0 0 0 1px rgba(16,22,26,.1), 0 0 0 rgba(16,22,26,0), 0 1px 1px rgba(16,22,26,.2)",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    height: "100%",
    minWidth: "400px",
    position: "relative",
    color: "gray.8",
    zIndex: 200
  },
  tooltip: {
    position: "absolute",
    bg: "gray.8",
    p: 2,
    borderRadius: "small",
    boxShadow: "small",
    m: 0
  },
  th: {
    fontWeight: "bold",
    bg: "muted",
    color: "gray.7",
    fontSize: 1,
    textAlign: "left",
    pt: 2,
    px: 2,
    position: "sticky",
    top: "0",
    zIndex: 2,
    "&::after": {
      height: "1px",
      content: "''",
      display: "block",
      width: "100%",
      bg: "gray.2",
      bottom: "-1px",
      position: "absolute",
      left: 0,
      right: 0
    }
  },
  number: {
    textAlign: "right"
  },
  td: {
    fontWeight: "body",
    color: "gray.8",
    fontSize: 1,
    px: 2,
    textAlign: "left",
    verticalAlign: "bottom"
  },
  districtColor: {
    width: "10px",
    height: "10px",
    borderRadius: "100%",
    mr: 2
  },
  unassignedColor: {
    border: "1px solid",
    borderColor: "gray.3"
  },
  blankValue: {
    color: "gray.2"
  }
};

const ProjectSidebar = ({
  project,
  geojson,
  isLoading,
  staticMetadata,
  staticDemographics,
  selectedDistrictId,
  selectedGeounits,
  geoUnitHierarchy,
  lockedDistricts
}: {
  readonly project?: IProject;
  readonly geojson?: FeatureCollection<MultiPolygon, DistrictProperties>;
  readonly staticMetadata?: IStaticMetadata;
  readonly staticDemographics?: UintArrays;
  readonly selectedDistrictId: number;
  readonly selectedGeounits: GeoUnits;
  readonly geoUnitHierarchy?: GeoUnitHierarchy;
  readonly lockedDistricts: LockedDistricts;
} & LoadingProps) => {
  return (
    <Flex sx={style.sidebar}>
      {project && geoUnitHierarchy && (
        <SidebarHeader selectedGeounits={selectedGeounits} isLoading={isLoading} />
      )}

      <Box sx={{ overflowY: "auto", flex: 1 }}>
        <Styled.table sx={{ mx: 2, mb: 2 }}>
          <thead>
            <Styled.tr>
              <Styled.th sx={style.th}>
                <Tooltip content="Unique number for this district">
                  <span>Number</span>
                </Tooltip>
              </Styled.th>
              <Styled.th sx={{ ...style.th, ...style.number }}>
                <Tooltip content="Number of people in this district">
                  <span>Population</span>
                </Tooltip>
              </Styled.th>
              <Styled.th sx={{ ...style.th, ...style.number }}>
                <Tooltip content="Population needed to match the ideal number for this district">
                  <span>Deviation</span>
                </Tooltip>
              </Styled.th>
              <Styled.th sx={style.th}>
                <Tooltip content="Demographics by race">
                  <span>Race</span>
                </Tooltip>
              </Styled.th>
              <Styled.th sx={{ ...style.th, ...style.number }}>
                <Tooltip content="Compactness score">
                  <span>Comp.</span>
                </Tooltip>
              </Styled.th>
              <Styled.th sx={style.th}></Styled.th>
            </Styled.tr>
          </thead>
          <tbody>
            {project &&
              geojson &&
              staticMetadata &&
              staticDemographics &&
              geoUnitHierarchy &&
              getSidebarRows(
                project,
                geojson,
                staticMetadata,
                staticDemographics,
                selectedDistrictId,
                selectedGeounits,
                geoUnitHierarchy,
                lockedDistricts
              )}
          </tbody>
        </Styled.table>
      </Box>
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
    <Flex sx={style.header}>
      <Flex sx={{ variant: "header.left" }}>
        <Heading as="h2" sx={{ variant: "text.h4", m: "0" }}>
          Districts
        </Heading>
      </Flex>
      {isLoading ? (
        <Flex sx={{ alignItems: "center", justifyContent: "center" }}>
          <Spinner variant="spinner.small" />
        </Flex>
      ) : areAnyGeoUnitsSelected(selectedGeounits) ? (
        <Flex sx={{ variant: "header.right" }}>
          <Button
            variant="circularSubtle"
            sx={{ mr: "2", cursor: "pointer" }}
            onClick={() => {
              store.dispatch(clearSelectedGeounits());
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
            <Icon name="check" />
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
    <Tooltip
      placement="top-start"
      content={
        <em>
          <strong>Empty district.</strong> Add people to this district to view compute compactness.
        </em>
      }
    >
      <span>{BLANK_VALUE}</span>
    </Tooltip>
  ) : typeof compactness === "number" ? (
    <Tooltip
      placement="top-start"
      content={
        <span>
          <strong>{Math.floor(compactness * 100)}% compactness.</strong> Calculated using the
          Polsby-Popper measurement
        </span>
      }
    >
      <span>{`${Math.floor(compactness * 100)}%`}</span>
    </Tooltip>
  ) : compactness === "non-contiguous" ? (
    <Tooltip
      placement="top-start"
      content={
        <em>
          This district is <strong>non-contiguous</strong>. To calculate compactness, make sure all
          parts of the district are connected.
        </em>
      }
    >
      <span>
        <Icon name="alert-triangle" color="#f06543" size={0.95} />
      </span>
    </Tooltip>
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
    districtId === 0 ? (
      <span sx={style.blankValue}>{BLANK_VALUE}</span>
    ) : (
      getCompactnessDisplay(district.properties.compactness)
    );
  const toggleHover = () => setHover(!isHovered);
  const toggleLocked = (e: React.MouseEvent) => {
    e.stopPropagation();
    store.dispatch(toggleDistrictLocked(districtId));
  };
  return (
    <Styled.tr
      sx={{ bg: selected ? selectedDistrictColor : "inherit", cursor: "pointer" }}
      onClick={() => {
        store.dispatch(setSelectedDistrictId(district.id as number));
      }}
      onMouseOver={toggleHover}
      onMouseOut={toggleHover}
    >
      <Styled.td sx={style.td}>
        <Flex sx={{ alignItems: "center" }}>
          {district.id ? (
            <Fragment>
              <div sx={{ ...style.districtColor, ...{ bg: getDistrictColor(district.id) } }}></div>
              <span>{district.id}</span>
            </Fragment>
          ) : (
            <Fragment>
              <div sx={{ ...style.districtColor, ...style.unassignedColor }}></div>
              <span>∅</span>
            </Fragment>
          )}
        </Flex>
      </Styled.td>
      <Styled.td sx={{ ...style.td, ...style.number, ...{ color: textColor } }}>
        {populationDisplay}
      </Styled.td>
      <Styled.td sx={{ ...style.td, ...style.number, ...{ color: textColor } }}>
        {deviationDisplay}
      </Styled.td>
      <Styled.td sx={style.td}>
        <Tooltip
          placement="top-start"
          content={
            demographics.population > 0 ? (
              <DemographicsTooltip demographics={demographics} />
            ) : (
              <em>
                <strong>Empty district.</strong> Add people to this district to view the race chart
              </em>
            )
          }
        >
          <span>
            <DemographicsChart demographics={demographics} />
          </span>
        </Tooltip>
      </Styled.td>
      <Styled.td sx={{ ...style.td, ...style.number }}>{compactnessDisplay}</Styled.td>
      <Styled.td>
        {isDistrictLocked ? (
          <Tooltip
            content={
              <span>
                <strong>Locked.</strong> Areas from this district cannot be selected
              </span>
            }
          >
            <span onClick={toggleLocked} sx={{ display: "inline-block", lineHeight: "0" }}>
              <Icon name="lock-locked" color="#131f28" size={0.75} />
            </span>
          </Tooltip>
        ) : (
          <Tooltip content="Lock this district">
            <span
              style={{ visibility: isHovered ? "visible" : "hidden" }}
              onClick={toggleLocked}
              sx={{ display: "inline-block", lineHeight: "0" }}
            >
              <Icon name="lock-unlocked" size={0.75} />
            </span>
          </Tooltip>
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

  allGeoUnitIndices(selectedGeounits).forEach(geoUnitIndices => {
    accumulateGeounits(geoUnitIndices, project.districtsDefinition, geoUnitHierarchy);
  });

  return mutableDistrictGeounitAccum.map(baseGeounitIdsForDistrict =>
    getDemographics(baseGeounitIdsForDistrict, staticMetadata, staticDemographics)
  );
};

const getSidebarRows = (
  project: IProject,
  geojson: FeatureCollection<MultiPolygon, DistrictProperties>,
  staticMetadata: IStaticMetadata,
  staticDemographics: ReadonlyArray<Uint8Array | Uint16Array | Uint32Array>,
  selectedDistrictId: number,
  selectedGeounits: GeoUnits,
  geoUnitHierarchy: GeoUnitHierarchy,
  lockedDistricts: LockedDistricts
) => {
  // Aggregated demographics for the geounit selection
  const totalSelectedDemographics = getTotalSelectedDemographics(
    staticMetadata,
    geoUnitHierarchy,
    staticDemographics,
    selectedGeounits
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
