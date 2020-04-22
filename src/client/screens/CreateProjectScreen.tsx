import React, { useEffect } from "react";
import { connect } from "react-redux";

import { ProjectForm, saveProject, setCreateProjectForm } from "../actions/projectForm";
import { regionConfigsFetch } from "../actions/regionConfig";
import { State } from "../reducers";
import { ProjectFormState } from "../reducers/projectForm";
import { RegionConfigState } from "../reducers/regionConfig";
import store from "../store";

interface StateProps {
  readonly projectForm: ProjectFormState;
  readonly regionConfigs: RegionConfigState;
}

const isFormValid = (form: ProjectForm): boolean =>
  form.name.trim() !== "" && form.numberOfDistricts > 1 && form.regionConfigId !== null;

const CreateProjectScreen = ({ projectForm, regionConfigs }: StateProps) => {
  useEffect(() => {
    store.dispatch(regionConfigsFetch());
  }, []);

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
        <select
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            store.dispatch(
              setCreateProjectForm({
                regionConfigId: e.currentTarget.value
              })
            )
          }
        >
          <option></option>
          {"resource" in regionConfigs
            ? regionConfigs.resource.map(regionConfig => (
                <option key={regionConfig.id} value={regionConfig.id}>
                  {regionConfig.name}
                </option>
              ))
            : null}
        </select>
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
    projectForm: state.projectForm,
    regionConfigs: state.regionConfig
  };
}

export default connect(mapStateToProps)(CreateProjectScreen);
