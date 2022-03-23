/** @jsx jsx */
import React from "react";
import { Button as MenuButton, Menu, Wrapper } from "react-aria-menubutton";
import { connect } from "react-redux";
import { Box, Button, Heading, jsx } from "theme-ui";

import { IProject } from "../../../shared/entities";
import { projectSubmit } from "../../actions/projectData";
import { State } from "../../reducers";
import store from "../../store";
import Icon from "../Icon";
import { style as menuButtonStyle } from "../MenuButton.styles";

const SubmitMapButton = ({
  project,
  saving
}: {
  readonly project?: IProject;
  readonly saving: string;
}) => {
  const organization = project?.projectTemplate?.organization;
  const showButton = project?.submittedDt || project?.projectTemplate?.contestActive;
  return organization && showButton ? (
    <Wrapper sx={{ position: "relative", ml: 2 }}>
      <MenuButton
        sx={{
          ...menuButtonStyle.menuButton,
          ...{
            variant: project?.submittedDt ? "buttons.success" : "buttons.primary",
            fontWeight: "light",
            maxHeight: "34px"
          }
        }}
      >
        {project?.submittedDt ? (
          <React.Fragment>
            <Icon name="check" />
            Submitted
          </React.Fragment>
        ) : (
          "Submit"
        )}
      </MenuButton>
      <Menu sx={{ ...menuButtonStyle.menu, width: "450px", p: 2 }}>
        <Box>
          <Heading as="h3">Submit map</Heading>
          Submitting will send your map to {organization.name}
          <p sx={{ mt: 0 }}>The following things will happen:</p>
          <p>
            <Icon name={"lock-locked"} /> your map will be locked from making additional changes
          </p>
          <p>
            <Icon name={"pencil"} /> If you want to revise the map after submitting it, you can copy
            the map and make edits on the copy
          </p>
          <p>
            <Icon name={"link"} /> If your map is private, it will be switched to “shared with link”
            so the contest can see it
          </p>
          <Button
            disabled={saving === "saving"}
            sx={{
              variant: "buttons.primary"
            }}
            onClick={() => {
              store.dispatch(projectSubmit());
            }}
          >
            Submit
          </Button>
        </Box>
      </Menu>
    </Wrapper>
  ) : null;
};

function mapStateToProps(state: State) {
  return {
    saving: state.project.saving
  };
}

export default connect(mapStateToProps)(SubmitMapButton);
