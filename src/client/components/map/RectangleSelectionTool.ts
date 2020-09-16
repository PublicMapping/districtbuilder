import throttle from "lodash/throttle";
import MapboxGL from "mapbox-gl";
import store from "../../store";
import {
  setSelectedGeounits,
  clearHighlightedGeounits,
  setHighlightedGeounits
} from "../../actions/districtDrawing";
import {
  featuresToUnlockedGeoUnits,
  GEOLEVELS_SOURCE_ID,
  isFeatureSelected,
  levelToSelectionLayerId,
  ISelectionTool,
  SET_FEATURE_DELAY,
  setFeaturesSelectedFromGeoUnits,
  getChildGeoUnits
} from "./index";
import { mergeGeoUnits } from "../../functions";

import {
  DistrictsDefinition,
  GeoUnits,
  IStaticMetadata,
  LockedDistricts,
  UintArrays
} from "../../../shared/entities";

const throttledSetHighlightedGeounits = throttle(
  (geounits: GeoUnits) => store.dispatch(setHighlightedGeounits(geounits)),
  SET_FEATURE_DELAY
);

/*
 * Allows user to click and drag to select all geounits within the rectangle
 * (bounding box) drawn.
 *
 * Any overlap with a geounit will cause it to be selected.
 *
 * Note that this is only additive (does not deselect geounits).
 *
 * Implementation is based off of this example from the Mapbox docs:
 * https://docs.mapbox.com/mapbox-gl-js/example/using-box-queryrenderedfeatures/
 */
