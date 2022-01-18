/** @jsx jsx */
import throttle from "lodash/throttle";
import MapboxGL from "mapbox-gl";
import React, { useEffect, useRef, useState } from "react";
import { connect } from "react-redux";
import { Box, Divider, Heading, jsx, Grid, ThemeUIStyleObject } from "theme-ui";

import {
  DemographicCounts,
  GeoUnits,
  IProject,
  IStaticMetadata,
  GroupTotal
} from "../../../shared/entities";
import { ElectionYear } from "../../types";

import {
  areAnyGeoUnitsSelected,
  destructureResource,
  geoLevelLabel,
  extractYear
} from "../../functions";
import { getTotalSelectedDemographics } from "../../worker-functions";
import { featuresToGeoUnits, SET_FEATURE_DELAY } from "./index";
import { State } from "../../reducers";
import DemographicsTooltip from "../DemographicsTooltip";
import VotingMapTooltip from "../VotingMapTooltip";
import { levelToLineLayerId, levelToSelectionLayerId } from ".";
import { getLabel } from "./labels";
import { getDemographicsGroups } from "../../../shared/functions";

const style: Record<string, ThemeUIStyleObject> = {
  tooltip: {
    position: "absolute",
    margin: "20px",
    backgroundColor: "gray.8",
    color: "muted",
    height: "auto",
    borderRadius: "small",
    boxShadow: "small",
    width: "200px",
    overflow: "hidden",
    pointerEvents: "none",
    p: 2,
    zIndex: 1,
    lineHeight: 1.3,
    fontSize: 0,
    willChange: "transform"
  }
};

interface Data {
  readonly demographics: DemographicCounts;
  readonly voting?: DemographicCounts;
  readonly heading: React.ReactElement | string;
}

const throttledDataSetter = throttle(
  function<T>(setData: (arg0: T) => void, data: T) {
    setData(data);
  },
  100,
  { leading: true }
);

