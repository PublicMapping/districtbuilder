/** @jsx jsx */
import { Box, Button, Flex, jsx, ThemeUIStyleObject, Heading } from "theme-ui";

import { EvaluateMetric } from "../../shared/entities";
import Icon from "./Icon";
import { DistrictsGeoJSON } from "../types";
import store from "../store";
import { selectEvaluationMetric } from "../actions/districtDrawing";

const style: ThemeUIStyleObject = {
  td: {
    fontWeight: "body",
    color: "gray.8",
    fontSize: 1,
    p: 2,
    textAlign: "left",
    verticalAlign: "bottom"
  },
  header: {
    variant: "header.app",
    borderBottom: "1px solid",
    borderColor: "gray.2",
    paddingBottom: "20px",
    flexDirection: "column",
    m: "0"
  },
  closeBtn: {
    position: "absolute",
    right: "20px"
  },
  metricRow: {
    p: 1,
    width: "100%",
    mb: "10px",
    "&:hover": {
      cursor: "pointer"
    },
    flexDirection: "row"
  },
  evaluateMetricsList: {
    overflowY: "auto",
    flex: 1,
    flexDirection: "column",
    mt: "50px"
  },
  metricValue: {
    variant: "header.right",
    position: "relative",
    mr: "20px",
    textAlign: "right"
  },
  metricText: {
    fontSize: "10",
    ml: "50px",
    minHeight: "50px"
  }
};

const ProjectEvaluateMetricDetail = ({
  geojson,
  metric
}: {
  readonly geojson?: DistrictsGeoJSON;
  readonly metric: EvaluateMetric;
}) => {
  return (
    <Flex sx={{ flexDirection: "column", height: "100vh" }}>
      <Flex sx={style.header} className="evaluate-metric-header">
        <Box sx={{ display: "block" }}>
          <Button onClick={() => store.dispatch(selectEvaluationMetric(undefined))}>
            <Icon name="chevron-left" /> Back to summary
          </Button>
        </Box>
      </Flex>
      <Box sx={{ display: "block", m: "20px", borderBottom: "1px solid gray" }}>
        <Heading as="h2" sx={{ variant: "text.h4", m: "0" }}>
          <Icon name={"check"} /> {metric.name}
        </Heading>
        <Flex sx={{ minHeight: "100px" }} className="metric-description">
          Lorem ipsum lorem ipsum
        </Flex>
      </Box>
      <Box sx={{ ml: "20px" }}>
        <Heading as="h4" sx={{ variant: "text.h4", display: "block" }}>
          7 / 10 districts {metric.description}
        </Heading>
        <Flex sx={{ flexDirection: "column" }}>
          {geojson?.features.map(
            d =>
              d.properties.contiguity !== "" && (
                <Box sx={{ display: "block" }} key={d.id}>
                  {d.id}
                </Box>
              )
          )}
        </Flex>
      </Box>
    </Flex>
  );
};

export default ProjectEvaluateMetricDetail;
