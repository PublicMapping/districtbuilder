/** @jsx jsx */
import { OrgProject } from "../types";
import { Box, Flex, Heading, jsx } from "theme-ui";
import MapboxGL from "mapbox-gl";
import { useEffect, useRef } from "react";
import bbox from "@turf/bbox";
import { MAPBOX_STYLE, MAPBOX_TOKEN } from "../constants/map";

const style = {
  featuredProject: {
    flexDirection: "column",
    border: "1px solid black",
    padding: "20px",
    minHeight: "200px"
  },
  projectMap: {
    height: "300px",
    width: "300px"
  }
} as const;

const FeaturedProjectCard = ({ project }: { readonly project: OrgProject }) => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line
    if (mapRef.current === null) {
      return;
    }

    // eslint-disable-next-line
    MapboxGL.accessToken = MAPBOX_TOKEN;

    const map = new MapboxGL.Map({
      container: mapRef.current,
      style: MAPBOX_STYLE,
      fitBoundsOptions: { padding: 20 },
      minZoom: 5,
      maxZoom: 5
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
      const bounds = project.districts && bbox(project.districts);

      // @ts-ignore
      bounds && map.fitBounds(bounds);
    });
  }, [mapRef, project.districts]);

  return (
    <Flex sx={style.featuredProject}>
      <Box ref={mapRef} sx={style.projectMap}></Box>
      <Heading>{project.name}</Heading>
      <Box>by {project.user?.name}</Box>
    </Flex>
  );
};

export default FeaturedProjectCard;
