/** @jsx jsx */
import mapValues from "lodash/mapValues";
import { Box, jsx, Styled, ThemeUIStyleObject, Divider } from "theme-ui";

import { demographicsColors } from "../constants/colors";
import { getDemographicLabel } from "../../shared/functions";

const style: ThemeUIStyleObject = {
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
  <Styled.tr
    sx={{
      color: "muted",
      border: "none"
    }}
  >
    <Styled.td sx={style.label}>{abbreviate ? id : getDemographicLabel(id)}</Styled.td>
    <Styled.td sx={{ minWidth: "50px", py: 0 }}>
      <Box
        style={{
          width: `${percent}%`
        }}
        sx={{
          height: "10px",
          backgroundColor: color,
          borderRadius: "1px"
        }}
      />
    </Styled.td>
    <Styled.td sx={style.number}>
      {percent ? percent.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "0"}
      {"%"}
    </Styled.td>
  </Styled.tr>
);

const DemographicsTooltip = ({
  demographics,
  isMajorityMinority,
  abbreviate
}: {
  readonly demographics: { readonly [id: string]: number };
  readonly isMajorityMinority?: boolean;
  readonly abbreviate?: boolean;
}) => {
  const percentages = mapValues(
    demographics,
    (population: number) =>
      (demographics.population ? population / demographics.population : 0) * 100
  );
  const races = ["white", "black", "asian", "hispanic", "native", "pacific", "other"] as const;
  const rows = races
    .filter(race => percentages[race] !== undefined)
    .map((id: typeof races[number]) => (
      <Row
        key={id}
        id={id}
        percent={percentages[id]}
        color={demographicsColors[id]}
        abbreviate={abbreviate}
      />
    ));
  return (
    <Box sx={{ width: "100%", minHeight: "100%" }}>
      <Styled.table sx={{ margin: "0", width: "100%" }}>
        <tbody>{rows}</tbody>
      </Styled.table>
      {isMajorityMinority && (
        <Box>
          <Divider sx={{ my: 1, borderColor: "gray.6" }} />
          <Box>* Minority majority district</Box>
        </Box>
      )}
    </Box>
  );
};

export default DemographicsTooltip;
