/** @jsx jsx */
import { Box, Label, jsx, Select } from "theme-ui";
import { IStaticMetadata } from "../../shared/entities";

import Icon from "./Icon";
import { setGeoLevelIndex, setSelectionTool, SelectionTool } from "../actions/districtDrawing";
import store from "../store";

const MapHeader = ({
  label,
  setMapLabel,
  metadata,
  selectionTool,
  geoLevelIndex,
  isBaseGeoUnitVisible
}: {
  readonly label?: string;
  readonly setMapLabel: (label?: string) => void;
  readonly metadata?: IStaticMetadata;
  readonly selectionTool: SelectionTool;
  readonly geoLevelIndex: number;
  readonly isBaseGeoUnitVisible: boolean;
}) => {
  const labelOptions = metadata
    ? metadata.demographics.map(val => <option key={val.id}>{val.id}</option>)
    : [];
  const buttonClassName = (isSelected: boolean) => `map-action ${isSelected ? "selected" : ""}`;
  const geoLevelOptions = metadata
    ? metadata.geoLevelHierarchy
        .slice()
        .reverse()
        .map((val, index) => {
          const isButtonDisabled =
            index === metadata.geoLevelHierarchy.length - 1 && !isBaseGeoUnitVisible;
          const otherProps = isButtonDisabled ? { title: "Zoom in to see blocks" } : {};
          return (
            <button
              key={index}
              className={buttonClassName(geoLevelIndex === index)}
              onClick={() => store.dispatch(setGeoLevelIndex(index))}
              disabled={isButtonDisabled}
              {...otherProps}
            >
              {val.id}
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
