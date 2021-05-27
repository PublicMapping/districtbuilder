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
  const popThreshold = project && project.populationDeviation / 100.0;
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
      status:
        (avgPopulation &&
          geojson &&
          popThreshold !== undefined &&
          geojson?.features.filter(f => {
            return (
              f.id !== 0 &&
              f.properties.percentDeviation &&
              Math.abs(f.properties.percentDeviation) <= popThreshold
            );
          }).length ===
            geojson?.features.length - 1) ||
        false,
      description: "have equal population",
      shortText:
        "The U.S. constitution requires that each district have about the same population for a map to be considered valid.",
      longText:
        (popThreshold !== undefined &&
          `Districts are required to be "Equal Population" for a map to be considered valid. Districts are "Equal Population" when their population falls within the target threshold. The target population is the total population divided by the number of districts and the threshold is a set percentage deviation (${Math.floor(
            popThreshold * 100
          )}%) above or below that target.`) ||
        "",
      avgPopulation: avgPopulation || undefined,
      popThreshold: popThreshold,
      type: "fraction",
      total: geojson?.features.filter(f => f.id !== 0).length || 0,
      value:
        avgPopulation && geojson && popThreshold !== undefined
          ? geojson?.features.filter(f => {
              return (
                f.id !== 0 &&
                f.properties.percentDeviation &&
                Math.abs(f.properties.percentDeviation) <= popThreshold
              );
            }).length
          : 0
    },
    {
      key: "contiguity",
      name: "Contiguity",
      status:
        geojson?.features.filter(f => f.properties.contiguity === "non-contiguous" && f.id !== 0)
          .length === 0,
      description: "are contiguous",
      longText:
        "Each district should be contiguous, meaning it must be a single, unbroken shape. Some exceptions are allowed, such as the inclusion of islands in a coastal district. Two areas connected only by a single point (touching just their corners) are not considered contiguous.",
      shortText:
        "All parts of a district must be in physical contact with some other part of the district, to the extent possible.",
      type: "fraction",
      total: geojson?.features.filter(f => f.id !== 0).length || 0,
      value:
        geojson?.features.filter(f => f.properties.contiguity === "contiguous" && f.id !== 0)
          .length || 0
    }
  ];
  const optionalMetrics: readonly EvaluateMetric[] = [
    // TODO: Add competitiveness display (??)
    // {
    //   key: "competitiveness",
    //   name: "Competitiveness",
    //   description: "are competitive"
    // },
    {
      key: "compactness",
      name: "Compactness",
      type: "percent",
      longText:
        "A district that efficiently groups constituents together has higher compactness. Low compactness or districts that branch out to different areas can be indicators of gerrymandering. Compactness is calculated using the Polsby-Popper method. Higher numbers are better.",
      shortText:
        "A district that is more spread out has a lower compactness. Low compactness can be an indicator of gerrymandering.",
      description: "are compact",
      value: avgCompactness
    },
    // TODO: Minority-Majority updates (#750)
    // {
    //   key: "minorityMajority",
    //   name: "Minority-Majority",
    //   type: "fraction",
    //   description: "are minority-majority",
    //   shortText:
    //     "A district in which the majority of the constituents are racial or ethnic minorities",
    //   longText:
    //     "A district in which the majority of the constituents are racial or ethnic minorities",
    //   value: 1
    // },
    {
      key: "countySplits",
      name: `${geoLevel ? geoLevelLabelSingular(geoLevel) : ""} splits`,
      type: "count",
      description: "are split",
      shortText:
        "County splits occur when a county is split between two or more districts. Some states require minimizing county splits, to the extent practicable.",
      longText:
        "County splits occur when a county is split between two or more districts. Some states require minimizing county splits, to the extent practicable.",
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
