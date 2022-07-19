module.exports = (options = { required: true }) => {
  return async (ctx, next) => {
    // 验证token是否有效 required代表如果
    let token = ctx.header.authorization;

    token = token ? token.split('Bearer ')[1] : null;

    if (token) {
      try {
        const userInfo = ctx.service.user.verifyToken(token);
        //   token有效 将userId挂载到ctx
        const user = await ctx.service.user.findById(userInfo.userId);
        ctx.user = user;
      } catch (error) {
        ctx.throw(401);
      }
    } else if (options.required) {
      ctx.throw(401);
    }


    await next();
  };
};
