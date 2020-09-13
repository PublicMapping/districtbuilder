/** @jsx jsx */
import { Flex, Box, Label, Button, jsx, Select, ThemeUIStyleObject } from "theme-ui";
import { GeoLevelInfo, GeoLevelHierarchy, GeoUnits, IStaticMetadata } from "../../shared/entities";
import { areAnyGeoUnitsSelected, geoLevelLabel } from "../functions";

import Icon from "./Icon";
import Tooltip from "./Tooltip";
import {
  setGeoLevelIndex,
  setSelectionTool,
  SelectionTool,
  showAdvancedEditingModal
} from "../actions/districtDrawing";
import store from "../store";

const style: ThemeUIStyleObject = {
  header: {
    variant: "header.app",
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "space-between",
    px: 2,
    py: 1,
    borderBottom: "1px solid",
    borderColor: "gray.2",
    boxShadow: "small"
  },
  selectionButton: {
    variant: "buttons.outlined",
    fontSize: 1,
    py: 1,
    "&.selected": {
      bg: "blue.0",
      borderColor: "blue.2",
      borderBottom: "2px solid",
      borderBottomColor: "blue.5",
      color: "blue.8"
    }
  },
  rightCapButton: {
    variant: "buttons.outlined",
    py: 1,
    borderTopRightRadius: "0",
    borderBottomRightRadius: "0",
    mr: "1px",
    "& > svg": {
      mr: "0"
    }
  },
  leftCapButton: {
    variant: "buttons.outlined",
    py: 1,
    borderTopLeftRadius: "0",
    borderBottomLeftRadius: "0",
    "& > svg": {
      mr: "0"
    }
  }
};

const buttonClassName = (isSelected: boolean) => `${isSelected ? "selected" : ""}`;

const GeoLevelTooltip = ({
  areChangesPending,
  label
}: {
  readonly areChangesPending: boolean;
  readonly label: string;
}) => {
  const zoomText = "Zoom in";
  return (
    <span>
      <strong>Disabled: </strong>
      Resolve changes to edit {label.toLowerCase()}
    </span>
  );
};

const GeoLevelButton = ({
  index,
  value,
  geoLevelIndex,
  geoLevelHierarchy,
  geoLevelVisibility,
  selectedGeounits,
  advancedEditingEnabled
}: {
  readonly index: number;
  readonly value: GeoLevelInfo;
  readonly geoLevelIndex: number;
  readonly geoLevelHierarchy: GeoLevelHierarchy;
  readonly geoLevelVisibility: readonly boolean[];
  readonly selectedGeounits: GeoUnits;
  readonly advancedEditingEnabled?: boolean;
}) => {
  const label = geoLevelLabel(value.id);
  const areGeoUnitsSelected = areAnyGeoUnitsSelected(selectedGeounits);
  const isBaseGeoLevelSelected = geoLevelIndex === geoLevelHierarchy.length - 1;
  const isCurrentLevelBaseGeoLevel = index === geoLevelHierarchy.length - 1;
  const areChangesPending =
    areGeoUnitsSelected &&
    // block level selected, so disable all higher geolevels
    ((isBaseGeoLevelSelected && !isCurrentLevelBaseGeoLevel) ||
      // non-block level selected, so disable block level
      (!isBaseGeoLevelSelected && isCurrentLevelBaseGeoLevel));
  // Always show the currently selected geolevel, even if it would otherwise be hidden
  const isCurrentLevelSelected = index === geoLevelIndex;
  const isButtonDisabled = !isCurrentLevelSelected && areChangesPending;

  return (
    <Box sx={{ display: "inline-block", position: "relative" }} className="button-wrapper">
      <Tooltip
        key={index}
        content={
          isButtonDisabled ? (
            <GeoLevelTooltip areChangesPending={areChangesPending} label={label} />
          ) : (
            `Select ${label.toLowerCase()}`
          )
        }
      >
        <span>
          <Button
            key={index}
            sx={{ ...style.selectionButton, ...{ mr: "1px" } }}
            className={buttonClassName(geoLevelIndex === index)}
            onClick={() =>
              store.dispatch(
                !isCurrentLevelBaseGeoLevel || advancedEditingEnabled
                  ? setGeoLevelIndex(index)
                  : showAdvancedEditingModal(true)
              )
            }
            disabled={isButtonDisabled}
          >
            {label}
          </Button>
        </span>
      </Tooltip>
    </Box>
  );
};

const capitalizeFirstLetter = (s: string) => s.substring(0, 1).toUpperCase() + s.substring(1);

const MapHeader = ({
  label,
  setMapLabel,
  metadata,
  selectionTool,
  geoLevelIndex,
  geoLevelVisibility,
  selectedGeounits,
  advancedEditingEnabled
}: {
  readonly label?: string;
  readonly setMapLabel: (label?: string) => void;
  readonly metadata?: IStaticMetadata;
  readonly selectionTool: SelectionTool;
  readonly geoLevelIndex: number;
  readonly geoLevelVisibility: readonly boolean[];
  readonly selectedGeounits: GeoUnits;
  readonly advancedEditingEnabled?: boolean;
}) => {
  const labelOptions = metadata
    ? metadata.demographics.map(val => (
        <option key={val.id} value={val.id}>
          {capitalizeFirstLetter(val.id)}
        </option>
      ))
    : [];
  const geoLevelOptions = metadata
    ? metadata.geoLevelHierarchy
        .slice()
        .reverse()
        .map((val, index, geoLevelHierarchy) => (
          <GeoLevelButton
            key={index}
            index={index}
            value={val}
            geoLevelIndex={geoLevelIndex}
            geoLevelHierarchy={geoLevelHierarchy}
            geoLevelVisibility={geoLevelVisibility}
            selectedGeounits={selectedGeounits}
            advancedEditingEnabled={advancedEditingEnabled}
          />
        ))
    : [];
  return (
    <Flex sx={style.header}>
      <Flex>
        <Flex sx={{ mr: 3 }}>
          <Tooltip content="Point-and-click selection">
            <Button
              sx={{ ...style.selectionButton, ...style.rightCapButton }}
              className={buttonClassName(selectionTool === SelectionTool.Default)}
              onClick={() => store.dispatch(setSelectionTool(SelectionTool.Default))}
            >
              <Icon name="hand-pointer" />
            </Button>
          </Tooltip>
          <Tooltip content="Rectangle selection">
            <Button
              sx={{ ...style.selectionButton, ...style.leftCapButton }}
              className={buttonClassName(selectionTool === SelectionTool.Rectangle)}
              onClick={() => store.dispatch(setSelectionTool(SelectionTool.Rectangle))}
            >
              <Icon name="draw-square" />
            </Button>
          </Tooltip>
        </Flex>
        <Flex>{geoLevelOptions}</Flex>
      </Flex>
      <Box sx={{ lineHeight: "1" }}>
        <Flex sx={{ alignItems: "baseline" }}>
          <Label
            htmlFor="population-dropdown"
            sx={{ display: "inline-block", width: "auto", mb: 0, mr: 2 }}
          >
            Labels:
          </Label>
          <Select
            id="population-dropdown"
            value={label}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              const label = e.currentTarget.value;
              setMapLabel(label);
            }}
            sx={{ width: "150px" }}
          >
            <option>Select...</option>
            {labelOptions}
          </Select>
        </Flex>
      </Box>
    </Flex>
  );
};

export default MapHeader;
