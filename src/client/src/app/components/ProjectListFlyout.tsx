/** @jsx jsx */
import { jsx, Box } from "theme-ui";
import { Button as MenuButton, Wrapper, Menu, MenuItem } from "react-aria-menubutton";
import { IProject } from "@districtbuilder/shared/entities";
import { style, invertStyles } from "./MenuButton.styles";
import Icon from "./Icon";
import store from "../store";
import { exportCsv, exportGeoJson, exportShp, duplicateProject } from "../actions/projectData";
import { setDeleteProject, setTemplateProject } from "../actions/projects";

enum UserMenuKeys {
  Delete = "delete",
  CopyMap = "copy",
  ExportCsv = "csv",
  ExportShapefile = "shp",
  ExportGeoJson = "geojson",
  CreateTemplate = "createtemplate"
}

interface FlyoutProps {
  readonly invert?: boolean;
  readonly project: IProject;
  readonly isOrganizationAdmin: boolean;
}

// Flyout ("..." button) for each project on the project list page.
// Very similar to the ExportMenu component, but there are other types
// of actions (e.g. archiving), so it has intentionally
// not been unified.
const ProjectListFlyout = (props: FlyoutProps) => {
  const isArchived = props.project.regionConfig.archived;
  return (
    <Wrapper
      onSelection={(userMenuKey: string) => {
        const action =
          userMenuKey === UserMenuKeys.Delete
            ? setDeleteProject
            : userMenuKey === UserMenuKeys.ExportCsv
            ? exportCsv
            : userMenuKey === UserMenuKeys.ExportShapefile
            ? exportShp
            : userMenuKey === UserMenuKeys.CopyMap
            ? duplicateProject
            : userMenuKey === UserMenuKeys.ExportGeoJson
            ? exportGeoJson
            : setTemplateProject;
        store.dispatch(action(props.project));
      }}
      sx={{ display: "inline-block" }}
    >
      <MenuButton
        sx={{
          ...{ variant: "buttons.ghost", fontWeight: "light", "& > svg": { m: "0 !important" } },
          ...style.menuButton,
          ...invertStyles(props)
        }}
        className="project-list-flyout-menu"
      >
        <Icon name="ellipsis" />
      </MenuButton>
      <Menu sx={{ ...style.menu }}>
        <ul sx={style.menuList}>
          <li key={UserMenuKeys.ExportShapefile}>
            <MenuItem value={UserMenuKeys.ExportShapefile}>
              <Box sx={style.menuListItem}>Export Shapefile</Box>
            </MenuItem>
          </li>
          {!isArchived && (
            <li key={UserMenuKeys.ExportCsv}>
              <MenuItem value={UserMenuKeys.ExportCsv}>
                <Box sx={style.menuListItem}>Export CSV</Box>
              </MenuItem>
            </li>
          )}
          <li key={UserMenuKeys.ExportGeoJson}>
            <MenuItem value={UserMenuKeys.ExportGeoJson}>
              <Box sx={style.menuListItem}>Export GeoJSON</Box>
            </MenuItem>
          </li>
          <li key={UserMenuKeys.CopyMap}>
            <MenuItem value={UserMenuKeys.CopyMap}>
              <Box sx={style.menuListItem}>Duplicate Map</Box>
            </MenuItem>
          </li>
          <li key={UserMenuKeys.Delete}>
            <MenuItem value={UserMenuKeys.Delete}>
              <Box sx={style.menuListItem}>Delete Map</Box>
            </MenuItem>
          </li>
          {props.isOrganizationAdmin && (
            <li key={UserMenuKeys.CreateTemplate}>
              <MenuItem value={UserMenuKeys.CreateTemplate}>
                <Box sx={style.menuListItem}>Copy to Template</Box>
              </MenuItem>
            </li>
          )}
        </ul>
      </Menu>
    </Wrapper>
  );
};

export default ProjectListFlyout;
