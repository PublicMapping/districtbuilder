import { createAction } from "typesafe-actions";
import { IOrganization, OrganizationSlug } from "../../shared/entities";
import { ResourceFailure } from "../resource";

export const organizationFetch = createAction("Organization fetch")<OrganizationSlug>();
export const organizationFetchSuccess = createAction("Organization fetch success")<IOrganization>();
export const organizationFetchFailure = createAction("Organization fetch failure")<
  ResourceFailure
>();
