/** @jsx jsx */
import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Flex, Text, jsx, ThemeUIStyleObject } from "theme-ui";
import bbox from "@turf/bbox";
import { BBox2d } from "@turf/helpers/lib/geojson";

import MapboxGL from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import polylabel from "polylabel";
import { Feature, FeatureCollection, Point, Position } from "geojson";

import {
  setGeoLevelVisibility,
  SelectionTool,
  replaceSelectedGeounits,
  FindTool,
  setZoomToDistrictId
} from "../../actions/districtDrawing";
import { getDistrictColor } from "../../constants/colors";
import {
  UintArrays,
  GeoUnits,
  IProject,
  IStaticMetadata,
  LockedDistricts,
  EvaluateMetric
} from "../../../shared/entities";
import { DistrictsGeoJSON, DistrictGeoJSON } from "../../types";
import {
  areAnyGeoUnitsSelected,
  getSelectedGeoLevel,
  getTargetPopulation,
  geoLevelLabelSingular,
  assertNever
} from "../../functions";
import {
  GEOLEVELS_SOURCE_ID,
  DISTRICTS_SOURCE_ID,
  featureStateDistricts,
  generateMapLayers,
  getGeoLevelVisibility,
  levelToLabelLayerId,
  levelToLineLayerId,
  onlyUnlockedGeoUnits,
  getChildGeoUnits,
  DISTRICTS_LOCK_LAYER_ID,
  setFeaturesSelectedFromGeoUnits,
  TOPMOST_GEOLEVEL_EVALUATE_SPLIT_ID,
  TOPMOST_GEOLEVEL_EVALUATE_FILL_SPLIT_ID,
  DISTRICTS_COMPACTNESS_CHOROPLETH_LAYER_ID,
  DISTRICTS_LAYER_ID,
  DISTRICTS_LABELS_SOURCE_ID,
  levelToSelectionLayerId,
  getChoroplethLabels,
  getChoroplethStops,
  DISTRICTS_CONTIGUITY_CHLOROPLETH_LAYER_ID,
  CONTIGUITY_FILL_COLOR,
  COUNTY_SPLIT_FILL_COLOR,
  EVALUATE_GRAY_FILL_COLOR,
  DISTRICTS_EVALUATE_LABELS_LAYER_ID,
  DISTRICTS_EQUAL_POPULATION_CHOROPLETH_LAYER_ID,
  DISTRICTS_OUTLINE_LAYER_ID
} from "./index";
import DefaultSelectionTool from "./DefaultSelectionTool";
import FindMenu from "./FindMenu";
import MapMessage from "./MapMessage";
import MapTooltip from "./MapTooltip";
import PaintBrushSelectionTool from "./PaintBrushSelectionTool";
import RectangleSelectionTool from "./RectangleSelectionTool";
import store from "../../store";
import { State } from "../../reducers";
import { connect } from "react-redux";
import { MAPBOX_STYLE, MAPBOX_TOKEN } from "../../constants/map";
import { KEYBOARD_SHORTCUTS } from "./keyboardShortcuts";

function removeEvaluateMetricLayers(map: MapboxGL.Map) {
  map.setLayoutProperty(DISTRICTS_COMPACTNESS_CHOROPLETH_LAYER_ID, "visibility", "none");
  map.setLayoutProperty(DISTRICTS_EQUAL_POPULATION_CHOROPLETH_LAYER_ID, "visibility", "none");
  map.setLayoutProperty(TOPMOST_GEOLEVEL_EVALUATE_SPLIT_ID, "visibility", "none");
  map.setLayoutProperty(TOPMOST_GEOLEVEL_EVALUATE_FILL_SPLIT_ID, "visibility", "none");
  map.setLayoutProperty(DISTRICTS_CONTIGUITY_CHLOROPLETH_LAYER_ID, "visibility", "none");
}