const RectangleSelectionTool: ISelectionTool = {
  enable: function(
    map: MapboxGL.Map,
    geoLevelId: string,
    staticMetadata: IStaticMetadata,
    districtsDefinition: DistrictsDefinition,
    lockedDistricts: LockedDistricts,
    staticGeoLevels: UintArrays
  ) {
    map.boxZoom.disable();
    map.dragPan.disable();
    map.getCanvas().style.cursor = "crosshair"; // eslint-disable-line

    const canvas = map.getCanvasContainer();

    // Variable to hold the starting xy coordinates
    // when `mousedown` occured.
    let start: MapboxGL.Point; // eslint-disable-line

    // Variable to hold the current xy coordinates
    // when `mousemove` or `mouseup` occurs.
    let current: MapboxGL.Point; // eslint-disable-line

    // Variable for the draw box element.
    let box: HTMLElement | null; // eslint-disable-line

    canvas.addEventListener("mousedown", mouseDown);
    // Save mouseDown for removal upon disabling
    this.mouseDown = mouseDown; // eslint-disable-line

    let initiallySelectedGeoUnits: GeoUnits; // eslint-disable-line

    // Return the xy coordinates of the mouse position
    function mousePos(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      return new MapboxGL.Point(
        e.clientX - rect.left - canvas.clientLeft,
        e.clientY - rect.top - canvas.clientTop
      );
    }

    function updateSelection(e: MouseEvent) {
      // Find selected features before updating `current` to tell if any features were deselected
      const prevFeatures = current && getFeaturesInBoundingBox([start, current]);

      // Capture the ongoing xy coordinates
      current = mousePos(e);

      // Append the box element if it doesnt exist
      // eslint-disable-next-line
      if (!box) {
        box = document.createElement("div");
        box.classList.add("boxdraw");
        canvas.appendChild(box);
      }

      const minX = Math.min(start.x, current.x),
        maxX = Math.max(start.x, current.x),
        minY = Math.min(start.y, current.y),
        maxY = Math.max(start.y, current.y);

      // Adjust width and xy position of the box element ongoing
      /* eslint-disable */
      const pos = "translate(" + minX + "px," + minY + "px)";
      box.style.transform = pos;
      box.style.webkitTransform = pos;
      box.style.width = maxX - minX + "px";
      box.style.height = maxY - minY + "px";
      /* eslint-enable */

      const features = getFeaturesInBoundingBox([start, current]);
      const geoUnits = featuresToUnlockedGeoUnits(
        features,
        staticMetadata,
        districtsDefinition,
        lockedDistricts,
        staticGeoLevels
      );

      const newGeoUnits = Object.entries(geoUnits).reduce(
        (newGeoUnits, [geoLevelId, geoUnitsForLevel]) => {
          return {
            ...newGeoUnits,
            [geoLevelId]: new Map(
              [...geoUnitsForLevel].filter(
                ([id]) =>
                  !initiallySelectedGeoUnits[geoLevelId].has(id) &&
                  !isFeatureSelected(map, {
                    id,
                    sourceLayer: geoLevelId
                  })
              )
            )
          };
        },
        geoUnits
      );
      // Select new features
      setFeaturesSelectedFromGeoUnits(map, newGeoUnits, true);

      throttledSetHighlightedGeounits(newGeoUnits);

      // Set any features that were previously selected and just became unselected to unselected
      // eslint-disable-next-line
      if (prevFeatures) {
        const prevGeoUnits = featuresToUnlockedGeoUnits(
          prevFeatures,
          staticMetadata,
          districtsDefinition,
          lockedDistricts,
          staticGeoLevels
        );
        Array.from(prevGeoUnits[geoLevelId].keys())
          .filter(
            id => !initiallySelectedGeoUnits[geoLevelId].has(id) && !geoUnits[geoLevelId].has(id)
          )
          .forEach(id => {
            map.setFeatureState(featureStateExpression(id), { selected: false });
          });
      }
    }

    function mouseDown(e: MouseEvent) {
      // Call functions for the following events
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);

      initiallySelectedGeoUnits = featuresToUnlockedGeoUnits(
        getAllSelectedFeatures(),
        staticMetadata,
        districtsDefinition,
        lockedDistricts,
        staticGeoLevels
      );

      // Capture the first xy coordinates
      start = mousePos(e);
      updateSelection(e);
    }

    function onMouseMove(e: MouseEvent) {
      updateSelection(e);
    }

    function onMouseUp(e: MouseEvent) {
      // Capture xy coordinates
      finish([start, mousePos(e)]);
    }

    function featureStateExpression(id?: string | number) {
      return {
        source: GEOLEVELS_SOURCE_ID,
        id,
        sourceLayer: geoLevelId
      };
    }

    function getFeaturesInBoundingBox(
      // eslint-disable-next-line
      bbox: [MapboxGL.PointLike, MapboxGL.PointLike]
    ): readonly MapboxGL.MapboxGeoJSONFeature[] {
      return map.queryRenderedFeatures(bbox, {
        layers: [levelToSelectionLayerId(geoLevelId)]
      });
    }

    /*
     * Get all selected features for all geolevels.
     */
    function getAllSelectedFeatures(): readonly MapboxGL.MapboxGeoJSONFeature[] {
      return map
        .queryRenderedFeatures(undefined, {
          layers: staticMetadata.geoLevelHierarchy.map(geoLevel =>
            levelToSelectionLayerId(geoLevel.id)
          )
        })
        .filter(feature => isFeatureSelected(map, feature));
    }

    // eslint-disable-next-line
    function finish(bbox?: [MapboxGL.PointLike, MapboxGL.PointLike]) {
      // Remove these events now that finish has been called.
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);

      // eslint-disable-next-line
      if (box) {
        box.parentNode && box.parentNode.removeChild(box);
        box = null;
      }

      // If bbox exists. use this value as the argument for `queryRenderedFeatures`
      // eslint-disable-next-line
      if (bbox) {
        const selectedFeatures = getFeaturesInBoundingBox(bbox);
        const geoUnits = featuresToUnlockedGeoUnits(
          selectedFeatures,
          staticMetadata,
          districtsDefinition,
          lockedDistricts,
          staticGeoLevels
        );
        // Deselect any child features as appropriate (this comes into a play when, for example, a
        // blockgroup is selected and then the county _containing_ that blockgroup is selected)
        Object.values(geoUnits).forEach(geoUnitsForLevel => {
          geoUnitsForLevel.forEach(geoUnitIndices => {
            // Ignore bottom two geolevels (base geounits can't have sub-features and base geounits
            // also can't be selected at the same time as features from one geolevel up)
            // eslint-disable-next-line
            if (geoUnitIndices.length <= staticMetadata.geoLevelHierarchy.length - 2) {
              const { childGeoUnits } = getChildGeoUnits(
                geoUnitIndices,
                staticMetadata,
                staticGeoLevels
              );
              setFeaturesSelectedFromGeoUnits(map, childGeoUnits, false);
            }
          });
        });
        store.dispatch(setSelectedGeounits(mergeGeoUnits(geoUnits, initiallySelectedGeoUnits)));
      }
      store.dispatch(clearHighlightedGeounits());
    }
  },
  disable: function(map: MapboxGL.Map) {
    map.boxZoom.enable();
    map.dragPan.enable();
    // eslint-disable-next-line
    map.getCanvas().style.cursor = "grab";
    // eslint-disable-next-line
    this.mouseDown && map.getCanvasContainer().removeEventListener("mousedown", this.mouseDown);
  }
};

export default RectangleSelectionTool;
