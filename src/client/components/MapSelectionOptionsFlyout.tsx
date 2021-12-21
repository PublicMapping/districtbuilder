/** @jsx jsx */
import { jsx, Box, Checkbox, Label, Radio, Heading } from "theme-ui";
import { Button as MenuButton, Wrapper, Menu } from "react-aria-menubutton";
import { style as menuStyle } from "./MenuButton.styles";
import store from "../store";
import {
  toggleLimitDrawingToWithinCounty,
  setElectionYear,
  setPopulationKey
} from "../actions/projectOptions";
import Tooltip from "./Tooltip";
import Icon from "./Icon";
import { IStaticMetadata, GroupTotal } from "../../shared/entities";
import { ElectionYear } from "../types";

const POPULATION_LABELS: { readonly [key: string]: string } = {
  population: "All people",
  VAP: "Voting age population (VAP)",
  CVAP: "Citizen voting age population (CVAP)"
};

const style = {
  button: {
    outline: "none",
    display: "inline-block",
    height: "22px",
    width: "22px",
    textAlign: "center",
    borderRadius: "100px",
    cursor: "pointer",
    "&:hover:not([disabled]):not(:active)": {
      bg: "rgba(89, 89, 89, 0.1)"
    },
    "&:focus": {
      boxShadow: "0 0 0 2px rgb(109 152 186 / 30%)"
    }
  },
  menuItem: {
    mb: 2
  },
  inputLabel: {
    textTransform: "none",
    color: "heading",
    lineHeight: "normal",
    fontWeight: "medium",
    "> div": {
      minWidth: "32px"
    }
  }
} as const;

const MapSelectionOptionsFlyout = ({
  limitSelectionToCounty,
  metadata,
  topGeoLevelName,
  electionYear,
  populationKey
}: {
  readonly limitSelectionToCounty: boolean;
  readonly metadata?: IStaticMetadata;
  readonly topGeoLevelName?: string;
  readonly electionYear: ElectionYear;
  readonly populationKey: GroupTotal;
}) => {
  const votingIds = metadata?.voting?.map(file => file.id) || [];
  const hasMultipleElections =
    votingIds.some(id => id.endsWith("16")) && votingIds.some(id => id.endsWith("20"));
  const populations =
    metadata?.demographicsGroups?.flatMap(group => (group.total ? [group.total] : [])) || [];
  const hasMultiplePopulationTotals = populations.length > 1;
  return (
    <Wrapper closeOnSelection={false}>
      <Tooltip content="Drawing options">
        <MenuButton sx={style.button}>
          <Icon name="cog" />
        </MenuButton>
      </Tooltip>
      <Menu sx={{ ...menuStyle.menu, p: 3 }}>
        <ul sx={menuStyle.menuList}>
          <li sx={style.menuItem}>
            <Heading as="h4">Drawing</Heading>
            <Label sx={style.inputLabel}>
              <Checkbox
                onChange={() => {
                  store.dispatch(toggleLimitDrawingToWithinCounty());
                }}
                defaultChecked={limitSelectionToCounty}
              />
              Limit drawing to within {topGeoLevelName}
            </Label>
          </li>
          {hasMultipleElections && (
            <li sx={style.menuItem}>
              <Heading as="h4">Tooltip</Heading>
              <legend>Election</legend>

              <Label sx={style.inputLabel}>
                <Radio
                  name="map-selection-election-year"
                  value="16"
                  checked={electionYear === "16"}
                  onChange={() => {
                    store.dispatch(setElectionYear("16"));
                  }}
                />
                Presidential 2016
              </Label>
              <Label sx={style.inputLabel}>
                <Radio
                  name="map-selection-election-year"
                  value="20"
                  checked={electionYear === "20"}
                  onChange={() => {
                    store.dispatch(setElectionYear("20"));
                  }}
                />
                <Box>Presidential 2020</Box>
              </Label>
            </li>
          )}
          {hasMultiplePopulationTotals && (
            <li>
              <Heading as="h4">Districts</Heading>
              <legend>Population</legend>
              {populations?.map(key => (
                <Label sx={style.inputLabel} key={key}>
                  <Radio
                    name="map-selection-population"
                    value={key}
                    checked={populationKey === key}
                    onChange={() => {
                      store.dispatch(setPopulationKey(key));
                    }}
                  />
                  {POPULATION_LABELS[key] || key}
                </Label>
              ))}
            </li>
          )}
        </ul>
      </Menu>
    </Wrapper>
  );
};

export default MapSelectionOptionsFlyout;
