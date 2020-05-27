/** @jsx jsx */
import React from "react";
import { Box, Button, Flex, Heading, Image, jsx, Text } from "theme-ui";
import { heights } from "../theme";

import "../App.css";
import Icon from "../components/Icon";

const FullScreenApp = ({ children }: { readonly children: React.ReactNode }) => {
  return (
    <Flex sx={{ backgroundColor: "#aaa", height: "100%", flexDirection: "column" }}>
      {children}
    </Flex>
  );
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

const ProjectHeader = () => (
  <Flex sx={{ variant: "header.app", backgroundColor: "accent" }}>
    <Flex sx={{ variant: "header.left" }}>
      <Image src="/logo-mark-bw.svg" height="28px" width="28px" />
      <HeaderDivider />
      <Flex
        sx={{
          color: "#fff",
          alignItems: "center"
        }}
      >
        <Text>Project name</Text>
      </Flex>
    </Flex>
    <Flex sx={{ variant: "header.right" }}>
      <Button sx={{ variant: "buttons.minimal" }}>
        <Icon name="search" /> Find
      </Button>
      <Button sx={{ variant: "buttons.minimal" }}>Settings</Button>
      <Button sx={{ variant: "buttons.minimal" }}>Find</Button>
      <HeaderDivider sx={{ opacity: 0 }} />
      <Button sx={{ variant: "buttons.secondary" }}>Evaluate</Button>
    </Flex>
  </Flex>
);

const Main = ({ children }: { readonly children: React.ReactNode }) => {
  return <Flex sx={{ backgroundColor: "#ccc", flex: 1, overflowY: "auto" }}>{children}</Flex>;
};

const Sidebar = ({ children }: { readonly children: React.ReactNode }) => (
  <Flex
    sx={{
      background: "#fff",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      zIndex: 20,
      position: "relative",
      flexShrink: 0,
      boxShadow: "0 0 1px #a9acae",
      minWidth: "300px"
    }}
  >
    {children}
  </Flex>
);

const SidebarHeader = () => {
  return (
    <Flex sx={{ variant: "header.app" }}>
      <Flex sx={{ variant: "header.left" }}>
        <Heading as="h3" sx={{ m: "0" }}>
          Districts
        </Heading>
      </Flex>
      <Flex sx={{ variant: "header.right" }}>
        <Button variant="circularSubtle" sx={{ mr: "2" }}>
          Cancel
        </Button>
        <Button variant="circular">Approve</Button>
      </Flex>
    </Flex>
  );
};

const SidebarTable = ({ children }: { readonly children: React.ReactNode }) => {
  return <Box sx={{ flex: 1, overflowY: "auto" }}>{children}</Box>;
};

const MapContainer = ({ children }: { readonly children: React.ReactNode }) => {
  return (
    <Flex sx={{ backgroundColor: "orange", flexDirection: "column", flex: 1 }}>{children}</Flex>
  );
};

const MapHeader = () => {
  return <Box sx={{ variant: "header.app", backgroundColor: "burlywood" }}>MapHeader</Box>;
};

const Map = () => {
  return <Box sx={{ flex: 1 }}>Map</Box>;
};

const DesignProjectScreen = () => {
  return (
    <FullScreenApp>
      <ProjectHeader />
      <Main>
        <Sidebar>
          <SidebarHeader />
          <SidebarTable>Sidebar Content</SidebarTable>
        </Sidebar>
        <MapContainer>
          <MapHeader />
          <Map />
        </MapContainer>
      </Main>
    </FullScreenApp>
  );
};

export default DesignProjectScreen;
