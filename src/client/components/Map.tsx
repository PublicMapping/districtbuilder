import { join } from "path";
import React, { useEffect, useRef, useState } from "react";

import MapboxGL from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { IProject } from "../../shared/entities";
import { s3ToHttps } from "../s3";

const styles = {
  width: "100%",
  height: "100%"
};

interface Props {
  readonly project: IProject;
}

function getMapboxStyle(path: string): MapboxGL.Style {
  return {
    layers: [
      {
        id: "county-outline",
        type: "line",
        source: "county", // why?
        "source-layer": "tract",
        paint: {
          "line-color": "#000",
          "line-opacity": ["interpolate", ["linear"], ["zoom"], 0, 0.1, 6, 0.1, 12, 0.2],
          "line-width": ["interpolate", ["linear"], ["zoom"], 6, 1, 12, 2]
        }
      }
    ],
    name: "District Builder",
    sources: {
      county: {
        type: "vector",
        tiles: [join(s3ToHttps(path), "tiles/{z}/{x}/{y}.pbf")],
        minzoom: 4,
        maxzoom: 10
      }
    },
    version: 8
  };
}

const Map = ({ project }: Props) => {
  const [map, setMap] = useState<MapboxGL.Map | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeMap = (setMap: (map: MapboxGL.Map) => void, mapContainer: HTMLDivElement) => {
      const map = new MapboxGL.Map({
        container: mapContainer,

        style: getMapboxStyle(project.regionConfig.s3URI),

        //center: [-75.547314, 39.746992],
        //zoom: 6.5,
        bounds: [-73.9876, 40.7661, -73.9397, 40.8002],

        minZoom: 5,
        maxZoom: 15
      });

      map.dragRotate.disable();
      map.touchZoomRotate.disableRotation();
      map.doubleClickZoom.disable();

      map.on("load", () => {
        setMap(map);
        map.resize();
      });
    };

    // Can't use ternary operator here because the call to setMap is async
    // tslint:disable-next-line
    if (!map && mapRef.current != null) {
      initializeMap(setMap, mapRef.current);
    }
    // eslint complains that this useEffect should depend on map, but we're using this to call setMap so that wouldn't make sense
    // eslint-disable-next-line
  }, []);

  return <div ref={mapRef} style={styles} />;
};

export default Map;
