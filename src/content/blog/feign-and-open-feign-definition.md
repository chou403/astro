---
author: chou401
pubDatetime: 2024-02-22T15:00:03.000Z
modDatetime: 2024-02-29T18:14:14Z
title: Feign & openFeign
featured: false
draft: false
tags:
  - spring cloud
  - feign
description: feign & openFeign 介绍以及使用
---

## Table of contents

## 什么是Feign

Netflix Feign 是 Netflix 公司发布的一种实现负载均衡和服务调用的开源组件。Spring Cloud 将其与 Netflix 中的其他开源服务组件（例如 Eureka、Ribbon 以及 Hystrix 等）一起整合进 Spring Cloud Netflix 模块中，整合后全称为 Spring Cloud Netflix Feign Feign 对 [Ribbon](http://c.biancheng.net/springcloud/ribbon.html)进行了集成，利用 Ribbon 维护了一份可用服务清单，并通过 Ribbon 实现了客户端的负载均衡。Feign 是一种声明式服务调用组件，它在 RestTemplate 的基础上做了进一步的封装。通过 Feign，我们只需要声明一个接口并通过注解进行简单的配置（类似于 Dao 接口上面的 Mapper 注解一样）即可实现对 HTTP 接口的绑定。通过 Feign，我们可以像调用本地方法一样来调用远程服务，而完全感觉不到这是在进行远程调用。Feign 支持多种注解，例如 Feign 自带的注解以及 JAX-RS 注解等，但遗憾的是 Feign 本身并不支持 Spring MVC 注解，这无疑会给广大 Spring 用户带来不便。

## 什么是openFeign

2019 年 Netflix 公司宣布 Feign 组件正式进入停更维护状态，于是 Spring 官方便推出了一个名为 OpenFeign 的组件作为 Feign 的替代方案。

OpenFeign 全称 Spring Cloud OpenFeign，它是 Spring 官方推出的一种声明式服务调用与负载均衡组件，它的出现就是为了替代进入停更维护状态的 Feign。OpenFeign 是 Spring Cloud 对 Feign 的二次封装，它具有 Feign 的所有功能，并在 Feign 的基础上增加了对 Spring MVC 注解的支持，例如 @RequestMapping、@GetMapping 和 @PostMapping 等。

常用注解
| 注解 | 说明 |
| --- | --- |
|@FeignClient | 该注解用于通知 OpenFeign 组件对 @RequestMapping 注解下的接口进行解析，并通过动态代理的方式产生实现类，实现负载均衡和服务调用。|
|EnableFeignClients|该注解用于开启 OpenFeign 功能，当 Spring Cloud 应用启动时，OpenFeign 会扫描标有 @FeignClient 注解的接口，生成代理并注册到 Spring 容器中。|
|@RequestMapping |Spring MVC 注解，在 Spring MVC 中使用该注解映射请求，通过它来指定控制器（Controller）可以处理哪些 URL 请求，相当于 Servlet 中 web.xml 的配置。|
|@GetMapping|Spring MVC 注解，用来映射 GET 请求，它是一个组合注解，相当于 @RequestMapping(method = RequestMethod.GET) 。|
|@PostMapping|Spring MVC 注解，用来映射 POST 请求，它是一个组合注解，相当于 @RequestMapping(method = RequestMethod.POST) 。|

## Feign与OpenFeign的对比

**相同点：**

- Feign 和 OpenFeign 都是 Spring Cloud 下的远程调用和负载均衡组件。
- Feign 和 OpenFeign 作用一样，都可以实现服务的远程调用和负载均衡。
- Feign 和 OpenFeign 都对 Ribbon 进行了集成，都利用 Ribbon 维护了可用服务清单，并通过 Ribbon 实现了客户端的负载均衡。
- Feign 和 OpenFeign 都是在服务消费者（客户端）定义服务绑定接口并通过注解的方式进行配置，以实现远程服务的调用。

**不同点：**

- Feign 和 OpenFeign 的依赖项不同，Feign 的依赖为 spring-cloud-starter-feign，而 OpenFeign 的依赖为 spring-cloud-starter-openfeign。
- Feign 和 OpenFeign 支持的注解不同，Feign 支持 Feign 注解和 JAX-RS 注解，但不支持 Spring MVC 注解；OpenFeign 除了支持 Feign 注解和 JAX-RS 注解外，还支持 Spring MVC 注解。

## openFeign使用

引入依赖

```xml
<!-- openfeign依赖 -->
<dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-starter-openfeign</artifactId>
</dependency>

<!-- openfeign优化请求连接池依赖 -->
<dependency>
     <groupId>io.github.openfeign</groupId>
     <artifactId>feign-httpclient</artifactId>
</dependency>
```

定义远程调用接口

- 在 @FeignClient 注解中，value 属性的取值为：服务提供者的服务名，即服务提供者配置文件（application.yml）中 spring.application.name 的取值。
- 接口中定义的每个方法都与服务提供者中 Controller 定义的服务方法对应。
- openfeign本身并不具备fallback降级属性，需要搭配降级框架如（hystrix或sentinel）。如果未引入降级框架，即使声明fallback降级服务类，在远程调用发生异常时，也不会触发。

```java
@Component
@FeignClient(value = "service5")
public interface FeignService {

     @GetMapping("/api/v1/service5")
     List<Integer> get();

}
```

启动类添加注解@EnableFeignClients

```java
@EnableFeignClients
@EnableEurekaClient
@SpringBootApplication
public class Service3Application {

     public static void main(String[] args) {
        SpringApplication.run(Service3Application.class, args);
    }

}
```

## OpenFeign超时处理

openFeign 客户端的默认超时时间为 1 秒钟，如果服务端处理请求的时间超过 1 秒就会报错。为了避免这样的情况，我们需要对 OpenFeign 客户端的超时时间进行控制。

yml 添加如下进行配置

```yml
ribbon:
  ReadTimeout: 6000 #建立连接所用的时间，适用于网络状况正常的情况下，两端两端连接所用的时间
  ConnectionTimeout: 6000 #建立连接后，服务器读取到可用资源的时间

feign:
  client:
    httpclient:
      enabled: true # 开启 HttpClient优化连接池
  compression:
    request:
      enabled: true # 开启请求数据的压缩功能
      mime-types: text/xml,application/xml, application/json # 压缩类型
      min-request-size: 1024 # 最小压缩值标准，当数据大于 1024 才会进行压缩
    response:
      enabled: true # 开启响应数据压缩功能
```

## OpenFeign日志增强

yml 添加日志级别声明

```yml
logging:
  level:
    com.ftc.service3.FeignService: debug #feign日志以什么样的级别监控该接口
```

说明：

- com.ftc.service3.FeignService 是开启 @FeignClient 注解的接口（即服务绑定接口）的完整类名。也可以只配置部分路径，表示监控该路径下的所有服务绑定接口
- debug：表示监听该接口的日志级别。

创建日志配置类

```java
@Configuration
public class ConfigBean {

  /**
    * OpenFeign 日志增强
    * 配置 OpenFeign 记录哪些内容
    */
  @Bean
  Logger.Level feginLoggerLevel() {
      return Logger.Level.FULL;
  }
}
```

该配置的作用是通过配置的 Logger.Level 对象告诉 OpenFeign 记录哪些日志内容。Logger.Level 的具体级别如下：

- NONE：不记录任何信息。
- BASIC：仅记录请求方法、URL 以及响应状态码和执行时间。
- HEADERS：除了记录 BASIC 级别的信息外，还会记录请求和响应的头信息。
- FULL：记录所有请求与响应的明细，包括头信息、请求体、元数据等等。

## OpenFeign 实现 RequestInterceptor

在一些业务场景中，微服务间相互调用需要做鉴权，以保证我们服务的安全性。即：服务 A 调用服务 B 的时候需要将服务 B 的一些鉴权信息传递给服务 B，从而保证服务 B 的调用也可以通过鉴权，进而保证整个服务调用链的安全。

通过 RequestInterceptor 拦截器拦截 openfeign 服务请求，将上游服务的请求头或者请求体中的数据封装到我们的 openfeign 调用的请求模版中，从而实现上游数据的传递。

### RequestInterceptor 实现类

```java
@Slf4j
public class MyFeignRequestInterceptor implements RequestInterceptor {
  /**
   * 这里可以实现对请求的拦截，对请求添加一些额外信息之类的
   *
   * @param requestTemplate
   */
  @Override
  public void apply(RequestTemplate requestTemplate) {
    // 1. obtain request
    final ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();

    // 2. 兼容hystrix限流后，获取不到ServletRequestAttributes的问题（使拦截器直接失效）
    if (Objects.isNull(attributes)) {
      log.error("MyFeignRequestInterceptor is invalid!");
      return;
    }
    HttpServletRequest request = attributes.getRequest();

    // 2. obtain request headers，and put it into openFeign RequestTemplate
    Enumeration<String> headerNames = request.getHeaderNames();
    if (Objects.nonNull(headerNames)) {
      while (headerNames.hasMoreElements()) {
        String name = headerNames.nextElement();
        String value = request.getHeader(name);
        requestTemplate.header(name, value);
      }
    }

    // todo 需要传递请求参数时放开
    3. obtain request body, and put it into openFeign RequestTemplate
    Enumeration<String> bodyNames = request.getParameterNames();
    StringBuffer body = new StringBuffer();
    if (bodyNames != null) {
      while (bodyNames.hasMoreElements()) {
        String name = bodyNames.nextElement();
        String value = request.getParameter(name);
        body.append(name).append("=").append(value).append("&");
      }
    }
    if (body.length() != 0) {
      body.deleteCharAt(body.length() - 1);
      requestTemplate.body(body.toString());
      log.info("openfeign interceptor body:{}", body.toString());
    }
  }
}
```

### 使 RequestInterceptor 生效

1. 代码方式全局生效

   ```java
   @Configuration
   public class MyConfiguration {

       @Bean
       public RequestInterceptor requestInterceptor() {
           return new MyFeignRequestInterceptor();
       }
   }
   ```

2. 配置方式全局生效

   ```yml
   feign:
     client:
       config:
         default:
           connectTimeout: 5000
           readTimeout: 5000
           loggerLevel: full
           # 拦截器配置（和@Bean的方式二选一）
           requestInterceptors:
             - com.chou401.feign.config.MyFeignRequestInterceptor
   ```

3. 代码方式针对某个服务生效

   ```java
   @FeignClient(value = "service-a", configuration = MyFeignRequestInterceptor.class)
   public interface ServiceClient {

   }

   ```

4. 配置方式针对某个服务生效

   ```yml
   feign:
     client:
       config:
         SERVICE-A:
           connectTimeout: 5000
           readTimeout: 5000
           loggerLevel: full
           # 拦截器配置（和@Bean的方式二选一）
           requestInterceptors:
             - com.chou401.feign.config.MyFeignRequestInterceptor
   ```

### 服务提供者增加拦截器（用于获取请求头中的数据）

```java
@Slf4j
public class MvcInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String token = request.getHeader("token");
        log.info("obtain token is : {}", token);
        return true;
    }
}
```

```java
@Configuration
public class MvcInterceptorConfig implements WebMvcConfigurer {
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new MvcInterceptor())
                .addPathPatterns("/**");
    }
}
```

### 结合 Hystrix 限流使用的坑

application.yaml 配置文件开启限流

```yaml
feign:
  hystrix:
    enabled: true
hystrix:
  command:
    default:
      execution:
        isolation:
          thread:
            timeoutInMilliseconds: 30000
```

做完上述配置后，**Feign 接口的熔断机制为：线程模式**。如果我们自定义了一个 `RequestInterceptor` 实现类，就会导致 hystrix 熔断机制失效，接口调用异常（404、null）。

#### 原因分析

- 在 Feign 调用之前，会先走到 RequestInterceptor 拦截器，拦截器中使用了 `ServletRequestAttributes` 获取请求数据。
- 默认 Feign 使用的是线程池模式，当开始熔断的时候，负责熔断的线程和执行 Feign 接口的线程不是同一个线程，ServletRequestAttributes 取到的将会是空值。

#### 解决方案

将 hystrix 熔断方式从线程模式改为信号量模式

```yaml
feign:
  hystrix:
    enabled: true
hystrix:
  command:
    default:
      execution:
        isolation:
          thread:
            timeoutInMilliseconds: 30000
          strategy: SEMAPHORE
```

#### hystrix 线程池和信号量隔离区别

|             | 线程池                                     | 信号量                                   |
| ----------- | ------------------------------------------ | ---------------------------------------- |
| 线程        | 请求线程和调用 provider 线程不是同一条线程 | 请求线程和调用 provider 线程是同一条线程 |
| 开销        | 排队、调用、上下文切换等                   | 无线程切换，开销低                       |
| 异步        | 支持                                       | 不支持                                   |
| 并发支持    | 支持：最大线程池大小                       | 支持： 最大信号量上限                    |
| 传递 Header | 不支持                                     | 支持                                     |
| 支持超时    | 支持                                       | 不支持                                   |

#### 线程和信号量隔离的使用场景

> **线程池隔离**

- 请求并发量大，并且耗时长（一般是计算量大或者读数据库）
- 采用线程池隔离，可以保证大量的容器线程可用，不会由于其他服务原因，一直处于阻塞或者等待状态，快速失败返回

> **信号量隔离**

- 请求并发量大，并且耗时短（一般是计算量小，或读缓存）
- 采用信号量隔离时的服务返回往往非常快，不会占用容器线程太长时间
- 其减少了线程切换的一些开销，提高了缓存服务的效率

## openfeign 核心组件

使用 Feign 最核心的是要构造一个 FeignClient，里面包含了一系列的组件：

1. Encoder（SpringEncoder）
   Encoder 编码器，当我们调用接口时，如果传递的参数是一个对象，Feign 需要对这个对象进行 encode 编码，做 JSON 序列化，即：encoder 负责将 Java 对象装换成 JSON 字符串。
2. Decoder（ResponseEntityDecoder）
   Decoder 解码器，当接口收到一个 JSON 对象后，Feign 需要对这个对象进行 decode 解码，即：decoder 负责将 JSON 字符串转换成 JavaBean 对象。
3. Contract（SpringMvcContract）
   一般来说 Feign 的@FeignClient 注解需要和 Spring Web MVC 支持的@PathVariable、@RequestMapping、@pRequestParam 等注解结合起来使用，但是 Feign 本身是不支持 Spring Web MVC 注解的，所以需要有一个契约组件（Contract），负责解释 Spring MVC 的注解，让 Feign 可以和 Spring MVC 注解结合起来使用。
4. Logger（Slf4jLogger）
   Logger 为打印 Feign 接口请求调用日志的日志组件，默认为 Slf4jLogger。

## openfeign 如何扫描所有 FeignClient

### 基于 openfeign 低版本（SpringCloud 2020.0.x版本之前）

我们知道 openfeign 有两个注解：@EnableFeignClients 和 @FeignClient，其中：

> @EnableFeignClients：用来开启 openfeign
>
> @FeignClient：标记要用 openfeign 来拦截的请求接口

为什么 Service-B 服务中定义了一个 ServiceAClient 接口（继承自 Service-A 的 api 接口），某 Controller 或 Service 中通过 @Autowired 注入一个 ServiceAClient 接口的实例，就可以通过 openfeign 做负载均衡去调用 Service-A服务？

#### @FeignClient解析

##### @FeignClient注解解释

```java
public @interface FeignClient {
    // 微服务名
    @AliasFor("name")
    String value() default "";
    // 已经废弃，直接使用 name 即可
    /** @deprecated */
    @Deprecated
    String serviceId() default "";
    // 存在多个相同 FeignClient 时，可以使用 contextId 做唯一约束
    String contextId() default "";

    @AliasFor("value")
    String name() default "";
    // 对应 Spring 的 @Qualifier 注解，在定义 @FeignClient 时，指定 qualifier
    // 在 @Autowired 注入 FeignClient 时，使用 @Qualifier 注解
    /** @deprecated */
    @Deprecated
    String qualifier() default "";

    String[] qualifiers() default {};
    // 用于配置指定服务的地址 / IP，相当于直接请求这个服务，不经过 Ribbon 的负载均衡
    String url() default "";
    // 当调用请求发生 404 错误时，如果 decode404 的值为 true，会执行 decode 解码用 404 代替抛出 FeignException 异常，否则直接抛出异常
    boolean decode404() default false;
    // OpenFeign 的配置类，在配置类中可以自定义 Feign 的 Encoder、Decoder、LogLevel、Contract 等
    Class<?>[] configuration() default {};
    // 定义容错的处理类（回退逻辑），fallback 类必须实现 FeignClient 的接口
    Class<?> fallback() default void.class;
    // 也是容错的处理，但是可以知道熔断的异常信息
    Class<?> fallbackFactory() default void.class;
    // path 定义当前 FeignClient 访问接口时的统一前缀，比如接口地址是 /user/get，如果定义了前缀是 user，那么具体方法上的路径就只需要写 /get 即可
    String path() default "";

    boolean primary() default true;
}
```

##### @FeignClient 注解作用

用 @FeignClient 注解标注一个接口后，OpenFeign 会对这个接口创建一个对应的动态代理 --> REST Client（发送 RESTful 请求的客户端），然后可以将这个 REST Client 注入其他的组件（比如 SerivceBController），如果弃用了 Ribbon，就会采用负载均衡的方式，来进行 http 请求的发送。

###### 使用 @RibbonClient 自定义负载均衡策略

可以用 @RibbonClient 标准一个配置类，在 @RibbonClient 注解的 configuration 属性中可以指定配置类，自定义自己的 Ribbon 的 ILoadBalancer，@RibbonClient 的名称要和 @FeignClient 的名称一样

**在 SpringBoot 扫描不到的目录下新建一个配置类：**

```java
@Configuration
public class MyConfiguration {

    @Bean
    public IRule getRule() {
        return new MyRule();
    }

    @Bean
    public IPing getPing() {
        return new MyPing();
    }

}
```

**在 SpringBoot 可以扫描到的目录新建一个配置类（被 @RibbonClient 注解标注）：**
由于 @FeignClient 中填的name()/value() 是 Service-A，所以 @RibbonClient 的 value() 也必须是 Service-A，表示针对调用服务 Service-A 时做负载均衡。

```java
@Cinfiguration
@RibbonClient(name = "Service-A", configuration = MyConfiguration.class)
public class ServiceAConfiguration {

}
```

#### @EnableFeignClients 解析

`@EnableFeignClients` 注解用于开启 openfeign，可以猜测，@EnableFeignClients 注解会触发 openfeign 的核心机制：扫描所有包下面的 @FeignClient 注解的接口、生成 @FeignClient 标注接口的动态代理类。

基于这两个猜测解析 @EnableFeignClients。

```java
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE})
@Documented
@Import({FeignClientsRegistrar.class})
public @interface EnableFeignClients {
    String[] value() default {};

    String[] basePackages() default {};

    Class<?>[] basePackageClasses() default {};

    Class<?>[] defaultConfiguration() default {};

    Class<?>[] clients() default {};
}
```

`@EnableFeignClients` 注解中通过 `@Import` 导入了一个 `FeignClientsRegistrar` 类，FeignClientsRegistrar 负责 FeignClient 的注册（即：扫描指定包下的 @FeignClient 注解标注的接口、生成 FeignClient 动态代理类、触发后面的其他流程）。

##### FeignClientsRegistrar 类

![202402291451526](https://cdn.jsdelivr.net/gh/chou401/pic-md@master//img/202402291451526.png)

由于 `FeignClientsRegistrar` 实现自 `ImportBeanDefinitionRegistrar`，结合 [SpringBoot 的自动配置](spring-deifinition-integrated-impl.md)，得知，在 SpringBoot 启动过程中会进入到 FeignClientsRegistrar#registerBeanDefinitions(AnnotationMetadata metadata, BeanDefinitionRegistry registry) 方法。

```java
public void registerBeanDefinitions(AnnotationMetadata metadata, BeanDefinitionRegistry registry) {
    // 注册默认配置
    this.registerDefaultConfiguration(metadata, registry);
    // 注册所有的 FeignClient
    this.registerFeignClients(metadata, registry);
}
```

`registerBeanDefinitions()` 方法是 Feign 的核心入口方法，其中会做两件事：注册默认的配置、注册所有的 FeignClient。

###### 注册默认配置

`registerDefaultConfiguration()` 方法负责注册 openfeign 的默认配置。具体代码执行流程如下：

```java
private void registerDefaultConfiguration(AnnotationMetadata metadata, BeanDefinitionRegistry registry) {
    // 获取 @EnableFeignClients 注解中的全部属性
    Map<String, Object> defaultAttrs = metadata.getAnnotationAttributes(EnableFeignClients.class.getName(), true);
    if (defaultAttrs != null && defaultAttrs.containsKey("defaultConfiguration")) {
        String name;
        if (metadata.hasEnclosingClass()) {
            name = "default." + metadata.getEnclosingClassName();
        } else {
            // 默认这里，name 为启动类全路径名
            name = "default." + metadata.getClassName();
        }

        // 将以name 作为 beanName 的 BeanDefinition 注册到 BeanDefinitionRegistry 中
        this.registerClientConfiguration(registry, name, defaultAttrs.get("defaultConfiguration"));
    }

}
```

```java
private void registerClientConfiguration(BeanDefinitionRegistry registry, Object name, Object configuration) {
    // 构建 BeanDefinition
    BeanDefinitionBuilder builder = BeanDefinitionBuilder.genericBeanDefinition(FeignClientSpecification.class);
    builder.addConstructorArgValue(name);
    builder.addConstructorArgValue(configuration);
    // 注册 BeanDefinition
    registry.registerBeanDefinition(name + "." + FeignClientSpecification.class.getSimpleName(), builder.getBeanDefinition());
}
```

方法流程解析：

> 1.首先获取 @EnableFeignClients 注解的全部属性
>
> 2.如果属性不为空，并且属性中包含 defaultConfiguration，则默认字符串 `default.` 和启动类全路径名拼接到一起
>
> 3.然后再拼接上 `.FeignClientSpecification`，作为 beanName，构建出一个 BeanDefinition，将其注册到 BeanDefinitionRegistry 中。

###### 注册所有的 FeignClient

registerFeignClients()方法负责注册所有的FeignClient

```java
public void registerFeignClients(AnnotationMetadata metadata, BeanDefinitionRegistry registry) {
    LinkedHashSet<BeanDefinition> candidateComponents = new LinkedHashSet();
    // 获取 @EnableFeignClients 注解中的全部属性
    Map<String, Object> attrs = metadata.getAnnotationAttributes(EnableFeignClients.class.getName());
    // 获取 @EnableFeignClients 注解中的 clients 属性值，默认为空
    Class<?>[] clients = attrs == null ? null : (Class[])((Class[])attrs.get("clients"));
    if (clients != null && clients.length != 0) {
        Class[] var12 = clients;
        int var14 = clients.length;

        for(int var16 = 0; var16 < var14; ++var16) {
            Class<?> clazz = var12[var16];
            candidateComponents.add(new AnnotatedGenericBeanDefinition(clazz));
        }
    } else {
        // 获取类扫描器
        ClassPathScanningCandidateComponentProvider scanner = this.getScanner();
        scanner.setResourceLoader(this.resourceLoader);
        // 给类扫描器添加 Filter，只扫描 @FeignClient 注解
        scanner.addIncludeFilter(new AnnotationTypeFilter(FeignClient.class));
        // 从 @EnableFeignClients 注解中获取默认的包扫描路径
        Set<String> basePackages = this.getBasePackages(metadata);
        Iterator var8 = basePackages.iterator();

        while(var8.hasNext()) {
            String basePackage = (String)var8.next();
            // 扫描出包含 @FeignClient 注解的接口
            candidateComponents.addAll(scanner.findCandidateComponents(basePackage));
        }
    }

    Iterator var13 = candidateComponents.iterator();
    // 遍历扫描到的所有包含 @FeignClient 注解的接口（BeanDefinition）
    while(var13.hasNext()) {
        BeanDefinition candidateComponent = (BeanDefinition)var13.next();
        if (candidateComponent instanceof AnnotatedBeanDefinition) {
            AnnotatedBeanDefinition beanDefinition = (AnnotatedBeanDefinition)candidateComponent;
            AnnotationMetadata annotationMetadata = beanDefinition.getMetadata();
            // 如果标注了 @FeignClient 注解的 Class 不是接口类型，则触发断言
            Assert.isTrue(annotationMetadata.isInterface(), "@FeignClient can only be specified on an interface");
            // 获取 @FeignClient 注解的全部属性
            Map<String, Object> attributes = annotationMetadata.getAnnotationAttributes(FeignClient.class.getCanonicalName());
            // 从 @FeignClient 注解中获取要调用的服务名
            String name = this.getClientName(attributes);
            // 将要调用的服务名称 + @FeignClient 的配置属性，在 BeanDefinitionRegistry 中注册一下
            this.registerClientConfiguration(registry, name, attributes.get("configuration"));
            // 注册 FeignClient
            this.registerFeignClient(registry, annotationMetadata, attributes);
        }
    }
}
```

**方法逻辑解析：**

> 1.首先获取@EnableFeignClients注解的所有属性，主要为了拿到扫描包路径（basePackages）；
>
> 2.因为一般不会在@EnableFeignClients注解中配置clients属性，所以会进入到clients属性为空时的逻辑；
>
> 3.然后通过getScanner()方法获取扫描器：ClassPathScanningCandidateComponentProvider，并将上下文AnnotationConfigServletWebServerApplicationContext作为扫描器的ResourceLoader；
>
> 4.接着给扫描器ClassPathScanningCandidateComponentProvider添加一个注解过滤器（AnnotationTypeFilter），只过滤出包含@FeignClient注解的BeanDefinition；
>
> 5.再通过getBasePackages(metadata)方法获取@EnableFeingClients注解中的指定的包扫描路径 或 扫描类；如果没有获取到，则默认扫描启动类所在的包路径；
>
> 6.然后进入到核心逻辑：通过scanner.findCandidateComponents(basePackage)方法从包路径下扫描出所有标注了@FeignClient注解并符合条件装配的接口；
>
> 7.最后将FeignClientConfiguration 在BeanDefinitionRegistry中注册一下，再对FeignClient做真正的注册操作。

**1、获取包扫描路径：**
FeignClientsRegistrar#getBasePackages(metadata)方法负责获取包路径：

```java
protected Set<String> getBasePackages(AnnotationMetadata importingClassMetadata) {
    // 获取 @EnableFeignClients 注解的全部属性
    Map<String, Object> attributes = importingClassMetadata.getAnnotationAttributes(EnableFeignClients.class.getCanonicalName());
    Set<String> basePackages = new HashSet();
    String[] var4 = (String[])((String[])attributes.get("value"));
    int var5 = var4.length;

    int var6;
    String pkg;
    for(var6 = 0; var6 < var5; ++var6) {
        pkg = var4[var6];
        if (StringUtils.hasText(pkg)) {
            basePackages.add(pkg);
        }
    }

    // 指定包路径
    var4 = (String[])((String[])attributes.get("basePackages"));
    var5 = var4.length;

    for(var6 = 0; var6 < var5; ++var6) {
        pkg = var4[var6];
        if (StringUtils.hasText(pkg)) {
            basePackages.add(pkg);
        }
    }

    // 指定类名场景下，获取指定类所在的包
    Class[] var8 = (Class[])((Class[])attributes.get("basePackageClasses"));
    var5 = var8.length;

    for(var6 = 0; var6 < var5; ++var6) {
        Class<?> clazz = var8[var6];
        basePackages.add(ClassUtils.getPackageName(clazz));
    }

    if (basePackages.isEmpty()) {
        // 如果没有 @EnableFeignClient 注解没有指定扫描的包路径或类，则返回启动类所在的包
        basePackages.add(ClassUtils.getPackageName(importingClassMetadata.getClassName()));
    }

    return basePackages;
}
```

**方法执行逻辑解析：**

> 1.首先获取@EnableFeignClients注解中的全部属性；
>
> 2.如果指定了basePackages，则采用basePackages指定的目录作为包扫描路径；
>
> 3.如果指定了一些basePackageClasses，则采用basePackageClasses指定的类们所在的目录 作为包扫描路径；
>
> 4.如果既没有指定basePackages，也没有指定basePackageClasses，则采用启动类所在的目录作为包扫描路径。默认是这种情况。

**2、扫描所有的 FeignClient：**
ClassPathScanningCandidateComponentProvider#findCandidateComponents(String basePackage)方法负责扫描出指定目录下的所有标注了@FeignClient注解的Class类（包括interface、正常的Class）。

```java
public Set<BeanDefinition> findCandidateComponents(String basePackage) {
    return this.componentsIndex != null && this.indexSupportsIncludeFilters() ? this.addCandidateComponentsFromIndex(this.componentsIndex, basePackage) : this.scanCandidateComponents(basePackage);
}
```

```java
// basePackage：启动类所在的目录
private Set<BeanDefinition> scanCandidateComponents(String basePackage) {
    Set<BeanDefinition> candidates = new LinkedHashSet();

    try {
        String packageSearchPath = "classpath*:" + this.resolveBasePackage(basePackage) + '/' + this.resourcePattern;
        // 扫描出指定路径下的所有 Class 文件
        Resource[] resources = this.getResourcePatternResolver().getResources(packageSearchPath);
        boolean traceEnabled = this.logger.isTraceEnabled();
        boolean debugEnabled = this.logger.isDebugEnabled();
        Resource[] var7 = resources;
        int var8 = resources.length;

        // 遍历每个 Class 文件
        for(int var9 = 0; var9 < var8; ++var9) {
            Resource resource = var7[var9];
            if (traceEnabled) {
                this.logger.trace("Scanning " + resource);
            }

            if (resource.isReadable()) {
                try {
                    MetadataReader metadataReader = this.getMetadataReaderFactory().getMetadataReader(resource);
                    // 根据 Scanner 中的 @FeignClient 过滤器，过滤出所有被 @FeignClient 注解标注的 Class
                    if (this.isCandidateComponent(metadataReader)) {
                        ScannedGenericBeanDefinition sbd = new ScannedGenericBeanDefinition(metadataReader);
                        sbd.setSource(resource);
                        // 这里默认都返回 true，获取 Scanner 时重写了这个方法
                        if (this.isCandidateComponent((AnnotatedBeanDefinition)sbd)) {
                            if (debugEnabled) {
                                this.logger.debug("Identified candidate component class: " + resource);
                            }
                            // 最终标注了 @FeignClient 注解的 Class 都会放到这里，并返回
                            candidates.add(sbd);
                        } else if (debugEnabled) {
                            this.logger.debug("Ignored because not a concrete top-level class: " + resource);
                        }
                    } else if (traceEnabled) {
                        this.logger.trace("Ignored because not matching any filter: " + resource);
                    }
                } catch (Throwable var13) {
                    throw new BeanDefinitionStoreException("Failed to read candidate component class: " + resource, var13);
                }
            } else if (traceEnabled) {
                this.logger.trace("Ignored because not readable: " + resource);
            }
        }

        return candidates;
    } catch (IOException var14) {
        throw new BeanDefinitionStoreException("I/O failure during classpath scanning", var14);
    }
}
```

**方法逻辑解析：**

> 1.首先扫描出指定路径下的所有Class文件；
>
> 2.接着遍历每个Class文件，使用Scanner中的@FeignClient过滤器过滤出所有被@FeignClient注解标注的Class；
>
> 3.最后将过滤出的所有Class返回。

细看一下 `isCandidateComponent(MetadataReader metadataReader)` 方法：

```java
protected boolean isCandidateComponent(MetadataReader metadataReader) throws IOException {
    Iterator var2 = this.excludeFilters.iterator();

    TypeFilter tf;
    do {
        if (!var2.hasNext()) {
            // includeFilters 是在获取到 Scanner 之后添加的
            var2 = this.includeFilters.iterator();

            do {
                if (!var2.hasNext()) {
                    return false;
                }

                tf = (TypeFilter)var2.next();
            // 判断 Class 是否被 @FeignClient 注解标注
            } while(!tf.match(metadataReader, this.getMetadataReaderFactory()));
            //条件装配
            return this.isConditionMatch(metadataReader);
        }

        tf = (TypeFilter)var2.next();
    } while(!tf.match(metadataReader, this.getMetadataReaderFactory()));

    return false;
}
```

AbstractTypeHierarchyTraversingFilter#match(MetadataReader metadataReader, MetadataReaderFactory metadataReaderFactory)

````java
public boolean match(MetadataReader metadataReader, MetadataReaderFactory metadataReaderFactory) throws IOException {
  if (this.matchSelf(metadataReader)) {
      return true;
  }
  ...
}

AnnotationTypeFilter#matchSelf(MetadataReader metadataReader)

```java
protected boolean matchSelf(MetadataReader metadataReader) {
    AnnotationMetadata metadata = metadataReader.getAnnotationMetadata();
    return metadata.hasAnnotation(this.annotationType.getName()) || this.considerMetaAnnotations && metadata.hasMetaAnnotation(this.annotationType.getName());
}
````

**3、注册FeignClient：**
扫描到所有的FeignClient之后，需要将其注入到Spring中，`FeignClientsRegistrar#registerFeignClient()` 方法负责这个操作；

```java
private void registerFeignClient(BeanDefinitionRegistry registry, AnnotationMetadata annotationMetadata, Map<String, Object> attributes) {
    String className = annotationMetadata.getClassName();
    Class clazz = ClassUtils.resolveClassName(className, (ClassLoader)null);
    ConfigurableBeanFactory beanFactory = registry instanceof ConfigurableBeanFactory ? (ConfigurableBeanFactory)registry : null;
    String contextId = this.getContextId(beanFactory, attributes);
    String name = this.getName(attributes);
    FeignClientFactoryBean factoryBean = new FeignClientFactoryBean();
    factoryBean.setBeanFactory(beanFactory);
    factoryBean.setName(name);
    factoryBean.setContextId(contextId);
    factoryBean.setType(clazz);

    // 构建 FeignClient 对应的 BeanDefinition
    BeanDefinitionBuilder definition = BeanDefinitionBuilder.genericBeanDefinition(clazz, () -> {
        factoryBean.setUrl(this.getUrl(beanFactory, attributes));
        factoryBean.setPath(this.getPath(beanFactory, attributes));
        factoryBean.setDecode404(Boolean.parseBoolean(String.valueOf(attributes.get("decode404"))));
        Object fallback = attributes.get("fallback");
        if (fallback != null) {
            factoryBean.setFallback(fallback instanceof Class ? (Class)fallback : ClassUtils.resolveClassName(fallback.toString(), (ClassLoader)null));
        }

        Object fallbackFactory = attributes.get("fallbackFactory");
        if (fallbackFactory != null) {
            factoryBean.setFallbackFactory(fallbackFactory instanceof Class ? (Class)fallbackFactory : ClassUtils.resolveClassName(fallbackFactory.toString(), (ClassLoader)null));
        }

        return factoryBean.getObject();
    });
    definition.setAutowireMode(2);
    definition.setLazyInit(true);
    this.validate(attributes);
    AbstractBeanDefinition beanDefinition = definition.getBeanDefinition();
    beanDefinition.setAttribute("factoryBeanObjectType", className);
    beanDefinition.setAttribute("feignClientsRegistrarFactoryBean", factoryBean);
    boolean primary = (Boolean)attributes.get("primary");
    beanDefinition.setPrimary(primary);
    // 如果 FeignClient 配置了别名，则采用别名作为 beanName
    String[] qualifiers = this.getQualifiers(attributes);
    if (ObjectUtils.isEmpty(qualifiers)) {
        qualifiers = new String[]{contextId + "FeignClient"};
    }

    BeanDefinitionHolder holder = new BeanDefinitionHolder(beanDefinition, className, qualifiers);
    // 将 FeignClient 注册到 Spring 的临时容器
    BeanDefinitionReaderUtils.registerBeanDefinition(holder, registry);
}
```

注册FeignClient实际就是构建一个FeignClient对应的BeanDefinition，然后将FeignClient的一些属性配置设置为BeanDefinition的property，最后将BeanDefinition注册到Spring的临时容器。在处理FeignClient的属性配置时，如果@FeignClient中配置了qualifier，则使用qualifier作为beanName。

到这里已经完成了包的扫描、FeignClient的解析、FeignClient数据以BeanDefinition的形式存储到spring框架中的BeanDefinitionRegistry中。
