---
author: chou401
pubDatetime: 2024-02-22T15:00:03.000Z
modDatetime: 2024-05-16T14:00:40Z
title: Feign & openFeign
featured: false
draft: false
tags:
  - java
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

## openfeign 如何扫描所有 FeignClient（基于低版本 SpringCloud 2020.0.x版本之前）

基于的 SpringCloud 版本

```xml
 <properties>
    <spring-boot.version>2.3.7.RELEASE</spring-boot.version>
    <spring-cloud.version>Hoxton.SR9</spring-cloud.version>
    <spring-cloud-alibaba.version>2.2.6.RELEASE</spring-cloud-alibaba.version>
</properties>
```

我们知道 openfeign 有两个注解：@EnableFeignClients 和 @FeignClient，其中：

> @EnableFeignClients：用来开启 openfeign
>
> @FeignClient：标记要用 openfeign 来拦截的请求接口

为什么 Service-B 服务中定义了一个 ServiceAClient 接口（继承自 Service-A 的 api 接口），某 Controller 或 Service 中通过 @Autowired 注入一个 ServiceAClient 接口的实例，就可以通过 openfeign 做负载均衡去调用 Service-A服务？

### @FeignClient解析

#### @FeignClient注解解释

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

#### @FeignClient 注解作用

用 @FeignClient 注解标注一个接口后，OpenFeign 会对这个接口创建一个对应的动态代理 --> REST Client（发送 RESTful 请求的客户端），然后可以将这个 REST Client 注入其他的组件（比如 SerivceBController），如果弃用了 Ribbon，就会采用负载均衡的方式，来进行 http 请求的发送。

##### 使用 @RibbonClient 自定义负载均衡策略

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

### @EnableFeignClients 解析

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

#### FeignClientsRegistrar 类

