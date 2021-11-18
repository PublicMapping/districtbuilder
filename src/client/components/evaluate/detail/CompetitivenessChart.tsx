/** @jsx jsx */
import { Flex, jsx } from "theme-ui";
import { PviBucket } from "../../../types";
import { Bar } from "@visx/shape";
import { Group } from "@visx/group";
import { ParentSize } from "@visx/responsive";
import { scaleLinear, scaleBand } from "@visx/scale";
import { Axis } from "@visx/axis";
import { getPviBuckets } from "../../map";
//import { calculatePVI } from "../../../functions";
import { countBy } from "lodash";

//probably no longer even need geojson and metric passed in
const CompetitivenessChart = ({
  //geojson,
  //metric,
  pviBuckets
}: {
  //readonly geojson?: DistrictsGeoJSON;
  //readonly metric?: EvaluateMetricWithValue;
  readonly pviBuckets?: readonly (PviBucket | undefined)[] | undefined;
}) => {
  /*const buckets: readonly (PviBucket | undefined)[] | undefined =
    geojson &&
    geojson?.features
      .filter(f => f.id !== 0 && f.geometry.coordinates.length > 0)
      .map(f => {
        const pvi = f.properties.voting && calculatePVI(f.properties.voting, metric?.electionYear);
        const data: PviBucket | undefined = pvi !== undefined ? computeRowBucket(pvi) : undefined;
        return data;
      });*/

  const bucketCounts = countBy(pviBuckets, "name");

  const chartData: readonly PviBucket[] = getPviBuckets().map(bucket => {
    return { ...bucket, count: bucketCounts[bucket.name] || 0 };
  });
  /*
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
  */
  return (
    <Flex
      sx={{
        flexDirection: "row",
        height: "200px",
        minWidth: "150px",
        position: "relative",
        ml: "10px",
        flexShrink: 0
      }}
    >
      <ParentSize>
        {parent => {
          const margin = { top: 0, bottom: 50, left: 0, right: 0 };

          const xMax = parent.width - margin.left - margin.right;
          const yMax = parent.height - margin.top - margin.bottom;

          const leftAxisWidth = 30;

          // accessors
          const x = (d: PviBucket) => d.name;
          const y = (d: PviBucket) => (d.count ? +d.count : 0);

          const xScale = scaleBand({
            range: [leftAxisWidth, xMax],
            round: true,
            domain: chartData.map(x),
            padding: 0.4
          });

          const yScale = scaleLinear({
            range: [yMax, 10],
            round: true,
            domain: [0, Math.max(...chartData.map(y))]
          });

          const xPoint = (data: PviBucket) => xScale(x(data));
          const yPoint = (data: PviBucket) => yScale(y(data));
          return (
            <svg width={parent.width} height={parent.height}>
              {chartData.map((d, i) => {
                const barHeight = yMax - yPoint(d);
                return (
                  <Group key={`bar-${i}`}>
                    <Bar
                      x={xPoint(d)}
                      y={yMax - barHeight}
                      height={barHeight}
                      width={xScale.bandwidth()}
                      fill={d.color}
                    />
                  </Group>
                );
              })}
              <Axis
                scale={xScale}
                hideTicks={true}
                label="Political Lean"
                orientation="bottom"
                top={yMax}
              />
              <Axis
                scale={yScale}
                label="# of districts"
                left={leftAxisWidth}
                orientation="left"
                numTicks={4}
              />
            </svg>
          );
        }}
      </ParentSize>
    </Flex>
  );
};

export default CompetitivenessChart;
