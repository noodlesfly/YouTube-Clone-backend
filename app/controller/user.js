'use strict';

const Controller = require('egg').Controller;

class UserController extends Controller {
  async register() {
    const { ctx } = this;
    const body = ctx.request.body;
    // 基础验证
    ctx.validate({
      userName: { type: 'string' },
      email: { type: 'email' },
      password: { type: 'password', min: 6 },
    });

    let user = await this.service.user.findByUserName(body.userName);

    if (user) {
      ctx.throw(422, '用户已存在');
    }

    user = await this.service.user.findByEmail(body.email);

    if (user) {
      ctx.throw(422, '邮箱已存在');
    }

    user = await this.service.user.createUser(body);

    const token = this.service.user.createToken({
      userId: user._id,
    });
    // 数据库验证
    ctx.body = {
      user: {
        userName: user.userName,
        email: user.email,
        token,
        avatar: user.avatar,
        channelDescription: user.channelDescription,
      },
    };
  }

  async login() {
    const { ctx } = this;
    const body = ctx.request.body;
    // 基础验证
    ctx.validate({
      email: { type: 'email' },
      password: { type: 'password', min: 6 },
    });


    const user = await this.service.user.findByEmail(body.email).select('+password');
    // 校验邮箱是否存在
    if (!user) {
      ctx.throw(422, '用户不存在，请前往注册');
    }

    // 校验密码是否正确
    if (user.password !== this.ctx.helper.md5(body.password)) {
      ctx.throw(422, '密码不正确');
    }
    // 生成token
    const token = this.service.user.createToken({
      userId: user._id,
    });
    // 数据库验证
    ctx.body = {
      user: {
        userName: user.userName,
        email: user.email,
        token,
        avatar: user.avatar,
        channelDescription: user.channelDescription,
      },
    };
  }

  async getCurrentUser() {
    const { ctx } = this;
    const user = ctx.user;


    //  返回数据信息
    ctx.body = {
      user: {
        userName: user.userName,
        email: user.email,
        token: ctx.header.authorization,
        avatar: user.avatar,
        channelDescription: user.channelDescription,
      },
    };
  }

  async updateCurrentUser() {
    const { ctx } = this;
    // 基本数据验证
    ctx.validate({
      userName: {
        type: 'string', required: false,
      },
      email: {
        type: 'email', required: false,
      },
      password: {
        type: 'password', min: 6, required: false,
      },
      avatar: {
        type: 'string', required: false,
      },
      channelDescription: {
        type: 'string', required: false,
      },
    });


    const body = ctx.request.body;
    // 校验用户名邮箱是否已存在
    const userInDb = ctx.user;
    if (body.email) {
      if (userInDb.email !== body.email && await this.service.user.findByEmail(body.email)) {
        ctx.throw(422, '邮箱已存在');
      }
    }

    if (body.userName) {
      if (userInDb.userName !== body.userName && await this.service.user.findByUserName(body.userName)) {
        ctx.throw(422, '用户已存在');
      }
    }

    await this.service.user.updateUser(body);
    const user = ctx.user;
    ctx.body = {
      user: {
        userName: user.userName,
        email: user.email,
        avatar: user.avatar,
        channelDescription: user.channelDescription,
      },
    };

  }

  async subscribe() {
    const { ctx } = this;
    const { userId: channelId } = ctx.params;
    const userId = ctx.user._id;
    // 订阅者不能是自己

    if (userId.equals(channelId)) {
      ctx.throw(422, '用户不能订阅自己');
    }

    // 添加订阅
    const user = await this.service.user.subscribe(userId, channelId);
    ctx.body = {
      user: {
        ... this.ctx.helper._.pick(user, [ 'userName', 'email', 'avatar', 'channelDescription', 'subscribersCount' ]),
        isSubsribed: true,
      },
    };
  }

  async unSubscribe() {
    const { ctx } = this;
    const { userId: channelId } = ctx.params;
    const userId = ctx.user._id;

    if (userId.equals(channelId)) {
      ctx.throw('用户不能取消订阅自己');
    }

    const user = await this.service.user.unSubscribe(userId, channelId);
    ctx.body = {
      user: {
        ... this.ctx.helper._.pick(user, [ 'userName', 'email', 'avatar', 'channelDescription', 'subscribersCount' ]),
        isSubsribed: false,
      },
    };
  }

  // 获取频道用户信息
  async getUser() {
    const { ctx } = this;
    const { userId: channelId } = ctx.params;
    // 获取订阅状态
    let isSubsribed = false;
    if (ctx.user) {
      const record = await this.app.model.Subscription.findOne({
        user: ctx.user._id,
        channel: channelId,
      });

      if (record) {
        isSubsribed = true;
      }
    }

    // 获取用户信息
    const user = await this.service.user.findById(channelId);
    ctx.body = {
      user: {
        ... this.ctx.helper._.pick(user, [ 'userName', 'email', 'avatar', 'channelDescription', 'subscribersCount' ]),
        isSubsribed,
      },
    };

  }
  //  获取用户关注的频道列表
  async getSubscriptions() {
    const { ctx, app } = this;
    const { userId } = ctx.params;
    console.log(userId);
    const Subscription = app.model.Subscription;
    let subscriptions = await Subscription.find({
      user: userId,
    }).populate('channel');
    subscriptions = subscriptions.map(item => {
      return ctx.helper._.pick(item.channel, [ '_id', 'avatar', 'userName' ]);
    });

    ctx.body = {
      subscriptions,
    };
  }
}

module.exports = UserController;
