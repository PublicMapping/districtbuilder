/** @jsx jsx */
import { OrgProject } from "../types";
import { Box, Flex, Heading, jsx } from "theme-ui";
import MapboxGL from "mapbox-gl";
import { useEffect, useRef, useState } from "react";
import bbox from "@turf/bbox";
import { MAPBOX_STYLE, MAPBOX_TOKEN } from "../constants/map";
import { BBox2d } from "@turf/helpers/lib/geojson";

const style = {
  featuredProject: {
    flexDirection: "column",
    border: "1px solid black",
    padding: "20px",
    minHeight: "400px",
    minWidth: "350px",
    position: "relative"
  },
  projectMap: {
    height: "300px",
    width: "350px",
    align: "center",
    ml: "auto"
  },
  mapLabel: {
    position: "absolute",
    bottom: "0px",
    pt: "30px"
  }
} as const;

const FeaturedProjectCard = ({ project }: { readonly project: OrgProject }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (mapRef.current === null) {
      return;
    }

    // eslint-disable-next-line
    MapboxGL.accessToken = MAPBOX_TOKEN;

    const bounds = project.districts && (bbox(project.districts) as BBox2d);
    const map = new MapboxGL.Map({
      container: mapRef.current,
      style: MAPBOX_STYLE,
      bounds,
      fitBoundsOptions: { padding: 20 },
      minZoom: 5,
      maxZoom: 5,
      interactive: false
    });

    map.on("load", function() {
      project.districts &&
        map.addSource("districts", {
          type: "geojson",
          data: project.districts
        });
      map.addLayer({
        id: "districts",
        type: "line",
        source: "districts",
        layout: {},
        paint: {
          "line-color": "#000"
        }
      });

      setMapLoaded(true);
    });
  }, [mapRef, project.districts]);

  return (
    <Flex sx={style.featuredProject}>
      <Box
        ref={mapRef}
        sx={style.projectMap}
        style={mapLoaded ? { display: "block" } : { display: "none" }}
      ></Box>
      {!mapLoaded && <Box sx={style.projectMap}>Loading map...</Box>}
      <Box sx={style.mapLabel}>
        <Heading>{project.name}</Heading>
        <Box>by {project.user?.name}</Box>
      </Box>
    </Flex>
  );
};

export default FeaturedProjectCard;
