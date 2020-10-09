/** @jsx jsx */
import React, { memo, useEffect, useState, Fragment } from "react";
import { Box, Button, Flex, jsx, Styled, ThemeUIStyleObject } from "theme-ui";

import {
  CompactnessScore,
  DemographicCounts,
  GeoUnitHierarchy,
  GeoUnits,
  IProject,
  IStaticMetadata,
  LockedDistricts
} from "../../shared/entities";
import { DistrictGeoJSON, DistrictsGeoJSON, SavingState } from "../types";
import {
  areAnyGeoUnitsSelected,
  assertNever,
  getTargetPopulation,
  mergeGeoUnits
} from "../functions";
import {
  getSavedDistrictSelectedDemographics,
  getTotalSelectedDemographics
} from "../worker-functions";
import {
  getDistrictColor,
  negativeChangeColor,
  positiveChangeColor,
  selectedDistrictColor
} from "../constants/colors";
import DemographicsChart from "./DemographicsChart";
import DemographicsTooltip from "./DemographicsTooltip";
import Icon from "./Icon";
import ProjectSidebarHeader from "./ProjectSidebarHeader";
import Tooltip from "./Tooltip";

import { setSelectedDistrictId, toggleDistrictLocked } from "../actions/districtDrawing";
import store from "../store";

interface LoadingProps {
  readonly isLoading: boolean;
}

const style: ThemeUIStyleObject = {
  sidebar: {
    bg: "muted",
    boxShadow: "0 0 0 1px rgba(16,22,26,.1), 0 0 0 rgba(16,22,26,0), 0 1px 1px rgba(16,22,26,.2)",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    height: "100%",
    minWidth: "430px",
    position: "relative",
    color: "gray.8",
    zIndex: 200
  },
  table: {
    width: "calc(100% - 16px)",
    mx: 2,
    mb: 2
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
    userSelect: "none",
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
    p: 2,
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
  },
  lockButton: {
    p: "6px",
    display: "inline-block",
    lineHeight: "0"
  }
};

