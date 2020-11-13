/** @jsx jsx */
import { jsx, Box } from "theme-ui";
import { Button as MenuButton, Wrapper, Menu, MenuItem } from "react-aria-menubutton";
import Icon from "../components/Icon";
import { IProject } from "../../shared/entities";
import { style, invertStyles } from "./MenuButton.styles";
import store from "../store";
import { exportCsv } from "../actions/projectData";

enum UserMenuKeys {
  ExportCsv = "exportCsv"
}

interface ExportProps {
  readonly invert?: boolean;
  readonly project: IProject;
}

const ExportMenu = (props: ExportProps) => {
  return (
    <Wrapper
      sx={{ position: "relative", pr: 1 }}
      onSelection={(userMenuKey: string) =>
        userMenuKey === UserMenuKeys.ExportCsv && store.dispatch(exportCsv(props.project))
      }
    >
      <MenuButton
        sx={{
          ...{ variant: "buttons.ghost", fontWeight: "light" },
          ...style.menuButton,
          ...invertStyles(props),
          ...props
        }}
        className="export-menu"
      >
        <Icon name="export" />
        Export
      </MenuButton>
      <Menu sx={style.menu}>
        <ul sx={style.menuList}>
          <li key={UserMenuKeys.ExportCsv}>
            <MenuItem value={UserMenuKeys.ExportCsv}>
              <Box sx={style.menuListItem}>
                <Icon name="csv" sx={style.menuListIcon} />
                Export CSV
              </Box>
            </MenuItem>
          </li>
        </ul>
      </Menu>
    </Wrapper>
  );
};

export default ExportMenu;
