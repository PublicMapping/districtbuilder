/** @jsx jsx */
import { useState } from "react";
import { Button as MenuButton, Wrapper, Menu, MenuItem } from "react-aria-menubutton";
import { Box, Button, Flex, Heading, jsx, Text, Spinner, ThemeUIStyleObject } from "theme-ui";

import { IOrganization, IProjectTemplate, IUser, CreateProjectData } from "../../shared/entities";
import { setArchiveTemplate } from "../actions/organization";
import { isUserLoggedIn } from "../jwt";
import store from "../store";
import Icon from "./Icon";
import { style as menuStyle, invertStyles } from "./MenuButton.styles";
import Tooltip from "./Tooltip";

const style: Record<string, ThemeUIStyleObject> = {
  template: {
    flexDirection: "column",
    position: "relative",
    padding: "15px",
    bg: "#fff",
    borderRadius: "2px",
    boxShadow: "small"
  },
  useTemplateBtn: {
    width: "100%",
    background: "lightgray",
    color: "black"
  },
  flyoutButton: {
    position: "absolute",
    top: "5px",
    right: "10px"
  }
};

function checkIfUserInOrg(org: IOrganization, user: IUser) {
  const userExists = org.users.filter(u => {
    return u.id === user.id;
  });
  return userExists.length > 0;
}

function checkIfUserIsAdmin(org: IOrganization, user: IUser) {
  return org.admin && Object.values(org.admin).includes(user.id);
}

const TemplateCard = ({
  displayAdminFlyout,
  template,
  user,
  organization,
  templateSelected
}: {
  readonly displayAdminFlyout: boolean;
  readonly template: IProjectTemplate;
  readonly organization: IOrganization;
  readonly templateSelected: (templateData: CreateProjectData) => Promise<void>;
  readonly user?: IUser;
}) => {
  const [inProgress, setInProgress] = useState(false);
  const userIsVerified = user?.isEmailVerified;
  const isLoggedIn = isUserLoggedIn();
  const userInOrg = user && checkIfUserInOrg(organization, user);
  const userIsAdmin = user && organization && checkIfUserIsAdmin(organization, user);

  const TemplateListFlyout = (
    <Wrapper
      onSelection={() => {
        store.dispatch(setArchiveTemplate(template));
      }}
      sx={{ display: "inline-block" }}
    >
      <MenuButton
        sx={{
          ...{ variant: "buttons.ghost", fontWeight: "light", "& > svg": { m: "0 !important" } },
          ...menuStyle.menuButton,
          ...invertStyles({})
        }}
        className="project-list-flyout-menu"
      >
        <Icon name="ellipsis" />
      </MenuButton>
      <Menu sx={{ ...menuStyle.menu }}>
        <ul sx={menuStyle.menuList}>
          <li key="delete">
            <MenuItem value="delete">
              <Box sx={menuStyle.menuListItem}>Delete Template</Box>
            </MenuItem>
          </li>
        </ul>
      </Menu>
    </Wrapper>
  );

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
      {userIsAdmin && displayAdminFlyout && (
        <span sx={style.flyoutButton}>{TemplateListFlyout}</span>
      )}
    </Flex>
  );
};

export default TemplateCard;
