---
author: chou401
pubDatetime: 2024-01-30T12:28:25Z
modDatetime: 2024-05-17T11:16:49Z
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

- 监控工具：使用 RocketMQ 提供的监控工具（如 mqadmin 命令行工具）或阿里云控制台来检查 Broker 和 Topic 的消息状态，包括堆积数量、堆积时间等。
- 报警设置：配置告警规则，当消息堆积达到一定阈值时，自动触发报警通知。
- 性能优化：检查 Consumer 端的消费性能，优化消费逻辑，提高消费速度。  
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

1. 启用 Spring Cloud LoadBalancer：

   - 在项目中引入 Spring Cloud LoadBalancer 的依赖。
   - 配置 application.yml 或 application.properties 文件，启用 LoadBalancer：

   ```java
   spring:
    cloud:
      loadbalancer:
        enabled: true
   ```

2. 使用 FeignClient：

   - 定义 FeignClient 接口，并指定服务实例的名称，而不是具体的 URL。Spring Cloud LoadBalancer 将根据服务实例名称来选择一个可用的服务实例。

   ```java
   @FeignClient(name = "target-service")
   public interface TargetServiceClient {
       @GetMapping("/api")
       String getSomeData();
   }
   ```

3. Ribbon 集成（可选，适用于旧版）：

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

4. 配置负载均衡策略：
   - 如果需要自定义负载均衡策略，可以通过实现 org.springframework.cloud.loadbalancer.core.ServiceInstanceChooser 接口来自定义选择服务实例的方式。
5. 运行应用：
   - 启动应用，OpenFeign 会利用 Spring Cloud LoadBalancer 自动选择一个可用的服务实例进行请求，每次请求可能会选择不同的实例，从而实现负载均衡。
6. 失败重试：

   在 Spring Cloud LoadBalancer 中，失败重试功能是通过 Retry 实现的。Retry 是 Spring Cloud 提供的一个通用的重试机制，它能够在请求失败时自动地进行重试操作。Spring Cloud LoadBalancer 集成了 Retry，因此可以方便地在负载均衡器中实现失败重试功能。

   使用 Spring Cloud LoadBalancer 实现失败重试的步骤如下：

   - 配置 Retry：首先，需要在应用程序中配置 Retry 的相关参数，如重试次数、重试间隔等。可以通过 Spring Cloud 提供的 @LoadBalancerClient 注解或者配置文件来配置 Retry。

   - 启用 Retry：在使用 Spring Cloud LoadBalancer 时，需要启用 Retry 功能。可以通过配置文件或者 Spring Boot 配置属性来启用 Retry。

   - 触发重试：当发起请求时，如果请求失败了（如连接超时、服务不可用等），Spring Cloud LoadBalancer 会自动触发 Retry，尝试重新选择另一个可用的服务实例，并重新发送请求。Retry 会根据配置的重试策略进行重试，直到达到最大重试次数或者请求成功为止。

   通过以上步骤，可以在 Spring Cloud LoadBalancer 中实现失败重试功能。这样可以提高服务消费者对服务提供者的容错能力，增强系统的稳定性和可靠性。

请注意，从 Spring Cloud Hoxton 版本开始，推荐使用 Spring Cloud LoadBalancer 替换 Ribbon，因为它提供了更现代的负载均衡解决方案，并且与 Netflix Ribbon 不再有直接关联。

## Spring Cloud LoadBalancer 负载均衡 和 ribbon 负载均衡

Spring Cloud LoadBalancer 和 Ribbon 都是用于实现服务调用时的负载均衡，但它们在设计理念和使用上有一定的差异：

1. Ribbon：
   - 时代背景：Ribbon 是 Spring Cloud 的早期组件，主要用于 Netflix OSS 套件，它是一个客户端负载均衡器，主要配合 Eureka（服务注册与发现）使用。
   - 工作方式：Ribbon 是一个内嵌在客户端的库，它会拦截客户端的请求，根据预定义的策略（如轮询、随机等）选择一个服务实例进行请求。
   - 配置：Ribbon 需要在客户端代码中显式配置，例如通过 @FeignClient 注解中的配置类来指定负载均衡策略。
   - 局限性：Ribbon 的功能相对有限，没有提供对其他负载均衡策略的广泛支持，且不直接支持云原生服务发现（如 Kubernetes）。