function disableEditMode(map: MapboxGL.Map, staticMetadata: IStaticMetadata) {
  // Remove all geolayers from view
  staticMetadata.geoLevelHierarchy.forEach(geoLevel => {
    map.setLayoutProperty(levelToLineLayerId(geoLevel.id), "visibility", "none");
    map.setLayoutProperty(levelToSelectionLayerId(geoLevel.id), "visibility", "none");
    map.setLayoutProperty(levelToLabelLayerId(geoLevel.id), "visibility", "none");
  });

  // Disable selection tools in evaluate mode
  DefaultSelectionTool.disable(map);
  RectangleSelectionTool.disable(map);
  PaintBrushSelectionTool.disable(map);

  // Resize map after editing toolbar removed
  map.resize();

  // Hide lock layer in evaluate mode
  map.setLayoutProperty(DISTRICTS_LOCK_LAYER_ID, "visibility", "none");

  // Style district outline for evaluate mode
  map.setPaintProperty(DISTRICTS_OUTLINE_LAYER_ID, "line-color", "#000");
  map.setPaintProperty(DISTRICTS_OUTLINE_LAYER_ID, "line-opacity", 1);
  map.setPaintProperty(DISTRICTS_OUTLINE_LAYER_ID, "line-width", [
    "interpolate",
    ["linear"],
    ["zoom"],
    6,
    2,
    14,
    5
  ]);
}

function enableEditmode(map: MapboxGL.Map, staticMetadata: IStaticMetadata, geoLevelIndex: number) {
  map.setLayoutProperty(DISTRICTS_EVALUATE_LABELS_LAYER_ID, "visibility", "none");
  map.setLayoutProperty(DISTRICTS_LOCK_LAYER_ID, "visibility", "visible");

  // Reset district styling to non-evaluate mode default
  map.setPaintProperty(DISTRICTS_LAYER_ID, "fill-opacity", [
    "interpolate",
    ["linear"],
    ["zoom"],
    6,
    0.66,
    14,
    0.45
  ]);
  map.setPaintProperty(DISTRICTS_OUTLINE_LAYER_ID, "line-width", [
    "interpolate",
    ["linear"],
    ["zoom"],
    6,
    ["*", ["get", "outlineWidthScaleFactor"], 2],
    14,
    ["*", ["get", "outlineWidthScaleFactor"], 5]
  ]);

  // Reset map state to default
  map.setLayoutProperty(DISTRICTS_LAYER_ID, "visibility", "visible");
  removeEvaluateMetricLayers(map);

  const invertedGeoLevelIndex = staticMetadata.geoLevelHierarchy.length - geoLevelIndex - 1;
  staticMetadata.geoLevelHierarchy.forEach((geoLevel, idx) => {
    const geoLevelVisibility = idx >= invertedGeoLevelIndex ? "visible" : "none";
    map.setLayoutProperty(levelToLineLayerId(geoLevel.id), "visibility", geoLevelVisibility);
    map.setLayoutProperty(levelToSelectionLayerId(geoLevel.id), "visibility", "visible");
    map.setLayoutProperty(levelToLabelLayerId(geoLevel.id), "visibility", "visible");
  });
}

function enableCommonEvaluateLayers(map: MapboxGL.Map) {
  // Display district labels in evaluate mode
  map.setLayoutProperty(DISTRICTS_EVALUATE_LABELS_LAYER_ID, "visibility", "visible");
}

function enableSummaryEvaluateLayers(map: MapboxGL.Map) {
  map.setLayoutProperty(DISTRICTS_LAYER_ID, "visibility", "visible");
  map.setPaintProperty(DISTRICTS_LAYER_ID, "fill-opacity", 1);
}

function disableSummaryEvaluateLayers(map: MapboxGL.Map) {
  map.setLayoutProperty(DISTRICTS_LAYER_ID, "visibility", "none");
}

interface Props {
  readonly project: IProject;
  readonly geojson: DistrictsGeoJSON;
  readonly staticMetadata: IStaticMetadata;
  readonly staticGeoLevels: UintArrays;
  readonly selectedGeounits: GeoUnits;
  readonly selectedDistrictId: number;
  readonly hoveredDistrictId: number | null;
  readonly zoomToDistrictId: number | null;
  readonly selectionTool: SelectionTool;
  readonly geoLevelIndex: number;
  readonly lockedDistricts: LockedDistricts;
  readonly evaluateMetric?: EvaluateMetric;
  readonly evaluateMode: boolean;
  readonly isReadOnly: boolean;
  readonly limitSelectionToCounty: boolean;
  readonly findMenuOpen: boolean;
  readonly findTool: FindTool;
  readonly label?: string;
  readonly map?: MapboxGL.Map;
  // eslint-disable-next-line
  readonly setMap: (map: MapboxGL.Map) => void;
}

