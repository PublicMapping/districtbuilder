import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TypeOrmCrudService } from "@nestjsx/crud-typeorm";
import { Repository } from "typeorm";

import { ReferenceLayer } from "../entities/reference-layer.entity";

@Injectable()
export class ReferenceLayersService extends TypeOrmCrudService<ReferenceLayer> {
  constructor(@InjectRepository(ReferenceLayer) repo: Repository<ReferenceLayer>) {
    super(repo);
  }

  async getProjectReferenceLayers(projectId: string): Promise<ReferenceLayer[]> {
    // Returns public data for organization screen
    const builder = this.repo.createQueryBuilder("referenceLayer");
    const data = await builder
      .leftJoinAndSelect("referenceLayer.project", "project")
      .where("project.id = :projectId", { projectId: projectId })
      .select([
        "referenceLayer.id",
        "referenceLayer.name",
        "referenceLayer.layer_type",
        "referenceLayer.name",
        "referenceLayer.label_field"
      ])
      .getMany();
    return data;
  }
}
