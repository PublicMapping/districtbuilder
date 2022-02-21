/** @jsx jsx */
import { jsx, Box, IconButton } from "theme-ui";
import { Button as MenuButton, Wrapper, Menu, MenuItem } from "react-aria-menubutton";
import { IReferenceLayer, ProjectId } from "../../shared/entities";
import { style, invertStyles } from "./MenuButton.styles";
import { patchReferenceLayer } from "../api";
import { showActionFailedToast } from "../functions";
import Icon from "./Icon";
import store from "../store";
import { setDeleteReferenceLayer } from "../actions/projectData";
import { ReferenceLayerColors } from "../../shared/constants";
import { projectReferenceLayersFetch } from "../actions/projectData";

enum LayerMenuKeys {
  Delete = "delete"
}

interface FlyoutProps {
  readonly layer: IReferenceLayer;
  readonly projectId: ProjectId;
}

const ReferenceLayerFlyout = ({ layer, projectId }: FlyoutProps) => {
  return (
    <Wrapper>
      <MenuButton
        sx={{
          ...{ variant: "buttons.ghost", fontWeight: "light", "& > svg": { m: "0 !important" } },
          ...invertStyles({}),
          ...style.menuButton
        }}
        className="project-list-flyout-menu"
      >
        <Icon name="ellipsis" />
      </MenuButton>
      <Menu sx={{ ...style.menu, mt: -150 }}>
        <ul sx={style.menuList}>
          <li key={"color-select"}>
            <MenuItem value="color-select">
              <Box sx={{ ...style.menuListItem, py: 0 }}>Change color</Box>
              <Box sx={{ ...style.menuListItem, py: 0 }}>
                {Object.values(ReferenceLayerColors).map((color, i) => {
                  return (
                    <IconButton
                      key={i}
                      sx={{ borderRadius: 0, p: 0, m: 0.75 }}
                      onClick={() => {
                        const layerData = {
                          layer_color: color
                        };
                        patchReferenceLayer(layer.id, layerData)
                          .then(() => {
                            store.dispatch(projectReferenceLayersFetch(projectId));
                          })
                          .catch(showActionFailedToast);
                      }}
                    >
                      <svg height="33" width="28">
                        <rect width="100%" height="85%" fill={color} />
                        {color === layer.layer_color ? (
                          <rect y="95%" width="100%" height="5%" fill="black" />
                        ) : null}
                      </svg>
                    </IconButton>
                  );
                })}
              </Box>
            </MenuItem>
          </li>
          <hr style={{ opacity: 0.35 }} />
          <li key={LayerMenuKeys.Delete}>
            <MenuItem value={LayerMenuKeys.Delete}>
              <Box
                onClick={() => store.dispatch(setDeleteReferenceLayer(layer))}
                sx={{ ...style.menuListItem, color: "#F17960" }}
              >
                Remove from map
              </Box>
            </MenuItem>
          </li>
        </ul>
      </Menu>
    </Wrapper>
  );
};

export default ReferenceLayerFlyout;
