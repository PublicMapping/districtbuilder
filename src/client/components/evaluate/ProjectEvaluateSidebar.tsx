/** @jsx jsx */
import { jsx, ThemeUIStyleObject, Container, Box } from "theme-ui";

import { IProject, IStaticMetadata, RegionLookupProperties } from "../../../shared/entities";
import { DistrictsGeoJSON, EvaluateMetricWithValue, ElectionYear, PviBucket } from "../../types";
import store from "../../store";
import {
  hasMultipleElections,
  isMajorityMinority,
  getPopulationPerRepresentative
} from "../../functions";
import { regionPropertiesFetch } from "../../actions/regionConfig";
import ProjectEvaluateMetricDetail from "./ProjectEvaluateMetricDetail";
import ProjectEvaluateSummary from "./ProjectEvaluateSummary";
import { useState, useEffect } from "react";
import { Resource } from "../../resource";
import { selectEvaluationMetric } from "../../actions/districtDrawing";

import { geoLevelLabelSingular, calculatePVI } from "../../functions";
import { getPviBuckets, getPviSteps } from "../map";

const style: Record<string, ThemeUIStyleObject> = {
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
  readonly metric: EvaluateMetricWithValue | undefined;
  readonly project?: IProject;
  readonly regionProperties: Resource<readonly RegionLookupProperties[]>;
  readonly staticMetadata?: IStaticMetadata;
}) => {
  const [electionYear, setEvaluateElectionYear] = useState<ElectionYear>("combined");
  const popThreshold = project && project.populationDeviation;

  const featuresWithCompactness = geojson?.features
    .slice(1)
    .filter(f => f.properties.compactness !== 0);
  const totalCompactness = featuresWithCompactness?.reduce(function (accumulator, feature) {
    return accumulator + feature.properties.compactness;
  }, 0);
  const avgCompactness =
    totalCompactness !== undefined &&
    featuresWithCompactness &&
    featuresWithCompactness.length !== 0
      ? totalCompactness / featuresWithCompactness.length
      : undefined;

  const geoLevel =
    staticMetadata?.geoLevelHierarchy[staticMetadata.geoLevelHierarchy.length - 1].id;

  useEffect(() => {
    if (project && project.regionConfig.regionCode && geoLevel) {
      store.dispatch(
        regionPropertiesFetch({ regionConfigId: project.regionConfig.id, geoLevel: geoLevel })
      );
    }
  }, [project, geoLevel]);

  const numEqualPopDistricts =
    geojson &&
    popThreshold !== undefined &&
    geojson?.features.filter(f => {
      return (
        f.id !== 0 &&
        f.properties.percentDeviation !== undefined &&
        f.properties.populationDeviation !== undefined &&
        (Math.abs(f.properties.percentDeviation) <= popThreshold / 100.0 ||
          Math.abs(f.properties.populationDeviation) < 1)
      );
    }).length;
  const numDistrictsWithGeometries =
    geojson && geojson.features.filter(f => f.id !== 0 && f.geometry.coordinates.length > 0).length;

  const pviBuckets: readonly (PviBucket | undefined)[] | undefined =
    geojson &&
    geojson?.features
      .filter(f => f.id !== 0 && f.geometry.coordinates.length > 0)
      .map(f => {
        const pvi = f.properties.voting && calculatePVI(f.properties.voting, metric?.electionYear);
        const data: PviBucket | undefined = pvi !== undefined ? computeRowBucket(pvi) : undefined;
        return data;
      });

  function computeRowBucket(value: number): PviBucket | undefined {
    const buckets: readonly PviBucket[] = getPviBuckets();
    const stops = getPviSteps();
    // eslint-disable-next-line
    for (let i = 0; i < stops.length; i++) {
      const r = stops[i];
      if (value >= r[0]) {
        if (i < stops.length - 1) {
          const r1 = stops[i + 1];
          if (value < r1[0]) {
            return buckets[i];
          }
        } else {
          return buckets[i];
        }
      } else {
        return buckets[i];
      }
    }
    return undefined;
  }

  useEffect(() => {
    if (
      metric &&
      "electionYear" in metric &&
      electionYear !== metric.electionYear &&
      numDistrictsWithGeometries &&
      numDistrictsWithGeometries > 1
    ) {
      if (metric && metric.key === "competitiveness") {
        metric &&
          store.dispatch(
            selectEvaluationMetric({
              ...metric,
              electionYear: electionYear
            })
          );
      }
    }
  }, [electionYear, geojson, metric, numDistrictsWithGeometries]);

  const populationPerRepresentative =
    geojson && project && getPopulationPerRepresentative(geojson, project?.numberOfMembers);
  const multipleElections = hasMultipleElections(staticMetadata);

  const requiredMetrics: readonly EvaluateMetricWithValue[] = [
    {
      key: "equalPopulation",
      name: "Equal Population",
      status:
        numEqualPopDistricts !== undefined &&
        numDistrictsWithGeometries !== undefined &&
        numEqualPopDistricts === numDistrictsWithGeometries,
      description: "have equal population",
      shortText:
        "The U.S. constitution requires that each district have about the same population per representative for a map to be considered valid.",
      longText:
        (popThreshold !== undefined &&
          `Districts are required to be "Equal Population" for a map to be considered valid. Districts are "Equal Population" when their population falls within the target threshold. The target population is the total population divided by the number of representatives and the threshold is a set percentage deviation (${Math.floor(
            popThreshold
          )}%) above or below that target.`) ||
        "",
      showInSummary: true,
      popThreshold,
      populationPerRepresentative,
      numberOfMembers: project?.numberOfMembers,
      type: "fraction",
      total: geojson?.features.filter(f => f.id !== 0).length || 0,
      value: numEqualPopDistricts || 0
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
      showInSummary: true,
      type: "fraction",
      total: geojson?.features.filter(f => f.id !== 0).length || 0,
      value:
        geojson?.features.filter(f => f.properties.contiguity === "contiguous" && f.id !== 0)
          .length || 0
    }
  ];
  const optionalMetrics: readonly EvaluateMetricWithValue[] = [
    {
      key: "competitiveness",
      name: "Competitiveness",
      description: "are competitive",
      type: "pvibydistrict",
      shortText:
        "A competitiveness metric evaluates the plan based on the average partisan lean of each district.",
      longText:
        "A competitiveness metric evaluates the plan based on the average partisan lean of each district, calculated using the Partisan Voting Index (PVI). A partisan lean of the district plan which deviates from the overall lean of the state can be indicative of gerrymandering.",
      showInSummary: !!(staticMetadata && staticMetadata.voting),
      pviByDistrict: pviBuckets,
      hasMultipleElections: multipleElections,
      electionYear: electionYear
    },
    {
      key: "compactness",
      name: "Compactness",
      type: "percent",
      longText:
        "A district that efficiently groups constituents together has higher compactness. Low compactness or districts that branch out to different areas can be indicators of gerrymandering. Compactness is calculated using the Polsby-Popper method. Higher numbers are better.",
      shortText:
        "A district that is more spread out has a lower compactness. Low compactness can be an indicator of gerrymandering.",
      showInSummary: true,
      description: "are compact",
      value: avgCompactness
    },
    {
      key: "majorityMinority",
      name: "Majority-Minority",
      type: "fraction",
      description: "are majority-minority",
      shortText:
        "A majority-minority district is a district in which a racial minority group or groups comprise a majority of the district's total population.",
      longText:
        'A majority-minority district is a district in which a racial minority group or groups comprise a majority of the district\'s total population. The display indicates districts where a minority race has a simple majority (Black, Hispanic, etc.), or where the sum of multiple minority races combine to a majority (called "Coalition" districts).',
      showInSummary: true,
      total: geojson?.features.filter(f => f.id !== 0).length || 0,
      value: geojson?.features.filter(f => isMajorityMinority(f)).length || 0
    },
    {
      key: "countySplits",
      name: `${geoLevel ? geoLevelLabelSingular(geoLevel) : ""} splits`,
      type: "count",
      description: "are split",
      shortText: `${
        geoLevel ? `${geoLevelLabelSingular(geoLevel)} splits` : "Splits"
      } occur when a ${
        geoLevel ? geoLevel : "jurisdiction"
      } is split between two or more districts. Some states require minimizing ${
        geoLevel ? geoLevel : ""
      } splits, to the extent practicable.`,
      longText: `${
        geoLevel ? `${geoLevelLabelSingular(geoLevel)} splits` : "Splits"
      } occur when a ${
        geoLevel ? geoLevel : "jurisdiction"
      } is split between two or more districts. Some states require minimizing ${
        geoLevel ? geoLevel : ""
      } splits, to the extent practicable.`,
      showInSummary: true,
      value: project?.districtsDefinition.filter(x => Array.isArray(x)).length || 0,
      total: project ? project.districtsDefinition.length : 0,
      splitCounties: project?.districtsDefinition.map(c => Array.isArray(c))
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
          electionYear={electionYear}
          setElectionYear={setEvaluateElectionYear}
          geoLevel={geoLevel}
          pviBuckets={pviBuckets}
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