interface LabelId {
  readonly id?: string | number;
}
type Label = Feature<Point, LabelId>;
type Labels = FeatureCollection<Point, LabelId>;

const style: ThemeUIStyleObject = {
  legendBox: {
    position: "absolute",
    bg: "muted",
    bottom: 6,
    width: "auto",
    left: "50%",
    transform: "translateX(-50%)",
    border: "1px solid",
    borderColor: "gray.2",
    borderRadius: "small",
    boxShadow: "large",
    p: 3,
    display: "inline-block",
    minWidth: "fit-content",
    zIndex: "200"
  },
  legendTitle: {
    fontSize: 1,
    color: "gray.8",
    fontWeight: "medium",
    mr: 4,
    display: "inline-block"
  },
  legendItem: {
    display: "inline-flex",
    mr: 3,
    alignItems: "center"
  },
  legendColorSwatch: {
    mr: 2,
    height: "15px",
    width: "15px",
    flex: "0 0 15px",
    borderRadius: "small",
    border: "1px solid",
    borderColor: "gray.2",
    display: "inline-block"
  },
  legendLabel: {
    color: "gray.8",
    flex: "0 0 auto",
    display: "inline-block"
  }
};

const DistrictsMap = ({
  project,
  geojson,
  staticMetadata,
  staticGeoLevels,
  selectedGeounits,
  selectedDistrictId,
  hoveredDistrictId,
  zoomToDistrictId,
  selectionTool,
  geoLevelIndex,
  lockedDistricts,
  isReadOnly,
  limitSelectionToCounty,
  findMenuOpen,
  evaluateMetric,
  evaluateMode,
  findTool,
  label,
  map,
  setMap
}: Props) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectionInProgress, setSelectionInProgress] = useState<boolean>();
  const [panToggled, setTogglePan] = useState<boolean>(false);

  const isPanning =
    panToggled &&
    !selectionInProgress &&
    (selectionTool === SelectionTool.Rectangle || selectionTool === SelectionTool.PaintBrush);

  // Conversion from readonly -> mutable to match Mapbox interface
  const [b0, b1, b2, b3] = staticMetadata.bbox;

  const selectedGeolevel = getSelectedGeoLevel(staticMetadata.geoLevelHierarchy, geoLevelIndex);

  const minZoom = Math.min(...staticMetadata.geoLevelHierarchy.map(geoLevel => geoLevel.minZoom));
  const maxZoom = Math.max(...staticMetadata.geoLevelHierarchy.map(geoLevel => geoLevel.maxZoom));

  // While a geolevel has tiles up to the maxZoom level, we want the enable the user to zoom in
  // beyond that zoom level. Using lower zoom tiles at higher zoom levels is called overzoom.
  // The ability to zoom this far in isn't needed in the typical use-case (+4 is fine for that),
  // but it's needed in order to allow the user to fix very tiny unassigned slivers that may arise.
  const overZoom = maxZoom + 8;

  const legendLabel = geoLevelLabelSingular(
    staticMetadata.geoLevelHierarchy[staticMetadata.geoLevelHierarchy.length - 1].id
  );

  useEffect(() => {
    // eslint-disable-next-line
    if (mapRef.current === null) {
      return;
    }

    // eslint-disable-next-line
    MapboxGL.accessToken = MAPBOX_TOKEN;

    const map = new MapboxGL.Map({
      container: mapRef.current,
      style: MAPBOX_STYLE,
      bounds: [b0, b1, b2, b3],
      fitBoundsOptions: { padding: 75 },
      minZoom: minZoom,
      maxZoom: overZoom
    });

    map.addControl(
      new MapboxGL.NavigationControl({
        showCompass: false,
        showZoom: true
      }),
      "top-right"
    );

    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();
    map.doubleClickZoom.disable();

    const setLevelVisibility = () => {
      store.dispatch(setGeoLevelVisibility(getGeoLevelVisibility(map, staticMetadata)));
    };

    const onMapLoad = () => {
      generateMapLayers(
        project.regionConfig.s3URI,
        project.regionConfig.regionCode,
        staticMetadata.geoLevelHierarchy,
        minZoom,
        maxZoom,
        map,
        geojson,
        evaluateMetric && "avgPopulation" in evaluateMetric ? evaluateMetric : undefined
      );

      setMap(map);

      map.resize();
    };

    setLevelVisibility();
    map.on("load", onMapLoad);
    map.on("zoomend", setLevelVisibility);

    return () => {
      map.off("load", onMapLoad);
      map.off("zoomend", setLevelVisibility);
    };

    // Everything in this effect should only happen on component load
    // eslint-disable-next-line
  }, [mapRef]);

  const downHandler = useCallback(
    (key: KeyboardEvent) => {
      const meta = navigator.appVersion.indexOf("Mac") !== -1 ? "metaKey" : "ctrlKey";
      const shortcut = KEYBOARD_SHORTCUTS.find(
        shortcut =>
          (shortcut.key === key.key || shortcut.key.toLowerCase() === key.key) &&
          !!shortcut.meta === key[meta] &&
          !!shortcut.shift === key.shiftKey
      );
      if (shortcut && (!isReadOnly || shortcut?.allowReadOnly)) {
        shortcut.action({
          selectionTool,
          geoLevelIndex,
          isReadOnly,
          selectedDistrictId,
          label,
          numFeatures: geojson.features.length,
          numGeolevels: staticMetadata.geoLevelHierarchy.length,
          limitSelectionToCounty,
          evaluateMode,
          setTogglePan
        });
      }
    },
    [
      selectionTool,
      geoLevelIndex,
      isReadOnly,
      selectedDistrictId,
      label,
      geojson.features.length,
      staticMetadata.geoLevelHierarchy.length,
      limitSelectionToCounty,
      evaluateMode
    ]
  );
  // Keyboard handlers

  const upHandler = ({ key }: KeyboardEvent) => {
    if (key === "Spacebar" || key === " ") {
      setTogglePan(false);
    }
  };

  // Add event listeners
  useEffect(() => {
    window.addEventListener("keydown", downHandler);
    window.addEventListener("keyup", upHandler);
    // Remove event listeners on cleanup
    return () => {
      window.removeEventListener("keydown", downHandler);
      window.removeEventListener("keyup", upHandler);
    };
    // Reload handlers when selected district changes
  }, [selectedDistrictId, selectionTool, downHandler]);

  // Update districts source when geojson is fetched or find type is changed
  useEffect(() => {
    const avgPopulation = getTargetPopulation(geojson, project);
    // Add a color property to the geojson, so it can be used for styling
    geojson.features.forEach((feature, id) => {
      const districtColor = getDistrictColor(id);
      // eslint-disable-next-line
      feature.properties.id = id;
      // eslint-disable-next-line
      feature.properties.outlineColor =
        findMenuOpen &&
        ((findTool === FindTool.Unassigned && id === 0) ||
          (findTool === FindTool.NonContiguous &&
            id !== 0 &&
            feature.geometry.coordinates.length >= 2))
          ? // Set pink outline to make unassigned/non-contiguous districts stand out
            "#F25DFE"
          : "transparent";
      // eslint-disable-next-line
      feature.properties.color = districtColor;
      const populationDeviation = feature.properties.demographics.population - avgPopulation;
      // eslint-disable-next-line
      feature.properties.percentDeviation =
        feature.properties.demographics.population > 0 && feature.id !== 0
          ? populationDeviation / avgPopulation
          : undefined;
      // eslint-disable-next-line
      feature.properties.populationDeviation = populationDeviation;
      // eslint-disable-next-line
      feature.properties.outlineWidthScaleFactor = findMenuOpen ? 1 : 2;
    });

    const districtsSource = map && map.getSource(DISTRICTS_SOURCE_ID);
    districtsSource && districtsSource.type === "geojson" && districtsSource.setData(geojson);
  }, [map, geojson, findMenuOpen, findTool, project]);

  // Update layer styles when district is selected/hovered
  useEffect(() => {
    if (map && !evaluateMode) {
      // NOTE: It's important to fall back to the outline color set for 'Find Unassigned' so as not
      // to loose line styles by falling back to "transparent"
      const fallbackLineColor = ["get", "outlineColor"];
      const selectedDistrictMatchExpression = [
        "match",
        ["id"],
        selectedDistrictId,
        getDistrictColor(selectedDistrictId),
        fallbackLineColor
      ];
      map.setPaintProperty(
        DISTRICTS_OUTLINE_LAYER_ID,
        "line-color",
        hoveredDistrictId
          ? // Set both hovered district line color and selected district line color
            [
              "match",
              ["id"],
              hoveredDistrictId,
              getDistrictColor(hoveredDistrictId),
              selectedDistrictMatchExpression
            ]
          : // There's no hovered district so just set selected district line color if not in evaluate mode
          !evaluateMode
          ? selectedDistrictMatchExpression
          : fallbackLineColor
      );
    }
  }, [map, selectedDistrictId, hoveredDistrictId, evaluateMode]);

  const removeSelectedFeatures = (map: MapboxGL.Map, staticMetadata: IStaticMetadata) => {
    staticMetadata.geoLevelHierarchy
      .map(geoLevel => geoLevel.id)
      .forEach(sourceLayer =>
        map.removeFeatureState({
          source: GEOLEVELS_SOURCE_ID,
          sourceLayer
        })
      );
  };

  // Compute array of top geolevels split across multiple districts
  const splitCountiesDistricts = project?.districtsDefinition.map(c => {
    if (Array.isArray(c)) {
      return c;
    } else {
      return undefined;
    }
  });

  // Set features from topmost geolayer that are split across districts to be selected
  map &&
    staticMetadata &&
    splitCountiesDistricts.forEach((c, id) => {
      if (c !== undefined) {
        map &&
          map.setFeatureState(
            {
              source: GEOLEVELS_SOURCE_ID,
              id,
              sourceLayer:
                staticMetadata.geoLevelHierarchy[staticMetadata.geoLevelHierarchy.length - 1].id
            },
            { split: true }
          );
      }
    });

  // @ts-ignore
  const generateLabelsGeojson = (geojson: DistrictsGeoJSON): Labels => {
    // eslint-disable-next-line
    const labels: Label[] = geojson.features
      .filter((feature: DistrictGeoJSON) => {
        // @ts-ignore
        return feature.geometry.coordinates.length > 0 && feature.id !== 0;
      })
      .map((feature: DistrictGeoJSON) => {
        // @ts-ignore
        return {
          id: feature.id,
          coords: feature.geometry.coordinates.flat(1).reduce(
            // eslint-disable-next-line
            (prev: Position[], current: Position[]) => {
              // If a district contains multiple polygons, label the polygon with the most vertices
              return prev.length > current.length ? prev : current;
            }
          )
        };
      })
      .map(({ id, coords }) => {
        return {
          type: "Feature",
          properties: { id },
          geometry: {
            type: "Point",
            coordinates: polylabel([coords], 0.5)
          }
        };
      });

    return {
      type: "FeatureCollection",
      features: labels
    };
  };
  // Update districts source when geojson is fetched
  useEffect(() => {
    const districtsSource = map && map.getSource(DISTRICTS_SOURCE_ID);
    districtsSource && districtsSource.type === "geojson" && districtsSource.setData(geojson);

    const districtsLabelsSource = map && map.getSource(DISTRICTS_LABELS_SOURCE_ID);
    districtsLabelsSource &&
      districtsLabelsSource.type === "geojson" &&
      districtsLabelsSource.setData(generateLabelsGeojson(geojson));
  }, [map, geojson]);

  // Handle evaluate mode map views
  useEffect(() => {
    if (map) {
      if (evaluateMode) {
        disableEditMode(map, staticMetadata);
        enableCommonEvaluateLayers(map);

        const metric = evaluateMetric?.key;
        // Disable summary layers for *any* metric
        if (metric) {
          disableSummaryEvaluateLayers(map);
        }
        switch (metric) {
          // Handle all evaluate metric views
          case "compactness":
            map.setLayoutProperty(
              DISTRICTS_COMPACTNESS_CHOROPLETH_LAYER_ID,
              "visibility",
              "visible"
            );
            break;
          case "competitiveness":
            break;
          case "contiguity":
            map.setLayoutProperty(
              DISTRICTS_CONTIGUITY_CHLOROPLETH_LAYER_ID,
              "visibility",
              "visible"
            );
            break;
          case "countySplits":
            map.setLayoutProperty(TOPMOST_GEOLEVEL_EVALUATE_SPLIT_ID, "visibility", "visible");
            map.setLayoutProperty(TOPMOST_GEOLEVEL_EVALUATE_FILL_SPLIT_ID, "visibility", "visible");
            break;
          case "equalPopulation":
            map.setLayoutProperty(
              DISTRICTS_EQUAL_POPULATION_CHOROPLETH_LAYER_ID,
              "visibility",
              "visible"
            );
            break;
          case "minorityMajority":
            break;
          // Summary view
          case undefined:
            removeEvaluateMetricLayers(map);
            enableSummaryEvaluateLayers(map);
            break;
          default:
            assertNever(metric);
        }
      } else {
        // Not in evaluate mode, reset
        enableEditmode(map, staticMetadata, geoLevelIndex);
      }
    }
  }, [evaluateMetric, evaluateMode, map, staticMetadata, geoLevelIndex]);

  // Remove selected features from map when selected geounit ids has been emptied
  useEffect(() => {
    map &&
      !areAnyGeoUnitsSelected(selectedGeounits) &&
      (selectedDistrictId === 0
        ? removeSelectedFeatures(map, staticMetadata)
        : // When adding or changing the district to which a geounit is
        // assigned, wait until districts GeoJSON is updated before removing
        // selected state.
        map.isStyleLoaded() && map.isSourceLoaded(DISTRICTS_SOURCE_ID)
        ? removeSelectedFeatures(map, staticMetadata)
        : map.once("idle", () => removeSelectedFeatures(map, staticMetadata)));
    // We don't want to tigger this effect when `selectedDistrictId` changes
    // eslint-disable-next-line
  }, [map, selectedGeounits, staticMetadata]);

  // Update labels when selection is changed
  useEffect(() => {
    // eslint-disable-next-line
    if (map) {
      staticMetadata.geoLevelHierarchy.forEach(geoLevel =>
        map.setLayoutProperty(levelToLabelLayerId(geoLevel.id), "visibility", "none")
      );
      map.setLayoutProperty(levelToLabelLayerId(selectedGeolevel.id), "visibility", "visible");
      map.setLayoutProperty(
        levelToLabelLayerId(selectedGeolevel.id),
        "text-field",
        label ? `{${label}-abbrev}` : ""
      );
    }
  }, [map, label, staticMetadata, selectedGeolevel]);

  useEffect(() => {
    map &&
      [...new Array(project.numberOfDistricts + 1).keys()].forEach(districtId =>
        map.setFeatureState(featureStateDistricts(districtId), {
          locked: lockedDistricts[districtId - 1]
        })
      );
  }, [map, project, lockedDistricts]);

  useEffect(() => {
    if (map && zoomToDistrictId) {
      const districtGeoJSON = geojson.features[zoomToDistrictId];
      if (districtGeoJSON && districtGeoJSON.geometry.coordinates.length) {
        // eslint-disable-next-line
        const boundingBox = bbox(districtGeoJSON) as BBox2d;
        map.fitBounds(boundingBox, { padding: 50 });
        store.dispatch(setZoomToDistrictId(null));
      }
    }
  }, [map, geojson, zoomToDistrictId]);

  // Update layer visibility when geolevel is selected
  useEffect(() => {
    // eslint-disable-next-line
    if (map && staticMetadata) {
      const invertedGeoLevelIndex = staticMetadata.geoLevelHierarchy.length - geoLevelIndex - 1;

      staticMetadata.geoLevelHierarchy.forEach((geoLevel, idx) =>
        map.setLayoutProperty(
          levelToLineLayerId(geoLevel.id),
          "visibility",
          idx >= invertedGeoLevelIndex ? "visible" : "none"
        )
      );
    }
  }, [map, staticMetadata, geoLevelIndex]);

  // Keep track of when selected geounits change
  const prevSelectedGeoUnitsRef = useRef<typeof selectedGeounits | undefined>();
  useEffect(() => {
    prevSelectedGeoUnitsRef.current = selectedGeounits; // eslint-disable-line
  });
  const prevSelectedGeoUnits = prevSelectedGeoUnitsRef.current;

  // Update map when selected geounits change.
  // Typically the geounits change as a result of using the selection tools directly -- map is
  // changed and then that needs to be reflected in state -- but this accounts for undo/redo actions
  // affecting state which then needs to be reflected in the map.
  useEffect(() => {
    // eslint-disable-next-line
    if (map) {
      prevSelectedGeoUnits && setFeaturesSelectedFromGeoUnits(map, prevSelectedGeoUnits, false);
      selectedGeounits && setFeaturesSelectedFromGeoUnits(map, selectedGeounits, true);
    }
  }, [map, selectedGeounits, prevSelectedGeoUnits]);

  // Keep track of when selected geolevel changes
  const prevGeoLevelIndexRef = useRef<typeof geoLevelIndex | undefined>();
  useEffect(() => {
    prevGeoLevelIndexRef.current = geoLevelIndex; // eslint-disable-line
  });
  const prevGeoLevelIndex = prevGeoLevelIndexRef.current;

  useEffect(() => {
    // Convert any larger geounits to the smaller sub-geounits as per the new geolevel
    const prevSelectedGeoLevel =
      prevGeoLevelIndex !== undefined
        ? getSelectedGeoLevel(staticMetadata.geoLevelHierarchy, prevGeoLevelIndex)
        : null;
    const selectedGeounitsForPrevLevel =
      prevSelectedGeoLevel && selectedGeounits[prevSelectedGeoLevel.id];
    // eslint-disable-next-line
    if (
      map &&
      prevGeoLevelIndex !== undefined &&
      geoLevelIndex > prevGeoLevelIndex &&
      prevSelectedGeoLevel &&
      selectedGeounitsForPrevLevel &&
      selectedGeounitsForPrevLevel.size > 0
    ) {
      [...selectedGeounitsForPrevLevel.entries()].forEach(selectedGeoUnit => {
        const [featureId, geoUnitIndices] = selectedGeoUnit;
        // eslint-disable-next-line
        if (geoUnitIndices.length === staticMetadata.geoLevelHierarchy.length) {
          // Don't do this for the smallest geounits since they have no sub-geounits
          return;
        }
        // eslint-disable-next-line
        if (geoUnitIndices.length - 1 === geoLevelIndex) {
          // Don't do anything for previously selected geounits at this level
          return;
        }

        // Deselect the currently selected feature
        map.removeFeatureState({
          id: featureId,
          source: GEOLEVELS_SOURCE_ID,
          sourceLayer: prevSelectedGeoLevel.id
        });

        // Select features of the child geolevel
        const { childGeoLevel, childGeoUnitIds, childGeoUnits } = getChildGeoUnits(
          geoUnitIndices,
          staticMetadata,
          staticGeoLevels
        );
        childGeoUnitIds.forEach(id => {
          map.setFeatureState(
            {
              source: GEOLEVELS_SOURCE_ID,
              id,
              sourceLayer: childGeoLevel.id
            },
            { selected: true }
          );
        });
        const unlockedChildGeoUnits = onlyUnlockedGeoUnits(
          project.districtsDefinition,
          lockedDistricts,
          childGeoUnits,
          staticMetadata,
          staticGeoLevels
        );
        // Update state
        store.dispatch(
          replaceSelectedGeounits({
            add: unlockedChildGeoUnits,
            remove: {
              [prevSelectedGeoLevel.id]: new Map([selectedGeoUnit])
            }
          })
        );
      });
    }
  }, [
    map,
    geoLevelIndex,
    prevGeoLevelIndex,
    selectedGeolevel,
    staticGeoLevels,
    staticMetadata,
    selectedGeounits,
    project,
    lockedDistricts
  ]);

  useEffect(() => {
    // Handle enable and disable of selection tools in the map
    /* eslint-disable */
    if (map && !isReadOnly) {
      // Disable any existing selection tools
      DefaultSelectionTool.disable(map);
      RectangleSelectionTool.disable(map);
      PaintBrushSelectionTool.disable(map);
      if (!evaluateMode && !isPanning) {
        // Enable appropriate tool
        if (selectionTool === SelectionTool.Default) {
          DefaultSelectionTool.enable(
            map,
            selectedGeolevel.id,
            staticMetadata,
            project.districtsDefinition,
            lockedDistricts,
            staticGeoLevels
          );
        } else if (selectionTool === SelectionTool.Rectangle) {
          RectangleSelectionTool.enable(
            map,
            selectedGeolevel.id,
            staticMetadata,
            project.districtsDefinition,
            lockedDistricts,
            staticGeoLevels,
            setSelectionInProgress,
            limitSelectionToCounty
          );
        } else if (selectionTool === SelectionTool.PaintBrush) {
          PaintBrushSelectionTool.enable(
            map,
            selectedGeolevel.id,
            staticMetadata,
            project.districtsDefinition,
            lockedDistricts,
            staticGeoLevels,
            setSelectionInProgress,
            limitSelectionToCounty,
            selectedGeounits
          );
        }
      }
    }
    /* eslint-enable */
  }, [
    map,
    selectionTool,
    selectedGeolevel,
    staticMetadata,
    staticGeoLevels,
    project,
    lockedDistricts,
    isReadOnly,
    evaluateMode,
    isPanning,
    limitSelectionToCounty,
    selectedGeounits
  ]);

  return (
    <Box ref={mapRef} sx={{ width: "100%", height: "100%", position: "relative" }}>
      <MapTooltip map={map || undefined} />
      <MapMessage map={map || undefined} maxZoom={maxZoom} />
      <FindMenu map={map} />
      {evaluateMode && evaluateMetric && evaluateMetric.key === "countySplits" && (
        <Box sx={style.legendBox}>
          <Flex sx={{ alignItems: "center" }}>
            <Text sx={style.legendTitle}>{legendLabel} splits</Text>
            <Flex sx={style.legendItem}>
              <Box
                sx={{
                  ...style.legendColorSwatch,
                  backgroundColor: COUNTY_SPLIT_FILL_COLOR
                }}
              />
              <Text sx={style.legendLabel}>Split</Text>
            </Flex>
            <Flex sx={style.legendItem}>
              <Box
                sx={{
                  ...style.legendColorSwatch,
                  backgroundColor: "transparent"
                }}
              />
              <Text sx={style.legendLabel}>Not split</Text>
            </Flex>
          </Flex>
        </Box>
      )}
      {evaluateMode && evaluateMetric && evaluateMetric.key === "compactness" && (
        <Box sx={style.legendBox}>
          <Flex sx={{ alignItems: "center" }}>
            <Text sx={style.legendTitle}>Compactness</Text>
            <Box sx={{ display: "inline-block" }}>
              {getChoroplethStops(evaluateMetric.key).map((step, i) => (
                <Flex sx={style.legendItem} key={i}>
                  <Box
                    sx={{
                      ...style.legendColorSwatch,
                      backgroundColor: `${step[1]}`
                    }}
                  ></Box>
                  <Text sx={style.legendLabel}>{getChoroplethLabels(evaluateMetric.key)[i]}</Text>
                </Flex>
              ))}
            </Box>
          </Flex>
        </Box>
      )}
      {evaluateMode && evaluateMetric && evaluateMetric.key === "equalPopulation" && (
        <Box sx={style.legendBox}>
          <Flex sx={{ alignItems: "center" }}>
            <Text sx={style.legendTitle}>Equal Population</Text>
            <Box sx={{ display: "inline-block" }}>
              {getChoroplethStops(evaluateMetric.key).map((step, i) => (
                <Flex sx={style.legendItem} key={i}>
                  <Box
                    sx={{
                      ...style.legendColorSwatch,
                      backgroundColor: `${step[1]}`
                    }}
                  ></Box>
                  <Text sx={style.legendLabel}>{getChoroplethLabels(evaluateMetric.key)[i]}</Text>
                </Flex>
              ))}
            </Box>
          </Flex>
        </Box>
      )}
      {evaluateMode && evaluateMetric && evaluateMetric.key === "contiguity" && (
        <Box sx={style.legendBox}>
          <Flex sx={{ alignItems: "center" }}>
            <Text sx={style.legendTitle}>Contiguity</Text>
            <Box sx={{ display: "inline-block" }}>
              <Flex sx={style.legendItem}>
                <Box
                  sx={{
                    ...style.legendColorSwatch,
                    backgroundColor: CONTIGUITY_FILL_COLOR
                  }}
                ></Box>
                <Box sx={style.legendLabel}>Contiguous</Box>
              </Flex>
              <Flex sx={style.legendItem}>
                <Box
                  sx={{
                    ...style.legendColorSwatch,
                    backgroundColor: EVALUATE_GRAY_FILL_COLOR
                  }}
                ></Box>
                <Box sx={style.legendLabel}>Non-contiguous</Box>
              </Flex>
            </Box>
          </Flex>
        </Box>
      )}
    </Box>
  );
};

function mapStateToProps(state: State) {
  return {
    findMenuOpen: state.project.findMenuOpen,
    findTool: state.project.findTool,
    showKeyboardShortcutsModal: state.project.showKeyboardShortcutsModal
  };
}

export default connect(mapStateToProps)(DistrictsMap);
