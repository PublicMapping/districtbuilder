/** @jsx jsx */
import { Box, Button, Flex, jsx, ThemeUIStyleObject, Heading } from "theme-ui";
import {
  EvaluateMetric,
  IProject,
  IStaticMetadata,
  RegionLookupProperties
} from "../../../shared/entities";
import Icon from "../Icon";
import { DistrictsGeoJSON } from "../../types";
import store from "../../store";
import { selectEvaluationMetric } from "../../actions/districtDrawing";
import ContiguityMetricDetail from "./detail/Contiguity";
import CompactnessMetricDetail from "./detail/Compactness";
import CountySplitMetricDetail from "./detail/CountySplit";
import EqualPopulationMetricDetail from "./detail/EqualPopulation";
import { Resource } from "../../resource";

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
    minHeight: "100px",
    fontWeight: "400"
  },
  metricDescription: {
    fontWeight: "500",
    color: "gray.8",
    minHeight: "200px"
  }
};

const ProjectEvaluateMetricDetail = ({
  geojson,
  metric,
  project,
  regionProperties,
  geoLevel,
  staticMetadata
}: {
  readonly geojson?: DistrictsGeoJSON;
  readonly metric: EvaluateMetric;
  readonly project?: IProject;
  readonly regionProperties: Resource<readonly RegionLookupProperties[]>;
  readonly geoLevel: string;
  readonly staticMetadata?: IStaticMetadata;
}) => {
  return (
    <Box>
      <Flex sx={{ flexDirection: "column", height: "100vh" }}>
        <Flex sx={style.header} className="evaluate-metric-header">
          <Box sx={{ display: "block" }}>
            <Button onClick={() => store.dispatch(selectEvaluationMetric(undefined))}>
              <Icon name="chevron-left" /> Back to summary
            </Button>
          </Box>
        </Flex>
        <Box sx={{ display: "block", m: "20px", borderBottom: "1px solid gray" }}>
          <Heading as="h2" sx={{ variant: "text.h4", m: "0", textTransform: "capitalize" }}>
            <Icon name={"check"} /> {metric.name}
          </Heading>
          <Flex sx={style.metricDescription}>{metric.longText || "Lorem ipsum lorem ipsum"} </Flex>
        </Box>
        {metric && "type" in metric && metric.key === "countySplits" ? (
          <CountySplitMetricDetail
            project={project}
            metric={metric}
            geoLevel={geoLevel}
            regionProperties={regionProperties}
            staticMetadata={staticMetadata}
          />
        ) : metric && "type" in metric && metric.key === "compactness" ? (
          <CompactnessMetricDetail metric={metric} geojson={geojson} />
        ) : metric && "type" in metric && metric.key === "contiguity" ? (
          <ContiguityMetricDetail metric={metric} geojson={geojson} />
        ) : metric && "type" in metric && metric.key === "equalPopulation" ? (
          <EqualPopulationMetricDetail metric={metric} geojson={geojson} />
        ) : (
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
        )}
      </Flex>
    </Box>
  );
};

export default ProjectEvaluateMetricDetail;
