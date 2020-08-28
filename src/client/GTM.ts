import GoogleTagManager from "@redux-beacon/google-tag-manager";
import { createMiddleware, EventsMap, EventDefinition } from "redux-beacon";
import { saveDistrictsDefinition } from "./actions/districtDrawing";
import { projectsFetch } from "./actions/projects";
import { projectFetch } from "./actions/projectData";
import { regionConfigsFetch } from "./actions/regionConfig";
import { getType } from "typesafe-actions";

// In order to track additional actions, all you need to do is
// add them to this list and they will automatically be tracked
const trackingActionTypes = [
  projectFetch, // user loaded a project
  projectsFetch, // user loaded the home page
  regionConfigsFetch, // user loaded the create project screen
  saveDistrictsDefinition // user saved a district
];

const gtm = GoogleTagManager();

const trackingEvent: EventDefinition = action => ({
  hitType: action.type,
  payload: action.payload
});

const eventsMap: EventsMap = trackingActionTypes.reduce(
  (acc, actionType) => ({ ...acc, [getType(actionType)]: trackingEvent }),
  {}
);

export default createMiddleware(eventsMap, gtm);
