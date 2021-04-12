import throttle from "lodash/throttle";
import MapboxGL from "mapbox-gl";
import {
  DistrictsDefinition,
  FeatureId,
  GeoUnits,
  IStaticMetadata,
  LockedDistricts,
  UintArrays
} from "../../../shared/entities";

import { editSelectedGeounits } from "../../actions/districtDrawing";
import { mergeGeoUnits } from "../../functions";
import paint from "../../media/paint.png";
import store from "../../store";

import {
  featuresToUnlockedGeoUnits,
  filterGeoUnits,
  isFeatureSelected,
  levelToSelectionLayerId,
  ISelectionTool,
  setFeaturesSelectedFromGeoUnits,
  SET_FEATURE_DELAY,
  getChildGeoUnits
} from "./index";

/*
 * Allows user to drag to select all geounits under the cursor.
 *
 * Note that this is only additive (does not deselect geounits).
 */
const PaintBrushSelectionTool: ISelectionTool = {
  enable: function(
    map: MapboxGL.Map,
    geoLevelId: string,
    staticMetadata: IStaticMetadata,
    districtsDefinition: DistrictsDefinition,
    lockedDistricts: LockedDistricts,
    staticGeoLevels: UintArrays,
    setActive: (isActive: boolean) => void
  ) {
    map.boxZoom.disable();
    map.dragPan.disable();
    map.getCanvas().style.cursor = `url('${paint}') 0 14, default`; // eslint-disable-line

    const canvas = map.getCanvasContainer();

    canvas.addEventListener("mousedown", mouseDown);
    // Save mouseDown for removal upon disabling
    this.mouseDown = mouseDown; // eslint-disable-line

    // eslint-disable-next-line
    let batchGeounits = { add: {}, remove: {} };
    const throttledStoreToRedux = throttle(() => {
      store.dispatch(editSelectedGeounits(batchGeounits));
      batchGeounits = { add: {}, remove: {} };
    }, SET_FEATURE_DELAY);

    // Helper function to batch adding geounits to the redux store
    const throttledAddGeounits = (geounits: GeoUnits) => {
      batchGeounits = { ...batchGeounits, add: mergeGeoUnits(batchGeounits.add, geounits) };
      throttledStoreToRedux();
    };

    // Helper function to batch removing geounits to the redux store
    const throttledRemoveGeounits = (geounits: GeoUnits) => {
      batchGeounits = { ...batchGeounits, remove: mergeGeoUnits(batchGeounits.remove, geounits) };
      throttledStoreToRedux();
    };

    // Return the xy coordinates of the mouse position
    function mousePos(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      return new MapboxGL.Point(
        e.clientX - rect.left - canvas.clientLeft,
        e.clientY - rect.top - canvas.clientTop
      );
    }

    function updateSelection(e: MouseEvent) {
      // Capture the ongoing xy coordinates
      const current = mousePos(e);
      const features = getFeaturesAtPoint(current);
      const geoUnits = featuresToUnlockedGeoUnits(
        features,
        staticMetadata,
        districtsDefinition,
        lockedDistricts,
        staticGeoLevels
      );

      // New geounits (to select on map) are the highlighted ones that aren't already selected
      const newGeoUnits = filterGeoUnits(
        geoUnits,
        id =>
          !isFeatureSelected(map, {
            id,
            sourceLayer: geoLevelId
          })
      );
      setFeaturesSelectedFromGeoUnits(map, newGeoUnits, true);
      // Geounit is not selected, so select it, making sure to remove the selection on any child
      // geounits since the parent selection supercedes any child selections
      features.forEach(feature => {
        const unlockedGeoUnitForFeature = geoUnits[geoLevelId].get(feature.id as FeatureId);
        const { childGeoUnits } = unlockedGeoUnitForFeature
          ? getChildGeoUnits(unlockedGeoUnitForFeature, staticMetadata, staticGeoLevels)
          : { childGeoUnits: {} };
        setFeaturesSelectedFromGeoUnits(map, childGeoUnits, false);
        throttledRemoveGeounits(childGeoUnits);
      });
      throttledAddGeounits(newGeoUnits);
    }

    function mouseDown(e: MouseEvent) {
      // Call functions for the following events
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
      setActive(true);
      updateSelection(e);
    }

    function onMouseMove(e: MouseEvent) {
      updateSelection(e);
    }

    function onMouseUp() {
      // Remove these events now that finish has been called.
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      setActive(false);
    }

    function getFeaturesAtPoint(
      point: MapboxGL.PointLike
    ): readonly MapboxGL.MapboxGeoJSONFeature[] {
      return map.queryRenderedFeatures(point, {
        layers: [levelToSelectionLayerId(geoLevelId)]
      });
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

export default PaintBrushSelectionTool;
