const Service = require('egg').Service;
const jwt = require('jsonwebtoken');

class UserService extends Service {
  get User() {
    return this.app.model.User;
  }
  findByUserName(userName) {
    return this.User.findOne({
      userName,
    });
  }

  findByEmail(email) {
    return this.User.findOne({
      email,
    });
  }

  findById(id) {
    return this.User.findById(id);
  }
  async createUser(data) {
    data.password = this.ctx.helper.md5(data.password);
    const user = await new this.User(data);
    await user.save();
    return user;
  }

  async updateUser(data) {
    data.password && (data.password = this.ctx.helper.md5(data.password));
    let user = this.ctx.user;
    user = Object.assign(user, data);
    await user.save();
  }

  createToken(data) {
    return jwt.sign(data, this.app.config.jwt.secret, {
      expiresIn: this.app.config.jwt.expiresIn,
    });
  }

  verifyToken(token) {
    return jwt.verify(token, this.app.config.jwt.secret);
  }

  async subscribe(userId, channelId) {
    // 查看用户是否已经订阅了
    const { Subscription } = this.app.model;
    const record = await Subscription.findOne({
      user: userId,
      channel: channelId,
    });
    // 没有订阅添加订阅
    const user = await this.findById(channelId);
    if (!record) {
      const subscription = new Subscription({
        user: userId,
        channel: channelId,
      });
      await subscription.save();
      // 将被订阅者的订阅数量加1
      user.subscribersCount++;
      await user.save();
    }


    // 返回用户信息
    return user;
  }


  async unSubscribe(userId, channelId) {
    // 查看用户是否已经订阅了
    const { Subscription } = this.app.model;
    const record = await Subscription.findOne({
      user: userId,
      channel: channelId,
    });
    const user = await this.findById(channelId);
    if (record) {
      await record.remove();

      // 将被订阅者的订阅数量减1
      user.subscribersCount--;
      await user.save();
    }
    return user;

  }
}

module.exports = UserService;
