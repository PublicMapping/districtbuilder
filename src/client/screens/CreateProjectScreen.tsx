import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { Redirect } from "react-router-dom";

import { IProject, RegionConfigId } from "../../shared/entities";
import { regionConfigsFetch } from "../actions/regionConfig";
import { createProject } from "../api";
import { State } from "../reducers";
import { RegionConfigState } from "../reducers/regionConfig";
import { Resource } from "../resource";
import store from "../store";

interface StateProps {
  readonly regionConfigs: RegionConfigState;
}

const isFormValid = (form: ProjectForm): boolean =>
  form.name.trim() !== "" && form.numberOfDistricts > 1 && form.regionConfigId !== null;

export interface ProjectForm {
  readonly name: string;
  readonly numberOfDistricts: number;
  readonly regionConfigId: RegionConfigId | null;
}

const CreateProjectScreen = ({ regionConfigs }: StateProps) => {
  useEffect(() => {
    store.dispatch(regionConfigsFetch());
  }, []);
  const [createProjectForm, setCreateProjectForm] = useState<ProjectForm>({
    name: "",
    numberOfDistricts: 0,
    regionConfigId: null
  });
  const [createProjectResource, setCreateProjectResource] = useState<Resource<IProject>>({
    isPending: false
  });

  return "resource" in createProjectResource ? (
    <Redirect to="/" />
  ) : (
    <form
      onSubmit={(e: React.FormEvent) => {
        e.preventDefault();
        // tslint:disable-next-line no-if-statement
        if (isFormValid(createProjectForm) && createProjectForm.regionConfigId) {
          setCreateProjectResource({ isPending: true });
          createProject({
            name: createProjectForm.name,
            numberOfDistricts: createProjectForm.numberOfDistricts,
            regionConfig: {
              id: createProjectForm.regionConfigId
            }
          })
            .then((project: IProject) => setCreateProjectResource({ resource: project }))
            .catch((errorMessage: string) => setCreateProjectResource({ errorMessage }));
        }
      }}
    >
      <div>
        <input
          type="text"
          placeholder="Name"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setCreateProjectForm({
              ...createProjectForm,
              name: e.currentTarget.value
            })
          }
        />
      </div>
      <div>
        <input
          type="number"
          placeholder="Number of districts"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setCreateProjectForm({
              ...createProjectForm,
              numberOfDistricts: parseInt(e.currentTarget.value, 10)
            })
          }
        />
      </div>
      <div>
        <select
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setCreateProjectForm({
              ...createProjectForm,
              regionConfigId: e.currentTarget.value
            })
          }
        >
          <option />
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
            (("isPending" in createProjectResource && createProjectResource.isPending) ||
              !isFormValid(createProjectForm)) &&
            !("errorMessage" in createProjectResource)
          }
        >
          Create project
        </button>
      </div>
      {"errorMessage" in createProjectResource ? (
        <div style={{ color: "red" }}>{createProjectResource.errorMessage}</div>
      ) : null}
    </form>
  );
};

function mapStateToProps(state: State): StateProps {
  return {
    regionConfigs: state.regionConfig
  };
}

export default connect(mapStateToProps)(CreateProjectScreen);
