/** @jsx jsx */
import { Box, Card, Heading, jsx } from "theme-ui";

import CenteredContent from "../components/CenteredContent";

interface StateProps {
  readonly model: string;
}

const PageNotFoundScreen = ({ model }: StateProps) => {
  return (
    <CenteredContent>
      <Card sx={{ variant: "card.floating", mb: 5 }}>
        <Heading as="h2" sx={{ fontSize: 4, mb: 20, textAlign: "left" }}>
          Page not found!
        </Heading>
        <Box sx={{ fontSize: 1, mt: 3, textAlign: "left" }}>
          The {model} you are looking for could not be found :(
        </Box>
      </Card>
    </CenteredContent>
  );
};

export default PageNotFoundScreen;
