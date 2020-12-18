/** @jsx jsx */
import { jsx, Box } from "theme-ui";
import { Button as MenuButton, Wrapper, Menu, MenuItem } from "react-aria-menubutton";
import { IProject } from "../../shared/entities";
import { style, invertStyles } from "./MenuButton.styles";
import store from "../store";
import { exportCsv, exportGeoJson, exportShp } from "../actions/projectData";

enum UserMenuKeys {
  ExportCsv = "csv",
  ExportShapefile = "shp",
  ExportGeoJson = "geojson"
}

interface FlyoutProps {
  readonly invert?: boolean;
  readonly project: IProject;
}

// Flyout ("..." button) for each project on the project list page.
// Currently the actions are all related to exporting, and this component
// is therefore very similar to the ExportMenu component, but there will
// eventually be other types of actions (e.g. archiving, duplicating),
// that will cause divergence, so it has intentionally not been unified.
const ProjectListFlyout = (props: FlyoutProps) => {
  return (
    <Wrapper
      onSelection={(userMenuKey: string) => {
        const action =
          userMenuKey === UserMenuKeys.ExportCsv
            ? exportCsv
            : userMenuKey === UserMenuKeys.ExportShapefile
            ? exportShp
            : exportGeoJson;
        store.dispatch(action(props.project));
      }}
    >
      <MenuButton
        sx={{
          ...{ variant: "buttons.ghost", fontWeight: "light" },
          ...style.menuButton,
          ...invertStyles(props),
          ...props
        }}
        className="project-list-flyout-menu"
      >
        ...
      </MenuButton>
      <Menu sx={{ ...style.menu }}>
        <ul sx={style.menuList}>
          <li key={UserMenuKeys.ExportCsv}>
            <MenuItem value={UserMenuKeys.ExportShapefile}>
              <Box sx={style.menuListItem}>Export Shapefile</Box>
            </MenuItem>
            <MenuItem value={UserMenuKeys.ExportCsv}>
              <Box sx={style.menuListItem}>Export CSV</Box>
            </MenuItem>
            <MenuItem value={UserMenuKeys.ExportGeoJson}>
              <Box sx={style.menuListItem}>Export GeoJSON</Box>
            </MenuItem>
          </li>
        </ul>
      </Menu>
    </Wrapper>
  );
};

export default ProjectListFlyout;
