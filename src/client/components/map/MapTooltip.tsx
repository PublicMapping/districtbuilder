/** @jsx jsx */
import throttle from "lodash/throttle";
import MapboxGL from "mapbox-gl";
import memoize from "memoizee";
import { useEffect, useRef, useState } from "react";
import { connect } from "react-redux";
import { Box, Divider, Heading, jsx, Grid, ThemeUIStyleObject } from "theme-ui";

import { UintArrays, GeoUnits, GeoUnitHierarchy, IStaticMetadata } from "../../../shared/entities";
import {
  areAnyGeoUnitsSelected,
  geoLevelLabel,
  getTotalSelectedDemographics
} from "../../functions";
import { featuresToGeoUnits, SET_FEATURE_DELAY } from "./index";
import { State } from "../../reducers";
import { Resource } from "../../resource";
import DemographicsTooltip from "../DemographicsTooltip";
import { levelToLineLayerId, levelToSelectionLayerId } from ".";

const X_BUFFER = 300;
const Y_BUFFER = 300;

const getDemographics = memoize(getTotalSelectedDemographics);

const style: ThemeUIStyleObject = {
  tooltip: {
    position: "absolute",
    margin: "20px",
    backgroundColor: "gray.8",
    color: "muted",
    height: "auto",
    borderRadius: "small",
    boxShadow: "small",
    maxWidth: "160px",
    overflow: "hidden",
    pointerEvents: "none",
    p: 2,
    zIndex: 1
  }
};

const MapTooltip = ({
  geoLevelIndex,
  highlightedGeounits,
  staticDemographicsResource,
  staticMetadataResource,
  geoUnitHierarchyResource,
  map
}: {
  readonly geoLevelIndex: number;
  readonly highlightedGeounits: GeoUnits;
  readonly staticDemographicsResource: Resource<UintArrays>;
  readonly staticMetadataResource: Resource<IStaticMetadata>;
  readonly geoUnitHierarchyResource: Resource<GeoUnitHierarchy>;
  readonly map?: MapboxGL.Map;
}) => {
  const [point, setPoint] = useState({ x: 0, y: 0 });
  const [feature, setFeature] = useState<MapboxGL.MapboxGeoJSONFeature | undefined>(undefined);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const staticMetadata =
    "resource" in staticMetadataResource ? staticMetadataResource.resource : undefined;
  const staticDemographics =
    "resource" in staticDemographicsResource ? staticDemographicsResource.resource : undefined;
  const geoUnitHierarchy =
    "resource" in geoUnitHierarchyResource ? geoUnitHierarchyResource.resource : undefined;
  const invertedGeoLevelIndex = staticMetadata
    ? staticMetadata.geoLevelHierarchy.length - geoLevelIndex - 1
    : undefined;

  useEffect(() => {
    const throttledSetFeature = throttle((point, geoLevel) => {
      const features =
        map &&
        map.queryRenderedFeatures(point, {
          layers: [levelToLineLayerId(geoLevel), levelToSelectionLayerId(geoLevel)]
        });
      features && setFeature(features[0]);
    }, SET_FEATURE_DELAY);

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

    const onMouseOut = throttle(() => setFeature(undefined), 5);

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

  // eslint-disable-next-line
  if (
    map &&
    staticMetadata &&
    geoUnitHierarchy &&
    staticDemographics &&
    invertedGeoLevelIndex !== undefined
  ) {
    const geoLevelId = staticMetadata.geoLevelHierarchy[invertedGeoLevelIndex].id;
    const selectedGeounits = areAnyGeoUnitsSelected(highlightedGeounits)
      ? highlightedGeounits
      : feature && featuresToGeoUnits([feature], staticMetadata.geoLevelHierarchy);
    const demographics =
      selectedGeounits &&
      getDemographics(staticMetadata, geoUnitHierarchy, staticDemographics, selectedGeounits);

    const featureLabel = () =>
      feature && feature.properties && feature.properties.name ? (
        <span sx={{ textTransform: "capitalize" }}>{`${feature.properties
          .name as string} ${geoLevelId}`}</span>
      ) : feature ? (
        <span sx={{ textTransform: "capitalize" }}>{`${geoLevelId} #${feature.id}`}</span>
      ) : (
        ""
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

    const canvas = map.getCanvas();
    const { width, height } = canvas;
    const tooltipWidth = tooltipRef.current && tooltipRef.current.offsetWidth;
    const tooltipHeight = tooltipRef.current && tooltipRef.current.offsetHeight;
    const x = !tooltipWidth || width - point.x > X_BUFFER ? point.x : point.x - tooltipWidth - 40;
    const y =
      !tooltipHeight || height - point.y > Y_BUFFER ? point.y : point.y - tooltipHeight - 40;

    return demographics ? (
      <Box
        ref={tooltipRef}
        style={{ transform: `translate3d(${x}px, ${y}px, 0)` }}
        sx={{ ...style.tooltip }}
      >
        {heading && (
          <Heading sx={{ fontSize: 2, fontFamily: "heading", color: "muted" }}>{heading}</Heading>
        )}
        <Grid gap={2} columns={[2, "1fr 2fr"]}>
          <Box>Pop.</Box>
          <Box sx={{ fontVariant: "tabular-nums", ml: "7px" }}>
            {Number(demographics.population).toLocaleString()}
          </Box>
        </Grid>
        <Divider sx={{ my: 1, borderColor: "gray.6" }} />
        <Box sx={{ width: "100%" }}>
          <DemographicsTooltip demographics={demographics} />
        </Box>
      </Box>
    ) : null;
  }
  return null;
};

function mapStateToProps(state: State) {
  return {
    geoLevelIndex: state.districtDrawing.geoLevelIndex,
    highlightedGeounits: state.districtDrawing.highlightedGeounits,
    staticDemographicsResource: state.projectData.staticDemographics,
    staticMetadataResource: state.projectData.staticMetadata,
    geoUnitHierarchyResource: state.projectData.geoUnitHierarchy
  };
}

export default connect(mapStateToProps)(MapTooltip);
