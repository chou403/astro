---
author: chou401
pubDatetime: 2024-01-30T12:28:25Z
modDatetime: 2024-05-25T17:40:28Z
title: 面基记录
featured: false
draft: false
tags:
  - java
  - interview
description: 面试经常被问到的问题
---

## Table of contents

## Java 中的四种引用类型

Java 中的引用类型分别为**强、软、弱、虚**。

在 Java 中最常见的就是强引用，把一个对系那个赋给一个引用变量，这个引用变量就是一个强引用。当一个对象被强引用变量引用时，它始终处于可达状态，它是不可能被垃圾回收机制回收的，即使该对象以后永远都不会被用到 JVM 也不会回收。因此强引用时造成 Java 内存泄漏的主要原因之一。例如：Object obj = new Object()。

其次是软引用，对于只有软引用的对象来说，当系统内存足够时它不会被回收，当系统内存空间不足时它会被回收。软引用通话吃那个用在对内存敏感的程序中，作为缓存使用。例如：SoftRefenence softRef = new SoftRefenence()。

然后是弱引用，它比较引用的生存期更短，对于只有弱引用的对象来说，只要垃圾回收机制已运行，不管 JVM 的内存空间是否足够，总会回收该对象占用的内存。可以解决内存泄漏的问题，ThreadLocal 就是基于弱引用解决内存泄漏的问题。例如：WeakRefenence weakRef = new WeakRefenence()。

最后是虚引用，它不能单独使用，必须和引用队列联合使用。虚引用的主要作用是跟踪对系那个被垃圾回收的状态。例如：ReferenceQueue queue = new ReferenceQueue()；PhantomReference phantomRef = new PhantomReference(obj,queue)，不过在开发中，我们用的更多的还是强引用。

## Rocketmq 消息堆积 堆积到哪里

在 Apache RocketMQ 中，消息堆积主要发生在以下几个地方：

1. **Broker（代理）端的消息队列**：
   - 当生产者发送消息到 RocketMQ 时，这些消息首先存储在 Broker 端的消息队列中。如果消费者的消费速度跟不上生产者的发送速度，消息会在 Broker 端的消息队列中堆积。
2. **消息存储（Message Store）**：
   - Broker 会将接收到的消息持久化到磁盘上（CommitLog 文件）。如果消息没有被及时消费，这些消息会在磁盘的存储文件中积累。
3. **消息队列文件（ConsumeQueue）**：
   - 每个主题（Topic）的每个队列（Queue）都有相应的 ConsumeQueue 文件，这些文件记录了消息的物理偏移量和大小。当消息堆积时，这些 ConsumeQueue 文件会变得越来越大，因为记录了大量未消费的消息。
4. **索引文件（IndexFile）**：
   - RocketMQ 还会为消息创建索引文件，用于快速查询。如果消息未被消费，索引文件的数量和大小也会增加。

消息堆积的主要原因包括：

- **消费者处理能力不足**：消费者处理消息的速度低于生产者发送消息的速度。
- **消费延迟**：网络延迟或消费者应用程序的性能问题导致消息处理延迟。
- **系统瓶颈**：Broker 或消费者端的硬件资源（如 CPU、内存、磁盘 IO 等）不足。

为了解决消息堆积问题，可以采取以下措施：

- **扩展消费者**：增加消费者实例，以提高消息处理能力。
- **优化消费者代码**：提高消费者应用程序的性能，减少处理单条消息的时间。
- **调整消费策略**：如批量消费，增加每次拉取的消息数量。
- **扩展 Broker 集群**：增加 Broker 节点，以分散消息负载。

通过这些方法，可以有效地减少或避免消息堆积，提高 RocketMQ 系统的整体性能和稳定性。

监控和管理消息堆积是 RocketMQ 运维中的重要任务。可以通过以下方式查看和处理堆积：

- **监控工具**：使用 RocketMQ 提供的监控工具（如 mqadmin 命令行工具）或阿里云控制台来检查 Broker 和 Topic 的消息状态，包括堆积数量、堆积时间等。
- **报警设置**：配置告警规则，当消息堆积达到一定阈值时，自动触发报警通知。
- **性能优化**：检查 Consumer 端的消费性能，优化消费逻辑，提高消费速度。  
  扩展 Consumer：如果需要，可以增加 Consumer 实例来并行消费，分散消费压力。  
  总之，RocketMQ 消息堆积是由于生产速度大于消费速度导致的，需要通过监控、优化和扩展来避免和解决。

## OpenFeign 如何实现的消息间内部调用 重要

OpenFeign 是一个基于注解和反射的声明式 HTTP 客户端，用于简化服务之间的 HTTP 调用。它的实现基于 Spring Cloud，并且支持了对服务间内部调用的封装和简化。

OpenFeign 实现服务间内部调用的基本原理如下：

1. **声明式接口定义**：首先，你需要定义一个接口，该接口中声明了你想要调用的服务的 HTTP 接口。这些接口方法使用了标准的 Spring MVC 或 JAX-RS 注解来描述 HTTP 请求。

2. **动态代理**：在 Spring 容器启动时，OpenFeign 会扫描并解析这些带有特定注解的接口，并通过动态代理技术为这些接口生成代理类。

3. **注解解析**：代理类在执行接口方法时，会根据方法上的注解来构造对应的 HTTP 请求，并将请求发送到目标服务。OpenFeign 支持的注解包括 @RequestMapping、@GetMapping、@PostMapping、@PutMapping、@DeleteMapping 等。

4. **HTTP 客户端**：OpenFeign 内部使用了 Spring 提供的 RestTemplate 或者 WebClient 等 HTTP 客户端来发送 HTTP 请求。

5. **负载均衡和服务发现**：OpenFeign 集成了 Ribbon 负载均衡器和 Eureka 或者 Consul 等服务发现组件，能够自动地实现服务的负载均衡和服务发现功能。

总的来说，OpenFeign 使用了动态代理技术和注解解析机制来简化服务间的内部调用。通过在接口方法上使用标准的 Spring MVC 或 JAX-RS 注解来描述 HTTP 请求，开发者可以像调用本地方法一样来调用远程服务。这样就大大简化了服务之间的通信代码，并提高了开发效率。

OpenFeign 内部使用了同步的 HTTP 客户端，因此它在内部调用时也会是同步的。这种同步的调用方式适用于简单的场景，但如果需要支持高性能或者高并发，那么 OpenFeign 可能就不够用了。

要实现消息间内部调用，可以使用异步的 HTTP 客户端，例如使用 Spring 的 `AsyncHttpClient`。在异步模式下，客户端会创建一个请求，然后在不同的线程中异步地处理请求。这样可以避免阻塞，提高性能。但同时，这种模式也更加复杂，需要更详细的错误处理和并发控制。

如果你想要在 OpenFeign 中实现异步内部调用，可以参考以下步骤：

1. 引入异步客户端库：在你的项目中引入 Spring 的异步客户端库，例如 spring-web-flux。

2. 创建异步客户端：在你的项目中创建一个异步客户端，可以使用 WebFluxClientTemplate 或者 RestTemplate 的异步版本。

3. 编写异步调用代码：使用异步客户端调用远程服务，并在回调函数中处理结果。例如：

   ```java
   @Autowired
   private AsyncHttpClient asyncHttpClient;

   public void asyncInternalCall(String url, String method, Object body) {
       asyncHttpClient.exchange()
           .request(method, url, body)
           .subscribe(response -> {
               // 处理响应
               System.out.println("Response: " + response.body());
           }, error -> {
               // 处理错误
               System.err.println("Error: " + error);
           });
   }
   ```

4. 在 OpenFeign 中使用异步客户端：在你的 OpenFeign 接口中，使用异步客户端进行内部调用。例如：

   ```java
   @FeignClient("service-name")
   public interface ServiceFeignClient {
       @PostMapping("/api/v1/internal-call")
       AsyncResult<String> asyncInternalCall(@RequestBody Object body);
   }
   ```

这样，在调用 ServiceFeignClient 的 asyncInternalCall 方法时，异步客户端会自动处理请求的异步执行。

## OpenFeign 如何实现负载均衡 重要

OpenFeign 本身并不直接实现负载均衡，但它可以与 Spring Cloud 的负载均衡器组件结合使用，比如 Ribbon，或者更现代的 Spring Cloud LoadBalancer，来实现服务调用时的负载均衡。以下是使用 OpenFeign 实现负载均衡的步骤：

1. **启用 Spring Cloud LoadBalancer**：

   - 在项目中引入 Spring Cloud LoadBalancer 的依赖。
   - 配置 application.yml 或 application.properties 文件，启用 LoadBalancer：

   ```java
   spring:
    cloud:
      loadbalancer:
        enabled: true
   ```

2. **使用 FeignClient**：

   - 定义 FeignClient 接口，并指定服务实例的名称，而不是具体的 URL。Spring Cloud LoadBalancer 将根据服务实例名称来选择一个可用的服务实例。

   ```java
   @FeignClient(name = "target-service")
   public interface TargetServiceClient {
       @GetMapping("/api")
       String getSomeData();
   }
   ```

3. **Ribbon 集成（可选，适用于旧版）**：

   - 如果你使用的是 Spring Cloud 早期版本，需要集成 Ribbon 来实现负载均衡。在 pom.xml 或 build.gradle 文件中添加 Ribbon 的依赖。
   - 在 @FeignClient 注解中，可以配置负载均衡策略。Ribbon 负载均衡器会根据选择的负载均衡算法（如轮询、随机、权重等）选择一个服务提供者，并将请求转发给选中的服务提供者。例如，如果你想要使用轮询策略，可以在配置中指定：

   ```java
   @FeignClient(name = "target-service", configuration = MyFeignConfig.class)
   public interface TargetServiceClient {
       // ...
   }

   @Configuration
   public class MyFeignConfig {
       @Bean
       public Client feignClient() {
           return new RibbonClient(RibbonConfig.builder().build());
       }
   }
   ```

4. **配置负载均衡策略**：
   - 如果需要自定义负载均衡策略，可以通过实现 org.springframework.cloud.loadbalancer.core.ServiceInstanceChooser 接口来自定义选择服务实例的方式。
5. **运行应用**：
   - 启动应用，OpenFeign 会利用 Spring Cloud LoadBalancer 自动选择一个可用的服务实例进行请求，每次请求可能会选择不同的实例，从而实现负载均衡。
6. **失败重试**：

   在 Spring Cloud LoadBalancer 中，失败重试功能是通过 Retry 实现的。Retry 是 Spring Cloud 提供的一个通用的重试机制，它能够在请求失败时自动地进行重试操作。Spring Cloud LoadBalancer 集成了 Retry，因此可以方便地在负载均衡器中实现失败重试功能。

   使用 Spring Cloud LoadBalancer 实现失败重试的步骤如下：

   - **配置 Retry**：首先，需要在应用程序中配置 Retry 的相关参数，如重试次数、重试间隔等。可以通过 Spring Cloud 提供的 @LoadBalancerClient 注解或者配置文件来配置 Retry。

   - **启用 Retry**：在使用 Spring Cloud LoadBalancer 时，需要启用 Retry 功能。可以通过配置文件或者 Spring Boot 配置属性来启用 Retry。

   - **触发重试**：当发起请求时，如果请求失败了（如连接超时、服务不可用等），Spring Cloud LoadBalancer 会自动触发 Retry，尝试重新选择另一个可用的服务实例，并重新发送请求。Retry 会根据配置的重试策略进行重试，直到达到最大重试次数或者请求成功为止。

   通过以上步骤，可以在 Spring Cloud LoadBalancer 中实现失败重试功能。这样可以提高服务消费者对服务提供者的容错能力，增强系统的稳定性和可靠性。

请注意，从 Spring Cloud Hoxton 版本开始，推荐使用 Spring Cloud LoadBalancer 替换 Ribbon，因为它提供了更现代的负载均衡解决方案，并且与 Netflix Ribbon 不再有直接关联。

## Spring Cloud LoadBalancer 负载均衡 和 ribbon 负载均衡

在 Spring Cloud 中，负载均衡是一种分配客户端请求到多个服务实例的技术。Spring Cloud 提供了两种负载均衡实现：Ribbon 和 Spring Cloud LoadBalancer。以下是对这两种负载均衡的详细比较和介绍。

### Ribbon

1. **概述**：

   - Ribbon 是 Netflix 开源的一个负载均衡客户端库，广泛用于 Spring Cloud Netflix 组件中。

2. **特点**：

   - **客户端负载均衡**：Ribbon 在客户端实现负载均衡逻辑，客户端决定将请求发送到哪个服务实例。
   - **多种负载均衡策略**：Ribbon 提供了多种负载均衡策略，如轮询、随机、权重等。
   - **自定义负载均衡规则**：可以通过实现 `IRule` 接口自定义负载均衡规则。

3. **配置**：

   - Ribbon 配置通过 `application.yml` 或 `application.properties` 文件进行，例如：

     ```yaml
     my-service:
       ribbon:
         NFLoadBalancerRuleClassName: com.netflix.loadbalancer.RandomRule
     ```

4. **集成**：
   - Ribbon 通常与 Eureka、Feign 等其他 Spring Cloud Netflix 组件结合使用。

### Spring Cloud LoadBalancer

1. **概述**：

   - Spring Cloud LoadBalancer 是 Spring Cloud 提供的新一代负载均衡解决方案，旨在取代 Ribbon。
   - 自 Spring Cloud Hoxton 版本起，Spring Cloud LoadBalancer 成为推荐的负载均衡解决方案。

2. **特点**：

   - **轻量级**：比 Ribbon 更轻量级，适合 Spring Boot 和 Spring Cloud 应用。
   - **服务实例选择器**：使用 `ServiceInstanceListSupplier` 接口定义服务实例选择逻辑。
   - **可扩展性**：允许开发者通过自定义 `ServiceInstanceListSupplier` 和 `ReactorLoadBalancer` 实现扩展和定制。