2. Spring Cloud LoadBalancer：
   - 时代背景：随着云原生和 Kubernetes 的普及，Spring Cloud 社区推出了 LoadBalancer，它更加现代化，旨在支持多种云服务的负载均衡需求。
   - 工作方式：Spring Cloud LoadBalancer 是一个更抽象的层，它支持多种负载均衡实现，包括基于 Kubernetes 的服务发现。它通过 Spring 的 @LoadBalanced 注解与 RestTemplate 或 WebClient 结合使用，或者与 OpenFeign 结合。
   - 配置：LoadBalancer 通过 Spring Boot 的配置方式，不需要在客户端代码中进行过多的定制，它可以自动与服务发现组件（如 Eureka、Consul、Kubernetes 等）集成。
   - 优势：提供了更灵活的扩展性，支持更多负载均衡策略，更容易适应云环境的变化。  
     总结起来，Spring Cloud LoadBalancer 是 Ribbon 的替代品，它提供了更现代的解决方案，适应了云原生架构的需求，而 Ribbon 更多地适用于传统的 Netflix OSS 微服务架构。在新的项目中，推荐使用 Spring Cloud LoadBalancer，因为它有更好的可扩展性和与云环境的兼容性。

## OpenFeign 用到了哪些设计模式 重要

OpenFeign 在设计和实现中运用了多种设计模式，以下是其中一些主要的设计模式：

1. 代理模式（Proxy Pattern）：
   - OpenFeign 通过动态代理（JDK 动态代理或 CGLIB 动态代理）来创建实现了用户定义的 Feign 客户端接口的代理类。这样，开发者只需要定义接口并添加相应的注解，OpenFeign 就可以根据接口定义自动生成具体的 HTTP 请求代码。当调用代理对象的方法时，实际上是在执行实际的 HTTP 请求。
2. 工厂模式（Factory Pattern）：
   - OpenFeign 使用了工厂模式来创建和管理客户端接口的代理类。Feign.Builder 类可以看作是一个工厂，它允许配置各种组件，如解码器、编码器、拦截器等，然后创建一个具体的 Feign 实例。开发者无需手动创建代理类，而是通过工厂类来获取已经创建好的代理类。
3. 装饰器模式（Decorator Pattern）：
   - 通过装饰器模式，OpenFeign 允许用户在请求生命周期的不同阶段添加额外的行为，如添加请求头、日志记录等。这些行为可以通过实现接口并使用拦截器（RequestInterceptor 或 Client）来实现。通过添加各种注解来为客户端接口添加额外的功能，如负载均衡、重试、熔断等。
4. 策略模式（Strategy Pattern）：
   - OpenFeign 使用了策略模式来实现负载均衡和重试等功能。在 OpenFeign 中，可以通过配置和注解来选择具体的负载均衡策略和重试策略，从而实现不同的功能和行为。
5. 建造者模式（Builder Pattern）：
   - Feign.Builder 类使用了建造者模式，允许逐步构建 Feign 客户端实例，通过调用 optionals、encoder、decoder 等方法来定制配置。
6. 观察者模式（Observer Pattern）：
   - 虽然 OpenFeign 本身没有直接使用观察者模式，但你可以通过监听器（FeignContext 的事件）来实现类似的功能，例如在请求开始和结束时执行某些操作。一些组件（如 Spring Cloud LoadBalancer）可能使用了观察者模式来监听和响应状态变化。在负载均衡和服务发现等功能中，观察者模式可以用于监听服务实例的状态变化，并及时更新负载均衡策略。
7. 组件模式（Component Pattern）：
   - OpenFeign 的设计允许用户通过组件化的方式，将编码器、解码器、错误处理器等作为一个个独立的组件来组合和替换，以满足不同的需求。
