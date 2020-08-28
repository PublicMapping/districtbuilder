/** @jsx jsx */
import { connect } from "react-redux";
import { Box, jsx, ThemeUIStyleObject } from "theme-ui";
import { State } from "../../reducers";
import { geoLevelLabel } from "../../functions";
import { Resource } from "../../resource";
import { IStaticMetadata } from "../../../shared/entities";

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
  staticMetadataResource
}: {
  readonly geoLevelIndex: number;
  readonly geoLevelVisibility: readonly boolean[];
  readonly staticMetadataResource: Resource<IStaticMetadata>;
}) => {
  const staticMetadata =
    "resource" in staticMetadataResource ? staticMetadataResource.resource : undefined;
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
    geoLevelIndex: state.districtDrawing.geoLevelIndex,
    geoLevelVisibility: state.districtDrawing.geoLevelVisibility,
    staticMetadataResource: state.projectData.staticMetadata
  };
}

export default connect(mapStateToProps)(MapMessage);
