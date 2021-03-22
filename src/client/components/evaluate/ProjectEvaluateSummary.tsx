/** @jsx jsx */
import { Box, Button, Flex, jsx, ThemeUIStyleObject, Heading } from "theme-ui";

import { EvaluateMetric } from "../../../shared/entities";
import Icon from "../Icon";
import store from "../../store";
import { selectEvaluationMetric, toggleEvaluate } from "../../actions/districtDrawing";

const style: ThemeUIStyleObject = {
  sidebar: {
    bg: "muted",
    boxShadow: "0 0 0 1px rgba(16,22,26,.1), 0 0 0 rgba(16,22,26,0), 0 1px 1px rgba(16,22,26,.2)",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    height: "100%",
    minWidth: "430px",
    maxWidth: "35%",
    position: "relative",
    ml: "0",
    color: "gray.8",
    zIndex: 200
  },
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

const ProjectEvaluateView = ({
  projectMetricValues,
  requiredMetrics,
  optionalMetrics
}: {
  // Still working out what the type should be here
  // eslint-ignore
  readonly projectMetricValues: any;
  readonly requiredMetrics: readonly EvaluateMetric[];
  readonly optionalMetrics: readonly EvaluateMetric[];
}) => {
  function formatMetricValue(metric: EvaluateMetric, value?: any): string {
    if (!value) {
      switch (metric.type) {
        case "fraction":
          return `${metric.value} / 18`;
        case "percent":
          return `${metric.value}%`;
        case "count":
          return `${metric.value}`;
        default:
          return "";
      }
    } else {
      switch (metric.type) {
        case "fraction":
          return `${value.value} / ${value.total}`;
        case "percent":
          return `${metric.value}%`;
        case "count":
          return `${value.value}`;
        default:
          return "";
      }
    }
  }
  return (
    <Flex sx={{ flexDirection: "column", height: "100vh" }}>
      <Flex sx={style.header} className="evaluate-header">
        <Flex sx={{ variant: "header.left" }}>
          <Flex>
            <Heading as="h2" sx={{ variant: "text.h4" }}>
              Evaluate
            </Heading>
          </Flex>
          <Flex sx={style.closeBtn}>
            <Button onClick={() => store.dispatch(toggleEvaluate(false))}>X</Button>
          </Flex>
        </Flex>
      </Flex>
      <Flex sx={style.evaluateMetricsList}>
        <Heading as="h4" sx={{ variant: "text.h4", ml: "15px" }}>
          Required
        </Heading>
        {requiredMetrics.map(metric => (
          <Box
            sx={style.metricRow}
            onClick={() => store.dispatch(selectEvaluationMetric(metric))}
            key={metric.name}
          >
            <Flex sx={style.metricRow}>
              <Box sx={{ mr: "50px" }}>
                {metric.status ? <Icon name={"check"} /> : <Icon name={"question-circle"} />}
              </Box>
              <Box>{metric.name}</Box>
              <Box sx={style.metricValue}>
                {projectMetricValues[metric.name]
                  ? formatMetricValue(metric, projectMetricValues[metric.key])
                  : formatMetricValue(metric)}
              </Box>
            </Flex>
            <Flex sx={style.metricText}>Lorem ipsum dolor</Flex>
          </Box>
        ))}
      </Flex>
      <Flex sx={style.evaluateMetricsList}>
        <Heading as="h4" sx={{ variant: "text.h4", ml: "15px" }}>
          Optional
        </Heading>
        {optionalMetrics.map(metric => (
          <Flex key={metric.name}>
            <Box
              sx={style.metricRow}
              onClick={() => store.dispatch(selectEvaluationMetric(metric))}
            >
              <Flex sx={style.metricRow}>
                <Box sx={{ ml: "50px" }}>{metric.name}</Box>
                <Box sx={style.metricValue}>
                  {projectMetricValues[metric.key]
                    ? formatMetricValue(metric, projectMetricValues[metric.key])
                    : formatMetricValue(metric)}
                </Box>
              </Flex>
              <Flex sx={style.metricText}>Lorem ipsum dolor</Flex>
            </Box>
          </Flex>
        ))}
      </Flex>
    </Flex>
  );
};

export default ProjectEvaluateView;
