import { createAction } from "typesafe-actions";
import { IOrganization, OrganizationSlug } from "../../shared/entities";
import { ResourceFailure } from "../resource";

export const organizationFetch = createAction("Organization fetch")<OrganizationSlug>();
export const organizationFetchSuccess = createAction("Organization fetch success")<IOrganization>();
export const organizationFetchFailure = createAction(
  "Organization fetch failure"
)<ResourceFailure>();

export const organizationReset = createAction("Clear organization details")();

export const exportProjects = createAction("Export organization projects CSV")<OrganizationSlug>();
export const exportProjectsFailure = createAction(
  "Export organization projects CSV failure"
)<string>();

export const exportOrgUsers = createAction("Export organization users CSV")<OrganizationSlug>();
export const exportOrgUsersFailure = createAction(
  "Export organization users CSV failure"
)<string>();
