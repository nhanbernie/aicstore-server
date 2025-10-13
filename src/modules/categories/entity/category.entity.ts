import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';

@Entity('categories')
@Index(['slug'], { unique: true })
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 160 })
  name: string;

  @Column({ length: 180, unique: true })
  slug: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'URL(image) represent for category',
  })
  thumbnail?: string;

  @Column({ name: 'parent_id', nullable: true })
  parentId?: string;

  @ManyToOne(() => Category, (category) => category.children, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'parent_id' })
  parent?: Category;

  @OneToMany(() => Category, (category) => category.parent)
  children: Category[];

  @Column({
    type: 'jsonb',
    name: 'spec_schema',
    nullable: true,
    comment: 'JSON schema for product specifications in this category',
  })
  specSchema?: any;

  @Column({
    type: 'int',
    name: 'schema_version',
    default: 1,
    comment: 'Version of the spec schema',
  })
  schemaVersion: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
