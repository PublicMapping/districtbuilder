import { createAction } from "typesafe-actions";
import {
  IProjectTemplateWithProjects,
  OrganizationSlug,
  IProject,
  ProjectNest
} from "../../shared/entities";
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

export const organizationFeaturedProjectsFetch = createAction(
  "Organization featured projects fetch"
)<OrganizationSlug>();
export const organizationFeaturedProjectsFetchSuccess = createAction(
  "Organization featured projects fetch success"
)<readonly IProjectTemplateWithProjects[]>();
export const organizationFeaturedProjectsFetchFailure = createAction(
  "Organization featured projects fetch failure"
)<ResourceFailure>();

export const toggleProjectFeatured = createAction("Toggle project featured")<{
  readonly project: ProjectNest;
  readonly organization: OrganizationSlug;
}>();
export const toggleProjectFeaturedSuccess = createAction("Toggle project featured success")<{
  readonly project: IProject;
  readonly organization: OrganizationSlug;
}>();
export const toggleProjectFeaturedFailure = createAction("Toggle project featured failure")<
  ResourceFailure
>();
