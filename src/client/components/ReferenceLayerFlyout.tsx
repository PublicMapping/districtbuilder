/** @jsx jsx */
import { jsx, Box } from "theme-ui";
import { Button as MenuButton, Wrapper, Menu, MenuItem } from "react-aria-menubutton";
import { IReferenceLayer } from "../../shared/entities";
import { style, invertStyles } from "./MenuButton.styles";
import Icon from "./Icon";
import store from "../store";
import { setDeleteReferenceLayer } from "../actions/projectData";

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
