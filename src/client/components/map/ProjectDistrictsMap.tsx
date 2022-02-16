/** @jsx jsx */
import { Box, jsx, Spinner, ThemeUIStyleObject } from "theme-ui";
import MapboxGL from "mapbox-gl";
import React, { useEffect, useRef, useState } from "react";

import { IStaticMetadata, ProjectNest } from "../../../shared/entities";
import { DistrictGeoJSON } from "../../types";
import { getDistrictColor } from "../../constants/colors";
import { fetchMemoizedStateBbox } from "../../api";

const style: Record<string, ThemeUIStyleObject> = {
  mapContainer: {
    display: "inline-block",
    position: "relative",
    p: "10px",
    left: 0
  },
  map: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  }
};

const ProjectDistrictsMap = ({
  project,
  context
}: {
  readonly project: ProjectNest;
  readonly context: "home" | "communityMaps";
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [bounds, setBounds] = useState<[number, number, number, number] | null>(null);
  project.regionConfig &&
    !bounds &&
    fetchMemoizedStateBbox(project.regionConfig).then((bboxData: IStaticMetadata["bbox"]) => {
      // Conversion from readonly -> mutable to match Mapbox interface
      setBounds([...bboxData]);
    });

  // TODO #179 - the districts property can't be defined in the shared/entities.d.ts right now
  // @ts-ignore
  const districts: DistrictsGeoJSON | undefined = project.districts;

  useEffect(() => {
    if (mapRef.current === null || bounds === null) {
      return;
    }

    districts &&
      districts.features.forEach((feature: DistrictGeoJSON, id: number) => {
        // On the main project screen the unassigned district isn't colored in,
        // but for the minimap we need it to be visible to define the state borders

        // eslint-disable-next-line functional/immutable-data
        feature.properties.color = id === 0 ? "#EDEDED" : getDistrictColor(id);
      });

    const map = new MapboxGL.Map({
      container: mapRef.current,
      style: {
        version: 8,
        sources: {},
        layers: []
      },
      bounds,
      fitBoundsOptions: { padding: context === "communityMaps" ? 15 : 10 },
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
  }, [mapRef, districts, bounds]);

  return (
    <React.Fragment>
      <Box
        sx={
          context === "communityMaps"
            ? { ...style.mapContainer, width: "100%", height: "200px" }
            : { ...style.mapContainer, width: "100%", height: "125px" }
        }
      >
        <Box ref={mapRef} sx={style.map}></Box>
      </Box>
      {!mapLoaded && (
        <Box sx={{ ...style.mapContainer, ...{ position: "absolute" } }}>
          <Spinner variant="styles.spinner.small" />
        </Box>
      )}
    </React.Fragment>
  );
};

export default ProjectDistrictsMap;
