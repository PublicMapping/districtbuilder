/** @jsx jsx */
import { mapValues, sum } from "lodash";
import { Box, jsx, Styled, ThemeUIStyleObject, Heading } from "theme-ui";

import { getPartyColor, capitalizeFirstLetter, extractYear } from "../functions";
import { DemographicCounts } from "../../shared/entities";
import { ElectionYear } from "../types";

import React from "react";

const style: Record<string, ThemeUIStyleObject> = {
  header: {
    textAlign: "left",
    color: "muted",
    py: 1,
    mb: 0
  },
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
  <Styled.tr
    sx={{
      color: "muted",
      border: "none"
    }}
  >
    <Styled.td>
      <Box
        style={{
          backgroundColor: color
        }}
        sx={{
          height: "15px",
          width: "15px"
        }}
      />
    </Styled.td>
    <Styled.td sx={style.label}>
      <b>{capitalizeFirstLetter(party)}</b>
    </Styled.td>
    <Styled.td sx={style.number}>{votes?.toLocaleString(undefined)}</Styled.td>
    <Styled.td sx={style.number}>
      {percent ? percent.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "0"}
      {"%"}
    </Styled.td>
  </Styled.tr>
);

const getRows = ({
  voting,
  year,
  excludeOther
}: {
  readonly voting: DemographicCounts;
  readonly year?: ElectionYear;
  readonly excludeOther?: boolean;
}) => {
  const votesForYear = extractYear(voting, year);
  const total = sum(Object.values(votesForYear));
  const order = ["republican", "democrat"];
  // eslint-disable-next-line
  const percentages = Object.entries(
    mapValues(votesForYear, (votes: number) => (total ? votes / total : 0) * 100)
  ).sort(([a], [b]) => {
    return order.indexOf(b) - order.indexOf(a);
  });
  const rows = percentages.map(([party, percent]) =>
    !excludeOther || party !== "other party" ? (
      <Row
        key={party}
        party={party}
        votes={votesForYear[party]}
        percent={percent}
        color={getPartyColor(party)}
      />
    ) : null
  );
  return rows.length > 0 ? rows : null;
};

const VotingSidebarTooltip = ({
  voting,
  excludeOther
}: {
  readonly voting: DemographicCounts;
  readonly excludeOther?: boolean;
}) => {
  const rows16 = getRows({ voting, year: "16", excludeOther });
  const rows20 = getRows({ voting, year: "20", excludeOther });
  const unspecifiedRows = !rows16 && !rows20 && getRows({ voting, excludeOther });

  return (
    <Box sx={{ width: "100%", minHeight: "100%" }}>
      <Heading as="h5" sx={style.header}>
        Presidential 2016
      </Heading>
      <Styled.table sx={{ margin: "0", width: "100%" }}>
        <tbody>{rows16 || unspecifiedRows}</tbody>
      </Styled.table>
      {rows20 && (
        <React.Fragment>
          <Heading as="h5" sx={style.header}>
            Presidential 2020
          </Heading>
          <Styled.table sx={{ margin: "0", width: "100%" }}>
            <tbody>{rows20}</tbody>
          </Styled.table>
        </React.Fragment>
      )}
    </Box>
  );
};

export default VotingSidebarTooltip;
