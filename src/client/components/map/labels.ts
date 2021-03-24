import { MapboxGeoJSONFeature } from "mapbox-gl";
import { geoLevelLabelSingular } from "../../functions";

export function getLabel(geoLevelId?: string, feature?: MapboxGeoJSONFeature) {
  if (feature && feature.properties && typeof feature.properties.name === "string") {
    return feature.properties.name;
  } else if (feature && geoLevelId) {
    return `${geoLevelId} #${feature.id}`;
  } else {
    return "";
  }
}

export function getLabelLookup(geoLevelId?: string, label?: string, index?: number) {
  if (label) {
    return label;
  } else if (geoLevelId && index) {
    return `${geoLevelLabelSingular(geoLevelId)} #${index}`;
  } else {
    return "";
  }
}
