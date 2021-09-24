import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Check } from "typeorm";
import { FeatureCollection, MultiPolygon, Point } from "geojson";
import { IReferenceLayer, ReferenceLayerProperties } from "../../../../shared/entities";
import { Project } from "../../projects/entities/project.entity";
import { ReferenceLayerTypes } from "../../../../shared/constants";
import { ProjectTemplate } from "../../project-templates/entities/project-template.entity";

export type ReferenceLayerGeojson =
  | FeatureCollection<Point, ReferenceLayerProperties>
  | FeatureCollection<MultiPolygon, ReferenceLayerProperties>;

@Entity()
@Check(`"project_id" IS NOT NULL OR "project_template_id" IS NOT NULL`)
export class ReferenceLayer implements IReferenceLayer {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "character varying" })
  name: string;

  @ManyToOne(() => Project, { nullable: true, eager: true })
  @JoinColumn({ name: "project_id" })
  project: Project;

  @ManyToOne(() => ProjectTemplate, { nullable: true })
  @JoinColumn({ name: "project_template_id" })
  projectTemplate: ProjectTemplate;

  @Column({ type: "enum", enum: ReferenceLayerTypes, default: ReferenceLayerTypes.Point })
  layer_type: ReferenceLayerTypes;

  @Column({ type: "character varying", default: "" })
  label_field: string;

  @Column({
    type: "jsonb",
    name: "layer"
  })
  layer: ReferenceLayerGeojson;
}