3. **配置**：

   - 配置通常通过 Java 配置类或属性文件进行，例如：

     ```java
     @Bean
     public ReactorLoadBalancer<ServiceInstance> loadBalancer(ClientHttpConnector clientHttpConnector) {
         return new RandomLoadBalancer();
     }
     ```

4. **集成**：
   - Spring Cloud LoadBalancer 与 Spring Cloud Discovery Client 集成，可以与 Consul、Eureka 等服务发现组件一起使用。

### 比较

- **成熟度**：

  - Ribbon 是一个成熟的解决方案，已被广泛使用和验证。
  - Spring Cloud LoadBalancer 是较新的解决方案，随着 Spring Cloud 的发展而不断改进。

- **灵活性和扩展性**：

  - Ribbon 提供了多种内置的负载均衡策略，并允许自定义策略。
  - Spring Cloud LoadBalancer 通过更现代和灵活的方式允许开发者扩展和定制负载均衡逻辑。

- **配置和使用**：
  - Ribbon 配置主要通过配置文件，集成较为复杂。
  - Spring Cloud LoadBalancer 配置更加简洁，易于与 Spring Boot 和 Spring Cloud 生态系统集成。

### 选择建议

- **现有应用**：
  - 如果你已经在使用 Ribbon 并且它满足你的需求，可以继续使用 Ribbon。
- **新项目**：
  - 对于新的 Spring Cloud 项目，建议使用 Spring Cloud LoadBalancer，因为它是未来的发展方向，并且与 Spring Cloud 生态系统更好地集成。

总结来说，虽然 Ribbon 是一个成熟且功能丰富的负载均衡库，但 Spring Cloud LoadBalancer 提供了更现代、更轻量级的负载均衡解决方案，适合与最新的 Spring Cloud 组件和实践一起使用。

## OpenFeign 用到了哪些设计模式 重要

OpenFeign 在其实现中使用了多种设计模式，以实现其灵活、可扩展且易于使用的 HTTP 客户端。这些设计模式包括但不限于：

### 1. **代理模式（Proxy Pattern）**

OpenFeign 最核心的设计模式是代理模式。代理模式用于为其他对象提供一种代理以控制对这个对象的访问。Feign 使用 Java 的动态代理机制为每个标注了 `@FeignClient` 的接口生成一个代理对象。当调用接口的方法时，代理对象会拦截方法调用并执行相应的 HTTP 请求。

```java
@FeignClient(name = "my-service")
public interface MyServiceClient {
    @GetMapping("/endpoint")
    String getEndpoint();
}
```

### 2. **工厂模式（Factory Pattern）**

工厂模式在 Feign 的构建过程中被广泛使用。例如，`Feign.builder()` 方法用于创建 Feign 客户端的实例。通过工厂模式，Feign 可以灵活地配置和创建不同类型的客户端。

```java
Feign.builder()
     .decoder(new GsonDecoder())
     .target(MyServiceClient.class, "http://my-service");
```

### 3. **模板模式（Template Pattern）**

Feign 的 `RequestTemplate` 类使用了模板模式。模板模式定义了一个操作中的算法骨架，而将一些步骤延迟到子类中。`RequestTemplate` 类定义了如何构建 HTTP 请求的基本流程，但具体的请求构建细节可以在不同的实现中进行定制。

### 4. **策略模式（Strategy Pattern）**

策略模式在 Feign 中用于处理各种不同的行为。例如，Feign 使用策略模式来选择不同的编码器和解码器。开发者可以通过提供不同的编码器和解码器来定制请求和响应的处理方式。

```java
Feign.builder()
     .encoder(new GsonEncoder())
     .decoder(new GsonDecoder())
     .target(MyServiceClient.class, "http://my-service");
```

### 5. **责任链模式（Chain of Responsibility Pattern）**

责任链模式在 Feign 的请求拦截器（Request Interceptors）中得到了体现。多个请求拦截器可以组成一个链，按照顺序对请求进行处理。这使得请求的预处理和后处理变得灵活且可扩展。

```java
Feign.builder()
     .requestInterceptor(new CustomInterceptor())
     .target(MyServiceClient.class, "http://my-service");
```

### 6. **装饰器模式（Decorator Pattern）**

装饰器模式允许动态地将责任附加到对象上。在 Feign 中，装饰器模式用于增强 HTTP 客户端的功能，例如通过日志记录器（Logger）记录请求

和响应的详细信息。通过使用装饰器模式，Feign 可以在不修改原始对象的情况下添加额外的功能。

```java
Feign.builder()
     .logger(new Slf4jLogger())
     .logLevel(Logger.Level.FULL)
     .target(MyServiceClient.class, "http://my-service");
```

### 7. **构建器模式（Builder Pattern）**

构建器模式在 Feign 的客户端构建过程中得到了广泛应用。`Feign.builder()` 提供了一种流畅的 API 来配置和创建 Feign 客户端实例。通过构建器模式，开发者可以逐步设置客户端的各种属性和选项。

```java
Feign.builder()
     .encoder(new GsonEncoder())
     .decoder(new GsonDecoder())
     .requestInterceptor(new CustomInterceptor())
     .logger(new Slf4jLogger())
     .logLevel(Logger.Level.FULL)
     .target(MyServiceClient.class, "http://my-service");
```

### 8. **单例模式（Singleton Pattern）**

单例模式确保一个类只有一个实例，并提供一个全局访问点。在 Feign 的实现中，一些核心组件如 `Feign.Builder` 和 `LoadBalancer` 通常作为单例来使用，以确保整个应用程序中共享同一个实例。

### 总结

OpenFeign 通过使用这些设计模式，实现了灵活性、可扩展性和易用性的目标。代理模式是其最核心的设计模式，用于动态生成接口的代理对象。工厂模式、模板模式和策略模式用于构建和配置 Feign 客户端的各个方面。责任链模式和装饰器模式增强了请求处理的灵活性和功能性。构建器模式提供了流畅的 API，用于创建和配置客户端实例。单例模式确保了一些核心组件在整个应用程序中的一致性和共享性。

通过结合这些设计模式，OpenFeign 提供了一个强大且易于使用的 HTTP 客户端库，能够满足各种复杂的分布式系统需求。

## OpenFeign 动态代理做了什么

OpenFeign 是一个声明式的 HTTP 客户端，它通过接口定义的方式使得调用远程 HTTP 服务就像调用本地方法一样简单。在底层，OpenFeign 使用了 Java 动态代理机制来实现这一点。动态代理的作用是在运行时创建代理对象，这些代理对象在方法调用时拦截并处理实际的 HTTP 请求。下面详细描述 OpenFeign 动态代理的具体工作原理和过程。

### 1. 接口定义

首先，你需要定义一个接口，并使用 Feign 注解来声明 HTTP 请求：

```java
@FeignClient(name = "myService", url = "http://example.com")
public interface MyService {
    @GetMapping("/endpoint")
    String getEndpoint();
}
```

### 2. 动态代理生成

当 Spring 应用启动时，OpenFeign 会扫描所有使用了 `@FeignClient` 注解的接口，并为这些接口创建代理对象。这是通过 Java 动态代理（`java.lang.reflect.Proxy`）实现的。

### 3. 拦截方法调用

当你调用接口方法时，实际调用的是代理对象的方法。代理对象会拦截这个调用，并执行以下步骤：

#### a. 方法拦截

代理对象实现了接口，并在调用接口方法时执行自定义的处理逻辑。具体而言，当方法被调用时，`InvocationHandler` 会拦截该调用。

#### b. 构建请求

代理对象使用 Feign 的 `RequestTemplate` 根据接口方法上的注解和传入的参数构建 HTTP 请求。这包括：

- 确定请求方法（GET、POST 等）。
- 组装请求 URL。
- 设置请求头。
- 序列化请求参数和请求体。

#### c. 发送请求

构建好请求后，代理对象使用 Feign 的 `Client` 实例（通常是基于 `HttpURLConnection` 或 Apache HttpClient 实现的）发送 HTTP 请求。

#### d. 处理响应

发送请求后，代理对象会接收并处理 HTTP 响应。具体处理逻辑包括：

- 检查 HTTP 状态码。
- 反序列化响应体到接口方法的返回类型。
- 处理错误和异常情况。

### 4. 返回结果

处理完成后，代理对象将响应结果返回给调用者。如果响应中包含的是错误信息或者异常情况，代理对象会根据 Feign 配置抛出相应的异常。

### 动态代理的具体实现

Feign 动态代理的具体实现核心是 `FeignInvocationHandler`，这个类实现了 `InvocationHandler` 接口，负责拦截接口方法调用，并执行上述请求构建、发送和响应处理的逻辑。

```java
public class FeignInvocationHandler implements InvocationHandler {
    private final Target<?> target;
    private final Map<Method, MethodHandler> dispatch;

    public FeignInvocationHandler(Target<?> target, Map<Method, MethodHandler> dispatch) {
        this.target = target;
        this.dispatch = dispatch;
    }

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        if (method.getDeclaringClass() == Object.class) {
            return method.invoke(this, args);
        }
        return dispatch.get(method).invoke(args);
    }
}
```

在这里，`dispatch` 是一个映射，将接口方法映射到实际处理请求的 `MethodHandler`。`MethodHandler` 包含了处理请求的具体逻辑。

### 整体流程总结

1. **定义接口**：开发者定义 Feign 客户端接口，使用注解描述请求。
2. **创建代理**：Spring 在启动时为带有 `@FeignClient` 注解的接口创建动态代理对象。
3. **拦截调用**：代理对象拦截接口方法调用，构建并发送 HTTP 请求。
4. **处理响应**：代理对象处理 HTTP 响应，并将结果返回给调用者。

通过动态代理，OpenFeign 将 HTTP 请求抽象成接口方法调用，使得开发者可以更加方便、优雅地调用远程服务。

总的来说，代理模式在 OpenFeign 中的作用是将客户端接口转换为对应的 HTTP 请求并发送到服务端，同时封装了 HTTP 请求和响应的逻辑，并支持负载均衡和服务发现等功能。这样，开发者可以像调用本地方法一样来调用远程服务，而无需关注底层的 HTTP 请求和通信细节。

## 动态代理是什么

动态代理是一种在运行时生成代理类和代理对象的机制。与静态代理相比，动态代理不需要在编译期间就确定代理类的代码，而是在程序运行时动态生成代理类和代理对象，从而可以在不修改原始类的情况下，对原始类的方法进行增强或拦截。

动态代理通常使用 Java 的反射机制来实现。Java 中的动态代理主要有两种实现方式：

1. JDK 动态代理：JDK 动态代理是 Java 标准库提供的一种动态代理实现方式。它基于接口来创建代理类和代理对象，只能代理实现了接口的类。JDK 动态代理主要涉及两个类：java.lang.reflect.Proxy 和 java.lang.reflect.InvocationHandler。开发者通过实现 InvocationHandler 接口来编写代理逻辑，然后使用 Proxy.newProxyInstance() 方法来生成代理对象。代理类在调用方法时，会调用 InvocationHandler 的 invoke 方法，允许在执行真实方法前后插入自定义逻辑。

2. CGLIB 动态代理：CGLIB（Code Generation Library）是一个强大的、高性能的代码生成库，可以在运行时动态生成字节码，从而实现动态代理。CGLIB 动态代理不需要接口，它可以直接代理类，并在运行时生成被代理类的子类作为代理类。CGLIB 动态代理主要涉及到两个类：net.sf.cglib.proxy.Enhancer 和 net.sf.cglib.proxy.MethodInterceptor。开发者通过实现 MethodInterceptor 接口来编写代理逻辑，然后使用 Enhancer.create() 方法来生成代理对象。

动态代理的主要应用场景包括：

1. AOP（面向切面编程）
2. RPC（远程过程调用）
3. 事务管理
4. 延迟加载等

总的来说，动态代理是一种非常灵活和强大的机制，它可以在运行时动态生成代理类和代理对象，并允许开发者在原始类的方法执行前后添加额外的逻辑，从而实现一些通用的功能和处理逻辑。

## CAS 原理是什么

CAS（Compare and Swap，比较并交换）是无锁编程中的一种原子操作，它通过硬件层面的支持来保证操作的原子性。CAS操作包含三个操作数：

1. **内存位置（Memory Location）V**：这是要修改的内存地址。
2. **预期值（Expected Value）A**：这是当前线程期望内存位置V的值。
3. **更新值（Update Value）B**：这是当预期值A与内存位置V的值相等时，想要写入的新值。

CAS的工作原理如下：

- 当一个线程试图更新V的位置时，它首先读取V的当前值。
- 然后，它检查这个值是否与预期值A匹配。
- 如果值匹配，那么V的值被更新为B，这个过程是原子的，即不会被其他线程中断。
- 如果值不匹配，说明在读取V之后有其他线程改变了V的值，那么当前线程不会更新V，而是返回V的最新值。  
  CAS操作是循环进行的，直到更新成功。这种机制被称为自旋锁，因为线程会不断地重试直到成功，而不会阻塞。如果多个线程都尝试更新同一个变量，只有一个线程能成功，其他线程会持续循环检查并重试。  
  在Java中，`java.util.concurrent.atomic` 包提供了CAS操作的类，如`AtomicInteger`、`AtomicLong`等，它们的方法如`compareAndSet()`、`compareAndExchange()`等就是基于CAS的。  
  由于CAS是硬件级别的操作，它通常比使用锁更高效，因为它避免了线程上下文切换和锁的开销。但是，如果存在大量的竞争（即多个线程反复尝试更新同一个值），CAS可能导致自旋次数过多，消耗CPU资源。此外，如果多个线程试图改变不同的值，但这些值相互依赖，那么CAS可能无法解决这个问题，因为它只检查单个值的更新。

## 线程池 内存分配 紧密型如何分配线程数

对于CPU密集型任务，线程池的线程数配置应该考虑到以下几点：

