/** @jsx jsx */
import { Box, Flex, jsx, ThemeUIStyleObject, Heading } from "theme-ui";
import {
  EvaluateMetricWithValue,
  IProject,
  IStaticMetadata,
  RegionLookupProperties
} from "../../../../shared/entities";
import { useState, useEffect } from "react";
import { getLabelLookup } from "../../map/labels";
import { Resource } from "../../../resource";
import { geoLevelLabel } from "../../../functions";

const style: ThemeUIStyleObject = {
  td: {
    fontWeight: "body",
    color: "gray.8",
    fontSize: 1,
    p: 2,
    textAlign: "left",
    verticalAlign: "bottom",
    minWidth: "20px",
    maxWidth: "200px",
    mr: "10px"
  },
  fillBox: {
    height: "10px",
    width: "10px",
    background: "#fed8b1",
    opacity: "0.5",
    outline: "1px solid black"
  },
  unfilledBox: {
    height: "10px",
    width: "10px",
    background: "none",
    outline: "1px solid black"
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
    <Box sx={{ ml: "20px", overflowY: "scroll" }}>
      <Heading as="h4" sx={{ variant: "text.h4", display: "block" }}>
        {metric.value} / {metric.total} {geoLevelLabel(geoLevel)} {metric.description}
      </Heading>
      <Flex sx={{ flexDirection: "column", width: "60%" }}>
        <table>
          <tbody>
            {countyLookup ? (
              project?.districtsDefinition.map((d, id) => (
                <tr key={id}>
                  <td sx={style.tableElement}>
                    {countyLookup && id in countyLookup && staticMetadata
                      ? getLabelLookup(geoLevel, countyLookup[id])
                      : staticMetadata
                      ? getLabelLookup(geoLevel, undefined, id)
                      : ""}
                  </td>
                  <td sx={style.tableElement}>
                    <Box sx={Array.isArray(d) ? style.fillBox : style.unfilledBox}></Box>
                  </td>
                  <td sx={style.tableElement}>{Array.isArray(d) ? "Split" : "Not split"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td>Loading...</td>
              </tr>
            )}
          </tbody>
        </table>
      </Flex>
    </Box>
  );
};

export default CountySplitMetricDetail;
