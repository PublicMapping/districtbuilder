/** @jsx jsx */
import { jsx, Box } from "theme-ui";
import { Button as MenuButton, Wrapper, Menu, MenuItem } from "react-aria-menubutton";
import { DistrictId } from "../../shared/entities";
import { style, invertStyles } from "./MenuButton.styles";
import store from "../store";
import { setZoomToDistrictId } from "../actions/districtDrawing";
import { assertNever } from "../functions";

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
      <MenuButton
        sx={{
          ...{ variant: "icon", fontWeight: "light", color: "black", px: 1, py: 1 },
          ...invertStyles({ invert: false })
        }}
      >
        ···
      </MenuButton>
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
