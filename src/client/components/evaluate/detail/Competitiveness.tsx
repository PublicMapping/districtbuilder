/** @jsx jsx */
import { Box, Flex, jsx, Styled, ThemeUIStyleObject, Heading, Button, Spinner } from "theme-ui";
import { getPviSteps } from "../../map/index";
import { useState } from "react";
import { DistrictsGeoJSON, EvaluateMetricWithValue } from "../../../types";
import PVIDisplay from "../../PVIDisplay";
import { formatPvi, computeRowFill, calculatePVI } from "../../../functions";
import { checkPlanScoreAPI } from "../../../api";
import { IProject, PlanScoreAPIResponse } from "../../../../shared/entities";
import CompetitivenessChart from "./CompetitivenessChart";
import Tooltip from "../../Tooltip";

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
  menuButton: {
    color: "muted"
  }
};

const CompetitivenessMetricDetail = ({
  metric,
  geojson,
  project
}: {
  readonly metric: EvaluateMetricWithValue;
  readonly geojson?: DistrictsGeoJSON;
  readonly project?: IProject;
}) => {
  const [planScoreLoaded, setPlanScoreLoaded] = useState<boolean | null>(null);
  const [planScoreLink, setPlanScoreLink] = useState<string | null>(null);
  const choroplethStops = getPviSteps();
  const projectIsNotEmpty =
    geojson &&
    geojson.features.slice(1).some(feature => feature.properties.demographics.population !== 0);
  function sendToPlanScore() {
    setPlanScoreLoaded(false);
    project &&
      checkPlanScoreAPI(project).then((data: PlanScoreAPIResponse) => {
        setPlanScoreLoaded(true);
        setPlanScoreLink(data.plan_url);
      });
  }
  return (
    <Box>
      <Heading as="h2" sx={{ variant: "text.h5", mt: 4 }}>
        Partisan Voting Index (PVI):
        <span sx={{ color: metric.party?.color || "#000", ml: "10px", mb: "10px" }}>
          {formatPvi(metric.party, metric.value)}
        </span>
      </Heading>
      <CompetitivenessChart geojson={geojson} metric={metric} />
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
      <Box
        sx={{
          mb: 2,
          position: "fixed",
          bottom: "0"
        }}
      >
        {planScoreLoaded === null || planScoreLoaded === false ? (
          <Button
            sx={{
              ...{
                variant: "buttons.primary",
                fontWeight: "light",
                maxHeight: "34px",
                borderBottom: "none",
                borderBottomColor: "blue.2"
              },
              ...style.menuButton
            }}
            disabled={planScoreLoaded === false || !projectIsNotEmpty}
            onClick={() => sendToPlanScore()}
          >
            {planScoreLoaded === null ? (
              projectIsNotEmpty ? (
                <span>Send to PlanScore API</span>
              ) : (
                <Tooltip content={"Complete your project before sending to PlanScore"}>
                  <span>Send to PlanScore API</span>
                </Tooltip>
              )
            ) : (
              <span>
                Loading&nbsp;
                <Spinner
                  sx={{
                    position: "relative",
                    top: "3px",
                    width: "18px",
                    height: "18px",
                    color: "white"
                  }}
                  variant="spinner.small"
                />
              </span>
            )}
          </Button>
        ) : (
          planScoreLink && (
            <Styled.a href={planScoreLink} target="_blank">
              View on PlanScore
            </Styled.a>
          )
        )}
      </Box>
    </Box>
  );
};

export default CompetitivenessMetricDetail;
