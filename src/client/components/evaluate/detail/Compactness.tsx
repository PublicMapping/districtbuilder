/** @jsx jsx */
import { Box, Flex, jsx, ThemeUIStyleObject, Heading } from "theme-ui";
import { EvaluateMetricWithValue, DistrictProperties } from "../../../../shared/entities";
import { getChoroplethStops } from "../../map/index";
import { DistrictsGeoJSON } from "../../../types";
import { getCompactnessDisplay } from "../../ProjectSidebar";

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

const CompactnessMetricDetail = ({
  metric,
  geojson
}: {
  readonly metric: EvaluateMetricWithValue;
  readonly geojson?: DistrictsGeoJSON;
}) => {
  function computeRowFill(row: DistrictProperties) {
    const val = row.compactness;
    const choroplethStops = getChoroplethStops(metric.key);
    // eslint-disable-next-line
    let i = 0;
    // eslint-disable-next-line
    while (i < choroplethStops.length) {
      const r = choroplethStops[i];
      if (val < r[0]) {
        return r[1];
      } else {
        i++;
      }
    }
    return "#fff";
  }

  return (
    <Box sx={{ ml: "20px", overflowY: "scroll" }}>
      <Heading as="h4" sx={{ variant: "text.h4", display: "block", width: "100%" }}>
        Average compactness of
        {metric.value ? ` ${Math.floor(metric.value * 100)}%` : " "}
      </Heading>
      <Flex sx={{ flexDirection: "column", width: "60%" }}>
        <table>
          <thead>
            <tr>
              <th sx={style.tableElement}>Number</th>
              <th sx={style.tableElement}>Compactness</th>
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
                          backgroundColor: `${computeRowFill(feature.properties)}`
                        }}
                      ></Box>
                      <Box sx={style.compactnessItem}>
                        {getCompactnessDisplay(feature.properties)}
                      </Box>
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

export default CompactnessMetricDetail;