const MapTooltip = ({
  geoLevelIndex,
  highlightedGeounits,
  staticMetadata,
  project,
  map,
  electionYear,
  populationKey
}: {
  readonly geoLevelIndex: number;
  readonly highlightedGeounits: GeoUnits;
  readonly staticMetadata?: IStaticMetadata;
  readonly project?: IProject;
  readonly map?: MapboxGL.Map;
  readonly electionYear: ElectionYear;
  readonly populationKey: GroupTotal;
}) => {
  const [point, setPoint] = useState({ x: 0, y: 0 });
  const [feature, setFeature] = useState<MapboxGL.MapboxGeoJSONFeature | undefined>(undefined);
  const [data, setData] = useState<Data | undefined>(undefined);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const invertedGeoLevelIndex = staticMetadata
    ? staticMetadata.geoLevelHierarchy.length - geoLevelIndex - 1
    : undefined;

  useEffect(() => {
    const throttledSetFeature = throttle(
      (point: MapboxGL.Point | undefined, geoLevel: string | undefined) => {
        // eslint-disable-next-line
        if (!point || !geoLevel) {
          setFeature(undefined);
          // eslint-disable-next-line
        } else {
          const features =
            map &&
            map.queryRenderedFeatures(point, {
              layers: [levelToLineLayerId(geoLevel), levelToSelectionLayerId(geoLevel)]
            });
          setFeature(features && features[0]);
        }
      },
      SET_FEATURE_DELAY
    );

    const onMouseMoveThrottled = throttle((e: MapboxGL.MapMouseEvent) => {
      // eslint-disable-next-line
      if (map && staticMetadata && invertedGeoLevelIndex !== undefined) {
        const geoLevel = staticMetadata.geoLevelHierarchy[invertedGeoLevelIndex].id;
        setPoint({
          x: e.point.x,
          y: e.point.y
        });
        throttledSetFeature(e.point, geoLevel);
      }
    }, 5);

    const onMouseOut = throttle(() => {
      throttledSetFeature(undefined, undefined);
    }, 5);

    const onDrag = (e: MapboxGL.MapMouseEvent) => {
      setPoint({ x: e.originalEvent.offsetX, y: e.originalEvent.offsetY });
    };

    const clearHandlers = () => {
      // eslint-disable-next-line
      if (map) {
        map.off("mousemove", onMouseMoveThrottled);
        map.off("drag", onDrag);
        map.getCanvasContainer().removeEventListener("mouseout", onMouseOut);
      }
    };

    // eslint-disable-next-line
    if (map && staticMetadata) {
      clearHandlers();
      map.on("mousemove", onMouseMoveThrottled);
      map.on("drag", onDrag);
      map.getCanvasContainer().addEventListener("mouseout", onMouseOut);
    }

    return clearHandlers;
  }, [map, staticMetadata, invertedGeoLevelIndex]);

  useEffect(() => {
    // eslint-disable-next-line
    let outdated = false;
    async function getData() {
      // eslint-disable-next-line
      if (staticMetadata && project && invertedGeoLevelIndex !== undefined) {
        const geoLevelId = staticMetadata.geoLevelHierarchy[invertedGeoLevelIndex].id;

        const selectedGeounits = areAnyGeoUnitsSelected(highlightedGeounits)
          ? highlightedGeounits
          : feature && featuresToGeoUnits([feature], staticMetadata.geoLevelHierarchy);
        const staticCounts =
          selectedGeounits &&
          (await getTotalSelectedDemographics(
            staticMetadata,
            project.regionConfig.s3URI,
            selectedGeounits
          ));
        const demographics = staticCounts?.demographics;
        const voting = staticCounts?.voting;

        const featureLabel = () => (
          <span sx={{ textTransform: "capitalize" }}>{getLabel(geoLevelId, feature)}</span>
        );
        const highlightedGeounitsForLevel = highlightedGeounits[geoLevelId];
        const heading =
          feature &&
          highlightedGeounitsForLevel &&
          highlightedGeounitsForLevel?.size === 1 &&
          [...highlightedGeounitsForLevel.keys()][0] === feature.id
            ? featureLabel()
            : highlightedGeounitsForLevel?.size === 1
            ? `1 ${geoLevelId}`
            : highlightedGeounitsForLevel?.size > 1
            ? `${Number(highlightedGeounitsForLevel.size).toLocaleString()} ${geoLevelLabel(
                geoLevelId
              ).toLowerCase()}`
            : featureLabel();

        // Only set data if it is for the most recent version requested, to
        // avoid overwriting fresh data with stale data
        !outdated &&
          throttledDataSetter(
            setData,
            demographics && (voting ? { demographics, voting, heading } : { demographics, heading })
          );
      }
    }
    void getData();

    return () => {
      outdated = true;
    };
  }, [highlightedGeounits, feature, staticMetadata, project, invertedGeoLevelIndex]);

  // eslint-disable-next-line
  if (map && data !== undefined) {
    const x = point.x;
    const y = point.y;
    const votingForYear =
      electionYear && data.voting ? extractYear(data.voting, electionYear) : data.voting;
    const voting =
      votingForYear && Object.keys(votingForYear).length > 0
        ? votingForYear
        : data.voting && Object.keys(data.voting).length > 0
        ? data.voting
        : undefined;
    const demographicsGroups = staticMetadata && getDemographicsGroups(staticMetadata);
    const hasAdjustedPopulation =
      data.demographics.population < 0 ||
      (demographicsGroups &&
        demographicsGroups[0].subgroups.some(
          id => data.demographics[id] > data.demographics.population
        ));

    return (
      <Box
        ref={tooltipRef}
        style={{ transform: `translate3d(${x}px, ${y}px, 0)` }}
        sx={{ ...style.tooltip }}
      >
        {data.heading && (
          <Heading
            sx={{
              fontSize: 1,
              fontFamily: "heading",
              color: "muted",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}
          >
            {data.heading}
          </Heading>
        )}
        <Grid gap={2} columns={[2, "1fr 2fr"]}>
          <Box>Pop.</Box>
          <Box
            sx={{
              fontVariant: "tabular-nums",
              ml: "7px",
              fontSize: 1,
              lineHeight: 1,
              fontWeight: "medium"
            }}
          >
            {Number(data.demographics.population).toLocaleString()}
            {hasAdjustedPopulation && "*"}
          </Box>
        </Grid>
        <Divider sx={{ my: 1, borderColor: "gray.6" }} />
        <Box sx={{ width: "100%" }}>
          {demographicsGroups && (
            <DemographicsTooltip
              demographics={data.demographics}
              abbreviate={true}
              demographicsGroups={demographicsGroups}
              populationKey={populationKey}
            />
          )}
          {voting && (
            <React.Fragment>
              <Divider sx={{ my: 1, borderColor: "gray.6" }} />
              <VotingMapTooltip voting={voting} />
            </React.Fragment>
          )}
          {hasAdjustedPopulation && (
            <React.Fragment>
              <Divider sx={{ my: 1, borderColor: "gray.6" }} />
              <Box>* population reallocated</Box>
            </React.Fragment>
          )}
        </Box>
      </Box>
    );
  }
  return null;
};

function mapStateToProps(state: State) {
  return {
    geoLevelIndex: state.project.undoHistory.present.state.geoLevelIndex,
    highlightedGeounits: state.project.highlightedGeounits,
    project: destructureResource(state.project.projectData, "project"),
    staticMetadata: destructureResource(state.project.staticData, "staticMetadata"),
    electionYear: state.projectOptions.electionYear,
    populationKey: state.projectOptions.populationKey
  };
}

export default connect(mapStateToProps)(MapTooltip);
