import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { FeatureCollection, MultiPolygon, Geometry } from "geojson";
import { IReferenceLayer } from "../../../../shared/entities";
import { Project } from "../../projects/entities/project.entity";
import { ReferenceLayerTypes } from "../../../../shared/constants";
import { LayerType } from "aws-sdk/clients/opsworks";

export interface ReferenceLayerProperties {
  // key is a property name on the geojson
  // value is the value for that property
  readonly [id: string]: number;
}

export type ReferenceLayerGeojson =
  | FeatureCollection<Geometry, ReferenceLayerProperties>
  | FeatureCollection<MultiPolygon, ReferenceLayerProperties>
  | null;

@Entity()
export class ReferenceLayer implements IReferenceLayer {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "character varying" })
  name: string;

  @ManyToOne(() => Project, { nullable: false, eager: true })
  @JoinColumn({ name: "project_id" })
  project: Project;

  @Column({ type: "enum", enum: ReferenceLayerTypes, default: ReferenceLayerTypes.Point })
  layer_type: LayerType;

  @Column({ type: "character varying" })
  label_field: string;

  @Column({
    type: "jsonb",
    name: "layer",
    nullable: true
  })
  layer: ReferenceLayerGeojson;
}
