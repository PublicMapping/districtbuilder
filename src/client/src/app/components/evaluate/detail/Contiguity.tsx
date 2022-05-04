/** @jsx jsx */
import { Box, Flex, jsx, Themed, ThemeUIStyleObject, Heading } from "theme-ui";
import { DistrictProperties } from "@districtbuilder/shared/entities";
import { DistrictsGeoJSON, EvaluateMetricWithValue } from "../../../types";
import { CONTIGUITY_FILL_COLOR, EVALUATE_GRAY_FILL_COLOR } from "../../map/index";

const style: Record<string, ThemeUIStyleObject> = {
  table: {
    mx: 0,
    mb: 2,
    width: "100%"
  },
  th: {
    fontWeight: "bold",
    color: "gray.7",
    bg: "muted",
    fontSize: 1,
    textAlign: "left",
    pt: 2,
    px: 2,
    height: "32px",
    position: "sticky",
    top: "0",
    zIndex: 2,
    userSelect: "none",
    "&::after": {
      height: "1px",
      content: "''",
      display: "block",
      width: "100%",
      bg: "gray.2",
      bottom: "-1px",
      position: "absolute",
      left: 0,
      right: 0
    }
  },
  td: {
    fontWeight: "body",
    color: "gray.8",
    fontSize: 1,
    p: 2,
    textAlign: "left",
    verticalAlign: "bottom",
    position: "relative"
  },
  colFirst: {
    pl: 0
  },
  colLast: {
    pr: 0
  },
  blankValue: {
    color: "gray.2"
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
    <Box>
      <Heading as="h2" sx={{ variant: "text.h5", mt: 4 }}>
        {metric.value} of {metric.total} districts are contiguous
      </Heading>
      <Themed.table sx={style.table}>
        <thead>
          <Themed.tr>
            <Themed.th sx={{ ...style.th, ...style.colFirst }}>Number</Themed.th>
            <Themed.th sx={{ ...style.th, ...style.colLast }}>Contiguity</Themed.th>
          </Themed.tr>
        </thead>
        <tbody>
          {geojson?.features.map(
            (feature, id) =>
              id > 0 && (
                <Themed.tr key={id}>
                  <Themed.td sx={{ ...style.td, ...style.colFirst }}>{id}</Themed.td>
                  <Themed.td sx={{ ...style.td, ...style.colLast }}>
                    {feature.properties.contiguity ? (
                      <Flex sx={{ alignItems: "center" }}>
                        <Box
                          sx={{
                            mr: 2,
                            width: "15px",
                            height: "15px",
                            borderRadius: "small",
                            bg: computeRowFill(feature.properties)
                          }}
                        ></Box>
                        <Box>
                          {feature.properties.contiguity === "contiguous"
                            ? "Contiguous"
                            : "Non-contiguous"}
                        </Box>
                      </Flex>
                    ) : (
                      <Box sx={style.blankValue}>–</Box>
                    )}
                  </Themed.td>
                </Themed.tr>
              )
          )}
        </tbody>
      </Themed.table>
    </Box>
  );
};

export default ContiguityMetricDetail;
