import { createAction } from "typesafe-actions";
import { IProjectTemplateWithProjects, OrganizationSlug, IProject } from "../../shared/entities";
import { OrgProject } from "../types";
import { ResourceFailure } from "../resource";

export const organizationProjectsFetch = createAction("Organization projects fetch")<
  OrganizationSlug
>();
export const organizationProjectsFetchSuccess = createAction("Organization projects fetch success")<
  readonly IProjectTemplateWithProjects[]
>();
export const organizationProjectsFetchFailure = createAction("Organization projects fetch failure")<
  ResourceFailure
>();

export const toggleProjectFeatured = createAction("Toggle project featured")<{
  readonly project: OrgProject;
  readonly organization: OrganizationSlug;
}>();
export const toggleProjectFeaturedSuccess = createAction("Toggle project featured success")<{
  readonly project: IProject;
  readonly organization: OrganizationSlug;
}>();
export const toggleProjectFeaturedFailure = createAction("Toggle project featured failure")<
  ResourceFailure
>();
