/** @jsx jsx */
import { Box, Flex, jsx, Styled, ThemeUIStyleObject, Heading } from "theme-ui";
import { getEqualPopulationStops } from "../../map/index";
import { DistrictsGeoJSON, EvaluateMetricWithValue } from "../../../types";
import { computeRowFill } from "../../../functions";

const style: ThemeUIStyleObject = {
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
  },
  number: {
    textAlign: "right"
  }
};

const EqualPopulationMetricDetail = ({
  metric,
  geojson
}: {
  readonly metric: EvaluateMetricWithValue;
  readonly geojson?: DistrictsGeoJSON;
}) => {
  const choroplethStops =
    metric.popThreshold && metric.avgPopulation
      ? getEqualPopulationStops(metric.popThreshold)
      : undefined;
  const numberOfMembers = metric.numberOfMembers;

  return (
    <Box>
      <Heading as="h2" sx={{ variant: "text.h5", mt: 4 }}>
        {metric.value?.toString() || " "} of {metric.total} districts within{" "}
        {"popThreshold" in metric &&
          metric.popThreshold !== undefined &&
          ` ${Math.floor(metric.popThreshold)}%`}{" "}
        of the target (
        {metric.populationPerRepresentative &&
          Math.floor(metric.populationPerRepresentative).toLocaleString()}
        &nbsp;/&nbsp;Rep.)
      </Heading>
      <Styled.table sx={style.table}>
        <thead>
          <Styled.tr>
            <Styled.th sx={{ ...style.th, ...style.colFirst }}>Number</Styled.th>
            <Styled.th sx={style.th}>Deviation (%)</Styled.th>
            <Styled.th sx={{ ...style.th, ...style.number }}>Number of reps</Styled.th>
            <Styled.th sx={{ ...style.th, ...style.number, ...style.colLast }}>Deviation</Styled.th>
          </Styled.tr>
        </thead>
        <tbody>
          {geojson?.features.map(
            (feature, id) =>
              id > 0 && (
                <Styled.tr key={id}>
                  <Styled.td sx={{ ...style.td, ...style.colFirst }}>{id}</Styled.td>

                  <Styled.td sx={style.td}>
                    {feature.properties.percentDeviation !== undefined &&
                    feature.properties.populationDeviation !== undefined ? (
                      <Flex sx={{ alignItems: "center" }}>
                        <Styled.div
                          sx={{
                            mr: 2,
                            width: "15px",
                            height: "15px",
                            borderRadius: "small",
                            bg:
                              choroplethStops &&
                              computeRowFill(
                                choroplethStops,
                                feature.properties.percentDeviation,
                                true
                              )
                          }}
                        ></Styled.div>
                        <Box>{Math.floor(feature.properties.percentDeviation * 1000) / 10}%</Box>
                      </Flex>
                    ) : (
                      <Box sx={style.blankValue}>-</Box>
                    )}
                  </Styled.td>

                  <Styled.td sx={{ ...style.td, ...style.number }}>
                    {numberOfMembers !== undefined && numberOfMembers[id - 1] ? (
                      numberOfMembers[id - 1]
                    ) : (
                      <Box sx={style.blankValue}>-</Box>
                    )}
                  </Styled.td>

                  <Styled.td sx={{ ...style.td, ...style.number, ...style.colLast }}>
                    {feature.properties.populationDeviation !== undefined ? (
                      Math.ceil(feature.properties.populationDeviation) === 0 ? (
                        // Need this to handle negative 0, which Math.ceil likes to return
                        "0"
                      ) : (
                        Math.ceil(feature.properties.populationDeviation).toLocaleString()
                      )
                    ) : (
                      <Box sx={style.blankValue}>-</Box>
                    )}
                  </Styled.td>
                </Styled.tr>
              )
          )}
        </tbody>
      </Styled.table>
    </Box>
  );
};

export default EqualPopulationMetricDetail;
