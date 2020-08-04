/** @jsx jsx */
import throttle from "lodash/throttle";
import MapboxGL from "mapbox-gl";
import memoize from "memoizee";
import { useEffect, useRef, useState } from "react";
import { connect } from "react-redux";
import { Box, Divider, Heading, jsx } from "theme-ui";

import { GeoUnits, IStaticMetadata } from "../../../shared/entities";
import { getTotalSelectedDemographics } from "../../../shared/functions";
import { State } from "../../reducers";
import { Resource } from "../../resource";
import DemographicsTooltip from "../DemographicsTooltip";
import { levelToLineLayerId, levelToSelectionLayerId } from ".";

const getDemographics = memoize(getTotalSelectedDemographics);

const MapTooltip = ({
  geoLevelIndex,
  highlightedGeounits,
  staticDemographicsResource,
  staticGeoLevelsResource,
  staticMetadataResource,
  map
}: {
  readonly geoLevelIndex: number;
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
      if (map && staticMetadata && invertedGeoLevelIndex !== undefined) {
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

    const onMouseOut = throttle((e: MouseEvent) => {
      const isOnTooltip =
        e.relatedTarget instanceof Element &&
        tooltipRef.current &&
        (e.relatedTarget === tooltipRef.current || tooltipRef.current.contains(e.relatedTarget));

      !isOnTooltip && setFeature(undefined);
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
  }, [map, geoLevelIndex, staticMetadata]);

  // eslint-disable-next-line
  if (
    staticMetadata &&
    staticGeoLevels &&
    staticDemographics &&
    invertedGeoLevelIndex !== undefined
  ) {
    const featureGeoLevels = staticMetadata.geoLevelHierarchy.slice(invertedGeoLevelIndex);
    const geoLevel = staticMetadata.geoLevelHierarchy[invertedGeoLevelIndex].id;
    const selectedGeounits: GeoUnits | undefined | null =
      highlightedGeounits.size > 0
        ? highlightedGeounits
        : feature &&
          feature.properties &&
          new Map([
            [
              feature.id as number,
              featureGeoLevels.map((geoLevelInfo, idx) =>
                feature.properties
                  ? (feature.properties[
                      idx === invertedGeoLevelIndex ? `${geoLevelInfo.id}Idx` : "idx"
                    ] as number)
                  : -1
              )
            ]
          ]);
    const demographics =
      selectedGeounits &&
      getDemographics(
        staticMetadata,
        staticGeoLevels,
        staticDemographics,
        selectedGeounits,
        geoLevelIndex
      );

    const heading =
      highlightedGeounits.size > 0 ? null : feature &&
        feature.properties &&
        feature.properties.name ? (
        (feature.properties.name as string)
      ) : feature ? (
        <span sx={{ textTransform: "capitalize" }}>{`${geoLevel} #${feature.id}`}</span>
      ) : null;

    return demographics ? (
      <Box
        ref={tooltipRef}
        sx={{
          transform: `translate3d(${point.x}px, ${point.y}px, 0)`,
          position: "absolute",
          top: "20px",
          left: "20px",
          backgroundColor: "gray.8",
          color: "muted",
          width: "200px",
          height: "auto",
          p: 2,
          zIndex: 1
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
    staticGeoLevelsResource: state.projectData.staticGeoLevels,
    staticMetadataResource: state.projectData.staticMetadata
  };
}

export default connect(mapStateToProps)(MapTooltip);
