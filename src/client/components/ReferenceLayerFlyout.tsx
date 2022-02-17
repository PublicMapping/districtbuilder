/** @jsx jsx */
import { jsx, Box, IconButton } from "theme-ui";
import { Button as MenuButton, Wrapper, Menu, MenuItem } from "react-aria-menubutton";
import { IReferenceLayer } from "../../shared/entities";
import { style, invertStyles } from "./MenuButton.styles";
import Icon from "./Icon";
import store from "../store";
import { setDeleteReferenceLayer } from "../actions/projectData";
import { ReferenceLayerColors } from "../../shared/constants";

enum LayerMenuKeys {
  Delete = "delete"
}

interface FlyoutProps {
  readonly layer: IReferenceLayer;
}

const ReferenceLayerFlyout = ({ layer }: FlyoutProps) => {
  return (
    <Wrapper
      onSelection={() => {
        store.dispatch(setDeleteReferenceLayer(layer));
      }}
    >
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
      <Menu sx={{ ...style.menu }}>
        <ul sx={style.menuList}>
          <li key={"color-select"}>
            <MenuItem value="color-select">
              <Box sx={{ ...style.menuListItem, py: 0 }}>Change color</Box>
              <Box sx={{ ...style.menuListItem, py: 0 }}>
                {Object.values(ReferenceLayerColors).map((color, i) => {
                  return (
                    <IconButton key={i} sx={{ borderRadius: 0, p: 0, m: 0.75 }}>
                      <svg height="28" width="28">
                        <rect width="100%" height="100%" fill={color} />
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
              <Box sx={style.menuListItem}>Remove from map</Box>
            </MenuItem>
          </li>
        </ul>
      </Menu>
    </Wrapper>
  );
};

export default ReferenceLayerFlyout;
