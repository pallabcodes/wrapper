import { ObjectType, Field, ID, Int, registerEnumType } from '@nestjs/graphql';

export enum VideoStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    READY = 'READY',
    FAILED = 'FAILED',
}

registerEnumType(VideoStatus, { name: 'VideoStatus' });

@ObjectType()
export class AILabel {
    @Field()
    name: string;

    @Field()
    confidence: number;
}

@ObjectType()
export class Video {
    @Field(() => ID)
    id: string;

    @Field()
    title: string;

    @Field({ nullable: true })
    description?: string;

    @Field()
    sellerId: string;

    @Field({ nullable: true })
    productId?: string;

    @Field(() => VideoStatus)
    status: VideoStatus;

    @Field({ nullable: true })
    streamUrl?: string; // HLS URL

    @Field({ nullable: true })
    thumbnailUrl?: string;

    @Field(() => [String], { nullable: true })
    aiTags?: string[];

    @Field(() => [AILabel], { nullable: true })
    aiLabels?: AILabel[];

    @Field(() => Int)
    durationSeconds: number;

    @Field(() => Int)
    viewCount: number;

    @Field()
    createdAt: Date;
}

@ObjectType()
export class UploadUrl {
    @Field()
    uploadUrl: string;

    @Field()
    videoId: string;

    @Field()
    key: string;
}
