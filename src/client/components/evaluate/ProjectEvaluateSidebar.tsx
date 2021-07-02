/** @jsx jsx */
import { jsx, ThemeUIStyleObject, Container, Box } from "theme-ui";

import { IProject, IStaticMetadata, RegionLookupProperties } from "../../../shared/entities";
import {
  DistrictsGeoJSON,
  EvaluateMetric,
  EvaluateMetricWithValue,
  ElectionYear,
  Party
} from "../../types";
import store from "../../store";
import { hasMultipleElections, isMajorityMinority } from "../../functions";
import { regionPropertiesFetch } from "../../actions/regionConfig";
import ProjectEvaluateMetricDetail from "./ProjectEvaluateMetricDetail";
import ProjectEvaluateSummary from "./ProjectEvaluateSummary";
import { useState, useEffect } from "react";
import { Resource } from "../../resource";
import { selectEvaluationMetric } from "../../actions/districtDrawing";

import {
  geoLevelLabelSingular,
  getTargetPopulation,
  calculatePVI,
  getPartyColor
} from "../../functions";

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
  const [electionYear, setEvaluateElectionYear] = useState<ElectionYear>("combined");
  const [avgCompetitiveness, setAvgCompetitiveness] = useState<number | undefined>(undefined);
  const [party, setParty] = useState<Party | undefined>(undefined);
  const popThreshold = project && project.populationDeviation;
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
    if (geojson && !avgPopulation) {
      setAvgPopulation(getTargetPopulation(geojson));
    }
  }, [geojson, avgPopulation]);

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
  const numDistrictsWithPopulation =
    geojson && geojson.features.filter(f => f.properties.demographics.population > 0).length;

  useEffect(() => {
    if (
      (!avgCompetitiveness ||
        (metric && "electionYear" in metric && electionYear !== metric.electionYear)) &&
      numDistrictsWithPopulation &&
      numDistrictsWithPopulation > 1
    ) {
      const numDistrictsWithPvi =
        geojson &&
        geojson.features
          .filter(f => f.id !== 0 && f.properties.demographics.population > 0)
          .filter(f => Object.keys(f.properties.voting || {}).length > 0).length;

      const competitiveness =
        geojson && geojson.features && numDistrictsWithPvi && numDistrictsWithPvi > 0
          ? geojson.features
              .filter(f => f.id !== 0)
              .map(f => {
                const voting =
                  Object.keys(f.properties.voting || {}).length > 0
                    ? f.properties.voting
                    : undefined;
                const pvi = voting && calculatePVI(voting, electionYear);
                return pvi || 0;
              })
              .reduce((a, b) => a + b) / numDistrictsWithPvi
          : undefined;

      setAvgCompetitiveness(competitiveness);
      const partyLabel = competitiveness && competitiveness > 0 ? "D" : "R";
      const partyColor = getPartyColor(
        competitiveness && competitiveness > 0 ? "democrat" : "republican"
      );
      const party: Party = { color: partyColor, label: partyLabel };
      setParty(party);
      if (metric && metric.key === "competitiveness") {
        metric &&
          store.dispatch(
            selectEvaluationMetric({
              ...metric,
              electionYear: electionYear,
              party: party,
              value: competitiveness
            })
          );
      }
    }
  }, [electionYear, geojson, metric, avgCompetitiveness, numDistrictsWithPopulation]);

  const multipleElections = hasMultipleElections(staticMetadata);

  const requiredMetrics: readonly EvaluateMetricWithValue[] = [
    {
      key: "equalPopulation",
      name: "Equal Population",
      status:
        numEqualPopDistricts !== undefined &&
        numDistrictsWithPopulation !== undefined &&
        numEqualPopDistricts === numDistrictsWithPopulation,
      description: "have equal population",
      shortText:
        "The U.S. constitution requires that each district have about the same population for a map to be considered valid.",
      longText:
        (popThreshold !== undefined &&
          `Districts are required to be "Equal Population" for a map to be considered valid. Districts are "Equal Population" when their population falls within the target threshold. The target population is the total population divided by the number of districts and the threshold is a set percentage deviation (${Math.floor(
            popThreshold
          )}%) above or below that target.`) ||
        "",
      avgPopulation: avgPopulation,
      popThreshold: popThreshold,
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
      description: "are competitive",
      type: "pvi",
      shortText:
        "A competitiveness metric evaluates the plan based on the average partisan lean of each district.",
      longText:
        "A competitiveness metric evaluates the plan based on the average partisan lean of each district, calculated using the Partisan Voting Index (PVI). A partisan lean of the district plan which deviates from the overall lean of the state can be indicative of gerrymandering.",
      party: party,
      value: avgCompetitiveness,
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
      total: geojson?.features.filter(f => f.id !== 0).length || 0,
      value: geojson?.features.filter(f => isMajorityMinority(f)).length || 0
    },
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
          electionYear={electionYear}
          setElectionYear={setEvaluateElectionYear}
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
