import { createAction } from "typesafe-actions";
import { IOrganization, IProject, IProjectTemplate, OrganizationSlug } from "../../shared/entities";
import { ResourceFailure } from "../resource";

export const organizationProjectsFetch = createAction("Organization projects fetch")<OrganizationSlug>();
export const organizationProjectsFetchSuccess = createAction("Organization projects fetch success")<IProjectTemplate[]>();
export const organizationProjectsFetchFailure = createAction("Organization projects fetch failure")<
  ResourceFailure
>();
