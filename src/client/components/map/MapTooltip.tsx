/** @jsx jsx */
import throttle from "lodash/throttle";
import MapboxGL from "mapbox-gl";
import { useEffect, useRef, useState } from "react";
import { connect } from "react-redux";
import { Box, Divider, Heading, jsx, Grid, ThemeUIStyleObject } from "theme-ui";

import { DemographicCounts, GeoUnits, IProject, IStaticMetadata } from "../../../shared/entities";
import { areAnyGeoUnitsSelected, destructureResource, geoLevelLabel } from "../../functions";
import { getTotalSelectedDemographics } from "../../worker-functions";
import { featuresToGeoUnits, SET_FEATURE_DELAY } from "./index";
import { State } from "../../reducers";
import DemographicsTooltip from "../DemographicsTooltip";
import { levelToLineLayerId, levelToSelectionLayerId } from ".";

const style: ThemeUIStyleObject = {
  tooltip: {
    position: "absolute",
    margin: "20px",
    backgroundColor: "gray.8",
    color: "muted",
    height: "auto",
    borderRadius: "small",
    boxShadow: "small",
    width: "170px",
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
  map
}: {
  readonly geoLevelIndex: number;
  readonly highlightedGeounits: GeoUnits;
  readonly staticMetadata?: IStaticMetadata;
  readonly project?: IProject;
  readonly map?: MapboxGL.Map;
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
        const demographics =
          selectedGeounits &&
          (await getTotalSelectedDemographics(
            staticMetadata,
            project.regionConfig.s3URI,
            selectedGeounits
          ));

        const featureLabel = () => (
          <span sx={{ textTransform: "capitalize" }}>
            {feature && feature.properties && typeof feature.properties.name === "string" ? (
              feature.properties.name
            ) : feature ? (
              <span sx={{ textTransform: "capitalize" }}>{`${geoLevelId} #${feature.id}`}</span>
            ) : (
              ""
            )}
          </span>
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
        !outdated && throttledDataSetter(setData, demographics && { demographics, heading });
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
          </Box>
        </Grid>
        <Divider sx={{ my: 1, borderColor: "gray.6" }} />
        <Box sx={{ width: "100%" }}>
          <DemographicsTooltip demographics={data.demographics} />
        </Box>
      </Box>
    );
  }
  return null;
};

function mapStateToProps(state: State) {
  return {
    geoLevelIndex: state.project.undoHistory.present.geoLevelIndex,
    highlightedGeounits: state.project.highlightedGeounits,
    project: destructureResource(state.project.projectData, "project"),
    staticMetadata: destructureResource(state.project.staticData, "staticMetadata")
  };
}

export default connect(mapStateToProps)(MapTooltip);
