/** @jsx jsx */
import { jsx } from "theme-ui";
import { ToastContainer, cssTransition } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Toast.css";

const Fade = cssTransition({
  enter: "fadeIn",
  exit: "fadeOut",
  duration: 500
});

const Toast = () => {
  return (
    <ToastContainer
      position="bottom-center"
      autoClose={5000}
      hideProgressBar
      newestOnTop={true}
      transition={Fade}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
    />
  );
};

export default Toast;
