/** @jsx jsx */
import MapboxGL from "mapbox-gl";
import { connect } from "react-redux";
import { Box, Button, Flex, jsx, ThemeUIStyleObject } from "theme-ui";
import bbox from "@turf/bbox";
import { polygon } from "@turf/helpers";

import Icon from "../Icon";

import { State } from "../../reducers";
import { DistrictsGeoJSON } from "../../types";
import { setFindIndex, toggleFind } from "../../actions/districtDrawing";
import store from "../../store";
import { destructureResource } from "../../functions";
import { useEffect } from "react";

const style: ThemeUIStyleObject = {
  menu: {
    position: "absolute",
    top: "-1px",
    left: 2,
    width: "300px",
    backgroundColor: "muted",
    border: "1px solid",
    borderTop: "none",
    borderColor: "gray.2",
    borderBottomLeftRadius: "4px",
    borderBottomRightRadius: "4px",
    fontSize: 1,
    alignItems: "center",
    p: 2
  },
  numFound: {
    flex: "auto",
    textAlign: "right"
  },
  closeWrapper: {
    borderLeft: "1px solid",
    borderColor: "gray.2"
  },
  button: {
    variant: "buttons.icon"
  },
  closeButton: {
    variant: "buttons.icon",
    width: "28px",
    ml: 1
  }
};

const FindMenu = ({
  findMenuOpen,
  findIndex,
  geojson,
  map
}: {
  readonly findMenuOpen: boolean;
  readonly findIndex?: number;
  readonly geojson?: DistrictsGeoJSON;
  readonly map?: MapboxGL.Map;
}) => {
  const unassigned = geojson && geojson.features[0];
  const allUnassigned =
    geojson &&
    geojson.features.slice(1).every(district => district.geometry.coordinates.length === 0);
  const numUnassigned = allUnassigned ? 0 : unassigned?.geometry.coordinates.length;

  useEffect(() => {
    // eslint-disable-next-line
    if (
      map &&
      unassigned &&
      findIndex !== undefined &&
      unassigned.geometry.coordinates.length > findIndex
    ) {
      // eslint-disable-next-line
      const bounds = bbox(polygon(unassigned.geometry.coordinates[findIndex])) as [
        number,
        number,
        number,
        number
      ];
      map.fitBounds(bounds, { padding: 50 });
    }
  }, [map, unassigned, findIndex]);

  return findMenuOpen ? (
    <Flex sx={style.menu}>
      <b>Find</b>
      &nbsp; Unassigned
      <Box sx={style.numFound}>
        {unassigned
          ? findIndex !== undefined && numUnassigned
            ? `${findIndex + 1} / ${numUnassigned}`
            : `${numUnassigned} found`
          : "—"}
      </Box>
      <Box sx={{ px: 1 }}>
        <Button
          sx={style.button}
          disabled={numUnassigned === undefined || numUnassigned === 0}
          onClick={() =>
            numUnassigned !== undefined &&
            store.dispatch(
              setFindIndex(
                findIndex === undefined || findIndex === 0 ? numUnassigned - 1 : findIndex - 1
              )
            )
          }
        >
          <Icon name="chevron-left" />
        </Button>
        <Button
          sx={style.button}
          disabled={numUnassigned === undefined || numUnassigned === 0}
          onClick={() =>
            numUnassigned !== undefined &&
            store.dispatch(
              setFindIndex(findIndex === undefined ? 0 : (findIndex + 1) % numUnassigned)
            )
          }
        >
          <Icon name="chevron-right" />
        </Button>
      </Box>
      <Box sx={style.closeWrapper}>
        <Button sx={style.closeButton} onClick={() => store.dispatch(toggleFind(false))}>
          &times;
        </Button>
      </Box>
    </Flex>
  ) : null;
};

function mapStateToProps(state: State) {
  return {
    findMenuOpen: state.project.findMenuOpen,
    findIndex: state.project.findIndex,
    geojson: destructureResource(state.project.projectData, "geojson")
  };
}

export default connect(mapStateToProps)(FindMenu);
