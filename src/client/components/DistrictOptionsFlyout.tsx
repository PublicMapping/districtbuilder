/** @jsx jsx */
import { jsx, Button } from "theme-ui";
import { DistrictId } from "../../shared/entities";
import { style } from "./MenuButton.styles";
import store from "../store";
import { setZoomToDistrictId } from "../actions/districtDrawing";
import { assertNever } from "../functions";
import Tooltip from "./Tooltip";
import Icon from "./Icon";

import React from "react";
import { Menu, MenuItem } from "@szhsin/react-menu";
import "@szhsin/react-menu/dist/index.css";

type MenuKeys = "zoom-to-district";

const DistrictOptionsFlyout = ({
  districtId,
  isDistrictHovered
}: {
  readonly districtId: DistrictId;
  readonly isDistrictHovered: boolean;
}) => {
  return (
    <Menu
      viewScroll="close"
      animation={false}
      offsetX={30}
      menuButton={
        <Button
          sx={{ mr: 2 }}
          variant="icon"
          style={{ visibility: isDistrictHovered ? "visible" : "hidden" }}
        >
          <Icon name="ellipsis" color="#131f28" size={0.75} />
        </Button>
      }
    >
      <MenuItem
        styles={{
          fontSize: "14px"
        }}
        value={"zoom-to-district"}
      >
        Zoom to District
      </MenuItem>
    </Menu>
  );
};

export default DistrictOptionsFlyout;
