/** @jsx jsx */
import { useEffect, useState } from "react";
import { Redirect, useLocation } from "react-router-dom";
import { Flex, jsx, Themed, ThemeUIStyleObject } from "theme-ui";

import { IProject, RegionConfigId, ChamberId } from "../../shared/entities";
import { regionConfigsFetch } from "../actions/regionConfig";
import { createProject } from "../api";
import { WriteResource } from "../resource";
import store from "../store";

const validate = (form: ProjectForm): ValidForm | InvalidForm => {
  const { numberOfDistricts, regionConfigId, chamberId, name } = form;
  return name && name.trim() !== "" && !Number.isNaN(numberOfDistricts) && regionConfigId !== null
    ? {
        name,
        numberOfDistricts,
        chamber: chamberId ? { id: chamberId } : undefined,
        regionConfig: { id: regionConfigId },
        valid: true
      }
    : { ...form, valid: false };
};

interface ProjectForm {
  readonly name: string | null;
  readonly chamberId: ChamberId | null;
  readonly regionConfigId: RegionConfigId | null;
  readonly numberOfDistricts: number;
}

interface ValidForm {
  readonly name: string;
  readonly chamber?: { readonly id: ChamberId };
  readonly regionConfig: { readonly id: RegionConfigId };
  readonly numberOfDistricts: number;
  readonly valid: true;
}

interface InvalidForm extends ProjectForm {
  readonly valid: false;
}

const style: Record<string, ThemeUIStyleObject> = {
  page: {
    flexDirection: "column",
    minHeight: "100vh",
    alignItems: "center",
    justifyContent: "center"
  }
};

export default () => {
  useEffect(() => {
    store.dispatch(regionConfigsFetch());
  }, []);
  const [createProjectResource, setCreateProjectResource] = useState<WriteResource<void, IProject>>(
    { data: void 0 }
  );
  const params = new URLSearchParams(useLocation().search);
  useEffect(() => {
    const form = validate({
      name: params.get("name"),
      chamberId: params.get("chamberId") || null,
      regionConfigId: params.get("regionConfigId"),
      numberOfDistricts: Number.parseInt(params.get("numberOfDistricts") || "")
    });

    setCreateProjectResource(
      form.valid
        ? { data: void 0, isPending: true }
        : {
            data: void 0,
            errors: { error: "Invalid", message: "Invalid options provided" }
          }
    );
    form.valid &&
      createProject(form)
        .then(project => setCreateProjectResource({ data: void 0, resource: project }))
        .catch(errors => setCreateProjectResource({ data: void 0, errors }));
    // eslint-disable-next-line
  }, []);

  return "resource" in createProjectResource ? (
    <Redirect to={`/projects/${createProjectResource.resource.id}`} />
  ) : "errors" in createProjectResource ? (
    <Flex sx={style.page}>
      Error creating a project for this link.
      <p>
        Please contact&nbsp;
        <Themed.a href="mailto:support@districtbuilder.org">
          support@districtbuilder.org
        </Themed.a>{" "}
        for help.
      </p>
    </Flex>
  ) : (
    <Flex sx={style.page}>Creating map...</Flex>
  );
};
