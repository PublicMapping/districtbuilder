/** @jsx jsx */
import { Box, Flex, Heading, jsx, Spinner, Text } from "theme-ui";
import MapboxGL from "mapbox-gl";
import { useEffect, useRef, useState } from "react";
import bbox from "@turf/bbox";
import { useHistory } from "react-router-dom";

import { BBox2d } from "@turf/helpers/lib/geojson";

import { ProjectNest } from "../../shared/entities";
import { DistrictGeoJSON } from "../types";
import { getDistrictColor } from "../constants/colors";

const style = {
  featuredProject: {
    flexDirection: "column",
    bg: "#fff",
    borderRadius: "2px",
    boxShadow: "small",
    "&:hover": {
      cursor: "pointer"
    }
  },
  mapContainer: {
    width: "100%",
    height: "250px",
    position: "relative",
    p: "15px"
  },
  map: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  },
  mapLabel: {
    p: "15px",
    borderColor: "gray.2",
    borderTopWidth: "1px",
    borderTopStyle: "solid"
  }
} as const;

const FeaturedProjectCard = ({ project }: { readonly project: ProjectNest }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const history = useHistory();

  function goToProject(project: ProjectNest) {
    history.push(`/projects/${project.id}`);
  }

  // TODO #179 - the districts property can't be defined in the shared/entities.d.ts right now
  // @ts-ignore
  const districts: DistrictGeoJSON | undefined = project.districts;

  useEffect(() => {
    if (mapRef.current === null) {
      return;
    }

    districts.features.forEach((feature: DistrictGeoJSON, id: number) => {
      // eslint-disable-next-line
      feature.properties.color = getDistrictColor(id);
    });

    const bounds = districts && (bbox(districts) as BBox2d);
    const map = new MapboxGL.Map({
      container: mapRef.current,
      style: {
        version: 8,
        sources: {},
        layers: []
      },
      bounds,
      fitBoundsOptions: { padding: 15 },
      interactive: false
    });

    map.on("load", function() {
      districts &&
        map.addSource("districts", {
          type: "geojson",
          data: districts
        });
      map.addLayer({
        id: "districts",
        type: "fill",
        source: "districts",
        layout: {},
        paint: {
          "fill-color": { type: "identity", property: "color" }
        }
      });
      map.resize();

      setMapLoaded(true);
    });
  }, [mapRef, districts]);

  return (
    <Flex sx={style.featuredProject} onClick={() => goToProject(project)}>
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
            mb: "1"
          }}
        >
          {project.name}
        </Heading>
        <Text
          sx={{
            fontSize: "1"
          }}
        >
          by {project.user?.name}
        </Text>
      </Box>
    </Flex>
  );
};

export default FeaturedProjectCard;
