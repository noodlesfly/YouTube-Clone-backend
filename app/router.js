'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  const auth = app.middleware.auth();
  router.prefix('/api/v1');
  router.post('/users', controller.user.register);
  router.post('/users/login', controller.user.login);
  router.get('/user', auth, controller.user.getCurrentUser);
  router.patch('/user', auth, controller.user.updateCurrentUser);
  router.get('/users/:userId', app.middleware.auth({ required: false }), controller.user.getUser);
  // 用户订阅
  router.post('/user/:userId/subscribe', auth, controller.user.subscribe);
  router.delete('/user/:userId/subscribe', auth, controller.user.unSubscribe);
  router.get('/user/:userId/subscriptions', controller.user.getSubscriptions);
  // 阿里云vod
  router.get('/vod/CreateUploadVideo', auth, controller.vod.createUploadVideo);
  router.post('/vod/RefreshUploadVideo', auth, controller.vod.refreshUploadVideo);
  router.get('/vod/getUploadAuth', controller.vod.getUploadAuth);
  // 视频
  router.post('/videos', auth, controller.video.createVideo);
  router.get('/videos/:videoId', app.middleware.auth({ required: false }), controller.video.getVideo);
  router.get('/videos', controller.video.getVideos);
  router.get('/users/:userId/videos', controller.video.getUserVideos);
  router.get('/user/videos/feed', auth, controller.video.getUserFeedVideos); // 获取用户关注的视频列表
  router.patch('/videos/:videoId', auth, controller.video.updateVideo); // 修改视频
  router.delete('/videos/:videoId', auth, controller.video.deleteVideo); // 删除视频
  router.post('/videos/:videoId/comments', auth, controller.video.createComment); // 为视频添加评论
  router.get('/videos/:videoId/comments', controller.video.getVideoComments); // 获取视频评论列表
  router.delete('/videos/:videoId/comments/:commentId', auth, controller.video.deleteVideoComment); // 删除视频评论
  router.post('/videos/:videoId/like', auth, controller.video.likeVideo); // 喜欢视频
  router.post('/videos/:videoId/dislike', auth, controller.video.dislikeVideo); // 不喜欢视频
  router.get('/user/videos/liked', auth, controller.video.getUserLikeVideos); // 获取用户喜欢的视频列表


};
