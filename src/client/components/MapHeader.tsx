/** @jsx jsx */
import React, { useEffect, useState } from "react";
import { Flex, Box, Label, Button, jsx, Select, Slider, ThemeUIStyleObject } from "theme-ui";
import { GeoLevelInfo, GeoLevelHierarchy, GeoUnits, IStaticMetadata } from "../../shared/entities";
import { ElectionYear } from "../types";
import { toggleFind } from "../actions/districtDrawing";
import { geoLevelLabel, capitalizeFirstLetter, canSwitchGeoLevels } from "../functions";
import MapSelectionOptionsFlyout from "./MapSelectionOptionsFlyout";

import Icon from "./Icon";
import Tooltip from "./Tooltip";
import {
  setGeoLevelIndex,
  setSelectionTool,
  SelectionTool,
  PaintBrushSize,
  setPaintBrushSize,
  setMapLabel
} from "../actions/districtDrawing";
import store from "../store";
import icons from "../icons";

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
  },
  sliderContainer: {
    position: "absolute",
    display: "flex",
    backgroundColor: "#fff",
    borderRadius: "2px",
    border: "1px solid",
    borderColor: "gray.2",
    padding: "5px",
    top: "100px",
    zIndex: 1,
    justifyContent: "space-evenly",
    width: "300px"
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
  isReadOnly
}: {
  readonly index: number;
  readonly value: GeoLevelInfo;
  readonly geoLevelIndex: number;
  readonly geoLevelHierarchy: GeoLevelHierarchy;
  readonly selectedGeounits: GeoUnits;
  readonly isReadOnly: boolean;
}) => {
  const label = geoLevelLabel(value.id);
  const canSwitch = canSwitchGeoLevels(geoLevelIndex, index, geoLevelHierarchy, selectedGeounits);
  // Always show the currently selected geolevel, even if it would otherwise be disabled
  const isCurrentLevelSelected = index === geoLevelIndex;
  const isButtonDisabled = !isCurrentLevelSelected && !canSwitch;

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
            onClick={() => store.dispatch(setGeoLevelIndex({ index, isReadOnly }))}
            disabled={isButtonDisabled}
          >
            {label}
          </Button>
        </span>
      </Tooltip>
    </Box>
  );
};

