/** @jsx jsx */
import { Box, IconButton, Flex, jsx, ThemeUIStyleObject, Heading, Text } from "theme-ui";

import Icon from "../Icon";
import store from "../../store";
import { EvaluateMetric, EvaluateMetricWithValue } from "../../types";
import { formatPvi } from "../../functions";
import { selectEvaluationMetric, toggleEvaluate } from "../../actions/districtDrawing";

const style: ThemeUIStyleObject = {
  header: {
    variant: "header.app",
    borderBottom: "1px solid",
    borderColor: "gray.2",
    paddingBottom: "20px",
    flexDirection: "column",
    m: "0"
  },
  evaluateMetricsList: {
    p: 2,
    flex: 1,
    flexDirection: "column"
  },
  metricRow: {
    p: 3,
    bg: "muted",
    border: "1px solid",
    borderColor: "gray.2",
    borderRadius: "small",
    width: "100%",
    mb: "10px",
    "&:hover": {
      cursor: "pointer",
      boxShadow: "small"
    },
    "&:focus": {
      boxShadow: "focus",
      outline: "none"
    },
    flexDirection: "row"
  },
  metricValue: {
    variant: "header.right",
    textAlign: "right"
  },
  metricTitle: {
    fontWeight: "500"
  },
  metricText: {
    fontSize: 1,
    color: "gray.7",
    mt: 1
  }
};

const ProjectEvaluateView = ({
  requiredMetrics,
  optionalMetrics
}: {
  // Still working out what the type should be here
  readonly requiredMetrics: readonly EvaluateMetric[];
  readonly optionalMetrics: readonly EvaluateMetric[];
}) => {
  function formatMetricValue(metric: EvaluateMetricWithValue): string {
    switch (metric.type) {
      case "fraction":
        return `${metric.value} / ${metric.total || 18}`;
      case "pvi":
        return formatPvi(metric.party, metric.value);
      case "percent":
        return metric.value !== undefined ? `${Math.floor(metric.value * 100)}%` : "";
      case "count":
        return `${metric.value}`;
      default:
        return "";
    }
  }
  return (
    <Flex sx={{ variant: "sidebar.gray", maxWidth: "507px" }}>
      <Flex sx={style.header} className="evaluate-header">
        <Flex sx={{ variant: "header.left", justifyContent: "space-between" }}>
          <Heading as="h2" sx={{ variant: "text.h4", m: "0" }}>
            Evaluate
          </Heading>
          <Box>
            <IconButton variant="icon" onClick={() => store.dispatch(toggleEvaluate(false))}>
              <Icon name={"times"} />
            </IconButton>
          </Box>
        </Flex>
      </Flex>
      <Box sx={{ overflowY: "auto", flex: 1 }}>
        <Box sx={style.evaluateMetricsList}>
          <Heading as="h3" sx={{ variant: "text.h5", mt: 2 }}>
            Required
          </Heading>
          {requiredMetrics.map(metric => (
            <Box
              as="article"
              sx={style.metricRow}
              onClick={() => store.dispatch(selectEvaluationMetric(metric))}
              key={metric.key}
              tabIndex={0}
            >
              <Flex>
                <Flex sx={{ alignItems: "center" }}>
                  {"status" in metric ? (
                    metric.status ? (
                      <Box sx={{ lineHeight: "body", mr: 2 }}>
                        <Icon name={"check-circle-solid"} color="success.3" />
                      </Box>
                    ) : (
                      <Box sx={{ lineHeight: "body", mr: 2 }}>
                        <Icon name={"times-circle-solid"} color="error" />
                      </Box>
                    )
                  ) : (
                    <Box></Box>
                  )}
                  <Heading as="h4" sx={{ ...style.metricTitle, mb: 0 }}>
                    {metric.name}
                  </Heading>
                </Flex>
                <Box sx={style.metricValue}>
                  {"type" in metric ? formatMetricValue(metric) : ""}
                </Box>
              </Flex>
              <Text as="p" sx={style.metricText}>
                {metric.shortText}
              </Text>
            </Box>
          ))}
        </Box>
        <Box sx={style.evaluateMetricsList}>
          <Heading as="h3" sx={{ variant: "text.h5", mt: 2 }}>
            Optional
          </Heading>
          {optionalMetrics.map(metric => (
            <Flex key={metric.key}>
              <Box
                as="article"
                sx={style.metricRow}
                onClick={() => store.dispatch(selectEvaluationMetric(metric))}
                tabIndex={0}
              >
                <Flex>
                  <Heading as="h4" sx={{ ...style.metricTitle, textTransform: "capitalize" }}>
                    {metric.name}
                  </Heading>
                  <Box sx={style.metricValue}>
                    {"type" in metric ? formatMetricValue(metric) : ""}
                  </Box>
                </Flex>
                <Text sx={style.metricText}>{metric.shortText || "Lorem ipsum lorem ipsum"}</Text>
              </Box>
            </Flex>
          ))}
        </Box>
      </Box>
    </Flex>
  );
};

export default ProjectEvaluateView;
