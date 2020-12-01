/** @jsx jsx */
import { useState } from "react";
import AriaModal from "react-aria-modal";
import { connect } from "react-redux";
import { Redirect } from "react-router-dom";
import { Box, Button, Card, Flex, Heading, jsx, ThemeUIStyleObject } from "theme-ui";

import { InputField } from "../components/Field";
import FormError from "../components/FormError";
import { IProject } from "../../shared/entities";
import { showCopyMapModal } from "../actions/districtDrawing";
import { resetProjectState } from "../actions/root";
import { createProject } from "../api";
import { State } from "../reducers";
import store from "../store";
import { WriteResource } from "../resource";

const style: ThemeUIStyleObject = {
  cardLabel: {
    textTransform: "none",
    variant: "text.h4",
    display: "block",
    mb: 1
  },
  cardHint: {
    display: "block",
    textTransform: "none",
    fontWeight: "normal",
    fontSize: 1,
    mb: 4
  },
  footer: {
    flex: "auto",
    textAlign: "right",
    fontVariant: "tabular-nums",
    py: 2,
    mt: 2,
    fontSize: 1
  },
  header: {
    bg: "primary",
    padding: "16px 12px",
    margin: "-12px -12px 24px"
  },
  modal: {
    bg: "muted",
    p: 3,
    width: "medium",
    maxWidth: "34vw"
  }
};

const validate = (form: CopyMapForm) =>
  form.name.trim() !== ""
    ? ({ ...form, valid: true } as ValidForm)
    : ({ ...form, valid: false } as InvalidForm);

interface CopyMapForm {
  readonly name: string;
}

interface ValidForm {
  readonly name: string;
  readonly valid: true;
}

interface InvalidForm extends CopyMapForm {
  readonly valid: false;
}

const CopyMapModal = ({
  project,
  showModal
}: {
  readonly project: IProject;
  readonly showModal: boolean;
}) => {
  const hideModal = () => store.dispatch(showCopyMapModal(false));

  const [createProjectResource, setCreateProjectResource] = useState<
    WriteResource<CopyMapForm, IProject>
  >({
    data: {
      name: ""
    }
  });
  const { data } = createProjectResource;

  return "resource" in createProjectResource ? (
    <Redirect to={`/projects/${createProjectResource.resource.id}/`} />
  ) : showModal ? (
    <AriaModal
      titleId="copy-map-modal-header"
      onExit={hideModal}
      initialFocus="#cancel-copy-map-modal"
      getApplicationNode={() => document.getElementById("root") as Element}
      underlayStyle={{ paddingTop: "4.5rem" }}
    >
      <Box sx={style.modal}>
        <Box sx={style.header}>
          <Heading
            as="h3"
            sx={{ marginBottom: "0", fontWeight: "medium", display: "flex", alignItems: "center" }}
            id="copy-map-modal-header"
          >
            Copy Map
          </Heading>
        </Box>

        <Flex
          as="form"
          sx={{ flexDirection: "column" }}
          onSubmit={(e: React.FormEvent) => {
            e.preventDefault();
            const validatedForm = validate(data);
            // Disabling 'functional/no-conditional-statement' without naming it.
            // See https://github.com/jonaskello/eslint-plugin-functional/issues/105
            // eslint-disable-next-line
            if (validatedForm.valid) {
              setCreateProjectResource({ data, isPending: true });
              createProject({ ...project, name: validatedForm.name })
                .then((project: IProject) => {
                  setCreateProjectResource({ data, resource: project });

                  // Need to reset the project state here, so when the redirect kicks in we don't have any
                  // old state hanging around (undo history, etc.)
                  store.dispatch(resetProjectState());
                })
                .catch(errors => setCreateProjectResource({ data, errors }));
            }
          }}
        >
          <Card sx={{ variant: "card.flat" }}>
            <FormError resource={createProjectResource} />
            <InputField
              field="name"
              label={
                <Box as="span" sx={style.cardLabel}>
                  New map name
                </Box>
              }
              description={
                <Box as="span" sx={style.cardHint}>
                  e.g. ‘Arizona House of Representatives’. Make it specific to help tell your maps
                  apart.
                </Box>
              }
              resource={createProjectResource}
              inputProps={{
                onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                  setCreateProjectResource({
                    data: { ...data, name: e.currentTarget.value }
                  })
              }}
            />
          </Card>
          <Flex sx={style.footer}>
            <Button
              id="cancel-copy-map-modal"
              onClick={hideModal}
              sx={{ variant: "buttons.secondary", mr: 2 }}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={
                (("isPending" in createProjectResource && createProjectResource.isPending) ||
                  !validate(data).valid) &&
                !("errorMessage" in createProjectResource)
              }
            >
              Copy map
            </Button>
          </Flex>
        </Flex>
      </Box>
    </AriaModal>
  ) : null;
};

function mapStateToProps(state: State) {
  return {
    showModal: state.project.showCopyMapModal
  };
}

export default connect(mapStateToProps)(CopyMapModal);