1. **CPU 核心数**：
   - CPU 密集型任务主要是利用CPU进行计算，因此线程数通常建议设置为等于或略小于CPU核心数。这是因为每个线程都在进行计算，过多的线程会导致上下文切换开销增大，反而降低整体性能。
2. **系统负载**：
   - 除了CPU核心数，还需要考虑系统中其他正在运行的进程和线程对CPU的占用。如果系统上还有其他高优先级或CPU密集型的服务，可能需要适当减少线程池的线程数，以避免争抢资源。
3. **任务特性**：
   - 任务本身的计算量和执行时间也是决定因素。如果任务执行非常快，可以考虑稍微增加线程数，以便更好地利用CPU。反之，如果任务执行较慢，过多的线程可能导致CPU等待时间过长，这时应减少线程数。
4. **线程同步和阻塞**：
   - 如果任务中包含大量的线程同步或阻塞操作，如等待I/O或其他资源，那么线程池的大小可以适当增加，因为这些任务在等待期间不会占用CPU资源。
5. **系统资源限制**：
   - 考虑到内存限制，如果每个线程占用大量内存，线程池的大小不能无限制增加，以免超出系统内存承受范围，导致性能下降甚至系统崩溃。  
     一个常见的经验公式是：`线程池大小 = CPU核心数 + 1` 或 ``，并发系数通常在1到2之间，取决于任务特性和系统负载。  
     但是，最佳的线程池大小可能需要通过实际测试和监控来进行调整，以找到最佳的平衡点，兼顾CPU利用率和上下文切换的开销。在生产环境中，可以考虑使用动态调整线程池大小的策略，以适应负载的变化。

## spring cloud resource 和 Autowired 什么区别

在 Spring 框架中，`@Resource` 和 `@Autowired` 是用于依赖注入的两种注解，但它们有一些重要的区别。理解这些区别有助于选择适合你的应用场景的注解。

### `@Autowired`

`@Autowired` 是 Spring 框架提供的注解，用于自动装配依赖。

#### 特点

1. **按类型装配**：默认情况下，`@Autowired` 按照类型（by type）进行装配。如果有多个相同类型的 bean，Spring 会根据其他因素（如 `@Primary` 或 `@Qualifier`）进行装配。
2. **Spring 特有**：`@Autowired` 是 Spring 框架特有的注解。
3. **可用于构造函数、字段和方法**：可以使用在构造函数、字段、Setter 方法和任意方法上。
4. **可选属性**：可以设置 `required` 属性来指示是否必须注入（默认为 `true`）。

#### 示例

**字段注入**：

```java
@Autowired
private MyService myService;
```

**构造函数注入**：

```java
@Autowired
public MyController(MyService myService) {
    this.myService = myService;
}
```

**Setter 方法注入**：

```java
@Autowired
public void setMyService(MyService myService) {
    this.myService = myService;
}
```

### `@Resource`

`@Resource` 是 Java 标准注解（JSR-250），Spring 对其进行了支持。

#### @Resource特点

1. **按名称装配**：默认情况下，`@Resource` 按照名称（by name）进行装配。如果找不到与名称匹配的 bean，Spring 会回退到按类型装配。
2. **Java 标准**：`@Resource` 是 Java 标准的一部分，因此在不同的依赖注入框架中也可以使用。
3. **可用于字段和 Setter 方法**：可以使用在字段和 Setter 方法上。

#### @Resource示例

**字段注入**：

```java
@Resource
private MyService myService;
```

**Setter 方法注入**：

```java
@Resource
public void setMyService(MyService myService) {
    this.myService = myService;
}
```

### 关键区别

1. **装配方式**：

   - `@Autowired`：默认按类型装配。
   - `@Resource`：默认按名称装配。

2. **注解来源**：

   - `@Autowired`：属于 Spring 框架。
   - `@Resource`：属于 Java 标准（JSR-250）。

3. **灵活性**：

   - `@Autowired`：可以在构造函数、字段和方法上使用，并且支持 `@Qualifier` 注解来进一步指定需要注入的 bean。
   - `@Resource`：主要用于字段和 Setter 方法注入，可以通过 `name` 属性明确指定要注入的 bean。

4. **依赖注入容器的行为**：
   - `@Autowired`：如果无法满足依赖注入，可以通过设置 `required` 属性为 `false` 来避免异常。
   - `@Resource`：如果无法满足依赖注入，默认会抛出异常。

### 何时使用

- **使用 `@Autowired`**：当你需要按类型注入并希望使用 Spring 特有的功能和灵活性时。
- **使用 `@Resource`**：当你需要按名称注入，或者希望使用与框架无关的标准注解时。

### 组合使用

有时，可能需要组合使用这两个注解。例如，当你需要按名称装配并且希望利用 Spring 提供的额外功能时，可以结合使用 `@Autowired` 和 `@Qualifier`。

```java
@Autowired
@Qualifier("specificBeanName")
private MyService myService;
```

通过了解和区分 `@Autowired` 和 `@Resource` 的使用场景，你可以更灵活地管理 Spring 应用中的依赖注入。

## 为什么Spring不建议使用基于字段的依赖注入

Spring 不建议使用基于字段的依赖注入（Field Injection），主要是因为以下几个原因：

### 1. **无法进行依赖注入的验证**

在使用基于字段的依赖注入时，依赖注入发生在对象实例化之后。Spring 容器在创建对象时无法验证这些字段是否已经成功注入，这可能会导致在运行时出现 `NullPointerException`。

### 2. **不易进行单元测试**

使用基于字段的依赖注入使得单元测试变得困难。要对带有字段注入的类进行单元测试，需要使用反射来设置私有字段，这不仅繁琐，而且破坏了封装性。相比之下，基于构造函数或 Setter 方法的依赖注入更容易进行单元测试，因为可以在测试时显式地提供依赖。

### 3. **不可变性**

使用构造函数注入时，依赖项在对象创建时被注入，因此可以确保依赖项是不可变的（`final`），这有助于设计出更加稳定和线程安全的类。字段注入不支持这一点，因为字段必须是可变的。

### 4. **缺乏明确的依赖**

构造函数和 Setter 方法明确地表明了一个类的依赖项，使代码更具可读性和可维护性。字段注入隐藏了依赖关系，增加了代码理解的难度。

### 5. **潜在的循环依赖问题**

使用构造函数注入时，Spring 可以更早地检测到循环依赖，并且通过调整 bean 的创建顺序来解决这些问题。字段注入可能会在更晚的时间发现这些问题，从而导致更难调试和解决。

### 6. **违反了控制反转（IoC）的原则**

控制反转的一个核心原则是依赖项应由外部容器管理并注入，而不是在类内部隐式地设置。字段注入在一定程度上隐藏了依赖项的注入过程，违背了这一原则。

### 示例对比

#### 构造函数注入

```java
@Component
public class MyService {
    private final MyRepository myRepository;

    @Autowired
    public MyService(MyRepository myRepository) {
        this.myRepository = myRepository;
    }

    // 使用 myRepository
}
```

#### 字段注入

```java
@Component
public class MyService {
    @Autowired
    private MyRepository myRepository;

    // 使用 myRepository
}
```

### 结论

尽管基于字段的依赖注入在某些情况下可能看起来更简洁，但它在测试性、可维护性、代码清晰度和可靠性方面存在显著缺点。因此，Spring 社区和文档通常推荐使用构造函数注入，或者在需要时使用 Setter 方法注入，以确保代码的质量和可维护性。

## Seata 有几种模式 重要

Seata（Simple Extensible Autonomous Transaction Architecture）是一个开源的分布式事务解决方案，致力于解决分布式系统中数据一致性的问题。Seata 提供了多种模式来管理分布式事务，主要包括：

1. **AT 模式（Automatic Transaction Mode）**：
   - **适用场景**：适用于支持 ACID（原子性、一致性、隔离性、持久性）事务的关系型数据库。
   - **原理**：通过代理 JDBC 数据源的方式，自动生成和管理全局事务。Seata 在执行数据库操作前后进行自动补偿。
   - **特点**：开发者无需修改现有代码，只需简单配置即可使用，适合对性能要求不太高的场景。
2. **TCC 模式（Try-Confirm-Cancel Mode）**：
   - **适用场景**：适用于对事务性能和精细化控制有高要求的场景。
   - **原理**：将业务逻辑分为三个阶段：Try 阶段执行业务预操作，Confirm 阶段提交事务，Cancel 阶段回滚事务。由开发者实现这些阶段的具体逻辑。
   - **特点**：需要开发者编写更多的代码，灵活性高，适用于复杂的业务场景。
3. **SAGA 模式（Long-Running Transaction Mode）**：
   - **适用场景**：适用于长时间运行的事务。
   - **原理**：将业务流程分解为一系列有序的子事务，每个子事务都有对应的补偿操作。在全局事务出错时，按逆序执行补偿操作。
   - **特点**：适合需要长时间处理的业务流程，如订单处理、供应链管理等。
4. **XA 模式（Distributed Transaction XA Mode）**：
   - **适用场景**：适用于支持 XA 协议的数据库。
   - **原理**：基于两阶段提交（2PC）协议实现的分布式事务管理器，协调多个数据库资源的提交和回滚。
   - **特点**：实现了标准的分布式事务协议，适用于传统的企业应用系统。

### 各模式特点总结

- **AT 模式**：使用方便，适用于简单的关系型数据库事务，但性能相对较低。
- **TCC 模式**：灵活性高，适用于对性能和事务控制要求高的复杂业务场景，但开发成本较高。
- **SAGA 模式**：适用于长时间运行的事务，支持复杂的业务流程。
- **XA 模式**：基于标准的两阶段提交协议，适用于需要严格分布式事务控制的企业应用。

这些模式为开发者提供了灵活的选择，能够根据不同的业务需求和技术环境选择合适的分布式事务解决方案。

## ap 和 cp 为什么 p 是不可或缺的 重要

在分布式系统中，AP 和 CP 是指系统在面临网络分区（Partition）时，如何权衡一致性（Consistency）和可用性（Availability）的不同设计选择。这些概念源自于 CAP 定理（也称为布鲁尔定理），该定理指出在分布式数据存储系统中，不可能同时完全满足一致性、可用性和分区容忍性这三个需求：

### CAP 定理的定义

- **Consistency（一致性）**：每次读取操作要么返回最新的写入结果，要么返回一个错误。
- **Availability（可用性）**：每次请求都会收到一个（非错误）响应——但不保证它是最新的写入结果。
- **Partition tolerance（分区容忍性）**：系统即使遇到任意数量的网络分区故障，仍能够继续运行。

"AP" 和 "CP" 是两种不同的一致性和可用性保证策略的代表。它们分别代表了分布式系统在出现网络分区（Partition）时，对一致性（Consistency）和可用性（Availability）的不同权衡。

1. **AP（可用性和分区容错性）**：AP 策略优先保证系统的可用性和分区容错性。即使发生了网络分区，系统仍然可以继续提供服务，尽管在分区后可能出现数据的不一致性。AP 系统通常允许部分节点或者服务在网络分区后继续提供服务，而不是停止整个系统的运行。这种策略适用于对系统的可用性要求比一致性要求更高的场景，例如互联网应用中的实时通信和在线游戏等。

2. **CP（一致性和分区容错性）**：CP 策略优先保证系统的一致性，即使在发生网络分区时也会暂时停止服务以确保数据的一致性。CP 系统会在发生网络分区时暂停部分或者全部服务，直到网络分区被解决并且数据恢复一致性。这种策略适用于对系统的一致性要求比可用性要求更高的场景，例如金融系统中的交易处理和数据存储等。

CAP 定理指出，在一个分布式系统中，当网络分区发生时，必须在一致性和可用性之间进行权衡。也就是说，你不能同时满足一致性和可用性，只能选择其中之一。

### 为什么 P（分区容忍性）是不可或缺的

分区容忍性在分布式系统中是不可或缺的原因如下：

1. **分布式系统的固有特性**：
   - 分布式系统由多个节点组成，这些节点通过网络相互通信。网络故障（如断开连接、延迟等）是不可避免的。在这种情况下，网络分区是分布式系统必须处理的一个基本问题。
   - 由于网络分区是现实中的一种常见情况，如果系统不具备分区容忍性，那么在发生网络分区时，系统将无法正常运行，这使得系统在实际应用中不具备可行性。
2. **CAP 定理的限制**：
   - CAP 定理强调，在网络分区不可避免的情况下，系统只能在一致性和可用性之间做出选择。因此，分区容忍性是前提条件，不是可以选择放弃的特性。
   - 也就是说，一个实际的分布式系统必须在分区容忍性和一致性、可用性之间进行权衡，但不能放弃分区容忍性。
3. **实际需求**：
   - 在实际应用中，用户期望系统能够在部分网络失败的情况下继续提供服务。放弃分区容忍性意味着系统在发生网络分区时将完全不可用，这对大多数应用场景来说是不可接受的。

在实践中，大多数分布式系统通常会牺牲一致性来保证可用性和分区容错性，或者牺牲部分可用性来提高一致性。例如，许多现代微服务架构倾向于采用最终一致性模型，允许短暂的数据不一致，以换取更高的可用性。  
因此，对于分布式系统的设计者来说，理解CAP理论并根据系统需求来权衡这三者是非常重要的。在设计时，需要根据业务需求来决定是更偏向于CP（强一致性）还是AP（高可用性）。

## Hashmap 的时间复杂度是多少？如果出现hash 碰撞如何处理？hashmap 最极端的时间复杂度是多少？

HashMap 的时间复杂度取决于具体的操作：

1. **插入（Insertion）和查找（Retrieval）**：在平均情况下，HashMap 的插入和查找操作的时间复杂度为 O(1)。这是因为 HashMap 使用了哈希表作为底层数据结构，在理想情况下，哈希表可以在常数时间内完成插入和查找操作。

2. **删除（Deletion）**：HashMap 的删除操作的时间复杂度也是 O(1)，与插入和查找类似。

如果出现哈希碰撞（Hash Collision），即不同的键映射到了哈希表中的同一个位置，HashMap 会使用链表或者红黑树来解决碰撞问题。具体处理方式如下：

