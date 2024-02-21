---
author: chou401
pubDatetime: 2024-02-21T11:13:59.000Z
modDatetime:
title: JWT
featured: false
draft: false
tags:
  - test
description: 介绍 JWT & token + redis
---

## Table of contents

## 什么是 JWT

JSON Web令牌是一种开放行业标准,用于在两个实体(通常是客户端(例如应用程序的前端)和服务器(应用程序的后端))之间共享信息。

它们包含JSON对象,这些对象具有需要共享的信息。每个JWT还使用加密(哈希)签名,以确保客户或恶意方不能更改JSON内容(也称为JWT声明)。

例如,当您使用Google登录时,Google会发布一个JWT,其中包含以下声明/ JSON有效负载:

```json
{
  "iss": "https://accounts.google.com",
  "azp": "1234987819200.apps.googleusercontent.com",
  "aud": "1234987819200.apps.googleusercontent.com",
  "sub": "10769150350006150715113082367",
  "at_hash": "HK6E_P6Dh8Y93mRNtsDB1Q",
  "email": "jsmith@example.com",
  "email_verified": "true",
  "iat": 1353601026,
  "exp": 1353604926,
  "nonce": "0394852-3190485-2490358",
  "hd": "example.com"
}
```

使用上述信息,使用Google登录的客户端应用程序可以确切知道最终用户是谁。

### 什么是令牌,为什么需要它?

为什么auth服务器不能仅将信息作为普通的JSON对象发送,以及为什么需要将其转换为“令牌”。
如果身份验证服务器以普通JSON的形式发送它,则客户端应用程序的API将无法验证它们接收的内容是否正确。例如,恶意攻击者可以更改用户ID(sub 在上面的示例JSON中声明),并且应用程序的API无法知道已经发生了这种情况。
由于此安全问题,auth服务器需要以可以由客户端应用程序验证的方式传输此信息, 这就是“令牌”的概念出现在图片中的地方。
简而言之,令牌是一个字符串,其中包含一些可以安全验证的信息。它可能是一组指向数据库中ID的字母数字字符的随机集合, 或者它可能是编码的JSON,可以由客户端自我验证(称为JWT)。

## JWT 的结构

JWT 包含三个部分

- 标头：由两部分组成：
  - 正在使用的签名算法。
  - 令牌的类型，在这种情况下，主要是“jwt”。
- 有效载荷：有效载荷包含权利要求或 JSON 对象。
- 签名：通过加密算法生成的字符串，可用于验证 JSON 有效负载的完整性。

## 创建 JWT

jwtutil

```java
public class JwtUtil {

  private static final String SECRET_KEY = "secretKey:e10adc3949ba59abbe56e057f20f883e";

  /**
   * 生成jwt
   */
  public static String createJwt(Map<String, String> map) {
    Algorithm algorithm = Algorithm.HMAC256(SECRET_KEY);
    // 获取日历对象
    Calendar nowTime = Calendar.getInstance();
    // 默认1天过期时间
    nowTime.add(Calendar.DATE, 1);
    // 得到过期时间
    Date expireTime = nowTime.getTime();
    // 设置header信息
    HashMap<String, Object> header = new HashMap<>(2);
    header.put("alg", "HS256");
    header.put("typ", "JWT");

    // 新建一个 JWT 的 Builder 对象
    JWTCreator.Builder builder = JWT.create();
    // 将map集合中的数据设置进payload
    map.forEach(builder::withClaim);

    // 生成 token：头部+载荷+签名
    return builder.withHeader(header).withExpiresAt(expireTime).sign(algorithm);
  }

  public static boolean checkToken(String token) {
    try {
      verifyToken(token);
      return true;
    } catch (Exception e) {
      e.printStackTrace();
    }
    return false;
  }

  /**
   * 验证Token
   *
   * @param token token 值
   */
  private static Map<String, Claim> verifyToken(String token) {
    JWTVerifier verifier = JWT.require(Algorithm.HMAC256(SECRET_KEY)).build();
    DecodedJWT jwt = null;
    try {
      jwt = verifier.verify(token);
    } catch (Exception e) {
      throw new NotAuthException("令牌无效，请重新登录");
    }
    return jwt.getClaims();
  }

  /**
   * 解析Token
   *
   * @param token token值
   */
  public static Map<String, Claim> parseToken(String token) {
    DecodedJWT decodedJWT = JWT.decode(token);
    return decodedJWT.getClaims();
  }

}
```

