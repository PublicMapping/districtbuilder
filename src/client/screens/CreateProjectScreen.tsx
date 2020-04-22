import React from "react";
import { connect } from "react-redux";

import { ProjectForm, saveProject, setCreateProjectForm } from "../actions/projectForm";
import { State } from "../reducers";
import { ProjectFormState } from "../reducers/projectForm";
import store from "../store";

interface StateProps {
  readonly projectForm: ProjectFormState;
}

const isFormValid = (form: ProjectForm): boolean =>
  form.name.trim() !== "" || form.numberOfDistricts > 0 || form.regionConfigId !== null;

const CreateProjectScreen = ({ projectForm }: StateProps) => {
  return (
    <form
      onSubmit={(e: React.FormEvent) => {
        e.preventDefault();
        store.dispatch(saveProject());
      }}
    >
      <div>
        <input
          type="text"
          placeholder="Name"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            store.dispatch(
              setCreateProjectForm({
                name: e.currentTarget.value
              })
            )
          }
        />
      </div>
      <div>
        <input
          type="number"
          placeholder="Number of districts"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            store.dispatch(
              setCreateProjectForm({
                numberOfDistricts: parseInt(e.currentTarget.value, 10)
              })
            )
          }
        />
      </div>
      <div>
        <button
          type="submit"
          disabled={
            ("isPending" in projectForm && projectForm.isPending) ||
            ("data" in projectForm && !isFormValid(projectForm.data))
          }
        >
          Register
        </button>
      </div>
      {"errorMessage" in projectForm ? (
        <div style={{ color: "red" }}>{projectForm.errorMessage}</div>
      ) : null}
    </form>
  );
};

function mapStateToProps(state: State): StateProps {
  return {
    projectForm: state.projectForm
  };
}

export default connect(mapStateToProps)(CreateProjectScreen);