1. **链表法**：当发生哈希碰撞时，HashMap 会将碰撞的键值对存储在同一个位置的链表中。在这种情况下，插入、查找和删除操作的时间复杂度会退化为 O(n/k)，其中 n 是键值对的数量，k 是桶的数量。这是因为需要遍历链表来查找或删除特定的键值对。

2. **红黑树**：从 JDK 8 开始，当链表长度超过一定阈值（默认为 8）时，HashMap 会将链表转换为红黑树，以提高性能。在红黑树中，插入、查找和删除操作的时间复杂度为 O(log n)，其中 n 是键值对的数量。

因此，当发生哈希碰撞时，HashMap 会根据具体情况采用链表法或者红黑树来解决碰撞问题，从而保证了插入、查找和删除操作的时间复杂度。在极端情况下，如果所有的键都映射到了同一个位置，那么链表法和红黑树都可能退化为 O(n)，即最坏情况下的时间复杂度为 O(n)。

## @Transactional 原理 为什么加上这个 就会实现所有数据库操作在一起

`@Transactional` 是 Spring 框架提供的一个非常强大的注解，用于实现声明式事务管理。当你在类或方法上添加 `@Transactional` 注解时，Spring 会自动为你管理事务边界，确保一系列数据库操作要么全部成功，要么全部失败，这也就是常说的"事务的原子性"。以下是其背后的工作原理概览：

1. 代理机制：Spring 使用 AOP（面向切面编程）来实现 `@Transactional` 的功能。具体来说，如果你使用的是 Spring 的代理模式（比如基于JDK动态代理或CGLIB），Spring 会在运行时创建一个代理对象来包裹你的实际业务对象。这个代理对象会在调用业务方法前后插入事务管理的逻辑。
2. 事务开始与提交/回滚：当代理对象检测到一个标有 `@Transactional` 的方法被调用时，它首先会开启一个新的数据库事务（如果当前没有事务，则新建；如果有，则根据事务传播行为决定是否加入当前事务）。然后执行业务方法。如果方法正常执行结束，代理会提交事务；如果方法执行过程中抛出未被捕获的异常，代理会自动回滚事务。
3. 事务属性配置：`@Transactional` 支持配置多种事务属性，如隔离级别、传播行为、超时时间及是否为只读事务等。这些属性允许你细粒度地控制事务的行为。
4. 异常处理：Spring 通过检查方法执行过程中抛出的异常类型来决定是否需要回滚事务。默认情况下，任何未被捕获的 RuntimeException 或其子类以及 Error 都会导致事务回滚。而受检异常（checked exceptions）不会触发自动回滚，除非你通过 rollbackFor 或 noRollbackFor 显式指定了异常类。
5. 资源管理：Spring 事务管理器与不同的持久化技术（如JDBC, JPA, Hibernate等）集成，负责底层的事务生命周期管理，包括获取和释放数据库连接等资源。

综上所述，`@Transactional` 能够简化事务管理，使得开发者无需手动编写开启事务、提交或回滚的代码，从而提高了代码的可读性和可维护性。这一切的背后，都是Spring框架通过强大的AOP和事务管理机制自动完成的。

## 事务传播行为有哪些

Spring 中的事务传播行为定义了在方法调用链中不同方法间事务如何进行传播和交互的规则。以下是 Spring 中定义的事务传播行为：

- **REQUIRED**：如果当前存在事务，则加入该事务；如果当前没有事务，则新建一个事务。这是默认的传播行为。

- **SUPPORTS**：支持当前事务，如果当前没有事务，则以非事务的方式执行。

- **MANDATORY**：强制要求存在当前事务，如果当前没有事务，则抛出异常。

- **REQUIRES_NEW**：每次都会新建一个事务，如果当前存在事务，则将当前事务挂起。

- **NOT_SUPPORTED**：以非事务方式执行操作，如果当前存在事务，则将当前事务挂起。

- **NEVER**：以非事务方式执行操作，如果当前存在事务，则抛出异常。

- **NESTED**：如果当前存在事务，则在嵌套事务内执行，如果当前没有事务，则新建一个事务。嵌套事务可以独立提交或回滚，也可以由外部事务一起提交或回滚。

这些事务传播行为可以通过在 @Transactional 注解中设置 propagation 属性来指定。例如：

```java
@Transactional(propagation = Propagation.REQUIRED)
public void doSomething() {
    // 方法体
}
```

这里 Propagation.REQUIRED 指定了事务传播行为为 REQUIRED。根据不同的业务场景，你可以选择合适的事务传播行为来控制事务的行为。

## 事务的隔离级别有哪些

数据库事务的隔离级别定义了在多线程或多用户环境下的事务之间如何隔绝彼此的操作，以防止并发问题。四种主要的事务隔离级别按照从低到高安全性的顺序如下：

1. **读未提交（Read Uncommitted）**
   - **说明**：事务可以读取到其他事务未提交的数据。
   - **优点**：并发性能高，因为事务间几乎没有等待。
   - **缺点**：可能出现脏读（Dirty Read）、不可重复读（Non-repeatable Read）和幻读（Phantom Read）的问题。
2. **读已提交（Read Committed）**
   - **说明**：事务只能读取到其他事务已经提交的数据。
   - **优点**：避免了脏读问题，提高了数据的一致性。
   - **缺点**：仍然可能遇到不可重复读和幻读问题。
3. **可重复读（Repeatable Read）**
   - **说明**：在一个事务内，多次读取同一数据的结果是一致的，不会受到其他事务的影响。即使其他事务提交了更新。
   - **优点**：解决了不可重复读的问题。
   - **缺点**：仍可能遇到幻读问题，在某些数据库系统中（如MySQL的InnoDB引擎），通过Next-Key Locks机制可以避免幻读。
4. **串行化（Serializable）**
   - **说明**：最严格的隔离级别，通过完全序列化事务的执行，避免了脏读、不可重复读和幻读的所有问题。
   - **优点**：提供了最高的数据一致性。
   - **缺点**：并发性能极低，因为事务通常是串行执行的，等待时间长。

选择适当的隔离级别需要权衡事务的隔离性和并发性能。通常，应用程序会根据业务需求和数据敏感性选择合适的隔离级别，以达到既保证数据一致性又维持良好性能的目的

## Java 什么操作可以多线程共享一块内存

在 Java 中，可以使用多线程共享一块内存的方式主要有两种：

1. **共享对象引用**：多个线程可以同时访问和修改同一个对象的状态。通过共享对象引用，多个线程可以共享同一个对象的数据，并且可以通过对象的方法来修改数据。需要注意的是，如果多个线程同时修改同一个对象的状态，可能会导致线程安全问题，因此需要进行适当的同步操作，如使用 synchronized 关键字或者 Lock 接口进行同步。

2. **使用共享变量**：多个线程可以同时访问和修改同一个变量的值。通过共享变量，多个线程可以共享数据，并且可以直接对变量进行读写操作。需要注意的是，如果多个线程同时修改同一个变量的值，可能会导致竞态条件和数据不一致的问题，因此需要进行适当的同步操作，如使用 volatile 关键字或者 AtomicInteger 等线程安全的类来保证数据的一致性。

需要注意的是，多线程共享内存时可能会引发线程安全问题，如竞态条件、数据不一致等问题。因此，在设计多线程程序时，需要特别注意线程安全性，采取适当的同步措施来保护共享数据。

## Mysql 优化器原理 如何优化的 优化了什么

MySQL 优化器是 MySQL 数据库中的一个组件，负责根据用户提交的 SQL 查询语句生成最优的执行计划，以提高查询性能。优化器的主要目标是尽可能快地执行查询，减少资源消耗，提高系统的吞吐量和响应性。

MySQL 优化器通过以下几种方式来优化查询：

1. **查询重写（Query Rewriting）**：优化器会尝试对查询语句进行重写，以提高查询的性能。例如，它可能会对 WHERE 子句中的条件进行重排，以减少查询的数据量；或者将某些联接操作改写为更有效率的方式。

2. **索引选择（Index Selection）**：优化器会根据查询语句中的条件和排序要求选择最合适的索引来加速查询。它会分析表的索引统计信息，并根据查询条件的选择性、索引的覆盖度等因素来选择最佳的索引。

3. **连接方式选择（Join Type Selection）**：优化器会根据查询语句中的联接条件和表大小等因素选择最合适的连接方式。例如，它可能会选择使用 Nested Loop Join、Hash Join 或者 Sort Merge Join 等不同的连接算法。

4. **子查询优化（Subquery Optimization）**：优化器会尝试优化查询中的子查询，以减少子查询的执行次数或者将其转换为更高效的连接操作。

5. **执行计划估算（Cost Estimation）**：优化器会对多个可能的执行计划进行成本估算，并选择成本最低的执行计划作为最终执行计划。这通常涉及到对表大小、索引选择性、硬件资源等因素的估算。

通过这些优化技术，MySQL 优化器可以在保证查询语义不变的前提下，生成高效的执行计划，提高查询的性能。优化器的主要目标是减少查询的成本，包括 CPU 和 IO 资源的消耗，从而提高系统的整体性能。

MySQL 优化器在处理多列索引时通常遵循最左前缀匹配规则。这意味着当你使用一个多列索引进行查询时，MySQL 会尽可能地利用索引的最左前缀来执行查询，并且只有当查询中的列顺序与索引的最左前缀一致时，索引才能被有效利用。

例如，假设你有一个复合索引 (col1, col2, col3)，如果你的查询条件中只涉及到 col1，那么这个索引就能被用来加速查询；如果查询条件涉及到了 col1 和 col2，那么索引也能被用来加速查询；但如果查询条件中只涉及到了 col2 或者 col3，那么这个索引就无法被利用了。

最左前缀匹配规则对于 MySQL 优化器的性能优化是非常重要的，因为它可以帮助 MySQL 优化器选择合适的索引来加速查询，并避免不必要的索引扫描。但是需要注意的是，这种规则并不适用于所有情况，有时候需要根据具体的查询和索引情况进行优化。

## 以下 mysql 条件哪些会用到索引

创建表：

```mysql
CREATE TABLE `test_models` (
`id` INT(11) NOT NULL AUTO_INCREMENT,
 `a` INT(11) DEFAULT NULL,
 `b` INT(11) DEFAULT NULL,
 `c` INT(11) DEFAULT NULL,
 `d` INT(11) DEFAULT NULL,
 `e` INT(11) DEFAULT NULL,
 PRIMARY KEY (`id`),
 KEY `index_abc` (`a`,`b`,`c`)
);
```

1. AND 只要用到了最左侧a列，和顺序无关 都会使用 索引

   ```mysql
   // 使用索引 abc
   EXPLAIN SELECT * FROM test_models WHERE a = 1 AND b = 2 AND c = 3;
   // 使用索引 abc
   EXPLAIN SELECT * FROM test_models WHERE c = 1 AND b = 2 AND a = 3;
   // 使用索引 ab
   EXPLAIN SELECT * FROM test_models WHERE a = 1 AND b = 2;
   // 使用索引 a
   EXPLAIN SELECT * FROM test_models WHERE a = 1 AND c = 3;
   // 使用索引 a
   EXPLAIN SELECT * FROM test_models WHERE c = 1 AND a = 2;
   ```

2. 不包含最左侧 a 列 不使用索引

   ```mysql
   // 不使用索引
   EXPLAIN SELECT * FROM test_models WHERE c = 3;
   // 不使用索引
   EXPLAIN SELECT * FROM test_models WHERE b = 2;
   // 不使用索引
   EXPLAIN SELECT * FROM test_models WHERE b = 2 AND c = 3;
   // 不使用索引
   EXPLAIN SELECT * FROM test_models WHERE c = 1 AND b = 2;
   ```

3. OR 不使用索引  
   这个条件中也包含了AND和OR逻辑操作符。在大多数数据库系统中，OR操作符往往难以使用联合索引，因为它需要组合多个条件的结果。在这种情况下，数据库可能会选择使用最适合的单列索引，或者执行多个单列索引的合并操作，或者在没有适用的单列索引的情况下执行全表扫描

   ```mysql
   // 不使用索引
   EXPLAIN SELECT * FROM test_models WHERE a = 1 AND b = 2 OR c = 3;
   // 不使用索引
   EXPLAIN SELECT * FROM test_models WHERE a = 1 OR b = 2 AND c = 3;
   // 不使用索引
   EXPLAIN SELECT * FROM test_models WHERE a = 1 OR b = 2 OR c = 3;
   ```

4. 最左侧的'a'列 被大于，小于比较的 ，使用range索引

   ```mysql
   // 使用索引 a
   EXPLAIN SELECT * FROM test_models WHERE a > 1 AND b = 2 AND c = 3;
   // 使用索引 a
   EXPLAIN SELECT * FROM test_models WHERE a < 1 AND b =  2 AND c = 3;
   // 使用索引 a
   EXPLAIN SELECT * FROM test_models WHERE a > 1;
   // 使用索引 a
   EXPLAIN SELECT * FROM test_models WHERE a <> 1 AND b = 2 AND c = 3;
   ```

5. 最左侧a=某某，后面列大于小于无所谓，都使用索引（但后面必须 and and ）

   ```mysql
   // 使用索引 ab
   EXPLAIN SELECT * FROM test_models WHERE a = 1 AND b < 2 AND c = 3;
   // 使用索引 ab
   EXPLAIN SELECT * FROM test_models WHERE a = 1 AND c = 2 AND b < 3;
   // 使用索引 ab
   EXPLAIN SELECT * FROM test_models WHERE a = 1 AND b < 2;
   // 使用索引 ab
   EXPLAIN SELECT * FROM test_models WHERE a = 1 AND b <> 2 AND c = 3;
   // 不使用索引
   EXPLAIN SELECT * FROM test_models WHERE a = 1 AND b < 2 OR c = 2;
   ```

