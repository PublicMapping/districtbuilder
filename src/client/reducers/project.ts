import { reduceReducers } from "redux-loop";

import districtDrawingReducer, {
  DistrictDrawingState,
  initialDistrictDrawingState
} from "./districtDrawing";
import projectDataReducer, { ProjectDataState, initialProjectDataState } from "./projectData";

export const initialProjectState = { ...initialProjectDataState, ...initialDistrictDrawingState };

export type ProjectState = ProjectDataState & DistrictDrawingState;

const projectReducer = reduceReducers(projectDataReducer, districtDrawingReducer);

export default projectReducer;
