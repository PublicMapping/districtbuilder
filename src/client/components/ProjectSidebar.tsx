/** @jsx jsx */
import React, { Fragment, memo, useEffect, useState } from "react";
import { Box, Button, Flex, jsx, Styled, ThemeUIStyleObject } from "theme-ui";

import {
  DemographicCounts,
  DistrictProperties,
  GeoUnitHierarchy,
  GeoUnits,
  IProject,
  IStaticMetadata,
  LockedDistricts,
  MetricField
} from "../../shared/entities";

import {
  setHoveredDistrictId,
  setSelectedDistrictId,
  toggleDistrictLocked
} from "../actions/districtDrawing";
import { updatePinnedMetrics } from "../actions/projectData";
import {
  getDistrictColor,
  negativeChangeColor,
  positiveChangeColor,
  selectedDistrictColor
} from "../constants/colors";
import {
  areAnyGeoUnitsSelected,
  assertNever,
  getTargetPopulation,
  mergeGeoUnits,
  hasMultipleElections,
  calculatePartyVoteShare,
  computeDemographicSplit,
  has16Election,
  has20Election,
  demographicsHasOther,
  isMajorityMinority
} from "../functions";
import store from "../store";
import { DistrictGeoJSON, DistrictsGeoJSON, SavingState } from "../types";
import {
  getSavedDistrictSelectedDemographics,
  getTotalSelectedDemographics
} from "../worker-functions";
import VotingSidebarTooltip from "./VotingSidebarTooltip";
import DemographicsChart from "./DemographicsChart";
import DemographicsTooltip from "./DemographicsTooltip";
import DistrictOptionsFlyout from "./DistrictOptionsFlyout";
import Icon from "./Icon";
import ProjectSidebarHeader from "./ProjectSidebarHeader";
import Tooltip from "./Tooltip";
import PVIDisplay from "./PVIDisplay";

interface LoadingProps {
  readonly isLoading: boolean;
}

interface MetricHeader {
  readonly metric: MetricField;
  readonly text: string;
  readonly tooltip: string;
}

const style: ThemeUIStyleObject = {
  sidebar: {
    variant: "sidebar.white",
    ".rc-menu": {
      left: "-139px !important"
    }
  },
  sidebarExpanded: {
    variant: "sidebar.expandedWhite",
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
  },
  pinButton: {
    variant: "buttons.icon",
    fontSize: 1,
    py: 1
  }
};

const MetricPinButton = ({
  metric,
  pinnedMetrics,
  saving
}: {
  readonly metric: MetricField;
  readonly pinnedMetrics: readonly MetricField[];
  readonly saving: SavingState;
}) => {
  const metricIsPinned = pinnedMetrics.includes(metric);
  const otherMetrics = pinnedMetrics.filter(m => m !== metric);
  return (
    <React.Fragment>
      {metricIsPinned ? (
        <Button
          sx={style.pinButton}
          disabled={saving === "saving"}
          onClick={() => store.dispatch(updatePinnedMetrics([...otherMetrics]))}
        >
          <Icon name="thumbtack-solid" />
        </Button>
      ) : (
        <Button
          sx={style.pinButton}
          disabled={saving === "saving"}
          onClick={() => store.dispatch(updatePinnedMetrics([...pinnedMetrics, metric]))}
        >
          <Icon name="thumbtack" />
        </Button>
      )}
    </React.Fragment>
  );
};

const PinnableMetricHeader = ({
  metric,
  pinnedMetrics,
  text,
  tooltip,
  saving,
  expandedProjectMetrics
}: {
  readonly metric: MetricField;
  readonly pinnedMetrics: readonly MetricField[];
  readonly text: string;
  readonly tooltip: string;
  readonly saving: SavingState;
  readonly expandedProjectMetrics: boolean;
}) => {
  return (
    <Styled.th sx={{ ...style.th, ...style.number }}>
      <Tooltip content={tooltip}>
        <span>{text}</span>
      </Tooltip>
      {pinnedMetrics && expandedProjectMetrics && (
        <MetricPinButton metric={metric} pinnedMetrics={pinnedMetrics} saving={saving} />
      )}
    </Styled.th>
  );
};

