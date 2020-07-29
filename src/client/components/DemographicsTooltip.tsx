/** @jsx jsx */
import mapValues from "lodash/mapValues";
import { Box, jsx, Styled } from "theme-ui";

import { demographicsColors } from "../constants/colors";

const Row = ({
  label,
  population,
  percent,
  color
}: {
  readonly label: string;
  readonly population?: number;
  readonly percent?: number;
  readonly color: string;
}) => (
  <Styled.tr
    sx={{
      color: "muted",
      border: "none"
    }}
  >
    <Styled.td>
      <Box
        sx={{
          width: "1rem",
          height: "1rem",
          backgroundColor: color
        }}
      />
    </Styled.td>
    <Styled.td sx={{ textAlign: "left", padding: "0 3px" }}>{label}</Styled.td>
    <Styled.td sx={{ textAlign: "right", padding: "0 3px" }}>
      {population ? population.toLocaleString() : "0"}
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
  console.log("demographics", demographics);
  const percentages = mapValues(
    demographics,
    (population: number) =>
      (demographics.population ? population / demographics.population : 0) * 100
  );
  return (
    <Box sx={{ width: "100%", minHeight: "100%", backgroundColor: "gray.8", m: 0, p: 2 }}>
      <Styled.table sx={{ margin: "0" }}>
        <tbody>
          <Row
            label={"White"}
            population={demographics.white}
            percent={percentages.white}
            color={demographicsColors.white}
          />
          <Row
            label={"Black"}
            population={demographics.black}
            percent={percentages.black}
            color={demographicsColors.black}
          />
          <Row
            label={"Asian"}
            population={demographics.asian}
            percent={percentages.asian}
            color={demographicsColors.asian}
          />
          <Row
            label={"Hispanic"}
            population={demographics.hispanic}
            percent={percentages.hispanic}
            color={demographicsColors.hispanic}
          />
          <Row
            label={"Other"}
            population={demographics.other}
            percent={percentages.other}
            color={demographicsColors.other}
          />
        </tbody>
      </Styled.table>
    </Box>
  );
};

export default DemographicsTooltip;
