import { Style } from 'mapbox-gl';

const path = 'https://global-districtbuilder-dev-us-east-1.s3.amazonaws.com/pa';


export const mapboxStyle: Style = {
  version: 8,
  name: 'District Builder',
  sources: {
    blockgroups: {
      type: 'vector',
      tiles: [path + '/data/tiles/{z}/{x}/{y}.pbf'],
      minzoom: 4,
      maxzoom: 10,
    },
  },
  layers: [
    {
      id: 'blockgroups-outline',
      type: 'line',
      source: 'blockgroups',
      'source-layer': 'bglines',
      paint: {
        'line-color': '#000',
        'line-opacity': ['interpolate', ['linear'], ['zoom'], 0, 0.1, 6, 0.1, 12, 0.2],
        'line-width': ['interpolate', ['linear'], ['zoom'], 6, 1, 12, 2],
      },
    },
  ],
  sprite: path + '/sprites/sprite',
  glyphs: path + '/fonts/{fontstack}/{range}.pbf',
};
