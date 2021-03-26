/** @jsx jsx */
import { OrgProject } from "../types";
import { Box, Flex, Heading, jsx, Spinner, Text } from "theme-ui";
import MapboxGL from "mapbox-gl";
import { useEffect, useRef, useState } from "react";
import bbox from "@turf/bbox";
import { getDistrictColor } from "../constants/colors";

import { BBox2d } from "@turf/helpers/lib/geojson";

const style = {
  featuredProject: {
    flexDirection: "column",
    bg: "#fff",
    borderRadius: "2px",
    boxShadow: "small",
  },
  mapContainer: {
    width: "100%",
    height: "250px",
    position: "relative",
    p: "15px",
  },
  map: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  mapLabel: {
    p: "15px",
    borderColor: "gray.2",
    borderTopWidth: "1px",
    borderTopStyle: "solid",
  },
} as const;

const FeaturedProjectCard = ({ project }: { readonly project: OrgProject }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (mapRef.current === null) {
      return;
    }

    // @ts-ignore
    project.districts.features.forEach((feature, id) => {
      // @ts-ignore
      // eslint-disable-next-line
      feature.properties.color = getDistrictColor(id);
    });

    const bounds = project.districts && (bbox(project.districts) as BBox2d);
    const map = new MapboxGL.Map({
      container: mapRef.current,
      style: {
        version: 8,
        sources: {},
        layers: [],
      },
      bounds,
      fitBoundsOptions: { padding: 15 },
      interactive: false,
    });

    map.on("load", function () {
      project.districts &&
        map.addSource("districts", {
          type: "geojson",
          data: project.districts,
        });
      map.addLayer({
        id: "districts",
        type: "fill",
        source: "districts",
        layout: {},
        paint: {
          "fill-color": { type: "identity", property: "color" },
        },
      });
      map.resize();

      setMapLoaded(true);
    });
  }, [mapRef, project.districts]);

  return (
    <Flex sx={style.featuredProject}>
      <Box sx={style.mapContainer}>
        <Box ref={mapRef} sx={style.map}></Box>
      </Box>
      {!mapLoaded && (
        <Box sx={style.mapContainer}>
          <Spinner variant="spinner.small" />
        </Box>
      )}
      <Box sx={style.mapLabel}>
        <Heading
          as="h3"
          sx={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontSize: "2",
            mb: "1",
          }}
        >
          {project.name}
        </Heading>
        <Text
          sx={{
            fontSize: "1",
          }}
        >
          by {project.user?.name}
        </Text>
      </Box>
    </Flex>
  );
};

export default FeaturedProjectCard;
