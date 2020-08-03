import MapboxGL from "mapbox-gl";
import store from "../../store";
import { addSelectedGeounitIds, removeSelectedGeounitIds } from "../../actions/districtDrawing";
import {
  DISTRICTS_LAYER_ID,
  isFeatureSelected,
  featureStateGeoLevel,
  levelToSelectionLayerId,
  ISelectionTool,
  featuresToUnlockedGeoUnits
} from "./index";
import { DistrictsDefinition, IStaticMetadata, LockedDistricts } from "../../../shared/entities";

/*
 * Allows users to individually select/deselect specific geounits by clicking them.
 */
const DefaultSelectionTool: ISelectionTool = {
  enable: function(
    map: MapboxGL.Map,
    geoLevelId: string,
    staticMetadata: IStaticMetadata,
    districtsDefinition: DistrictsDefinition,
    lockedDistricts: LockedDistricts
  ) {
    /* eslint-disable */
    this.setCursor = () => (map.getCanvas().style.cursor = "pointer");
    this.unsetCursor = () => (map.getCanvas().style.cursor = "");
    map.on("mousemove", DISTRICTS_LAYER_ID, this.setCursor);
    map.on("mouseleave", DISTRICTS_LAYER_ID, this.unsetCursor);
    /* eslint-enable */

    // Add a click event to the top geolevel that logs demographic information.
    // Note that the feature can't be directly selected under the cursor, so
    // we need to use a small bounding box and select the first feature we find.
    const clickHandler = (e: MapboxGL.MapMouseEvent) => {
      const buffer = 1;
      const southWest: MapboxGL.PointLike = [e.point.x - buffer, e.point.y - buffer];
      const northEast: MapboxGL.PointLike = [e.point.x + buffer, e.point.y + buffer];
      const features = map.queryRenderedFeatures([southWest, northEast], {
        layers: [levelToSelectionLayerId(geoLevelId)]
      });

      // Disabling 'functional/no-conditional-statement' without naming it.
      // See https://github.com/jonaskello/eslint-plugin-functional/issues/105
      // eslint-disable-next-line
      if (features.length === 0 || typeof features[0].id !== "number") {
        return;
      }
      const feature = features[0];

      const selectedFeatures = featuresToUnlockedGeoUnits(
        [feature],
        staticMetadata.geoLevelHierarchy,
        districtsDefinition,
        lockedDistricts
      );
      const addFeatures = () => {
        map.setFeatureState(featureStateGeoLevel(feature), { selected: true });
        store.dispatch(addSelectedGeounitIds(selectedFeatures));
      };
      const removeFeatures = () => {
        map.setFeatureState(featureStateGeoLevel(feature), { selected: false });
        store.dispatch(removeSelectedGeounitIds(selectedFeatures));
      };
      isFeatureSelected(map, feature) ? removeFeatures() : addFeatures();
    };
    map.on("click", clickHandler);
    // Save the click handler function so it can be removed later
    this.clickHandler = clickHandler; // eslint-disable-line
  },
  disable: function(map: MapboxGL.Map) {
    /* eslint-disable */
    this.clickHandler && map.off("click", this.clickHandler);
    this.setCursor && map.off("mousemove", DISTRICTS_LAYER_ID, this.setCursor);
    this.unsetCursor && map.off("mouseleave", DISTRICTS_LAYER_ID, this.unsetCursor);
    /* eslint-enable */
  }
};

export default DefaultSelectionTool;
