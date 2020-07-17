import MapboxGL from "mapbox-gl";
import store from "../../store";
import { addSelectedGeounitIds, removeSelectedGeounitIds } from "../../actions/districtDrawing";
import {
  GEOLEVELS_SOURCE_ID,
  DISTRICTS_LAYER_ID,
  levelToSelectionLayerId,
  ISelectionTool
} from "./index";
import { IStaticMetadata } from "../../../shared/entities";
import { featuresToSet, getAllIndices, getDemographics } from "../../../shared/functions";

/*
 * Allows users to individually select/deselect specific geounits by clicking them.
 */
const DefaultSelectionTool: ISelectionTool = {
  enable: function(
    map: MapboxGL.Map,
    geoLevel: string,
    geoLevelIndex: number,
    staticMetadata: IStaticMetadata,
    staticGeoLevels: ReadonlyArray<Uint8Array | Uint16Array | Uint32Array>,
    staticDemographics: ReadonlyArray<Uint8Array | Uint16Array | Uint32Array>
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
        layers: [levelToSelectionLayerId(geoLevel)]
      });

      // Disabling 'functional/no-conditional-statement' without naming it.
      // See https://github.com/jonaskello/eslint-plugin-functional/issues/105
      // eslint-disable-next-line
      if (features.length === 0 || typeof features[0].id !== "number") {
        // eslint-disable-next-line
        console.log("No features selected. ", features);
        return;
      }
      const feature = features[0];
      const featureId = feature.id as number;

      // Set the selected feature, or de-select it if it's already selected
      const featureStateExpression = {
        source: GEOLEVELS_SOURCE_ID,
        id: featureId,
        sourceLayer: geoLevel
      };
      const featureState = map.getFeatureState(featureStateExpression);
      const selectedFeatures = featuresToSet([feature], staticMetadata.geoLevelHierarchy);
      const addFeatures = () => {
        map.setFeatureState(featureStateExpression, { selected: true });
        store.dispatch(addSelectedGeounitIds(selectedFeatures));
      };
      const removeFeatures = () => {
        map.setFeatureState(featureStateExpression, { selected: false });
        store.dispatch(removeSelectedGeounitIds(selectedFeatures));
      };
      featureState.selected ? removeFeatures() : addFeatures();

      // Indices of all base geounits belonging to the clicked feature
      const baseIndices = staticGeoLevels.slice().reverse()[geoLevelIndex];
      const selectedFeatureIds = new Set([...selectedFeatures].map(feature => feature[0]));
      const selectedBaseIndices = baseIndices
        ? getAllIndices(baseIndices, selectedFeatureIds)
        : Array.from(selectedFeatureIds);
      const demographics = getDemographics(selectedBaseIndices, staticMetadata, staticDemographics);

      // As a proof of concept, log to the console the aggregated demographic data for the feature
      // eslint-disable-next-line
      console.log(demographics);
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
