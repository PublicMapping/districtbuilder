/** @jsx jsx */
import { Box, Label, jsx, Select } from "theme-ui";
import { IStaticMetadata } from "../../shared/entities";

import Icon from "./Icon";
import { setGeolevel, Geolevel, setSelectionTool, SelectionTool } from "../actions/districtDrawing";
import store from "../store";

const MapHeader = ({
  label,
  setMapLabel,
  metadata,
  selectionTool,
  geolevel
}: {
  readonly label?: string;
  readonly setMapLabel: (label?: string) => void;
  readonly metadata?: IStaticMetadata;
  readonly selectionTool: SelectionTool;
  readonly geolevel: Geolevel;
}) => {
  const options = metadata
    ? metadata.demographics.map(val => <option key={val.id}>{val.id}</option>)
    : [];
  const buttonClassName = (isSelected: boolean) => `map-action ${isSelected ? "selected" : ""}`;
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
        <Box className="button-group">
          <button
            className={buttonClassName(geolevel === Geolevel.Counties)}
            onClick={() => store.dispatch(setGeolevel(Geolevel.Counties))}
          >
            Counties
          </button>
          <button
            className={buttonClassName(geolevel === Geolevel.Blockgroups)}
            onClick={() => store.dispatch(setGeolevel(Geolevel.Blockgroups))}
          >
            Blockgroups
          </button>
          <button
            className={buttonClassName(geolevel === Geolevel.Blocks)}
            onClick={() => store.dispatch(setGeolevel(Geolevel.Blocks))}
          >
            Blocks
          </button>
        </Box>
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
              {options}
            </Select>
          </Label>
        </Box>
      </Box>
    </Box>
  );
};

export default MapHeader;