## 验证 JWT

身份验证服务器会将JWT发送回客户端的前端。前端将JWT附加到网络请求到客户端的api层。api层将执行以下步骤来验证JWT：

- 固定JWT的标头部分。
- 是否在base64上解码以获取纯文本JSON: {"typ":"JWT","alg":"HS256"}。
- 验证 typ 字段的价值是 JWT 和 alg 是 HS256。如果没有,它将拒绝JWT。
- 联排器签名秘密密钥并运行相同 Base64URLSafe(HMACSHA256(...)) 在传入JWT的标题和正文上进行签名操作。
- 检查生成的签名与传入JWT的签名相同。如果不是,则JWT将被拒绝。
- 我们以64为基地解码JWT的主体。
- 如果当前时间(以毫秒为单位)大于JSON的时间,我们将拒绝JWT expiry 时间(因为JWT已过期)。

我们只有在通过上述所有检查后才能信任传入的JWT。

## JWT 的利弊

优点：

- 安全: 使用秘密(HMAC)或公共/私人密钥对(RSA或ECDSA)对JWT进行数字签名,以防止客户或攻击者对其进行修改。
- 仅存储在客户身上: 您在服务器上生成JWT并将其发送到客户端。然后,客户端随每个请求一起提交JWT。这样可以节省数据库空间。
- 高效/无状态: 由于不需要数据库查找,因此可以快速验证JWT。这在大型分布式系统中特别有用。

缺点：

- 不可撤销: 由于其独立的性质和无状态的验证过程,可能很难在JWT自然过期之前撤销JWT。因此,诸如立即禁止用户之类的操作无法轻松实现。话虽如此,有一种维持的方法 JWT拒绝/黑名单, 通过它,我们可以立即撤销它们。
- 取决于一个秘密钥匙: JWT的创建取决于一个秘密密钥。如果该密钥被破坏,则攻击者可以制造自己的JWT,API层将接受。反过来,这意味着如果秘密密钥被破坏,攻击者可能会欺骗任何用户的身份。我们可以通过不时更改密钥来降低这种风险。

总而言之,JWT对于不需要立即禁止用户之类操作的大型应用程序最有用。

## JWT vs token + redis

JWT 是无状态的， 扩展很方便，缺点是一旦签发在达到有效期前不能撤销。redis + token 是有状态的，token 通过 redis 来进行集中维护，系统扩展性受制于 redis 集群的并发能力，优点是可以随时撤销签发的 token。

JWT 把用户信息用密钥加密防篡改，然后放到请求头里。用户请求的时候，再解密，服务器就不需要保存用户的信息了。加密之后的信息是什么，服务器就认为是什么。这种适合，在拥有庞大用户量的系统中，用户保持登录态仅作为跟踪分析用户行为，不会对账号本身造成过大的影响。例如单点登录。如果系统需要监控用户状态，随时准备失效 token，进行下线用户操作，那就有必要使用 token + redis 了。

当然也有一些方式可以依赖 JWT 实现用户下线的操作。

- JWT 进行认证，redis 作为证书撤销列表也就是黑名单来使用。
- 使用消息机制，广播 token 无效事件。各服务收到此消息将对应的 token 加入到本地维护的无效 token 列表。要验证 JWT 是否被强制下线，只需要查询本地维护的无效 token 列表即可。

但是如果使用这些方法，用 JWT 就有点多此一举了。

如果只是将 JWT 当做访问凭证，那么它面临的问题和普通的 token，即普遍意义上的 session 模式完全一样，jwt 并不能解决这个问题，反而增加了复杂度。
JWT 的场景，是可靠的发布消息，就像 ios 登录一样，将用户信息封装成 JWT 提供给第三方业务服务，业务服务只需要 apple 发布的公钥用于验证 JWT 的真实性，以决定是否使用其提供的内容，这也是为什么 ios 登录时提供的不仅有 jwt，还有一个用于访问 api 的 code，后者才是对应的访问凭证。
