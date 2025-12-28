import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { Video, UploadUrl } from './entities/video.entity';
import { VideoService } from './video.service';

@Resolver()
export class VideoResolver {
    constructor(private readonly videoService: VideoService) { }

    @Query(() => Video, { nullable: true })
    async video(@Args('id', { type: () => ID }) id: string) {
        return this.videoService.findById(id);
    }

    @Query(() => [Video])
    async videosBySeller(@Args('sellerId') sellerId: string) {
        return this.videoService.findBySeller(sellerId);
    }

    @Query(() => [Video])
    async videosByProduct(@Args('productId') productId: string) {
        return this.videoService.findByProduct(productId);
    }

    @Mutation(() => UploadUrl)
    async requestVideoUpload(
        @Args('sellerId') sellerId: string,
        @Args('title') title: string,
        @Args('contentType', { defaultValue: 'video/mp4' }) contentType: string,
    ) {
        return this.videoService.getUploadUrl(sellerId, title, contentType);
    }

    @Mutation(() => Video)
    async triggerAITagging(@Args('videoId') videoId: string) {
        return this.videoService.tagWithAI(videoId);
    }

    @Mutation(() => Video)
    async onTranscodeComplete(
        @Args('videoId') videoId: string,
        @Args('hlsKey') hlsKey: string,
        @Args('thumbnailKey') thumbnailKey: string,
    ) {
        return this.videoService.onTranscodeComplete(videoId, hlsKey, thumbnailKey);
    }
}
