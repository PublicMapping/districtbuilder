/** @jsx jsx */
import { mapValues, sum } from "lodash";
import { Box, jsx, Themed, ThemeUIStyleObject } from "theme-ui";

import { getPartyColor, capitalizeFirstLetter } from "../functions";

const style: Record<string, ThemeUIStyleObject> = {
  label: {
    textAlign: "left",
    py: 0,
    px: 2,
    textTransform: "capitalize"
  },
  number: {
    flex: "auto",
    textAlign: "right",
    fontVariant: "tabular-nums",
    py: 0,
    px: 1,
    fontWeight: "light"
  }
};

const Row = ({
  party,
  votes,
  percent,
  color
}: {
  readonly party: string;
  readonly votes?: number;
  readonly percent?: number;
  readonly color: string;
}) => (
  <Themed.tr
    sx={{
      color: "muted",
      border: "none"
    }}
  >
    <Themed.td>
      <Box
        style={{
          backgroundColor: color
        }}
        sx={{
          height: "15px",
          width: "15px"
        }}
      />
    </Themed.td>
    <Themed.td sx={style.label}>
      <b>{capitalizeFirstLetter(party)}</b>
    </Themed.td>
    <Themed.td sx={style.number}>{votes?.toLocaleString(undefined)}</Themed.td>
    <Themed.td sx={style.number}>
      {percent ? percent.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "0"}
      {"%"}
    </Themed.td>
  </Themed.tr>
);

const VotingTooltip = ({
  voting,
  votingIds
}: {
  readonly voting: { readonly [id: string]: number };
  readonly votingIds: readonly string[];
}) => {
  const total = sum(Object.values(voting));
  const percentages = mapValues(voting, (votes: number) => (total ? votes / total : 0) * 100);
  const rows = votingIds.map(party => (
    <Row
      key={party}
      party={party}
      votes={voting[party]}
      percent={percentages[party]}
      color={getPartyColor(party)}
    />
  ));
  return (
    <Box sx={{ width: "100%", minHeight: "100%" }}>
      <Themed.table sx={{ margin: "0", width: "100%" }}>
        <tbody>{rows}</tbody>
      </Themed.table>
    </Box>
  );
};

export default VotingTooltip;
