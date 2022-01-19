/** @jsx jsx */
import { useState } from "react";
import { toast } from "react-toastify";
import { Box, Button, Flex, Heading, jsx, Spinner, Themed, ThemeUIStyleObject } from "theme-ui";

import { IProject, PlanScoreAPIResponse } from "../../../../shared/entities";
import { checkPlanScoreAPI } from "../../../api";
import {
  calculatePVI,
  computeRowFill,
  formatPviByDistrict,
  getPartyColor
} from "../../../functions";
import { DistrictsGeoJSON, EvaluateMetricWithValue, PviBucket } from "../../../types";
import { getPviSteps } from "../../map/index";
import PVIDisplay from "../../PVIDisplay";
import Tooltip from "../../Tooltip";
import CompetitivenessChart from "./CompetitivenessChart";

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
  menuButton: {
    color: "muted"
  }
};

const CompetitivenessMetricDetail = ({
  metric,
  geojson,
  project,
  pviBuckets
}: {
  readonly metric: EvaluateMetricWithValue;
  readonly geojson?: DistrictsGeoJSON;
  readonly project?: IProject;
  readonly pviBuckets?: readonly (PviBucket | undefined)[] | undefined;
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
      checkPlanScoreAPI(project)
        .then((data: PlanScoreAPIResponse) => {
          setPlanScoreLoaded(true);
          setPlanScoreLink(data.plan_url);
        })
        .catch(() => {
          setPlanScoreLoaded(null);
          toast.error("Error uploading map to PlanScore, please try again later");
        });
  }

  return (
    <Box>
      <Heading as="h2" sx={{ variant: "text.h5", mt: 4 }}>
        PVI by District:
        {formatPviByDistrict(pviBuckets)?.map(
          (bucket: string, index: number, array: readonly string[]) => {
            const divider = array.length > index + 1 && "/";
            const bucketColor = bucket.includes("R")
              ? getPartyColor("republican")
              : bucket.includes("D")
              ? getPartyColor("democrat")
              : "#141414";
            return divider ? (
              <span sx={{ color: "#000", mb: "10px" }} key={index}>
                <span sx={{ color: bucketColor, ml: "10px", mb: "10px", mr: "10px" }}>
                  {bucket}
                </span>
                {divider}
              </span>
            ) : (
              <span sx={{ color: bucketColor, ml: "10px", mb: "10px" }} key={index}>
                {bucket}
              </span>
            );
          }
        ) || " N/A"}
      </Heading>
      <CompetitivenessChart pviBuckets={pviBuckets} />
      <Themed.table sx={style.table}>
        <thead>
          <Themed.tr>
            <Themed.th sx={{ ...style.th, ...style.colFirst }}>Number</Themed.th>
            <Themed.th sx={{ ...style.th, ...style.colLast }}>Partisan Voting Index</Themed.th>
          </Themed.tr>
        </thead>
        <tbody>
          {geojson?.features.map(
            (feature, id) =>
              id > 0 && (
                <Themed.tr key={id}>
                  <Themed.td sx={{ ...style.td, ...style.colFirst }}>{id}</Themed.td>
                  <Themed.td sx={{ ...style.td, ...style.colLast }}>
                    {feature.properties.voting && metric.electionYear ? (
                      <Flex sx={{ alignItems: "center" }}>
                        <Themed.div
                          sx={{
                            mr: 2,
                            width: "15px",
                            height: "15px",
                            borderRadius: "small",
                            bg: feature.properties.pvi
                              ? computeRowFill(
                                  choroplethStops,
                                  calculatePVI(feature.properties.voting, metric.electionYear),
                                  true
                                )
                              : undefined
                          }}
                        ></Themed.div>
                        <PVIDisplay properties={feature.properties} year={metric.electionYear} />
                      </Flex>
                    ) : (
                      <Box sx={style.blankValue}>-</Box>
                    )}
                  </Themed.td>
                </Themed.tr>
              )
          )}
        </tbody>
      </Themed.table>
      <Box
        sx={{
          mb: 2,
          position: "absolute",
          right: "30px",
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
                  variant="styles.spinner.small"
                />
              </span>
            )}
          </Button>
        ) : (
          planScoreLink && (
            <Themed.a href={planScoreLink} target="_blank">
              View on PlanScore
            </Themed.a>
          )
        )}
      </Box>
    </Box>
  );
};

export default CompetitivenessMetricDetail;
