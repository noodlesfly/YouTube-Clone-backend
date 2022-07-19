const Service = require('egg').Service;

class VideoService extends Service {
  get Video() {
    return this.app.model.Video;
  }

  async createVideo(data) {
    const video = await new this.Video(data).save();
    return video;
  }
  async getVideos(pageNum, pageSize) {
    const videos = await this.Video.find().skip((pageNum - 1) * pageSize).limit(Number.parseInt(pageSize))
      .sort({
        createdAt: -1,
      })
      .populate('user');
    const videosCount = await this.Video.countDocuments();
    return { videos, videosCount };
  }
  async getUserVideos(userId, pageNum, pageSize) {
    const videos = await this.Video.find({
      user: userId,
    }).skip((pageNum - 1) * pageSize).limit(Number.parseInt(pageSize))
      .sort({
        createdAt: -1,
      })
      .populate('user');
    const videosCount = await this.Video.countDocuments({
      user: userId,
    });
    return { videos, videosCount };
  }

  async getUserFeedVideos(pageNum, pageSize) {
    const userId = this.ctx.user._id;
    const subscriptions = await this.app.model.Subscription.find({
      user: userId,
    }).populate('channel');
    const channelIds = subscriptions.map(subscription => subscription.channel._id);
    const videos = await this.Video.find({
      user: { $in: channelIds },
    }).skip((pageNum - 1) * pageSize).limit(Number.parseInt(pageSize))
      .sort({
        createdAt: -1,
      })
      .populate('user');
    const videosCount = await this.Video.countDocuments({
      user: {
        $in: channelIds,
      },
    });
    return { videos, videosCount };
  }


  async updateVideo(videoId, body) {
    let video = await this.Video.findById(videoId);
    if (!video) {
      this.ctx.throw(404, '未找到该视频');
    }
    if (!video.user.equals(this.ctx.user._id)) {
      this.ctx.throw(403);
    }
    video = Object.assign(video, this.ctx.helper._.pick(body, [ 'title', 'description', 'cover', 'vodVideoId' ]));
    await video.save();
    return video;
  }

  async deleteVideo(videoId) {
    const video = await this.Video.findById(videoId);


    if (!video) {
      this.ctx.throw(404, '未找到该视频');
    }

    if (!video.user.equals(this.ctx.user._id)) {
      this.ctx.throw(403);
    }

    await video.remove();
  }


  async createComment(userId, videoId, body) {
    // 基础验证
    this.ctx.validate({
      content: { type: 'string' },
    }, body);

    // 获取评论所属视频
    const video = await this.Video.findById(videoId);
    if (!video) {
      this.ctx.throw(404, '未找到该视频');
    }
    // 创建评论
    const comment = await new this.app.model.Comment({
      content: body.content,
      user: userId,
      video: videoId,
    }).save();

    // 更新视频的评论数量
    video.commentsCount++;
    await video.save();

    await comment.populate('user').populate('video').execPopulate();

    return comment;
  }

  async getVideoComments(videoId, pageNum, pageSize) {
    // 验证视频是否存在
    const video = await this.Video.findById(videoId);
    if (!video) {
      this.ctx.throw(404, '未找到该视频');
    }
    const getComments = this.app.model.Comment.find({
      video: videoId,
    }).skip((pageNum - 1) * pageSize).limit(pageSize)
      .populate('user');
    const getCommentsCount = this.app.model.Comment.countDocuments({
      video: videoId,
    });

    const [ comments, commentsCount ] = await Promise.all([ getComments, getCommentsCount ]);
    return {
      comments,
      commentsCount,
    };
  }

  async deleteVideoComment(videoId, commentId) {
    const video = await this.Video.findById(videoId);
    if (!video) {
      this.ctx.throw(404, '未找到该视频');
    }
    const comment = await this.app.model.Comment.findById(commentId);
    if (!comment) {
      this.ctx.throw(404, '未找到该评论');
    }

    if (!comment.user.equals(this.ctx.user._id)) {
      this.ctx.throw(403);
    }

    await comment.remove();

    // 更新video中的评论数量
    video.commentsCount = await this.app.model.Comment.countDocuments({
      video: videoId,
    });
    await video.save();
  }


  async likeVideo(videoId) {
    let video = await this.Video.findById(videoId);

    if (!video) {
      this.ctx.throw(404, '未找到该视频');
    }

    // 查看该用户是否喜欢过该视频，同时更新video中喜欢和不喜欢数量
    let like = await this.app.model.Like.findOne({
      user: this.ctx.user._id,
      video: videoId,
    });
    let isLiked = false;

    if (!like) {
      like = await new this.app.model.Like({
        user: this.ctx.user._id,
        video: videoId,
        like: 1,
      }).save();
      isLiked = true;
    } else if (like && like.like === -1) {
      like.like = 1;
      await like.save();
      isLiked = true;
    } else if (like && like.like === 1) {
      await like.remove();
      isLiked = false;
    }

    video.likesCount = await this.app.model.Like.countDocuments({
      video: videoId,
      like: 1,
    });

    video.dislikesCount = await this.app.model.Like.countDocuments({
      video: videoId,
      like: -1,
    });

    await video.save();

    video = video.toJSON();
    video.isLiked = isLiked;

    return video;
  }

  async dislikeVideo(videoId) {
    let video = await this.Video.findById(videoId);

    if (!video) {
      this.ctx.throw(404, '未找到该视频');
    }

    // 查看该用户是否喜欢过该视频，同时更新video中喜欢和不喜欢数量
    let like = await this.app.model.Like.findOne({
      user: this.ctx.user._id,
      video: videoId,
    });
    let isdisLiked = false;

    if (!like) {
      like = await new this.app.model.Like({
        user: this.ctx.user._id,
        video: videoId,
        like: -1,
      }).save();
      isdisLiked = true;
    } else if (like && like.like === 1) {
      like.like = -1;
      await like.save();
      isdisLiked = true;
    } else if (like && like.like === -1) {
      await like.remove();
      isdisLiked = false;
    }

    video.likesCount = await this.app.model.Like.countDocuments({
      video: videoId,
      like: 1,
    });

    video.dislikesCount = await this.app.model.Like.countDocuments({
      video: videoId,
      like: -1,
    });

    await video.save();
    video = video.toJSON();
    video.isdisLiked = isdisLiked;

    return video;
  }

  async getUserLikeVideos(userId, pageNum, pageSize) {
    const likes = await this.app.model.Like.find({
      user: userId,
      like: 1,
    }).sort({
      createdAt: -1,
    });
    const videoIds = likes.map(like => like.video);
    const videos = await this.Video.find({
      _id: {
        $in: videoIds,
      },
    }).skip((pageNum - 1) * pageSize).limit(pageSize);
    const videosCount = await this.Video.countDocuments({
      _id: {
        $in: videoIds,
      },
    });

    return {
      videos,
      videosCount,
    };
  }
}

module.exports = VideoService;
