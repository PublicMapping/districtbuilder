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
import booleanIntersects from "@turf/boolean-intersects";
import distance from "@turf/distance";
import circle from "@turf/circle";
import { polygon } from "@turf/turf";
import { editSelectedGeounits, PaintBrushSize } from "../../actions/districtDrawing";
import { areAnyGeoUnitsSelected, mergeGeoUnits } from "../../functions";
import paint from "../../media/paint.png";
import store from "../../store";
import { MapboxGeoJSONFeature } from "mapbox-gl";

import {
  featuresToUnlockedGeoUnits,
  filterGeoUnits,
  isFeatureSelected,
  levelToSelectionLayerId,
  ISelectionTool,
  setFeaturesSelectedFromGeoUnits,
  SET_FEATURE_DELAY,
  getChildGeoUnits,
  filterGeoUnitsByCounty,
  getCurrentCountyFromGeoUnits
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
    paintBrushSize: PaintBrushSize,
    setActive: (isActive: boolean) => void,
    limitSelectionToCounty: boolean,
    selectedGeounits: GeoUnits
  ) {
    map.boxZoom.disable();
    map.dragPan.disable();
    map.getCanvas().style.cursor = `url('${paint}') 0 14, default`; // eslint-disable-line

    const canvas = map.getCanvasContainer();
    let currentCounty: number | undefined = undefined; // eslint-disable-line

    canvas.addEventListener("mousedown", mouseDown);
    // Save mouseDown for removal upon disabling
    this.mouseDown = mouseDown; // eslint-disable-line

    const brushCircle = document.getElementById("brush-circle");

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
      /* eslint-disable */
      if (brushCircle) {
        brushCircle.style.visibility = "visible";
        brushCircle.style.top = current.y + "px";
        brushCircle.style.left = current.x + "px";
      }
      const brushRadius = paintBrushSize * 15;
      const bbox: [MapboxGL.PointLike, MapboxGL.PointLike] = [
        [current.x - brushRadius, current.y + brushRadius],
        [current.x + brushRadius, current.y - brushRadius]
      ];
      /* eslint-enable */
      const features = getFeaturesAroundPoint(bbox, current, brushRadius);
      const geoUnits = featuresToUnlockedGeoUnits(
        features,
        staticMetadata,
        districtsDefinition,
        lockedDistricts,
        staticGeoLevels
      );

      if (!currentCounty && limitSelectionToCounty) {
        currentCounty = getCurrentCountyFromGeoUnits(staticMetadata, geoUnits);
      }

      // New geounits (to select on map) are the highlighted ones that aren't already selected
      const newGeoUnits = filterGeoUnits(
        geoUnits,
        id =>
          !isFeatureSelected(map, {
            id,
            sourceLayer: geoLevelId
          })
      );

      const geoUnitsToAdd =
        currentCounty && limitSelectionToCounty
          ? // Filter geounits to current county
            filterGeoUnitsByCounty(newGeoUnits, currentCounty)
          : newGeoUnits;
      setFeaturesSelectedFromGeoUnits(map, geoUnitsToAdd, true);
      throttledAddGeounits(geoUnitsToAdd);
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
      if (!areAnyGeoUnitsSelected(selectedGeounits)) {
        currentCounty = undefined;
      }
      setActive(false);
      /* eslint-disable */
      if (brushCircle) {
        brushCircle.style.visibility = "hidden";
      }
      /* eslint-enable */
    }

    function getFeaturesAroundPoint(
      // eslint-disable-next-line
      bbox: [MapboxGL.PointLike, MapboxGL.PointLike],
      point: MapboxGL.Point,
      brushRadius: number
    ): readonly MapboxGL.MapboxGeoJSONFeature[] {
      const features: readonly MapboxGL.MapboxGeoJSONFeature[] = map.queryRenderedFeatures(bbox, {
        layers: [levelToSelectionLayerId(geoLevelId)]
      });
      const centerPoint = map.unproject(point);
      const radialPoint = map.unproject([point.x, point.y + brushRadius]);
      const options = { units: "miles" } as const;
      const radialDistance = distance(
        [centerPoint.lng, centerPoint.lat],
        [radialPoint.lng, radialPoint.lat],
        options
      );
      const circleAroundPoint = circle([centerPoint.lng, centerPoint.lat], radialDistance, options);
      return features.filter(f => {
        // eslint-disable-next-line
        return (
          f.geometry.type === "Polygon" &&
          booleanIntersects(
            polygon(f.geometry.coordinates),
            polygon(circleAroundPoint.geometry.coordinates)
          )
        );
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
