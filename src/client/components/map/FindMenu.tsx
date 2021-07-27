/** @jsx jsx */
import MapboxGL from "mapbox-gl";
import { connect } from "react-redux";
import { Box, Button, Flex, jsx, Select, ThemeUIStyleObject } from "theme-ui";
import bbox from "@turf/bbox";
import { polygon } from "@turf/helpers";

import Icon from "../Icon";

import { State } from "../../reducers";
import { DistrictsGeoJSON } from "../../types";
import { FindTool, setFindIndex, setFindType, toggleFind } from "../../actions/districtDrawing";
import { getFindCoords } from "../../reducers/projectData";
import store from "../../store";
import { destructureResource } from "../../functions";
import { ChangeEvent, useEffect } from "react";

const style: ThemeUIStyleObject = {
  menu: {
    position: "absolute",
    top: "-1px",
    right: 2,
    width: "350px",
    backgroundColor: "muted",
    border: "1px solid",
    borderTop: "none",
    borderColor: "gray.2",
    borderBottomLeftRadius: "4px",
    borderBottomRightRadius: "4px",
    zIndex: 1000,
    fontSize: 1,
    alignItems: "center",
    p: 2
  },
  select: {
    minWidth: "132px"
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
  findTool,
  geojson,
  map
}: {
  readonly findMenuOpen: boolean;
  readonly findIndex?: number;
  readonly findTool: FindTool;
  readonly geojson?: DistrictsGeoJSON;
  readonly map?: MapboxGL.Map;
}) => {
  const findCoords = getFindCoords(findTool, geojson);
  const num = findCoords?.length || 0;

  useEffect(() => {
    // eslint-disable-next-line
    if (map && findCoords && findIndex !== undefined && findCoords.length > findIndex) {
      // eslint-disable-next-line
      const bounds = bbox(polygon(findCoords[findIndex])) as [number, number, number, number];
      map.fitBounds(bounds, { padding: 50 });
    }
  }, [map, findCoords, findIndex]);

  return findMenuOpen ? (
    <Flex sx={style.menu}>
      <b>Find</b>
      &nbsp;{" "}
      <Select
        sx={style.select}
        value={findTool}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => {
          store.dispatch(
            setFindType(
              e.target.value === FindTool.Unassigned ? FindTool.Unassigned : FindTool.NonContiguous
            )
          );
          store.dispatch(setFindIndex(undefined));
        }}
      >
        <option value={FindTool.Unassigned}>Unassigned</option>
        <option value={FindTool.NonContiguous}>Non-contiguous</option>
      </Select>
      <Box sx={style.numFound}>
        {findCoords
          ? findIndex !== undefined
            ? `${findIndex + 1} / ${num}`
            : `${num} found`
          : "—"}
      </Box>
      <Box sx={{ px: 1 }}>
        <Button
          sx={style.button}
          disabled={num === undefined || num === 0}
          onClick={() =>
            num !== undefined &&
            store.dispatch(
              setFindIndex(findIndex === undefined || findIndex === 0 ? num - 1 : findIndex - 1)
            )
          }
        >
          <Icon name="chevron-left" />
        </Button>
        <Button
          sx={style.button}
          disabled={num === undefined || num === 0}
          onClick={() =>
            num !== undefined &&
            store.dispatch(setFindIndex(findIndex === undefined ? 0 : (findIndex + 1) % num))
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
    findTool: state.project.findTool,
    geojson: destructureResource(state.project.projectData, "geojson")
  };
}

export default connect(mapStateToProps)(FindMenu);
