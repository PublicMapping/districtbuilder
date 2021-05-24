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
import { geoLevelLabelSingular, getTargetPopulation } from "../../functions";

const style: ThemeUIStyleObject = {
  sidebar: {
    flexDirection: "column",
    flexShrink: 0,
    height: "100%",
    minWidth: "430px",
    maxWidth: "507px",
    position: "relative",
    zIndex: 200
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
  const [avgPopulation, setAvgPopulation] = useState<number | undefined>(undefined);
  const [geoLevel, setGeoLevel] = useState<string | undefined>(undefined);
  const popThreshold = 0.05;
  useEffect(() => {
    if (geojson && !avgCompactness) {
      const features = geojson.features.slice(1).filter(f => f.properties.compactness !== 0);
      const totalCompactness = features.reduce(function(accumulator, feature) {
        return accumulator + feature.properties.compactness;
      }, 0);
      setAvgCompactness(features.length !== 0 ? totalCompactness / features.length : undefined);
    }
  }, [geojson, avgCompactness]);

  useEffect(() => {
    if (geojson && !avgPopulation && project) {
      getTargetPopulation(geojson, project);
      setAvgPopulation(getTargetPopulation(geojson, project));
    }
  }, [geojson, avgPopulation, project]);

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
      longText: `This map has a goal of getting within ${Math.floor(
        popThreshold * 100
      )}% of ${avgPopulation?.toLocaleString()}`,
      avgPopulation: avgPopulation || undefined,
      popThreshold: popThreshold,
      type: "fraction",
      total: geojson?.features.filter(f => f.id !== 0).length || 0,
      value:
        avgPopulation && geojson
          ? geojson?.features.filter(f => {
              return (
                f.id !== 0 &&
                // @ts-ignore
                f.properties.percentDeviation &&
                // @ts-ignore
                Math.abs(f.properties.percentDeviation) <= popThreshold
              );
            }).length
          : 0
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
      value:
        geojson?.features.filter(f => f.properties.contiguity === "contiguous" && f.id !== 0)
          .length || 0
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
