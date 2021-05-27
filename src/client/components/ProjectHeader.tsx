/** @jsx jsx */
import MapboxGL from "mapbox-gl";
import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { ReactComponent as Logo } from "../media/logos/mark-white.svg";

import { Box, Button, Flex, jsx, ThemeUIStyleObject } from "theme-ui";
import { IProject } from "../../shared/entities";
import { undo, redo, toggleFind, toggleEvaluate } from "../actions/districtDrawing";
import { heights } from "../theme";
import CopyMapButton from "../components/CopyMapButton";
import ExportMenu from "../components/ExportMenu";
import Icon from "../components/Icon";
import ProjectName from "../components/ProjectName";
import ShareMenu from "../components/ShareMenu";
import SupportMenu from "../components/SupportMenu";
import store from "../store";
import { State } from "../reducers";
import { UndoHistory } from "../reducers/undoRedo";

import { style as menuButtonStyle } from "./MenuButton.styles";

const style: ThemeUIStyleObject = {
  undoRedo: {
    variant: "buttons.icon",
    color: "muted"
  },
  projectHeader: {
    variant: "header.app",
    backgroundColor: "blue.8",
    borderBottom: "1px solid",
    borderColor: "blue.6"
  },
  menuButton: {
    color: "muted"
  }
};

const HeaderDivider = () => {
  return (
    <Box
      sx={{
        marginLeft: 3,
        paddingLeft: 3,
        height: heights.header,
        borderLeft: "1px solid rgba(255, 255, 255, 0.25)"
      }}
    />
  );
};

interface StateProps {
  readonly findMenuOpen: boolean;
  readonly evaluateMode: boolean;
  readonly undoHistory: UndoHistory;
}

const EvaluateButton = ({ evaluateMode }: { readonly evaluateMode: boolean }) => (
  <Box sx={{ position: "relative" }}>
    <Button
      sx={{
        ...{
          variant: "buttons.primary",
          fontWeight: "light",
          maxHeight: "34px",
          borderBottom: evaluateMode ? "solid 3px" : "none",
          borderBottomColor: "blue.2"
        },
        ...menuButtonStyle.menuButton
      }}
      onClick={() => store.dispatch(toggleEvaluate(!evaluateMode))}
    >
      <span
        sx={{
          mb: evaluateMode ? "-3px" : "0"
        }}
      >
        Evaluate
      </span>
    </Button>
  </Box>
);

const ProjectHeader = ({
  findMenuOpen,
  evaluateMode,
  map,
  project,
  isReadOnly,
  undoHistory
}: {
  readonly map?: MapboxGL.Map;
  readonly project?: IProject;
  readonly isReadOnly: boolean;
} & StateProps) => (
  <Flex sx={style.projectHeader}>
    <Flex sx={{ variant: "header.left" }}>
      <Link
        to="/"
        sx={{
          lineHeight: "0",
          borderRadius: "small",
          "&:focus": { outline: "none", boxShadow: "focus" }
        }}
      >
        <Logo sx={{ width: "1.75rem" }} />
      </Link>
      <HeaderDivider />
      {project ? <ProjectName project={project} isReadOnly={isReadOnly} /> : "..."}
    </Flex>
    <Flex sx={{ variant: "header.right" }}>
      {!isReadOnly ? (
        <React.Fragment>
          {map && (
            <React.Fragment>
              <Button
                sx={style.undoRedo}
                disabled={undoHistory.past.length === 0}
                onClick={() => store.dispatch(undo())}
              >
                <Icon name="undo" />
              </Button>
              <Button
                sx={{ ...style.undoRedo, mr: 4 }}
                disabled={undoHistory.future.length === 0}
                onClick={() => store.dispatch(redo())}
              >
                <Icon name="redo" />
              </Button>
            </React.Fragment>
          )}
          <ShareMenu invert={true} project={project} />
          <SupportMenu invert={true} />
          {project ? <ExportMenu invert={true} project={project} /> : null}
          <Box sx={{ position: "relative", mr: "5px" }}>
            <Button
              sx={{
                ...{
                  variant: "buttons.ghost",
                  fontWeight: "light"
                },
                ...menuButtonStyle.menuButton
              }}
              onClick={() => store.dispatch(toggleFind(!findMenuOpen))}
            >
              <Box
                sx={{
                  borderBottom: findMenuOpen ? "solid 1px" : "none",
                  borderBottomColor: "muted",
                  mb: findMenuOpen ? "-1px" : "0"
                }}
              >
                <Icon name="search" /> Find
              </Box>
            </Button>
          </Box>
          <EvaluateButton evaluateMode={evaluateMode} />
        </React.Fragment>
      ) : (
        <React.Fragment>
          <CopyMapButton invert={true} />
          {project && <ExportMenu invert={true} project={project} />}
          <EvaluateButton evaluateMode={evaluateMode} />
        </React.Fragment>
      )}
    </Flex>
  </Flex>
);

function mapStateToProps(state: State): StateProps {
  return {
    findMenuOpen: state.project.findMenuOpen,
    evaluateMode: state.project.evaluateMode,
    undoHistory: state.project.undoHistory
  };
}

export default connect(mapStateToProps)(ProjectHeader);
