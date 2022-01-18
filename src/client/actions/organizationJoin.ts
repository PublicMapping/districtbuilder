import { createAction } from "typesafe-actions";
import { OrganizationSlug, UserId } from "../../shared/entities";

export const joinOrganization = createAction("Join organization")<{
  readonly organization: OrganizationSlug;
  readonly user: UserId;
}>();
export const joinOrganizationSuccess = createAction(
  "Join organization success"
)<OrganizationSlug>();
export const joinOrganizationFailure = createAction("Join organization failure")<string>();
export const leaveOrganization = createAction("Leave organization")<{
  readonly organization: OrganizationSlug;
  readonly user: UserId;
}>();
export const leaveOrganizationSuccess = createAction(
  "Leave organization success"
)<OrganizationSlug>();
export const leaveOrganizationFailure = createAction("Leave organization failure")<string>();
