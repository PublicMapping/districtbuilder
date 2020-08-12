/** @jsx jsx */
import { jsx } from "theme-ui";
import { toast } from "react-toastify";

import Toast from "../components/Toast";

const toastDefault = () => toast("You used a keyboard shortcut");
const toastInfo = () => toast.info("Project saved");
const toastSuccess = () => toast.success("You completed your map!");
const toastWarn = () => toast.warn("Non-contiguous district created");
const toastError = () => toast.error("Save failed");

const ToastDemo = () => {
  return (
    <div
      sx={{
        marginTop: "2vh",
        maxWidth: "900px",
        marginLeft: "auto",
        marginRight: "auto"
      }}
    >
      <Toast />
      <h1>Toast</h1>
      <p>
        Notifications for interactive, fullscreen mapping interfaces such as the{" "}
        <code>ProjectScreen</code>. For other pages, use the{" "}
        <a href="https://theme-ui.com/components/alert">Alert</a> component.
      </p>
      <p>
        Uses <a href="https://fkhadra.github.io/react-toastify/introduction">react-toastify</a>.
      </p>
      <button onClick={toastDefault}>Default</button>
      <button onClick={toastInfo}>Info</button>
      <button onClick={toastSuccess}>Success</button>
      <button onClick={toastWarn}>Warn</button>
      <button onClick={toastError}>Error</button>
    </div>
  );
};

export default ToastDemo;