const MapHeader = ({
  label,
  metadata,
  selectionTool,
  paintBrushSize,
  geoLevelIndex,
  findMenuOpen,
  selectedGeounits,
  isReadOnly,
  limitSelectionToCounty,
  electionYear
}: {
  readonly label?: string;
  readonly metadata?: IStaticMetadata;
  readonly selectionTool: SelectionTool;
  readonly paintBrushSize: PaintBrushSize;
  readonly geoLevelIndex: number;
  readonly selectedGeounits: GeoUnits;
  readonly advancedEditingEnabled?: boolean;
  readonly isReadOnly: boolean;
  readonly findMenuOpen: boolean;
  readonly limitSelectionToCounty: boolean;
  readonly electionYear: ElectionYear;
}) => {
  const [isPaintBrushSizeSliderVisible, setPaintBrushSizeSliderVisibility] = useState(false);
  const topGeoLevelName = metadata
    ? metadata.geoLevelHierarchy[metadata.geoLevelHierarchy.length - 1].id
    : undefined;
  const labelFields =
    metadata && metadata.demographics
      ? [
          ...metadata.demographics.map(file => {
            return {
              id: file.id,
              label: file.id
            };
          }),
          ...(metadata.voting
            ? metadata.voting.map(file => {
                return {
                  id: file.id,
                  // Fix suffix on voting IDs if needed
                  label:
                    file.id.endsWith("16") || file.id.endsWith("20")
                      ? file.id.slice(0, -2) + " '" + file.id.slice(-2)
                      : file.id
                };
              })
            : [])
        ]
      : undefined;

  // Close paintbrush slider if the user switches to another tool, open it if toggled from another tool
  useEffect(() => {
    if (selectionTool !== SelectionTool.PaintBrush) {
      setPaintBrushSizeSliderVisibility(false);
    } else {
      setPaintBrushSizeSliderVisibility(true);
    }
  }, [selectionTool]);

  const labelOptions = labelFields
    ? labelFields.map(val => (
        <option key={val.id} value={val.id}>
          {capitalizeFirstLetter(val.label)}
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
            isReadOnly={isReadOnly}
          />
        ))
    : [];
  const selectionToolIcons: ReadonlyArray<{
    readonly tooltipContent: string;
    readonly tool: SelectionTool;
    readonly iconName: keyof typeof icons;
  }> = [
    {
      tooltipContent: "Point-and-click selection",
      tool: SelectionTool.Default,
      iconName: "hand-pointer"
    },
    {
      tooltipContent: "Rectangle selection",
      tool: SelectionTool.Rectangle,
      iconName: "draw-square"
    },
    {
      tooltipContent: "Paint brush selection",
      tool: SelectionTool.PaintBrush,
      iconName: "paint-brush"
    }
  ];
  return (
    <Flex sx={style.header}>
      <Flex sx={{ flex: 1 }}>
        {!isReadOnly && (
          <React.Fragment>
            <Flex sx={{ ...style.buttonGroup, mr: 2 }}>
              {selectionToolIcons.map(({ tooltipContent, tool, iconName }) => (
                <Tooltip key={iconName} content={tooltipContent}>
                  <Button
                    sx={{ ...style.selectionButton }}
                    className={buttonClassName(selectionTool === tool)}
                    onClick={() => {
                      // Open slider on click if not already open
                      setPaintBrushSizeSliderVisibility(tool === SelectionTool.PaintBrush);
                      store.dispatch(setSelectionTool(tool));
                    }}
                  >
                    <Icon name={iconName} />
                  </Button>
                </Tooltip>
              ))}
            </Flex>
            {isPaintBrushSizeSliderVisible ? (
              <Box sx={style.sliderContainer}>
                <Box sx={{ flexShrink: 0 }}>Brush size</Box>
                <Slider
                  min={1}
                  max={5}
                  step={1}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    store.dispatch(
                      setPaintBrushSize(parseInt(e.target.value, 10) as PaintBrushSize)
                    );
                  }}
                  sx={{ width: "150px" }}
                  value={paintBrushSize}
                />
                <Box>{paintBrushSize}</Box>
              </Box>
            ) : null}

            <Box sx={{ position: "relative", mr: 3, pt: "6px" }}>
              <MapSelectionOptionsFlyout
                limitSelectionToCounty={limitSelectionToCounty}
                topGeoLevelName={topGeoLevelName}
                metadata={metadata}
                electionYear={electionYear}
              />
            </Box>
          </React.Fragment>
        )}
        <Flex className="geolevel-button-group">{geoLevelOptions}</Flex>
      </Flex>
      <Box sx={{ lineHeight: "1" }}>
        <Flex sx={{ alignItems: "baseline" }}>
          <Label
            htmlFor="population-dropdown"
            sx={{ display: "none", width: "auto", mb: 0, mr: 2 }}
          >
            Labels:
          </Label>
          <Select
            id="population-dropdown"
            value={label || "Select..."}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              const label = e.currentTarget.value;
              store.dispatch(setMapLabel(label));
            }}
            sx={{ width: "auto", paddingRight: "30px", fontSize: 1 }}
          >
            <option>Labels ...</option>
            {labelOptions}
          </Select>
        </Flex>
      </Box>
      <Box
        sx={{
          position: "relative",
          ml: 3,
          pl: 2,
          color: "gray.7",
          borderLeft: "1px solid",
          borderLeftColor: "gray.2"
        }}
      >
        <Tooltip content="Find">
          <Button
            sx={{
              variant: "buttons.icon",
              fontSize: 1,
              py: 1,
              color: "gray.7",
              border: "1px solid transparent",
              "&:hover:not([disabled]):not(:active).selected, &.selected": {
                bg: "blue.1",
                color: "gray.7",
                opacity: 1,
                borderColor: "gray.2"
              }
            }}
            onClick={() => {
              store.dispatch(toggleFind(!findMenuOpen));
            }}
            className={findMenuOpen ? "selected" : ""}
          >
            <Icon name="search" />
          </Button>
        </Tooltip>
      </Box>
    </Flex>
  );
};

export default MapHeader;
