/** @jsx jsx */
import { jsx, ThemeUIStyleObject, Container } from "theme-ui";

import { EvaluateMetric, IProject } from "../../../shared/entities";
import { DistrictsGeoJSON } from "../../types";
import ProjectEvaluateMetricDetail from "./ProjectEvaluateMetricDetail";
import ProjectEvaluateSummary from "./ProjectEvaluateSummary";

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

const ProjectEvaluateSidebar = ({
  geojson,
  metric,
  project
}: {
  readonly geojson?: DistrictsGeoJSON;
  readonly metric: EvaluateMetric | undefined;
  readonly project?: IProject;
}) => {
  const requiredMetrics: readonly EvaluateMetric[] = [
    {
      key: "equalPopulation",
      name: "Equal Population",
      status: false,
      description: "have equal population",
      type: "fraction",
      value: 17
    },
    {
      key: "contiguity",
      name: "Contiguity",
      status: true,
      description: "are contiguous",
      type: "fraction",
      value: 18
    }
  ];
  const optionalMetrics: readonly EvaluateMetric[] = [
    {
      key: "competitiveness",
      name: "Competitiveness",
      description: "are competitive"
    },
    {
      key: "compactness",
      name: "Compactness",
      type: "percent",
      description: "are compact",
      value: 56.2
    },
    {
      key: "minorityMajority",
      name: "Minority-Majority",
      type: "fraction",
      description: "are minority-majority",
      value: 1
    },
    {
      key: "countySplits",
      name: "County splits",
      type: "count",
      description: "are split",
      value: project?.districtsDefinition.filter(x => Array.isArray(x)).length,
      total: project ? project.districtsDefinition.length : 0,
      splitCounties: project?.districtsDefinition.map(c => {
        if (Array.isArray(c)) {
          return c;
        } else {
          return undefined;
        }
      })
    }
  ];
  return (
    <Container sx={style.sidebar} className="evaluate-sidebar">
      {!metric ? (
        <ProjectEvaluateSummary
          requiredMetrics={requiredMetrics}
          optionalMetrics={optionalMetrics}
        />
      ) : (
        <ProjectEvaluateMetricDetail geojson={geojson} metric={metric} />
      )}
    </Container>
  );
};

export default ProjectEvaluateSidebar;
