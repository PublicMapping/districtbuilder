/** @jsx jsx */
import AriaModal from "react-aria-modal";
import { Box, Button, Flex, Heading, jsx } from "theme-ui";

import Icon from "./Icon";
import { IOrganization } from "../../shared/entities";
import store from "../store";
import { archiveTemplate, setArchiveTemplate } from "../actions/organization";

interface Props {
  readonly org: IOrganization;
}

const ArchiveTemplateModal = ({ org }: Props) => {
  const hideModal = () => store.dispatch(setArchiveTemplate(undefined));
  const { deleteTemplate: template, archiveTemplatePending: isPending, slug } = org;

  return template !== undefined && slug ? (
    <AriaModal
      titleId="delete-project-modal-header"
      onExit={hideModal}
      initialFocus="#cancel-delete-project"
      getApplicationNode={() => document.getElementById("root") as Element}
      underlayStyle={{ paddingTop: "4.5rem" }}
    >
      <Box sx={{ variant: "styles.confirmationModal.modal" }}>
        <Box sx={{ variant: "styles.confirmationModal.errorHeader" }}>
          <Heading
            as="h3"
            sx={{
              marginBottom: "0",
              fontWeight: "medium",
              display: "flex",
              alignItems: "center",
              color: "muted"
            }}
            id="delete-project-modal-header"
          >
            <span sx={{ fontSize: 4, mr: 2, display: "flex" }}>
              <Icon name="alert-triangle" />
            </span>
            Delete Template
          </Heading>
        </Box>
        <Box>
          <p>{`Are you sure you want to delete “${template.name}”? This can’t be undone.`}</p>
        </Box>
        <Flex sx={{ variant: "styles.confirmationModal.footer" }}>
          <Button
            id="cancel-delete-project"
            onClick={hideModal}
            sx={{ variant: "buttons.secondary", mr: 2 }}
          >
            Cancel
          </Button>
          <Button
            sx={{ variant: "buttons.danger" }}
            disabled={isPending}
            onClick={() => {
              store.dispatch(archiveTemplate({ id: template.id, slug: slug }));
              return;
            }}
          >
            Delete
          </Button>
        </Flex>
      </Box>
    </AriaModal>
  ) : null;
};

export default ArchiveTemplateModal;
