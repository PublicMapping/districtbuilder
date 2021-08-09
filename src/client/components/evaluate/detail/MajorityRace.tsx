/** @jsx jsx */
import { Box, Flex, jsx, Styled, ThemeUIStyleObject, Heading } from "theme-ui";
import { DistrictsGeoJSON, EvaluateMetricWithValue } from "../../../types";
import Tooltip from "../../Tooltip";
import DemographicsTooltip from "../../DemographicsTooltip";
import DemographicsChart from "../../DemographicsChart";
import { getMajorityRaceDisplay, isMajorityMinority } from "../../../functions";

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

const MajorityRaceMetricDetail = ({
  metric,
  geojson
}: {
  readonly metric: EvaluateMetricWithValue;
  readonly geojson?: DistrictsGeoJSON;
}) => {
  return (
    <Box>
      <Heading as="h2" sx={{ variant: "text.h5", mt: 4 }}>
        Your map has {metric.value?.toString() || " "} Majority-Minority districts
      </Heading>
      <Styled.table sx={style.table}>
        <thead>
          <Styled.tr>
            <Styled.th sx={{ ...style.th, ...style.colFirst }}>Number</Styled.th>
            <Styled.th sx={style.th}>Majority Race</Styled.th>
            <Styled.th sx={{ ...style.th, ...style.colLast }}>Demographics</Styled.th>
          </Styled.tr>
        </thead>
        <tbody>
          {geojson?.features.map(
            (feature, id) =>
              id > 0 && (
                <Styled.tr key={id}>
                  <Styled.td sx={{ ...style.td, ...style.colFirst }}>{id}</Styled.td>

                  <Styled.td sx={style.td}>
                    {feature.properties.majorityRace !== undefined ? (
                      <Flex sx={{ alignItems: "center" }}>
                        <Styled.div
                          sx={{
                            mr: 2,
                            width: "15px",
                            height: "15px",
                            borderRadius: "small",
                            bg: feature.properties.majorityRaceFill
                          }}
                        ></Styled.div>
                        <Box>{getMajorityRaceDisplay(feature)}</Box>
                      </Flex>
                    ) : (
                      <Box sx={style.blankValue}>-</Box>
                    )}
                  </Styled.td>

                  <Styled.td sx={{ ...style.td, ...style.colLast }}>
                    <Tooltip
                      placement="top-start"
                      content={
                        feature.properties.demographics.population > 0 ? (
                          <DemographicsTooltip
                            demographics={feature.properties.demographics}
                            isMajorityMinority={isMajorityMinority(feature)}
                          />
                        ) : (
                          <em>
                            <strong>Empty district.</strong> Add people to this district to view the
                            race chart
                          </em>
                        )
                      }
                    >
                      <span sx={{ display: "inline-block" }}>
                        <span sx={style.chart}>
                          <DemographicsChart demographics={feature.properties.demographics} />
                        </span>
                      </span>
                    </Tooltip>
                  </Styled.td>
                </Styled.tr>
              )
          )}
        </tbody>
      </Styled.table>
    </Box>
  );
};

export default MajorityRaceMetricDetail;
