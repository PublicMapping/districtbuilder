/** @jsx jsx */
import { jsx, Box } from "theme-ui";
import { Button as MenuButton, Wrapper, Menu, MenuItem } from "react-aria-menubutton";
import Icon from "../components/Icon";
import { ProjectId } from "../../shared/entities";
import { style, invertStyles } from "./MenuButton.styles";
import store from "../store";
import { downloadCsv } from "../actions/projectData";

enum UserMenuKeys {
  DownloadCsv = "downloadCsv"
}

interface DownloadProps {
  readonly invert?: boolean;
  readonly projectId: ProjectId;
}

const DownloadMenu = (props: DownloadProps) => {
  return (
    <Wrapper
      sx={{ position: "relative", pr: 1 }}
      onSelection={(userMenuKey: string) =>
        userMenuKey === UserMenuKeys.DownloadCsv && store.dispatch(downloadCsv(props.projectId))
      }
    >
      <MenuButton
        sx={{
          ...{ variant: "buttons.ghost", fontWeight: "light" },
          ...style.menuButton,
          ...invertStyles(props),
          ...props
        }}
        className="download-menu"
      >
        <Icon name="download" />
        Download
      </MenuButton>
      <Menu sx={style.menu}>
        <ul sx={style.menuList}>
          <li key={UserMenuKeys.DownloadCsv}>
            <MenuItem value={UserMenuKeys.DownloadCsv}>
              <Box sx={style.menuListItem}>
                <Icon name="csv" sx={style.menuListIcon} />
                Download CSV
              </Box>
            </MenuItem>
          </li>
        </ul>
      </Menu>
    </Wrapper>
  );
};

export default DownloadMenu;
