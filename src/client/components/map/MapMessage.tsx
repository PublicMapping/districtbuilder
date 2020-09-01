/** @jsx jsx */
import { connect } from "react-redux";
import { Box, jsx, ThemeUIStyleObject } from "theme-ui";

import { State } from "../../reducers";
import { geoLevelLabel } from "../../functions";
import { IStaticMetadata } from "../../../shared/entities";
import { destructureResource } from "../../functions";

const style: ThemeUIStyleObject = {
  message: {
    position: "absolute",
    margin: "30px",
    backgroundColor: "white",
    alignItems: "center",
    px: 2,
    py: 1,
    borderBottom: "1px solid",
    borderColor: "gray.2",
    boxShadow: "small",
    fontSize: 2,
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 1
  }
};

const MapMessage = ({
  geoLevelIndex,
  geoLevelVisibility,
  staticMetadata
}: {
  readonly geoLevelIndex: number;
  readonly geoLevelVisibility: readonly boolean[];
  readonly staticMetadata?: IStaticMetadata;
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
    <Box sx={style.message}>
      <span>
        <strong>+</strong> Zoom in to work with {levelLabel}
      </span>
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