6. ORDER BY  
   a = 某，后面order 无所谓 都 使用索引 （和最上面的最左匹配一样）

   ```mysql
   // 使用索引 abc
   EXPLAIN SELECT * FROM test_models WHERE a = 1 AND b = 2 AND c = 3 ORDER BY a;
   // 使用索引 a
   EXPLAIN SELECT * FROM test_models WHERE a = 1 ORDER BY a;
   // 使用索引 a
   EXPLAIN SELECT * FROM test_models WHERE a = 1 ORDER BY b;
   // 使用索引 a
   EXPLAIN SELECT * FROM test_models WHERE a = 1 ORDER BY c;
   // 不使用索引
   EXPLAIN SELECT * FROM test_models WHERE b = 1 order by a;
   ```

7. MySQL联合索引遵循最左前缀匹配规则，即从联合索引的最左列开始向右匹配，直到遇到匹配终止条件。例如联合索引(col1, col2, col3), where条件为col1=a AND col2=b可命中该联合索引的(col1,col2)前缀部分, where条件为col2=b AND col3=c不符合最左前缀匹配，不能命中该联合索引。

8. 匹配终止条件为范围操作符(如>, <, between, like等)或函数等不能应用索引的情况。例如联合索引(col1, col2, col3), where条件为col1=a AND col2>1 AND col3=c, 在col2列上为范围查询，匹配即终止，只会匹配到(col1, col2)，不能匹配到(col1, col2, col3).

9. where条件中的顺序不影响索引命中。例如联合索引(col1, col2, col3), where条件为col3=c AND col2=b AND col1=a, MySQL优化器会自行进行优化，可命中联合索引(col1, col2, col3).

## 10000 取最大 10 个数 用什么算法最好

从10000个数中找出最大的10个数，可以采用多种算法，其中一些更高效的方法包括：

1. 堆排序法：
   - 使用一个小顶堆（min-heap），初始时堆的大小为10，将前10个数构建为小顶堆。
   - 遍历剩余的数，如果当前数大于堆顶的最小元素，就将堆顶元素替换为当前数，并调整堆以保持堆的性质。
   - 最终堆中保存的就是最大的10个数。
   - 时间复杂度为O(n log k)，空间复杂度为O(k)。
2. 快速选择法：
   - 基于快速排序的分区操作，但只需要找到第k小的元素，而不是完全排序。
   - 通过随机选取一个基准值，将数组分为小于和大于基准的两部分，根据k与基准位置的关系，决定在哪一侧继续查找。
   - 重复此过程直到找到第k小的元素。
   - 平均时间复杂度为O(n)，最坏情况为O(n^2)，但可以通过随机化基准选择来避免最坏情况。
3. 计数排序法（非适用）：
   - 计数排序通常用于非负整数且范围较小的情况，不适用于找出最大的10个数，因为它不是基于比较的排序。
4. 优先队列（堆）：
   - 使用一个大小为10的优先队列（大顶堆），每次插入新元素时，如果队列已满，则替换队列顶的最大元素。
   - 这种方法在Java中可以使用PriorityQueue实现。
   - 时间复杂度为O(n log k)，空间复杂度为O(k)。
5. 分治法或随机化算法：
   - 对数据集进行随机划分，例如分成10个子集，每个子集1000个数。
   - 在每个子集中找出最大的数，然后对这10个数再进行一次上述的堆排序或快速选择，得到最大的10个数。
   - 这种方法可以并行化处理，适合大数据量的情况。
   - 时间复杂度取决于具体实现，但可以优于线性扫描。  
     在实际应用中，如果内存允许，优先考虑堆排序法和优先队列，因为它们在保证效率的同时，空间复杂度较低。如果需要节省空间，可以考虑快速选择法，特别是对于大规模数据且不需要存储所有元素时。

## Arraylist 是不是线程安全的 哪些是线程安全的

ArrayList 不是线程安全的，它是 Java 中的一种动态数组实现，不同步多线程访问时可能会导致不确定的结果或者异常。如果需要在多线程环境下使用列表，应该使用线程安全的集合类。

Java 提供了几种线程安全的集合类，其中常用的有：

- **Vector**：Vector 是一个同步的动态数组实现，它的所有方法都使用 synchronized 关键字进行了同步，因此是线程安全的。但是由于同步的开销，性能可能不如 ArrayList。

- **Collections.synchronizedList**：Collections 类提供了一个静态方法 synchronizedList，可以将任何普通的 List 转换为线程安全的 List。例如：

  ```java
  List<String> synchronizedList = Collections.synchronizedList(new ArrayList<>());
  ```

  使用这种方式，可以获得一个线程安全的 List，但是要注意，虽然它是线程安全的，但在对 List 进行遍历等操作时，仍然需要手动进行同步。

- **CopyOnWriteArrayList**：CopyOnWriteArrayList 是一个线程安全的并发集合类，它通过在写入操作时创建一个新的拷贝来保证线程安全性，因此读取操作不会受到写入操作的影响。它适用于读操作远远多于写操作的场景。

总的来说，如果在多线程环境下需要使用列表，推荐使用线程安全的集合类，以避免线程安全问题。具体选择哪种线程安全集合类取决于应用程序的需求和性能要求。

## stw 是什么 哪个垃圾回收器 是 stw 时间最少的

STW (Stop-The-World) 是垃圾回收（GC）过程中一个关键概念。在垃圾回收过程中，所有应用程序线程都会暂停，只有垃圾回收线程在运行。这种暂停称为 STW 事件。STW 事件的持续时间是影响应用程序性能的重要因素，因为在 STW 期间，应用程序无法继续处理请求或执行任务。

在 Java 虚拟机（JVM）中，不同的垃圾回收器有不同的 STW 时间特性。下面是几种常见的垃圾回收器及其 STW 时间特性：

1. Serial GC
   - 特点：适用于单线程环境。
   - STW 时间：通常较长，因为垃圾回收是单线程执行的。
2. Parallel GC (Parallel Scavenge)
   - 特点：使用多线程进行垃圾回收。
   - STW 时间：较短于 Serial GC，但在较大的堆内存下，STW 时间可能会显著增加。
3. CMS (Concurrent Mark-Sweep)
   - 特点：尝试并发执行垃圾回收以减少 STW 时间。
   - STW 时间：相对较短，但有时会出现"concurrent mode failure"，导致长时间的 STW。
4. G1 (Garbage-First)
   - 特点：设计用于大堆内存，尽量减少 STW 时间。
   - STW 时间：通过区域化垃圾回收和预测性模型，STW 时间通常较短且可控。
5. ZGC (Z Garbage Collector)
   - 特点：专为低延迟设计，支持超大堆内存（TB 级）。
   - STW 时间：非常短，通常在 10 毫秒以下，甚至可以达到微秒级别。
6. Shenandoah GC
   - 特点：类似于 ZGC，专为低延迟设计。
   - STW 时间：非常短，与 ZGC 类似，通常在毫秒级。

### 哪个垃圾回收器 STW 时间最少？

目前，ZGC 和 Shenandoah GC 是 STW 时间最短的垃圾回收器。它们都是为低延迟应用而设计的，能够将 STW 事件时间控制在非常短的范围内，通常在毫秒级甚至微秒级。

1. ZGC (Z Garbage Collector)
   - 特点：支持多 TB 级的堆内存，STW 时间通常在 10 毫秒以下。
   - 适用场景：需要超低延迟的应用，如实时交易系统、大数据处理等。
2. Shenandoah GC
   - 特点：类似于 ZGC，专为低延迟设计，STW 时间通常在毫秒级。
   - 适用场景：低延迟要求的应用，如响应时间敏感的服务。

### 如何选择垃圾回收器？

选择垃圾回收器时，应根据应用程序的具体需求来决定：

- **低延迟要求**：ZGC 或 Shenandoah GC 是最佳选择。
- **高吞吐量要求**：Parallel GC 或 G1 GC 可能更合适。
- **内存使用情况**：考虑堆内存大小，选择适当的垃圾回收器。

例如，在配置 JVM 选项时，可以使用以下命令来选择垃圾回收器：

```shell
# 使用 ZGC
java -XX:+UseZGC -jar your-application.jar

# 使用 Shenandoah GC
java -XX:+UseShenandoahGC -jar your-application.jar
```

总之，选择合适的垃圾回收器需要考虑应用的性能需求、延迟要求和堆内存大小等因素。ZGC 和 Shenandoah GC 是目前 STW 时间最短的垃圾回收器，非常适合对延迟敏感的应用。

## 以下内存是如何进行分配的 String s = new String（"12"）string s = "12"

在 Java 中，内存分配和字符串处理涉及一些细微的差别，特别是当你通过不同的方式创建字符串对象时。让我们详细分析两种不同的字符串创建方式的内存分配过程：

### String s = new String("12")

这种方式显式地创建一个新的 String 对象。

1. 常量池查找：
   - 首先，Java 编译器会在常量池中查找是否有值为 "12" 的字符串。
   - 如果常量池中没有值为 "12" 的字符串，则在编译时会在常量池中添加该字符串。
2. 堆内存分配：

   - 然后，在运行时，会使用 new 关键字在堆内存中创建一个新的 String 对象。
   - 这个新的 String 对象会引用常量池中的 "12"。

   代码的内存分配流程如下：

   - 常量池中已有或添加了一个 "12" 字符串对象。
   - 堆内存中创建一个新的 String 对象，该对象引用常量池中的 "12"。

### String s = "12"

这种方式是直接使用字符串字面量。

1. 常量池查找：

   - 编译器会在常量池中查找是否有值为 "12" 的字符串。
   - 如果常量池中没有值为 "12" 的字符串，则在编译时会在常量池中添加该字符串。

2. 引用常量池：

   - 运行时，变量 s 会直接引用常量池中的 "12"。

   代码的内存分配流程如下：

   - 常量池中已有或添加了一个 "12" 字符串对象。
   - 变量 s 引用常量池中的这个字符串对象。

### 对比分析

- 内存消耗：
  - String s = new String("12"); 会在堆内存中创建一个新的 String 对象，这个对象会引用常量池中的 "12"，因此总共会有两个 String 对象（一个在常量池中，一个在堆中）。
  - String s = "12"; 只会使用常量池中的字符串对象，因此只有一个 String 对象。
- 性能：
  - String s = new String("12"); 创建新的对象会比直接使用常量池中的对象稍慢，因为它涉及堆内存分配。
  - String s = "12"; 更高效，因为它直接引用常量池中的对象，没有额外的对象创建开销。

### 代码示例

```java
public class StringExample {
    public static void main(String[] args) {
        // 方式 1：在堆中创建一个新的字符串对象
        String s1 = new String("12");

        // 方式 2：直接引用常量池中的字符串对象
        String s2 = "12";

        // 比较引用
        System.out.println(s1 == s2); // 输出 false，因为 s1 和 s2 引用不同的对象
        System.out.println(s1.equals(s2)); // 输出 true，因为 s1 和 s2 的内容相同
    }
}
```

在这个例子中，s1 和 s2 内容相同，但它们引用不同的对象，因为 s1 是一个新的 String 对象，而 s2 是常量池中的对象。

### 总结来说

- 使用 new String("12") 会在堆内存中创建一个新的对象，同时常量池中也会有一个 "12" 字符串对象。
- 使用 String s = "12"; 只会在常量池中有一个 "12" 字符串对象。

## Nacos 注册中心是 ap 还是 cp ，能否 从 ap 切换为 cp

Nacos 注册中心默认是 AP（可用性和分区容错性）设计的。这意味着在网络分区的情况下，Nacos 优先保证系统的可用性，而在极端情况下可能会牺牲一致性。例如，在网络分区发生时，Nacos 可能会允许不同的节点继续服务请求，即使这些节点之间的数据可能不一致。

Nacos 是一个开源的注册中心和配置中心，它旨在提供服务发现、服务注册、服务健康检查和动态配置管理等功能。Nacos 的设计目标是为了在分布式系统中提供高可用性和可扩展性，因此它更偏向于保证系统的可用性和分区容错性。

在分布式系统中，服务注册中心扮演着关键的角色，它需要保证服务的高可用性，即使发生网络分区也能继续提供服务注册和发现的功能。因此，Nacos 更注重保证系统在分区容错的情况下仍然能够保持可用性，而对一致性要求相对较低。

当然，Nacos 也提供了一些配置选项和策略，以便用户根据自己的需求进行配置和调整。

### 从 AP 切换为 CP

1. 内置模式调整:
   - Nacos 1.x 版本在 standalone 模式下提供了 CP 模式，但是这个模式主要是为了在单节点情况下提供数据一致性。在集群模式下，Nacos 主要是基于 AP 模式的设计。
2. 基于 Raft 协议的 CP 模式:
   - 从 Nacos 2.x 版本开始，Nacos 引入了基于 Raft 协议的 CP 模式。Raft 是一种一致性协议，它在网络分区时优先保证一致性，但可能会影响系统的可用性。

### 如何切换到 CP 模式

如果你使用的是 Nacos 2.x 版本，可以通过以下步骤切换到 CP 模式：

1. 配置 Nacos:  
   在 Nacos 配置文件 application.properties 或 application.yml 中，设置 nacos.naming.data.consistency 参数为 cp。

   ```yaml
   nacos:
   naming:
     data:
     consistency: cp
   ```

2. 启动 Nacos:

   确保所有 Nacos 节点都应用了上述配置，并重新启动所有节点。

### 注意事项

- **性能影响**: CP 模式下，服务注册和发现的性能可能会受到影响，因为它需要在多数节点之间达成一致。
- **故障容忍性**: 在 CP 模式下，如果多个节点出现故障，可能会影响系统的可用性，因为系统会优先保证数据一致性。
- **适用场景**: 如果你的系统对数据一致性要求极高，并且可以容忍一定程度的可用性降低，那么可以考虑使用 CP 模式。

### Nacos示例

假设你正在配置一个三节点的 Nacos 集群，并希望使用 CP 模式：