8. 适配器模式（Adapter Pattern）：
   - 适配器模式可能体现在 OpenFeign 将 HTTP 请求转换为接口调用，以及将接口调用的结果转换为 HTTP 响应的过程中，适配不同的网络通信协议。  
     OpenFeign 的设计充分体现了面向接口编程和面向切面编程的思想，使得它能够灵活地扩展和适应不同的应用场景

## OpenFeign 动态代理做了什么

OpenFeign 的代理模式主要完成了以下操作：

1. 接口定义到HTTP请求映射：
   - 当你定义了一个带有 @FeignClient 注解的接口，并在其中声明了方法时，OpenFeign 会分析这些接口和方法上的注解（如 @GetMapping, @PostMapping 等），并将这些方法调用转换为对应的HTTP请求。
2. 动态生成代理类：
   - OpenFeign 使用 Java 动态代理技术，在运行时动态生成一个实现了你定义的接口的代理类。这个代理类会在调用接口方法时被创建，它不是在编译时静态生成的。
3. 请求参数处理：
   - 代理类在调用接口方法时，会收集方法的参数，并根据方法签名和注解信息，将这些参数转化为HTTP请求的各个部分，如URL路径参数、查询参数、请求体等。
4. 执行HTTP请求：
   - 生成的代理类会将组装好的HTTP请求交给底层的HTTP客户端（如Apache HttpClient, OkHttp等）去执行。这一过程包括建立连接、发送请求、接收响应等。
5. 响应结果处理：
   - 接收到HTTP响应后，代理类会进一步处理响应数据，根据方法的返回类型和声明的解码器（Decoder），将HTTP响应体转换为Java对象并返回给调用者。
6. 异常处理：
   - 如果在请求过程中发生任何错误（如网络错误、超时、HTTP错误状态码等），OpenFeign 会根据配置的错误处理器（ErrorDecoder）来处理这些异常，并可能抛出特定的异常给调用者。
7. 支持负载均衡和服务发现：
   - 在负载均衡和服务发现的场景下，代理类还负责选择合适的服务实例，并发送请求到选择的服务实例。代理类会根据负载均衡策略和服务发现机制来选择服务实例，并将请求转发到选中的服务实例上。  
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

在 Spring Cloud 的上下文中，"resource" 通常指的是资源的管理和配置，而不是一个具体的注解。在 Spring 框架中，@Resource 和 @Autowired 都是用来实现依赖注入的，但它们有一些区别：

1. 来源不同：
   - @Autowired 是 Spring 框架提供的注解，主要用于自动装配依赖，它基于类型匹配。
   - @Resource 实际上是 Java 标准注解（JSR-250），但 Spring 也支持它。@Resource 默认基于 Bean 的名称进行匹配，而不是类型。
2. 查找顺序：
   - @Autowired 首先尝试通过类型匹配找到唯一的 Bean 进行注入，如果存在多个相同类型的 Bean，则可以通过 @Qualifier 注解指定特定的 Bean 名称。
   - @Resource 则默认使用 Bean 的名称进行匹配，如果找不到匹配的名称，才会回退到类型匹配。
3. 注解参数：
   - @Autowired 只有一个 required 参数，用于设置是否必须自动装配（默认为 true，即如果找不到匹配的 Bean，会抛出异常）。
   - @Resource 可以通过 name 参数指定 Bean 的名称，如果没有指定，Spring 会使用注解的目标字段或方法名称作为 Bean 名称。
4. 用法：
   - @Autowired 支持字段、构造器、setter 方法的注入，以及方法参数的注入。
   - @Resource 通常更多用于字段和 setter 方法的注入，但在 Spring 4.3 之后，也可以用于方法参数注入。
5. 命名约定：
   - 如果 @Resource 的 name 属性没有设置，Spring 会尝试使用目标字段或方法的名称作为 Bean 的名称来查找。  
     在 Spring Cloud 中，虽然没有直接称为 "Spring Cloud Resource" 的概念，但资源管理可能涉及服务发现、配置中心（如 Spring Cloud Config）等组件，这些组件可能使用 @Autowired 注解来注入服务发现客户端、配置客户端等依赖。

## Seata 有几种模式 重要

Seata 是一个开源的分布式事务解决方案，它提供了多种模式来支持不同的分布式事务场景。目前，Seata 支持以下几种模式：

