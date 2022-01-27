/** @jsx jsx */
import { IOrganization, IUser, CreateProjectData } from "../../shared/entities";
import { Box, Heading, jsx, ThemeUIStyleObject } from "theme-ui";
import TemplateCard from "./TemplateCard";

interface Props {
  readonly organization: IOrganization;
  readonly user: IUser | undefined;
}

interface IProps {
  readonly templateSelected: (templateData: CreateProjectData) => Promise<void>;
}

const style: Record<string, ThemeUIStyleObject> = {
  templates: {
    py: 5
  },
  container: {
    flexDirection: "row",
    width: "large",
    mx: "auto",
    "> *": {
      mx: 5
    },
    "> *:last-of-type": {
      mr: 0
    },
    "> *:first-of-type": {
      ml: 0
    }
  },
  templateContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gridGap: "15px",
    justifyContent: "space-between",
    marginTop: "4"
  }
};

const OrganizationTemplates = ({ organization, user, templateSelected }: Props & IProps) => {
  return (
    <Box sx={style.container}>
      {organization.projectTemplates.length > 0 && (
        <Box sx={style.templates}>
          <Heading as="h2" sx={{ mb: "3" }}>
            Templates
          </Heading>
          Start a new map using the official settings from {organization.name}
          <Box sx={style.templateContainer}>
            {organization.projectTemplates.map(template => (
              <TemplateCard
                template={template}
                key={template.id}
                templateSelected={templateSelected}
                organization={organization}
                user={user}
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default OrganizationTemplates;
