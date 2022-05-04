jest.mock("mapbox-gl/dist/mapbox-gl", () => ({
  GeolocateControl: jest.fn(),
  Map: jest.fn(() => ({
    addControl: jest.fn(),
    dragRotate: { disable: jest.fn() },
    doubleClickZoom: { disable: jest.fn() },
    touchZoomRotate: { disableRotation: jest.fn() },
    on: jest.fn(),
    remove: jest.fn()
  })),
  NavigationControl: jest.fn()
}));

export default {};
