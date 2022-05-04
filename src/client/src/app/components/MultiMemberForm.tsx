/** @jsx jsx */
import React from "react";
import { jsx, Box, Themed, Input } from "theme-ui";

interface Props {
  readonly totalPopulation: number;
  readonly numberOfMembers: readonly number[];
  readonly errors?: readonly string[];
  // eslint-disable-next-line functional/no-mixed-type
  readonly onChange: (numberOfMembers: readonly number[]) => void;
}

const MultiMemberForm = ({ totalPopulation, numberOfMembers, errors, onChange }: Props) => {
  const totalReps = numberOfMembers.reduce(
    (total, numberOfReps) => (Number.isNaN(numberOfReps) ? total : total + numberOfReps),
    0
  );
  const popPerRep = Math.floor(totalPopulation / totalReps);
  return (
    <React.Fragment>
      {errors && (
        <Box sx={{ fontSize: 1, color: "warning", textAlign: "left" }}>
          {errors &&
            errors.map((msg: string, index: number) => (
              <React.Fragment key={index}>
                {msg}
                <Themed.div />
              </React.Fragment>
            ))}
        </Box>
      )}
      <Themed.table sx={{ margin: "0", width: "100%" }}>
        <thead sx={{ bg: "muted" }}>
          <tr>
            <td>Districts</td>
            <td>Number of reps</td>
            <td sx={{ textAlign: "right" }}>Target population</td>
          </tr>
        </thead>
        <tbody>
          {numberOfMembers.map((numberOfReps: number, i: number) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>
                <Input
                  sx={{ maxWidth: "200px" }}
                  value={Number.isNaN(numberOfReps) ? "" : numberOfReps}
                  pattern="[0-9]+"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const val = e.target.value ? Number(e.target.value) : NaN;
                    onChange([
                      ...numberOfMembers.slice(0, i),
                      val,
                      ...numberOfMembers.slice(i + 1)
                    ]);
                  }}
                ></Input>
              </td>
              <td sx={{ textAlign: "right" }}>
                {Number.isNaN(numberOfReps)
                  ? ""
                  : Number(numberOfReps * popPerRep).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </Themed.table>
    </React.Fragment>
  );
};

export default MultiMemberForm;
