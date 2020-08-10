/** @jsx jsx */
import React, { useState } from "react";
import { Box, Label, jsx, Select } from "theme-ui";
import { GeoUnits, IStaticMetadata } from "../../shared/entities";
import { geoLevelLabel } from "../../shared/functions";

import Icon from "./Icon";
import { setGeoLevelIndex, setSelectionTool, SelectionTool } from "../actions/districtDrawing";
import store from "../store";

const buttonClassName = (isSelected: boolean) => `map-action ${isSelected ? "selected" : ""}`;
const zoomText = (index: number, geoLevelIndex: number) =>
  `Zoom ${index < geoLevelIndex ? "out" : "in"}`;

const GeoLevelButton = ({
  label,
  tooltip,
  ...otherProps
}: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & {
  readonly label: string;
  readonly tooltip: React.ReactNode;
}) => {
  return (
    <Box sx={{ display: "inline-block", position: "relative" }}>
      <button {...otherProps}>{label}</button>
      {tooltip}
    </Box>
  );
};

const MapHeader = ({
  label,
  setMapLabel,
  metadata,
  selectionTool,
  geoLevelIndex,
  geoLevelVisibility,
  selectedGeounits
}: {
  readonly label?: string;
  readonly setMapLabel: (label?: string) => void;
  readonly metadata?: IStaticMetadata;
  readonly selectionTool: SelectionTool;
  readonly geoLevelIndex: number;
  readonly geoLevelVisibility: readonly boolean[];
  readonly selectedGeounits: GeoUnits;
}) => {
  const labelOptions = metadata
    ? metadata.demographics.map(val => <option key={val.id}>{val.id}</option>)
    : [];
  const areGeoUnitsSelected = selectedGeounits.size > 0;
  const geoLevelOptions = metadata
    ? metadata.geoLevelHierarchy
        .slice()
        .reverse()
        .map((val, index, geoLevelHierarchy) => {
          const isGeoLevelHidden = geoLevelVisibility[index] === false;
          const isBaseGeoLevelSelected = geoLevelIndex === geoLevelHierarchy.length - 1;
          const isCurrentLevelBaseGeoLevel = index === geoLevelHierarchy.length - 1;
          const areChangesPending =
            areGeoUnitsSelected &&
            // block level selected, so disable all higher geolevels
            ((isBaseGeoLevelSelected && !isCurrentLevelBaseGeoLevel) ||
              // non-block level selected, so disable block level
              (!isBaseGeoLevelSelected && isCurrentLevelBaseGeoLevel));
          const isButtonDisabled = isGeoLevelHidden || areChangesPending;
          const tooltip = isButtonDisabled ? (
            <Box
              sx={{
                "button[disabled]:hover + &": {
                  display: "block"
                },
                display: "none",
                position: "absolute",
                backgroundColor: "white",
                right: "0",
                padding: "8px",
                top: "0",
                transform: "translateX(100%)",
                zIndex: 1,
                border: "1px solid",
                minWidth: 200,
                pointerEvents: "none"
              }}
            >
              {isGeoLevelHidden || areChangesPending ? (
                <span>
                  {isGeoLevelHidden && areChangesPending ? (
                    <span>
                      <strong>{zoomText(index, geoLevelIndex)}</strong> and{" "}
                      <strong>resolve changes</strong>
                    </span>
                  ) : isGeoLevelHidden ? (
                    <span>
                      <strong>{zoomText(index, geoLevelIndex)}</strong>
                    </span>
                  ) : (
                    <strong>Resolve changes</strong>
                  )}
                  &nbsp;to edit {geoLevelLabel(val.id).toLowerCase()}
                </span>
              ) : null}
            </Box>
          ) : null;
          return (
            <GeoLevelButton
              key={index}
              className={buttonClassName(geoLevelIndex === index)}
              onClick={() => store.dispatch(setGeoLevelIndex(index))}
              disabled={isButtonDisabled}
              label={geoLevelLabel(val.id)}
              tooltip={tooltip}
            />
          );
        })
    : [];
  return (
    <Box sx={{ variant: "header.app", backgroundColor: "white" }} className="map-actions">
      <Box className="actions-left">
        <Box className="button-group">
          <button
            className={buttonClassName(selectionTool === SelectionTool.Default)}
            onClick={() => store.dispatch(setSelectionTool(SelectionTool.Default))}
          >
            <Icon name="hand-pointer" />
          </button>
          <button
            className={buttonClassName(selectionTool === SelectionTool.Rectangle)}
            onClick={() => store.dispatch(setSelectionTool(SelectionTool.Rectangle))}
          >
            <Icon name="draw-square" />
          </button>
        </Box>
        <Box className="button-group">{geoLevelOptions}</Box>
      </Box>
      <Box className="actions-right">
        <Box className="dropdown">
          <Label>
            Label:
            <Select
              value={label}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                const label = e.currentTarget.value;
                setMapLabel(label);
              }}
            >
              <option></option>
              {labelOptions}
            </Select>
          </Label>
        </Box>
      </Box>
    </Box>
  );
};

export default MapHeader;
