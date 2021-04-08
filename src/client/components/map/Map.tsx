/** @jsx jsx */
import { useEffect, useRef, useState } from "react";
import { Box, jsx, ThemeUIStyleObject } from "theme-ui";

import MapboxGL from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import {
  setGeoLevelVisibility,
  SelectionTool,
  replaceSelectedGeounits,
  FindTool
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
import { DistrictsGeoJSON } from "../../types";
import { areAnyGeoUnitsSelected, getSelectedGeoLevel, getTargetPopulation } from "../../functions";
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
  DISTRICTS_EVALUATE_LAYER_ID,
  setFeaturesSelectedFromGeoUnits,
  TOPMOST_GEOLEVEL_EVALUATE_SPLIT_ID,
  TOPMOST_GEOLEVEL_EVALUATE_FILL_SPLIT_ID,
  DISTRICTS_COMPACTNESS_CHOROPLETH_LAYER_ID,
  DISTRICTS_LAYER_ID,
  levelToSelectionLayerId,
  getChoroplethLabels,
  getChoroplethStops,
  DISTRICTS_CONTIGUITY_CHLOROPLETH_LAYER_ID,
  CONTIGUITY_FILL_COLOR,
  COUNTY_SPLIT_FILL_COLOR,
  EVALUATE_GRAY_FILL_COLOR,
  DISTRICTS_EQUAL_POPULATION_CHOROPLETH_LAYER_ID
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

interface Props {
  readonly project: IProject;
  readonly geojson: DistrictsGeoJSON;
  readonly staticMetadata: IStaticMetadata;
  readonly staticGeoLevels: UintArrays;
  readonly selectedGeounits: GeoUnits;
  readonly selectedDistrictId: number;
  readonly selectionTool: SelectionTool;
  readonly geoLevelIndex: number;
  readonly lockedDistricts: LockedDistricts;
  readonly evaluateMetric?: EvaluateMetric;
  readonly evaluateMode: boolean;
  readonly isReadOnly: boolean;
  readonly findMenuOpen: boolean;
  readonly findTool: FindTool;
  readonly label?: string;
  readonly map?: MapboxGL.Map;
  // eslint-disable-next-line
  readonly setMap: (map: MapboxGL.Map) => void;
}

const style: ThemeUIStyleObject = {
  legendLabel: {
    display: "inline-block",
    ml: "5px"
  },
  legendItem: {
    display: "inline-block",
    minWidth: "120px",
    maxWidth: "170px",
    mr: "20px"
  },
  legendTitle: {
    display: "inline-block",
    width: "120px",
    fontWeight: "600",
    mr: "35px"
  },
  legendBox: {
    position: "absolute",
    bottom: "20px",
    left: "100px",
    right: "40px",
    height: "60px",
    minWidth: "600px",
    maxWidth: "1300px",
    fontSize: "14pt",
    display: "inline-block",
    outline: "1px solid gray",
    padding: "20px"
  },
  legendColorSwatch: {
    display: "inline-block",
    mr: "10px",
    width: "20px",
    height: "20px",
    opacity: "0.9",
    outline: "1px solid lightgray"
  }
};

const DistrictsMap = ({
  project,
  geojson,
  staticMetadata,
  staticGeoLevels,
  selectedGeounits,
  selectedDistrictId,
  selectionTool,
  geoLevelIndex,
  lockedDistricts,
  isReadOnly,
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

    const setLevelVisibility = () =>
      store.dispatch(setGeoLevelVisibility(getGeoLevelVisibility(map, staticMetadata)));
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

  function downHandler({ key }: KeyboardEvent) {
    if (key === "Spacebar" || key === " ") {
      setTogglePan(true);
    }
  }

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
  }, []);

  // Update districts source when geojson is fetched or find type is changed
  useEffect(() => {
    const avgPopulation = getTargetPopulation(geojson, project);
    // Add a color property to the geojson, so it can be used for styling
    geojson.features.forEach((feature, id) => {
      const districtColor = getDistrictColor(id);
      // eslint-disable-next-line
      feature.properties.outlineColor =
        findMenuOpen &&
        ((findTool === FindTool.Unassigned && id === 0) ||
          (findTool === FindTool.NonContiguous &&
            id !== 0 &&
            feature.geometry.coordinates.length >= 2))
          ? // Set pink outline to make unassigned/non-contiguous districts stand out
            "#F25DFE"
          : id === selectedDistrictId
          ? // District is selected so set outline to district color
            districtColor
          : "transparent";
      // eslint-disable-next-line
      feature.properties.color = getDistrictColor(id);
      const populationDeviation = feature.properties.demographics.population - avgPopulation;
      // eslint-disable-next-line
      feature.properties.percentDeviation =
        feature.properties.demographics.population > 0 && feature.id !== 0
          ? populationDeviation / avgPopulation
          : undefined;
      // eslint-disable-next-line
      feature.properties.populationDeviation = populationDeviation;
    });

    const districtsSource = map && map.getSource(DISTRICTS_SOURCE_ID);
    districtsSource && districtsSource.type === "geojson" && districtsSource.setData(geojson);
  }, [map, geojson, findMenuOpen, findTool, selectedDistrictId]);

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

  // Handle evaluate mode map views
  useEffect(() => {
    if (map) {
      if (evaluateMetric && evaluateMode) {
        // Remove all geolayers from view
        staticMetadata.geoLevelHierarchy.forEach(geoLevel => {
          map.setLayoutProperty(levelToLineLayerId(geoLevel.id), "visibility", "none");
          map.setLayoutProperty(levelToSelectionLayerId(geoLevel.id), "visibility", "none");
        });
        map.setLayoutProperty(DISTRICTS_LAYER_ID, "visibility", "none");
        if (evaluateMetric.key === "compactness") {
          map.setLayoutProperty(DISTRICTS_COMPACTNESS_CHOROPLETH_LAYER_ID, "visibility", "visible");
        }
        if (evaluateMetric.key === "countySplits") {
          map.setLayoutProperty(DISTRICTS_EVALUATE_LAYER_ID, "visibility", "visible");
          map.setLayoutProperty(TOPMOST_GEOLEVEL_EVALUATE_SPLIT_ID, "visibility", "visible");
          map.setLayoutProperty(TOPMOST_GEOLEVEL_EVALUATE_FILL_SPLIT_ID, "visibility", "visible");
        }
        if (evaluateMetric.key === "contiguity") {
          map.setLayoutProperty(DISTRICTS_EVALUATE_LAYER_ID, "visibility", "visible");
          map.setLayoutProperty(DISTRICTS_CONTIGUITY_CHLOROPLETH_LAYER_ID, "visibility", "visible");
        }
        if (evaluateMetric.key === "equalPopulation") {
          map.setLayoutProperty(DISTRICTS_EVALUATE_LAYER_ID, "visibility", "visible");
          map.setLayoutProperty(
            DISTRICTS_EQUAL_POPULATION_CHOROPLETH_LAYER_ID,
            "visibility",
            "visible"
          );
        }
        DefaultSelectionTool.disable(map);
        RectangleSelectionTool.disable(map);
        PaintBrushSelectionTool.disable(map);
      } else {
        // Reset map state to default
        map.setLayoutProperty(DISTRICTS_LAYER_ID, "visibility", "visible");
        map.setLayoutProperty(DISTRICTS_EVALUATE_LAYER_ID, "visibility", "none");
        map.setLayoutProperty(DISTRICTS_COMPACTNESS_CHOROPLETH_LAYER_ID, "visibility", "none");
        map.setLayoutProperty(DISTRICTS_EQUAL_POPULATION_CHOROPLETH_LAYER_ID, "visibility", "none");
        map.setLayoutProperty(TOPMOST_GEOLEVEL_EVALUATE_SPLIT_ID, "visibility", "none");
        map.setLayoutProperty(TOPMOST_GEOLEVEL_EVALUATE_FILL_SPLIT_ID, "visibility", "none");
        map.setLayoutProperty(DISTRICTS_CONTIGUITY_CHLOROPLETH_LAYER_ID, "visibility", "none");
        const invertedGeoLevelIndex = staticMetadata.geoLevelHierarchy.length - geoLevelIndex - 1;
        staticMetadata.geoLevelHierarchy.forEach((geoLevel, idx) => {
          const geoLevelVisibility = idx >= invertedGeoLevelIndex ? "visible" : "none";
          map.setLayoutProperty(
            levelToSelectionLayerId(geoLevel.id),
            "visibility",
            geoLevelVisibility
          );
          map.setLayoutProperty(levelToLineLayerId(geoLevel.id), "visibility", geoLevelVisibility);
        });
      }
    }
  }, [evaluateMetric, evaluateMode, map, staticMetadata.geoLevelHierarchy, geoLevelIndex]);

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
            setSelectionInProgress
          );
        } else if (selectionTool === SelectionTool.PaintBrush) {
          PaintBrushSelectionTool.enable(
            map,
            selectedGeolevel.id,
            staticMetadata,
            project.districtsDefinition,
            lockedDistricts,
            staticGeoLevels,
            setSelectionInProgress
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
    isPanning
  ]);

  return (
    <Box ref={mapRef} sx={{ width: "100%", height: "100%", position: "relative" }}>
      <MapTooltip map={map || undefined} />
      <MapMessage map={map || undefined} maxZoom={maxZoom} />
      <FindMenu map={map} />
      {evaluateMode && evaluateMetric && evaluateMetric.key === "countySplits" && (
        <Box sx={style.legendBox}>
          <Box sx={style.legendTitle}>County splits</Box>
          <Box sx={style.legendItem}>
            <Box
              sx={{
                ...style.legendColorSwatch,
                backgroundColor: COUNTY_SPLIT_FILL_COLOR
              }}
            />
            <Box sx={style.legendLabel}>Split</Box>
          </Box>
          <Box sx={style.legendItem}>
            <Box
              sx={{
                ...style.legendColorSwatch,
                backgroundColor: "none"
              }}
            />
            <Box sx={style.legendLabel}>Not split</Box>
          </Box>
        </Box>
      )}
      {evaluateMode && evaluateMetric && evaluateMetric.key === "compactness" && (
        <Box sx={style.legendBox}>
          <Box sx={style.legendTitle}>Compactness</Box>
          {getChoroplethStops(evaluateMetric.key).map((step, i) => (
            <Box sx={style.legendItem} key={i}>
              <Box
                sx={{
                  ...style.legendColorSwatch,
                  backgroundColor: `${step[1]}`
                }}
              ></Box>
              <Box sx={style.legendLabel}>{getChoroplethLabels(evaluateMetric.key)[i]}</Box>
            </Box>
          ))}
        </Box>
      )}
      {evaluateMode && evaluateMetric && evaluateMetric.key === "equalPopulation" && (
        <Box sx={style.legendBox}>
          <Box sx={style.legendTitle}>Equal Population</Box>
          {getChoroplethStops(evaluateMetric.key).map((step, i) => (
            <Box sx={style.legendItem} key={i}>
              <Box
                sx={{
                  ...style.legendColorSwatch,
                  backgroundColor: `${step[1]}`
                }}
              ></Box>
              <Box sx={style.legendLabel}>{getChoroplethLabels(evaluateMetric.key)[i]}</Box>
            </Box>
          ))}
        </Box>
      )}
      {evaluateMode && evaluateMetric && evaluateMetric.key === "contiguity" && (
        <Box sx={style.legendBox}>
          <Box sx={style.legendTitle}>Contiguity</Box>
          <Box sx={style.legendItem}>
            <Box
              sx={{
                ...style.legendColorSwatch,
                backgroundColor: CONTIGUITY_FILL_COLOR
              }}
            ></Box>
            <Box sx={style.legendLabel}>Contiguous</Box>
          </Box>
          <Box sx={style.legendItem}>
            <Box
              sx={{
                ...style.legendColorSwatch,
                backgroundColor: EVALUATE_GRAY_FILL_COLOR
              }}
            ></Box>
            <Box sx={style.legendLabel}>Non-contiguous</Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

function mapStateToProps(state: State) {
  return {
    findMenuOpen: state.project.findMenuOpen,
    findTool: state.project.findTool
  };
}

export default connect(mapStateToProps)(DistrictsMap);
