import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { Redirect } from "react-router-dom";

import { IProject, IRegionConfig } from "../../shared/entities";
import { regionConfigsFetch } from "../actions/regionConfig";
import { createProject } from "../api";
import { State } from "../reducers";
import { RegionConfigState } from "../reducers/regionConfig";
import { Resource } from "../resource";
import store from "../store";

interface StateProps {
  readonly regionConfigs: RegionConfigState;
}

const validate = (form: ProjectForm) =>
  form.name.trim() !== "" && form.districtSelection !== null && form.regionConfig !== null
    ? ({ ...form, valid: true } as ValidForm)
    : ({ ...form, valid: false } as InvalidForm);

interface DistrictSelection {
  readonly numberOfDistricts: number;
  readonly isCustom: boolean;
}

interface ProjectForm {
  readonly name: string;
  readonly districtSelection: DistrictSelection | null;
  readonly regionConfig: IRegionConfig | null;
}

interface ValidForm {
  readonly name: string;
  readonly districtSelection: DistrictSelection;
  readonly regionConfig: IRegionConfig;
  readonly valid: true;
}

interface InvalidForm extends ProjectForm {
  readonly valid: false;
}

const CreateProjectScreen = ({ regionConfigs }: StateProps) => {
  useEffect(() => {
    store.dispatch(regionConfigsFetch());
  }, []);
  const [createProjectForm, setCreateProjectForm] = useState<ProjectForm>({
    name: "",
    districtSelection: null,
    regionConfig: null
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
        const validatedForm = validate(createProjectForm);
        // tslint:disable-next-line no-if-statement
        if (validatedForm.valid === true) {
          setCreateProjectResource({ isPending: true });
          createProject({
            ...validatedForm,
            numberOfDistricts: validatedForm.districtSelection.numberOfDistricts
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
        <select
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            const regionConfig =
              "resource" in regionConfigs
                ? regionConfigs.resource.find(
                    regionConfig => regionConfig.id === e.currentTarget.value
                  )
                : null;
            setCreateProjectForm({
              ...createProjectForm,
              regionConfig: regionConfig || null
            });
          }}
        >
          <option>Select region</option>
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
        <select
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            const chamber = createProjectForm.regionConfig
              ? createProjectForm.regionConfig.chambers.find(
                  chamber => chamber.id === e.currentTarget.value
                )
              : null;
            setCreateProjectForm({
              ...createProjectForm,
              districtSelection: chamber
                ? {
                    numberOfDistricts: chamber.numberOfDistricts,
                    isCustom: false
                  }
                : null
            });
          }}
        >
          <option>Select chamber</option>
          {createProjectForm.regionConfig
            ? createProjectForm.regionConfig.chambers
                .map(chamber => (
                  <option key={chamber.id} value={chamber.id}>
                    {chamber.name} - {chamber.numberOfDistricts}
                  </option>
                ))
                .concat(
                  ...[
                    <option key="custom" value="custom">
                      Custom
                    </option>
                  ]
                )
            : null}
        </select>
      </div>
      {!createProjectForm.districtSelection || createProjectForm.districtSelection.isCustom ? (
        <div>
          <input
            type="number"
            min={2}
            placeholder="Number of districts"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setCreateProjectForm({
                ...createProjectForm,
                districtSelection: {
                  numberOfDistricts: parseInt(e.currentTarget.value, 10),
                  isCustom: true
                }
              })
            }
          />
        </div>
      ) : null}
      <div>
        <button
          type="submit"
          disabled={
            (("isPending" in createProjectResource && createProjectResource.isPending) ||
              !validate(createProjectForm).valid) &&
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
