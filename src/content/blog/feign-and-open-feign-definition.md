---
author: chou401
pubDatetime: 2024-02-22T15:00:03.000Z
modDatetime:
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

Netflix Feign 是 Netflix 公司发布的一种实现负载均衡和服务调用的开源组件。Spring Cloud 将其与 Netflix 中的其他开源服务组件（例如 Eureka、Ribbon 以及 Hystrix 等）一起整合进 Spring Cloud Netflix 模块中，整合后全称为 Spring Cloud Netflix Feign Feign 对 Ribbon (<http://c.biancheng.net/springcloud/ribbon.html>)进行了集成，利用 Ribbon 维护了一份可用服务清单，并通过 Ribbon 实现了客户端的负载均衡。Feign 是一种声明式服务调用组件，它在 RestTemplate 的基础上做了进一步的封装。通过 Feign，我们只需要声明一个接口并通过注解进行简单的配置（类似于 Dao 接口上面的 Mapper 注解一样）即可实现对 HTTP 接口的绑定。通过 Feign，我们可以像调用本地方法一样来调用远程服务，而完全感觉不到这是在进行远程调用。Feign 支持多种注解，例如 Feign 自带的注解以及 JAX-RS 注解等，但遗憾的是 Feign 本身并不支持 Spring MVC 注解，这无疑会给广大 Spring 用户带来不便。

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
