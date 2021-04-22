/** @jsx jsx */
import { jsx, Checkbox, Label } from "theme-ui";
import { Button as MenuButton, Wrapper, Menu } from "react-aria-menubutton";
import { style } from "./MenuButton.styles";
import store from "../store";
import { toggleLimitDrawingToWithinCounty } from "../actions/districtDrawing";
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
    <Wrapper closeOnSelection={false}>
      <Tooltip content="Drawing options">
        <MenuButton
          sx={{
            outline: "none",
            display: "inline-block",
            height: "22px",
            width: "22px",
            textAlign: "center",
            borderRadius: "100px",
            cursor: "pointer",
            "&:hover:not([disabled]):not(:active)": {
              bg: "rgba(89, 89, 89, 0.1)"
            },
            "&:focus": {
              boxShadow: "0 0 0 2px rgb(109 152 186 / 30%)"
            }
          }}
        >
          <Icon name="cog" />
        </MenuButton>
      </Tooltip>
      <Menu sx={{ ...style.menu }}>
        <ul sx={style.menuList}>
          <li>
            <Label
              sx={{
                textTransform: "none",
                color: "heading",
                lineHeight: "1.2",
                fontWeight: "medium"
              }}
            >
              <Checkbox
                onChange={() => {
                  store.dispatch(toggleLimitDrawingToWithinCounty());
                }}
                defaultChecked={limitSelectionToCounty}
              />
              Limit drawing to within {topGeoLevelName}
            </Label>
          </li>
        </ul>
      </Menu>
    </Wrapper>
  );
};

export default MapSelectionOptionsFlyout;
