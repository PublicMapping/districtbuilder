/** @jsx jsx */
import { Box, Button, Flex, jsx, ThemeUIStyleObject, Heading, Text, Select } from "theme-ui";
import { IProject, IStaticMetadata, RegionLookupProperties } from "../../../shared/entities";
import Icon from "../Icon";
import { DistrictsGeoJSON, EvaluateMetric, ElectionYear } from "../../types";
import store from "../../store";
import { selectEvaluationMetric } from "../../actions/districtDrawing";
import ContiguityMetricDetail from "./detail/Contiguity";
import CompactnessMetricDetail from "./detail/Compactness";
import CountySplitMetricDetail from "./detail/CountySplit";
import EqualPopulationMetricDetail from "./detail/EqualPopulation";
import { Resource } from "../../resource";
import CompetitivenessMetricDetail from "./detail/Competitiveness";
import MajorityRaceMetricDetail from "./detail/MajorityRace";

const style: ThemeUIStyleObject = {
  header: {
    variant: "header.app",
    flexDirection: "column",
    justifyContent: "center",
    bg: "muted",
    py: 0,
    px: 3
  },
  metricText: {
    fontSize: 2,
    color: "gray.6",
    mt: 1
  }
};

const ProjectEvaluateMetricDetail = ({
  geojson,
  metric,
  project,
  regionProperties,
  geoLevel,
  electionYear,
  setElectionYear,
  staticMetadata
}: {
  readonly geojson?: DistrictsGeoJSON;
  readonly metric: EvaluateMetric;
  readonly project?: IProject;
  readonly regionProperties: Resource<readonly RegionLookupProperties[]>;
  readonly geoLevel: string;
  readonly electionYear: ElectionYear | undefined;
  readonly setElectionYear: (year: ElectionYear) => void;
  readonly staticMetadata?: IStaticMetadata;
}) => {
  return (
    <Flex sx={{ variant: "sidebar.white" }}>
      <Flex sx={style.header} className="evaluate-metric-header">
        <Box sx={{ display: "block" }}>
          <Button
            variant="linkStyle"
            onClick={() => store.dispatch(selectEvaluationMetric(undefined))}
          >
            <Icon name="long-arrow-left" /> Back to summary
          </Button>
        </Box>
      </Flex>
      <Flex
        sx={{
          display: "block",
          bg: "muted",
          pt: 2,
          pb: 3,
          px: 3,
          borderBottom: "1px solid",
          borderColor: "gray.2"
        }}
      >
        <Flex sx={{ alignItems: "center", mb: 2 }}>
          {"status" in metric ? (
            metric.status ? (
              <Box sx={{ lineHeight: "heading", mr: 2 }}>
                <Icon name={"check-circle-solid"} color="success.3" />
              </Box>
            ) : (
              <Box sx={{ lineHeight: "heading", mr: 2 }}>
                <Icon name={"times-circle-solid"} color="error" />
              </Box>
            )
          ) : (
            <Box></Box>
          )}
          <Heading as="h1" sx={{ variant: "text.h4", m: 0, textTransform: "capitalize" }}>
            {metric.name}
          </Heading>
          {"hasMultipleElections" in metric && metric.hasMultipleElections && (
            <Box>
              <Select
                id="election-dropdown"
                value={electionYear || undefined}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  const year = e.currentTarget.value;
                  (year === "16" || year === "20" || year === "combined") && setElectionYear(year);
                }}
                sx={{ width: "250px", ml: "20px" }}
              >
                <option value={"combined"}>Combined 2016 / 2020 PVI</option>
                <option value={"16"}>2016 PVI</option>
                <option value={"20"}>2020 PVI</option>
              </Select>
            </Box>
          )}
        </Flex>
        <Text sx={style.metricText}>{metric.longText || "Lorem ipsum lorem ipsum"}</Text>
      </Flex>
      <Box sx={{ px: 3, overflowY: "auto" }}>
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
        ) : metric && "type" in metric && metric.key === "competitiveness" ? (
          <CompetitivenessMetricDetail metric={metric} geojson={geojson} />
        ) : metric && "type" in metric && metric.key === "majorityMinority" ? (
          <MajorityRaceMetricDetail metric={metric} geojson={geojson} />
        ) : (
          <Box>
            <Heading as="h2" sx={{ variant: "text.h5", mt: 4 }}>
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
      </Box>
    </Flex>
  );
};

export default ProjectEvaluateMetricDetail;