1. **AT 模式（AT mode）**：AT 模式是 Seata 的默认模式，也称为自动提交模式。在 AT 模式下，它通过两阶段提交（2PC）的方式实现分布式事务。在第一阶段，Seata 会记录下业务SQL和回滚SQL，然后执行业务操作。在第二阶段，根据第一阶段的结果决定是提交还是回滚这些SQL。AT 模式适用于已经具备了 ACID 特性的数据库。

2. **TCC 模式（TCC mode）**：TCC 模式是 Seata 支持的一种补偿型分布式事务模式。在 TCC 模式下，用户需要手动编写 Try、Confirm 和 Cancel 三个阶段的业务逻辑。Seata 将在执行每个阶段时，自动调用相应的业务逻辑。TCC 模式适用于业务逻辑可以分解为 Try、Confirm 和 Cancel 三个阶段的场景。

3. **SAGA 模式（Saga mode）**：Saga 模式是 Seata 支持的一种长事务模式。它将一个长事务分解为一系列短事务，每个短事务被称为一个Saga。在 Saga 模式下，业务逻辑被拆分成多个阶段，每个阶段都有一个与之对应的补偿操作。Seata 将会自动调度并执行各个阶段，如果某个阶段执行失败，则会触发相应的补偿操作。Saga 模式适用于需要长时间跨服务的业务逻辑。

4. **XA 模式（XA mode）**：XA 模式是 Seata 支持的一种基于 XA 协议的分布式事务模式。它定义了两阶段提交（2PC）的过程，允许跨多个资源管理器（如数据库和消息队列）的事务。在 XA 模式下，Seata 会与各个分支事务协调器进行交互，并与全局事务管理器一起，执行分布式事务的提交和回滚操作。XA 模式适用于需要跨多个数据库进行分布式事务的场景。

以上是 Seata 目前支持的几种模式，用户可以根据自身业务场景选择合适的模式来使用。

## ap 和 cp 为什么 p 是不可或缺的 重要

在分布式系统中，AP 和 CP 是 CAP 理论（Consistency, Availability, Partition Tolerance）的一部分。CAP 理论是分布式系统设计的基本原则，它指出在以下三个特性中，任何分布式系统都无法同时保证全部三项：

- 一致性（Consistency）：所有节点在同一时刻看到的数据是相同的，即一次写操作之后，所有读操作都应返回最新的写入值。
- 可用性（Availability）：系统对于每一个非故障节点的请求都能给出响应，即使这个响应不包含最新数据。
- 分区容错性（Partition Tolerance）：当网络分区发生时，系统仍然可以继续运行并处理请求。

"AP" 和 "CP" 是两种不同的一致性和可用性保证策略的代表。它们分别代表了分布式系统在出现网络分区（Partition）时，对一致性（Consistency）和可用性（Availability）的不同权衡。

1. **AP（可用性和分区容错性）**：AP 策略优先保证系统的可用性和分区容错性。即使发生了网络分区，系统仍然可以继续提供服务，尽管在分区后可能出现数据的不一致性。AP 系统通常允许部分节点或者服务在网络分区后继续提供服务，而不是停止整个系统的运行。这种策略适用于对系统的可用性要求比一致性要求更高的场景，例如互联网应用中的实时通信和在线游戏等。

2. **CP（一致性和分区容错性）**：CP 策略优先保证系统的一致性，即使在发生网络分区时也会暂时停止服务以确保数据的一致性。CP 系统会在发生网络分区时暂停部分或者全部服务，直到网络分区被解决并且数据恢复一致性。这种策略适用于对系统的一致性要求比可用性要求更高的场景，例如金融系统中的交易处理和数据存储等。

P（Partition Tolerance）之所以是不可或缺的，是因为在分布式系统中，网络延迟和通信故障是不可避免的。由于网络是分布式系统的基础，因此系统必须设计成即使在网络出现问题时也能继续工作。如果放弃分区容错性，意味着当网络分区发生时，系统将无法处理请求，这在大多数实际应用中是不可接受的。  
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

### 示例

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
