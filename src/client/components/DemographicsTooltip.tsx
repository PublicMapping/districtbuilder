/** @jsx jsx */
import mapValues from "lodash/mapValues";
import { Box, jsx, Styled } from "theme-ui";

import { demographicsColors } from "../constants/colors";

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
    <Styled.td sx={{ textAlign: "left", padding: "0 3px", textTransform: "capitalize" }}>
      {label}
    </Styled.td>
    <Styled.td sx={{ minWidth: "100px" }}>
      <Box
        sx={{
          width: `${percent}%`,
          height: "1rem",
          backgroundColor: color
        }}
      />
    </Styled.td>
    <Styled.td sx={{ flex: "auto", textAlign: "right" }}>
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
    <Box sx={{ width: "100%", minHeight: "100%", backgroundColor: "gray.8", m: 0, p: 2 }}>
      <Styled.table sx={{ margin: "0" }}>
        <tbody>{rows}</tbody>
      </Styled.table>
    </Box>
  );
};

export default DemographicsTooltip;
