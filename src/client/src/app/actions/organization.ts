import { createAction } from "typesafe-actions";
import {
  IOrganization,
  IProjectTemplate,
  OrganizationSlug,
  ProjectTemplateId
} from "@districtbuilder/shared/entities";
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

export const setArchiveTemplate = createAction("set archive template")<
  IProjectTemplate | undefined
>();
export const archiveTemplate = createAction("Archive template")<{
  id: ProjectTemplateId;
  slug: OrganizationSlug;
}>();
export const archiveTemplateSuccess = createAction("Archive template success")<ProjectTemplateId>();
export const archiveTemplateFailure = createAction("Archive template failure")<string>();
