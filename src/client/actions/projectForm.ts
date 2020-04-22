import { IProject, RegionConfigId } from "../../shared/entities";

export interface ProjectForm {
  readonly name: string;
  readonly numberOfDistricts: number;
  readonly regionConfigId: RegionConfigId | null;
}

export enum ActionTypes {
  SET_SAVE_PROJECT_FORM = "SET_SAVE_PROJECT_FORM",
  SAVE_PROJECT = "SAVE_PROJECT",
  SAVE_PROJECT_SUCCESS = "SAVE_PROJECT_SUCCESS",
  SAVE_PROJECT_FAILURE = "SAVE_PROJECT_FAILURE"
}

export type ProjectFormAction =
  | {
      readonly type: ActionTypes.SET_SAVE_PROJECT_FORM;
      readonly projectFormUpdate: Partial<ProjectForm>;
    }
  | { readonly type: ActionTypes.SAVE_PROJECT }
  | { readonly type: ActionTypes.SAVE_PROJECT_SUCCESS; readonly project: IProject }
  | { readonly type: ActionTypes.SAVE_PROJECT_FAILURE; readonly errorMessage: string };

export function setCreateProjectForm(projectFormUpdate: Partial<ProjectForm>): ProjectFormAction {
  return {
    type: ActionTypes.SET_SAVE_PROJECT_FORM,
    projectFormUpdate
  };
}

export function saveProject(): ProjectFormAction {
  return {
    type: ActionTypes.SAVE_PROJECT
  };
}

export function saveProjectSuccess(project: IProject): ProjectFormAction {
  return {
    type: ActionTypes.SAVE_PROJECT_SUCCESS,
    project
  };
}

export function saveProjectFailure(errorMessage: string): ProjectFormAction {
  return {
    type: ActionTypes.SAVE_PROJECT_FAILURE,
    errorMessage
  };
}
