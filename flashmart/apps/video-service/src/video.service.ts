import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VideoEntity, VideoStatus } from './entities/video.orm-entity';
import { Video, UploadUrl } from './entities/video.entity';
import { S3Service } from './storage/s3.service';
import { RekognitionService } from './ai/rekognition.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class VideoService {
    constructor(
        @InjectRepository(VideoEntity)
        private readonly videoRepo: Repository<VideoEntity>,
        private readonly s3: S3Service,
        private readonly rekognition: RekognitionService,
    ) { }

    async getUploadUrl(sellerId: string, title: string, contentType: string): Promise<UploadUrl> {
        const videoId = uuidv4();
        const key = `uploads/${sellerId}/${videoId}/original.mp4`;

        // Create video record
        const video = this.videoRepo.create({
            id: videoId,
            title,
            sellerId,
            originalKey: key,
            status: VideoStatus.PENDING,
        });
        await this.videoRepo.save(video);

        // Get presigned upload URL
        const uploadUrl = await this.s3.getPresignedUploadUrl(key, contentType);

        return { uploadUrl, videoId, key };
    }

    async findById(id: string): Promise<Video | null> {
        const entity = await this.videoRepo.findOne({ where: { id } });
        return entity ? this.toGraphQL(entity) : null;
    }

    async findBySeller(sellerId: string): Promise<Video[]> {
        const entities = await this.videoRepo.find({ where: { sellerId }, order: { createdAt: 'DESC' } });
        return entities.map(e => this.toGraphQL(e));
    }

    async findByProduct(productId: string): Promise<Video[]> {
        const entities = await this.videoRepo.find({ where: { productId }, order: { createdAt: 'DESC' } });
        return entities.map(e => this.toGraphQL(e));
    }

    // Called by Transcoder Lambda after processing
    async onTranscodeComplete(videoId: string, hlsKey: string, thumbnailKey: string): Promise<Video> {
        const video = await this.videoRepo.findOne({ where: { id: videoId } });
        if (!video) throw new Error('Video not found');

        video.hlsKey = hlsKey;
        video.thumbnailKey = thumbnailKey;
        video.status = VideoStatus.READY;
        await this.videoRepo.save(video);

        return this.toGraphQL(video);
    }

    // Trigger AI tagging (called after upload or by Lambda)
    async tagWithAI(videoId: string): Promise<Video> {
        const video = await this.videoRepo.findOne({ where: { id: videoId } });
        if (!video) throw new Error('Video not found');

        // Use thumbnail for labeling (cheaper than video)
        const thumbnailKey = video.thumbnailKey || video.originalKey;
        const labels = await this.rekognition.detectLabels(thumbnailKey);

        video.aiLabels = labels;
        video.aiTags = labels.slice(0, 5).map(l => l.name);
        await this.videoRepo.save(video);

        return this.toGraphQL(video);
    }

    async incrementViewCount(videoId: string): Promise<void> {
        await this.videoRepo.increment({ id: videoId }, 'viewCount', 1);
    }

    private toGraphQL(e: VideoEntity): Video {
        return {
            id: e.id,
            title: e.title,
            description: e.description,
            sellerId: e.sellerId,
            productId: e.productId,
            status: e.status as any,
            streamUrl: e.hlsKey ? this.s3.getPublicUrl(e.hlsKey) : undefined,
            thumbnailUrl: e.thumbnailKey ? this.s3.getPublicUrl(e.thumbnailKey) : undefined,
            aiTags: e.aiTags,
            aiLabels: e.aiLabels,
            durationSeconds: e.durationSeconds,
            viewCount: e.viewCount,
            createdAt: e.createdAt,
        };
    }
}
