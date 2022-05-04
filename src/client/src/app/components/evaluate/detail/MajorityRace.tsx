/** @jsx jsx */
import { connect } from "react-redux";
import { Box, Flex, Heading, jsx, Themed, ThemeUIStyleObject } from "theme-ui";

import { GroupTotal, IStaticMetadata } from "@districtbuilder/shared/entities";

import { getMajorityRaceDisplay, isMajorityMinority } from "../../../functions";
import { State } from "../../../reducers";
import { DistrictsGeoJSON, EvaluateMetricWithValue } from "../../../types";

import DemographicsChart from "../../DemographicsChart";
import DemographicsTooltip from "../../DemographicsTooltip";
import Tooltip from "../../Tooltip";
import { getDemographicsGroups } from "@districtbuilder/shared/functions";

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
  },
  number: {
    textAlign: "right"
  }
};

interface StateProps {
  readonly populationKey: GroupTotal;
}

const MajorityRaceMetricDetail = ({
  metric,
  geojson,
  metadata,
  populationKey
}: {
  readonly metric: EvaluateMetricWithValue;
  readonly metadata?: IStaticMetadata;
  readonly geojson?: DistrictsGeoJSON;
} & StateProps) => {
  const demographicsGroups = metadata ? getDemographicsGroups(metadata) : [];
  return (
    <Box>
      <Heading as="h2" sx={{ variant: "text.h5", mt: 4 }}>
        Your map has {metric.value?.toString() || " "} Majority-Minority districts
      </Heading>
      <Themed.table sx={style.table}>
        <thead>
          <Themed.tr>
            <Themed.th sx={{ ...style.th, ...style.colFirst }}>Number</Themed.th>
            <Themed.th sx={style.th}>Majority Race</Themed.th>
            <Themed.th sx={{ ...style.th, ...style.colLast }}>Demographics</Themed.th>
          </Themed.tr>
        </thead>
        <tbody>
          {metadata &&
            geojson?.features.map(
              (feature, id) =>
                id > 0 && (
                  <Themed.tr key={id}>
                    <Themed.td sx={{ ...style.td, ...style.colFirst }}>{id}</Themed.td>

                    <Themed.td sx={style.td}>
                      {feature.properties.majorityRace !== undefined ? (
                        <Flex sx={{ alignItems: "center" }}>
                          <Themed.div
                            sx={{
                              mr: 2,
                              width: "15px",
                              height: "15px",
                              borderRadius: "small",
                              bg: feature.properties.majorityRaceFill
                            }}
                          ></Themed.div>
                          <Box>{getMajorityRaceDisplay(feature)}</Box>
                        </Flex>
                      ) : (
                        <Box sx={style.blankValue}>-</Box>
                      )}
                    </Themed.td>

                    <Themed.td sx={{ ...style.td, ...style.colLast }}>
                      <Tooltip
                        placement="top-start"
                        content={
                          feature.properties.demographics.population !== 0 ? (
                            <DemographicsTooltip
                              demographics={feature.properties.demographics}
                              isMajorityMinority={isMajorityMinority(feature)}
                              demographicsGroups={demographicsGroups}
                              populationKey={populationKey}
                            />
                          ) : (
                            <em>
                              <strong>Empty district.</strong> Add people to this district to view
                              the race chart
                            </em>
                          )
                        }
                      >
                        <span sx={{ display: "inline-block" }}>
                          <span sx={style.chart}>
                            <DemographicsChart
                              demographics={feature.properties.demographics}
                              demographicsGroups={demographicsGroups}
                              populationKey={populationKey}
                            />
                          </span>
                        </span>
                      </Tooltip>
                    </Themed.td>
                  </Themed.tr>
                )
            )}
        </tbody>
      </Themed.table>
    </Box>
  );
};

function mapStateToProps(state: State): StateProps {
  return {
    populationKey: state.projectOptions.populationKey
  };
}

export default connect(mapStateToProps)(MajorityRaceMetricDetail);
