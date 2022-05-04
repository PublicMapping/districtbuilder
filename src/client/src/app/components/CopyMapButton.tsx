/** @jsx jsx */
import { Button, jsx } from "theme-ui";
import { Wrapper } from "react-aria-menubutton";
import { style } from "./MenuButton.styles";
import store from "../store";
import { showCopyMapModal } from "../actions/projectModals";

interface CopyMapButtonProps {
  readonly invert?: boolean;
}

const CopyMapButton = (props: CopyMapButtonProps) => {
  return (
    <Wrapper sx={{ position: "relative", pr: 1 }}>
      <Button
        sx={{
          ...{ variant: props.invert ? "buttons.ghost" : "buttons.linkStyle", fontWeight: "light" },
          ...style.menuButton
        }}
        className="copyMap-menu"
        onClick={() => {
          store.dispatch(showCopyMapModal(true));
        }}
      >
        Copy this map
      </Button>
    </Wrapper>
  );
};

export default CopyMapButton;
