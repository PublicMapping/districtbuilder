import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TypeOrmCrudService } from "@nestjsx/crud-typeorm";
import { Repository } from "typeorm";
import { ProjectVisibility } from "../../../../shared/constants";
import { UserId, IReferenceLayer } from "../../../../shared/entities";

import { ReferenceLayer } from "../entities/reference-layer.entity";
import { Brackets } from "typeorm";


@Injectable()
export class ReferenceLayersService extends TypeOrmCrudService<ReferenceLayer> {
  constructor(@InjectRepository(ReferenceLayer) repo: Repository<ReferenceLayer>) {
    super(repo);
  }

  async getProjectReferenceLayers(projectId: string, userId?: UserId): Promise<ReferenceLayer[]> {
    // Returns public data for organization screen
    const builder = this.repo.createQueryBuilder("referenceLayer");
    const data = await builder
      .leftJoin("referenceLayer.project", "project")
      .where("project.id = :projectId", { projectId: projectId })
      .andWhere(
        new Brackets(qb => {
          const isVisibleFilter = qb
            .where("visibility = :published", { published: ProjectVisibility.Published })
            .orWhere("visibility = :visible", { visible: ProjectVisibility.Visible });
          return userId
            ? isVisibleFilter.orWhere("user_id = :userId", { userId })
            : isVisibleFilter;
        })
      )
      .select([
        "referenceLayer.id",
        "referenceLayer.name",
        "referenceLayer.layer_type",
        "referenceLayer.label_field"
      ])
      .getMany();
    return data;
  }
}
