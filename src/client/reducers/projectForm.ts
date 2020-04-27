import { Cmd, Loop, loop, LoopReducer } from "redux-loop";

import { Action } from "../actions";
import {
  ActionTypes,
  ProjectForm,
  saveProjectFailure,
  saveProjectSuccess
} from "../actions/projectForm";

import { IProject } from "../../shared/entities";
import { createProject } from "../api";
import { WriteResource } from "../resource";

export type ProjectFormState = WriteResource<ProjectForm, IProject>;

export const initialState: ProjectFormState = {
  data: {
    name: "",
    numberOfDistricts: 0,
    regionConfigId: null
  }
};

const projectFormReducer: LoopReducer<ProjectFormState, Action> = (
  state: ProjectFormState = initialState,
  action: Action
): ProjectFormState | Loop<ProjectFormState, Action> => {
  switch (action.type) {
    case ActionTypes.SET_SAVE_PROJECT_FORM:
      return {
        ...state,
        data: {
          ...state.data,
          ...action.projectFormUpdate
        }
      };
    case ActionTypes.SAVE_PROJECT:
      return loop(
        {
          ...state,
          isPending: true
        },
        Cmd.run(createProject, {
          successActionCreator: saveProjectSuccess,
          failActionCreator: saveProjectFailure,
          args: [
            {
              name: state.data.name,
              numberOfDistricts: state.data.numberOfDistricts,
              regionConfig: {
                id: state.data.regionConfigId
              }
            }
          ] as Parameters<typeof createProject>
        })
      );
    case ActionTypes.SAVE_PROJECT_SUCCESS:
      return {
        ...state,
        resource: action.project
      };
    case ActionTypes.SAVE_PROJECT_FAILURE:
      return {
        ...state,
        errorMessage: action.errorMessage
      };
    default:
      return state;
  }
};

export default projectFormReducer;
