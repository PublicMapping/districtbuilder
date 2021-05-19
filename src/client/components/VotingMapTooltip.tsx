/** @jsx jsx */
import { mapValues, sum } from "lodash";
import { Box, jsx, Styled, ThemeUIStyleObject } from "theme-ui";

import { getPartyColor, capitalizeFirstLetter } from "../functions";

const style: ThemeUIStyleObject = {
  label: {
    textAlign: "left",
    py: 0,
    pr: 2,
    textTransform: "capitalize"
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
    <Styled.td sx={style.label}>{capitalizeFirstLetter(label)}</Styled.td>
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

const VotingMapTooltip = ({
  voting,
  votingIds
}: {
  readonly voting: { readonly [id: string]: number };
  readonly votingIds: readonly string[];
}) => {
  const total = sum(Object.values(voting));
  const percentages = mapValues(voting, (votes: number) => (total ? votes / total : 0) * 100);
  const rows = votingIds.map(party => (
    <Row key={party} label={party} percent={percentages[party]} color={getPartyColor(party)} />
  ));

  return (
    <Box sx={{ width: "100%", minHeight: "100%" }}>
      <Styled.table sx={{ margin: "0", width: "100%" }}>
        <tbody>{rows}</tbody>
      </Styled.table>
    </Box>
  );
};

export default VotingMapTooltip;
