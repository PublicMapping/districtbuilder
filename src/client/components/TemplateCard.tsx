/** @jsx jsx */
import { IOrganization, IProjectTemplate, IUser, CreateProjectData } from "../../shared/entities";
import { Box, Button, Flex, Heading, jsx, Text } from "theme-ui";
import { isUserLoggedIn } from "../jwt";
import Tooltip from "./Tooltip";

const style = {
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
} as const;

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
  readonly user?: IUser;
  readonly templateSelected?: (templateData: CreateProjectData) => void;
}) => {
  const userIsVerified = user?.isEmailVerified;
  const isLoggedIn = isUserLoggedIn();
  const userInOrg = user && checkIfUserInOrg(organization, user);

  const useButton = (
    <Button
      disabled={isLoggedIn && !userIsVerified}
      onClick={() => {
        if (templateSelected) {
          const { id } = template;
          const data: CreateProjectData = { projectTemplate: { id } };
          templateSelected(data);
        }
      }}
      sx={style.useTemplateBtn}
    >
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
