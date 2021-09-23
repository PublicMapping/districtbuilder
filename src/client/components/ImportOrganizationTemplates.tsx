/** @jsx jsx */
import { IOrganization } from "../../shared/entities";
import { Box, Card, Flex, jsx, ThemeUIStyleObject, Label, Radio } from "theme-ui";
import React from "react";

interface Props {
  readonly currentOrganization?: IOrganization;
  readonly organizations: readonly IOrganization[];
}

interface IProps {
  readonly onTemplateChanged: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readonly orgChanged: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const style: ThemeUIStyleObject = {
  container: {
    flexDirection: "row",
    width: "100%",
    mx: "auto",
    "> *": {
      mx: 5
    },
    "> *:last-of-type": {
      mr: 0
    },
    "> *:first-of-type": {
      ml: 0
    }
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
    my: 8
  },
  legend: {
    paddingInlineStart: "0",
    paddingInlineEnd: "0"
  },
  cardLabel: {
    textTransform: "none",
    variant: "text.h4",
    display: "block",
    mb: 1
  },
  cardHint: {
    display: "block",
    textTransform: "none",
    fontWeight: "normal",
    fontSize: 1,
    mb: 4
  }
} as const;

const ImportOrganizationTemplates = ({
  currentOrganization,
  organizations,
  onTemplateChanged,
  orgChanged
}: Props & IProps) => {
  return (
    <Box sx={style.container}>
      {organizations && organizations.length > 0 && (
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
                onChange={orgChanged}
                checked={currentOrganization === undefined}
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
              <Radio name="organization" value={org.slug} onChange={orgChanged} />
              <Flex as="span" sx={{ flexDirection: "column", flex: "0 1 calc(100% - 2rem)" }}>
                <div sx={style.radioHeading}>{org.name}</div>
              </Flex>
            </Label>
          ))}
        </Card>
      )}
      {currentOrganization && (
        <Card sx={{ variant: "card.flat" }}>
          <legend sx={{ ...style.cardLabel, ...style.legend, ...{ flex: "0 0 100%" } }}>
            Template
          </legend>
          <Box sx={style.cardHint}>
            Which of {currentOrganization.name}&apos;s templates would you like to use?
          </Box>
          {currentOrganization.projectTemplates.map(template => (
            <Label
              key={template.id}
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
              <Radio name="projectTemplate" value={template.id} onChange={onTemplateChanged} />
              <Flex as="span" sx={{ flexDirection: "column", flex: "0 1 calc(100% - 2rem)" }}>
                <div sx={style.radioHeading}>{template.name}</div>
              </Flex>
            </Label>
          ))}
        </Card>
      )}
    </Box>
  );
};

export default ImportOrganizationTemplates;
