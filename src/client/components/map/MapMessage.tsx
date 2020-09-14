/** @jsx jsx */
import { connect } from "react-redux";
import { Box, jsx, ThemeUIStyleObject } from "theme-ui";
import MapboxGL from "mapbox-gl";
import Icon from "../Icon";

import { State } from "../../reducers";
import { geoLevelLabel } from "../../functions";
import { IStaticMetadata } from "../../../shared/entities";
import { destructureResource } from "../../functions";

const style: ThemeUIStyleObject = {
  message: {
    position: "absolute",
    mt: 6,
    color: "muted",
    bg: "gray.8",
    display: "flex",
    alignItems: "center",
    px: 2,
    py: 1,
    border: "none",
    borderRadius: "small",
    boxShadow: "small",
    fontSize: 2,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 1,
    cursor: "pointer",
    "> svg": {
      mr: 1
    },
    "&:hover:not([disabled]):not(:active)": {
      bg: "gray.7",
      color: "muted"
    },
    "&:active": {
      color: "muted",
      bg: "gray.8"
    },
    "&:focus": {
      outline: "none",
      boxShadow: "focus"
    }
  }
};

const MapMessage = ({
  geoLevelIndex,
  geoLevelVisibility,
  staticMetadata,
  map,
  maxZoom
}: {
  readonly geoLevelIndex: number;
  readonly geoLevelVisibility: readonly boolean[];
  readonly staticMetadata?: IStaticMetadata;
  readonly map?: MapboxGL.Map;
  readonly maxZoom: number;
}) => {
  const invertedGeoLevelIndex = staticMetadata
    ? staticMetadata.geoLevelHierarchy.length - geoLevelIndex - 1
    : undefined;
  const geoLevelId =
    staticMetadata && invertedGeoLevelIndex !== undefined
      ? staticMetadata.geoLevelHierarchy[invertedGeoLevelIndex].id
      : undefined;
  const levelLabel = geoLevelLabel(geoLevelId || "").toLocaleLowerCase();

  return geoLevelVisibility[geoLevelIndex] ? null : (
    <Box sx={style.message} as="button" onClick={() => map !== undefined && map.zoomTo(maxZoom)}>
      <Icon name="plus" /> Zoom in to work with {levelLabel}
    </Box>
  );
};

function mapStateToProps(state: State) {
  return {
    geoLevelIndex: state.project.geoLevelIndex,
    geoLevelVisibility: state.project.geoLevelVisibility,
    staticMetadata: destructureResource(state.project.staticData, "staticMetadata")
  };
}

export default connect(mapStateToProps)(MapMessage);
