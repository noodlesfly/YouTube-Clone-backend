module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const LikeSchema = new Schema({
    like: {
      type: Number,
      enum: [ 1, -1 ], // 1 喜欢 -1 不喜欢
      required: true,
    },
    user: {
      type: mongoose.ObjectId,
      required: true,
      ref: 'User',
    },
    video: {
      type: mongoose.ObjectId,
      required: true,
      ref: 'Video',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  });


  return mongoose.model('VideoLike', LikeSchema);
};

