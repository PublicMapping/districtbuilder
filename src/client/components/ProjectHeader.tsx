/** @jsx jsx */
import MapboxGL from "mapbox-gl";
import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { ReactComponent as Logo } from "../media/logos/mark-white.svg";

import { Box, Button, Flex, jsx, Text, ThemeUIStyleObject } from "theme-ui";
import { IProject } from "../../shared/entities";
import { undo, redo } from "../actions/districtDrawing";
import { heights } from "../theme";
import Icon from "../components/Icon";
import ShareMenu from "../components/ShareMenu";
import SupportMenu from "../components/SupportMenu";
import store from "../store";
import { State } from "../reducers";
import { UndoHistory } from "../reducers/districtDrawing";

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

interface SupportProps {
  readonly invert?: boolean;
}

interface StateProps {
  readonly undoHistory: UndoHistory;
}

const ProjectHeader = ({
  map,
  project,
  undoHistory
}: { readonly map?: MapboxGL.Map; readonly project?: IProject } & SupportProps & StateProps) => (
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
      <Flex
        sx={{
          color: "#fff",
          alignItems: "center"
        }}
      >
        <Text as="h1" sx={{ variant: "header.title", m: 0 }}>
          {project ? project.name : "..."}
        </Text>
      </Flex>
    </Flex>
    <Flex sx={{ variant: "header.right" }}>
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
            sx={{ ...style.undoRedo, pr: 4 }}
            disabled={undoHistory.future.length === 0}
            onClick={() => store.dispatch(redo(map))}
          >
            <Icon name="redo" />
          </Button>
        </React.Fragment>
      )}
      <ShareMenu invert={true} />
      <SupportMenu invert={true} />
    </Flex>
  </Flex>
);

function mapStateToProps(state: State): StateProps {
  return {
    undoHistory: state.project.undoHistory
  };
}

export default connect(mapStateToProps)(ProjectHeader);
