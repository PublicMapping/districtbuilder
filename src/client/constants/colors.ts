import { ReferenceLayerColors } from "../../shared/constants";

const districtColors = [
  "transparent",
  "#19CB35",
  "#F4B53F",
  "#8053F6",
  "#A9573D",
  "#0AC4FF",
  "#FE6F2A",
  "#2E7EF9",
  "#F72B61",
  "#EDAAC5",
  "#5DBBAE",
  "#6B6783",
  "#FFDC5B",
  "#FF937B",
  "#A00090",
  "#016071",
  "#8AB2FB",
  "#858C73",
  "#bfef45",
  "#e6beff",
  "#0000ff",
  "#FF0018",
  "#00FF33",
  "#FFFF00",
  "#1CE6FF",
  "#FF34FF",
  "#c0c19f",
  "#BDFCC8",
  "#FAD8B6",
  "#ACC7EC",
  "#449896",
  "#c23000",
  "#4fc601",
  "#ff6832",
  "#6b4f29",
  "#962b75",
  "#ccd27f",
  "#005c8b",
  "#00a45f",
  "#ea1ca9",
  "#d68e01",
  "#0086ed",
  "#6b7900",
  "#0000a6",
  "#8502ff",
  "#ff0020",
  "#db9d72",
  "#ff5ae4",
  "#4692ad",
  "#e45f35",
  "#e2bc00",
  "#018615",
  "#8f7f00",
  "#a449dc",
  "#e70452",
  "#2e57aa",
  "#dffb71",
  "#e5a532",
  "#7dbf32",
  "#5ea7ff",
  "#c64289",
  "#6d3800",
  "#f4d749",
  "#7a7bff",
  "#0cea91",
  "#ff4526",
  "#322edf",
  "#00905e",
  "#671190",
  "#9ccc04",
  "#608eff",
  "#563930",
  "#ff6f01",
  "#ddbc62",
  "#20e200",
  "#74569e",
  "#3156dc",
  "#ffe47d",
  "#5a0007",
  "#fc009c",
  "#598c5a",
  "#7900d7",
  "#be0028",
  "#73be54",
  "#856465",
  "#00cde2",
  "#ff0169",
  "#c36d96",
  "#cfff00",
  "#363dff",
  "#ff9079",
  "#772600",
  "#5eb393",
  "#d25b88",
  "#8b4a4e",
  "#a3c8c9",
  "#ac84dd",
  "#88ec69",
  "#c42221",
  "#536eff",
  "#5d3033",
  "#ccaa35",
  "#04784d",
  "#bd7322",
  "#5b113c",
  "#4145a7",
  "#8bc891",
  "#bc23ff",
  "#fd0039",
  "#8bb400",
  "#0aa6d8",
  "#ffb500",
  "#ff74fe",
  "#0100e2",
  "#ff5f6b",
  "#C9D2E5",
  "#00e0e4",
  "#ce934c",
  "#0568ec",
  "#893de3",
  "#51a058",
  "#66796d",
  "#ff3b53",
  "#3db5a7",
  "#e69034",
  "#00447d",
  "#b88183",
  "#eec3ff",
  "#bec459",
  "#370e77",
  "#7ed379",
  "#e704c4",
  "#e5d381",
  "#ff9b03",
  "#5ebcd1",
  "#4b0059",
  "#8c4787",
  "#1a7b42",
  "#ff6c60",
  "#dcde5c",
  "#da71ff",
  "#8da4db",
  "#1be177",
  "#890039",
  "#0e72c5",
  "#e8c282",
  "#00ab4d",
  "#d16100",
  "#6751bb",
  "#ff4f78",
  "#00a6aa",
  "#e83000",
  "#1ca370",
  "#eb9a8b",
  "#00ffff",
  "#ffc07f",
  "#48b176",
  "#953f00",
  "#e500f1",
  "#94a9c9",
  "#7d9f00",
  "#ff1a59",
  "#5eaadd",
  "#025117",
  "#d7c54a",
  "#9cb8e4",
  "#b3af9d",
  "#ff90c9",
  "#79db21",
  "#922329",
  "#976fd9",
  "#B5F0B1",
  "#a76f42",
  "#938a81",
  "#bb1f69",
  "#003177",
  "#84edf7",
  "#a97399",
  "#ffb550",
  "#9e0366",
  "#5a9bc2",
  "#4fc15f",
  "#89412e",
  "#ff2f80",
  "#be811a",
  "#fec96d",
  "#8181d5",
  "#6fe9ad",
  "#d1511c",
  "#033c61",
  "#e383e6",
  "#a37e6f",
  "#7cb9ba",
  "#2eb500",
  "#ea0072",
  "#00489c",
  "#ffbaad",
  "#3b5dff",
  "#e27a05",
  "#8f5df8",
  "#9c6966",
  "#c4df72",
  "#f35691",
  "#252f99",
  "#a168a6",
  "#04f757",
  "#ec5200",
  "#da4cff",
  "#0aa3f7",
  "#66460a",
  "#8502aa",
  "#e6e5a7",
  "#0045d2",
  "#ca834e",
  "#314c1e",
  "#b0415d",
  "#52ce79",
  "#ae81ff",
  "#378fdb",
  "#a9795c",
  "#f77183",
  "#98d058",
  "#e20027",
  "#efafff",
  "#0098ff",
  "#101835",
  "#456648",
  "#a4e804",
  "#b4a04f",
  "#c9403a",
  "#7560d5",
  "#4b6ba5",
  "#fcc7db",
  "#99adc0",
  "#9cff93",
  "#ff7b59",
  "#71b2f5",
  "#ff3bc1",
  "#c59700",
  "#006679",
  "#bb3c42",
  "#00b433",
  "#0060cd",
  "#9bbb57",
  "#4621b2",
  "#97703c",
  "#bc65e9",
  "#66e1d3",
  "#7f9eff",
  "#ba0900",
  "#b28d2d",
  "#ea8b66",
  "#cce93a",
  "#2f5d9b",
  "#ed3488",
  "#02d346",
  "#ff7b7d",
  "#0080cf",
  "#a77500",
  "#6eff92",
  "#e87eac",
  "#00ccff",
  "#b903aa",
  "#be452d",
  "#b4a200",
  "#5875c1",
  "#80ffcd",
  "#a3dae4",
  "#da0004",
  "#abe86b",
  "#da713c",
  "#029bdb",
  "#002e17",
  "#da007c",
  "#adaaff",
  "#00d891",
  "#76912f",
  "#89006a",
  "#E3C28A",
  "#ff84e6",
  "#014a68",
  "#dd4a38",
  "#9b9700",
  "#7fdefe",
  "#682021",
  "#3a2465",
  "#8d8546",
  "#ba6200",
  "#4ac684",
  "#012c58",
  "#ffa861",
  "#c535a9",
  "#77d796",
  "#9f94f0",
  "#c2ff99",
  "#cc0744",
  "#bd744e",
  "#58afad",
  "#602b70",
  "#ffe09e",
  "#f56d93",
  "#3b000a",
  "#aa9a92",
  "#979440",
  "#555196",
  "#7ac5a6",
  "#e30091",
  "#006039",
  "#cd7dae",
  "#e66d53",
  "#5771da",
  "#62e674",
  "#c6d300",
  "#013349",
  "#17fce4",
  "#dd3248",
  "#e58e56",
  "#8a9f45",
  "#006fa6",
  "#ffb3e1",
  "#70ec98",
  "#6635af",
  "#b77b68",
  "#5eff03",
  "#b5b400",
  "#91028c",
  "#34bbff",
  "#b56481",
  "#5b62c1",
  "#dd587b",
  "#96c57f",
  "#d20096",
  "#009087",
  "#e98176",
  "#445083",
  "#fff69f",
  "#741d16",
  "#ff6ec2",
  "#6ad450",
  "#ffb789",
  "#9556bd",
  "#8fb0ff",
  "#b70546",
  "#0cbd66",
  "#067eaf",
  "#d86a78",
  "#31ddae",
  "#d60034",
  "#70968e",
  "#4979b0",
  "#bf45cc",
  "#7e6405",
  "#006c31",
  "#4b4b6a",
  "#997d87",
  "#4c83a1",
  "#6a9d3b",
  "#ff9e6b",
  "#55c899",
  "#7fbbec",
  "#ca8869",
  "#006a66",
  "#6542d2",
  "#e773ce",
  "#696628",
  "#3e89be",
  "#ccb87c",
  "#d83d66",
  "#4d913e",
  "#224451",
  "#e5fda4",
  "#a45b02",
  "#C1F2FD",
  "#4b3a83",
  "#a2aa45",
  "#323925",
  "#00f8b3",
  "#ddb6d0",
  "#61ab1f",
  "#6367a9",
  "#982e0b",
  "#92bea5",
  "#aa62c3",
  "#e7ab63",
  "#8d5700",
  "#b3008b",
  "#3d7397",
  "#e27172",
  "#9c8333",
  "#511f4d",
  "#e451d1",
  "#7d74a9",
  "#3b9700",
  "#cca763",
  "#68d1b6",
  "#d21656",
  "#4c257f",
  "#8cd0ff",
  "#636a01",
  "#e05859",
  "#637b5d",
  "#0089a3",
  "#917100",
  "#a243a7",
  "#4ca43b",
  "#d45262",
  "#c5aab6",
  "#852c19",
  "#00b6c5",
  "#b90076",
  "#eae408",
  "#55813b",
  "#a05837",
  "#ffaa92",
  "#D7FEFB",
  "#874aa6",
  "#00846f",
  "#adff60",
  "#c6005a",
  "#b79762",
  "#d16cda"
];

export const getDistrictColor = (id?: string | number) => {
  const index = typeof id === "number" ? id : 0;

  // Cycle through the list in case there are a very large number of districts
  return districtColors[index % districtColors.length];
};

export const positiveChangeColor = "#388a64";
export const negativeChangeColor = "#c54d5d";
export const selectedDistrictColor = "#f2f6f9";

export const demographicsColors = {
  white: "#8DD3C6",
  black: "#80B1D3",
  asian: "#FDB462",
  hispanic: "#BEBADA",
  native: "#FB8071",
  pacific: "#B3DE69",
  multiracial: "#D77EFF",
  other: "#5A563E"
};

export const REFERENCE_LAYER_COLOR_CODES = {
  [ReferenceLayerColors.Green]: "#17c42f",
  [ReferenceLayerColors.Orange]: "#f3ad37",
  [ReferenceLayerColors.Purple]: "#7549f6",
  [ReferenceLayerColors.Blue]: "#0018ff",
  [ReferenceLayerColors.Pink]: "#eaa0bd",
  [ReferenceLayerColors.Red]: "#f62756"
};
