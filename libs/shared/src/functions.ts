import {
  TypedArray,
  DemographicCounts,
  IStaticMetadata,
  IStaticFile,
  MetricsList,
  VotingMetricsList,
  VotingMetricField,
  DemographicsGroup
} from "./entities";
import { CORE_METRIC_FIELDS, DEMOGRAPHIC_FIELDS_ORDER } from "./constants";

// Helper for finding all indices in an array buffer matching a value.
// Note: mutation is used, because the union type of array buffers proved
// too difficult to line up types for reduce or map/filter.
export function getAllIndices(arrayBuf: TypedArray, vals: ReadonlySet<number>): readonly number[] {
  // eslint-disable-next-line
  let indices: number[] = [];
  arrayBuf.forEach((el: number, ind: number) => {
    // eslint-disable-next-line
    if (vals.has(el)) {
      // eslint-disable-next-line
      indices.push(ind);
    }
  });
  return indices;
}

// Recursively finds all base indices matching a set of values at a specified level
export function getAllBaseIndices(
  descGeoLevels: readonly TypedArray[],
  levelIndex: number,
  vals: readonly number[]
): readonly number[] {
  // eslint-disable-next-line
  if (vals.length === 0 || levelIndex === descGeoLevels.length) {
    return vals;
  }
  return getAllBaseIndices(
    descGeoLevels,
    levelIndex + 1,
    getAllIndices(descGeoLevels[levelIndex], new Set(vals))
  );
}

export function getDemographics(
  baseIndices: readonly number[] | ReadonlySet<number>,
  staticMetadata: IStaticMetadata,
  staticDemographics: readonly TypedArray[]
): DemographicCounts {
  return getAggregatedCounts(
    baseIndices,
    staticMetadata,
    staticDemographics,
    staticMetadata.demographics
  );
}

export function getVoting(
  baseIndices: readonly number[] | ReadonlySet<number>,
  staticMetadata: IStaticMetadata,
  staticVoting: readonly TypedArray[]
): DemographicCounts {
  return staticMetadata.voting
    ? getAggregatedCounts(baseIndices, staticMetadata, staticVoting, staticMetadata.voting)
    : {};
}

export function getAggregatedCounts(
  baseIndices: readonly number[] | ReadonlySet<number>,
  staticMetadata: IStaticMetadata,
  staticFiles: readonly TypedArray[],
  fileProperties: readonly IStaticFile[]
): DemographicCounts {
  // Aggregate numeric data for the IDs
  return fileProperties.reduce((data, props, ind) => {
    let count: number = 0; // eslint-disable-line
    baseIndices.forEach((v: number) => {
      if (!isNaN(staticFiles[ind][v])) {
        count += staticFiles[ind][v];
      }
    });
    return { ...data, [props.id]: count };
  }, {} as DemographicCounts);
}

export function getDemographicLabel(id: string) {
  return id === "native"
    ? "Native American"
    : id === "pacific"
    ? "Pacific Islander"
    : id.split(/(?=[A-Z])/).join(" ");
}

export const getMetricFieldForDemographicsId = (id: string) =>
  id === "population" ? id : `${id}Population`;

export function getDemographicsMetricFields(staticMetadata: IStaticMetadata): MetricsList {
  // eslint-disable-next-line functional/prefer-readonly-type
  const data: (readonly [string, string])[] = staticMetadata.demographics.flatMap(file =>
    CORE_METRIC_FIELDS.includes(file.id)
      ? []
      : [[file.id, getMetricFieldForDemographicsId(file.id)]]
  );
  // If the configuration has demographic groups specified use that order, otherwise use the default ordering
  const order: readonly string[] =
    staticMetadata.demographicsGroups?.flatMap(g =>
      g.total ? [g.total, ...g.subgroups] : g.subgroups
    ) || DEMOGRAPHIC_FIELDS_ORDER;
  // eslint-disable-next-line functional/immutable-data
  data.sort(([a], [b]) => order.indexOf(a) - order.indexOf(b));
  return data;
}

export function getVotingMetricFields(staticMetadata: IStaticMetadata): VotingMetricsList {
  // eslint-disable-next-line functional/prefer-readonly-type
  const data: (readonly [string, VotingMetricField])[] =
    staticMetadata.voting?.flatMap(file => {
      const field =
        file.id === "democrat" || file.id === "democrat16"
          ? "dem16"
          : file.id === "republican" || file.id === "republican16"
          ? "rep16"
          : file.id === "other party" || file.id === "other party16"
          ? "other16"
          : file.id === "democrat20"
          ? "dem20"
          : file.id === "republican20"
          ? "rep20"
          : file.id === "other party20"
          ? "other20"
          : undefined;
      return field !== undefined ? [[file.id, field]] : [];
    }) || [];
  const order = ["dem16", "rep16", "other16", "dem20", "rep20", "other20"];
  // eslint-disable-next-line functional/immutable-data
  data.sort(([, a], [, b]) => order.indexOf(a) - order.indexOf(b));
  return data;
}

export function getDemographicsGroups(
  staticMetadata: IStaticMetadata
): readonly DemographicsGroup[] {
  const demographicsMetricFields = getDemographicsMetricFields(staticMetadata);
  return (
    staticMetadata.demographicsGroups || [
      {
        total: "population",
        subgroups: demographicsMetricFields?.map(([id]) => id) || []
      }
    ]
  );
}
