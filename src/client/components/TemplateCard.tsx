/** @jsx jsx */
import { useState } from "react";
import { Box, Button, Flex, Heading, jsx, Text, Spinner, ThemeUIStyleObject } from "theme-ui";

import { IOrganization, IProjectTemplate, IUser, CreateProjectData } from "../../shared/entities";
import { isUserLoggedIn } from "../jwt";
import Tooltip from "./Tooltip";

const style: Record<string, ThemeUIStyleObject> = {
  template: {
    flexDirection: "column",
    padding: "15px",
    bg: "#fff",
    borderRadius: "2px",
    boxShadow: "small"
  },
  useTemplateBtn: {
    width: "100%",
    background: "lightgray",
    color: "black"
  }
};

function checkIfUserInOrg(org: IOrganization, user: IUser) {
  const userExists = org.users.filter(u => {
    return u.id === user.id;
  });
  return userExists.length > 0;
}

const TemplateCard = ({
  template,
  user,
  organization,
  templateSelected
}: {
  readonly template: IProjectTemplate;
  readonly organization: IOrganization;
  readonly templateSelected: (templateData: CreateProjectData) => Promise<void>;
  readonly user?: IUser;
}) => {
  const [inProgress, setInProgress] = useState(false);
  const userIsVerified = user?.isEmailVerified;
  const isLoggedIn = isUserLoggedIn();
  const userInOrg = user && checkIfUserInOrg(organization, user);

  const useButton = (
    <Button
      type="button"
      disabled={inProgress || (isLoggedIn && !userIsVerified)}
      onClick={() => {
        if (!inProgress && templateSelected) {
          const data: CreateProjectData = {
            projectTemplate: { id: template.id },
            regionConfig: { id: template.regionConfig.id }
          };
          setInProgress(true);
          templateSelected(data).then(() => setInProgress(false));
        }
      }}
      sx={style.useTemplateBtn}
    >
      {inProgress && <Spinner variant="styles.spinner.small" />}
      Use this template
    </Button>
  );

  return (
    <Flex sx={style.template}>
      <Heading
        as="h3"
        sx={{
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          mb: "0"
        }}
      >
        {template.name}
      </Heading>
      <Text
        sx={{
          fontSize: "2",
          margin: "4px 0 2px"
        }}
      >
        {template.regionConfig.name} · {template.numberOfDistricts}
      </Text>
      <Text
        sx={{
          fontSize: "1",
          mb: "3"
        }}
      >
        {template.description}
      </Text>
      {userIsVerified || !isLoggedIn ? (
        useButton
      ) : (
        <Tooltip
          key={template.id}
          content={
            <div>
              {userInOrg
                ? "You must confirm your email before using your organization's template"
                : "You must confirm your email before using this organization's template"}
            </div>
          }
        >
          <Box>{useButton}</Box>
        </Tooltip>
      )}
    </Flex>
  );
};

export default TemplateCard;