const ProjectSidebar = ({
  project,
  geojson,
  isLoading,
  staticMetadata,
  selectedDistrictId,
  selectedGeounits,
  highlightedGeounits,
  expandedProjectMetrics,
  geoUnitHierarchy,
  lockedDistricts,
  hoveredDistrictId,
  saving,
  isReadOnly
}: {
  readonly project?: IProject;
  readonly geojson?: DistrictsGeoJSON;
  readonly staticMetadata?: IStaticMetadata;
  readonly selectedDistrictId: number;
  readonly selectedGeounits: GeoUnits;
  readonly highlightedGeounits: GeoUnits;
  readonly expandedProjectMetrics: boolean;
  readonly geoUnitHierarchy?: GeoUnitHierarchy;
  readonly lockedDistricts: LockedDistricts;
  readonly hoveredDistrictId: number | null;
  readonly saving: SavingState;
  readonly isReadOnly: boolean;
} & LoadingProps) => {
  const multElections = hasMultipleElections(staticMetadata);
  const has2016Election = has16Election(staticMetadata);
  const has2020Election = has20Election(staticMetadata);
  const polLabel = multElections
    ? "Cook Partisan Voting Index (2016 / 2020)"
    : "Political Lean (2016)";
  const otherDemographics = demographicsHasOther(staticMetadata);
  const hasElectionData = has2016Election || has2020Election || false;
  const coreMetricHeaders: readonly MetricHeader[] = [
    {
      metric: "population",
      text: "Population",
      tooltip: "Number of people in this district"
    },
    {
      metric: "populationDeviation",
      text: "Deviation",
      tooltip: "Population needed to match the ideal number for this district"
    },
    {
      metric: "raceChart",
      text: "Race",
      tooltip: "Demographics by race"
    },
    {
      metric: "whitePopulation",
      text: "White",
      tooltip: "Number of people in this district"
    },
    {
      metric: "blackPopulation",
      text: "Black",
      tooltip: "Number of people in this district"
    },
    {
      metric: "asianPopulation",
      text: "Asian",
      tooltip: "Number of people in this district"
    },
    {
      metric: "hispanicPopulation",
      text: "Hispanic",
      tooltip: "Number of people in this district"
    }
  ];

  const allDemographicHeaders: readonly MetricHeader[] = otherDemographics
    ? [
        ...coreMetricHeaders,
        {
          metric: "otherPopulation",
          text: "Other",
          tooltip: "Number of people in this district"
        }
      ]
    : [
        ...coreMetricHeaders,
        {
          metric: "nativePopulation",
          text: "Native",
          tooltip: "Number of people in this district"
        },
        {
          metric: "pacificPopulation",
          text: "Pacific",
          tooltip: "Number of people in this district"
        }
      ];

  const electionMetricHeaders: readonly MetricHeader[] =
    has2020Election && has2016Election
      ? [
          {
            metric: "pvi",
            text: "PVI",
            tooltip: polLabel
          },
          {
            metric: "dem16",
            text: "Dem. '16",
            tooltip: "Democratic vote share 2016"
          },
          {
            metric: "rep16",
            text: "Rep. '16",
            tooltip: "Republican vote share 2016"
          },
          {
            metric: "other16",
            text: "Other '16",
            tooltip: "Other vote share 2016"
          },
          {
            metric: "dem20",
            text: "Dem. '20",
            tooltip: "Democratic vote share 2020"
          },
          {
            metric: "rep20",
            text: "Rep. '20",
            tooltip: "Republican vote share 2020"
          },
          {
            metric: "other20",
            text: "Other '20",
            tooltip: "Other vote share 2020"
          }
        ]
      : has2016Election
      ? [
          {
            metric: "pvi",
            text: "Pol.",
            tooltip: polLabel
          },
          {
            metric: "dem16",
            text: "Dem. '16",
            tooltip: "Democratic vote share 2016"
          },
          {
            metric: "rep16",
            text: "Rep. '16",
            tooltip: "Republican vote share 2016"
          },
          {
            metric: "other16",
            text: "Other '16",
            tooltip: "Other vote share 2016"
          }
        ]
      : [];
  /// This is a little wonky to preserve the column ordering where PVI is displayed before compactness
  const metricHeaders: readonly MetricHeader[] = [
    ...allDemographicHeaders,
    ...electionMetricHeaders,
    {
      metric: "compactness",
      text: "Comp.",
      tooltip: "Compactness score (Polsby-Popper)"
    }
  ];
  const pinnedMetrics: readonly MetricField[] | undefined = project?.pinnedMetricFields;
  return (
    <Flex
      sx={expandedProjectMetrics ? style.sidebarExpanded : style.sidebar}
      className="map-sidebar"
    >
      <ProjectSidebarHeader
        selectedGeounits={selectedGeounits}
        isLoading={isLoading}
        expandedProjectMetrics={expandedProjectMetrics}
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
              {pinnedMetrics &&
                metricHeaders.map(
                  metric =>
                    (expandedProjectMetrics || pinnedMetrics.includes(metric.metric)) && (
                      <PinnableMetricHeader
                        metric={metric.metric}
                        text={metric.text}
                        tooltip={metric.tooltip}
                        pinnedMetrics={pinnedMetrics}
                        saving={saving}
                        key={metric.metric}
                        expandedProjectMetrics={expandedProjectMetrics}
                      />
                    )
                )}
              <Styled.th sx={style.th}></Styled.th>
              <Styled.th sx={style.th}></Styled.th>
            </Styled.tr>
          </thead>
          <tbody>
            {project && geojson && staticMetadata && geoUnitHierarchy && pinnedMetrics && (
              <SidebarRows
                project={project}
                geojson={geojson}
                staticMetadata={staticMetadata}
                selectedDistrictId={selectedDistrictId}
                hoveredDistrictId={hoveredDistrictId}
                selectedGeounits={selectedGeounits}
                pinnedMetrics={pinnedMetrics}
                expandedProjectMetrics={expandedProjectMetrics}
                highlightedGeounits={highlightedGeounits}
                hasElectionData={hasElectionData}
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
    pinnedMetricFields,
    selected,
    selectedPopulationDifference,
    expandedProjectMetrics,
    demographics,
    deviation,
    districtId,
    isDistrictLocked,
    isDistrictHovered,
    hasElectionData,
    isReadOnly,
    popDeviation,
    popDeviationThreshold
  }: {
    readonly district: DistrictGeoJSON;
    readonly pinnedMetricFields: readonly MetricField[];
    readonly selected: boolean;
    readonly selectedPopulationDifference?: number;
    readonly expandedProjectMetrics: boolean;
    readonly demographics: DemographicCounts;
    readonly deviation: number;
    readonly districtId: number;
    readonly isDistrictLocked?: boolean;
    readonly isDistrictHovered: boolean;
    readonly hasElectionData: boolean;
    readonly isReadOnly: boolean;
    readonly popDeviation: number;
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
    const intermediateDeviation = Math.ceil(deviation + selectedDifference);
    const absoluteDeviation = Math.floor(Math.abs(deviation + selectedDifference));
    const populationDisplay = intermediatePopulation.toLocaleString();
    const deviationDisplay =
      intermediateDeviation === 0
        ? "0"
        : `${intermediateDeviation > 0 ? "+" : ""}${intermediateDeviation.toLocaleString()}`;

    const otherDemographics = "other" in demographics;

    function getPartyVoteShareDisplay(party1: number, party2: number, party3: number): string {
      const percent = calculatePartyVoteShare(party1, party2, party3);
      return percent ? percent.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "0";
    }

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

    // The voting object can be present but have no data, we treat this case as if it isn't there
    const voting =
      Object.keys(district.properties.voting || {}).length > 0
        ? district.properties.voting
        : undefined;

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
        {(pinnedMetricFields.includes("population") || expandedProjectMetrics) && (
          <Styled.td sx={{ ...style.td, ...style.number, ...{ color: textColor } }}>
            {populationDisplay}
          </Styled.td>
        )}
        {(pinnedMetricFields.includes("populationDeviation") || expandedProjectMetrics) && (
          <Styled.td sx={{ ...style.td, ...style.number, ...{ color: textColor } }}>
            <Tooltip
              placement="top-start"
              content={
                districtId !== 0 ? (
                  Math.abs(intermediateDeviation) <= popDeviationThreshold ? (
                    <div>
                      This district meets the {popDeviation}% population deviation tolerance
                    </div>
                  ) : intermediateDeviation < 0 ? (
                    <div>
                      Add{" "}
                      {Math.floor(
                        Math.abs(intermediateDeviation) + popDeviationThreshold
                      ).toLocaleString()}{" "}
                      people to this district to meet the {popDeviation}% population deviation
                      tolerance
                    </div>
                  ) : (
                    <div>
                      Remove{" "}
                      {Math.floor(intermediateDeviation - popDeviationThreshold).toLocaleString()}{" "}
                      people from this district to meet the {popDeviation}% population deviation
                      tolerance
                    </div>
                  )
                ) : intermediateDeviation > 0 ? (
                  <div>
                    This population is not assigned to any district. Make sure all population is
                    assigned to a district to complete your map.
                  </div>
                ) : (
                  <div>All population has been assigned to a district.</div>
                )
              }
            >
              <span>
                <span>{deviationDisplay}</span>
                <span sx={style.deviationIcon}>
                  {(districtId === 0 && absoluteDeviation === 0) ||
                  (districtId !== 0 && absoluteDeviation <= popDeviationThreshold) ? (
                    <Icon name="circle-check-solid" color="#388a64" />
                  ) : intermediateDeviation < 0 ? (
                    <Icon name="arrow-circle-down-solid" color="gray.4" />
                  ) : (
                    <Icon name="arrow-circle-up-solid" color="#000000" />
                  )}
                </span>
              </span>
            </Tooltip>
          </Styled.td>
        )}
        {(pinnedMetricFields.includes("raceChart") || expandedProjectMetrics) && (
          <Styled.td sx={style.td}>
            <Tooltip
              placement="top-start"
              content={
                demographics.population > 0 ? (
                  <DemographicsTooltip
                    demographics={demographics}
                    isMajorityMinority={isMajorityMinority(district)}
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
                {isMajorityMinority(district) && <span sx={style.minorityMajorityFlag}>*</span>}
              </span>
            </Tooltip>
          </Styled.td>
        )}
        {(pinnedMetricFields.includes("whitePopulation") || expandedProjectMetrics) && (
          <Styled.td sx={{ ...style.td, ...style.number, ...{ color: textColor } }}>
            <span>{computeDemographicSplit(demographics.white, intermediatePopulation)}%</span>
          </Styled.td>
        )}
        {(pinnedMetricFields.includes("blackPopulation") || expandedProjectMetrics) && (
          <Styled.td sx={{ ...style.td, ...style.number, ...{ color: textColor } }}>
            <span>{computeDemographicSplit(demographics.black, intermediatePopulation)}%</span>
          </Styled.td>
        )}
        {(pinnedMetricFields.includes("asianPopulation") || expandedProjectMetrics) && (
          <Styled.td sx={{ ...style.td, ...style.number, ...{ color: textColor } }}>
            <span>{computeDemographicSplit(demographics.asian, intermediatePopulation)}%</span>
          </Styled.td>
        )}
        {(pinnedMetricFields.includes("hispanicPopulation") || expandedProjectMetrics) && (
          <Styled.td sx={{ ...style.td, ...style.number, ...{ color: textColor } }}>
            <span>{computeDemographicSplit(demographics.hispanic, intermediatePopulation)}%</span>
          </Styled.td>
        )}
        {!otherDemographics &&
          (pinnedMetricFields.includes("nativePopulation") || expandedProjectMetrics) && (
            <Styled.td sx={{ ...style.td, ...style.number, ...{ color: textColor } }}>
              <span>{computeDemographicSplit(demographics.native, intermediatePopulation)}%</span>
            </Styled.td>
          )}
        {!otherDemographics &&
          (pinnedMetricFields.includes("pacificPopulation") || expandedProjectMetrics) && (
            <Styled.td sx={{ ...style.td, ...style.number, ...{ color: textColor } }}>
              <span>{computeDemographicSplit(demographics.pacific, intermediatePopulation)}%</span>
            </Styled.td>
          )}
        {otherDemographics &&
          (pinnedMetricFields.includes("otherPopulation") || expandedProjectMetrics) && (
            <Styled.td sx={{ ...style.td, ...style.number, ...{ color: textColor } }}>
              <span>{computeDemographicSplit(demographics.other, intermediatePopulation)}%</span>
            </Styled.td>
          )}
        {hasElectionData
          ? (pinnedMetricFields.includes("pvi") || expandedProjectMetrics) && (
              <Styled.td sx={{ ...style.td, ...style.number }}>
                <PVIDisplay properties={district.properties} />
              </Styled.td>
            )
          : null}
        {voting && "democrat16" in voting
          ? (pinnedMetricFields.includes("dem16") || expandedProjectMetrics) && (
              <Styled.td sx={{ ...style.td, ...style.number }}>
                <Tooltip
                  placement="top-start"
                  content={
                    demographics.population > 0 ? (
                      <VotingSidebarTooltip voting={voting} />
                    ) : (
                      <em>
                        <strong>Empty district.</strong> Add people to this district to view the
                        vote totals
                      </em>
                    )
                  }
                >
                  <span>
                    {getPartyVoteShareDisplay(
                      voting.democrat16,
                      voting.republican16,
                      voting["other party16"]
                    )}
                    %
                  </span>
                </Tooltip>
              </Styled.td>
            )
          : null}
        {voting && "republican16" in voting
          ? (pinnedMetricFields.includes("rep16") || expandedProjectMetrics) && (
              <Styled.td sx={{ ...style.td, ...style.number }}>
                <Tooltip
                  placement="top-start"
                  content={
                    demographics.population > 0 ? (
                      <VotingSidebarTooltip voting={voting} />
                    ) : (
                      <em>
                        <strong>Empty district.</strong> Add people to this district to view the
                        vote totals
                      </em>
                    )
                  }
                >
                  <span>
                    {getPartyVoteShareDisplay(
                      voting.republican16,
                      voting.democrat16,
                      voting["other party16"]
                    )}
                    %
                  </span>
                </Tooltip>
              </Styled.td>
            )
          : null}
        {voting && "other party16" in voting
          ? (pinnedMetricFields.includes("other16") || expandedProjectMetrics) && (
              <Styled.td sx={{ ...style.td, ...style.number }}>
                <Tooltip
                  placement="top-start"
                  content={
                    demographics.population > 0 ? (
                      <VotingSidebarTooltip voting={voting} />
                    ) : (
                      <em>
                        <strong>Empty district.</strong> Add people to this district to view the
                        vote totals
                      </em>
                    )
                  }
                >
                  <span>
                    {getPartyVoteShareDisplay(
                      voting["other party16"],
                      voting.republican16,
                      voting.democrat16
                    )}
                    %
                  </span>
                </Tooltip>
              </Styled.td>
            )
          : null}
        {voting && "democrat20" in voting
          ? (pinnedMetricFields.includes("dem20") || expandedProjectMetrics) && (
              <Styled.td sx={{ ...style.td, ...style.number }}>
                <Tooltip
                  placement="top-start"
                  content={
                    demographics.population > 0 ? (
                      <VotingSidebarTooltip voting={voting} />
                    ) : (
                      <em>
                        <strong>Empty district.</strong> Add people to this district to view the
                        vote totals
                      </em>
                    )
                  }
                >
                  <span>
                    {getPartyVoteShareDisplay(
                      voting.democrat20,
                      voting.republican20,
                      voting["other party20"]
                    )}
                    %
                  </span>
                </Tooltip>
              </Styled.td>
            )
          : null}
        {voting && "republican20" in voting
          ? (pinnedMetricFields.includes("rep20") || expandedProjectMetrics) && (
              <Styled.td sx={{ ...style.td, ...style.number }}>
                <Tooltip
                  placement="top-start"
                  content={
                    demographics.population > 0 ? (
                      <VotingSidebarTooltip voting={voting} />
                    ) : (
                      <em>
                        <strong>Empty district.</strong> Add people to this district to view the
                        vote totals
                      </em>
                    )
                  }
                >
                  <span>
                    {getPartyVoteShareDisplay(
                      voting.republican20,
                      voting.democrat20,
                      voting["other party20"]
                    )}
                    %
                  </span>
                </Tooltip>
              </Styled.td>
            )
          : null}
        {voting && "other party20" in voting
          ? (pinnedMetricFields.includes("other20") || expandedProjectMetrics) && (
              <Styled.td sx={{ ...style.td, ...style.number }}>
                <Tooltip
                  placement="top-start"
                  content={
                    demographics.population > 0 ? (
                      <VotingSidebarTooltip voting={voting} />
                    ) : (
                      <em>
                        <strong>Empty district.</strong> Add people to this district to view the
                        vote totals
                      </em>
                    )
                  }
                >
                  <span>
                    {getPartyVoteShareDisplay(
                      voting["other party20"],
                      voting.republican20,
                      voting.democrat20
                    )}
                    %
                  </span>
                </Tooltip>
              </Styled.td>
            )
          : null}
        {(pinnedMetricFields.includes("compactness") || expandedProjectMetrics) && (
          <Styled.td sx={{ ...style.td, ...style.number }}>{compactnessDisplay}</Styled.td>
        )}
        {!expandedProjectMetrics && (
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
        )}
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
  readonly expandedProjectMetrics: boolean;
  readonly pinnedMetrics: readonly MetricField[];
  readonly highlightedGeounits: GeoUnits;
  readonly lockedDistricts: LockedDistricts;
  readonly hasElectionData: boolean;
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
  expandedProjectMetrics,
  pinnedMetrics,
  highlightedGeounits,
  hasElectionData,
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

  const averagePopulation = getTargetPopulation(geojson);

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

        return feature.properties.populationDeviation !== undefined ? (
          <SidebarRow
            district={feature}
            selected={selected}
            pinnedMetricFields={pinnedMetrics}
            selectedPopulationDifference={selectedPopulationDifference || 0}
            expandedProjectMetrics={expandedProjectMetrics}
            demographics={feature.properties.demographics}
            deviation={feature.properties.populationDeviation}
            key={districtId}
            isDistrictLocked={lockedDistricts[districtId - 1]}
            isDistrictHovered={districtId === hoveredDistrictId}
            hasElectionData={hasElectionData}
            districtId={districtId}
            isReadOnly={isReadOnly}
            popDeviation={project.populationDeviation}
            popDeviationThreshold={averagePopulation * (project.populationDeviation / 100)}
          />
        ) : null;
      })}
    </React.Fragment>
  );
};

export default ProjectSidebar;
