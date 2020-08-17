/** @jsx jsx */
import throttle from "lodash/throttle";
import MapboxGL from "mapbox-gl";
import memoize from "memoizee";
import { useEffect, useRef, useState } from "react";
import { connect } from "react-redux";
import { Box, Divider, Heading, jsx } from "theme-ui";

import { GeoUnits, GeoUnitHierarchy, IStaticMetadata } from "../../../shared/entities";
import { geoLevelLabel, getTotalSelectedDemographics } from "../../../shared/functions";
import { featuresToGeoUnits } from "./index";
import { State } from "../../reducers";
import { Resource } from "../../resource";
import DemographicsTooltip from "../DemographicsTooltip";
import { levelToLineLayerId, levelToSelectionLayerId } from ".";

const X_BUFFER = 300;
const Y_BUFFER = 300;

const getDemographics = memoize(getTotalSelectedDemographics);

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
  readonly staticDemographicsResource: Resource<
    ReadonlyArray<Uint8Array | Uint16Array | Uint32Array>
  >;
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
    const onMouseMoveThrottled = throttle((e: MapboxGL.MapMouseEvent) => {
      // eslint-disable-next-line
      if (map && staticMetadata && invertedGeoLevelIndex !== undefined) {
        const geoLevel = staticMetadata.geoLevelHierarchy[invertedGeoLevelIndex].id;
        const features =
          map &&
          map.queryRenderedFeatures(e.point, {
            layers: [levelToLineLayerId(geoLevel), levelToSelectionLayerId(geoLevel)]
          });
        setPoint({
          x: e.point.x,
          y: e.point.y
        });
        setFeature(features[0]);
      }
    }, 5);

    const onMouseOut = throttle((e: MouseEvent) => {
      const isOnTooltip =
        e.relatedTarget instanceof Element &&
        tooltipRef.current &&
        (e.relatedTarget === tooltipRef.current || tooltipRef.current.contains(e.relatedTarget));

      !isOnTooltip && setFeature(undefined);
      isOnTooltip &&
        setPoint({
          x: e.offsetX,
          y: e.offsetY
        });
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

  // eslint-disable-next-line
  if (
    map &&
    staticMetadata &&
    geoUnitHierarchy &&
    staticDemographics &&
    invertedGeoLevelIndex !== undefined
  ) {
    const geoLevel = staticMetadata.geoLevelHierarchy[invertedGeoLevelIndex].id;
    const selectedGeounits =
      feature && featuresToGeoUnits([feature], staticMetadata.geoLevelHierarchy);
    const demographics =
      selectedGeounits &&
      getDemographics(staticMetadata, geoUnitHierarchy, staticDemographics, selectedGeounits);

    const featureLabel = () =>
      feature && feature.properties && feature.properties.name ? (
        (feature.properties.name as string)
      ) : feature ? (
        <span sx={{ textTransform: "capitalize" }}>{`${geoLevel} #${feature.id}`}</span>
      ) : (
        ""
      );
    const heading =
      feature && highlightedGeounits.size === 1 && [...highlightedGeounits.keys()][0] === feature.id
        ? featureLabel()
        : highlightedGeounits.size === 1
        ? `1 ${geoLevel}`
        : highlightedGeounits.size > 1
        ? `${Number(highlightedGeounits.size).toLocaleString()} ${geoLevelLabel(
            geoLevel
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
        sx={{
          transform: `translate3d(${x}px, ${y}px, 0)`,
          position: "absolute",
          margin: "20px",
          backgroundColor: "gray.8",
          color: "muted",
          width: "200px",
          height: "auto",
          p: 2,
          zIndex: 1,
          pointerEvents: "none"
        }}
      >
        {heading && (
          <Heading as="h3" sx={{ color: "muted" }}>
            {heading}
          </Heading>
        )}
        <Box>Population {Number(demographics.population).toLocaleString()}</Box>
        <Divider sx={{ borderColor: "white" }} />
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
