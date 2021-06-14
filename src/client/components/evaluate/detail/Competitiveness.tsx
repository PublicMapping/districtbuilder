/** @jsx jsx */
import { Box, Flex, jsx, Styled, ThemeUIStyleObject, Heading } from "theme-ui";
import { getPviSteps } from "../../map/index";
import { DistrictsGeoJSON, EvaluateMetricWithValue } from "../../../types";
import PVIDisplay from "../../PVIDisplay";
import { formatPvi, computeRowFill, calculatePVI } from "../../../functions";

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
  }
};

const CompetitivenessMetricDetail = ({
  metric,
  geojson
}: {
  readonly metric: EvaluateMetricWithValue;
  readonly geojson?: DistrictsGeoJSON;
}) => {
  const choroplethStops = getPviSteps();
  return (
    <Box>
      <Heading as="h2" sx={{ variant: "text.h5", mt: 4 }}>
        Partisan Voting Index (PVI):
        <span sx={{ color: metric.party?.color || "#000" }}>
          {formatPvi(metric.party, metric.value)}
        </span>
      </Heading>
      <Styled.table sx={style.table}>
        <thead>
          <Styled.tr>
            <Styled.th sx={{ ...style.th, ...style.colFirst }}>Number</Styled.th>
            <Styled.th sx={{ ...style.th, ...style.colLast }}>Partisan Voting Index</Styled.th>
          </Styled.tr>
        </thead>
        <tbody>
          {geojson?.features.map(
            (feature, id) =>
              id > 0 && (
                <Styled.tr key={id}>
                  <Styled.td sx={{ ...style.td, ...style.colFirst }}>{id}</Styled.td>
                  <Styled.td sx={{ ...style.td, ...style.colLast }}>
                    {feature.properties.voting && metric.electionYear ? (
                      <Flex sx={{ alignItems: "center" }}>
                        <Styled.div
                          sx={{
                            mr: 2,
                            width: "15px",
                            height: "15px",
                            borderRadius: "small",
                            bg:
                              feature.properties.pvi &&
                              computeRowFill(
                                choroplethStops,
                                calculatePVI(feature.properties.voting, metric.electionYear),
                                true
                              )
                          }}
                        ></Styled.div>
                        <PVIDisplay properties={feature.properties} year={metric.electionYear} />
                      </Flex>
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

export default CompetitivenessMetricDetail;
