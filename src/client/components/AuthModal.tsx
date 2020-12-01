/** @jsx jsx */
import { useState } from "react";
import AriaModal from "react-aria-modal";
import { connect } from "react-redux";
import { Box, Button, Flex, Heading, jsx, ThemeUIStyleObject } from "theme-ui";

import { assertNever } from "../functions";
import { IProject } from "../../shared/entities";
import { showAuthModal } from "../actions/districtDrawing";
import { State } from "../reducers";
import store from "../store";

const style: ThemeUIStyleObject = {
  footer: {
    flex: "auto",
    textAlign: "center",
    fontVariant: "tabular-nums",
    py: 2,
    mt: 2,
    fontSize: 1
  },
  footerButton: {
    width: "100%"
  },
  header: {
    padding: "16px 12px",
    margin: "-12px -12px 24px"
  },
  link: {
    cursor: "pointer",
    color: "blue.5"
  },
  modal: {
    bg: "muted",
    p: 3,
    width: "small",
    maxWidth: "90vw"
  }
};

type ModalIntent = "initial" | "register" | "login";

const AuthModal = ({
  project,
  showModal
}: {
  readonly project: IProject;
  readonly showModal: boolean;
}) => {
  const [modalIntent, setModalIntent] = useState<ModalIntent>("initial");
  const hideModal = () => {
    setModalIntent("initial");
    store.dispatch(showAuthModal(false));
  };

  const initialContent = (
    <Box sx={style.modal}>
      <Box sx={style.header}>
        <Heading
          as="h3"
          sx={{ marginBottom: "0", fontWeight: "medium", display: "flex", alignItems: "center" }}
          id="auth-modal-header"
        >
          {project.user.name} builds maps with DistrictBuilder
        </Heading>
      </Box>
      <Box>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt
          ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation
          ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
        <ul>
          <li>100% free to use, forever</li>
          <li>Makes district drawing easy</li>
          <li>Another selling point to convince user that this is good</li>
        </ul>
      </Box>
      <Flex sx={style.footer}>
        <Button
          sx={style.footerButton}
          onClick={() => {
            console.log("create account clicked");
            setModalIntent("register");
          }}
        >
          Create a free account
        </Button>
      </Flex>
      <p sx={style.footer}>
        Already have an account?{" "}
        <span
          sx={style.link}
          onClick={() => {
            console.log("log in clicked");
            setModalIntent("login");
          }}
        >
          Log in
        </span>
      </p>
    </Box>
  );

  const registerContent = (
    <Box sx={style.modal}>
      <Box sx={style.header}>
        <Heading
          as="h3"
          sx={{ marginBottom: "0", fontWeight: "medium", display: "flex", alignItems: "center" }}
          id="auth-modal-header"
        >
          Register
        </Heading>
      </Box>
      <Box>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt
          ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation
          ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
      </Box>
    </Box>
  );

  const loginContent = (
    <Box sx={style.modal}>
      <Box sx={style.header}>
        <Heading
          as="h3"
          sx={{ marginBottom: "0", fontWeight: "medium", display: "flex", alignItems: "center" }}
          id="auth-modal-header"
        >
          Login
        </Heading>
      </Box>
      <Box>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt
          ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation
          ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
      </Box>
    </Box>
  );

  return showModal ? (
    <AriaModal
      titleId="auth-modal-header"
      onExit={hideModal}
      initialFocus="#auth-modal-header"
      getApplicationNode={() => document.getElementById("root") as Element}
      underlayStyle={{ paddingTop: "4.5rem" }}
    >
      {modalIntent === "initial"
        ? initialContent
        : modalIntent === "register"
        ? registerContent
        : modalIntent === "login"
        ? loginContent
        : assertNever(modalIntent)}
    </AriaModal>
  ) : null;
};

function mapStateToProps(state: State) {
  return {
    showModal: state.project.showAuthModal
  };
}

export default connect(mapStateToProps)(AuthModal);
