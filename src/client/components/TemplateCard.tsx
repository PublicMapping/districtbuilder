/** @jsx jsx */
import {
  IOrganization,
  IProjectTemplate,
  IUser,
  CreateProjectData,
  IProject
} from "../../shared/entities";
import { Box, Button, Flex, Heading, jsx, Text } from "theme-ui";
import { useHistory } from "react-router-dom";
import { createProject } from "../api";
import { isUserLoggedIn } from "../jwt";
import Tooltip from "./Tooltip";
import store from "../store";
import { showCopyMapModal } from "../actions/districtDrawing";

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
  setTemplate
}: {
  readonly template: IProjectTemplate;
  readonly organization: IOrganization;
  readonly user: IUser | undefined;
  readonly setTemplate: ((template: CreateProjectData) => void) | undefined;
}) => {
  const userIsVerified = user?.isEmailVerified;
  const isLoggedIn = isUserLoggedIn();
  const userInOrg = user && checkIfUserInOrg(organization, user);
  const history = useHistory();

  function createProjectFromTemplate(template: CreateProjectData) {
    void createProject(template).then((project: IProject) =>
      history.push(`/projects/${project.id}`)
    );
  }

  function setupProjectFromTemplate(template: IProjectTemplate) {
    const { id, name, regionConfig, numberOfDistricts, districtsDefinition, chamber } = template;
    const currentTemplate: CreateProjectData = {
      name,
      regionConfig,
      numberOfDistricts,
      districtsDefinition,
      chamber,
      projectTemplate: { id }
    };
    setTemplate && setTemplate(currentTemplate);
    userInOrg ? createProjectFromTemplate(currentTemplate) : store.dispatch(showCopyMapModal(true));
  }

  const useButton = (
    <Button
      disabled={isLoggedIn && !userIsVerified}
      onClick={() => setupProjectFromTemplate(template)}
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
