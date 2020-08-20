/** @jsx jsx */
import mapValues from "lodash/mapValues";
import { Box, jsx, Styled, ThemeUIStyleObject } from "theme-ui";

import { demographicsColors } from "../constants/colors";

const style: ThemeUIStyleObject = {
  label: {
    textAlign: "left",
    py: 0,
    pr: 2,
    textTransform: "capitalize",
    fontSize: 1
  },
  number: {
    flex: "auto",
    textAlign: "right",
    fontVariant: "tabular-nums",
    py: 0,
    fontSize: 1
  }
};

const Row = ({
  label,
  percent,
  color
}: {
  readonly label: string;
  readonly percent?: number;
  readonly color: string;
}) => (
  <Styled.tr
    sx={{
      color: "muted",
      border: "none"
    }}
  >
    <Styled.td sx={style.label}>{label}</Styled.td>
    <Styled.td sx={{ minWidth: "50px", py: 0 }}>
      <Box
        sx={{
          width: `${percent}%`,
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
  demographics
}: {
  readonly demographics: { readonly [id: string]: number };
}) => {
  const percentages = mapValues(
    demographics,
    (population: number) =>
      (demographics.population ? population / demographics.population : 0) * 100
  );
  const races = ["white", "black", "asian", "hispanic", "other"] as const;
  const rows = races.map((id: typeof races[number]) => (
    <Row key={id} label={id} percent={percentages[id]} color={demographicsColors[id]} />
  ));
  return (
    <Box sx={{ width: "100%", minHeight: "100%" }}>
      <Styled.table sx={{ margin: "0" }}>
        <tbody>{rows}</tbody>
      </Styled.table>
    </Box>
  );
};

export default DemographicsTooltip;
