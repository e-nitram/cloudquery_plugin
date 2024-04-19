import { Entity, PrimaryColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('cveTable')
export class CVE extends BaseEntity {
    @PrimaryColumn()
    id!: string;

    @Column('text')
    description!: string;

    @Column()
    publishedDate!: string;

    @Column()
    lastModifiedDate!: string;

    // @CreateDateColumn()
    // createdAt!: Date;

    // @UpdateDateColumn()
    // updatedAt!: Date;
}