![202402291451526](https://cdn.jsdelivr.net/gh/chou401/pic-md@main//img/202402291451526.png)

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

##### 注册默认配置

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

##### 注册所有的 FeignClient

registerFeignClients()方法负责注册所有的FeignClient

```java
public void registerFeignClients(AnnotationMetadata metadata, BeanDefinitionRegistry registry) {
    // 获取类扫描器
    ClassPathScanningCandidateComponentProvider scanner = this.getScanner();
    scanner.setResourceLoader(this.resourceLoader);
    // 获取 @EnableFeignClients 注解中的全部属性
    Map<String, Object> attrs = metadata.getAnnotationAttributes(EnableFeignClients.class.getName());
    // 给类扫描器添加 Filter，只扫描 @FeignClient 注解
    AnnotationTypeFilter annotationTypeFilter = new AnnotationTypeFilter(FeignClient.class);
    // 获取 @EnableFeignClients 注解中的 clients 属性值，默认为空
    Class<?>[] clients = attrs == null ? null : (Class[])((Class[])attrs.get("clients"));
    Object basePackages;
    if (clients != null && clients.length != 0) {
        final Set<String> clientClasses = new HashSet();
        basePackages = new HashSet();
        Class[] var9 = clients;
        int var10 = clients.length;

        for(int var11 = 0; var11 < var10; ++var11) {
            Class<?> clazz = var9[var11];
            ((Set)basePackages).add(ClassUtils.getPackageName(clazz));
            clientClasses.add(clazz.getCanonicalName());
        }

        AbstractClassTestingTypeFilter filter = new AbstractClassTestingTypeFilter() {
            protected boolean match(ClassMetadata metadata) {
                String cleaned = metadata.getClassName().replaceAll("\\$", ".");
                return clientClasses.contains(cleaned);
            }
        };
        scanner.addIncludeFilter(new AllTypeFilter(Arrays.asList(filter, annotationTypeFilter)));
    } else {
        scanner.addIncludeFilter(annotationTypeFilter);
        basePackages = this.getBasePackages(metadata);
    }

    Iterator var17 = ((Set)basePackages).iterator();

    while(var17.hasNext()) {
        String basePackage = (String)var17.next();
        // 遍历扫描到的所有包含 @FeignClient 注解的接口（BeanDefinition）
        Set<BeanDefinition> candidateComponents = scanner.findCandidateComponents(basePackage);
        Iterator var21 = candidateComponents.iterator();

        while(var21.hasNext()) {
            BeanDefinition candidateComponent = (BeanDefinition)var21.next();
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

##### 获取包扫描路径

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

##### 扫描所有的 FeignClient

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

##### 注册FeignClient

扫描到所有的FeignClient之后，需要将其注入到Spring中，`FeignClientsRegistrar#registerFeignClient()` 方法负责这个操作；

```java
private void registerFeignClient(BeanDefinitionRegistry registry, AnnotationMetadata annotationMetadata, Map<String, Object> attributes) {
    String className = annotationMetadata.getClassName();

    // 构建 FeignClient 对应的 BeanDefinition
    BeanDefinitionBuilder definition = BeanDefinitionBuilder.genericBeanDefinition(FeignClientFactoryBean.class);
    this.validate(attributes);
    definition.addPropertyValue("url", this.getUrl(attributes));
    definition.addPropertyValue("path", this.getPath(attributes));
    String name = this.getName(attributes);
    definition.addPropertyValue("name", name);
    String contextId = this.getContextId(attributes);
    definition.addPropertyValue("contextId", contextId);
    definition.addPropertyValue("type", className);
    definition.addPropertyValue("decode404", attributes.get("decode404"));
    definition.addPropertyValue("fallback", attributes.get("fallback"));
    definition.addPropertyValue("fallbackFactory", attributes.get("fallbackFactory"));
    definition.setAutowireMode(2);
    String alias = contextId + "FeignClient";
    AbstractBeanDefinition beanDefinition = definition.getBeanDefinition();
    beanDefinition.setAttribute("factoryBeanObjectType", className);
    boolean primary = (Boolean)attributes.get("primary");
    beanDefinition.setPrimary(primary);

    // 如果 FeignClient 配置了别名，则采用别名作为 beanName
    String qualifier = this.getQualifier(attributes);
    if (StringUtils.hasText(qualifier)) {
        alias = qualifier;
    }

    BeanDefinitionHolder holder = new BeanDefinitionHolder(beanDefinition, className, new String[]{alias});

    // 将 FeignClient 注册到 Spring 的临时容器
    BeanDefinitionReaderUtils.registerBeanDefinition(holder, registry);
}
```

注册FeignClient实际就是构建一个FeignClient对应的BeanDefinition，然后将FeignClient的一些属性配置设置为BeanDefinition的property，最后将BeanDefinition注册到Spring的临时容器。在处理FeignClient的属性配置时，如果@FeignClient中配置了qualifier，则使用qualifier作为beanName。

到这里已经完成了包的扫描、FeignClient的解析、FeignClient数据以BeanDefinition的形式存储到spring框架中的BeanDefinitionRegistry中。

### FeignClient 的动态代理类

在`AbstractApplicationContext#refresh()`方法中最后调用的`finishBeanFactoryInitialization(beanFactory)`方法中会将所有类全部注入到Spring容器中；在将ServiceBController注入到Spring容器过程中，会将其成员ServiceAClient也注入到Spring容器中，`AbstractAutowireCapableBeanFactory#populateBean()`方法会处理ServiceAClient，进而调用到`AutowiredAnnotationBeanPostProcessor#postProcessProperties()`方法对ServiceAClient做一个注入操作。

![202403011534065](https://cdn.jsdelivr.net/gh/chou401/pic-md@main//img/202403011534065.png)

![202403011541600](https://cdn.jsdelivr.net/gh/chou401/pic-md@main//img/202403011541600.png)

走到`AbstractBeanFactory#getBean(String)`方法获取ServiceBController依赖的成员类型ServiceAClient。

![202403011542177](https://cdn.jsdelivr.net/gh/chou401/pic-md@main//img/202403011542177.png)

由于我们在注册FeignClient到Spring容器时，构建的BeanDefinition的beanClas是FeignClientFactoryBean。

FeignClientFactoryBean是一个工厂，保存了@FeignClient注解的所有属性值，在Spring容器初始化的过程中，其会根据之前扫描出的FeignClient信息构建FeignClient的动态代理类。

![202403011547458](https://cdn.jsdelivr.net/gh/chou401/pic-md@main//img/202403011547458.png)

从debug的堆栈信息我们可以看到是FeignClientFactoryBean#getObject()方法负责获取/创建动态代理类。

#### FeignClientFactoryBean 创建动态代理类的入口

我们都知道要通过注册到 Spring 容器中的 FeignClient 的 BeanDefinition 的 beanClass 属性是 FeignClientFactoryBean，所以大概率和 FeignClientFactoryBean 是相关的，怎么找呐？连蒙带猜~

```java
protected Feign.Builder feign(FeignContext context) {
    FeignLoggerFactory loggerFactory = (FeignLoggerFactory)this.get(context, FeignLoggerFactory.class);
    Logger logger = loggerFactory.create(this.type);
    Feign.Builder builder = ((Feign.Builder)this.get(context, Feign.Builder.class)).logger(logger).encoder((Encoder)this.get(context, Encoder.class)).decoder((Decoder)this.get(context, Decoder.class)).contract((Contract)this.get(context, Contract.class));
    // 处理 Feign.Builder 的配置信息
    this.configureFeign(context, builder);
    return builder;
}
```

注意到 FeignClientFactoryBean 的 feign(FeignContext context) 方法，方法会构造一个 Feign.Builder，Builder，这不就是构造器模式嘛，基于 Feign.Builder 可以构造对应的 FeignClient。

再看哪里调用了 feign() 方法，找到 getTarget() 方法。

```java
<T> T getTarget() {
    FeignContext context = (FeignContext)this.applicationContext.getBean(FeignContext.class);
    Feign.Builder builder = this.feign(context);
    if (!StringUtils.hasText(this.url)) {
        if (!this.name.startsWith("http")) {
            this.url = "http://" + this.name;
        } else {
            this.url = this.name;
        }

        this.url = this.url + this.cleanPath();
        return this.loadBalance(builder, context, new Target.HardCodedTarget(this.type, this.name, this.url));
    } else {
        if (StringUtils.hasText(this.url) && !this.url.startsWith("http")) {
            this.url = "http://" + this.url;
        }

        String url = this.url + this.cleanPath();
        Client client = (Client)this.getOptional(context, Client.class);
        if (client != null) {
            if (client instanceof LoadBalancerFeignClient) {
                client = ((LoadBalancerFeignClient)client).getDelegate();
            }

            if (client instanceof FeignBlockingLoadBalancerClient) {
                client = ((FeignBlockingLoadBalancerClient)client).getDelegate();
            }

            builder.client(client);
        }

        Targeter targeter = (Targeter)this.get(context, Targeter.class);
        return targeter.target(this, builder, context, new Target.HardCodedTarget(this.type, this.name, url));
    }
}
```

对于有一定开发的经验而言，见到 Target 这一类东西，基本可以确定就是动态代理。

再往上追，看哪里调用了 getTarget() 方法？进入到 getObject() 方法。

```java
public Object getObject() throws Exception {
    return this.getTarget();
}
```

而getObject()方法是FactoryBean接口中定义的方法。

到这里可以确定 FeignClientFactoryBean#getObject() 方法，在 Spring 容器初始化时，会被作为入口来调用，进而创建一个 ServiceAClient 的动态代理，返回给 Spring 容器并注册到 Spring 容器里去。

#### Feign.Builder的构建过程

上面我们得出结论：FeignClient 是通过 Feign.Builder 来构建的，生成 FeignClient 动态代理的入口是 FeignClientFactoryBean#getObject()，这里我们看一下 Feign.Builder 是如何构建的？

##### FeignContext 上下文的获取

![202403011636380](https://cdn.jsdelivr.net/gh/chou401/pic-md@main//img/202403011636380.png)

调用FeignClientFactoryBean#getObject()创建/获取FeignClient动态代理类时，首先要通过

```java
FeignContext context = applicationContext.getBean(FeignContext.class);
```

获取 feign 的上下文 FeignClient。
这里的 applicationContext 是 AnnotationConfigServletWebApplicationContext。

> ribbon里有一个SpringClientFactory，就是对每个服务的调用，都会有一个独立的ILoadBalancer，IoadBalancer里面的IRule、IPing都是独立的组件，也就是说ribbon要调用的每个服务都对应一个独立的spring容器；从那个独立的spring容器中，可以取出某个服务关联的属于自己的LoadBalancer、IRule、IPing等。

FeignClient 也是类似的上下文：

> 我们如果要调用一个服务的话，ServiceA，那么那个服务（ServiceA）就会关联一个独立的spring容器；关联着自己独立的一些组件，比如说独立的Logger组件，独立的Decoder组件，独立的Encoder组件；FeignContext则代表了一个独立的容器工厂，里面记录了每个服务对应的容器AnnotationConfigApplicationContext。
>
> - 因此，可以对不同的@FeignClient自定义不同的Configuration。

**FeignContext在哪里注入到Spring容器的？**
FeignClient 位于 spring-cloud-openfeign-core 项目，我们在这个项目下结合 SpringBoot 自动装配的特性找 XxxAutoConfiguration 和 XxxConfiguration，最终找到 FeignAutoConfiguration。

![202403011646192](https://cdn.jsdelivr.net/gh/chou401/pic-md@main//img/202403011646192.png)

FeignAutoConfiguration中使用@Bean方法将FeignContext注入到Spring容器。

![202403011649023](https://cdn.jsdelivr.net/gh/chou401/pic-md@main//img/202403011649023.png)

FeignContext 继承自 NamedContextFactory，内部负责对每个服务都维护一个对应的spring容器（以map存储，一个服务对应一个spring容器），此处和 Ribbon 一样。

进入到 feign() 方法中，以获取 FeignLoggerFactory 为例：

![202403011654599](https://cdn.jsdelivr.net/gh/chou401/pic-md@main//img/202403011654599.png)

get(FeignContext context, Class type)方法要做的事情如下：

> - 根据服务名称（ServiceA）去FeignContext里面去获取对应的FeignLoggerFactory；
> - 其实就是根据ServiceA服务名称，先获取对应的spring容器，然后从那个spring容器中，获取自己独立的一个FeignLoggerFactory；

默认使用的 FeignLoggerFactory 是在 spring-cloud-openfeign-core 项目的 FeignClientsConfiguration 类中加载的 DefaultFeignLoggerFactory，而 DefaultFeignLoggerFactory 中默认创建的是Slf4jLogger。

![202403011704244](https://cdn.jsdelivr.net/gh/chou401/pic-md@main//img/202403011704244.png)

![202403011705898](https://cdn.jsdelivr.net/gh/chou401/pic-md@main//img/202403011705898.png)

##### 从 FeignClient 中获取 Feign.Builder

这里和上面获取 FeignLoggerFactory 一样，在 spring-cloud-openfeign-core 项目的 FeignClientsConfiguration 类中会找到两个 Feign.Builder（一个和 Hystrix 相关，另外一个 Retryer 相关的(请求超时、失败重试)）的注册逻辑：

![202403011729059](https://cdn.jsdelivr.net/gh/chou401/pic-md@main//img/202403011729059.png)

![202403011731270](https://cdn.jsdelivr.net/gh/chou401/pic-md@main//img/202403011731270.png)

由于默认 feign.hystrix.enabled 属性为 false，所以默认注入的 Feign.Builder 是 Feign.builder().retryer(retryer)。

##### 处理配置信息

回到 feign() 方法，其中调用的 `configureFeign(context, builder)` 方法负责处理 Feign 的相关配置（即：使用 application.yml 中配置的参数，来设置 Feign.Builder）。

![202403011745579](https://cdn.jsdelivr.net/gh/chou401/pic-md@main//img/202403011745579.png)

```java
protected void configureFeign(FeignContext context, Feign.Builder builder) {
    FeignClientProperties properties = (FeignClientProperties)this.applicationContext.getBean(FeignClientProperties.class);
    FeignClientConfigurer feignClientConfigurer = (FeignClientConfigurer)this.getOptional(context, FeignClientConfigurer.class);
    this.setInheritParentContext(feignClientConfigurer.inheritParentConfiguration());
    if (properties != null && this.inheritParentContext) {
        if (properties.isDefaultToProperties()) {
            this.configureUsingConfiguration(context, builder);
            // 读取 application.yml 文件中针对所有服务 default 的配置
            this.configureUsingProperties((FeignClientProperties.FeignClientConfiguration)properties.getConfig().get(properties.getDefaultConfig()), builder);
            // 读取 application.yml 文件中针对当前服务的配置
            this.configureUsingProperties((FeignClientProperties.FeignClientConfiguration)properties.getConfig().get(this.contextId), builder);
        } else {
            this.configureUsingProperties((FeignClientProperties.FeignClientConfiguration)properties.getConfig().get(properties.getDefaultConfig()), builder);
            this.configureUsingProperties((FeignClientProperties.FeignClientConfiguration)properties.getConfig().get(this.contextId), builder);
            this.configureUsingConfiguration(context, builder);
        }
    } else {
        this.configureUsingConfiguration(context, builder);
    }
}
```

**逻辑解析：**

> 1. FeignClientProperties是针对FeignClient的配置；
> 2. 先读取application.yml中的feign.client打头的一些参数，包括了connectionTimeout、readTimeout之类的参数；如果application.yml中没有配置feign.client相关参数，则使用默认配置（Retryer retryer、ErrorDecoder、Request.Options等）；
> 3. 然后读取application.yml中针对当前要调用服务的配置。
>
> 所以如果在 application.yml 文件中同时配置了针对全部服务和单个服务的配置，则针对单个服务的配置优先级更高，因为在代码解析中它是放在后面解析的，会覆盖前面解析的内容。

##### 使用 Feign.Builder 构建出一个 FeignClient

![202403041111641](https://cdn.jsdelivr.net/gh/chou401/pic-md@main//img/202403041111641.png)

如果在 @FeignClient 上，没有配置 url 属性，也就是没有指定服务的 url 地址，那么 Feign 就会自动跟 Ribbon 关联起来，采用 Ribbon 来进行负载均衡，直接拿出 @FeignClient 中配置的 name() 为 Ribbon 准备对应的 url 地址：`http://ServiceA`。

此外如果在 @FeignClient 注解中配置了 `path 属性`，就表示要访问的是这个 ServiceA 服务的莫一类接口，比如：@FeignClient(value="ServiceA", path="/user")，在拼接请求 URL 地址的时候，就会拼接成：`http://ServiceA/user`。

`FeignClientFactoryBean#loadBalance()` 方法是一个基于 Ribbon 进行负载均衡的 FeignClient 动态代理生成方法：

> 入参：
>
> 1. Feign.Builder builder --> FeignClient构造器
> 2. FeignContext context --> Feign上下文
> 3. HardCodedTarget<T> target，target是一个HardCodedTarget，硬编码的Target，里面包含了接口类型（com.zhss.service.ServiceAClient）、服务名称（ServiceA）、url地址（<http://ServiceA>）

```java
protected <T> T loadBalance(Feign.Builder builder, FeignContext context, Target.HardCodedTarget<T> target) {
    Client client = (Client)this.getOptional(context, Client.class);
    if (client != null) {
        builder.client(client);
        Targeter targeter = (Targeter)this.get(context, Targeter.class);
        return targeter.target(this, builder, context, target);
    } else {
        throw new IllegalStateException("No Feign Client for loadBalancing defined. Did you forget to include spring-cloud-starter-netflix-ribbon?");
    }
}
```

`loadBalance()` 方法中首先会获取 Client 和 Targeter：

- 通过 `Client client = getOptional(context, Client.class)` 方法获取 Client，返回的是 `LoadBalancerFeignClient`，（高版本是 FeignBlockingLoadBalancerClient）
- 通过 `Targeter targeter = get(context, Targeter.class)` 方法获取 Targeter：，返回的是 `HystrixTargeter`

###### LoadBalancerFeignClient 在哪里注入到 Spring 容器

进入到 LoadBalancerFeignClient 类中看哪里调用了它唯一一个构造函数

找到 LoadBalancerFeignClient 有三个地方调用了它的构造函数，new 了一个实例：

- DefaultFeignLoadBalancedConfiguration
- HttpClientFeignLoadBalancedConfiguration
- OkHttpFeignLoadBalancedConfiguration

再结合默认的配置，只有 DefaultFeignLoadBalancedConfiguration 中的 Client 符合条件装配

```java
@Configuration(
    proxyBeanMethods = false
)
class DefaultFeignLoadBalancedConfiguration {
    DefaultFeignLoadBalancedConfiguration() {
    }

    @Bean
    @ConditionalOnMissingBean
    public Client feignClient(CachingSpringLoadBalancerFactory cachingFactory, SpringClientFactory clientFactory) {
        return new LoadBalancerFeignClient(new Client.Default((SSLSocketFactory)null, (HostnameVerifier)null), cachingFactory, clientFactory);
    }
}
```

可以通过引入 Apache HttpClient 的 Maven 依赖使用 HttpClientFeignLoadBalancedConfiguration，或引入 OkHttpClient 的 Maven 依赖并在 application.yml 文件中指定 feign.okhttp.enabled 属性为 true 使用 OkHttpFeignLoadBalancedConfiguration。

###### HystrixTargeter 在哪里注入到 Spring 容器

在 `FeignAutoConfiguration` 类中可以找到 Targeter 注入到 Spring 容器的逻辑

```java
@Configuration(
    proxyBeanMethods = false
)
@ConditionalOnMissingClass({"feign.hystrix.HystrixFeign"})
protected static class DefaultFeignTargeterConfiguration {
    protected DefaultFeignTargeterConfiguration() {
    }

    @Bean
    @ConditionalOnMissingBean
    public Targeter feignTargeter() {
        return new DefaultTargeter();
    }
}

@Configuration(
    proxyBeanMethods = false
)
@ConditionalOnClass(
    name = {"feign.hystrix.HystrixFeign"}
)
protected static class HystrixFeignTargeterConfiguration {
    protected HystrixFeignTargeterConfiguration() {
    }

    @Bean
    @ConditionalOnMissingBean
    public Targeter feignTargeter() {
        return new HystrixTargeter();
    }
}
```

> 默认是创建 HystrixTargeter：
>
> 1. 如果有 feign.hystrix.HystrixFeign 这个类的话，那么就会构造一个 HystrixTargeter 出来
> 2. 如果没有 feign.hystrix.HystrixFeign 这个类的话，那么就会构造一个 DefaultTargeter 出来

HystrixTargeter 是用来让 Feign 和 Hystrix 整合使用的，在发送请求的时候可以基于 Hystrix 实现熔断、限流、降级。

- 生产环境如果启用 `feign.hystrix.HystrixFeign`，则 Feign.Builder 也会变成 HystrixFeign.Builder，默认还是 Feign 自己的 Feign.Builder。

###### HystrixTargeter#target()方法

继续往下走，进入到 `HystrixTargeter#target()` 方法，具体代码执行流程如下：

![202403041658903](https://cdn.jsdelivr.net/gh/chou401/pic-md@main//img/202403041658903.png)

![202403041659749](https://cdn.jsdelivr.net/gh/chou401/pic-md@main//img/202403041659749.png)

```java
public Feign build() {
    Client client = (Client)Capability.enrich(this.client, this.capabilities);
    Retryer retryer = (Retryer)Capability.enrich(this.retryer, this.capabilities);
    // 获取所有的 RequestInterceptor
    List<RequestInterceptor> requestInterceptors = (List)this.requestInterceptors.stream().map((ri) -> {
        return (RequestInterceptor)Capability.enrich(ri, this.capabilities);
    }).collect(Collectors.toList());
    Logger logger = (Logger)Capability.enrich(this.logger, this.capabilities);
    Contract contract = (Contract)Capability.enrich(this.contract, this.capabilities);
    Request.Options options = (Request.Options)Capability.enrich(this.options, this.capabilities);
    Encoder encoder = (Encoder)Capability.enrich(this.encoder, this.capabilities);
    Decoder decoder = (Decoder)Capability.enrich(this.decoder, this.capabilities);
    InvocationHandlerFactory invocationHandlerFactory = (InvocationHandlerFactory)Capability.enrich(this.invocationHandlerFactory, this.capabilities);
    QueryMapEncoder queryMapEncoder = (QueryMapEncoder)Capability.enrich(this.queryMapEncoder, this.capabilities);

    // 将 FeignClient 的一些信息放到 Handler 中
    SynchronousMethodHandler.Factory synchronousMethodHandlerFactory = new SynchronousMethodHandler.Factory(client, retryer, requestInterceptors, logger, this.logLevel, this.decode404, this.closeAfterDecode, this.propagationPolicy, this.forceDecoding);
    ReflectiveFeign.ParseHandlersByName handlersByName = new ReflectiveFeign.ParseHandlersByName(contract, options, encoder, decoder, queryMapEncoder, this.errorDecoder, synchronousMethodHandlerFactory);

    // ReflectiveFeign 负责生成动态代理类
    return new ReflectiveFeign(handlersByName, invocationHandlerFactory, queryMapEncoder);
}
```

`Feign#target()` 方法中主要做两件事：

1. build() 方法将Feign.Builder 中所有东西集成在一起，构建成一个 ReflectiveFeign
2. ReflectiveFeign#newInstance() 方法负责生成动态代理

###### ReflectiveFeign#newInstance()生成动态代理类

ReflectiveFeign#newInstance() 源码如下

```java
public <T> T newInstance(Target<T> target) {
    // 基于我们配置的Contract、Encoder等一堆组件，加上Target对象（知道是ServiceAClient接口），去进行接口的所有spring mvc注解的解析，以及接口中各个方法的一些解析，获取了这个接口中有哪些方法
    Map<String, MethodHandler> nameToHandler = targetToHandlersByName.apply(target);
    Map<Method, MethodHandler> methodToHandler = new LinkedHashMap<Method, MethodHandler>();
    List<DefaultMethodHandler> defaultMethodHandlers = new LinkedList<DefaultMethodHandler>();

    // 遍历ServiceAClient接口中的每个方法
    for (Method method : target.type().getMethods()) {
        if (method.getDeclaringClass() == Object.class) {
            continue;
        } else if (Util.isDefault(method)) {
            DefaultMethodHandler handler = new DefaultMethodHandler(method);
            defaultMethodHandlers.add(handler);
            methodToHandler.put(method, handler);
        } else {
            // 将ServiceAClient接口中的每个方法，加上对应的nameToHandler中存放的对应的SynchronousMethodHandler（异步化的方法代理处理组件），放到一个map中去
            methodToHandler.put(method, nameToHandler.get(Feign.configKey(target.type(), method)));
        }
    }

    // JDK动态代理）基于一个factory工厂，创建了一个InvocationHandler
    InvocationHandler handler = factory.create(target, methodToHandler);

    // 基于JDK的动态代理，创建出来了一个动态代理类：Proxy，其实现ServiceAClient接口
    // new Class<?>[]{target.type()}，这个就是ServiceAClient接口
    // InvocationHandler：对上面proxy动态代理类所有方法的调用，都会走这个InvocationHandler的拦截方法，由这个InvocationHandler中的一个方法来提供所有方法的一个实现的逻辑
    T proxy = (T) Proxy.newProxyInstance(target.type().getClassLoader(),
        new Class<?>[] {target.type()}, handler);

    // 上述代码段中，就是 JDK 动态代理的体现，动态生成一个没有名字的匿名类，这个类实现了 ServiceAClient（FeignClient）接口，基于这个匿名类创建一个对象（T proxy），这就是所谓的动态代理，后续所有对这个 T proxy 对象所有接口方法的调用，都会交给 InvocationHandler 处理，此处的 InvocationHandler 是 ReflectiveFeign 的内部类 FeignInvocationHandler


    for (DefaultMethodHandler defaultMethodHandler : defaultMethodHandlers) {
        defaultMethodHandler.bindTo(proxy);
    }
    return proxy;
}
```

方法中有两个Map类型的局部变量：nameToHandler、methodToHandler：

> 1. nameToHandler 释义：接口中的每个方法的名称，对应一个处理这个方法的SynchronousMethodHandler；由ReflectiveFeign的内部类ParseHandlersByName的apply(target)方法获取。
> 2. methodToHandler 释义：接口中的每个方法（Method对象），对应一个处理这个方法的SynchronousMethodHandler；

###### ParseHandlersByName#apply()解析FeignClient中的方法

`ParseHandlersByName#apply()` 方法会对我们定义的 ServiceAClient 接口进行解析，解析里面有哪些方法，然后为每个方法创建一个 SynchronousMethodHandler 出来，也就是说某个 SynchronousMethodHandler 专门用来处理那个方法的请求调用。

```java
public Map<String, MethodHandler> apply(Target target) {
    List<MethodMetadata> metadata = contract.parseAndValidateMetadata(target.type());
    Map<String, MethodHandler> result = new LinkedHashMap<String, MethodHandler>();
    for (MethodMetadata md : metadata) {
    BuildTemplateByResolvingArgs buildTemplate;
    if (!md.formParams().isEmpty() && md.template().bodyTemplate() == null) {
        buildTemplate =
            new BuildFormEncodedTemplateFromArgs(md, encoder, queryMapEncoder, target);
    } else if (md.bodyIndex() != null) {
        buildTemplate = new BuildEncodedTemplateFromArgs(md, encoder, queryMapEncoder, target);
    } else {
        buildTemplate = new BuildTemplateByResolvingArgs(md, queryMapEncoder, target);
    }
    if (md.isIgnored()) {
        result.put(md.configKey(), args -> {
        throw new IllegalStateException(md.configKey() + " is not a method handled by feign");
        });
    } else {
        result.put(md.configKey(),
            // 为每个方法创建对应的 MethodHandler
            factory.create(target, md, buildTemplate, options, decoder, errorDecoder));
    }
    }
    return result;
}
```

其中 `factory.create` 会为所有标注了 SpringMvc 注解的方法都生成一个对应的 SynchronousMethodHandler。

```java
public MethodHandler create(Target<?> target,
                            // 解析这个方法，针对这个方法生成一个 SynchronousMethodHandler
                            MethodMetadata md,
                            RequestTemplate.Factory buildTemplateFromArgs,
                            Options options,
                            Decoder decoder,
                            ErrorDecoder errorDecoder) {
    return new SynchronousMethodHandler(target, client, retryer, requestInterceptors, logger,
        logLevel, md, buildTemplateFromArgs, options, decoder,
        errorDecoder, decode404, closeAfterDecode, propagationPolicy, forceDecoding);
}
```

`SpringMvcContract.parseAndValidateMetadata()` 方法负责解析 FeignClient 接口中每个标注了 SpringMvc 注解的方法，即：Feign 依靠 Contract 组件（SpringMvcContract）来解析接口上的 SpringMvc 注解。

> 针对 FeignClient 接口中的每个标注了 springMVC 注解的方法都会被 springMvcContract 组件解析，针对每个方法最后都生成一个 MethodMetadata，代表方法的一些元数据，包括：
>
> 1. 方法的定义：比如：ServiceAClient#deleteUser(Long)
> 2. 方法的返回类型：比如：class java.lang.String
> 3. 发送 HTTP 请求的模版：比如：DELETE /user/{id} HTTP/1.1

###### SpringMvcContract组件的工作原理

看一下 `SpringMvcContract.parseAndValidateMetadata()` 如何解析 FeignClient 中的每个方法

以如下方法为例：

![202403041746106](https://cdn.jsdelivr.net/gh/chou401/pic-md@main//img/202403041746106.png)

解析逻辑如下：

> 1. 解析@RequestMapping注解，看看里面的method属性是什么？是GET/UPDATE/DELETE，然后在HTTP template里就加上GET/UPDATE/DELETE；（示例为DELETE）
> 2. 找到接口上定义的@RequestMapping注解，解析里面的value值，拿到请求路径（/user），此时HTTP template变成：DELETE /user
> 3. 再次解析deleteUser()方法上的@RequestMapping注解，找到里面的value，获取到/{id}，拼接到HTTP template里去：DELETE /user/{id}
> 4. 接着硬编码拼死一个HTTP协议，http 1.1，HTTP template：DELETE /user/{id} HTTP/1.1
> 5. indexToName：解析@PathVariable注解，第一个占位符（index是0）要替换成方法入参里的id这个参数的值
> 6. 假如后面来调用这个deleteUser()方法，传递进来的id = 1.那么此时就会拿出之前解析好的HTTP template：DELETE /user/{id} HTTP/1.1。然后用传递进来的id = 1替换掉第一个占位符的值，DELETE /user/1 HTTP/1.1

### OpenFeign处理HTTP请求

#### 动态代理处理请求的入口

我们知道所有对动态代理对象（T Proxy）的所有接口方法的调用，都会交给 `InvocationHandler` 来处理，此处的 `InvocationHandler` 是 `ReflectiveFeign` 的内部类 `FeignInvocationHandler`。针对 FeignClient 的每个方法都会对应一个 `SynchronousMethodHandler`。

以 `http://localhost:9090/ServiceB/user/sayHello/1?name=zhangsan&age=18` 请求调用为例：

![202403051440325](https://cdn.jsdelivr.net/gh/chou401/pic-md@main//img/202403051440325.png)

请求调用 ServiceBController 的 greeting() 方法后，要调用 ServiceAClient#sayHello() 方法时，请求会进到 ServiceAClient 的动态代理类，进而请求交给 ReflectiveFeign 的内部类 FeignInvocationHandler 来处理，在结合 JDK 动态代理的特性，方法会交给 invoke() 方法执行，所以动态代理处理请求的入口为：`ReflectiveFeign` 的内部类 `FeignInvocationHandler` 的 invoke() 方法：

![202403051446826](https://cdn.jsdelivr.net/gh/chou401/pic-md@main//img/202403051446826.png)

方法逻辑：

> 1. 针对父类 Object 的 equals、hashCode、toString 方法直接处理
> 2. 其他方法则从 dispatch 中获取 Method 对应的 MethodHandler，然后将方法的执行交给 MethodHandler 来处理
> 3. dispatch 是一个以 Method 为 key，MethodHandler 为 value 的 Map 类型（Map<Method， MethodHandler>），其是在构建 FeignInvocationHandler 时，记录了每个 FeignClient 对应的所有方法 MethodHandler 的映射

invoke() 方法中通过方法名找到 Method 对应的 MethodHandler，这里的 MethodHandler 为 SynchronousMethodHandler，然后将 args 参数交给它来处理请求

#### SynchronousMethodHandler 处理请求机制

```java
@Override
  public Object invoke(Object[] argv) throws Throwable {
    // 创建一个请求模版
    RequestTemplate template = buildTemplateFromArgs.create(argv);
    Options options = findOptions(argv);
    Retryer retryer = this.retryer.clone();
    while (true) {
      try {
        // 执行请求并返回 decode 后的结果
        return executeAndDecode(template, options);
      } catch (RetryableException e) {
        try {
          retryer.continueOrPropagate(e);
        } catch (RetryableException th) {
          Throwable cause = th.getCause();
          if (propagationPolicy == UNWRAP && cause != null) {
            throw cause;
          } else {
            throw th;
          }
        }
        if (logLevel != Logger.Level.NONE) {
          logger.logRetry(metadata.configKey(), logLevel);
        }
        continue;
      }
    }
  }
```

`SynchronousMethodHandler#invoke()` 方法中主要包括两大块：创建请求模版、执行请求并返回 decode 后的结果。

这里的重试机制，其实就是依靠 Retryer#continueOrPropagate() 方法中对重试次数的判断，超过最大重试次数抛异常结束流程。

![202403051634061](https://cdn.jsdelivr.net/gh/chou401/pic-md@main//img/202403051634061.png)

##### 创建请求模版（SpringMvcContract 解析方法参数）

在上文中我们聊到会用 SpringMvcContract 解析Spring mvc 的注解，最终拿到方法的对应的请求（RequestTemplate）是 `GET /user/sayHello/{id} HTTP/1.1`，但是要生成一个可以访问的请求地址，需要再基于 SpringMvcContract 去解析 @RequestParam 注解，将方法的入参，绑定到 HTTP 请求参数里去，最终将请求处理为 `GET /user/sayHello/1?name=zhangsan&age=18 HTTP/1.1`

而 `RequestTemplate template = buildTemplateFromArgs.create(argv)` 负责做这个操作，ReflectiveFeign#create(Object[] argv)：

```java
@Override
public RequestTemplate create(Object[] argv) {
  // 获取 REST 请求模版
  RequestTemplate mutable = RequestTemplate.from(metadata.template());
  mutable.feignTarget(target);
  if (metadata.urlIndex() != null) {
    int urlIndex = metadata.urlIndex();
    checkArgument(argv[urlIndex] != null, "URI parameter %s was null", urlIndex);
    mutable.target(String.valueOf(argv[urlIndex]));
  }
  Map<String, Object> varBuilder = new LinkedHashMap<String, Object>();
  // 遍历 REST 请求要调用方法标记了 springmvc 注解的参数
  for (Entry<Integer, Collection<String>> entry : metadata.indexToName().entrySet()) {
    int i = entry.getKey();
    Object value = argv[entry.getKey()];
    if (value != null) { // Null values are skipped.
      // 使用 SpringMvcContract 解析出方法参数对应的 value 值
      if (indexToExpander.containsKey(i)) {
        value = expandElements(indexToExpander.get(i), value);
      }
      for (String name : entry.getValue()) {
        varBuilder.put(name, value);
      }
    }
  }

  // 构建出完整的 REST 请求
  RequestTemplate template = resolve(argv, mutable, varBuilder);
  // 处理表单内容
  if (metadata.queryMapIndex() != null) {
    // add query map parameters after initial resolve so that they take
    // precedence over any predefined values
    Object value = argv[metadata.queryMapIndex()];
    Map<String, Object> queryMap = toQueryMap(value);
    template = addQueryMapQueryParameters(queryMap, template);
  }

  // 处理请求头内容
  if (metadata.headerMapIndex() != null) {
    template =
        addHeaderMapHeaders((Map<String, Object>) argv[metadata.headerMapIndex()], template);
  }

  return template;
}
```

以解析 `@PathVariable("id") Long id` 为例，SpringMvcContract 解析逻辑如下：

![202403051717607](https://cdn.jsdelivr.net/gh/chou401/pic-md@main//img/202403051717607.png)

```java
private Object expandElements(Expander expander, Object value) {
  if (value instanceof Iterable) {
    return expandIterable(expander, (Iterable) value);
  }
  return expander.expand(value);
}
```

![202403051723717](https://cdn.jsdelivr.net/gh/chou401/pic-md@main//img/202403051723717.png)

最后解析出 `@PathVariable("id") Long id` 对应的值为 1，然后将所有的标注了 SpringMVC 注解的参数都解析完之后，将参数名和对应的 value 值放到一个命名为 `varBuilder` 的 Map 中：

![202403051728793](https://cdn.jsdelivr.net/gh/chou401/pic-md@main//img/202403051728793.png)

接着需要根据 varBuilder 的内容构建出一个完整的 REST 请求（即：将 SpringMVC 注解标注的参数全部用 value 值替换、添加到请求中）

![202403051736823](https://cdn.jsdelivr.net/gh/chou401/pic-md@main//img/202403051736823.png)

![202403051744919](https://cdn.jsdelivr.net/gh/chou401/pic-md@main//img/202403051744919.png)

`RequestTemplate resolve(Map<String, ?> variables)` 中负责解析并构建完整的 RequestTemplate，进到方法中的 urlTemplate 为 `/user/sayHello/{id}`，variables 为上面的 varBuilder：`{"id":1,"name":"zhangsan","age":18}`。

方法中首先将 `"id":1` 替换 `urlTemplate（/user/sayHello/{id}）` 中的 {id}，得出 expanded 为 `/user/sayHello/1`，然后再将查询参数 `"name":"zhangsan","age":18` 拼接到请求中，得到最终的 URL 为：`/user/sayHello/1?name=zhangsan&age=18`，返回的 RequestTemplate 内容为：

`buildTemplateFromArgs.create(argv)` 方法执行完成之后，得到一个完整的 RequestTemplate，下面需要基于这个 RequestTemplate 来执行请求。

![202403051758648](https://cdn.jsdelivr.net/gh/chou401/pic-md@main//img/202403051758648.png)

##### 执行请求并解码返回值

`SynchronousMethodHandler#executeAndDecode(RequestTemplate, Options)` 方法负责执行请求并解码返回值，具体执行逻辑如下：

![202403051804120](https://cdn.jsdelivr.net/gh/chou401/pic-md@main//img/202403051804120.png)

方法中主要做三件事：应用所有的 RequestInterceptor（即执行 RequestInterceptor#apply()方法）、通过 LoadBalancerFeignClient 做负载均衡执行请求，使用 Decoder 对请求返回结果解码或处理返回结果。

下面分开来看

###### 应用所有的 RequestInterceptor

![202403051813337](https://cdn.jsdelivr.net/gh/chou401/pic-md@main//img/202403051813337.png)

遍历所有的请求拦截器 `RequestInterceptor`，将每个请求拦截器都应用到 RequestTemplate 请求模版上面去，也就是让每个请求拦截器都对请求进行处理（调用拦截器的 apply（RequestTemplate）方法）。

> - 其实这里本质上就是基于 RequestTemplate，创建一个Request
> - Request 是基于之前的 HardCodedTarget（包含了目标请求服务信息的一个 Target，服务名也在其中），处理 RequestTemplate，生成一个 Request

应用完所有的 RequestInterceptor 之后，如果 Feign 日志的隔离级别不等于 `Logger.Level.NONE`，则打印即将要发送的 Request 请求日志；
打印完请求日志之后，会通过 `SynchronousMethodHandler` 中的成员 Client 来执行请求，对于 OpenFeign 旧版而言，Client 是 `LoadBalancerFeignClient`。

###### LoadBalancerFeignClient 负载均衡执行请求详述

基于 LoadBalancerFeignClient 完成了请求的处理和发送，这里肯定是将 HTTP 请求发送到对应 server 的某个实例上去，同时获取到 Response 响应。

`LoadBalancerFeignClient#execute()` 方法处理逻辑：

```java
public Response execute(Request request, Request.Options options) throws IOException {
  try {
    // 将请求的 url 封装成 URI
    URI asUri = URI.create(request.url());
    // 获取要请求的服务名
    String clientName = asUri.getHost();
    // 从 URI 中剔除服务名
    URI uriWithoutHost = cleanUrl(request.url(), clientName);
    // 将请求封装为 RibbonRequest
    FeignLoadBalancer.RibbonRequest ribbonRequest = new FeignLoadBalancer.RibbonRequest(this.delegate, request, uriWithoutHost);
    // 将 options 封装为请求配置传给 Ribbon
    IClientConfig requestConfig = this.getClientConfig(options, clientName);
    // 通过集成的 Ribbon 执行请求
    return ((FeignLoadBalancer.RibbonResponse)this.lbClient(clientName).executeWithLoadBalancer(ribbonRequest, requestConfig)).toResponse();
  } catch (ClientException var8) {
    IOException io = this.findIOException(var8);
    if (io != null) {
      throw io;
    } else {
      throw new RuntimeException(var8);
    }
  }
}
```

方法逻辑解析：

> 1. 首先将请求的url封装成一个URI，然后从请求URL地址中，获取到要访问的服务名称clientName（示例为ServiceA）
> 2. 然后将请求URI中的服务名称剔除，比如这里的 <http://Service-A/user/sayHello/> 变为 http:///user/sayHello/
> 3. 接着基于去除了服务名称的uri地址，创建了一个适用于Ribbon的请求（FeignLoadBalancer.RibbonRequest）
> 4. 根据服务名从SpringClientFactory（Feign上下文）中获取Ribbon相关的配置IClientConfig，比如（连接超时时间、读取数据超时时间），如果获取不到，则创建一个FeignOptionsClientConfig
> 5. 最后根据服务名从CachingSpringLoadBalancerFactory获取对应的FeignLoadBalancer；在FeignLoadBalancer里封装了ribbon的ILoadBalancer

既然Feign中集成了Ribbon，那它们是怎么整合到一起的？FeignLoadBalancer中用了Ribbon的那个ILoadBalancer？Feign如何使用Ribbon进行负载均衡？最终发送出去的请求URI是什么样的？

**1> Feign 是如何和 Ribbon、eureka 整合在一起的？FeignLoadBalancer 中用了 Ribbon 的那个 ILoadBalancer？**

1. FeignLoadBalancer中用了Ribbon的那个ILoadBalancer?

   FeignLoadBalancer的类继承结构如下：

   ![202403061818220](https://cdn.jsdelivr.net/gh/chou401/pic-md@main//img/202403061818220.png)

   ![202403061819814](https://cdn.jsdelivr.net/gh/chou401/pic-md@main//img/202403061819814.png)

   FeignLoadBalancer间接继承自LoadBalancerContext，LoadBalancerContext中有一个ILoadBalancer类型的成员，其就是FeignLoadBalancer中集成的Ribbon的ILoadBalancer。从代码执行流程来看，集成的ILoadBalancer为Ribbon默认的ZoneAwareLoadBalancer：

   ![202403061830279](https://cdn.jsdelivr.net/gh/chou401/pic-md@main//img/202403061830279.png)

   到这里，可以看到根据服务名获取到的FeignLoadBalancer中组合了Ribbon的ZoneAwareLoadBalancer负载均衡器。

2. Ribbon和Eureka的集成?
   RibbonClientConfiguration#ribbonLoadBalancer

   ```java
   @Bean
   @ConditionalOnMissingBean
   // serverList: 服务实例列表信息
   public ILoadBalancer ribbonLoadBalancer(IClientConfig config, ServerList<Server> serverList, ServerListFilter<Server> serverListFilter, IRule rule, IPing ping, ServerListUpdater serverListUpdater) {
       return (ILoadBalancer)(this.propertiesFactory.isSet(ILoadBalancer.class, this.name)
       ? (ILoadBalancer)this.propertiesFactory.get(ILoadBalancer.class, config, this.name)
       : new ZoneAwareLoadBalancer(config, rule, ping, serverList, serverListFilter, serverListUpdater));
   }
   ```

   Ribbon自己和Eureka集成的流程：Ribbon的配置类RibbonClientConfiguration，会初始化ZoneAwareLoadBalancer并将其注入到Spring容器；ZoneAwareLoadBalancer内部持有跟eureka进行整合的DomainExtractingServerList（Eureka和Ribbon集成的配置类EurekaRibbonClientConfiguration（spring-cloud-netflix-eureka-client项目下）中负责将其注入到Spring容器）,nacos 和 ribbon 集成的配置类 NacosRibbonClientConfiguration。

   小结：
   在spring boot启动，要去获取一个ribbon的ILoadBalancer的时候，会去从那个服务对应的一个独立的spring容器（Ribbon子上下文）中获取；获取到一个服务对应的ZoneAwareLoadBalancer，其中组合了DomainExtractingServerList，DomainExtractingServerList自己会去eureka的注册表里去拉取服务对应的注册表（即：服务的实例列表）。

**2> Feign如何使用Ribbon进行负载均衡？**
feign是基于ribbon的ZoneAwareLoadBalancer来进行负载均衡的，从一个server list中选择出来一个server。

接着上面的内容，进入到FeignLoadBalancer的executeWithLoadBalancer()方法；

由于AbstractLoadBalancerAwareClient是FeignLoadBalancer的父类，FeignLoadBalancer类中没有重写executeWithLoadBalancer()方法，进入到AbstractLoadBalancerAwareClient#executeWithLoadBalancer()方法：

![202403071635683](https://cdn.jsdelivr.net/gh/chou401/pic-md@main//img/202403071635683.png)

方法逻辑解析：

> 1. 首先构建一个LoadBalancerCommand，LoadBalancerCommand刚创建的时候里面的server是null，也就是还没确定要对哪个server发起请求；
> 2. command.submit()方法的代码块，本质上是重写了LoadBalancerCommand#submit(ServerOperation<T>)方法入参ServerOperation的call()方法。
>
>    - call()方法内部根据选择出的Server构造出具体的http请求地址，然后基于底层的http通信组件，发送出去这个请求。
>    - call()方法是被内嵌到LoadBalancerCommand#submit()方法中的，也就是在执行LoadBalancerCommand的时候会调用call()方法；
>
> 3. 最后通过command.toBlocking().single()方法，进行阻塞式的同步执行，获取到响应结果。

从整体来看，ServerOperation中封装了负载均衡选择出来的server，然后直接基于这个server替换掉请求URL中的服务名，拼接出最终的请求URL地址，然后基于底层的http组件发送请求。

LoadBalancerCommand肯定是在某个地方使用Ribbon的ZoneAwareLoadBalancer负载均衡选择出来了一个server，然后将这个server，交给ServerOpretion中的call()方法去处理。

结合方法的命名找到LoadBalancerCommand#selectServer()：

![202403071639910](https://cdn.jsdelivr.net/gh/chou401/pic-md@main//img/202403071639910.png)

![202403071640043](https://cdn.jsdelivr.net/gh/chou401/pic-md@main//img/202403071640043.png)

![202403071642161](https://cdn.jsdelivr.net/gh/chou401/pic-md@main//img/202403071642161.png)

selectServer()方法逻辑解析：

> 在这个方法中，就是直接基于Feign集成的Ribbon的`ZoneAwareLoadBalancer`的 chooseServer() 方法，通过负载均衡机制选择了一个server出来。
>
> - 先通过LoadBalancerContext#getServerFromLoadBalancer()方法获取到ILoadBalancer；
> - 在利用ILoadBalancer#chooseServer()方法选择出一个Server。

选择出一个Server之后，再去调用ServerOperation.call()方法，由call()方法拼接出最终的请求URI，发送http请求；

**3> 最终发送出去的请求URI是什么样的？**
ServerOperation#call()方法里负责发送请求，在executeWithLoadBalancer()方法中重写了LoadBalancerCommand#command()方法中入参ServerOperation的call()方法；

![202403071648955](https://cdn.jsdelivr.net/gh/chou401/pic-md@main//img/202403071648955.png)

```java
public URI reconstructURIWithServer(Server server, URI original) {
  // 获取服务 ip
  String host = server.getHost();
  // 获取服务的 port
  int port = server.getPort();
  // 获取请求协议，这里为 http
  String scheme = server.getScheme();

  if (host.equals(original.getHost())
        && port == original.getPort()
        && scheme == original.getScheme()) {
    return original;
  }
  if (scheme == null) {
    scheme = original.getScheme();
  }
  if (scheme == null) {
    scheme = deriveSchemeAndPortFromPartialUri(original).first();
  }

  try {
    StringBuilder sb = new StringBuilder();
    // 拼接请求协议，此时请求为 http://
    sb.append(scheme).append("://");
    if (!Strings.isNullOrEmpty(original.getRawUserInfo())) {
      sb.append(original.getRawUserInfo()).append("@");
    }
    // 拼接请求 ip，此时请求为 http://192.168.1.3
    sb.append(host);
    if (port >= 0) {
      // 拼接请求 post，此时请求为 http://192.168.1.3:8082
      sb.append(":").append(port);
    }
    // 拼接请求路径，此时请求为 http://192.168.1.3:8082/user/sayHello/1
    sb.append(original.getRawPath());
    // 拼接请求查询参数，此时请求为 http:///user/sayHello/1?name=zhangsan&age=18
    if (!Strings.isNullOrEmpty(original.getRawQuery())) {
      sb.append("?").append(original.getRawQuery());
    }
    if (!Strings.isNullOrEmpty(original.getRawFragment())) {
      sb.append("#").append(original.getRawFragment());
    }
    URI newURI = new URI(sb.toString());
    return newURI;
  } catch (URISyntaxException e) {
    throw new RuntimeException(e);
  }
}
```

方法逻辑解析：

> 根据之前处理好的请求URI和Server的地址拼接出真实的地址； 依次拼接http://，服务的IP、服务的Port、请求路径、查询参数，最终体现为：
>
> - 原request的uri：GET http:///user/sayHello/1?name=saint&age=18 HTTP/1.1
> - server地址：192.168.1.3:8082
> - 拼接后的地址：<http://192.168.1.3:8082/user/sayHello/1?name=saint&age=18>

接着使用拼接后的地址替换掉request.uri，再调用FeignLoadBalacner#execute()方法发送一个http请求；其中发送请求的超时时间默认为1000ms，即1s；最后返回结果封装到FeignLoadBalancer.RibbonResponse。

###### 指定Decoder时对请求返回结果解码

如果配置了decoder，则使用Decoder#decode()方法对结果进行解码；

```java
public interface Decoder {

  /**
   * Decodes an http response into an object corresponding to its
   * {@link java.lang.reflect.Method#getGenericReturnType() generic return type}. If you need to
   * wrap exceptions, please do so via {@link DecodeException}.
   *
   * @param response the response to decode
   * @param type {@link java.lang.reflect.Method#getGenericReturnType() generic return type} of the
   *        method corresponding to this {@code response}.
   * @return instance of {@code type}
   * @throws IOException will be propagated safely to the caller.
   * @throws DecodeException when decoding failed due to a checked exception besides IOException.
   * @throws FeignException when decoding succeeds, but conveys the operation failed.
   */
  Object decode(Response response, Type type) throws IOException, DecodeException, FeignException;

  /** Default implementation of {@code Decoder}. */
  public class Default extends StringDecoder {

    @Override
    public Object decode(Response response, Type type) throws IOException {
      if (response.status() == 404 || response.status() == 204)
        return Util.emptyValueOf(type);
      if (response.body() == null)
        return null;
      if (byte[].class.equals(type)) {
        return Util.toByteArray(response.body().asInputStream());
      }
      return super.decode(response, type);
    }
  }
}
```

###### 默认情况下，Feign接收到服务返回的结果后，如何处理？

即：未指定decoder时，会直接使用AsyncResponseHandler#handleResponse()方法处理接收到的服务返回结果：

![202403071718925](https://cdn.jsdelivr.net/gh/chou401/pic-md@main//img/202403071718925.png)

![202403071723997](https://cdn.jsdelivr.net/gh/chou401/pic-md@main//img/202403071723997.png)

如果响应结果的returnType为Response时，则将return信息的body()解析成byte数组，放到resultFuture的RESULT中；然后SynchronousMethodHandler#executeAndDecode()方法中通过resultFuture.join()方法拿到RESULT（即：请求的真正的响应结果）。

一般而言，会走到如下else if 分支

```java
// 请求成功后，返回结果类型为 void，则处理的返回结果赋值 null
if (isVoidType(returnType)) {
  resultFuture.complete(null);
} else {
  // 解析请求的返回结果
  final Object result = decode(response, returnType);
  shouldClose = closeAfterDecode;
  resultFuture.complete(result);
}
```

decode()方法中将response处理为我们要的returnType，比如调用的服务方返回给我们一个JSON字符串，decode()方法中会将其转换为我们需要的JavaBean（即：returnType，当前方法的返回值）。

```java
Object decode(Response response, Type type) throws IOException {
  try {
    return decoder.decode(response, type);
  } catch (final FeignException e) {
    throw e;
  } catch (final RuntimeException e) {
    throw new DecodeException(response.status(), e.getMessage(), response.request(), e);
  }
}
```

deocode()方法中会用到一个Decoder，decoder默认是OptionalDecoder，针对JavaBean返回类型，OptionalDecoder将decode委托给ResponseEntityDecoder处理。

#### 总结

> 1. 请求达到FeignClient时，会进入到JDK动态代理类，由ReflectiveFeign#FeignInvocationHandler分发处理请求；找到接口方法对应的SynchronousMethodHandler；
> 2. SynchronousMethodHandler中首先使用SpringMvcContract解析标注了SpringMvc注解的参数；然后使用encoder对请求进行编码；
> 3. RequestInterceptor对Request进行拦截处理；
> 4. LoadBalancerFeignClient通过集成的Ribbon的负载均衡器（`ZoneAwareLoadBalancer`）实现负载均衡找到一个可用的Server，交给RibbonRequest组合的Client去做HTTP请求，这里的Client可以是HttpUrlConnection、HttpClient、OKHttp。
> 5. 最后Decoder对Response响应进行解码。

## OpenFeign新版本和旧版本之间的差异（高版本OpenFeign底层不使用Ribbon做负载均衡）

### @FeignClientsRegistrar开启对FeignClient的扫描

**此处主流程上无区别:**
在SpringBoot启动流程中 @FeignClientsRegistrar 注解开启OpenFeign的入口、OpenFeign扫描所有的FeignClient的流程，高版本和低版本基本一样。

主要流程如下：

> 1> 开启扫描FeignClient的入口:
>
> 1. 启动类上添加的@EnableFeignClients注解会通过@Import注解在SpringBoot启动流程中将ImportBeanDefinitionRegistrar接口的实现类FeignClientsRegistrar注入到启动类的ConfigurationClass的属性中，在注册启动类的BeanDefinition时，会遍历调用其@Import的所有ImportBeanDefinitionRegistrar接口的 registerBeanDefinitions()方法。
>
> 2> 扫描FeignClient：
>
> 1. 拿到@EnableFeignClients注解中配置的扫描包路径相关的属性，得到要扫描的包路径；
> 2. 获取到扫描器ClassPathScanningCandidateComponentProvider，然后给其添加一个注解过滤器（AnnotationTypeFilter），只过滤出包含@FeignClient注解的BeanDefinition；
> 3. 扫描器的findCandidateComponents(basePackage)方法从包路径下扫描出所有标注了@FeignClient注解并符合条件装配的接口；然后将其在BeanDefinitionRegistry中注册一下；

### 为FeignClient生成动态代理类

**区别主要体现在这里:**
在注册FeignClient到Spring容器时，构建的BeanDefinition的beanClas是FeignClientFactoryBean；FeignClientFactoryBean是一个工厂，保存了@FeignClient注解的所有属性值，在Spring容器初始化的过程中，其会根据之前扫描出的FeignClient信息构建FeignClient的动态代理类。

**底层通信Client的区别？**
在使用Feign.Builder构建FeignClient的时候，获取到的Client是FeignBlockingLoadBalancerClient（这其中的逻辑后面聊，在OpenFeign低版本是LoadBalancerFeignClient）；用于生成FeignClient的Targeter是DefaultTargeter（在OpenFeign低版本是HystrixTargeter，高版本移除了Hystrix，采用Spring Cloud Circuit Breaker 做限流熔断）；

具体体现在FeignClientFactoryBean#loadBalance()方法，其是一个进行负载均衡的FeignClient动态代理生成方法；

**1> FeignBlockingLoadBalancerClient何时注入到Spring容器？**

FeignBlockingLoadBalancerClient注入到Spring容器的方式和OpenFeign低版本的LoadBalancerFeignClient是一样的；

进入到FeignBlockingLoadBalancerClient类中，看哪里调用了它唯一一个构造函数；

找到FeignBlockingLoadBalancerClient发现有三个地方调用了它的构造函数，new了一个实例；

- DefaultFeignLoadBalancedConfiguration
- HttpClientFeignLoadBalancedConfiguration
- OkHttpFeignLoadBalancedConfiguration

再结合默认的配置，只有DefaultFeignLoadBalancedConfiguration中的Client符合条件装配；

可以通过引入Apache HttpClient的maven依赖使用HttpClientFeignLoadBalancedConfiguration，或引入OkHttpClient的maven依赖并在application.yml文件中指定feign.okhttp.enabled属性为true使用OkHttpFeignLoadBalancedConfiguration。

**2> DefaultTargeter在哪里注入到Spring容器?**

DefaultTargeter注入到Spring容器的方式和OpenFeign低版本的HystrixTargeter是一样的；

在FeignAutoConfiguration类中可以找到Targeter注入到Spring容器的逻辑；

**3> 后续生成动态代理类的逻辑和旧版本一样**
都体现在ReflectiveFeign#newInstance()方法中：

### Client处理负载均衡（核心区别）

上面提到OpenFeign高版本获取到的Client是`FeignBlockingLoadBalancerClient`，而低版本的是`LoadBalancerFeignClient`，LoadBalancerFeignClient基于Ribbon实现负载均衡，FeignBlockingLoadBalancerClient就靠OpenFeign（通过loadBalancerClient）实现负载均衡；

**FeignBlockingLoadBalancerClient是如何做负载均衡的:**
1> FeignBlockingLoadBalancerClient选择一个服务实例

```java
public Response execute(Request request, Request.Options options) throws IOException {
  // 将请求的 url 封装成 uri
  URI originalUri = URI.create(request.url());
  // 获取要请求的服务名
  String serviceId = originalUri.getHost();
  Assert.state(serviceId != null, "Request URI does not contain a valid hostname: " + originalUri);
  String hint = this.getHint(serviceId);
  DefaultRequest<RequestDataContext> lbRequest = new DefaultRequest(new RequestDataContext(LoadBalancerUtils.buildRequestData(request), hint));
  Set<LoadBalancerLifecycle> supportedLifecycleProcessors = LoadBalancerLifecycleValidator.getSupportedLifecycleProcessors(this.loadBalancerClientFactory.getInstances(serviceId, LoadBalancerLifecycle.class), RequestDataContext.class, ResponseData.class, ServiceInstance.class);
  supportedLifecycleProcessors.forEach((lifecycle) -> {
    lifecycle.onStart(lbRequest);
  });
  // 选择一个服务实例
  ServiceInstance instance = this.loadBalancerClient.choose(serviceId, lbRequest);
  org.springframework.cloud.client.loadbalancer.Response<ServiceInstance> lbResponse = new DefaultResponse(instance);
  String message;
  if (instance == null) {
    message = "Load balancer does not contain an instance for the service " + serviceId;
    if (LOG.isWarnEnabled()) {
      LOG.warn(message);
    }

    supportedLifecycleProcessors.forEach((lifecycle) -> {
      lifecycle.onComplete(new CompletionContext(Status.DISCARD, lbRequest, lbResponse));
    });
    return Response.builder().request(request).status(HttpStatus.SERVICE_UNAVAILABLE.value()).body(message, StandardCharsets.UTF_8).build();
  } else {
    // 构建完整的请求 url
    message = this.loadBalancerClient.reconstructURI(instance, originalUri).toString();
    Request newRequest = this.buildRequest(request, message, instance);
    return LoadBalancerUtils.executeWithLoadBalancerLifecycleProcessing(this.delegate, options, newRequest, lbRequest, lbResponse, supportedLifecycleProcessors);
  }
}
```
