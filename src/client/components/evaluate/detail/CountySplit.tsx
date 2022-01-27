/** @jsx jsx */
import { Box, Flex, jsx, Themed, ThemeUIStyleObject, Heading } from "theme-ui";
import { IProject, IStaticMetadata, RegionLookupProperties } from "../../../../shared/entities";
import { useState, useEffect } from "react";
import { getLabelLookup } from "../../map/labels";
import { Resource } from "../../../resource";
import { EvaluateMetricWithValue } from "../../../types";
import { geoLevelLabel, geoLevelLabelSingular } from "../../../functions";

const style: Record<string, ThemeUIStyleObject> = {
  table: {
    mx: 0,
    mb: 2,
    width: "100%"
  },
  th: {
    fontWeight: "bold",
    color: "gray.7",
    bg: "muted",
    fontSize: 1,
    textAlign: "left",
    pt: 2,
    px: 2,
    height: "32px",
    position: "sticky",
    top: "0",
    zIndex: 2,
    userSelect: "none",
    "&::after": {
      height: "1px",
      content: "''",
      display: "block",
      width: "100%",
      bg: "gray.2",
      bottom: "-1px",
      position: "absolute",
      left: 0,
      right: 0
    }
  },
  td: {
    fontWeight: "body",
    color: "gray.8",
    fontSize: 1,
    p: 2,
    textAlign: "left",
    verticalAlign: "bottom",
    position: "relative"
  },
  colFirst: {
    pl: 0
  },
  colLast: {
    pr: 0
  },
  fillBox: {
    mr: 2,
    height: "15px",
    width: "15px",
    borderRadius: "small",
    bg: "#fed8b1",
    border: "1px solid",
    borderColor: "gray.2"
  },
  unfilledBox: {
    mr: 2,
    height: "15px",
    width: "15px",
    borderRadius: "small",
    bg: "transparent",
    border: "1px solid",
    borderColor: "gray.2"
  }
};

type CountyLookup = ReadonlyArray<string | undefined>;

const CountySplitMetricDetail = ({
  metric,
  project,
  staticMetadata,
  regionProperties,
  geoLevel
}: {
  readonly metric: EvaluateMetricWithValue;
  readonly project?: IProject;
  readonly geoLevel: string;
  readonly regionProperties: Resource<readonly RegionLookupProperties[]>;
  readonly staticMetadata?: IStaticMetadata;
}) => {
  const [countyLookup, setCountyLookup] = useState<CountyLookup | undefined>(undefined);

  useEffect(() => {
    if ("resource" in regionProperties && !countyLookup) {
      setCountyLookup(
        regionProperties.resource.map(c => (typeof c.name === "string" ? c.name : undefined))
      );
    }
  }, [regionProperties, countyLookup]);

  return (
    <Box>
      <Heading as="h2" sx={{ variant: "text.h5", mt: 4 }}>
        {metric.value} / {metric.total} {geoLevelLabel(geoLevel)} {metric.description}
      </Heading>
      <Themed.table sx={style.table}>
        <thead>
          <Themed.tr>
            <Themed.th sx={{ ...style.th, ...style.colFirst }}>
              {geoLevelLabelSingular(geoLevel)}
            </Themed.th>
            <Themed.th sx={{ ...style.th, ...style.colLast }}>Split</Themed.th>
          </Themed.tr>
        </thead>
        <tbody>
          {countyLookup ? (
            project?.districtsDefinition.map((d, id) => (
              <Themed.tr key={id}>
                <Themed.td sx={{ ...style.td, ...style.colFirst }}>
                  {countyLookup && id in countyLookup && staticMetadata
                    ? getLabelLookup(geoLevel, countyLookup[id])
                    : staticMetadata
                    ? getLabelLookup(geoLevel, undefined, id)
                    : ""}
                </Themed.td>
                <Themed.td sx={{ ...style.td, ...style.colLast }}>
                  <Flex sx={{ alignItems: "center" }}>
                    <Box sx={Array.isArray(d) ? style.fillBox : style.unfilledBox}></Box>
                    <Box>{Array.isArray(d) ? "Split" : "Not split"}</Box>
                  </Flex>
                </Themed.td>
              </Themed.tr>
            ))
          ) : (
            <Themed.tr>
              <Themed.td sx={style.td}>Loading...</Themed.td>
            </Themed.tr>
          )}
        </tbody>
      </Themed.table>
    </Box>
  );
};

export default CountySplitMetricDetail;
