/** @jsx jsx */
import { jsx } from "theme-ui";

import Tippy, { TippyProps } from "@tippyjs/react";
import "tippy.js/dist/tippy.css";

const tippySettings: TippyProps = {
  delay: [500, 0],
  duration: 0,
  animation: "none",
  maxWidth: 280
};

const Tooltip = (props: TippyProps) => {
  return (
    <Tippy {...tippySettings} {...props}>
      {props.children}
    </Tippy>
  );
};

export default Tooltip;
