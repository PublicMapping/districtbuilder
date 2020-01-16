import React, { useEffect, useRef, useState } from 'react';

import MapboxGL from 'mapbox-gl';
import "mapbox-gl/dist/mapbox-gl.css";

import { mapboxStyle } from '../constants/map';

const styles = {
  width: '100%',
  height: '100%',
};

const Map = () => {
  const [map, setMap] = useState<MapboxGL.Map | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeMap = (setMap: (map: MapboxGL.Map) => void, mapContainer: HTMLDivElement ) => {
        const map = new MapboxGL.Map({
          container: mapContainer,
          style: mapboxStyle,
          center: [-77.63, 41],
          zoom: 6.5,
          minZoom: 5,
          maxZoom: 15,
        });

        map.dragRotate.disable();
        map.touchZoomRotate.disableRotation();
        map.doubleClickZoom.disable();

        map.on('load', () => {
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

  return (
    <div ref={mapRef} style={styles} />
  );
}

export default Map;