1. 编辑每个节点的配置文件:  
   在 application.properties 或 application.yml 中添加：

   ```yaml
   nacos:
   naming:
     data:
     consistency: cp
   ```

2. 重启集群:

   确保所有节点都使用相同的配置，然后重新启动所有节点。

通过以上步骤，你可以将 Nacos 从 AP 模式切换到 CP 模式，以满足不同的分布式系统需求。

总的来说，虽然 Nacos 默认是 AP 设计的，但在一些特定场景下，你可以通过适当的配置和架构设计来使其更接近 CP 设计。但需要注意的是，增加一致性往往会降低系统的可用性，因此需要权衡设计的各种因素。

## 拦截器和过滤器的区别拦截器具体实现类是什么

拦截器（Interceptor）和过滤器（Filter）是Java Web开发中用于对请求和响应进行预处理和后处理的两种机制。它们虽然在功能上有些重叠，但在实现原理、使用方式和应用场景上有所不同。

### 拦截器（Interceptor）

#### 拦截器特点

1. **层级**：拦截器是在框架层面上进行的，通常在MVC框架（如Spring MVC）中使用。
2. **范围**：拦截器可以对Controller层的方法调用进行拦截。
3. **工作流程**：拦截器在请求进入Controller之前进行处理，可以在请求处理之前和之后执行特定的操作。
4. **配置**：拦截器通常通过配置文件或注解进行配置。
5. **实现**：拦截器通常实现特定框架提供的接口，例如在Spring MVC中实现`HandlerInterceptor`接口。

#### 拦截器具体实现类

在Spring MVC中，一个简单的拦截器实现示例如下：

```java
import org.springframework.web.servlet.HandlerInterceptor;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class MyInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // 在请求处理之前执行的逻辑
        return true; // 返回true继续执行后续处理，返回false中止请求
    }

    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) throws Exception {
        // 在请求处理之后但在视图渲染之前执行的逻辑
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        // 在整个请求结束之后，通常用于资源清理
    }
}
```

### 过滤器（Filter）

#### 过滤器特点

1. **层级**：过滤器是在Servlet规范层面上的，属于Servlet容器。
2. **范围**：过滤器可以对所有进入容器的请求和响应进行过滤。
3. **工作流程**：过滤器在请求到达Servlet之前进行处理，可以对请求和响应进行修改。
4. **配置**：过滤器通过在`web.xml`中配置或通过注解（如`@WebFilter`）进行配置。
5. **实现**：过滤器需要实现`javax.servlet.Filter`接口。

#### 过滤器具体实现类

一个简单的过滤器实现示例如下：

```java
import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import java.io.IOException;

public class MyFilter implements Filter {

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        // 初始化配置
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        // 在请求处理之前执行的逻辑
        chain.doFilter(request, response); // 继续执行后续处理
        // 在请求处理之后执行的逻辑
    }

    @Override
    public void destroy() {
        // 资源清理
    }
}
```

### 区别总结

- **拦截器**在更高的框架层面工作，主要用于对Controller的请求进行处理，依赖于特定的框架（如Spring MVC）。
- **过滤器**在Servlet容器层面工作，可以对所有进入容器的请求和响应进行处理，与具体的框架无关。

## 线程池有几种实现方法具体参数是什么

在Java中，线程池是通过`java.util.concurrent`包中的`Executor`框架实现的。`Executor`框架提供了多种线程池的实现，每种线程池都有不同的参数和用途。以下是几种常见的线程池实现及其具体参数：

### 1. `ThreadPoolExecutor`

这是最灵活和强大的线程池实现，可以通过构造函数来设置各种参数。

#### 构造函数参数

```java
public ThreadPoolExecutor(int corePoolSize,
                          int maximumPoolSize,
                          long keepAliveTime,
                          TimeUnit unit,
                          BlockingQueue<Runnable> workQueue,
                          ThreadFactory threadFactory,
                          RejectedExecutionHandler handler)
```

- `corePoolSize`：核心线程数，即使在空闲时也会保留在线程池中的线程数。
- `maximumPoolSize`：线程池允许的最大线程数。
- `keepAliveTime`：当线程数超过核心线程数时，多余的空闲线程存活的时间。
- `unit`：`keepAliveTime`的时间单位。
- `workQueue`：用于存放等待执行任务的队列。
- `threadFactory`：用于创建新线程的工厂。
- `handler`：用于处理任务拒绝的策略。

#### 线程池示例

```java
ThreadPoolExecutor executor = new ThreadPoolExecutor(
    5,                   // corePoolSize
    10,                  // maximumPoolSize
    60,                  // keepAliveTime
    TimeUnit.SECONDS,    // unit
    new LinkedBlockingQueue<Runnable>(), // workQueue
    Executors.defaultThreadFactory(),    // threadFactory
    new ThreadPoolExecutor.AbortPolicy() // handler
);
```

### 2. `Executors`工厂方法

`Executors`类提供了几种便捷的工厂方法来创建常用的线程池。

#### 2.1. `newFixedThreadPool(int nThreads)`

创建一个固定大小的线程池。

#### 固定大小线程池示例

```java
ExecutorService fixedThreadPool = Executors.newFixedThreadPool(5);
```

#### 2.2. `newCachedThreadPool()`

创建一个可缓存的线程池，如果线程池长度超过处理需求，可灵活回收空闲线程，若无可回收线程则新建线程。

#### 可缓存线程池示例

```java
ExecutorService cachedThreadPool = Executors.newCachedThreadPool();
```

#### 2.3. `newSingleThreadExecutor()`

创建一个单线程的线程池，它会确保所有任务按照指定的顺序（FIFO, LIFO, 优先级）执行。

#### 单线程线程池示例

```java
ExecutorService singleThreadExecutor = Executors.newSingleThreadExecutor();
```

#### 2.4. `newScheduledThreadPool(int corePoolSize)`

创建一个支持定时及周期性任务执行的线程池。

#### 周期性线程池示例

```java
ScheduledExecutorService scheduledThreadPool = Executors.newScheduledThreadPool(5);
```

### 3. 参数解释和选择

- **`corePoolSize`和`maximumPoolSize`**：决定线程池在不同负载下的行为。对于固定线程池，`corePoolSize`和`maximumPoolSize`是相同的；对于缓存线程池，`maximumPoolSize`是`Integer.MAX_VALUE`。
- **`keepAliveTime`和`unit`**：用于控制非核心线程的存活时间。
- **`workQueue`**：选择适当的队列类型（如`LinkedBlockingQueue`, `SynchronousQueue`）对任务的调度策略影响很大。
- **`threadFactory`**：允许自定义线程的创建方式，通常用于设置线程名称、优先级等。
- **`handler`**：当任务添加到线程池中被拒绝时的处理策略，如`AbortPolicy`, `CallerRunsPolicy`, `DiscardPolicy`, `DiscardOldestPolicy`。

通过合理设置这些参数，可以创建满足不同并发需求的线程池，实现高效的任务处理。

## threadlocal 是干嘛的如何实现的

`ThreadLocal` 是 Java 中的一种机制，允许你为每个线程创建独立的变量副本。这些变量副本对每个线程是隔离的，因此一个线程无法访问另一个线程的`ThreadLocal`变量。`ThreadLocal`常用于在多线程环境中存储不希望被共享的线程局部变量，例如用户会话、数据库连接等。

### `ThreadLocal`的用途

1. **线程安全**：避免多个线程访问共享变量导致的数据不一致和并发问题。
2. **状态隔离**：为每个线程提供独立的变量副本，避免不同线程间的相互干扰。
3. **简化代码**：简化了线程安全类的实现，无需显式使用锁机制。

### `ThreadLocal`的实现

使用`ThreadLocal`非常简单，主要包括以下几个步骤：

1. **创建`ThreadLocal`实例**：

   ```java
   private static final ThreadLocal<SimpleDateFormat> dateFormatHolder =
       new ThreadLocal<SimpleDateFormat>() {
           @Override
           protected SimpleDateFormat initialValue() {
               return new SimpleDateFormat("dd-MM-yyyy");
           }
       };
   ```

2. **设置值**：

   ```java
   dateFormatHolder.set(new SimpleDateFormat("dd-MM-yyyy"));
   ```

3. **获取值**：

   ```java
   SimpleDateFormat dateFormat = dateFormatHolder.get();
   ```

4. **移除值**（推荐使用，以避免内存泄漏）：

   ```java
   dateFormatHolder.remove();
   ```

### 示例代码

以下是一个完整的示例，展示如何在多线程环境中使用`ThreadLocal`来存储和获取每个线程的独立变量：

```java
public class ThreadLocalExample {
    // 创建一个ThreadLocal变量，用于存储每个线程独立的SimpleDateFormat实例
    private static final ThreadLocal<SimpleDateFormat> dateFormatHolder =
        ThreadLocal.withInitial(() -> new SimpleDateFormat("dd-MM-yyyy"));

    public static void main(String[] args) throws InterruptedException {
        // 创建多个线程，并启动它们
        Thread t1 = new Thread(() -> printDate("Thread-1"));
        Thread t2 = new Thread(() -> printDate("Thread-2"));
        Thread t3 = new Thread(() -> printDate("Thread-3"));

        t1.start();
        t2.start();
        t3.start();

        // 等待所有线程执行完毕
        t1.join();
        t2.join();
        t3.join();
    }

    private static void printDate(String threadName) {
        // 获取当前线程的SimpleDateFormat实例
        SimpleDateFormat dateFormat = dateFormatHolder.get();
        Date now = new Date();
        // 打印当前线程的日期格式
        System.out.println(threadName + ": " + dateFormat.format(now));
        // 移除当前线程的ThreadLocal变量，防止内存泄漏
        dateFormatHolder.remove();
    }
}
```

在这个示例中，每个线程都会创建自己的`SimpleDateFormat`实例并进行日期格式化操作，互不干扰，确保了线程安全。

### `ThreadLocal`的工作原理

`ThreadLocal`的内部实现依赖于每个线程维护的一个`ThreadLocalMap`对象。每个`ThreadLocal`对象在`ThreadLocalMap`中都有一个独立的条目，该条目的键是`ThreadLocal`对象自身，值是实际的变量副本。

以下是`ThreadLocal`的工作流程：

1. **存储值**：当调用`ThreadLocal.set(T value)`方法时，当前线程的`ThreadLocalMap`会将`ThreadLocal`对象作为键，`value`作为值存储起来。
2. **获取值**：当调用`ThreadLocal.get()`方法时，当前线程的`ThreadLocalMap`会使用`ThreadLocal`对象作为键，查找对应的值并返回。
3. **初始化值**：如果在调用`ThreadLocal.get()`方法时当前线程的`ThreadLocalMap`中不存在对应的条目，会调用`initialValue()`方法来初始化值并存储。
4. **移除值**：调用`ThreadLocal.remove()`方法时，会从当前线程的`ThreadLocalMap`中移除对应的条目，以避免内存泄漏。

通过这种机制，`ThreadLocal`实现了每个线程独立的变量副本，确保了线程安全和数据隔离。

## mq 生产者具体参数是什么传参都有哪些

消息队列（Message Queue, MQ）生产者的具体参数和传参会因所使用的消息队列系统（如 Apache Kafka, RabbitMQ, Apache ActiveMQ 等）而有所不同。下面我将介绍几个常见消息队列系统的生产者参数和传参。

### Apache Kafka 生产者参数

在 Kafka 中，生产者参数可以通过 `Properties` 对象来配置，这些参数控制了消息发送的行为、性能和可靠性。

#### 常见参数

1. **`bootstrap.servers`**：Kafka 集群的地址，格式为 `host1:port1,host2:port2,…`。
2. **`key.serializer`**：键的序列化器类。
3. **`value.serializer`**：值的序列化器类。
4. **`acks`**：指定了生产者在收到服务器完成请求的确认之前发送的记录将被认为已发送的次数。
   - `acks=0`：生产者不会等待服务器的确认。
   - `acks=1`：leader 写入日志后即确认。
   - `acks=all`：所有同步副本确认。
5. **`retries`**：发送失败时重试的次数。
6. **`batch.size`**：生产者将尝试批量处理消息记录的大小，以字节为单位。
7. **`linger.ms`**：生产者在发送一批消息之前等待更多记录加入批次的时间。
8. **`buffer.memory`**：生产者用来缓冲等待发送到服务器的消息的内存总字节数。

#### Kafka示例代码

```java
Properties props = new Properties();
props.put("bootstrap.servers", "localhost:9092");
props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");
props.put("acks", "all");
props.put("retries", 3);
props.put("batch.size", 16384);
props.put("linger.ms", 1);
props.put("buffer.memory", 33554432);

KafkaProducer<String, String> producer = new KafkaProducer<>(props);

for (int i = 0; i < 100; i++) {
    producer.send(new ProducerRecord<String, String>("my-topic", Integer.toString(i), Integer.toString(i)));
}

producer.close();
```

### RabbitMQ 生产者参数

在 RabbitMQ 中，生产者使用的参数主要通过 AMQP 协议配置，并在发送消息时指定。

#### RabbitMQ常见参数

1. **`host`**：RabbitMQ 服务器的地址。
2. **`port`**：RabbitMQ 服务器的端口，默认 5672。
3. **`username`**：登录 RabbitMQ 的用户名。
4. **`password`**：登录 RabbitMQ 的密码。
5. **`virtualHost`**：虚拟主机。
6. **`exchange`**：交换机名称。
7. **`routingKey`**：路由键。
8. **`mandatory`**：如果为 true, 当 RabbitMQ 不能根据自身的 Exchange 类型和路由键找到一个符合条件的 Queue 时，会将消息返回给生产者。
9. **`immediate`**：已被弃用，不再推荐使用。

#### RabbitMQ示例代码

