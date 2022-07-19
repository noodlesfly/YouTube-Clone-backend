'use strict';

const Controller = require('egg').Controller;


class VideoController extends Controller {

  async createVideo() {
    const body = this.ctx.request.body;
    this.ctx.validate({
      title: { type: 'string' },
      description: { type: 'string' },
      cover: { type: 'string' },
      vodVideoId: { type: 'string' },
    }, body);
    body.user = this.ctx.user._id;
    const video = await this.service.video.createVideo(body);
    this.ctx.status = 201;
    this.ctx.body = {
      video,
    };
  }

  async getVideo() {
    const { videoId } = this.ctx.params;
    const { Video, Like, Subscription } = this.app.model;
    let video = await Video.findById(videoId).populate('user', '_id avatar userName subscribersCount');

    if (!video) {
      this.ctx.throw(404, 'video not found');
    }
    video = video.toJSON();

    video.isLiked = false;
    video.isDisLiked = false;
    video.user.isSubscribed = false;

    if (this.ctx.user) {
      const userId = this.ctx.user._id;

      console.log(this.app.model);
      if (await Like.findOne({
        user: userId,
        video: videoId,
        like: 1,
      })) {
        video.isLiked = true;
      }

      if (await Like.findOne({
        user: userId,
        video: videoId,
        like: -1,
      })) {
        video.isDisLiked = true;
      }


      if (await Subscription.findOne({
        user: userId,
        channel: video.user._id,
      })) {
        video.user.isSubscribed = true;
      }


    }

    this.ctx.body = {
      video,
    };

  }


  async getVideos() {
    const { ctx } = this;
    const { pageNum = 1, pageSize = 10 } = ctx.query;
    const { videos, videosCount } = await this.service.video.getVideos(pageNum, pageSize);

    ctx.body = {
      videos,
      videosCount,
    };
  }


  async getUserVideos() {
    const { ctx } = this;
    const { pageNum = 1, pageSize = 10 } = ctx.query;
    const { userId } = ctx.params;
    const { videos, videosCount } = await this.service.video.getUserVideos(userId, pageNum, pageSize);

    ctx.body = {
      videos,
      videosCount,
    };
  }

  async getUserFeedVideos() {
    const { ctx } = this;
    const { pageNum = 1, pageSize = 10 } = ctx.query;

    const { videos, videosCount } = await this.service.video.getUserFeedVideos(pageNum, pageSize);

    ctx.body = {
      videos,
      videosCount,
    };
  }

  async updateVideo() {
    const { ctx } = this;
    const { videoId } = ctx.params;
    const { body } = ctx.request;
    ctx.validate({
      title: { type: 'string', required: false },
      description: { type: 'string', required: false },
      vodVideoId: { type: 'string', required: false },
      cover: { type: 'string', required: false },
    });
    const video = await this.service.video.updateVideo(videoId, body);
    ctx.body = {
      video,
    };
  }

  async deleteVideo() {
    const { ctx } = this;
    const { videoId } = ctx.params;

    await this.service.video.deleteVideo(videoId);
    ctx.status = 204;
  }

  async createComment() {
    const { ctx } = this;
    const userId = ctx.user._id;
    const { videoId } = ctx.params;
    const { body } = ctx.request;

    const comment = await this.service.video.createComment(userId, videoId, body);

    ctx.body = {
      comment,
    };

  }


  async getVideoComments() {
    const { ctx } = this;
    const { videoId } = ctx.params;
    const { pageNum = 1, pageSize = 10 } = ctx.query;

    const {
      comments,
      commentsCount,
    } = await this.service.video.getVideoComments(videoId, pageNum, pageSize);

    ctx.body = {
      comments,
      commentsCount,
    };
  }


  async deleteVideoComment() {
    const { ctx } = this;
    const { videoId, commentId } = ctx.params;
    await this.service.video.deleteVideoComment(videoId, commentId);
    ctx.status = 204;
  }

  async likeVideo() {
    const { ctx } = this;
    const { videoId } = ctx.params;
    const video = await this.service.video.likeVideo(videoId);
    ctx.body = {
      video,
    };
  }

  async dislikeVideo() {
    const { ctx } = this;
    const { videoId } = ctx.params;
    const video = await this.service.video.dislikeVideo(videoId);
    ctx.body = {
      video,
    };
  }

  async getUserLikeVideos() {
    const { ctx } = this;
    const userId = ctx.user._id;
    const { pageNum = 1, pageSize = 10 } = ctx.query;
    const { videos, videosCount } = await this.service.video.getUserLikeVideos(userId, pageNum, pageSize);
    ctx.body = {
      videos,
      videosCount,
    };
  }
}

module.exports = VideoController;
