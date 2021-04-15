import throttle from "lodash/throttle";
import { isEqual } from "lodash";
import MapboxGL from "mapbox-gl";

import {
  DistrictsDefinition,
  GeoUnits,
  IStaticMetadata,
  LockedDistricts,
  UintArrays
} from "../../../shared/entities";

import {
  addSelectedGeounits,
  clearHighlightedGeounits,
  setHighlightedGeounits
} from "../../actions/districtDrawing";
import store from "../../store";

import {
  featuresToUnlockedGeoUnits,
  filterGeoUnits,
  GEOLEVELS_SOURCE_ID,
  isFeatureSelected,
  levelToSelectionLayerId,
  ISelectionTool,
  SET_FEATURE_DELAY,
  setFeaturesSelectedFromGeoUnits,
  deselectChildGeounits,
  filterGeoUnitsByCounty,
  getCurrentCountyFromGeoUnits
} from "./index";

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
    staticGeoLevels: UintArrays,
    limitSelectionToCounty?: boolean,
    setActive: (isActive: boolean) => void
  ) {
    map.boxZoom.disable();
    map.dragPan.disable();
    map.getCanvas().style.cursor = "crosshair"; // eslint-disable-line

    const canvas = map.getCanvasContainer();

    // Variable to hold the starting xy coordinates
    // when `mousedown` occured.
    let start: MapboxGL.Point; // eslint-disable-line

    let currentCounty: number | undefined = undefined; // eslint-disable-line

    // Variable to hold the current xy coordinates
    // when `mousemove` or `mouseup` occurs.
    let current: MapboxGL.Point; // eslint-disable-line

    // Variable for the draw box element.
    let box: HTMLElement | null; // eslint-disable-line

    canvas.addEventListener("mousedown", mouseDown);
    // Save mouseDown for removal upon disabling
    this.mouseDown = mouseDown; // eslint-disable-line

    let initiallySelectedGeoUnits: GeoUnits; // eslint-disable-line

    // Since this function is throttled, check that the box still exists before setting any
    // highlighted geounits. When the mouse is released, box is set to null, and we don't
    // want any stale data being dispatched
    const throttledSetHighlightedGeounits = throttle(
      (geounits: GeoUnits) => box && store.dispatch(setHighlightedGeounits(geounits)),
      SET_FEATURE_DELAY
    );

    // Return the xy coordinates of the mouse position
    function mousePos(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      return new MapboxGL.Point(
        e.clientX - rect.left - canvas.clientLeft,
        e.clientY - rect.top - canvas.clientTop
      );
    }

    /*
     * Update highlighting as box dimensions change.
     *
     * Note that highlighting is distinct from true selection (though highlighting a feature on the
     * map involves changing the feature state to `selected: true` which is potentially confusing).
     *
     * Highlight = make the feature be selected (dark overlay) temporarily to reflect UI interaction
     * (mouse move) which is used to recalculate stats dynamically without actually saving the
     * selection. It can be thought of as a preview of a potential selection.
     */
    function updateHighlighting(e: MouseEvent) {
      // Find features before updating `current` to later tell if any features were unhighlighted
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

      // Short circuit if the features are exactly the same as the last time.
      // Don't do this for single features though, because we want to recalculate
      // on the following condition: selecting a single feature, then canceling, then selecting again.
      // eslint-disable-next-line
      if (features.length > 1 && isEqual(prevFeatures, features)) {
        return;
      }

      const geoUnits = featuresToUnlockedGeoUnits(
        features,
        staticMetadata,
        districtsDefinition,
        lockedDistricts,
        staticGeoLevels
      );

      if (
        (geoUnits[staticMetadata.geoLevelHierarchy[0].id] ||
          geoUnits[staticMetadata.geoLevelHierarchy[1].id]) &&
        !currentCounty &&
        limitSelectionToCounty
      ) {
        currentCounty = getCurrentCountyFromGeoUnits(staticMetadata, geoUnits);
      }

      // Highlighted shouldn't include the geounits initially selected
      const highlightedGeoUnits = filterGeoUnits(
        geoUnits,
        id => !initiallySelectedGeoUnits[geoLevelId].has(id)
      );
      throttledSetHighlightedGeounits(highlightedGeoUnits);

      // New geounits (to select on map) are the highlighted ones that aren't already selected
      const newGeoUnits = filterGeoUnits(
        highlightedGeoUnits,
        id =>
          !isFeatureSelected(map, {
            id,
            sourceLayer: geoLevelId
          })
      );
      if (currentCounty && limitSelectionToCounty) {
        // Filter geounits to current county
        const geoUnitsInCounty = filterGeoUnitsByCounty(newGeoUnits, currentCounty);
        setFeaturesSelectedFromGeoUnits(map, geoUnitsInCounty, true);
      } else {
        setFeaturesSelectedFromGeoUnits(map, newGeoUnits, true);
      }

      // Deselect any features that were previously highlighted and just became unhighlighted
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
      setActive(true);
      initiallySelectedGeoUnits = featuresToUnlockedGeoUnits(
        getAllSelectedFeatures(),
        staticMetadata,
        districtsDefinition,
        lockedDistricts,
        staticGeoLevels
      );

      // Capture the first xy coordinates
      start = mousePos(e);
      updateHighlighting(e);
    }

    function onMouseMove(e: MouseEvent) {
      updateHighlighting(e);
    }

    function onMouseUp(e: MouseEvent) {
      setActive(false);
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

    /*
     * Select highlighted features and clean up.
     */
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
        deselectChildGeounits(map, geoUnits, staticMetadata, staticGeoLevels);
        if (currentCounty) {
          const geoUnitsInCounty = filterGeoUnitsByCounty(geoUnits, currentCounty);
          store.dispatch(addSelectedGeounits(geoUnitsInCounty));
          currentCounty = undefined;
        } else {
          store.dispatch(addSelectedGeounits(geoUnits));
        }
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
