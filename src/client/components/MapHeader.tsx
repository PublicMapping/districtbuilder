/** @jsx jsx */
import { Box, Label, jsx, Select } from "theme-ui";
import { GeoUnits, IStaticMetadata } from "../../shared/entities";
import { geoLevelLabel } from "../../shared/functions";

import Icon from "./Icon";
import { setGeoLevelIndex, setSelectionTool, SelectionTool } from "../actions/districtDrawing";
import store from "../store";

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
  const buttonClassName = (isSelected: boolean) => `map-action ${isSelected ? "selected" : ""}`;
  const areGeoUnitsSelected = selectedGeounits.size > 0;
  const geoLevelOptions = metadata
    ? metadata.geoLevelHierarchy
        .slice()
        .reverse()
        .map((val, index, geoLevelHierarchy) => {
          const isButtonDisabled =
            geoLevelVisibility[index] === false ||
            (areGeoUnitsSelected &&
              // block level selected, so disable all higher geolevels
              ((index < geoLevelIndex && geoLevelIndex === geoLevelHierarchy.length - 1) ||
                // non-block level selected, so disable block level
                (index === geoLevelHierarchy.length - 1 &&
                  geoLevelIndex !== geoLevelHierarchy.length - 1)));
          const otherProps = isButtonDisabled
            ? { title: `Zoom in to see ${geoLevelLabel(val.id).toLowerCase()}` }
            : {};
          return (
            <button
              key={index}
              className={buttonClassName(geoLevelIndex === index)}
              onClick={() => store.dispatch(setGeoLevelIndex(index))}
              disabled={isButtonDisabled}
              {...otherProps}
            >
              {geoLevelLabel(val.id)}
            </button>
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