const ProjectSidebar = ({
  project,
  geojson,
  isLoading,
  staticMetadata,
  selectedDistrictId,
  selectedGeounits,
  highlightedGeounits,
  geoUnitHierarchy,
  lockedDistricts,
  saving,
  isReadOnly
}: {
  readonly project?: IProject;
  readonly geojson?: DistrictsGeoJSON;
  readonly staticMetadata?: IStaticMetadata;
  readonly selectedDistrictId: number;
  readonly selectedGeounits: GeoUnits;
  readonly highlightedGeounits: GeoUnits;
  readonly geoUnitHierarchy?: GeoUnitHierarchy;
  readonly lockedDistricts: LockedDistricts;
  readonly saving: SavingState;
  readonly isReadOnly: boolean;
} & LoadingProps) => {
  return (
    <Flex sx={style.sidebar} className="map-sidebar">
      <ProjectSidebarHeader
        selectedGeounits={selectedGeounits}
        isLoading={isLoading}
        saving={saving}
      />
      <Box sx={{ overflowY: "auto", flex: 1 }}>
        <Styled.table sx={style.table}>
          <thead>
            <Styled.tr>
              <Styled.th sx={style.th}>
                <Tooltip content="District number">
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
                  <span className="deviation-header">Deviation</span>
                </Tooltip>
              </Styled.th>
              <Styled.th sx={style.th}>
                <Tooltip content="Demographics by race">
                  <span>Race</span>
                </Tooltip>
              </Styled.th>
              <Styled.th sx={{ ...style.th, ...style.number }}>
                <Tooltip content="Compactness score (Polsby-Popper)">
                  <span>Comp.</span>
                </Tooltip>
              </Styled.th>
              <Styled.th sx={style.th}></Styled.th>
            </Styled.tr>
          </thead>
          <tbody>
            {project && geojson && staticMetadata && geoUnitHierarchy && (
              <SidebarRows
                project={project}
                geojson={geojson}
                staticMetadata={staticMetadata}
                selectedDistrictId={selectedDistrictId}
                selectedGeounits={selectedGeounits}
                highlightedGeounits={highlightedGeounits}
                lockedDistricts={lockedDistricts}
                saving={saving}
                isReadOnly={isReadOnly}
              />
            )}
          </tbody>
        </Styled.table>
      </Box>
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
      <span sx={{ color: "gray.2" }}>{BLANK_VALUE}</span>
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

// Memoizing the SidebarRow provides a large performance enhancement
const SidebarRow = memo(
  ({
    district,
    selected,
    selectedPopulationDifference,
    demographics,
    deviation,
    districtId,
    isDistrictLocked,
    isReadOnly
  }: {
    readonly district: DistrictGeoJSON;
    readonly selected: boolean;
    readonly selectedPopulationDifference?: number;
    readonly demographics: { readonly [id: string]: number };
    readonly deviation: number;
    readonly districtId: number;
    readonly isDistrictLocked?: boolean;
    readonly isReadOnly: boolean;
  }) => {
    const [isHovered, setHover] = useState(false);
    const selectedDifference = selectedPopulationDifference || 0;
    const showPopulationChange = selectedDifference !== 0;
    const textColor = showPopulationChange
      ? selectedDifference > 0
        ? positiveChangeColor
        : negativeChangeColor
      : "inherit";
    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    const intermediatePopulation = district.properties.population + selectedDifference;
    const intermediateDeviation = deviation + selectedDifference;
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
        className={district.id ? null : "unassigned-row"}
      >
        <Styled.td sx={style.td}>
          <Flex sx={{ alignItems: "center" }}>
            {district.id ? (
              <Fragment>
                <div
                  sx={{ ...style.districtColor, ...{ bg: getDistrictColor(district.id) } }}
                ></div>
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
                  <strong>Empty district.</strong> Add people to this district to view the race
                  chart
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
              <Button variant="icon" onClick={toggleLocked} sx={style.lockButton}>
                <Icon name="lock-locked" color="#131f28" size={0.75} />
              </Button>
            </Tooltip>
          ) : !isReadOnly ? (
            <Tooltip content="Lock this district">
              <Button
                variant="icon"
                style={{ visibility: isHovered ? "visible" : "hidden" }}
                onClick={toggleLocked}
                sx={style.lockButton}
              >
                <Icon name="lock-unlocked" size={0.75} />
              </Button>
            </Tooltip>
          ) : null}
        </Styled.td>
      </Styled.tr>
    );
  }
);

interface SidebarRowsProps {
  readonly project: IProject;
  readonly geojson: DistrictsGeoJSON;
  readonly staticMetadata: IStaticMetadata;
  readonly selectedDistrictId: number;
  readonly selectedGeounits: GeoUnits;
  readonly highlightedGeounits: GeoUnits;
  readonly lockedDistricts: LockedDistricts;
  readonly saving: SavingState;
  readonly isReadOnly: boolean;
}

const SidebarRows = ({
  project,
  geojson,
  staticMetadata,
  selectedDistrictId,
  selectedGeounits,
  highlightedGeounits,
  lockedDistricts,
  isReadOnly
}: SidebarRowsProps) => {
  // Results of the asynchronous demographics calculation. The two calculations have been
  // combined into a single object here, because we want both updates to the state to happen
  // at the same time to prevent sidebar value flickering.
  const [selectedDemographics, setSelectedDemographics] = useState<
    | { readonly total: DemographicCounts; readonly savedDistrict: readonly DemographicCounts[] }
    | undefined
  >(undefined);

  // Asynchronously recalculate demographics on state changes with web workers
  useEffect(() => {
    // eslint-disable-next-line
    let outdated = false;

    async function getData() {
      // Combine selected and highlighted to show calculations in real time
      const combinedSelection = mergeGeoUnits(selectedGeounits, highlightedGeounits);

      // Aggregated demographics for the geounit selection
      const selectedTotals = await getTotalSelectedDemographics(
        staticMetadata,
        project.regionConfig.s3URI,
        combinedSelection
      );
      // The demographic composition of the selection for each saved district
      const districtTotals = await getSavedDistrictSelectedDemographics(
        project,
        staticMetadata,
        combinedSelection
      );

      // Don't overwrite current results with outdated ones
      !outdated &&
        setSelectedDemographics({
          total: selectedTotals,
          savedDistrict: districtTotals
        });
    }

    // When there aren't any geounits highlighted or selected, there is no need to run the
    // asynchronous calculation; it can simply be cleared out. This additional logic prevents
    // the sidebar values from flickering after save.
    areAnyGeoUnitsSelected(selectedGeounits) || areAnyGeoUnitsSelected(highlightedGeounits)
      ? void getData()
      : setSelectedDemographics(undefined);

    return () => {
      outdated = true;
    };
  }, [project, staticMetadata, selectedGeounits, highlightedGeounits]);

  const averagePopulation = getTargetPopulation(geojson, project);

  return (
    <React.Fragment>
      {geojson.features.map(feature => {
        const districtId = typeof feature.id === "number" ? feature.id : 0;
        const selected = districtId === selectedDistrictId;
        const demographics = feature.properties;
        const selectedPopulation = selectedDemographics?.savedDistrict?.[districtId]?.population;
        const totalSelectedDemographics = selectedDemographics?.total;
        const selectedPopulationDifference =
          selectedPopulation !== undefined && totalSelectedDemographics !== undefined && selected
            ? totalSelectedDemographics.population - selectedPopulation
            : selectedPopulation !== undefined
            ? -1 * selectedPopulation
            : undefined;

        // The population goal for the unassigned district is 0,
        // so it's deviation is equal to its population
        const deviation =
          districtId === 0
            ? feature.properties.population
            : feature.properties.population - averagePopulation;

        return (
          <SidebarRow
            district={feature}
            selected={selected}
            selectedPopulationDifference={selectedPopulationDifference || 0}
            demographics={demographics}
            deviation={deviation}
            key={districtId}
            isDistrictLocked={lockedDistricts.has(districtId)}
            districtId={districtId}
            isReadOnly={isReadOnly}
          />
        );
      })}
    </React.Fragment>
  );
};

export default ProjectSidebar;
