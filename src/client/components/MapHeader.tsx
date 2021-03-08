/** @jsx jsx */
import { Flex, Box, Label, Button, jsx, Select, ThemeUIStyleObject } from "theme-ui";
import { GeoLevelInfo, GeoLevelHierarchy, GeoUnits, IStaticMetadata } from "../../shared/entities";
import { areAnyGeoUnitsSelected, geoLevelLabel, isBaseGeoLevelAlwaysVisible } from "../functions";

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
  buttonGroup: {
    button: {
      margin: "0 !important"
    },
    "& button > svg": {
      marginRight: "0"
    },
    "&:not(:last-of-type):not(:first-of-type) > span > button, & > button:not(:last-of-type):not(:first-of-type)": {
      borderRadius: 0,
      borderLeftWidth: 0
    },
    "&:first-of-type > span > button, & > button:first-of-type": {
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0
    },
    "&:last-of-type > span > button, & > button:last-of-type": {
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0,
      borderLeftWidth: 0
    },
    "&:not(:last-of-type):not(:first-of-type) > span > button[disabled], & > button:not(:last-of-type):not(:first-of-type)[disabled]": {
      borderRightColor: "blue.7"
    }
  },
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
  }
};

const buttonClassName = (isSelected: boolean) => `${isSelected ? "selected" : ""}`;

const GeoLevelTooltip = ({ label }: { readonly label: string }) => {
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
  selectedGeounits,
  advancedEditingEnabled,
  isReadOnly
}: {
  readonly index: number;
  readonly value: GeoLevelInfo;
  readonly geoLevelIndex: number;
  readonly geoLevelHierarchy: GeoLevelHierarchy;
  readonly selectedGeounits: GeoUnits;
  readonly advancedEditingEnabled?: boolean;
  readonly isReadOnly: boolean;
}) => {
  const label = geoLevelLabel(value.id);
  const areGeoUnitsSelected = areAnyGeoUnitsSelected(selectedGeounits);
  const isBaseLevelAlwaysVisible = isBaseGeoLevelAlwaysVisible(geoLevelHierarchy);
  const isBaseGeoLevelSelected = geoLevelIndex === geoLevelHierarchy.length - 1;
  const isCurrentLevelBaseGeoLevel = index === geoLevelHierarchy.length - 1;
  const areChangesPending =
    !isBaseLevelAlwaysVisible &&
    areGeoUnitsSelected &&
    // block level selected, so disable all higher geolevels
    ((isBaseGeoLevelSelected && !isCurrentLevelBaseGeoLevel) ||
      // non-block level selected, so disable block level
      (!isBaseGeoLevelSelected && isCurrentLevelBaseGeoLevel));
  // Always show the currently selected geolevel, even if it would otherwise be hidden
  const isCurrentLevelSelected = index === geoLevelIndex;
  const isButtonDisabled = !isCurrentLevelSelected && areChangesPending;

  return (
    <Box sx={{ ...style.buttonGroup, ...{ display: "inline-block", position: "relative" } }}>
      <Tooltip
        key={index}
        content={
          isButtonDisabled ? <GeoLevelTooltip label={label} /> : `Select ${label.toLowerCase()}`
        }
      >
        <span>
          <Button
            key={index}
            sx={{ ...style.selectionButton, ...{ mr: "1px" } }}
            className={buttonClassName(geoLevelIndex === index)}
            onClick={() =>
              store.dispatch(
                !isCurrentLevelBaseGeoLevel ||
                  isReadOnly ||
                  advancedEditingEnabled ||
                  isBaseLevelAlwaysVisible
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
  selectedGeounits,
  advancedEditingEnabled,
  isReadOnly
}: {
  readonly label?: string;
  readonly setMapLabel: (label?: string) => void;
  readonly metadata?: IStaticMetadata;
  readonly selectionTool: SelectionTool;
  readonly geoLevelIndex: number;
  readonly selectedGeounits: GeoUnits;
  readonly advancedEditingEnabled?: boolean;
  readonly isReadOnly: boolean;
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
            selectedGeounits={selectedGeounits}
            advancedEditingEnabled={advancedEditingEnabled}
            isReadOnly={isReadOnly}
          />
        ))
    : [];
  return (
    <Flex sx={style.header}>
      <Flex>
        {!isReadOnly && (
          <Flex sx={{ ...style.buttonGroup, mr: 3 }}>
            <Tooltip content="Point-and-click selection">
              <Button
                sx={{ ...style.selectionButton }}
                className={buttonClassName(selectionTool === SelectionTool.Default)}
                onClick={() => store.dispatch(setSelectionTool(SelectionTool.Default))}
              >
                <Icon name="hand-pointer" />
              </Button>
            </Tooltip>
            <Tooltip content="Rectangle selection">
              <Button
                sx={{ ...style.selectionButton }}
                className={buttonClassName(selectionTool === SelectionTool.Rectangle)}
                onClick={() => store.dispatch(setSelectionTool(SelectionTool.Rectangle))}
              >
                <Icon name="draw-square" />
              </Button>
            </Tooltip>
            <Tooltip content="Paint brush selection">
              <Button
                sx={{ ...style.selectionButton }}
                className={buttonClassName(selectionTool === SelectionTool.PaintBrush)}
                onClick={() => store.dispatch(setSelectionTool(SelectionTool.PaintBrush))}
              >
                <Icon name="paint-brush" />
              </Button>
            </Tooltip>
          </Flex>
        )}
        <Flex className="geolevel-button-group">{geoLevelOptions}</Flex>
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
