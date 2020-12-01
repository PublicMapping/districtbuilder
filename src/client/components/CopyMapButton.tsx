/** @jsx jsx */
import { Button, jsx } from "theme-ui";
import { Wrapper } from "react-aria-menubutton";
import { style, invertStyles } from "./MenuButton.styles";
import store from "../store";
import { showAuthModal } from "../actions/districtDrawing";
//import { showCopyMapModal } from "../actions/districtDrawing";

interface CopyMapButtonProps {
  readonly invert?: boolean;
}

const CopyMapButton = (props: CopyMapButtonProps) => {
  return (
    <Wrapper sx={{ position: "relative", pr: 1 }}>
      <Button
        sx={{
          ...{ variant: "buttons.ghost", fontWeight: "light" },
          ...style.menuButton,
          ...invertStyles(props),
          ...props
        }}
        className="copyMap-menu"
        onClick={() => {
          //store.dispatch(showCopyMapModal(true));
          store.dispatch(showAuthModal(true));
        }}
      >
        Copy this map
      </Button>
    </Wrapper>
  );
};

export default CopyMapButton;
