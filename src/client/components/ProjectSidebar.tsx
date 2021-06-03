/** @jsx jsx */
import { sum, sortBy } from "lodash";
import React, { Fragment, memo, useEffect, useMemo, useState } from "react";
import { Box, Button, Flex, jsx, Styled, ThemeUIStyleObject } from "theme-ui";

import {
  DemographicCounts,
  DistrictProperties,
  GeoUnitHierarchy,
  GeoUnits,
  IProject,
  IStaticMetadata,
  LockedDistricts
} from "../../shared/entities";

import {
  setHoveredDistrictId,
  setSelectedDistrictId,
  toggleDistrictLocked
} from "../actions/districtDrawing";
import {
  getDistrictColor,
  negativeChangeColor,
  positiveChangeColor,
  selectedDistrictColor
} from "../constants/colors";
import {
  areAnyGeoUnitsSelected,
  assertNever,
  getPartyColor,
  getTargetPopulation,
  mergeGeoUnits
} from "../functions";
import store from "../store";
import { DistrictGeoJSON, DistrictsGeoJSON, SavingState } from "../types";
import {
  getSavedDistrictSelectedDemographics,
  getTotalSelectedDemographics
} from "../worker-functions";

import DemographicsChart from "./DemographicsChart";
import DemographicsTooltip from "./DemographicsTooltip";
import DistrictOptionsFlyout from "./DistrictOptionsFlyout";
import Icon from "./Icon";
import ProjectSidebarHeader from "./ProjectSidebarHeader";
import Tooltip from "./Tooltip";
import VotingSidebarTooltip from "./VotingSidebarTooltip";

interface LoadingProps {
  readonly isLoading: boolean;
}

