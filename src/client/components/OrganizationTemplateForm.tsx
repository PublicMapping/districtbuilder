/** @jsx jsx */
import {
  IOrganization,
  IUser,
  CreateProjectData,
  OrganizationSlug,
  OrganizationNest
} from "../../shared/entities";
import { Box, jsx, Card, Label, Radio, Flex, Spinner } from "theme-ui";
import OrganizationTemplates from "./OrganizationTemplates";
import { useState, useEffect } from "react";
import { organizationFetch, organizationReset } from "../actions/organization";
import store from "../store";
import React from "react";

const style = {
  formContainer: {
    width: "100%",
    display: "block",
    flexDirection: "column"
  },
  orgTemplates: {
    display: "block",
    minHeight: "100px",
    pl: "5px",
    "> *": {
      mx: 5
    },
    mx: "auto",
    width: "100%",
    maxWidth: "large",
    borderTop: "1px solid lightgray",
    my: 5
  },
  legend: {
    paddingInlineStart: "0",
    paddingInlineEnd: "0"
  },
  cardLabel: {
    textTransform: "none",
    variant: "text.h5",
    display: "block",
    mb: 1
  },
  cardHint: {
    display: "block",
    textTransform: "none",
    fontWeight: "500",
    fontSize: 1,
    mt: 2,
    mb: 3
  },
  radioHeading: {
    textTransform: "none",
    variant: "text.body",
    fontSize: 2,
    lineHeight: "heading",
    letterSpacing: "0",
    mb: "0",
    color: "heading",
    fontWeight: "body"
  },
  radioSubHeading: {
    fontSize: 1,
    letterSpacing: "0",
    textTransform: "none",
    fontWeight: "500"
  }
} as const;

interface Props {
  readonly organization?: IOrganization;
  readonly organizations: readonly OrganizationNest[];
  readonly user: IUser | undefined;
}

interface IProps {
  readonly templateSelected: (templateData: CreateProjectData) => void;
}

const OrganizationTemplateForm = ({
  organization,
  organizations,
  user,
  templateSelected
}: Props & IProps) => {
  const [organizationSlug, setOrganizationSlug] = useState<OrganizationSlug | undefined>(undefined);

  const onOrgChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.currentTarget.value !== "" && setOrganizationSlug(e.currentTarget.value);
    e.currentTarget.value === "" && setOrganizationSlug(undefined);
  };

  useEffect(() => {
    organizationSlug
      ? store.dispatch(organizationFetch(organizationSlug))
      : store.dispatch(organizationReset());
  }, [organizationSlug]);

  return organizations.length > 0 ? (
    <React.Fragment>
      <Flex sx={{ ...style.formContainer }}>
        <Card sx={{ variant: "card.flat" }}>
          <legend sx={{ ...style.cardLabel, ...style.legend, ...{ flex: "0 0 100%" } }}>
            Organization
          </legend>
          <Box sx={style.cardHint}>
            Are you making a new map with an organization you&apos;ve joined?
          </Box>
          <div
            sx={{
              flex: "0 0 50%",
              "@media screen and (max-width: 770px)": {
                flex: "0 0 100%"
              }
            }}
            key="custom"
          >
            <Label>
              <Radio
                name="organization"
                value=""
                onChange={onOrgChanged}
                checked={organizationSlug === undefined}
              />
              <Flex as="span" sx={{ flexDirection: "column" }}>
                <div sx={style.radioHeading}>No organization</div>
                <div sx={style.radioSubHeading}>Continue without an organization</div>
              </Flex>
            </Label>
          </div>
          {organizations.map(org => (
            <Label
              key={org.slug}
              sx={{
                display: "inline-flex",
                "@media screen and (min-width: 750px)": {
                  flex: "0 0 48%",
                  "&:nth-of-type(even)": {
                    mr: "2%"
                  }
                }
              }}
            >
              <Radio name="organization" value={org.slug} onChange={onOrgChanged} />
              <Flex as="span" sx={{ flexDirection: "column", flex: "0 1 calc(100% - 2rem)" }}>
                <div sx={style.radioHeading}>{org.name}</div>
              </Flex>
            </Label>
          ))}
        </Card>
      </Flex>
      {organizationSlug && !organization && (
        <Flex>
          <Spinner variant="spinner.large" sx={{ m: "auto" }} />
        </Flex>
      )}
      {organization && user && (
        <Box sx={style.orgTemplates}>
          <OrganizationTemplates
            user={user}
            organization={organization}
            templateSelected={templateSelected}
          />
        </Box>
      )}
    </React.Fragment>
  ) : null;
};
export default OrganizationTemplateForm;
