/** @jsx jsx */
import React, { Fragment, memo, useEffect, useState } from "react";
import { Box, Button, Flex, jsx, Styled, ThemeUIStyleObject } from "theme-ui";
import { pickBy, sum } from "lodash";

import {
  DemographicCounts,
  DistrictProperties,
  GeoUnitHierarchy,
  GeoUnits,
  IProject,
  IStaticMetadata,
  IReferenceLayer,
  LockedDistricts,
  MetricsList,
  VotingMetricsList,
  ReferenceLayerId,
  DemographicsGroup,
  GroupTotal
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
  mergeGeoUnits,
  hasMultipleElections,
  calculatePartyVoteShare,
  computeDemographicSplit,
  has16Election,
  has20Election,
  isMajorityMinority,
  getMajorityRaceDisplay,
  capitalizeFirstLetter,
  getPopulationPerRepresentative
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
import ProjectReferenceLayers from "./ProjectReferenceLayers";
import { Resource } from "../resource";
import {
  getVotingMetricFields,
  getDemographicsMetricFields,
  getDemographicsGroups
} from "../../shared/functions";
import { CORE_METRIC_FIELDS } from "../../shared/constants";

interface LoadingProps {
  readonly isLoading: boolean;
}

interface MetricHeader {
  readonly metric: string;
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
    textAlign: "left",
    verticalAlign: "bottom",
    position: "relative"
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
    ml: "6px",
    position: "relative",
    top: "1px"
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
  isReadOnly
}: {
  readonly metric: string;
  readonly pinnedMetrics: readonly string[];
  readonly isReadOnly: boolean;
}) => {
  const metricIsPinned = pinnedMetrics.includes(metric);
  const otherMetrics = pinnedMetrics.filter(m => m !== metric);
  return (
    <React.Fragment>
      {metricIsPinned ? (
        <Button
          sx={style.pinButton}
          onClick={() => {
            store.dispatch(
              updatePinnedMetrics({ pinnedMetricFields: [...otherMetrics], isReadOnly })
            );
          }}
        >
          <Icon name="thumbtack-solid" />
        </Button>
      ) : (
        <Button
          sx={style.pinButton}
          onClick={() => {
            store.dispatch(
              updatePinnedMetrics({ pinnedMetricFields: [...pinnedMetrics, metric], isReadOnly })
            );
          }}
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
  expandedProjectMetrics,
  isReadOnly
}: {
  readonly metric: string;
  readonly pinnedMetrics: readonly string[];
  readonly text: string;
  readonly tooltip: string;
  readonly expandedProjectMetrics: boolean;
  readonly isReadOnly: boolean;
}) => {
  return (
    <Styled.th sx={{ ...style.th, ...style.number }}>
      <Tooltip content={tooltip}>
        <span>{text}</span>
      </Tooltip>
      {pinnedMetrics && expandedProjectMetrics && (
        <MetricPinButton metric={metric} pinnedMetrics={pinnedMetrics} isReadOnly={isReadOnly} />
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
  referenceLayers,
  showReferenceLayers,
  hoveredDistrictId,
  saving,
  isReadOnly,
  pinnedMetrics,
  populationKey
}: {
  readonly project?: IProject;
  readonly geojson?: DistrictsGeoJSON;
  readonly staticMetadata?: IStaticMetadata;
  readonly selectedDistrictId: number;
  readonly selectedGeounits: GeoUnits;
  readonly highlightedGeounits: GeoUnits;
  readonly expandedProjectMetrics: boolean;
  readonly referenceLayers: Resource<readonly IReferenceLayer[]>;
  readonly showReferenceLayers: ReadonlySet<ReferenceLayerId>;
  readonly geoUnitHierarchy?: GeoUnitHierarchy;
  readonly lockedDistricts: LockedDistricts;
  readonly hoveredDistrictId: number | null;
  readonly saving: SavingState;
  readonly isReadOnly: boolean;
  readonly pinnedMetrics?: readonly string[];
  readonly populationKey: GroupTotal;
} & LoadingProps) => {
  const multElections = hasMultipleElections(staticMetadata);
  const has2016Election = has16Election(staticMetadata);
  const has2020Election = has20Election(staticMetadata);
  const polLabel = multElections
    ? "Cook Partisan Voting Index (2016 / 2020)"
    : "Political Lean (2016)";
  const hasElectionData = has2016Election || has2020Election;

  const getTooltip = (id: string): string =>
    staticMetadata?.demographicsGroups?.find(
      group => group.total === id || group.subgroups.includes(id)
    )?.tooltip || "Number of people in this district";

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
    }
  ];

  const demographicsMetricFields = staticMetadata && getDemographicsMetricFields(staticMetadata);

  const demographicsGroups: readonly DemographicsGroup[] = staticMetadata
    ? getDemographicsGroups(staticMetadata)
    : [];

  const demographicHeaders: readonly MetricHeader[] =
    (demographicsMetricFields &&
      demographicsMetricFields.flatMap(([id, metric]) =>
        id in CORE_METRIC_FIELDS
          ? []
          : [
              {
                text: capitalizeFirstLetter(id),
                metric: metric,
                tooltip: getTooltip(id)
              }
            ]
      )) ||
    [];

  const coreLength = demographicsGroups[0]?.subgroups?.length || 0;
  const coreDemographicHeaders = demographicHeaders.slice(0, coreLength);
  const extraDemographicHeaders = demographicHeaders.slice(coreLength).flat();

  const electionText = {
    dem16: "Dem. '16",
    rep16: "Rep. '16",
    other16: "Other '16",
    dem20: "Dem. '20",
    rep20: "Rep. '20",
    other20: "Other '20"
  };

  const electionTooltip = {
    dem16: "Democratic vote share 2016",
    rep16: "Republican vote share 2016",
    other16: "Other vote share 2016",
    dem20: "Democratic vote share 2020",
    rep20: "Republican vote share 2020",
    other20: "Other vote share 2020"
  };

  const electionMetricHeaders: readonly MetricHeader[] =
    (staticMetadata &&
      getVotingMetricFields(staticMetadata)?.map(([, metric]) => ({
        text: electionText[metric],
        tooltip: electionTooltip[metric],
        metric
      }))) ||
    [];

  const metricHeaders: readonly MetricHeader[] = [
    ...coreMetricHeaders,
    ...coreDemographicHeaders,
    {
      metric: "majorityRace",
      text: "Majority race",
      tooltip: "Majority race"
    },
    ...extraDemographicHeaders,
    ...(hasElectionData
      ? [
          {
            metric: "pvi",
            text: "PVI",
            tooltip: polLabel
          },
          ...electionMetricHeaders
        ]
      : []),
    {
      metric: "compactness",
      text: "Comp.",
      tooltip: "Compactness score (Polsby-Popper)"
    }
  ];

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
                        key={metric.metric}
                        expandedProjectMetrics={expandedProjectMetrics}
                        isReadOnly={isReadOnly}
                      />
                    )
                )}
              <Styled.th sx={style.th}></Styled.th>
            </Styled.tr>
          </thead>
          <tbody>
            {project && geojson && staticMetadata && geoUnitHierarchy && pinnedMetrics && (
              <SidebarRows
                project={project}
                geojson={geojson}
                staticMetadata={staticMetadata}
                demographicsGroups={demographicsGroups}
                selectedDistrictId={selectedDistrictId}
                hoveredDistrictId={hoveredDistrictId}
                selectedGeounits={selectedGeounits}
                pinnedMetrics={pinnedMetrics}
                expandedProjectMetrics={expandedProjectMetrics}
                highlightedGeounits={highlightedGeounits}
                hasElectionData={hasElectionData}
                lockedDistricts={lockedDistricts}
                isReadOnly={isReadOnly}
                populationKey={populationKey}
              />
            )}
          </tbody>
        </Styled.table>
      </Box>
      {!expandedProjectMetrics && (
        <ProjectReferenceLayers
          isReadOnly={isReadOnly}
          referenceLayers={("resource" in referenceLayers && referenceLayers.resource) || undefined}
          showReferenceLayers={showReferenceLayers}
        />
      )}
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
    demographicsMetricFields,
    electionsMetricFields,
    demographicsGroups,
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
    popDeviationThreshold,
    populationKey
  }: {
    readonly district: DistrictGeoJSON;
    readonly pinnedMetricFields: readonly string[];
    readonly demographicsMetricFields: MetricsList;
    readonly electionsMetricFields: VotingMetricsList;
    readonly demographicsGroups: readonly DemographicsGroup[];
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
    readonly populationKey: GroupTotal;
  }) => {
    const selectedDifference = selectedPopulationDifference || 0;
    const showPopulationChange = selectedDifference !== 0;
    const textColor = showPopulationChange
      ? selectedDifference > 0
        ? positiveChangeColor
        : negativeChangeColor
      : "inherit";
    const intermediatePopulations = demographicsGroups.map(g =>
      g.total ? demographics[g.total] + selectedDifference : undefined
    );
    const intermediateDeviation = Math.ceil(deviation + selectedDifference);
    const absoluteDeviation = Math.floor(Math.abs(deviation + selectedDifference));
    const populationDisplay = intermediatePopulations[0]?.toLocaleString() || "";
    const deviationDisplay =
      intermediateDeviation === 0
        ? "0"
        : `${intermediateDeviation > 0 ? "+" : ""}${intermediateDeviation.toLocaleString()}`;

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

    function getPartyVoteShareDisplay(partyAndElection: string): string {
      const year = partyAndElection.endsWith("16")
        ? "16"
        : partyAndElection.endsWith("20")
        ? "20"
        : undefined;
      const votesForYear =
        year && voting ? pickBy(voting, (val, key) => key.endsWith(year)) : voting;
      const votesForParty = (votesForYear && votesForYear[partyAndElection]) || 0;
      const otherVotes =
        (votesForYear &&
          sum(
            Object.entries(votesForYear).map(([id, votes]) => (id !== partyAndElection ? votes : 0))
          )) ||
        0;
      const percent = calculatePartyVoteShare(votesForParty, otherVotes);
      return percent ? percent.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "0";
    }

    const isVisible = (field: string) =>
      pinnedMetricFields.includes(field) || expandedProjectMetrics;

    const getTotal = (id: string): number | undefined =>
      /* eslint-disable @typescript-eslint/no-unsafe-return */
      intermediatePopulations[demographicsGroups.findIndex(g => g.subgroups.includes(id)) || 0];

    const coreDemographicMetricFields = demographicsMetricFields.slice(
      0,
      demographicsGroups[0].subgroups.length
    );
    const extraDemographicMetricFields = demographicsMetricFields.slice(
      demographicsGroups[0].subgroups.length
    );

    const demographicsDisplay = ([id, metric]: readonly string[]) =>
      isVisible(metric) && (
        <Styled.td key={metric} sx={{ ...style.td, ...style.number, ...{ color: textColor } }}>
          <span>
            {getTotal(id) !== undefined
              ? `${computeDemographicSplit(demographics[id], getTotal(id) || 0)}%`
              : demographics[id].toLocaleString()}
          </span>
        </Styled.td>
      );

    const meetsThreshold =
      districtId !== 0 ? absoluteDeviation <= popDeviationThreshold : absoluteDeviation === 0;
    const aboveThreshold = intermediateDeviation < 0;
    const belowThreshold = intermediateDeviation > 0;

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
        {isVisible("population") && (
          <Styled.td sx={{ ...style.td, ...style.number, ...{ color: textColor } }}>
            {populationDisplay}
          </Styled.td>
        )}
        {isVisible("populationDeviation") && (
          <Styled.td sx={{ ...style.td, ...style.number, ...{ color: textColor } }}>
            <Tooltip
              placement="top-start"
              content={
                districtId !== 0 ? (
                  meetsThreshold ? (
                    <div>
                      This district meets the {popDeviation}% population deviation tolerance
                    </div>
                  ) : aboveThreshold ? (
                    <div>
                      Add{" "}
                      {Math.floor(
                        Math.abs(intermediateDeviation) - popDeviationThreshold
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
                ) : belowThreshold ? (
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
                  {meetsThreshold ? (
                    <Icon name="circle-check-solid" color="#388a64" />
                  ) : aboveThreshold ? (
                    <Icon name="arrow-circle-down-solid" color="gray.4" />
                  ) : (
                    <Icon name="arrow-circle-up-solid" color="#000000" />
                  )}
                </span>
              </span>
            </Tooltip>
          </Styled.td>
        )}
        {isVisible("raceChart") && (
          <Styled.td sx={style.td}>
            <Tooltip
              placement="top-start"
              content={
                demographics.population !== 0 ? (
                  <DemographicsTooltip
                    demographics={demographics}
                    isMajorityMinority={isMajorityMinority(district)}
                    demographicsGroups={demographicsGroups}
                    populationKey={populationKey}
                  />
                ) : (
                  <em>
                    <strong>Empty district.</strong> Add people to this district to view the race
                    chart
                  </em>
                )
              }
            >
              <Flex>
                <span
                  sx={{
                    borderLeft: "1px dashed",
                    borderColor: isMajorityMinority(district) ? "gray.8" : "transparent",
                    pl: "1px",
                    position: "relative",
                    left: "-2px"
                  }}
                >
                  <DemographicsChart
                    demographics={demographics}
                    populationKey={populationKey}
                    demographicsGroups={demographicsGroups}
                  />
                </span>
              </Flex>
            </Tooltip>
          </Styled.td>
        )}
        {coreDemographicMetricFields.map(demographicsDisplay)}
        {isVisible("majorityRace") && (
          <Styled.td sx={{ ...style.td, ...style.number, ...{ color: textColor } }}>
            <span>{getMajorityRaceDisplay(district)}</span>
          </Styled.td>
        )}
        {extraDemographicMetricFields.map(demographicsDisplay)}
        {hasElectionData && isVisible("pvi") && (
          <Styled.td sx={{ ...style.td, ...style.number }}>
            <PVIDisplay properties={district.properties} />
          </Styled.td>
        )}
        {voting &&
          electionsMetricFields.map(
            ([id, metric]) =>
              isVisible(metric) &&
              id in voting && (
                <Styled.td key={metric} sx={{ ...style.td, ...style.number }}>
                  <Tooltip
                    placement="top-start"
                    content={
                      demographics.population !== 0 ? (
                        <VotingSidebarTooltip voting={voting} />
                      ) : (
                        <em>
                          <strong>Empty district.</strong> Add people to this district to view the
                          vote totals
                        </em>
                      )
                    }
                  >
                    <span>{getPartyVoteShareDisplay(id)}%</span>
                  </Tooltip>
                </Styled.td>
              )
          )}
        {isVisible("compactness") && (
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
  readonly demographicsGroups: readonly DemographicsGroup[];
  readonly selectedDistrictId: number;
  readonly hoveredDistrictId: number | null;
  readonly selectedGeounits: GeoUnits;
  readonly expandedProjectMetrics: boolean;
  readonly pinnedMetrics: readonly string[];
  readonly highlightedGeounits: GeoUnits;
  readonly lockedDistricts: LockedDistricts;
  readonly hasElectionData: boolean;
  readonly populationKey: GroupTotal;
  readonly isReadOnly: boolean;
}

const SidebarRows = ({
  project,
  geojson,
  staticMetadata,
  demographicsGroups,
  selectedDistrictId,
  hoveredDistrictId,
  selectedGeounits,
  expandedProjectMetrics,
  pinnedMetrics,
  highlightedGeounits,
  lockedDistricts,
  hasElectionData,
  populationKey,
  isReadOnly
}: SidebarRowsProps) => {
  // Results of the asynchronous demographics calculation. The two calculations have been
  // combined into a single object here, because we want both updates to the state to happen
  // at the same time to prevent sidebar value flickering.
  const [selectedDemographics, setSelectedDemographics] = useState<
    | { readonly total: DemographicCounts; readonly savedDistrict: readonly DemographicCounts[] }
    | undefined
  >(undefined);
  const [cachedPopulationKey, setCachedPopulationKey] = useState<string>(populationKey);

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
      if (!outdated) {
        setSelectedDemographics({
          total: selectedTotals.demographics,
          savedDistrict: districtTotals
        });

        if (populationKey !== cachedPopulationKey) {
          setCachedPopulationKey(populationKey);
        }
      }
    }

    // When there aren't any geounits highlighted or selected, and no change to the key used for demographics data,
    // there is no need to run the asynchronous calculation; it can simply be cleared out.
    // This additional logic prevents the sidebar values from flickering after save.
    areAnyGeoUnitsSelected(selectedGeounits) ||
    areAnyGeoUnitsSelected(highlightedGeounits) ||
    populationKey !== cachedPopulationKey
      ? void getData()
      : setSelectedDemographics(undefined);

    return () => {
      outdated = true;
    };
  }, [
    project,
    staticMetadata,
    selectedGeounits,
    highlightedGeounits,
    populationKey,
    cachedPopulationKey
  ]);

  const popPerRep = getPopulationPerRepresentative(geojson, project.numberOfMembers);
  const demographicsMetricFields = getDemographicsMetricFields(staticMetadata);
  const electionsMetricFields = getVotingMetricFields(staticMetadata);

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
        const numberOfReps = project.numberOfMembers[districtId - 1] || 0;
        const popDeviationThreshold =
          (project.populationDeviation / 100) * popPerRep * numberOfReps;

        return feature.properties.populationDeviation !== undefined ? (
          <SidebarRow
            district={feature}
            selected={selected}
            pinnedMetricFields={pinnedMetrics}
            demographicsMetricFields={demographicsMetricFields}
            electionsMetricFields={electionsMetricFields}
            selectedPopulationDifference={selectedPopulationDifference || 0}
            expandedProjectMetrics={expandedProjectMetrics}
            demographics={feature.properties.demographics}
            demographicsGroups={demographicsGroups}
            deviation={feature.properties.populationDeviation}
            key={districtId}
            isDistrictLocked={lockedDistricts[districtId - 1]}
            isDistrictHovered={districtId === hoveredDistrictId}
            hasElectionData={hasElectionData}
            districtId={districtId}
            isReadOnly={isReadOnly}
            popDeviation={project.populationDeviation}
            popDeviationThreshold={popDeviationThreshold}
            populationKey={populationKey}
          />
        ) : null;
      })}
    </React.Fragment>
  );
};

export default ProjectSidebar;