```java
ConnectionFactory factory = new ConnectionFactory();
factory.setHost("localhost");
factory.setPort(5672);
factory.setUsername("guest");
factory.setPassword("guest");

try (Connection connection = factory.newConnection();
     Channel channel = connection.createChannel()) {
    String exchangeName = "my-exchange";
    String routingKey = "my-routing-key";
    String message = "Hello, RabbitMQ!";

    channel.basicPublish(exchangeName, routingKey, null, message.getBytes("UTF-8"));
    System.out.println(" [x] Sent '" + message + "'");
}
```

### Apache ActiveMQ 生产者参数

在 ActiveMQ 中，生产者参数通过 JMS API 配置，通常在创建连接和会话时指定。

#### ActiveMQ常见参数

1. **`brokerURL`**：ActiveMQ Broker 的地址，例如 `tcp://localhost:61616`。
2. **`queueName`**：目标队列名称。
3. **`deliveryMode`**：消息的持久性（`DeliveryMode.NON_PERSISTENT` 或 `DeliveryMode.PERSISTENT`）。
4. **`priority`**：消息优先级。
5. **`timeToLive`**：消息过期时间。

#### ActiveMQ示例代码

```java
ActiveMQConnectionFactory connectionFactory = new ActiveMQConnectionFactory("tcp://localhost:61616");
Connection connection = connectionFactory.createConnection();
connection.start();

Session session = connection.createSession(false, Session.AUTO_ACKNOWLEDGE);
Destination destination = session.createQueue("my-queue");

MessageProducer producer = session.createProducer(destination);
producer.setDeliveryMode(DeliveryMode.PERSISTENT);

TextMessage message = session.createTextMessage("Hello, ActiveMQ!");

producer.send(message);
System.out.println("Sent message: " + message.getText());

producer.close();
session.close();
connection.close();
```

这些是常见消息队列系统生产者的一些主要参数和使用示例。具体的参数配置可能会根据实际需求进行调整和优化。

## jwt是怎么实现的

JSON Web Token (JWT) 是一种基于 JSON 的开放标准（RFC 7519）用于在网络应用环境间传递声明。JWT 是一种紧凑的、URL 安全的方式，用于表示一组信息。它由三部分组成：头部（Header）、载荷（Payload）和签名（Signature）。以下是 JWT 的实现细节及其工作原理：

### JWT 组成部分

1. **Header**：头部通常包括两部分：令牌类型（即 JWT）和所使用的签名算法（如 HMAC SHA256 或 RSA）。

   ```json
   {
     "alg": "HS256",
     "typ": "JWT"
   }
   ```

2. **Payload**：载荷部分包含声明（claims）。声明是有关实体（通常是用户）及其他数据的声明。声明可以分为三类：

   - **Registered claims**：预定义的声明集，但不是强制的，例如 `iss`（发行者），`exp`（过期时间），`sub`（主题），`aud`（受众）。
   - **Public claims**：可以随意定义的声明，但为了避免冲突，应该在 IANA JSON Web Token Registry 或使用包含倒数域名的自定义名称空间中定义。
   - **Private claims**：自定义声明，通常是双方协商使用的声明。

   ```json
   {
     "sub": "1234567890",
     "name": "John Doe",
     "admin": true
   }
   ```

3. **Signature**：签名部分是通过将编码后的头部、编码后的载荷，以及一个密钥组合在一起，然后使用指定的签名算法生成的。

   ```java
   HMACSHA256(
     base64UrlEncode(header) + "." +
     base64UrlEncode(payload),
     secret)
   ```

### JWT 工作原理

1. **创建 JWT**：服务器在用户登录时验证用户身份，通过使用头部和载荷创建 JWT，然后用签名算法和密钥对其进行签名。生成的 JWT 令牌会返回给客户端。
2. **存储 JWT**：客户端将收到的 JWT 令牌存储在浏览器的 Local Storage 或 Cookie 中。
3. **发送 JWT**：客户端在每次请求时，将 JWT 令牌放在 HTTP 请求的 Authorization 头部中发送给服务器。

   ```java
   Authorization: Bearer <token>
   ```

4. **验证 JWT**：服务器接收到请求后，会验证 JWT 的签名和声明（例如过期时间）。如果验证通过，则处理请求；否则，返回401未授权状态。

### 实现 JWT 示例（Java）

以下是使用 Java 和 jjwt 库实现 JWT 的一个简单示例：

#### 依赖项（Maven）

```xml
<dependency>
  <groupId>io.jsonwebtoken</groupId>
  <artifactId>jjwt</artifactId>
  <version>0.9.1</version>
</dependency>
```

#### 创建 JWT

```java
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;

import java.util.Date;

public class JwtExample {
    private static final String SECRET_KEY = "mySecretKey";

    public static String createJwt(String id, String issuer, String subject, long ttlMillis) {
        long nowMillis = System.currentTimeMillis();
        Date now = new Date(nowMillis);

        // JWT 构建器
        return Jwts.builder()
                .setId(id)
                .setIssuedAt(now)
                .setSubject(subject)
                .setIssuer(issuer)
                .setExpiration(new Date(nowMillis + ttlMillis))
                .signWith(SignatureAlgorithm.HS256, SECRET_KEY)
                .compact();
    }

    public static void main(String[] args) {
        String jwt = createJwt("123", "issuer", "subject", 3600000);
        System.out.println("Generated JWT: " + jwt);
    }
}
```

#### 验证 JWT

```java
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;

public class JwtExample {
    private static final String SECRET_KEY = "mySecretKey";

    public static Claims decodeJwt(String jwt) {
        return Jwts.parser()
                .setSigningKey(SECRET_KEY)
                .parseClaimsJws(jwt)
                .getBody();
    }

    public static void main(String[] args) {
        String jwt = createJwt("123", "issuer", "subject", 3600000);
        System.out.println("Generated JWT: " + jwt);

        Claims claims = decodeJwt(jwt);
        System.out.println("ID: " + claims.getId());
        System.out.println("Subject: " + claims.getSubject());
        System.out.println("Issuer: " + claims.getIssuer());
        System.out.println("Expiration: " + claims.getExpiration());
    }
}
```

### 安全注意事项

1. **密钥管理**：密钥必须安全存储，不能硬编码在代码中，应使用环境变量或安全的配置管理工具。
2. **过期时间**：设置合理的过期时间，避免长期有效的令牌被滥用。
3. **HTTPS**：在传输 JWT 时，确保使用 HTTPS 以防止中间人攻击。

通过以上步骤，您可以在 Java 应用中实现 JWT 生成和验证机制。不同语言有不同的库和实现方式，但核心原理是一致的。

## 前后端怎么保证安全性

在前后端分离的架构中，保证安全性是一个综合性的任务，涉及到多种技术和最佳实践。以下是一些关键措施，以确保前后端通信的安全性。

### 1. 使用 HTTPS

确保所有通信使用 HTTPS 而不是 HTTP。HTTPS 加密数据传输，防止中间人攻击（MITM）和数据泄露。

### 2. 身份验证和授权

#### JWT（JSON Web Token）

1. **生成和验证 JWT**：

   - 在用户登录时生成 JWT，并将其返回给客户端。
   - 客户端将 JWT 存储在 `localStorage` 或 `sessionStorage` 中（请注意，不建议将敏感信息存储在 `localStorage` 中，因为它容易受到 XSS 攻击）。
   - 每次请求时，客户端在 HTTP 请求头中发送 JWT：

   ```htt
   Authorization: Bearer <token>
   ```

   - 服务器端验证 JWT 的签名和有效性。

2. **过期时间**：
   - 设置 JWT 的过期时间（例如 15 分钟），并使用刷新令牌机制来延长会话。

#### OAuth2

使用 OAuth2 进行授权，特别适用于涉及第三方服务的应用。OAuth2 提供了一种安全的方式来访问用户资源，而无需直接传递用户凭据。

### 3. CSRF 防护

Cross-Site Request Forgery（CSRF）是一种攻击方式，攻击者利用受害者的身份向服务器发送未经授权的请求。防护措施包括：

1. **CSRF 令牌**：

   - 服务器生成一个唯一的 CSRF 令牌，并在表单提交时包含此令牌。
   - 服务器验证此令牌，以确保请求的合法性。

2. **双重提交 Cookie**：
   - 服务器生成一个 CSRF 令牌，并将其放入 HTTP 头和 Cookie 中。
   - 客户端在每次请求时将此令牌从 Cookie 中提取，并在请求头中发送。
   - 服务器验证这两个令牌是否匹配。

### 4. 防止 XSS 攻击

Cross-Site Scripting（XSS）是一种攻击方式，攻击者注入恶意脚本到网页中。

1. **输入验证和输出编码**：

   - 对所有用户输入进行验证和清理，防止恶意代码注入。
   - 在输出时对数据进行编码，确保特殊字符不会被浏览器解释为代码。

2. **Content Security Policy (CSP)**：
   - 设置 CSP 头，限制可以执行的资源来源，从而防止恶意脚本的执行。

### 5. 防止 SQL 注入

SQL 注入是一种攻击方式，攻击者通过操纵 SQL 查询来访问或破坏数据库。

1. **使用参数化查询**：

   - 使用参数化查询或预处理语句，而不是直接拼接 SQL 字符串。

2. **ORM 框架**：
   - 使用 ORM 框架（如 Hibernate）来自动生成 SQL 语句，减少手动编写 SQL 的机会。

### 6. 安全 HTTP 头

使用安全相关的 HTTP 头可以进一步加强安全性。

1. **Strict-Transport-Security (HSTS)**：

   - 强制客户端（如浏览器）使用 HTTPS 访问资源，防止降级攻击。

2. **X-Content-Type-Options**：

   - 防止浏览器将响应内容类型从声明类型更改为其它类型，防止 MIME 类型混淆攻击。

3. **X-Frame-Options**：

   - 防止网站被嵌入到 `<iframe>` 中，防止点击劫持。

4. **X-XSS-Protection**：
   - 启用浏览器的 XSS 过滤器，防止某些类型的反射性 XSS 攻击。

### 7. 安全编码和框架配置

1. **使用最新版本的框架和库**：

   - 保持依赖项的更新，确保修复已知的安全漏洞。

2. **安全配置**：
   - 确保框架和服务器的安全配置，禁用不必要的功能和服务。

### 8. 定期安全审计和测试

1. **代码审计**：

   - 定期进行代码审计，识别和修复潜在的安全漏洞。

2. **渗透测试**：

   - 进行渗透测试，模拟攻击者的行为来发现系统的安全弱点。

3. **自动化安全扫描**：
   - 使用自动化工具进行安全扫描，发现和修复已知的安全问题。

通过综合采用上述措施，可以在前后端分离的架构中有效地提升安全性，保护应用和用户数据免受各种攻击和威胁。

## openfeign的实现原理如何实现的

## 分库分表如何实现如何进行优化如何确定分到哪张表

## mybatis和mybaits plus区别具体实现

## synchronized和lock的区别具体实现

在 Java 中，`synchronized` 和 `Lock` 是两种常用的并发控制机制，用于管理多线程对共享资源的访问。虽然它们都能实现线程同步，但它们在使用方式、功能和性能上有许多不同之处。

### synchronized

`synchronized` 是 Java 内置的同步机制，可以用来修饰方法或代码块，以确保同一时间只有一个线程可以执行被同步的代码。

#### synchronized特点

1. **内置于 Java 语言**：`synchronized` 是 Java 关键字，使用简单。
2. **自动释放锁**：当线程退出同步方法或同步代码块时，会自动释放锁。
3. **无法中断**：线程在等待获取 `synchronized` 锁时，不能被中断。
4. **锁范围**：可以是方法级别（实例方法或静态方法）或代码块级别。

#### synchronized示例代码

```java
public class SynchronizedExample {
    private int count = 0;

    public synchronized void increment() {
        count++;
    }

    public void incrementBlock() {
        synchronized (this) {
            count++;
        }
    }

    public synchronized int getCount() {
        return count;
    }
}
```

### Lock

`Lock` 是 Java 5 引入的 `java.util.concurrent.locks` 包中的一个接口，提供了比 `synchronized` 更灵活的锁机制。

#### Lock特点

1. **灵活性**：提供了比 `synchronized` 更加丰富的功能，如可中断的锁获取、超时获取锁、非块结构的锁释放等。
2. **需要手动释放锁**：必须显式调用 `unlock()` 方法来释放锁。
3. **可响应中断**：线程在等待获取锁时可以被中断。
4. **多种实现**：例如 `ReentrantLock`，支持公平锁和非公平锁。

#### Lock示例代码

```java
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

public class LockExample {
    private final Lock lock = new ReentrantLock();
    private int count = 0;

    public void increment() {
        lock.lock();
        try {
            count++;
        } finally {
            lock.unlock();
        }
    }

    public int getCount() {
        lock.lock();
        try {
            return count;
        } finally {
            lock.unlock();
        }
    }
}
```

### 具体实现细节

#### synchronized 实现

`sychronized` 关键字在 JVM 层面是通过 `monitorenter` 和 `monitorexit` 字节码指令实现的。每个对象都有一个监视器，当一个线程持有了对象的监视器时，其他线程只能等待。

#### Lock（以 ReentrantLock 为例）

`ReentrantLock` 是 `Lock` 的一个实现，提供了更高级的功能。它内部使用了 AQS（AbstractQueuedSynchronizer）来管理锁状态和线程队列。

##### 主要方法

1. **lock()**：获取锁，如果锁不可用，则当前线程将被禁用以进行线程调度，并处于休眠状态，直到锁被获取。
2. **tryLock()**：尝试获取锁，立即返回，如果锁不可用则返回 `false`。
3. **tryLock(long timeout, TimeUnit unit)**：在给定的等待时间内获取锁，如果锁不可用则等待指定时间，如果在超时之前获得锁，则返回 `true`，否则返回 `false`。
4. **lockInterruptibly()**：如果当前线程未被中断，则获取锁。如果锁可用，则获取锁，并立即返回。如果锁不可用，则禁用当前线程进行线程调度，并处于休眠状态，直到发生以下三种情况之一：
   - 锁由当前线程获得；
   - 其他某个线程中断当前线程；
   - 指定的等待时间过去。

