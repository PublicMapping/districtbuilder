/** @jsx jsx */
import { Box, Flex, jsx, ThemeUIStyleObject, Heading } from "theme-ui";
import { EvaluateMetricWithValue, DistrictProperties } from "../../../../shared/entities";
import { getChoroplethStops } from "../../map/index";
import { DistrictsGeoJSON } from "../../../types";

const style: ThemeUIStyleObject = {
  tableElement: {
    fontWeight: "body",
    color: "gray.8",
    fontSize: 1,
    p: 2,
    textAlign: "left",
    verticalAlign: "bottom",
    minWidth: "20px",
    maxWidth: "200px",
    mr: "10px"
  },
  fillBox: {
    height: "10px",
    width: "10px",
    background: "orange",
    opacity: "0.9",
    outline: "1px solid black"
  },
  unfilledBox: {
    height: "10px",
    width: "10px",
    background: "none",
    outline: "1px solid black"
  },
  compactnessItem: {
    display: "inline-block",
    verticalAlign: "center"
  },
  tableHeader: {
    float: "left",
    width: "40%"
  }
};

const EqualPopulationMetricDetail = ({
  metric,
  geojson
}: {
  readonly metric: EvaluateMetricWithValue;
  readonly geojson?: DistrictsGeoJSON;
}) => {
  function computeRowFill(row: DistrictProperties) {
    const val = row.percentDeviation;
    const choroplethStops = getChoroplethStops(metric.key);
    // eslint-disable-next-line
    for (let i = 0; i < choroplethStops.length; i++) {
      const r = choroplethStops[i];
      if (val && val >= r[0]) {
        if (i < choroplethStops.length - 1) {
          const r1 = choroplethStops[i + 1];
          if (val < r1[0]) {
            return r[1];
          }
        } else {
          return r[1];
        }
      }
    }
    return "#fff";
  }

  return (
    <Box sx={{ ml: "20px", overflowY: "scroll" }}>
      <Heading as="h4" sx={{ variant: "text.h4", display: "block", width: "100%" }}>
        {metric.value || " "} of the {metric.total} districts are within{" "}
        {"popThreshold" in metric &&
          metric.popThreshold &&
          ` ${Math.floor(metric.popThreshold * 100)}%`}{" "}
        of {metric.avgPopulation && Math.floor(metric.avgPopulation).toLocaleString()}
      </Heading>
      <Flex sx={{ flexDirection: "column", width: "60%" }}>
        <table>
          <thead>
            <tr>
              <th sx={style.tableElement}>Number</th>
              <th sx={style.tableElement}>Deviation (%)</th>
              <th sx={style.tableElement}>Deviation</th>
            </tr>
          </thead>
          <tbody>
            {geojson?.features.map(
              (feature, id) =>
                id > 0 && (
                  <tr key={id}>
                    <td sx={style.tableElement}>{id}</td>
                    <td sx={style.tableElement}>
                      <Box
                        sx={{
                          display: "inline-block",
                          mr: "40px",
                          width: "20px",
                          height: "20px",
                          opacity: "0.9",
                          // @ts-ignore
                          backgroundColor: feature.properties.percentDeviation
                            ? `${computeRowFill(feature.properties)}`
                            : "none"
                        }}
                      ></Box>
                      <Box sx={style.compactnessItem}>
                        {// @ts-ignore
                        feature.properties.percentDeviation
                          ? ` ${Math.floor(feature.properties.percentDeviation * 1000) / 10}%`
                          : "-"}
                      </Box>
                    </td>
                    <td sx={style.tableElement}>
                      {feature.properties.populationDeviation
                        ? Math.round(feature.properties.populationDeviation).toLocaleString()
                        : "-"}
                    </td>
                  </tr>
                )
            )}
          </tbody>
        </table>
      </Flex>
    </Box>
  );
};

export default EqualPopulationMetricDetail;
