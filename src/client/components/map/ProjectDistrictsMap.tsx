/** @jsx jsx */
import { Box, jsx, Spinner } from "theme-ui";
import MapboxGL from "mapbox-gl";
import React, { useEffect, useRef, useState } from "react";
import bbox from "@turf/bbox";

import { BBox2d } from "@turf/helpers/lib/geojson";

import { ProjectNest } from "../../../shared/entities";
import { DistrictGeoJSON } from "../../types";
import { getDistrictColor } from "../../constants/colors";

const style = {
  mapContainer: {
    height: "250px",
    display: "inline-block",
    position: "relative",
    p: "15px"
  },
  map: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  }
} as const;

const ProjectDistrictsMap = ({
  project,
  context
}: {
  readonly project: ProjectNest;
  readonly context: "home" | "communityMaps";
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);

  // TODO #179 - the districts property can't be defined in the shared/entities.d.ts right now
  // @ts-ignore
  const districts: DistrictsGeoJSON | undefined = project.districts;

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

    function onLoad() {
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
    }

    map.on("load", onLoad);
    return () => {
      map.off("load", onLoad);
    };
  }, [mapRef, districts]);

  return (
    <React.Fragment>
      <Box
        sx={
          context === "communityMaps"
            ? { ...style.mapContainer, width: "100%" }
            : { ...style.mapContainer, width: "300px" }
        }
      >
        <Box
          ref={mapRef}
          sx={context === "communityMaps" ? style.map : { ...style.map, pl: "20px" }}
        ></Box>
      </Box>
      {!mapLoaded && (
        <Box sx={{ ...style.mapContainer, ...{ position: "absolute" } }}>
          <Spinner variant="spinner.small" />
        </Box>
      )}
    </React.Fragment>
  );
};

export default ProjectDistrictsMap;
