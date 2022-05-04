/** @jsx jsx */
import { jsx, Box } from "theme-ui";
import { Button as MenuButton, Wrapper, Menu, MenuItem } from "react-aria-menubutton";
import Icon from "../components/Icon";
import { OrganizationSlug } from "@districtbuilder/shared/entities";
import { style } from "./MenuButton.styles";
import store from "../store";
import { exportProjects, exportOrgUsers } from "../actions/organization";

enum UserMenuKeys {
  ExportMaps = "maps",
  ExportUsers = "users"
}

interface Props {
  readonly slug: OrganizationSlug;
}

const OrganizationExportMenu = (props: Props) => {
  return (
    <Wrapper
      sx={{ position: "relative", display: "inline-block", ml: 3, pr: 1 }}
      onSelection={(userMenuKey: string) => {
        const action = userMenuKey === UserMenuKeys.ExportMaps ? exportProjects : exportOrgUsers;
        store.dispatch(action(props.slug));
      }}
    >
      <MenuButton
        sx={{
          ...{ variant: "buttons.secondary", fontWeight: "light" },
          ...style.menuButton
        }}
        className="export-menu"
      >
        <Icon name="export" />
        Download
      </MenuButton>
      <Menu sx={style.menu}>
        <ul sx={style.menuList}>
          <li key={UserMenuKeys.ExportMaps}>
            <MenuItem value={UserMenuKeys.ExportMaps}>
              <Box sx={style.menuListItem}>Download Maps</Box>
            </MenuItem>
          </li>
          <li key={UserMenuKeys.ExportUsers}>
            <MenuItem value={UserMenuKeys.ExportUsers}>
              <Box sx={style.menuListItem}>Download Users</Box>
            </MenuItem>
          </li>
        </ul>
      </Menu>
    </Wrapper>
  );
};

export default OrganizationExportMenu;
