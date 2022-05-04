/** @jsx jsx */
import { Box, jsx, Themed, ThemeUIStyleObject, Divider } from "theme-ui";

import { demographicsColors } from "../constants/colors";
import { getDemographicLabel } from "@districtbuilder/shared/functions";
import { DEMOGRAPHIC_FIELDS_ORDER } from "@districtbuilder/shared/constants";
import { GroupTotal, DemographicsGroup } from "@districtbuilder/shared/entities";
import { getDemographicsPercentages } from "../functions";

const style: Record<string, ThemeUIStyleObject> = {
  label: {
    textAlign: "left",
    py: 0,
    pr: 2,
    whiteSpace: "nowrap",
    textTransform: "capitalize",
    width: "70px"
  },
  number: {
    flex: "auto",
    textAlign: "right",
    fontVariant: "tabular-nums",
    py: 0,
    fontWeight: "light"
  }
};

const Row = ({
  id,
  percent,
  color,
  abbreviate
}: {
  readonly id: string;
  readonly percent?: number;
  readonly color: string;
  readonly abbreviate?: boolean;
}) => (
  <Themed.tr
    sx={{
      color: "muted",
      border: "none"
    }}
  >
    <Themed.td sx={style.label}>{abbreviate ? id : getDemographicLabel(id)}</Themed.td>
    <Themed.td sx={{ minWidth: "50px", py: 0 }}>
      <Box
        style={{
          width: percent ? `${Math.min(percent, 100)}%` : 0
        }}
        sx={{
          height: "10px",
          backgroundColor: color,
          borderRadius: "1px"
        }}
      />
    </Themed.td>
    <Themed.td sx={style.number}>
      {percent ? percent.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "0"}
      {"%"}
    </Themed.td>
  </Themed.tr>
);

const DemographicsTooltip = ({
  demographics,
  isMajorityMinority,
  abbreviate,
  demographicsGroups,
  populationKey
}: {
  readonly demographics: { readonly [id: string]: number };
  readonly isMajorityMinority?: boolean;
  readonly abbreviate?: boolean;
  readonly demographicsGroups: readonly DemographicsGroup[];
  readonly populationKey: GroupTotal;
}) => {
  const percentages = getDemographicsPercentages(demographics, demographicsGroups, populationKey);
  // Only showing hard-coded core metrics here for space / color reasons
  const rows = DEMOGRAPHIC_FIELDS_ORDER.filter(race => percentages[race] !== undefined).map(
    (id: typeof DEMOGRAPHIC_FIELDS_ORDER[number]) => (
      <Row
        key={id}
        id={id}
        percent={percentages[id]}
        color={demographicsColors[id]}
        abbreviate={abbreviate}
      />
    )
  );
  return (
    <Box sx={{ width: "100%", minHeight: "100%" }}>
      <Themed.table sx={{ margin: "0", width: "100%" }}>
        <tbody>{rows}</tbody>
      </Themed.table>
      {isMajorityMinority && (
        <Box>
          <Divider sx={{ my: 1, borderColor: "gray.6" }} />
          <Box sx={{ borderLeft: "1px dashed", pl: "6px" }}>Majority-minority district</Box>
        </Box>
      )}
    </Box>
  );
};

export default DemographicsTooltip;
