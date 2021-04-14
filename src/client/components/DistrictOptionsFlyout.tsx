/** @jsx jsx */
import { jsx, Box } from "theme-ui";
import { Button as MenuButton, Wrapper, Menu, MenuItem } from "react-aria-menubutton";
import { DistrictId } from "../../shared/entities";
import { style } from "./MenuButton.styles";
import store from "../store";
import { setZoomToDistrictId } from "../actions/districtDrawing";
import { assertNever } from "../functions";
import Tooltip from "./Tooltip";

type MenuKeys = "zoom-to-district";

const DistrictOptionsFlyout = ({
  districtId,
  isDistrictHovered
}: {
  readonly districtId: DistrictId;
  readonly isDistrictHovered: boolean;
}) => {
  return (
    <Wrapper
      onSelection={(menuKey: MenuKeys) => {
        const action =
          menuKey === "zoom-to-district" ? setZoomToDistrictId(districtId) : assertNever(menuKey);
        store.dispatch(action);
      }}
      style={{ visibility: isDistrictHovered ? "visible" : "hidden" }}
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
          ···
        </MenuButton>
      </Tooltip>
      <Menu sx={{ ...style.menu, marginTop: "-35px", right: "-210px" }}>
        <ul sx={style.menuList}>
          <li>
            <MenuItem value={"zoom-to-district"}>
              <Box sx={style.menuListItem}>Zoom to District</Box>
            </MenuItem>
          </li>
        </ul>
      </Menu>
    </Wrapper>
  );
};

export default DistrictOptionsFlyout;
