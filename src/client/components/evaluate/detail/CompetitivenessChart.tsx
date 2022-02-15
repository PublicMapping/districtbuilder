/** @jsx jsx */
import { Flex, jsx } from "theme-ui";
import { PviBucket } from "../../../types";
import { Bar } from "@visx/shape";
import { Group } from "@visx/group";
import { ParentSize } from "@visx/responsive";
import { scaleLinear, scaleBand } from "@visx/scale";
import { Axis } from "@visx/axis";
import { getPviBuckets } from "../../map";
import { countBy } from "lodash";

const CompetitivenessChart = ({
  pviBuckets
}: {
  readonly pviBuckets?: readonly (PviBucket | undefined)[] | undefined;
}) => {
  const bucketCounts = countBy(pviBuckets, "name");

  const chartData: readonly PviBucket[] = getPviBuckets().map(bucket => {
    return { ...bucket, count: bucketCounts[bucket.name] || 0 };
  });

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
          const yMax = parent.height ? parent.height - margin.top - margin.bottom : 10;

          const leftAxisWidth = 30;
          const leftTickLabelsOffset = 10;

          // accessors
          const x = (d: PviBucket) => d.name;
          const y = (d: PviBucket) => (d.count ? +d.count : 0);
          const yValueMax = Math.max(...chartData.map(y));

          const xScale = scaleBand({
            range: [leftAxisWidth, xMax],
            round: true,
            domain: chartData.map(x),
            padding: 0.4
          });

          const yScale = scaleLinear({
            range: [yMax, 10],
            round: true,
            domain: [0, yValueMax]
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
                numTicks={yValueMax}
                labelOffset={leftTickLabelsOffset + 5}
                tickFormat={yScale.tickFormat(1)}
                tickLabelProps={() => ({
                  verticalAnchor: "middle",
                  dx: -leftTickLabelsOffset,
                  fontSize: 9
                })}
              />
            </svg>
          );
        }}
      </ParentSize>
    </Flex>
  );
};

export default CompetitivenessChart;
