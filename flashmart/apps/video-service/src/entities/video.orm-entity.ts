import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum VideoStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    READY = 'READY',
    FAILED = 'FAILED',
}

@Entity('videos')
export class VideoEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column('text', { nullable: true })
    description: string;

    @Column()
    sellerId: string;

    @Column({ nullable: true })
    productId: string;

    @Column()
    originalKey: string; // S3 key for original upload

    @Column({ nullable: true })
    hlsKey: string; // S3 key for HLS processed video

    @Column({ nullable: true })
    thumbnailKey: string;

    @Column({ type: 'enum', enum: VideoStatus, default: VideoStatus.PENDING })
    status: VideoStatus;

    @Column('simple-array', { nullable: true })
    aiTags: string[]; // Tags from Rekognition

    @Column('jsonb', { nullable: true })
    aiLabels: { name: string; confidence: number }[];

    @Column({ default: 0 })
    durationSeconds: number;

    @Column({ default: 0 })
    viewCount: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
