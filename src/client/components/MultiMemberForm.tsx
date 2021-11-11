/** @jsx jsx */
import { jsx, Styled, Input } from "theme-ui";

interface Props {
  readonly totalPopulation: number;
  readonly numberOfMembers: readonly number[];
  // eslint-disable-next-line functional/no-mixed-type
  readonly onChange: (numberOfMembers: readonly number[]) => void;
}

const MultiMemberForm = ({ totalPopulation, numberOfMembers, onChange }: Props) => {
  const totalReps = numberOfMembers.reduce((total, numberOfReps) => total + numberOfReps, 0);
  const popPerRep = Math.floor(totalPopulation / totalReps);
  return (
    <Styled.table sx={{ margin: "0", width: "100%" }}>
      <thead sx={{ bg: "muted" }}>
        <tr>
          <td>Districts</td>
          <td>Number of reps</td>
          <td sx={{ textAlign: "right" }}>Target population</td>
        </tr>
      </thead>
      <tbody>
        {numberOfMembers.map((numberOfReps, i) => (
          <tr key={i}>
            <td>{i + 1}</td>
            <td>
              <Input
                sx={{ maxWidth: "200px" }}
                value={numberOfReps}
                pattern="[0-9]+"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const val = Number(e.target.value);
                  onChange([...numberOfMembers.slice(0, i), val, ...numberOfMembers.slice(i + 1)]);
                }}
              ></Input>
            </td>
            <td sx={{ textAlign: "right" }}>{Number(numberOfReps * popPerRep).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </Styled.table>
  );
};

export default MultiMemberForm;
