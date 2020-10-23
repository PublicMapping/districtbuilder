/** @jsx jsx */
import MapboxGL from "mapbox-gl";
import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { ReactComponent as Logo } from "../media/logos/mark-white.svg";

import { Box, Button, Flex, jsx, Styled, ThemeUIStyleObject } from "theme-ui";
import { IProject } from "../../shared/entities";
import { undo, redo, toggleFind } from "../actions/districtDrawing";
import { heights } from "../theme";
import Icon from "../components/Icon";
import ProjectName from "../components/ProjectName";
import ShareMenu from "../components/ShareMenu";
import SupportMenu from "../components/SupportMenu";
import store from "../store";
import { State } from "../reducers";
import { UndoHistory } from "../reducers/districtDrawing";

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
  readonly undoHistory: UndoHistory;
}

const ProjectHeader = ({
  findMenuOpen,
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
      <ProjectName project={project} isReadOnly={isReadOnly} />
    </Flex>
    <Flex sx={{ variant: "header.right" }}>
      {!isReadOnly ? (
        <React.Fragment>
          {map && (
            <React.Fragment>
              <Button
                sx={style.undoRedo}
                disabled={undoHistory.past.length === 0}
                onClick={() => store.dispatch(undo(map))}
              >
                <Icon name="undo" />
              </Button>
              <Button
                sx={{ ...style.undoRedo, mr: 4 }}
                disabled={undoHistory.future.length === 0}
                onClick={() => store.dispatch(redo(map))}
              >
                <Icon name="redo" />
              </Button>
            </React.Fragment>
          )}
          <ShareMenu invert={true} />
          <SupportMenu invert={true} />
          <Box sx={{ position: "relative" }}>
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
        </React.Fragment>
      ) : (
        <Styled.a
          as={Link}
          to="/"
          sx={{
            color: "muted",
            fontWeight: "normal",
            "&:active": { color: "muted" }
          }}
        >
          Made with DistrictBuilder
        </Styled.a>
      )}
    </Flex>
  </Flex>
);

function mapStateToProps(state: State): StateProps {
  return {
    findMenuOpen: state.project.findMenuOpen,
    undoHistory: state.project.undoHistory
  };
}

export default connect(mapStateToProps)(ProjectHeader);
