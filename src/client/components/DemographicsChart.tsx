/** @jsx jsx */
import mapValues from "lodash/mapValues";
import { Box, Flex, jsx } from "theme-ui";

import { demographicsColors } from "../constants/colors";

const Bar = ({ width, color }: { readonly width: string; readonly color: string }) => (
  <Box
    sx={{
      width,
      backgroundColor: color,
      flex: "1"
    }}
  ></Box>
);

const DemographicsChart = ({
  demographics
}: {
  readonly demographics: { readonly [id: string]: number };
}) => {
  // Only showing hard-coded core metrics here for space reasons, so we can hard-code population as well
  const total = Math.abs(demographics.population);
  const percentages = mapValues(
    demographics,
    (population: number) => `${Math.min((total ? population / total : 0) * 100, 100)}%`
  );
  return (
    <Flex sx={{ flexDirection: "column", width: "40px", minHeight: "20px", flexShrink: 0 }}>
      <Bar width={percentages.white} color={demographicsColors.white} />
      <Bar width={percentages.black} color={demographicsColors.black} />
      <Bar width={percentages.asian} color={demographicsColors.asian} />
      <Bar width={percentages.hispanic} color={demographicsColors.hispanic} />
      {"other" in percentages && <Bar width={percentages.other} color={demographicsColors.other} />}
      {"native" in percentages && (
        <Bar width={percentages.native} color={demographicsColors.native} />
      )}
      {"pacific" in percentages && (
        <Bar width={percentages.pacific} color={demographicsColors.pacific} />
      )}
    </Flex>
  );
};

export default DemographicsChart;
