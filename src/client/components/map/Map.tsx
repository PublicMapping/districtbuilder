/** @jsx jsx */
import { maxBy } from "lodash";
import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Flex, Text, jsx, ThemeUIStyleObject, Themed } from "theme-ui";
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
  setZoomToDistrictId,
  PaintBrushSize
} from "../../actions/districtDrawing";
import { getDistrictColor } from "../../constants/colors";
import {
  TypedArrays,
  GeoUnits,
  IProject,
  IStaticMetadata,
  LockedDistricts,
  ReferenceLayerId,
  IReferenceLayer,
  GroupTotal
} from "../../../shared/entities";
import {
  DistrictsGeoJSON,
  DistrictGeoJSON,
  ElectionYear,
  EvaluateMetricWithValue
} from "../../types";
import {
  areAnyGeoUnitsSelected,
  getSelectedGeoLevel,
  geoLevelLabelSingular,
  assertNever,
  hasMultipleElections,
  calculatePVI,
  getPopulationPerRepresentative,
  getDemographicsPercentages
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
  DISTRICTS_CONTIGUITY_CHLOROPLETH_LAYER_ID,
  CONTIGUITY_FILL_COLOR,
  COUNTY_SPLIT_FILL_COLOR,
  EVALUATE_GRAY_FILL_COLOR,
  DISTRICTS_EVALUATE_LABELS_LAYER_ID,
  DISTRICTS_EQUAL_POPULATION_CHOROPLETH_LAYER_ID,
  DISTRICTS_EVALUATE_OUTLINE_LAYER_ID,
  DISTRICTS_HOVER_OUTLINE_LAYER_ID,
  getCompactnessStops,
  getCompactnessLabels,
  getEqualPopulationStops,
  getEqualPopulationLabels,
  getPviSteps,
  getPviLabels,
  getMajorityRaceSplitFill,
  getMajorityRaceFills,
  DISTRICTS_COMPETITIVENESS_CHOROPLETH_LAYER_ID,
  DISTRICTS_MAJORITY_RACE_CHOROPLETH_LAYER_ID,
  DISTRICTS_SELECTED_OUTLINE_LAYER_ID
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
import Icon from "../Icon";
import { ReferenceLayerTypes } from "../../../shared/constants";
import { REFERENCE_LAYER_COLOR_CODES } from "../../constants/colors";
import { Resource } from "../../resource";
import { getColor } from "@theme-ui/color";
import theme from "../../theme";
import { getDemographicsGroups } from "../../../shared/functions";

function removeEvaluateMetricLayers(map: MapboxGL.Map) {
  map.setLayoutProperty(DISTRICTS_COMPACTNESS_CHOROPLETH_LAYER_ID, "visibility", "none");
  map.setLayoutProperty(DISTRICTS_COMPETITIVENESS_CHOROPLETH_LAYER_ID, "visibility", "none");
  map.setLayoutProperty(DISTRICTS_EQUAL_POPULATION_CHOROPLETH_LAYER_ID, "visibility", "none");
  map.setLayoutProperty(DISTRICTS_MAJORITY_RACE_CHOROPLETH_LAYER_ID, "visibility", "none");
  map.setLayoutProperty(TOPMOST_GEOLEVEL_EVALUATE_SPLIT_ID, "visibility", "none");
  map.setLayoutProperty(TOPMOST_GEOLEVEL_EVALUATE_FILL_SPLIT_ID, "visibility", "none");
  map.setLayoutProperty(DISTRICTS_CONTIGUITY_CHLOROPLETH_LAYER_ID, "visibility", "none");
}

function disableEditMode(
  map: MapboxGL.Map,
  staticMetadata: IStaticMetadata,
  activeReferenceLayers: readonly IReferenceLayer[]
) {
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

  // Show outlines
  map.setLayoutProperty(DISTRICTS_EVALUATE_OUTLINE_LAYER_ID, "visibility", "visible");

  // Hide reference layers
  activeReferenceLayers.forEach(layer => {
    map.setLayoutProperty(getRefLayerLayerId(layer.id), "visibility", "none");
    if (layer.layer_type === ReferenceLayerTypes.Polygon) {
      map.setLayoutProperty(getRefLayerLineLabelsLayerId(layer.id), "visibility", "none");
    }
  });
}

function enableEditmode(
  map: MapboxGL.Map,
  staticMetadata: IStaticMetadata,
  geoLevelIndex: number,
  activeReferenceLayers: readonly IReferenceLayer[]
) {
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

  // Hide outlines
  map.setLayoutProperty(DISTRICTS_EVALUATE_OUTLINE_LAYER_ID, "visibility", "none");

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

  // Show active reference layers
  activeReferenceLayers.forEach(layer => {
    map.setLayoutProperty(getRefLayerLayerId(layer.id), "visibility", "visible");
    if (layer.layer_type === ReferenceLayerTypes.Polygon) {
      map.setLayoutProperty(getRefLayerLineLabelsLayerId(layer.id), "visibility", "visible");
    }
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

const getRefLayerSourceId = (layerId: ReferenceLayerId) => `reference-source-${layerId}`;
const getRefLayerLayerId = (layerId: ReferenceLayerId) => `reference-layer-${layerId}`;
const getRefLayerLineLabelsLayerId = (layerId: ReferenceLayerId) =>
  `reference-layer-labels-${layerId}`;

interface Props {
  readonly project: IProject;
  readonly geojson: DistrictsGeoJSON;
  readonly staticMetadata: IStaticMetadata;
  readonly staticGeoLevels: TypedArrays;
  readonly selectedGeounits: GeoUnits;
  readonly selectedDistrictId: number;
  readonly hoveredDistrictId: number | null;
  readonly zoomToDistrictId: number | null;
  readonly selectionTool: SelectionTool;
  readonly paintBrushSize: PaintBrushSize;
  readonly geoLevelIndex: number;
  readonly lockedDistricts: LockedDistricts;
  readonly expandedProjectMetrics: boolean;
  readonly evaluateMetric?: EvaluateMetricWithValue;
  readonly evaluateMode: boolean;
  readonly isReadOnly: boolean;
  readonly isArchived: boolean;
  readonly isThisUsersMap: boolean;
  readonly limitSelectionToCounty: boolean;
  readonly findMenuOpen: boolean;
  readonly referenceLayers: Resource<readonly IReferenceLayer[]>;
  readonly showReferenceLayers: ReadonlySet<ReferenceLayerId>;
  readonly findTool: FindTool;
  readonly label?: string;
  readonly map?: MapboxGL.Map;
  readonly electionYear: ElectionYear;
  readonly populationKey: GroupTotal;
  // eslint-disable-next-line
  readonly setMap: (map: MapboxGL.Map) => void;
}

interface LabelId {
  readonly id?: string | number;
}
type Label = Feature<Point, LabelId>;
type Labels = FeatureCollection<Point, LabelId>;

const style: Record<string, ThemeUIStyleObject> = {
  archivedMessage: {
    position: "absolute",
    bg: "muted",
    width: "auto",
    top: 3,
    left: 3,
    border: "1px solid",
    borderColor: "gray.2",
    borderRadius: "small",
    boxShadow: "large",
    p: 3,
    display: "inline-block",
    minWidth: "fit-content",
    zIndex: "200"
  },
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
  },
  raceHeader: {
    pr: "20px"
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
  paintBrushSize,
  geoLevelIndex,
  lockedDistricts,
  isReadOnly,
  isArchived,
  isThisUsersMap,
  expandedProjectMetrics,
  limitSelectionToCounty,
  findMenuOpen,
  evaluateMetric,
  evaluateMode,
  findTool,
  label,
  map,
  referenceLayers,
  showReferenceLayers,
  setMap,
  electionYear,
  populationKey
}: Props) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectionInProgress, setSelectionInProgress] = useState<boolean>();
  const [panToggled, setTogglePan] = useState<boolean>(false);
  const [activeReferenceLayers, setActiveReferenceLayers] = useState<readonly IReferenceLayer[]>(
    []
  );

  const isPanning =
    panToggled &&
    !selectionInProgress &&
    (selectionTool === SelectionTool.Rectangle || selectionTool === SelectionTool.PaintBrush);

  // Conversion from readonly -> mutable to match Mapbox interface
  const [b0, b1, b2, b3] = staticMetadata.bbox;

  const selectedGeolevel = getSelectedGeoLevel(staticMetadata.geoLevelHierarchy, geoLevelIndex);

  const multipleElections = hasMultipleElections(staticMetadata);

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
    map && map.resize();
  }, [expandedProjectMetrics, map]);

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
      "bottom-right"
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
        project?.populationDeviation
      );

      setMap(map);

      map.resize();
    };

    setLevelVisibility();
    map.on("load", onMapLoad);
    map.on("zoomend", setLevelVisibility);
    map.loadImage(
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require("../../media/map-pin.png"),
      (error: unknown, image: HTMLImageElement | ArrayBufferView | ImageData) => {
        // eslint-disable-next-line functional/no-throw-statement
        if (error) throw error;
        // add image to the active style and make it SDF-enabled
        map.addImage("map-pin", image, { sdf: true });
      }
    );

    return () => {
      map.off("load", onMapLoad);
      map.off("zoomend", setLevelVisibility);
    };

    // Everything in this effect should only happen on component load
    // eslint-disable-next-line
  }, [mapRef]);

  const downHandler = useCallback(
    (key: KeyboardEvent) => {
      // Don't allow keyboard shortcuts to mess with form elements
      if (
        ["button", "select", "input"].includes(document.activeElement?.tagName.toLowerCase() || "")
      ) {
        return;
      }

      const meta = navigator.appVersion.indexOf("Mac") !== -1 ? "metaKey" : "ctrlKey";
      const shortcut = KEYBOARD_SHORTCUTS.find(
        shortcut =>
          (shortcut.key === key.key || shortcut.key.toLowerCase() === key.key) &&
          !!shortcut.meta === key[meta] &&
          !!shortcut.shift === key.shiftKey
      );
      if (
        shortcut &&
        (!isReadOnly || shortcut?.allowReadOnly) &&
        (!evaluateMode || shortcut?.allowInEvaluateMode) &&
        (multipleElections || !shortcut?.onlyForMultipleElections)
      ) {
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
          expandedProjectMetrics,
          paintBrushSize,
          setTogglePan,
          electionYear
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
      evaluateMode,
      paintBrushSize,
      expandedProjectMetrics,
      multipleElections,
      electionYear
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
    const popPerRep = getPopulationPerRepresentative(geojson, project.numberOfMembers);

    geojson.features.forEach((feature, id) => {
      // Add a color property to the geojson, so it can be used for styling
      const districtColor = getDistrictColor(id);
      // eslint-disable-next-line functional/immutable-data
      feature.properties.id = id;
      // eslint-disable-next-line functional/immutable-data
      feature.properties.findOutlineColor =
        findMenuOpen &&
        ((findTool === FindTool.Unassigned && id === 0) ||
          (findTool === FindTool.NonContiguous &&
            id !== 0 &&
            feature.geometry.coordinates.length >= 2))
          ? // Set pink outline to make unassigned/non-contiguous districts stand out
            "#F25DFE"
          : "transparent";
      // eslint-disable-next-line functional/immutable-data
      feature.properties.color = districtColor;

      // The population goal for the unassigned district is 0,
      // so it's deviation is equal to its population
      const targetPopulation = feature.id !== 0 ? popPerRep * project.numberOfMembers[id - 1] : 0;
      const populationDeviation = feature.properties.demographics.population - targetPopulation;

      // eslint-disable-next-line functional/immutable-data
      feature.properties.percentDeviation =
        feature.properties.demographics.population !== 0 && feature.id !== 0
          ? // Special case - for 0% deviation, off-by-one counts as 0 when population is not evenly divisible
            project.populationDeviation === 0 &&
            Math.abs(populationDeviation) <= 1 &&
            targetPopulation % 1 !== 0
            ? 0
            : populationDeviation / targetPopulation
          : undefined;
      const electionYear =
        evaluateMetric && "electionYear" in evaluateMetric
          ? evaluateMetric.electionYear
          : undefined;
      // eslint-disable-next-line
      feature.properties.pvi = feature.properties.voting
        ? evaluateMetric && "electionYear" in evaluateMetric
          ? calculatePVI(feature.properties.voting, evaluateMetric.electionYear)
          : calculatePVI(feature.properties.voting, electionYear)
        : undefined;

      // eslint-disable-next-line
      feature.properties.populationDeviation = populationDeviation;
      if (feature.properties.demographics.population !== 0) {
        const demographicsGroups = getDemographicsGroups(staticMetadata);
        const percents = Object.entries(
          getDemographicsPercentages(
            feature.properties.demographics,
            demographicsGroups,
            populationKey
          )
        );
        const majorityRace = maxBy(
          percents.filter(([, val]) => val > 50),
          ([, val]) => val
        );
        if (!majorityRace) {
          // eslint-disable-next-line
          feature.properties.majorityRace = "minority coalition";
          const whiteSplit =
            feature.properties.demographics.white / feature.properties.demographics.population;
          // eslint-disable-next-line
          feature.properties.majorityRaceSplit = (1 - whiteSplit) * 100;
        } else {
          // eslint-disable-next-line
          feature.properties.majorityRace = majorityRace[0];
          // eslint-disable-next-line
          feature.properties.majorityRaceSplit = majorityRace[1];
        }
        // eslint-disable-next-line
        feature.properties.majorityRaceFill =
          feature.properties.majorityRace && feature.properties.majorityRaceSplit
            ? getMajorityRaceSplitFill(
                feature.properties.majorityRace,
                feature.properties.majorityRaceSplit
              )
            : "ffffff";
      }

      // eslint-disable-next-line
      feature.properties.outlineWidthScaleFactor = findMenuOpen ? 1 : 2;
    });

    const districtsSource = map && map.getSource(DISTRICTS_SOURCE_ID);
    districtsSource && districtsSource.type === "geojson" && districtsSource.setData(geojson);
  }, [
    map,
    geojson,
    findMenuOpen,
    findTool,
    project.numberOfMembers,
    project.populationDeviation,
    evaluateMetric,
    staticMetadata,
    populationKey
  ]);

  // Update layer styles when district is selected
  useEffect(() => {
    if (map) {
      map.setPaintProperty(DISTRICTS_SELECTED_OUTLINE_LAYER_ID, "line-color", [
        "match",
        ["id"],
        selectedDistrictId,
        getDistrictColor(selectedDistrictId),
        "transparent"
      ]);
    }
  }, [map, selectedDistrictId]);
  // Update layer styles when district is hovered
  useEffect(() => {
    if (map && hoveredDistrictId) {
      map.setPaintProperty(DISTRICTS_HOVER_OUTLINE_LAYER_ID, "line-color", [
        "match",
        ["id"],
        hoveredDistrictId,
        getDistrictColor(hoveredDistrictId),
        "transparent"
      ]);
    }
  }, [map, hoveredDistrictId]);

  // Add / remove reference layers when there are selected in the sidebar
  useEffect(() => {
    if (map && "resource" in referenceLayers) {
      activeReferenceLayers.forEach(layer => {
        if (
          activeReferenceLayers.some(l => l.id === layer.id) &&
          !showReferenceLayers.has(layer.id)
        ) {
          // If the layer was visible before, remove it
          map.removeLayer(getRefLayerLayerId(layer.id));
          if (layer.layer_type === ReferenceLayerTypes.Polygon) {
            map.removeLayer(getRefLayerLineLabelsLayerId(layer.id));
          }
          map.removeSource(getRefLayerSourceId(layer.id));
          setActiveReferenceLayers([...activeReferenceLayers.filter(l => l.id !== layer.id)]);
        }
      });

      referenceLayers.resource.forEach(layer => {
        if (
          !activeReferenceLayers.some(l => l.id === layer.id) &&
          showReferenceLayers.has(layer.id)
        ) {
          // If the layer isn't already visible, add it
          map.addSource(getRefLayerSourceId(layer.id), {
            type: "geojson",
            data: `/api/reference-layer/${layer.id}/geojson`
          });
          if (layer.layer_type === ReferenceLayerTypes.Polygon) {
            map.addLayer({
              id: getRefLayerLayerId(layer.id),
              type: "line",
              source: getRefLayerSourceId(layer.id),
              paint: {
                "line-color": getColor(theme, REFERENCE_LAYER_COLOR_CODES[layer.layer_color]),
                "line-opacity": 0.9,
                "line-width": ["interpolate", ["linear"], ["zoom"], 6, 2, 14, 5]
              }
            });
            map.addLayer({
              id: getRefLayerLineLabelsLayerId(layer.id),
              type: "symbol",
              source: getRefLayerSourceId(layer.id),
              layout: {
                "text-field": ["get", layer.label_field],
                "symbol-placement": "point"
              },
              paint: {
                "text-color": "#000",
                "text-halo-color": "#FFF",
                "text-halo-width": 1
              }
            });
          } else if (layer.layer_type === ReferenceLayerTypes.Point) {
            map.addLayer({
              id: getRefLayerLayerId(layer.id),
              type: "symbol",
              source: getRefLayerSourceId(layer.id),
              layout: {
                "icon-image": "map-pin",
                "icon-allow-overlap": true,
                "icon-ignore-placement": true,
                "text-optional": true,
                "text-field": ["get", layer.label_field],
                "text-anchor": "top"
              },
              paint: {
                "icon-color": getColor(theme, REFERENCE_LAYER_COLOR_CODES[layer.layer_color]),
                "text-translate": [0, 12],
                "text-color": "#000",
                "text-halo-color": "#FFF",
                "text-halo-width": 1
              }
            });
          } else {
            assertNever(layer.layer_type);
          }
          setActiveReferenceLayers([...activeReferenceLayers, layer]);
        }
      });
      // update layer color on change
      activeReferenceLayers.forEach(layer => {
        if (
          activeReferenceLayers.some(l => l.id === layer.id) &&
          showReferenceLayers.has(layer.id)
        ) {
          referenceLayers.resource.forEach(updatedLayer => {
            if (updatedLayer.id === layer.id) {
              map.setPaintProperty(
                getRefLayerLayerId(layer.id),
                layer.layer_type === ReferenceLayerTypes.Polygon ? "line-color" : "icon-color",
                REFERENCE_LAYER_COLOR_CODES[updatedLayer.layer_color]
              );
            }
          });
        }
      });
    }
  }, [map, showReferenceLayers, referenceLayers, activeReferenceLayers]);

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
        disableEditMode(map, staticMetadata, activeReferenceLayers);
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
            map.setLayoutProperty(
              DISTRICTS_COMPETITIVENESS_CHOROPLETH_LAYER_ID,
              "visibility",
              "visible"
            );
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
          case "majorityMinority":
            map.setLayoutProperty(
              DISTRICTS_MAJORITY_RACE_CHOROPLETH_LAYER_ID,
              "visibility",
              "visible"
            );
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
        enableEditmode(map, staticMetadata, geoLevelIndex, activeReferenceLayers);
      }
    }
  }, [evaluateMetric, evaluateMode, map, staticMetadata, geoLevelIndex, activeReferenceLayers]);

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
            paintBrushSize,
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
    selectedGeounits,
    paintBrushSize
  ]);

  const brushCircleRadius = 30 * paintBrushSize;

  return (
    <Box ref={mapRef} sx={{ width: "100%", height: "100%", position: "relative" }}>
      <MapTooltip map={map || undefined} />
      <MapMessage map={map || undefined} maxZoom={maxZoom} />
      <FindMenu map={map} />
      <div
        id="brush-circle"
        style={{
          visibility: "hidden",
          opacity: 0.5,
          position: "absolute",
          zIndex: 999,
          marginTop: (brushCircleRadius / 2) * -1,
          marginLeft: (brushCircleRadius / 2) * -1
        }}
      >
        <svg height={brushCircleRadius} width={brushCircleRadius}>
          <circle
            cx={brushCircleRadius / 2}
            cy={brushCircleRadius / 2}
            r={brushCircleRadius / 2}
            strokeWidth="0"
          ></circle>
        </svg>
      </div>
      {!evaluateMode && isThisUsersMap && isArchived && (
        <Box sx={style.archivedMessage}>
          <Icon name="alert-triangle" /> This map is using an archived region and can no longer be
          edited.
        </Box>
      )}
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
              {getCompactnessStops().map((step, i) => (
                <Flex sx={style.legendItem} key={i}>
                  <Box
                    sx={{
                      ...style.legendColorSwatch,
                      backgroundColor: `${step[1]}`
                    }}
                  ></Box>
                  <Text sx={style.legendLabel}>{getCompactnessLabels()[i]}</Text>
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
              {getEqualPopulationStops(project.populationDeviation).map((step, i) => (
                <Flex sx={style.legendItem} key={i}>
                  <Box
                    sx={{
                      ...style.legendColorSwatch,
                      backgroundColor: `${step[1]}`
                    }}
                  ></Box>
                  <Text sx={style.legendLabel}>
                    {project ? getEqualPopulationLabels(project.populationDeviation)[i] : ""}
                  </Text>
                </Flex>
              ))}
            </Box>
          </Flex>
        </Box>
      )}
      {evaluateMode && evaluateMetric && evaluateMetric.key === "competitiveness" && (
        <Box sx={style.legendBox}>
          <Flex sx={{ alignItems: "center" }}>
            <Text sx={style.legendTitle}>Competitiveness</Text>
            <Box sx={{ display: "inline-block" }}>
              {getPviSteps().map((step, i) => (
                <Flex sx={style.legendItem} key={i}>
                  <Box
                    sx={{
                      ...style.legendColorSwatch,
                      backgroundColor: `${step[1]}`
                    }}
                  ></Box>
                  <Text sx={style.legendLabel}>{getPviLabels()[i]}</Text>
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
      {evaluateMode && evaluateMetric && evaluateMetric.key === "majorityMinority" && (
        <Box sx={style.legendBox}>
          <Flex sx={{ alignItems: "center" }}>
            <Text sx={style.legendTitle}>Majority Race</Text>
            <Themed.table sx={{ margin: "0", width: "100%" }}>
              <thead>
                <Themed.tr>
                  {Object.keys(getMajorityRaceFills()).map(race => (
                    <Themed.th sx={style.raceHeader} key={race}>
                      {race.charAt(0).toUpperCase() + race.slice(1)}
                    </Themed.th>
                  ))}
                </Themed.tr>
              </thead>
              <tbody>
                <Themed.tr>
                  {Object.keys(getMajorityRaceFills()).map(race => (
                    <Themed.td sx={style.td} key={race}>
                      <Box
                        sx={{
                          ...style.legendColorSwatch,
                          backgroundColor: getMajorityRaceFills()[race][0]
                        }}
                      ></Box>
                      <Box sx={style.legendLabel}>&gt; 65%</Box>
                    </Themed.td>
                  ))}
                </Themed.tr>
                <Themed.tr>
                  {Object.keys(getMajorityRaceFills()).map(race => (
                    <Themed.td sx={style.td} key={race}>
                      <Box
                        sx={{
                          ...style.legendColorSwatch,
                          backgroundColor: getMajorityRaceFills()[race][1]
                        }}
                      ></Box>
                      <Box sx={style.legendLabel}>50-65%</Box>
                    </Themed.td>
                  ))}
                </Themed.tr>
              </tbody>
            </Themed.table>
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
    electionYear: state.projectOptions.electionYear,
    populationKey: state.projectOptions.populationKey,
    showKeyboardShortcutsModal: state.projectModals.showKeyboardShortcutsModal,
    referenceLayers: state.project.referenceLayers,
    showReferenceLayers: state.project.showReferenceLayers,
    isThisUsersMap:
      "resource" in state.user &&
      "resource" in state.project.projectData &&
      state.user.resource.id === state.project.projectData.resource.project.user.id
  };
}

export default connect(mapStateToProps)(DistrictsMap);
