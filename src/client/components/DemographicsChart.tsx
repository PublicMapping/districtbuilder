/** @jsx jsx */
import { Box, Flex, jsx } from "theme-ui";

import { demographicsColors } from "../constants/colors";
import { DEMOGRAPHIC_FIELDS_ORDER } from "../../shared/constants";
import { GroupTotal, DemographicsGroup } from "../../shared/entities";
import { getDemographicsPercentages } from "../functions";

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
  demographics,
  demographicsGroups,
  populationKey
}: {
  readonly demographics: { readonly [id: string]: number };
  readonly demographicsGroups: readonly DemographicsGroup[];
  readonly populationKey: GroupTotal;
}) => {
  const percentages = getDemographicsPercentages(demographics, demographicsGroups, populationKey);
  return (
    <Flex sx={{ flexDirection: "column", width: "40px", minHeight: "20px", flexShrink: 0 }}>
      {/* Only showing hard-coded core demographics here for space / color choice reasons */}
      {DEMOGRAPHIC_FIELDS_ORDER.map(
        field =>
          field in percentages && (
            <Bar width={`${percentages[field]}%`} color={demographicsColors[field]} key={field} />
          )
      )}
    </Flex>
  );
};

export default DemographicsChart;
