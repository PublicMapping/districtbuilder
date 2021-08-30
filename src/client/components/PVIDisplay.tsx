/** @jsx jsx */
import { Box, jsx } from "theme-ui";
import { DistrictProperties } from "../../shared/entities";
import { ElectionYear } from "../types";
import { getPartyColor, calculatePVI } from "../functions";
import Tooltip from "./Tooltip";
import VotingSidebarTooltip from "./VotingSidebarTooltip";

const BLANK_VALUE = "–";

export function getPvi(properties: DistrictProperties, year?: ElectionYear) {
  const voting = Object.keys(properties.voting || {}).length > 0 ? properties.voting : undefined;

  return year !== "combined"
    ? voting && calculatePVI(voting, year)
    : voting && calculatePVI(voting);
}

const PVIDisplay = ({
  properties,
  year
}: {
  readonly properties: DistrictProperties;
  readonly year?: ElectionYear;
}) => {
  // The voting object can be present but have no data, we treat this case as if it isn't there

  const voting = Object.keys(properties.voting || {}).length > 0 ? properties.voting : undefined;
  const pvi = getPvi(properties, year);

  const color = getPartyColor(pvi && pvi > 0 ? "democrat" : "republican");
  const partyLabel = pvi && pvi > 0 ? "D" : "R";
  const votingDisplay =
    pvi !== undefined ? (
      <Box sx={{ color }}>{`${partyLabel}+${Math.abs(pvi).toLocaleString(undefined, {
        maximumFractionDigits: 0
      })}`}</Box>
    ) : (
      <span sx={{ color: "gray.2" }}>{BLANK_VALUE}</span>
    );
  return voting ? (
    <Tooltip
      placement="top-start"
      content={
        pvi !== undefined ? (
          <VotingSidebarTooltip voting={voting} excludeOther={true} />
        ) : (
          <em>
            <strong>Empty district.</strong> Add people to this district to view the vote totals
          </em>
        )
      }
    >
      <span>{votingDisplay}</span>
    </Tooltip>
  ) : (
    <span>N/A</span>
  );
};

export default PVIDisplay;