##### Lock 示例代码

```java
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

public class LockExample {
    private final Lock lock = new ReentrantLock();
    private int count = 0;

    public void increment() {
        lock.lock();
        try {
            count++;
        } finally {
            lock.unlock();
        }
    }

    public int getCount() {
        lock.lock();
        try {
            return count;
        } finally {
            lock.unlock();
        }
    }

    public void tryIncrement() {
        if (lock.tryLock()) {
            try {
                count++;
            } finally {
                lock.unlock();
            }
        } else {
            System.out.println("Could not get the lock");
        }
    }
}
```

### 选择使用 synchronized 还是 Lock

1. **简单同步**：如果只需要简单的同步，`synchronized` 更加方便且性能较好。
2. **高级功能**：如果需要更高级的功能（如可中断锁获取、超时锁获取等），使用 `Lock` 会更合适。
3. **性能考虑**：在高并发环境下，`Lock` 可能会有更好的性能和扩展性，特别是使用 `ReentrantLock` 的公平锁机制，可以避免线程饥饿问题。

### 锁选择总结

`synchronized` 和 `Lock` 各有优劣，选择哪种机制取决于具体需求和应用场景。在需要简单、可靠的同步时，`synchronized` 是首选；在需要更灵活的锁控制或在复杂的并发场景中，`Lock`（尤其是 `ReentrantLock`）提供了更丰富的功能和更好的性能。

## 分布式锁是如何实现的具体实现是什么

分布式锁是一种在分布式系统中用于控制对共享资源的并发访问的机制。由于多个节点可能同时访问同一资源，因此需要一种机制来确保这些访问不会产生冲突。分布式锁的实现方式有多种，常见的方法包括基于数据库、Redis 和 Zookeeper 的实现。下面介绍几种常见的分布式锁的实现方法及其具体实现。

### 基于数据库的分布式锁

#### 方法一：使用数据库表

创建一个锁表，通过在该表中插入或删除特定记录来实现分布式锁。

#### 使用数据库表示例代码

```sql
CREATE TABLE distributed_lock (
    lock_name VARCHAR(255) PRIMARY KEY,
    lock_value VARCHAR(255)
);
```

```java
public class DatabaseLock {
    private static final String LOCK_NAME = "my_lock";
    private final DataSource dataSource;

    public DatabaseLock(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public boolean lock() {
        try (Connection connection = dataSource.getConnection()) {
            String sql = "INSERT INTO distributed_lock (lock_name, lock_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE lock_name=lock_name";
            try (PreparedStatement ps = connection.prepareStatement(sql)) {
                ps.setString(1, LOCK_NAME);
                ps.setString(2, UUID.randomUUID().toString());
                ps.executeUpdate();
                return true;
            }
        } catch (SQLException e) {
            return false;
        }
    }

    public void unlock() {
        try (Connection connection = dataSource.getConnection()) {
            String sql = "DELETE FROM distributed_lock WHERE lock_name = ?";
            try (PreparedStatement ps = connection.prepareStatement(sql)) {
                ps.setString(1, LOCK_NAME);
                ps.executeUpdate();
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}
```

### 基于 Redis 的分布式锁

Redis 提供了 `SET` 命令的扩展，可以使用 `NX`（不存在时设置）和 `EX`（过期时间）参数实现分布式锁。可以通过 `Redisson` 或手动实现 Redis 分布式锁。

#### 示例代码（手动实现）

```java
import redis.clients.jedis.Jedis;

public class RedisLock {
    private static final String LOCK_KEY = "distributed_lock";
    private static final int EXPIRE_TIME = 10; // seconds
    private final Jedis jedis;
    private String lockValue;

    public RedisLock(Jedis jedis) {
        this.jedis = jedis;
    }

    public boolean lock() {
        lockValue = UUID.randomUUID().toString();
        String result = jedis.set(LOCK_KEY, lockValue, "NX", "EX", EXPIRE_TIME);
        return "OK".equals(result);
    }

    public void unlock() {
        String value = jedis.get(LOCK_KEY);
        if (lockValue.equals(value)) {
            jedis.del(LOCK_KEY);
        }
    }
}
```

#### 示例代码（使用 Redisson）

```java
import org.redisson.Redisson;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.redisson.config.Config;

import java.util.concurrent.TimeUnit;

public class RedissonLock {
    private final RedissonClient redissonClient;
    private final RLock lock;

    public RedissonLock() {
        Config config = new Config();
        config.useSingleServer().setAddress("redis://127.0.0.1:6379");
        redissonClient = Redisson.create(config);
        lock = redissonClient.getLock("distributed_lock");
    }

    public boolean lock() {
        try {
            return lock.tryLock(100, 10, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            return false;
        }
    }

    public void unlock() {
        lock.unlock();
    }
}
```

### 基于 Zookeeper 的分布式锁

Zookeeper 可以通过创建临时有序节点实现分布式锁。Apache Curator 是一个 Zookeeper 客户端库，简化了分布式锁的实现。

#### 基于 Zookeeper 示例代码

```java
import org.apache.curator.framework.CuratorFramework;
import org.apache.curator.framework.recipes.locks.InterProcessMutex;
import org.apache.curator.retry.ExponentialBackoffRetry;
import org.apache.curator.framework.CuratorFrameworkFactory;

public class ZookeeperLock {
    private static final String ZK_ADDRESS = "127.0.0.1:2181";
    private static final String LOCK_PATH = "/distributed_lock";
    private final InterProcessMutex lock;
    private final CuratorFramework client;

    public ZookeeperLock() {
        client = CuratorFrameworkFactory.newClient(ZK_ADDRESS, new ExponentialBackoffRetry(1000, 3));
        client.start();
        lock = new InterProcessMutex(client, LOCK_PATH);
    }

    public boolean lock() {
        try {
            return lock.acquire(10, TimeUnit.SECONDS);
        } catch (Exception e) {
            return false;
        }
    }

    public void unlock() {
        try {
            lock.release();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

### 分布式锁总结

上述三种方法展示了在不同环境下实现分布式锁的具体实现方式：

1. **基于数据库**：简单但效率较低，适用于小规模分布式系统。
2. **基于 Redis**：性能好，使用方便，适用于大部分分布式系统。
3. **基于 Zookeeper**：提供强一致性和高可用性，适用于需要高可靠性的分布式系统。

选择合适的分布式锁实现方式取决于具体的应用场景和需求。

## 转发和重定向区别 session会不会失效如何保证失效

在 Web 开发中，转发（Forward）和重定向（Redirect）是两种常用的请求处理方式，它们在处理方式和应用场景上有显著区别。

### 转发（Forward）

转发是服务器端的操作，它将请求从一个 Servlet 或 JSP 转发到另一个 Servlet 或 JSP，整个过程发生在服务器端，浏览器不知道这次转发操作。

#### 转发特点

1. **URL 不变**：浏览器地址栏的 URL 不会发生变化。
2. **共享请求对象**：原始请求和响应对象在整个转发过程中共享，参数和属性可以传递。
3. **一次请求**：转发在同一次请求和响应的生命周期内完成。

#### 转发示例代码

```java
RequestDispatcher dispatcher = request.getRequestDispatcher("/anotherPage.jsp");
dispatcher.forward(request, response);
```

### 重定向（Redirect）

重定向是服务器通知浏览器重新发送一个新的请求，浏览器会根据服务器返回的重定向地址重新发起请求。

#### 重定向特点

1. **URL 改变**：浏览器地址栏的 URL 会变为重定向的地址。
2. **无法共享请求对象**：原始请求和响应对象在重定向后不再存在，无法传递参数和属性。
3. **两次请求**：重定向会导致两次请求和响应。

#### 重定向示例代码

```java
response.sendRedirect("anotherPage.jsp");
```

### Session 在转发和重定向中的表现

#### 转发中的 Session

在转发操作中，Session 不会失效。因为转发在同一次请求中处理，Session 信息保持不变。

#### 重定向中的 Session

在重定向操作中，Session 也不会失效。重定向虽然会产生新的请求，但同一个会话仍然存在，浏览器会自动携带原有的 Session ID，因此 Session 信息保持不变。

### 确保 Session 失效的方法

为了确保 Session 在适当的时候失效，可以采取以下几种方法：

1. **手动使 Session 失效**：  
   可以在特定操作（如用户注销）时手动使 Session 失效。

   ```java
   HttpSession session = request.getSession();
   session.invalidate();
   ```

2. **设置 Session 过期时间**：  
   可以在 web.xml 中配置 Session 过期时间。

   ```xml
   <session-config>
       <session-timeout>30</session-timeout> <!-- 单位为分钟 -->
   </session-config>
   ```

3. **配置 Session 过期时间**：  
   可以在代码中动态设置 Session 的过期时间。

   ```java
   HttpSession session = request.getSession();
   session.setMaxInactiveInterval(1800); // 单位为秒
   ```

4. **使用 Filter**：  
   通过过滤器检查 Session 状态，决定是否重定向到登录页面或进行其他处理。

   ```java
   import javax.servlet.*;
   import javax.servlet.http.HttpServletRequest;
   import javax.servlet.http.HttpServletResponse;
   import javax.servlet.http.HttpSession;
   import java.io.IOException;

   public class SessionFilter implements Filter {
       @Override
       public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
               throws IOException, ServletException {
           HttpServletRequest req = (HttpServletRequest) request;
           HttpServletResponse res = (HttpServletResponse) response;
           HttpSession session = req.getSession(false);

           if (session == null || session.getAttribute("user") == null) {
               res.sendRedirect(req.getContextPath() + "/login.jsp");
           } else {
               chain.doFilter(request, response);
           }
       }

       @Override
       public void init(FilterConfig filterConfig) throws ServletException { }

       @Override
       public void destroy() { }
   }
   ```

通过上述措施，可以有效管理和保证 Session 的有效性和失效，确保 Web 应用的安全性和用户体验。

## mybatis plus 如何操作更新创建人这些东西具体实现方法类

在使用 MyBatis-Plus 时，可以通过插件、拦截器和注解来自动处理字段的填充，例如更新和创建人、创建时间和更新时间等。MyBatis-Plus 提供了自动填充功能，通过实现`MetaObjectHandler`接口来实现自动填充功能。

以下是具体实现步骤：

### 1. 引入依赖

确保你的项目中已经引入了 MyBatis-Plus 依赖。以下是 Maven 依赖配置：

```xml
<dependency>
    <groupId>com.baomidou</groupId>
    <artifactId>mybatis-plus-boot-starter</artifactId>
    <version>3.4.3.4</version>
</dependency>
```

### 2. 配置自动填充处理器

创建一个类实现 `MetaObjectHandler` 接口，重写 `insertFill` 和 `updateFill` 方法来处理自动填充逻辑。

#### MetaObjectHandler 示例代码

```java
import com.baomidou.mybatisplus.core.handlers.MetaObjectHandler;
import org.apache.ibatis.reflection.MetaObject;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class MyMetaObjectHandler implements MetaObjectHandler {

    @Override
    public void insertFill(MetaObject metaObject) {
        // 自动填充创建时间和创建人
        this.setFieldValByName("createTime", LocalDateTime.now(), metaObject);
        this.setFieldValByName("createBy", getCurrentUser(), metaObject);
        // 如果更新人和更新时间也需要在插入时填充
        this.setFieldValByName("updateTime", LocalDateTime.now(), metaObject);
        this.setFieldValByName("updateBy", getCurrentUser(), metaObject);
    }

    @Override
    public void updateFill(MetaObject metaObject) {
        // 自动填充更新时间和更新人
        this.setFieldValByName("updateTime", LocalDateTime.now(), metaObject);
        this.setFieldValByName("updateBy", getCurrentUser(), metaObject);
    }

    // 获取当前用户的方法（需要自行实现）
    private String getCurrentUser() {
        // 示例：从安全上下文中获取当前用户名
        // return SecurityContextHolder.getContext().getAuthentication().getName();
        return "system"; // 示例返回固定值
    }
}
```

### 3. 在实体类中使用注解

在需要自动填充的字段上使用 `@TableField` 注解的 `fill` 属性来指定自动填充策略。

#### @TableField 示例代码

```java
import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import java.time.LocalDateTime;

@TableName("your_table_name")
public class YourEntity {

    @TableId
    private Long id;

    @TableField(fill = FieldFill.INSERT)
    private String createBy;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private String updateBy;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    // getters and setters
}
```

### 4. 配置 Spring Boot 配置类

确保你的 Spring Boot 配置类中扫描到 `MyMetaObjectHandler` 类。

#### 扫描 @MyMetaObjectHandler 示例代码

```java
import org.springframework.context.annotation.Configuration;
import org.mybatis.spring.annotation.MapperScan;

@Configuration
@MapperScan("com.yourpackage.mapper") // 替换为你的 Mapper 包路径
public class MyBatisPlusConfig {
    // 其他配置
}
```

### 5. 验证自动填充功能

现在，当你使用 MyBatis-Plus 执行插入或更新操作时，`createBy`、`createTime`、`updateBy` 和 `updateTime` 字段会自动填充，无需手动设置。

### 示例测试代码

```java
import com.yourpackage.entity.YourEntity;
import com.yourpackage.mapper.YourEntityMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class YourController {

    @Autowired
    private YourEntityMapper yourEntityMapper;

    @PostMapping("/testInsert")
    public void testInsert() {
        YourEntity entity = new YourEntity();
        // entity.setCreateBy("user1"); // 不需要手动设置
        // entity.setCreateTime(LocalDateTime.now()); // 不需要手动设置
        yourEntityMapper.insert(entity);
    }

    @PostMapping("/testUpdate")
    public void testUpdate() {
        YourEntity entity = yourEntityMapper.selectById(1L);
        entity.setSomeField("newValue");
        yourEntityMapper.updateById(entity);
    }
}
```

通过上述步骤，你可以在使用 MyBatis-Plus 时自动填充创建人和更新人等字段，简化开发并提高代码的可维护性。