const style: ThemeUIStyleObject = {
  sidebar: {
    variant: "sidebar.white",
    ".rc-menu": {
      left: "-139px !important"
    }
  },
  table: {
    mx: 0,
    mb: 2,
    width: "100%"
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
    height: "32px",
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
    pt: 0,
    textAlign: "left",
    verticalAlign: "bottom",
    position: "relative"
  },
  chart: {
    display: "inline-block"
  },
  minorityMajorityFlag: {
    display: "inline-block",
    position: "relative",
    top: "10px"
  },
  districtColor: {
    width: "10px",
    height: "10px",
    borderRadius: "100%",
    mr: 2
  },
  deviationIcon: {
    ml: "15px"
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
  hoveredDistrictId,
  saving,
  avgPopulation,
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
  readonly hoveredDistrictId: number | null;
  readonly saving: SavingState;
  readonly avgPopulation?: number;
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
              {staticMetadata?.voting && (
                <Styled.th sx={{ ...style.th, ...style.number }}>
                  <Tooltip
                    content={
                      "Political lean" +
                      (staticMetadata.labels ? ` (${staticMetadata.labels.election})` : "")
                    }
                  >
                    <span>Pol.</span>
                  </Tooltip>
                </Styled.th>
              )}
              <Styled.th sx={{ ...style.th, ...style.number }}>
                <Tooltip content="Compactness score (Polsby-Popper)">
                  <span>Comp.</span>
                </Tooltip>
              </Styled.th>
              <Styled.th sx={style.th}></Styled.th>
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
                hoveredDistrictId={hoveredDistrictId}
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

export function getCompactnessDisplay(properties: DistrictProperties) {
  return properties.contiguity === "" ? (
    <Tooltip
      placement="top-start"
      content={
        <em>
          <strong>Empty district.</strong> Add people to this district to view computed compactness.
        </em>
      }
    >
      <span sx={{ color: "gray.2" }}>{BLANK_VALUE}</span>
    </Tooltip>
  ) : properties.contiguity === "non-contiguous" ? (
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
  ) : properties.contiguity === "contiguous" ? (
    <Tooltip
      placement="top-start"
      content={
        <span>
          <strong>{Math.floor(properties.compactness * 100)}% compactness.</strong> Calculated using
          the Polsby-Popper measurement
        </span>
      }
    >
      <span>{`${Math.floor(properties.compactness * 100)}%`}</span>
    </Tooltip>
  ) : (
    assertNever(properties.contiguity)
  );
}

// Memoizing the SidebarRow provides a large performance enhancement
const SidebarRow = memo(
  ({
    district,
    selected,
    selectedPopulationDifference,
    demographics,
    votingIds,
    deviation,
    districtId,
    isDistrictLocked,
    isDistrictHovered,
    isReadOnly,
    popDeviationThreshold
  }: {
    readonly district: DistrictGeoJSON;
    readonly selected: boolean;
    readonly selectedPopulationDifference?: number;
    readonly demographics: DemographicCounts;
    readonly votingIds: readonly string[];
    readonly deviation: number;
    readonly districtId: number;
    readonly isDistrictLocked?: boolean;
    readonly isDistrictHovered: boolean;
    readonly isReadOnly: boolean;
    readonly popDeviationThreshold: number;
  }) => {
    const selectedDifference = selectedPopulationDifference || 0;
    const showPopulationChange = selectedDifference !== 0;
    const textColor = showPopulationChange
      ? selectedDifference > 0
        ? positiveChangeColor
        : negativeChangeColor
      : "inherit";
    const intermediatePopulation = demographics.population + selectedDifference;
    const intermediateDeviation =
      deviation + selectedDifference > 0
        ? Math.floor(deviation + selectedDifference)
        : deviation + selectedDifference > -1
        ? Math.abs(Math.ceil(deviation + selectedDifference))
        : Math.ceil(deviation + selectedDifference);
    const populationDisplay = intermediatePopulation.toLocaleString();
    const isMinorityMajority = demographics.white / demographics.population < 0.5;
    const deviationDisplay = `${intermediateDeviation > 0 ? "+" : ""}${Math.round(
      intermediateDeviation
    ).toLocaleString()}`;

    const compactnessDisplay =
      districtId === 0 ? (
        <span sx={style.blankValue}>{BLANK_VALUE}</span>
      ) : (
        getCompactnessDisplay(district.properties)
      );
    const toggleLocked = (e: React.MouseEvent) => {
      e.stopPropagation();
      store.dispatch(toggleDistrictLocked(districtId - 1));
    };

    // The voting dobject can be present but have no data, we treat this case as if it isn't there
    const voting =
      Object.keys(district.properties.voting || {}).length > 0
        ? district.properties.voting
        : undefined;
    const sortedVotes = voting && sortBy(Object.entries(voting), ([, votes]) => -votes);
    const winningParty = sortedVotes && sortedVotes[0][0];
    const color = winningParty && getPartyColor(winningParty);
    const votesTotal = voting ? sum(Object.values(voting)) : 0;
    const marginPct =
      sortedVotes &&
      votesTotal &&
      100 * (sortedVotes[0][1] / votesTotal - sortedVotes[1][1] / votesTotal);
    const votingDisplay =
      voting && winningParty && marginPct !== undefined && voting[winningParty] !== 0 ? (
        <Box sx={{ color }}>{`${winningParty[0].toUpperCase()}+${marginPct.toLocaleString(
          undefined,
          {
            maximumFractionDigits: 0
          }
        )}%`}</Box>
      ) : (
        <span sx={{ color: "gray.2" }}>{BLANK_VALUE}</span>
      );

    return (
      <Styled.tr
        sx={{ bg: selected ? selectedDistrictColor : "inherit", cursor: "pointer" }}
        onClick={() => {
          store.dispatch(setSelectedDistrictId(district.id as number));
        }}
        onMouseEnter={() => {
          store.dispatch(setHoveredDistrictId(district.id as number));
        }}
        onMouseLeave={() => {
          store.dispatch(setHoveredDistrictId(null));
        }}
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
          <span>{deviationDisplay}</span>
          <span sx={style.deviationIcon}>
            {(districtId === 0 && Math.abs(Math.floor(intermediateDeviation)) === 0) ||
            (districtId !== 0 &&
              Math.floor(Math.abs(intermediateDeviation)) <= popDeviationThreshold) ? (
              <Icon name="circle-check-solid" color="#388a64" />
            ) : intermediateDeviation < 0 ? (
              <Icon name="arrow-circle-down-solid" color="gray.4" />
            ) : (
              <Icon name="arrow-circle-up-solid" color="#000000" />
            )}
          </span>
        </Styled.td>
        <Styled.td sx={style.td}>
          <Tooltip
            placement="top-start"
            content={
              demographics.population > 0 ? (
                <DemographicsTooltip
                  demographics={demographics}
                  isMinorityMajority={isMinorityMajority}
                />
              ) : (
                <em>
                  <strong>Empty district.</strong> Add people to this district to view the race
                  chart
                </em>
              )
            }
          >
            <span sx={{ display: "inline-block" }}>
              <span sx={style.chart}>
                <DemographicsChart demographics={demographics} />
              </span>
              {isMinorityMajority && <span sx={style.minorityMajorityFlag}>*</span>}
            </span>
          </Tooltip>
        </Styled.td>
        {voting ? (
          <Styled.td sx={{ ...style.td, ...style.number }}>
            <Tooltip
              placement="top-start"
              content={
                votesTotal !== 0 ? (
                  <VotingSidebarTooltip voting={voting} votingIds={votingIds} />
                ) : (
                  <em>
                    <strong>Empty district.</strong> Add people to this district to view the vote
                    totals
                  </em>
                )
              }
            >
              <span>{votingDisplay}</span>
            </Tooltip>
          </Styled.td>
        ) : null}
        <Styled.td sx={{ ...style.td, ...style.number }}>{compactnessDisplay}</Styled.td>
        <Styled.td>
          {isReadOnly ? null : isDistrictLocked ? (
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
          ) : (
            districtId > 0 && (
              <Tooltip content="Lock this district">
                <Button
                  variant="icon"
                  style={{ visibility: isDistrictHovered ? "visible" : "hidden" }}
                  onClick={toggleLocked}
                  sx={style.lockButton}
                >
                  <Icon name="lock-unlocked" size={0.75} />
                </Button>
              </Tooltip>
            )
          )}
        </Styled.td>
        <Styled.td>
          <DistrictOptionsFlyout districtId={districtId} isDistrictHovered={isDistrictHovered} />
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
  readonly hoveredDistrictId: number | null;
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
  hoveredDistrictId,
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

  const votingIds = useMemo(
    () =>
      staticMetadata && staticMetadata.voting ? staticMetadata.voting.map(props => props.id) : [],
    [staticMetadata]
  );

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
          total: selectedTotals.demographics,
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
            ? feature.properties.demographics.population
            : feature.properties.demographics.population - averagePopulation;

        return (
          <SidebarRow
            district={feature}
            selected={selected}
            selectedPopulationDifference={selectedPopulationDifference || 0}
            demographics={feature.properties.demographics}
            deviation={deviation}
            key={districtId}
            isDistrictLocked={lockedDistricts[districtId - 1]}
            isDistrictHovered={districtId === hoveredDistrictId}
            districtId={districtId}
            isReadOnly={isReadOnly}
            popDeviationThreshold={averagePopulation * (project.populationDeviation / 100)}
            votingIds={votingIds}
          />
        );
      })}
    </React.Fragment>
  );
};

export default ProjectSidebar;
