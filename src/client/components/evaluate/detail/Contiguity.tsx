/** @jsx jsx */
import { Box, Flex, jsx, ThemeUIStyleObject, Heading } from "theme-ui";
import { DistrictProperties, EvaluateMetricWithValue } from "../../../../shared/entities";
import { DistrictsGeoJSON } from "../../../types";
import { CONTIGUITY_FILL_COLOR, EVALUATE_GRAY_FILL_COLOR } from "../../map/index";
import React from "react";

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
  },
  legendColorSwatch: {
    display: "inline-block",
    mr: "40px",
    width: "20px",
    height: "20px",
    opacity: "0.9"
  }
};

const ContiguityMetricDetail = ({
  metric,
  geojson
}: {
  readonly metric: EvaluateMetricWithValue;
  readonly geojson?: DistrictsGeoJSON;
}) => {
  function computeRowFill(row: DistrictProperties) {
    return row.contiguity === "contiguous" ? CONTIGUITY_FILL_COLOR : EVALUATE_GRAY_FILL_COLOR;
  }
  return (
    <Box sx={{ ml: "20px", overflowY: "scroll" }}>
      <Heading as="h4" sx={{ variant: "text.h4", display: "block", width: "100%" }}>
        {metric.value} of {metric.total} districts are contiguous
      </Heading>
      <Flex sx={{ flexDirection: "column", width: "100%" }}>
        <table>
          <thead>
            <tr>
              <th sx={style.tableElement}>Number</th>
              <th sx={style.tableElement}>Contiguity</th>
            </tr>
          </thead>
          <tbody>
            {geojson?.features.map(
              (feature, id) =>
                id > 0 && (
                  <tr key={id}>
                    <td sx={style.tableElement}>{id}</td>
                    <td sx={style.tableElement}>
                      {feature.properties.contiguity ? (
                        <React.Fragment>
                          <Box
                            sx={{
                              ...style.legendColorSwatch,
                              backgroundColor: computeRowFill(feature.properties)
                            }}
                          ></Box>
                          <Box sx={style.compactnessItem}>
                            {feature.properties.contiguity === "contiguous"
                              ? "Contiguous"
                              : "Non-contiguous"}
                          </Box>
                        </React.Fragment>
                      ) : (
                        <Box sx={style.compactnessItem}>Empty</Box>
                      )}
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

export default ContiguityMetricDetail;
