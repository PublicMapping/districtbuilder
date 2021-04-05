/** @jsx jsx */
import { jsx, ThemeUIStyleObject, Container, Box } from "theme-ui";

import {
  EvaluateMetric,
  EvaluateMetricWithValue,
  IProject,
  IStaticMetadata,
  RegionLookupProperties
} from "../../../shared/entities";
import store from "../../store";
import { regionPropertiesFetch } from "../../actions/regionConfig";
import { DistrictsGeoJSON } from "../../types";
import ProjectEvaluateMetricDetail from "./ProjectEvaluateMetricDetail";
import ProjectEvaluateSummary from "./ProjectEvaluateSummary";
import { useState, useEffect } from "react";
import { Resource } from "../../resource";
import { geoLevelLabelSingular } from "../../functions";

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
  project,
  regionProperties,
  staticMetadata
}: {
  readonly geojson?: DistrictsGeoJSON;
  readonly metric: EvaluateMetric | undefined;
  readonly project?: IProject;
  readonly regionProperties: Resource<readonly RegionLookupProperties[]>;
  readonly staticMetadata?: IStaticMetadata;
}) => {
  const [avgCompactness, setAvgCompactness] = useState<number | undefined>(undefined);
  const [geoLevel, setGeoLevel] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (geojson && !avgCompactness) {
      const totalCompactness = geojson.features.reduce(function(accumulator, feature) {
        return accumulator + feature.properties.compactness;
      }, 0);
      setAvgCompactness(totalCompactness / (geojson.features.length - 1));
    }
  }, [geojson, avgCompactness]);

  useEffect(() => {
    if (staticMetadata) {
      setGeoLevel(staticMetadata.geoLevelHierarchy[staticMetadata.geoLevelHierarchy.length - 1].id);
    }
  }, [staticMetadata]);

  useEffect(() => {
    if (project && project.regionConfig.regionCode && geoLevel) {
      store.dispatch(
        regionPropertiesFetch({ regionConfigId: project.regionConfig.id, geoLevel: geoLevel })
      );
    }
  }, [project, geoLevel]);

  const requiredMetrics: readonly EvaluateMetricWithValue[] = [
    {
      key: "equalPopulation",
      name: "Equal Population",
      status: false,
      description: "have equal population",
      shortText: "Lorem ipsum",
      longText: "Lorem ipsum",
      type: "fraction",
      value: 17
    },
    {
      key: "contiguity",
      name: "Contiguity",
      status:
        geojson?.features.filter(f => f.properties.contiguity === "non-contiguous").length === 0,
      description: "are contiguous",
      longText:
        "A district must be in a single, unbroken shape. Two areas touching at the corners are typically not considered contiguous. An exception would be the inclusion of islands in a coastal district.",
      shortText:
        "All parts of a district must be in physical contact with some other part of the district",
      type: "fraction",
      total: geojson?.features.filter(f => f.id !== 0).length || 0,
      value: geojson?.features.filter(f => f.properties.contiguity === "contiguous").length || 0
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
      longText:
        "A district that is more spread out has a lower compactness. Low compactness can be an indicators of gerrymandering when lorem ipsum lorem ipsum. Above XX% is considered good. Calculated using the Polsby-Popper method.",
      shortText:
        "A district that is more spread out has a lower compactness. Low compactness can be an indicators of gerrymandering",
      description: "are compact",
      value: avgCompactness
    },
    {
      key: "minorityMajority",
      name: "Minority-Majority",
      type: "fraction",
      description: "are minority-majority",
      shortText:
        "A district in which the majority of the constituents are racial or ethnic minorities",
      longText:
        "A district in which the majority of the constituents are racial or ethnic minorities",
      value: 1
    },
    {
      key: "countySplits",
      name: `${geoLevel ? geoLevelLabelSingular(geoLevel) : ""} splits`,
      type: "count",
      description: "are split",
      shortText: "Lorem ipsum",
      longText: "Lorem ipsum",
      value: project?.districtsDefinition.filter(x => Array.isArray(x)).length || 0,
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
      ) : geoLevel && regionProperties ? (
        <ProjectEvaluateMetricDetail
          geojson={geojson}
          metric={metric}
          project={project}
          geoLevel={geoLevel}
          regionProperties={regionProperties}
          staticMetadata={staticMetadata}
        />
      ) : (
        <Box>Loading...</Box>
      )}
    </Container>
  );
};

export default ProjectEvaluateSidebar;
