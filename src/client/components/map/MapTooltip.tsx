/** @jsx jsx */
import throttle from "lodash/throttle";
import MapboxGL from "mapbox-gl";
import { useEffect, useRef, useState } from "react";
import { connect } from "react-redux";
import { Box, Divider, Heading, jsx } from "theme-ui";

import { GeoUnits, IStaticMetadata } from "../../../shared/entities";
import { getTotalSelectedDemographics } from "../../../shared/functions";
import { SelectionTool } from "../../actions/districtDrawing";
import { State } from "../../reducers";
import { Resource } from "../../resource";
import DemographicsTooltip from "../DemographicsTooltip";
import {
  levelToLabelLayerId,
  levelToLineLayerId,
  levelToSelectionLayerId,
  GEOLEVELS_SOURCE_ID
} from ".";

const MapTooltip = ({
  geoLevelIndex,
  selectionTool,
  highlightedGeounits,
  staticDemographicsResource,
  staticGeoLevelsResource,
  staticMetadataResource,
  map
}: {
  readonly geoLevelIndex: number;
  readonly selectionTool: SelectionTool;
  readonly highlightedGeounits: GeoUnits;
  readonly staticDemographicsResource: Resource<
    ReadonlyArray<Uint8Array | Uint16Array | Uint32Array>
  >;
  readonly staticGeoLevelsResource: Resource<ReadonlyArray<Uint8Array | Uint16Array | Uint32Array>>;
  readonly staticMetadataResource: Resource<IStaticMetadata>;
  readonly map?: MapboxGL.Map;
}) => {
  const [point, setPoint] = useState({ x: 0, y: 0 });
  const [feature, setFeature] = useState<MapboxGL.MapboxGeoJSONFeature | undefined>(undefined);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const staticMetadata =
    "resource" in staticMetadataResource ? staticMetadataResource.resource : undefined;
  const staticDemographics =
    "resource" in staticDemographicsResource ? staticDemographicsResource.resource : undefined;
  const staticGeoLevels =
    "resource" in staticGeoLevelsResource ? staticGeoLevelsResource.resource : undefined;
  const invertedGeoLevelIndex = staticMetadata
    ? staticMetadata.geoLevelHierarchy.length - geoLevelIndex - 1
    : undefined;

  useEffect(() => {
    const onMouseMoveThrottled = throttle((e: MapboxGL.MapMouseEvent) => {
      // eslint-disable-next-line
      if (map && staticMetadata && invertedGeoLevelIndex) {
        const geoLevel = staticMetadata.geoLevelHierarchy[invertedGeoLevelIndex].id;
        const features =
          map &&
          map.queryRenderedFeatures(e.point, {
            layers: [levelToLineLayerId(geoLevel), levelToSelectionLayerId(geoLevel)]
          });
        setPoint({
          x: e.originalEvent.offsetX,
          y: e.originalEvent.offsetY
        });
        setFeature(features[0]);
      }
    }, 5);

    const onMouseOut = (e: MouseEvent) => {
      console.log("mouse out", e);
      const isOnTooltip =
        e.relatedTarget instanceof Element &&
        tooltipRef.current &&
        (e.relatedTarget === tooltipRef.current || tooltipRef.current.contains(e.relatedTarget));
      console.log("isOnTooltip", isOnTooltip, e.relatedTarget);
      !isOnTooltip && setFeature(undefined);
    };

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
  }, [map, geoLevelIndex, staticMetadata]);

  // eslint-disable-next-line
  if (
    feature &&
    feature.properties &&
    staticMetadata &&
    staticGeoLevels &&
    staticDemographics &&
    invertedGeoLevelIndex
  ) {
    const featureGeoLevels = staticMetadata.geoLevelHierarchy.slice(invertedGeoLevelIndex);
    const geoLevel = staticMetadata.geoLevelHierarchy[invertedGeoLevelIndex].id;
    const indexes: readonly number[] = featureGeoLevels.map((geoLevelInfo, idx) =>
      feature.properties
        ? (feature.properties[
            idx === invertedGeoLevelIndex ? `${geoLevelInfo.id}Idx` : "idx"
          ] as number)
        : -1
    );
    const selectedGeounits: GeoUnits = new Map([[feature.id as number, indexes]]);
    const demographics = getTotalSelectedDemographics(
      staticMetadata,
      staticGeoLevels,
      staticDemographics,
      selectedGeounits,
      geoLevelIndex
    );

    return (
      <Box
        ref={tooltipRef}
        sx={{
          transform: `translate3d(${point.x}px, ${point.y}px, 0)`,
          display: demographics ? "block" : "block",
          position: "absolute",
          top: "30px",
          backgroundColor: "gray.8",
          color: "muted",
          width: "200px",
          height: "auto",
          p: 2,
          zIndex: 1
        }}
      >
        <Heading as="h3" sx={{ color: "muted", textTransform: "capitalize" }}>
          {feature.properties.name ? feature.properties.name : `${geoLevel} #${feature.id}`}
        </Heading>
        <Box>Population {Number(demographics.population).toLocaleString()}</Box>
        <Divider sx={{ borderColor: "white" }} />
        <Box sx={{ width: "100%" }}>
          {demographics && <DemographicsTooltip demographics={demographics} />}
        </Box>
      </Box>
    );
  }
  return null;
};

function mapStateToProps(state: State) {
  return {
    geoLevelIndex: state.districtDrawing.geoLevelIndex,
    selectionTool: state.districtDrawing.selectionTool,
    highlightedGeounits: state.districtDrawing.highlightedGeounits,
    staticDemographicsResource: state.projectData.staticDemographics,
    staticGeoLevelsResource: state.projectData.staticGeoLevels,
    staticMetadataResource: state.projectData.staticMetadata
  };
}

export default connect(mapStateToProps)(MapTooltip);
