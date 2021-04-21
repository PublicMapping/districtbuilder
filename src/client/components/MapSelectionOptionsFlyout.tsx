/** @jsx jsx */
import { jsx, Box, Checkbox } from "theme-ui";
import { Button as MenuButton, Wrapper, Menu, MenuItem } from "react-aria-menubutton";
import { style } from "./MenuButton.styles";
import store from "../store";
import { toggleLimitDrawingToWithinCounty } from "../actions/districtDrawing";
import { assertNever } from "../functions";
import Tooltip from "./Tooltip";
import Icon from "./Icon";

type MenuKeys = "limit-drawing-to-within-county";

const MapSelectionOptionsFlyout = ({
  limitSelectionToCounty,
  topGeoLevelName
}: {
  readonly limitSelectionToCounty: boolean;
  readonly topGeoLevelName?: string;
}) => {
  return (
    <Wrapper
      onSelection={(menuKey: MenuKeys) => {
        const action =
          menuKey === "limit-drawing-to-within-county"
            ? toggleLimitDrawingToWithinCounty()
            : assertNever(menuKey);
        store.dispatch(action);
      }}
    >
      <Tooltip content="More options">
        <MenuButton
          sx={{
            ...{
              variant: "icon",
              fontWeight: "light",
              px: 1,
              py: 1,
              color: "gray.8",
              bg: "transparent",
              "&:hover:not([disabled]):not(:active)": {
                bg: "rgba(89,89,89,0.1)"
              },
              borderRadius: "100%"
            }
          }}
        >
          <Icon name="tools" />
        </MenuButton>
      </Tooltip>
      <Menu sx={{ ...style.menu, position: "fixed", right: "58%" }}>
        <ul sx={style.menuList}>
          <li>
            <MenuItem value={"limit-drawing-to-within-county"}>
              <Box sx={style.menuListItem}>
                Limit drawing to within {topGeoLevelName}
                <Checkbox defaultChecked={limitSelectionToCounty} />
              </Box>
            </MenuItem>
          </li>
        </ul>
      </Menu>
    </Wrapper>
  );
};

export default MapSelectionOptionsFlyout;
