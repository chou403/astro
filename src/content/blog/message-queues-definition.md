---
author: chou401
pubDatetime: 2022-09-25T15:20:35Z
modDatetime: 2024-02-22T10:41:57Z
title: MQ
featured: true
draft: false
tags:
  - java
  - queue
description: 消息队列 & 常见的六种消息队列
---

## Table of contents

## 概述

![image-20230428172550591](https://github.com/chou401/pic-md/raw/master/img/image-20230428172550591.png)

### 介绍

消息队列是典型的：生产者、消费者模型。生产者不断向消息队列中生产消息，消费者不断的从队列中获取消息。因为消息的生产和消费都是异步的，而且只关心消息的发送和接收，没有业务逻辑的侵入，这样就实现了生产者和消费者的解耦。

本质上说消息队列就是一个队列结构的中间件，也就是说消息放入这个中间件之后就可以直接返回，并不需要系统立即处理，而另外会有一个程序读取这些数据，并按顺序进行逐次处理。

也就是说当你遇到一个并发特别大并且耗时特别长同时还不需要立即返回处理结果，使用消息队列可以解决这类问题。

消息队列主要解决了应用耦合、异步处理、流量削锋等问题。

当前使用较多的消息队列有 RabbitMQ、RocketMQ、ActiveMQ、Kafka、ZeroMQ、MetaMQ等，而部分数据库如 Redis、Mysql以及PhxSQL也可实现消息队列的功能。

### 应用场景

- **数据冗余：**比如订单系统，后续需要严格的进行数据转换和记录，消息队列可以把这些数据持久化的存储在队列中，然后有订单，后续处理程序进行获取，后续处理完之后在把这条记录进行删除来保证每一条记录都能够处理完成。
- **系统解耦：**使用消息系统之后，入队系统和出队系统是分开的，也就说只要一天崩溃了，不会影响另外一台系统正常运转。
- **流量削锋：**例如秒杀和抢购，我们可以配合缓存来使用消息队列，能够有效的顶住瞬间访问量，防止服务器承受不住导致崩溃。
- **异步通信：**消息本身使用入队之后可以直接返回。
- **扩展性：**例如订单队列，不仅可以处理订单，还可以给其他业务使用。
- **排序保证：**有些场景需要按照产品的顺序进行处理比如单进单出从而保证数据按照一定的顺序处理，使用消息队列是可以的。

以上都是消息队列常见的使用场景，消息队列只是一个中间件，可以配合其他产品进行使用。

- **消息通讯：**消息通讯是指，消息队列一般都内置了搞笑的通信机制，因此也可以用作消息通讯。比如实现点对点消息队列，或者聊天室等。

![image-20230428140353787](https://github.com/chou401/pic-md/raw/master/img/image-20230428140353787.png)

以上实际是消息队列的两种消息模式，点对点或发布订阅模式。

### 消息队列的缺点

- 降低系统的可用性：系统引入的外部依赖越多，越容易挂掉。
- 系统复杂度提高：使用MQ后可能需要保证消息没有被重复消费、处理消息丢失的情况、保证消息传递的顺序性等等问题。
- 一致性问题：A系统处理完了直接返回成功了，但问题是：要是B、C、D三个系统那里，B和D两个系统写库成功了，结果C系统写库失败了，就造成了数据不一致了。

### 如何保证消息队列的顺序性

- 生产者有序的情况下，单线程消费来保证消息的顺序性。
- 生产者无序的情况下，对消息进行编号，消费者处理时根据编号判断顺序。多个消费者，可以考虑增加分布式锁。

### 如何保证消息不被重复消费/如何保证消息的幂等性

- 生产者发送每条数据的时候，里面添加一个全局唯一的id，消费者消费到消息后，先根据消息id去redis中查询，如果redis不存在，就处理消息，然后将消息id写入redis。如果redis中存在，说明消息已经消费过，就不用处理。
- 基于数据库的唯一键，保证重复数据不会重复插入。因为有唯一键的约束，所以重复数据只会插入报错，不会导致数据库中出现脏数据。

### AMQP 和 JMS

#### AMQP

##### 简介

AMQP，即Advanced Message Queuing Protocol（高级消息队列协议），一个提供统一消息服务的应用层标准高级消息队列协议，是应用层协议的一个开放标准，为面向消息的中间件设计，基于此协议的客户端与消息中间件传递消息，不受客户端/中间件不同产品、不同开发语言等条件的限制。该协议是一种二进制协议，提供客户端应用于消息中间件之间异步、安全、高效的交互。相对于我们常见的REST API，AMQP更容易实现，可以降低开销，同时灵活性高，可以轻松的添加负载平衡和高可用性的功能，并保证消息传递，在性能上AMQP协议也相对更好一些。

通俗来说，在异步通讯中，消息不会立刻到达接收方，而是被存放到一个容器中，当满足一定的条件之后，消息会被容器发送给接收方，这个容器即消息队列，而完成这个功能需要双方和容器以及其中的各个组件遵守统一的约定和规则，AMQP就是这样的一种协议，消息发送与接收的双方遵守这个协议可以实现异步通讯。这个协议约定了消息的格式和工作方式。

##### 核心组成

- **消息（Message）**：即客户端与消息中间件传送的数据。
- **生产者（Producer）**：消息生产者。
- **消费者（Consumer）**：消息消费者。
- **连接（Connection）**：一个网络连接，比如TCP/IP连接。AMQP连接通常是长连接，当一个应用不再需要连接到AMQP代理的时候，需要释放掉 AMQP 连接，而不是直接将TCP连接关闭。
- **信道（Channel）**：网络信道，是建立在Connection连接之上的一种轻量级的连接，可以创建多个信道。
- **交换机（Exchange）**：接收消息，并将消息路由转发给消息队列。
- **虚拟主机（Virtual Host）**：进行逻辑隔离，一个虚拟主机可以创建若干个交换机和队列。
- **绑定（Binding）**：交换机和队列之间的虚拟连接。
- **路由键（Routing Key）**：路由规则，虚拟机可以用来确定如何路由一个特定的消息。
- **队列（Queue）**：存储即将被消费者消费掉的消息。
- **中间件（Broker ）**：实现AMQP实体服务，比如常见的RabbitMQ、Azure Service Bus等。

##### 工作过程

1. 生产者发布消息，经由交换机。
2. 交换机根据路由规则将收到的消息分发给与该交换机绑定的队列。
3. 最后消息中间件会将消息投递给订阅了此队列的消费者，或者消费者按照需求自行获取。

#### JMS

##### JMS 简介

JMS即Java消息服务（Java Message Service）应用程序接口，是一个Java平台中关于面向消息中间件（MOM）的API，用于在两个应用程序之间，或分布式系统中发送消息，进行异步通信。Java消息服务是一个与具体平台无关的API，绝大多数MOM提供商都对JMS提供支持（百度百科给出的概述）。我们可以简单的理解：两个应用程序之间需要进行通信，我们使用一个JMS服务，进行中间的转发，通过JMS 的使用，我们可以解除两个程序之间的耦合。

##### 优势

1. Asynchronous（异步）

   JMS is asynchronous by default. So to receive a message, the client is not required to send the request. The message will arrive automatically to the client as they become available.（JMS 原本就是一个异步的消息服务，客户端获取消息的时候，不需要主动发送请求，消息会自动发送给可用的客户端）。

2. Reliable（可靠）

   JMS provides the facility of assurance that the message will delivered once and only once. You know that duplicate messages create problems. JMS helps you avoiding such problems.（JMS保证消息只会递送一次。大家都遇到过重复创建消息问题，而JMS能帮你避免该问题。）

##### JMS 的消息模型

JMS具有两种通信模式：

1. Point-to-Point Messaging Domain （点对点）
2. Publish/Subscribe Messaging Domain （发布/订阅模式）

在JMS API出现之前，大部分产品使用“点对点”和“发布/订阅”中的任一方式来进行消息通讯。JMS定义了这两种消息发送模型的规范，它们相互独立。任何JMS的提供者可以实现其中的一种或两种模型，这是它们自己的选择。JMS规范提供了通用接口保证我们基于JMS API编写的程序适用于任何一种模型。

###### Point-to-Point Messaging Domain（点对点通信模型）

- 在点对点通信模式中，应用程序由消息队列，发送方，接收方组成。每个消息都被发送到一个特定的队列，接收者从队列中获取消息。队列保留着消息，直到他们被消费或超时

- **特点**
  - 每个消息只要一个消费者
  - 发送者和接收者在时间上是没有时间的约束，也就是说发送者在发送完消息之后，不管接收者有没有接受消息，都不会影响发送方发送消息到消息队列中。
  - 发送方不管是否在发送消息，接收方都可以从消息队列中去到消息（The receiver can fetch message whether it is running or not when the sender sends the message）
  - 接收方在接收完消息之后，需要向消息队列应答成功

###### Publish/Subscribe Messaging Domain（发布/订阅通信模型）

- 在发布/订阅消息模型中，发布者发布一个消息，该消息通过topic传递给所有的客户端。该模式下，发布者与订阅者都是匿名的，即发布者与订阅者都不知道对方是谁。并且可以动态的发布与订阅Topic。Topic主要用于保存和传递消息，且会一直保存消息直到消息被传递给客户端。
- **特点**
  - 一个消息可以传递个多个订阅者（即：一个消息可以有多个接受方）
  - 发布者与订阅者具有时间约束，针对某个主题（Topic）的订阅者，它必须创建一个订阅者之后，才能消费发布者的消息，而且为了消费消息，订阅者必须保持运行的状态。
  - 为了缓和这样严格的时间相关性，JMS允许订阅者创建一个可持久化的订阅。这样，即使订阅者没有被激活（运行），它也能接收到发布者的消息。

##### JMS接收消息

在JMS中，消息的产生和消息是异步的。对于消费来说，JMS的消息者可以通过两种方式来消费消息。

1. 同步（Synchronous）

   在同步消费信息模式模式中，订阅者/接收方通过调用 receive（）方法来接收消息。在receive（）方法中，线程会阻塞直到消息到达或者到指定时间后消息仍未到达。

2. 异步（Asynchronous）

   使用异步方式接收消息的话，消息订阅者需注册一个消息监听者，类似于事件监听器，只要消息到达，JMS服务提供者会通过调用监听器的onMessage()递送消息。

##### JMS编程模型

1. 管理对象（Administered objects）-连接工厂（Connection Factories）和目的地（Destination）

   - Connection Factories

     创建Connection对象的工厂，针对两种不同的jms消息模型，分别有QueueConnectionFactory和TopicConnectionFactory两种。可以通过JNDI来查找ConnectionFactory对象。客户端使用一个连接工厂对象连接到JMS服务提供者，它创建了JMS服务提供者和客户端之间的连接。JMS客户端（如发送者或接受者）会在JNDI名字空间中搜索并获取该连接。使用该连接，客户端能够与目的地通讯，往队列或话题发送/接收消息。

     ```java
     QueueConnectionFactory queueConnFactory = (QueueConnectionFactory) initialCtx.lookup ("primaryQCF");
     Queue purchaseQueue = (Queue) initialCtx.lookup ("Purchase_Queue");
     Queue returnQueue = (Queue) initialCtx.lookup ("Return_Queue");
     ```

   - Destination

     目的地指明消息被发送的目的地以及客户端接收消息的来源。JMS使用两种目的地，队列和话题。如下代码指定了一个队列和话题：

     - 创建一个队列Session：

       ```java
       QueueSession ses = con.createQueueSession (false, Session.AUTO_ACKNOWLEDGE);  //get the Queue object
       Queue t = (Queue) ctx.lookup ("myQueue");  //create QueueReceiver
       QueueReceiver receiver = ses.createReceiver(t);
       ```

     - 创建一个Topic Session：

       ```java
       QueueSession ses = con.createQueueSession (false, Session.AUTO_ACKNOWLEDGE);  //get the Queue object
       Queue t = (Queue) ctx.lookup ("myQueue");  //create QueueReceiver
       QueueReceiver receiver = ses.createReceiver(t);
       ```

2. 连接对象（Connections）

   Connection表示在客户端和JMS系统之间建立的链接（对TCP/IP socket的包装）。Connection可以产生一个或多个Session。跟ConnectionFactory一样，Connection也有两种类型：QueueConnection和TopicConnection。连接对象封装了与JMS提供者之间的虚拟连接，如果我们有一个ConnectionFactory对象，可以使用它来创建一个连接。

   ```java
   Connection connection = connectionFactory.createConnection();
   ```

3. 会话（Sessions）

   Session 是我们对消息进行操作的接口，可以通过session创建生产者、消费者、消息等。Session 提供了事务的功能，如果需要使用session发送/接收多个消息时，可以将这些发送/接收动作放到一个事务中。

   我们可以在连接创建完成之后创建session：

   ```java
   Session session = connection.createSession(false, Session.AUTO_ACKNOWLEDGE);
   ```

4. 消息生产者（Message Producers）

   消息生产者由Session创建，用于往目的地发送消息。生产者实现MessageProducer接口，我们可以为目的地、队列或话题创建生产者。

   ```java
   MessageProducer producer = session.createProducer(dest);
   MessageProducer producer = session.createProducer(queue);
   MessageProducer producer = session.createProducer(topic);
   ```

5. 消息消费者（Message Consumers）

   消息消费者由Session创建，用于接收被发送到Destination的消息。

   ```java
   MessageConsumer consumer = session.createConsumer(dest);
   MessageConsumer consumer = session.createConsumer(queue);
   MessageConsumer consumer = session.createConsumer(topic);
   ```

6. 消息监听者（Message Listeners）

   消息监听器。如果注册了消息监听器，一旦消息到达，将自动调用监听器的onMessage方法。EJB中的MDB（Message-Driven Bean）就是一种MessageListener。

## 常见MQ

现在比较常见的MQ产品主要是ActiveMQ、RabbitMQ、ZeroMQ、Kafka、MetaMQ、RocketMQ等。

常见的消息队列有以下几种：

1. Apache ActiveMQ：基于JMS的消息队列，支持多种配置。
2. RabbitMQ：一个可靠的开源消息队列系统，支持多种编程语言和操作系统。
3. Apache Kafka：一种高吞吐量、分布式发布订阅消息系统，可以处理大量数据并保持持久性。
4. RocketMQ：阿里巴巴开源的低延迟、高可靠、可伸缩的消息队列服务。
5. ZeroMQ：一种高性能、高可用的封装层，可以在不同的消息队列上运行。
6. NATS：一种基于云计算的消息队列系统，具有高性能和可扩展性。
7. Redis：一种内存数据库，支持多种数据结构和发布订阅功能，可以实现消息队列的功能。

### ZeroMQ

ZeroMQ 号称是“史上最快的消息队列”，基于 C 语言开发，可以在任何平台通过任何代码连接，通过 inproc、IPC、TCP、TIPC、多播传送消息，支持发布-订阅、推-拉、共享队列等模式，高速异步 I/O 引擎。

根据官方的说法，ZeroMQ 是一个简单好用的传输层，像框架一样的可嵌入的 Socket 类库，使 Socket 编程更加简单、简洁、性能更高，是专门为高吞吐量/低延迟的场景开发。**ZeroMQ 与其他 MQ 有着本质的区别，它根本不是消息队列服务器，更类似于一个底层网络通讯库**，对原有 Socket API 进行封装，在使用引入对应的jar包即可，可谓是相当灵活。

同时，因为它的简单灵活，如果我们想作为消息队列使用的话，需要开发大量代码。而且，ZeroMQ 不支持消息持久化，其定位并不是安全可靠的消息传输，所以还需要自己编码保证可靠性。简而言之，ZeroMQ 很强大，但是想用好需要自己实现。

### RabbitMQ

RabbitMQ 2007年发布，是一个在 AMQP 基础上完成的，可复用的企业消息系统，是当前最主流的消息中间件之一。

#### 代理效应

代理和负载平衡器在客户端与其目标节点之间引入了额外的网络跃点（甚至多个）。中介也可以成为网络争用点：它们的吞吐量将成为整个系统的限制因素。因此，代理和负载平衡器的网络带宽超额配置和吞吐量监视非常重要。

当中间商在一段时间内没有任何活动时，它们也可以终止“空闲” TCP连接。在大多数情况下，这是不可取的。此类事件将导致服务器端的突然关闭连接日志消息以及客户端的I / O异常。

在连接上启用心跳后，将导致周期性的轻型网络流量。因此，心跳具有保护客户端连接的副作用，该客户端连接可能会闲置一段时间，以防止代理和负载平衡器过早关闭。

从10到30秒的心跳超时将经常产生周期性的网络流量（大约每5到15秒一次），以满足大多数代理工具和负载均衡器的默认设置。太低的值将产生误报。

#### 主要特性

1. **可靠性：**提供了多种技术可以让你在性能和可靠性质检进行权衡。这些技术包括持久性机制、投递确认、发布者证实和高可用性机制；
2. **灵活的路由：**消息在到达队列前是通过交换机进行路由的。RabbitMQ 为典型的路由逻辑提供了多钟内置交换机类型。如果你有更复杂的路由需求，可以将这些交换机组合起来使用，你甚至可以实现自己的交换机类型，并且当做 RabbitMQ 的插件使用；
3. **消息集群：**在相同局域网中的多个 RabbitMQ 服务器可以聚合在一起，作为一个独立的逻辑代理来使用；
4. **队列高可用：**队列可以在集群中的机器上进行镜像，以确保在硬件问题下还保证消息安全；
5. **多种协议的支持：**支持多种消息队列协议；
6. **多语言支持：**服务器端用 Erlang 语言编写，支持只要是你能想到的所有编程语言；
7. **管理界面：**RabbitMQ 有一个易用的用户界面，使得用户可以监控和管理消息 Broker 的许多方面；
8. **跟踪机制：**如果消息异常，RabbitMQ 提供消息跟踪机制，使用者可以找出发生了什么；
9. **插件机制：**提供了许多插件，来从多方面进行扩展，也可以编写自己的插件。

使用 RabbitMQ 需要：

- Erlang 语言包
- RabbitMQ 安装包

RabbitMQ 可以运行在 Erlang 语言所支持的平台上：

- Solaris
- BSD
- Linux
- MacOSX
- TRU64
- Windows NT/2000/XP/Vista/Windows 7/Windows 8
- Windows Server 2003/2008/2012
- Windows 95, 98
- VxWorks

#### 优点

1. 由于 Erlang 语言的特性，MQ 性能较好，高并发；
2. 健壮、稳定、易用、跨平台、支持多种语言、文档齐全；
3. 有消息确认机制和持久化机制，可靠性高；
4. 高度可定制的路由；
5. 管理界面较丰富，在互联网公司也有较大规模的应用；
6. 社区活跃度高。

#### 缺点

1. 尽管结合 Erlang 语言本身的并发优势，性能较好，但是不利于做二次开发和维护；
2. 实现了代理架构，意味着消息在发送到客户端之前可以在中央节点上排队，此特性使得 RabbitMQ 易于使用和部署，但是使得其运行速度较慢，因为中央节点增加了延迟，消息封装后也比较大；
3. 需要学习比较复杂的接口和协议，学习和维护成本较高。

#### 工作原理

![image-20230517155538862](https://github.com/chou401/pic-md/raw/master/img/image-20230517155538862.png)

- **Broker**：接收和分发消息的应用，RabbitMQ Server就是 Message Broker。
- **Virtual Host**：出于多租户和安全因素设计的，把 AMQP 的基本组件划分到一个虚拟的分组中，类似于网络中的 namespace 概念。当多个不同的用户使用同一个 RabbitMQ server 提供的服务时，可以划分出多个vhost，每个用户在自己的 vhost 创建 exchange／queue 等。
- **Connection**：publisher／consumer 和 broker 之间的 TCP 连接。
- **Channel**：如果每一次访问 RabbitMQ 都建立一个 Connection，在消息量大的时候建立 TCP Connection的开销将是巨大的，效率也较低。Channel 是在 connection 内部建立的逻辑连接，如果应用程序支持多线程，通常每个thread创建单独的 channel 进行通讯，AMQP method 包含了channel id 帮助客户端和message broker 识别 channel，所以 channel 之间是完全隔离的。Channel 作为轻量级的 Connection 极大减少了操作系统建立 TCP connection 的开销。
- **Exchange**：message 到达 broker 的第一站，根据分发规则，匹配查询表中的 routing key，分发消息到queue 中去。常用的类型有：direct (point-to-point), topic (publish-subscribe) and fanout (multicast)。
- **Queue**：消息最终被送到这里等待 consumer 取走。
- **Binding**：exchange 和 queue 之间的虚拟连接，binding 中可以包含 routing key。Binding 信息被保存到 exchange 中的查询表中，用于 message 的分发依据。

#### 如何实现生产者和消费者

#### 交换机类型

- **Direct Exchange（直连交换机）**

  路由键与队列完全匹配交换机。此种类型交换机，通过 RoutingKey 路由键将交换机和队列进行绑定，消息被发送到 exchange 时，需要根据消息的 RoutingKey 进行匹配，只将消息发送到完全匹配到此 RoutingKey 的队列（如果匹配了多个队列，则每个队列都会收到相同的消息）。

  比如：如果一个队列绑定到交换机要求路由键为 “key”，则只转发 RoutingKey 标记为 “key” 的消息，不会转发 “key1”，也不会转发 “key2” 等等。它是完全匹配、单播的模式。

  ![image-20230519161049311](https://github.com/chou401/pic-md/raw/master/img/image-20230519161049311.png)

- **Fanout Exchange（扇型交换机）**

  Fanout，此种交换机，会将消息分发给所有绑定了次交换机的队列，此时 RoutingKey 参数无效。这个模式类似于广播。它是所有交换机速度最快的。

  Fanout 类型交换机下发送消息一条，无论 RoutingKey 是什么，queue1，queue2，queue3，queue4 都可以收到消息。

  ![image-20230519161221269](https://github.com/chou401/pic-md/raw/master/img/image-20230519161221269.png)

- **Topic Exchange（主题交换机）**

  应用范围最广的交换机类型，消息队列通过消息主题与交换机绑定。一个队列可以通过多个主题与交换机绑定，多个消息队列也可以通过相同消息主题和交换机绑定。并且可以通过通配符（\*或者#）进行多个消息主题的适配。

  Topic，主题类型交换机，此种交换机与 Direct 类似，也是需要通过 RoutingKey 路由键进行匹配分发，区别在于 Topic 可以进行模糊匹配，Direct 是完全匹配。

  1. Topic 中，将 RoutingKey 通过 “.” 来分成多个部分。
  2. “\*” 代表一个部分。
  3. “#” 代表0个或多个部分（如果绑定的路由键为 “#” 时，则接收所有消息，路由键所有都匹配）。

  ![image-20230519162427816](https://github.com/chou401/pic-md/raw/master/img/image-20230519162427816.png)

  然后发送一条消息，RoutingKey 为 “key1.key2.key3.key4”，那么根据 “.” 将这个路由键分为了四个部分，此条路由键将会匹配：

  1. key1.key2.key3.\*：成功匹配，因为\*可以代表一个部分。
  2. key1.#：成功匹配，因为 可以代表0或多个部分。
  3. \*.key3.\*.key4：成功匹配，因为第一和第三部分分别为key1和key3，且为四个部分，刚好匹配。
  4. #.key3.key4：成功匹配，#可以代表多个部分，正好匹配中了key1和key2。

  如果发送消息 RoutingKey 为 “key1”，那么将只能匹配中 key1.#，#可以代表0个部分。

- **Headers Exchange（头交换机）**

  与 RoutingKey 无关，匹配机制是匹配消息头中的属性信息。在绑定消息队列与交换机之前声明一个map键值对，通过这个map对象实现消息队列和交换机的绑定。当消息发送到 RabbitMQ 时会取到该消息的 headers 与 exchange 绑定时指定的键值对进行匹配，如果完全匹配则消息会路由到该队列，否则不会路由到该队列。

  匹配规则 x-match 有下列两种类型：

  - x-match = all：表示所有的键值对都匹配才能接收到消息。
  - x-match = any：表示只要有键值对匹配就能接收到消息。

![image-20230523095354400](https://github.com/chou401/pic-md/raw/master/img/image-20230523095354400.png)

#### 镜像队列

##### 背景

单节点的 RabbitMQ 存在性能上限，可以通过垂直或者水平扩容的方式增加 RabbitMQ的吞吐量。垂直扩容指的是提高 CPU 和内存的规格；水平扩容指部署 RabbitMQ 集群。

通过将单个节点的队列相对平均地分配到集群的不同节点，单节点的压力被分散，RabbitMQ 可以充分利用多个节点的计算和存储资源，以提升消息的吞吐量。

但是多节点的集群并不意味着有更好的可靠性--每个队列仍只存在于一个节点，当这个节点故障，这个节点上的所有队列都不再可用。

在 3.8 以前的版本，RabbitMQ 通过镜像队列（Classic Queue Mirroring）来提供高可用性。但镜像队列存在很大的局限性，在 3.8 之后的版本 RabbitMQ 推出了 Quorum queues 来替代镜像队列，在之后的版本中镜像队列将被移除。

镜像队列通过将一个队列镜像（消息广播）到其他节点的方式来提升消息的高可用性。当主节点宕机，从节点会提升为主节点继续向外提供服务。

##### 描述

RabbitMQ 以队列维度提供高可用的解决方案——镜像队列。

配置镜像队列规则后，新创建的队列按照规则成为镜像队列。每个镜像队列都包含一个主节点（Leader）和若干个从节点（Follower），其中只有主节点向外提供服务（生产消息和消费消息），从节点仅仅接收主节点发送的消息。

从节点会准确地按照主节点执行命令的顺序执行动作，所以从节点的状态与主节点应是一致的。

##### 配置方法

使用策略（Policy）来配置镜像策略，策略使用正则表达式来配置需要应用镜像策略的队列名称，以及在参数中配置镜像队列的具体参数。

按此步骤创建镜像策略，该策略为所有 `mirror*` 开头的队列创建 3 副本镜像。

![image-20230523112017966](https://github.com/chou401/pic-md/raw/master/img/image-20230523112017966.png)

创建完的策略如下图显示：

![image-20230523112042677](https://github.com/chou401/pic-md/raw/master/img/image-20230523112042677.png)

**参数解释：**

- Name: policy的名称，用户自定义。
- Pattern: queue的匹配模式（正则表达式）。`^`表示所有队列都是镜像队列。
- Definition: 镜像定义，包括三个部分ha-sync-mode、ha-mode、ha-params。
  - ha-mode: 指明镜像队列的模式，有效取值范围为all/exactly/nodes。
    - all：表示在集群所有的代理上进行镜像。
    - exactly：表示在指定个数的代理上进行镜像，代理的个数由ha-params指定。
    - nodes：表示在指定的代理上进行镜像，代理名称通过ha-params指定。
  - ha-params: ha-mode模式需要用到的参数。
  - ha-sync-mode: 表示镜像队列中消息的同步方式，有效取值范围为：automatic，manually。
    - automatic：表示自动向master同步数据。
    - manually：表示手动向master同步数据。
- Priority: 可选参数， policy的优先级。

##### 配置规则

配置完 Policy 后，创建新的队列，或者原有的的队列，如果队列名称符合 Policy 的匹配规则，则该队列会自动创建为镜像队列。

下图中 `mirror_queue` 匹配之前创建的镜像策略，为镜像队列。`normal_queue` 为普通队列。

![image-20230523112755735](https://github.com/chou401/pic-md/raw/master/img/image-20230523112755735.png)

镜像队列显示的蓝色 `+2` 表示同步副本数为 2 个。此处如果用红色显示，则表示为同步副本数

显示的 `mirror-policy` 为该队列应用的镜像策略。

点击队列名称可以进入查看队列详细信息，从中可以看出队列的主节点、从节点和镜像策略。

![image-20230523112856113](https://github.com/chou401/pic-md/raw/master/img/image-20230523112856113.png)

##### 配置参数

###### 镜像策略

| **ha-mode** | **ha-params** | **结果**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ----------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| exactly     | count         | 集群中队列副本的数量（主队列加上镜像）。count值为1表示一个副本：只有主节点。如果主节点不可用，则其行为取决于队列是否持久化。count值为2表示两个副本：一个队列主队列和一个队列镜像。换句话说:“镜像数=节点数-1”。如果运行队列主服务器的节点变得不可用，队列镜像将根据配置的镜像提升策略自动提升到主服务器。如果集群中的可用节点数少于count，则将队列镜像到所有节点。如果集群中有多个计数节点，并且一个包含镜像的节点宕机，那么将在另一个节点上创建一个新镜像。使用’ exactly ‘模式和’ ha-promot-on-shutdown ': ’ always '可能是危险的，因为队列可以跨集群迁移，并在停机时变得不同步。 |
| all         | 不设置        | 队列跨集群中的所有节点镜像。当一个新节点被添加到集群中时，队列将被镜像到该节点。这个设置非常保守。建议设置的副本值为大多数节点`N / 2 + 1`。镜像到所有节点会给所有集群节点带来额外的负担，包括网络I/O、磁盘I/O和磁盘空间的使用。                                                                                                                                                                                                                                                                                                                                                   |
| nodes       | 节点名称      | 队列被镜像到节点名中列出的节点。节点名是在rabbitmqctl cluster_status中出现的Erlang节点名；它们的形式通常是“rabbit@hostname”。如果这些节点名中有任何一个不是集群的一部分，则不构成错误。如果在声明队列时列表中的节点都不在线，则将在声明客户机连接的节点上创建队列。                                                                                                                                                                                                                                                                                                               |

###### 新镜像同步策略

| **ha-sync-mode** | **说明**                                                                                                                                                                                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| manual           | 这是默认模式。新队列镜像将不接收现有消息，它只接收新消息。一旦使用者耗尽了仅存在于主服务器上的消息，新的队列镜像将随着时间的推移成为主服务器的精确副本。如果主队列在所有未同步的消息耗尽之前失败，则这些消息将丢失。您可以手动完全同步队列，详情请参阅未同步的镜像部分。 |
| automatic        | 当新镜像加入时，队列将自动同步。值得重申的是，队列同步是一个阻塞操作。如果队列很小，或者您在RabbitMQ节点和ha-sync-batch-size之间有一个快速的网络，那么这是一个很好的选择。                                                                                               |

###### 从节点晋升策略

镜像队列主节点出现故障时，最老的从节点会被提升为新的主节点。如果新提升为主节点的这个副本与原有的主节点并未完成数据的同步，那么就会出现数据的丢失，而实际应用中，出现数据丢失可能会导致出现严重后果。

rabbitmq 提供了 ha-promote-on-shutdown，ha-promote-on-failure 两个参数让用户决策是保证队列的可用性，还是保证队列的一致性；两个参数分别控制正常关闭、异常故障情况下从节点是否提升为主节点，其可设置的值为 when-synced 和 always。

| **ha-promote-on-shutdown/ha-promote-on-failure** | **说明**                                       |
| ------------------------------------------------ | ---------------------------------------------- |
| when-synced                                      | 从节点与主节点完成数据同步，才会被提升为主节点 |
| always                                           | 无论什么情况下从节点都将被提升为主节点         |

> 这里要注意的是ha-promote-on-failure设置为always，插拔网线模拟网络异常的两个测试场景：当网络恢复后，其中一个会重新变为mirror，具体是哪个变为mirror，受cluster_partition_handling处理策略的影响。
>
> 例如两台节点A，B组成集群，并且cluster_partition_handling设置为autoheal，队列的master位于节点A上，具有全量数据，mirror位于节点B上，并且还未完成消息的同步，此时出现网络异常，网络异常后两个节点交互决策：如果节点A节点成为赢家，此时B节点内部会重启，这样数据全部保留不会丢失；相反如果B节点成为赢家，A需要重启，那么由于ha-prromote-on-failure设置为always，B节点上的mirror提升为master，这样就出现了数据丢失。

###### 主队列选择策略

RabbitMQ中的每个队列都有一个主队列。该节点称为队列主服务器。所有队列操作首先经过主队列，然后复制到镜像。这对于保证消息的FIFO排序是必要的。

通过在策略中设置 `queue-master-locator` 键的方法可以定义主队列选择策略，这是常用的方法。

![image-20230523144411570](https://github.com/chou401/pic-md/raw/master/img/image-20230523144411570.png)

此外，也可以用队列参数 `x-queue-master-locator` 或配置文件中定义 `queue_master_locator` 的方式指定，此处不再赘述。

下面是该策略的可选参数列表：

| **queue-master-locator** | **说明**                       |
| ------------------------ | ------------------------------ |
| min-masters              | 选择承载最小绑定主机数量的节点 |
| client-local             | 选择客户机声明队列连接到的节点 |
| min-masters              | 随机选择一个节点               |

#### 负载均衡-HAProxy

对 RabbitMQ集群中的节点做负载均衡：

- 客户端负载均衡
- HAProxy实现负载均衡

##### 客户端负载均衡

要实现一个完整的负载均衡主要是实现以下功能：

- 请求需要按照规则打散到各个集群的节点。

- 节点的宕机需要负载均衡器自我感知并且进行剔除，这样就避免节点都宕掉了还在向宕掉的节点发送请求，导致大量的请求失败。

- 节点的新增其实还好，可以自我感知并上线，也可以手动配置。

- haproxy ip-hash

  整型的Hash算法使用的是Thomas Wang's 32 Bit / 64 Bit Mix Function ，这是一种基于位移运算的散列方法。基于移位的散列是使用Key值进行移位操作。通常是结合左移和右移。每个移位过程的结果进行累加，最后移位的结果作为最终结果。这种方法的好处是避免了乘法运算，从

如果实现将请求打散到各个节点，负载均衡器需要遵循一定得规则，规则主要是一下几种：

- 轮询：将请求轮流到发送到后端的机器，不关系节点的实际连接数和负载能力。
- 加权轮询：对轮询的优化，考虑每个节点的性能，配置高的机器分配较高的权重，配置低的机器分配较低的权重，并将请求按照权重分配到后端节点。
- 随机法：通过随机算法，在众多节点中随机挑选一个进行请求。随着客户端调用服务端的次数增多，其实际效果越接近轮询。
- 加权随机法：对随机的优化，根据机器性能分配权重，按照权重访问后端节点。
- 源地址哈希法：根据客户端的IP地址，通过hash函数获取一个数值，用这个数值对后端节点数进行取模，这样在后端节点数保持不变的情况下，同一个客户端访问的 后端节点也是同一个。
- 最小连接数：根据后端节点的连接情况，动态选举一个连接积压最小的节点进行访问，尽可能的提高节点的利用率。

##### HAProxy实现负载均衡

###### HAProxy 简介

1. HAProxy 是一款提供高可用性、负载均衡以及基于TCP（第四层）和HTTP（第七层）应用的代理软件，支持虚拟主机，它是免费、快速并且可靠的一种解决方案。 HAProxy特别适用于那些负载特大的web站点，这些站点通常又需要会话保持或七层处理。HAProxy运行在时下的硬件上，完全可以支持数以万计的 并发连接。并且它的运行模式使得它可以很简单安全的整合进您当前的架构中， 同时可以保护你的web服务器不被暴露到网络上。
2. HAProxy 实现了一种事件驱动、单一进程模型，此模型支持非常大的并发连接数。多进程或多线程模型受内存限制 、系统调度器限制以及无处不在的锁限制，很少能处理数千并发连接。事件驱动模型因为在有更好的资源和时间管理的用户端(User-Space) 实现所有这些任务，所以没有这些问题。此模型的弊端是，在多核系统上，这些程序通常扩展性较差。这就是为什么他们必须进行优化以 使每个CPU时间片(Cycle)做更多的工作。
3. HAProxy 支持连接拒绝 : 因为维护一个连接的打开的开销是很低的，有时我们很需要限制攻击蠕虫（attack bots），也就是说限制它们的连接打开从而限制它们的危害。 这个已经为一个陷于小型DDoS攻击的网站开发了而且已经拯救了很多站点，这个优点也是其它负载均衡器没有的。
4. HAProxy 支持全透明代理（已具备硬件防火墙的典型特点）: 可以用客户端IP地址或者任何其他地址来连接后端服务器，这个特性仅在 Linux 2.4/2.6内核打了cttproxy补丁后才可以使用，这个特性也使得为某特殊服务器处理部分流量同时又不修改服务器的地址成为可能。

###### 四层负载均衡与七层负载均衡

- **四层负载均衡**

  以常见的 TCP 应用为例，负载均衡器在接收到第一个来自客户端的 SYN 请求时，会通过设定的负载均衡算法选择一个最佳的后端服务器，同时将报文中目标 IP 地址修改为后端服务器 IP，然后直接转发给该后端服务器，这样一个负载均衡请求就完成了。从这个过程来看，一个 TCP 连接是客户端和服务器直接建立的，而负载均衡器只不过完成了一个类似路由器的转发动作。在某些负载均衡策略中，为保证后端服务器返回的报文可以正确传递给负载均衡器，在转发报文的同时可能还会对报文原来的源地址进行修改。

- **七层负载均衡**

  这里仍以常见的 TCP 应用为例，由于负载均衡器要获取到报文的内容，因此只能先代替后端服务器和客户端建立连接，接着，才能收到客户端发送过来的报文内容，然后再根据该报文中特定字段加上负载均衡器中设置的负载均衡算法来决定最终选择的内部服务器。纵观整个过程，七层负载均衡器在这种情况下类似于一个代理服务器。

  对比四层负载均衡和七层负载均衡运行的整个过程，可以看出，在七层负载均衡模式下， 负载均衡器与客户端及后端的服务器会分别建立一次 TCP 连接，而在四层负载均衡模式下， 仅建立一次 TCP 连接。由此可知，七层负载均衡对负载均衡设备的要求更高，而七层负载均衡的处理能力也必然低于四层模式的负载均衡。

###### HAProxy配置详解

HAProxy 配置文件根据功能和用途，主要有 5 个部分组成，但有些部分并不是必须的， 可以根据需要选择相应的部分进行配置。

- **global** 部分

  用来设定全局配置参数，属于进程级的配置，通常和操作系统配置有关。

  - **log**：全局的日志配置，local0 是日志设备，info 表示日志级别。其中日志级别有err、warning、info、debug 四种可选。这个配置表示使用 127.0.0.1 上的 rsyslog 服务中的local0 日志设备，记录日志等级为info。
  - **maxconn**：设定每个 haproxy 进程可接受的最大并发连接数，此选项等同于 Linux命令行选项“ulimit -n”。
  - **user/ group**：设置运行 haproxy 进程的用户和组，也可使用用户和组的 uid 和gid 值来替代。
  - **daemon**：设置 HAProxy 进程进入后台运行。这是推荐的运行模式。
  - **nbproc**：设置 HAProxy 启动时可创建的进程数，此参数要求将HAProxy 运行模式设置为“daemon”，默认只启动一个进程。根据使用经验，该值的设置应该小于服务器的 CPU 核数。创建多个进程，能够减少每个进程的任务队列，但是过多的进程可能会导致进程的崩溃。
  - **pidfile**：指定 HAProxy 进程的 pid 文件。启动进程的用户必须有访问此文件的权限。

- **defaults** 部分

  默认参数的配置部分。在此部分设置的参数值，默认会自动被引用到下面的 frontend、backend 和 listen 部分中，因此，如果某些参数属于公用的配置，只需在 defaults 部分添加一次即可。而如果在 frontend、backend 和 listen 部分中也配置了与 defaults 部分一样的参数，那么defaults 部分参数对应的值自动被覆盖。

  - **mode**：设置 HAProxy 实例默认的运行模式，有 tcp、http、health 三个可选值。

    - **tcp** 模式

      在此模式下，客户端和服务器端之间将建立一个全双工的连接，不会对七层报文做任何类型的检查，默认为 tcp 模式，经常用于 SSL、SSH、SMTP 等应用。

    - **http** 模式

      在此模式下，客户端请求在转发至后端服务器之前将会被深度分析，所有不与 RFC 格式兼容的请求都会被拒绝。

    - **health** 模式

      目前此模式基本已经废弃，不在多说。

  - **retries**：设置连接后端服务器的失败重试次数，连接失败的次数如果超过这里设置的值，HAProxy 会将对应的后端服务器标记为不可用。此参数也可在后面部分进行设置。

  - **timeout connect**：设置成功连接到一台服务器的最长等待时间，默认单位是毫秒，但也可以使用其他的时间单位后缀。

  - **timeout client**：设置连接客户端发送数据时最长等待时间，默认单位是毫秒，也可以使用其他的时间单位后缀。

  - **timeout server**：设置服务器端回应客户度数据发送的最长等待时间，默认单位是毫秒，也可以使用其他的时间单位后缀。

  - **timeout check**：设置对后端服务器的检测超时时间，默认单位是毫秒，也可以使用其他的时间单位后缀。

- **frontend** 部分

  此部分用于设置接收用户请求的前端虚拟节点。frontend 是在 HAProxy1.3 版本之后才引入的一个组件，同时引入的还有 backend 组件。通过引入这些组件，在很大程度上简化了 HAProxy 配置文件的复杂性。frontend 可以根据 ACL 规则直接指定要使用的后端。

  - **bind**：此选项只能在 frontend 和 listen 部分进行定义，用于定义一个或几个监听的套接字。bind 的使用格式为:bind [<address>:<port_range>] interface <interface>其中，address 为可选选项，其可以为主机名或IP 地址，如果将其设置为“\*”或“0.0.0.0”，将监听当前系统的所有 IPv4 地址。port_range 可以是一个特定的 TCP 端口，也可是一个端口范围，小于 1024 的端口需要有特定权限的用户才能使用。interface 为可选选项，用来指定网络接口的名称，只能在 Linux 系统上使用。
  - **option httplog**：在默认情况下，haproxy 日志是不记录 HTTP 请求的，这样很不方便 HAProxy 问题的排查与监控。通过此选项可以启用日志记录 HTTP 请求。
  - **option forwardfor**：如果后端服务器需要获得客户端的真实 IP，就需要配置此参数。由于 HAProxy 工作于反向代理模式，因此发往后端真实服务器的请求中的客户端 IP 均为 HAProxy 主机的 IP，而非真正访问客户端的地址，这就导致真实服务器端无法记录客户端真正请求来源的 IP，而“X-Forwarded-For”则可用于解决此问题。通过使用“forwardfor”选项，HAProxy 就可以向每个发往后端真实服务器的请求添加“X-Forwarded-For”记录，这样后端真实服务器日志可以通过“X-Forwarded-For”信息来记录客户端来源 IP。
  - **option httpclose**：此选项表示在客户端和服务器端完成一次连接请求后，HAProxy 将主动关闭此 TCP 连接。这是对性能非常有帮助的一个参数。
  - **log global**：表示使用全局的日志配置，这里的“ global”表示引用在HAProxy 配置文件 global 部分中定义的 log 选项配置格式。
  - **default_backend**：#指定默认的后端服务器池，也就是指定一组后端真实服务器，而这些真实服务器组将在 backend 段进行定义。这里的htmpool 就是一个后端服务器组。

- **backend** 部分

  此部分用于设置集群后端服务集群的配置，也就是用来添加一组真实服务器，以处理前端用户的请求。添加的真实服务器类似于 LVS 中的real server 节点。

  - option redispatch：此参数用于 cookie 保持的环境中。在默认情况下，HAProxy会将其请求的后端服务器的 serverID 插入到 cookie 中，以保证会话的 SESSION 持久性。而如果后端的服务器出现故障，客户端的 cookie 是不会刷新的，这就出现了问题。此时，如果设置此参数，就会将客户的请求强制定向到另外一个健康的后端服务器上，以保证服务的正常。

  - option abortonclose：如果设置了此参数，可以在服务器负载很高的情况下， 自动结束掉当前队列中处理时间比较长的链接。

  - balance：此关键字用来定义负载均衡算法。目前 HAProxy 支持多种负载均衡算法，常用的有如下几种：

    | 算法         | 描述                                                                                                                                                                                          |
    | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | roundrobin   | 是基于权重进行轮询调度的算法，在服务器的性能分布比较均匀的时候，这是一种最公平的、最合理的算法。此算法经常使用。                                                                              |
    | static-rr    | 也是基于权重进行轮询调度的算法，不过此算法为静态方法，在运行时调整其服务器严重不会生效。                                                                                                      |
    | source       | 是基于请求源IP的算法。此算法先对请求的源IP 进行hash 运算，然后将结果与后端服务器的权重总数相除后转发至某个匹配的后端服务器。这种方式可以使同一客户端 IP的请求始终被转发到某特定的后端服务器。 |
    | leastconn    | 此算法会将新的连接请求转发到具有最少连接数目的后端服务器。在会话时间较长的场景中推荐使用此算法，例如数据库复杂均衡等。此算法不适合会话时间比较短的环境中，例如基于 HTTP 的应用。              |
    | url          | 此算法会对部分或整个 URL 进行 hash 运算，再经过与服务器的总权重相除，最后转发到某台匹配的后端服务器上。                                                                                       |
    | url_param    | 此算法会根据 URL 路径中的参数进行转发，这样可保证在后端真实服务器数量不变时，同一个用户的请求始终分发到同一机器上。                                                                           |
    | hdr(<name>): | 此算法根据 http 头进行转发，如果指定的 http 头名称不存在，则使用 roundrobin 算法进行策略转发。                                                                                                |

  - cookie：表示允许向 cookie 插入 SERVERID，每台服务器的 SERVERID 可在下面的 server 关键字中使用 cookie 关键字定义。

  - option httpchk：此选项表示启用 HTTP 的服务状态检测功能。HAProxy 作为一款专业的负载均衡器，它支持对 backend 部分指定的后端服务节点的健康检查，以保证在后端 backend 中某个节点不能服务时，把从 frotend 端进来的客户端请求分配至 backend 中其他健康节点上，从而保证整体服务的可用性。“option httpchk”的用法如下：

    | 参数    | 描述                                                                                                                                                                                                                                        |
    | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | method  | 表示 http 请求的方式，常用的有 OPTIONS、GET、HEAD 几种方式， 一般的健康检查可以使用 HEAD 方式进行，而不是采用 GET 方式，这是因为 HEAD 方式没有数据返回，仅检查 response 的 HEAD 是不是 200 状态。因此相对 GET 方式，HEAD 方式更快，更简单。 |
    | uri     | 表示要检测的 URL 地址，通过执行此 URL ，可以获取后端服务器的运行状态。在正常情况下将返回状态码 200，返回其他状态码均为异常状态。                                                                                                            |
    | version | 指定心跳检测时的 http 版本号。                                                                                                                                                                                                              |

  - server：这个关键字用来定义多个后端真实服务器，不能用于 defaults 和frontend部分。使用格式为：server <name> <address>[:port] [param*] 其中，每个参数含义如下：

    - check：表示启用对此后端服务器执行健康状态检查。

    - inter：设置健康状态检查的时间间隔，单位为毫秒。

    - rise：设置从故障状态转换至正常状态需要成功检查的次数，例如。“rise 2”表示 2 次检查正确就认为此服务器可用。

    - fall：设置后端服务器从正常状态转换为不可用状态需要检查的次数，例如，“fall 3”表示 3 次检查失败就认为此服务器不可用。

    - cookie：为指定的后端服务器设定 cookie 值，此处指定的值将在请求入站时被检查，第一次为此值挑选的后端服务器将在后

      <table>
      <tr>
        <td>name</td>
        <td colspan="2">为后端真实服务器指定一个内部名称，随便定义一个即可。</td>
      </tr>
      <tr>
        <td>address</td>
        <td colspan="2">后端真实服务器的 IP 地址或主机名。</td>
      </tr>
      <tr>
        <td>port</td>
        <td colspan="2">指定连接请求发往真实服务器时的目标端口。在未设定时，将使用客户端请求时的同一端口。</td>
      </tr>
        <td rowspan="8">[params*]</td>
        <td colspan="2">为后端服务器设定的一系列参数，可用参数较多，仅介绍常用的参数：</td>
      </tr>
      </tr>
        <td>check</td>
        <td>表示启用对此后端服务器执行健康状态检查。</td>
      </tr>
      </tr>
        <td>inter</td>
        <td>设置健康检查的时间间隔，单位为毫秒。</td>
      </tr>
      </tr>
        <td>rise</td>
        <td>设置从故障状态转化为正常状态需要成功检查的次数，例如：“rise：2”表示两次检查正确就认为此服务可用。</td>
      </tr>
      </tr>
        <td>fall</td>
        <td>设置后端服务器从正常状态转换为不可用状态需要检查的次数，例如：“fall：3”表示三次检查失败就认为此服务器不可用。</td>
      </tr>
      </tr>
        <td>cookie</td>
        <td>为指定的后端服务器设置 cookie 值，此处指定的值将在请求入站时被检查，第一次为此值挑选的后端服务器将在后续的请求中一直被选中，其目的在于实现持久连接的功能。上面的“cookie server1” 表示 web1 的 serverid 为 server1。同理，“cookie server2” 表示 web2 的 serverid 为 server2。</td>
      </tr>
      </tr>
        <td>weight</td>
        <td>设置后端真实服务器的权重，默认为 1，最大值为 256。设置为 0 表示不参与负载均衡。</td>
      </tr>
      </tr>
        <td>backup</td>
        <td>设置后端真实服务器的备份服务器，仅仅在后端真实服务器均不可用时才会启用。</td>
      </tr>
      </table>

- **listen** 部分

  此部分是 frontend 部分和 backend 部分的结合体。在 HAProxy1.3 版本之前，HAProxy 的所有配置选项都在这个部分中设置。为了保持兼容性，HAProxy 新的版本仍然保留了 listen 组件的配置方式。目前在 HAProxy 中，两种配置方式任选其一即可。

  这个部分通过listen 关键字定义了一个名为“admin_stats”的实例，其实就是定义了一个 HAProxy 的监控页面，每个选项的含义如下：

  - stats refresh：设置 HAProxy 监控统计页面自动刷新的时间。
  - stats uri：设置 HAProxy 监控统计页面的URL 路径，可随意指定。例如、指定“stats uri /haproxy-status”，就可以过 <http://IP:9188/haproxy-status> 查看。
  - stats realm：设置登录 HAProxy 统计页面时密码框上的文本提示信息。
  - stats auth：设置登录 HAProxy 统计页面的用户名和密码。用户名和密码通过冒号分割。可为监控页面设置多个用户名和密码，每行一个。
  - stats hide-version：用来隐藏统计页面上 HAProxy 的版本信息。
  - stats admin if TRUE：通过设置此选项，可以在监控页面上手工启用或禁用后端真实服务器，仅在 haproxy1.4.9 以后版本有效。

###### 一份完整的配置

```bash
global
    log 127.0.0.1 local0 info
    maxconn 4096
    user nobody
    group nobody
    daemon
    nbproc 1
    pidfile /usr/local/haproxy/logs/haproxy.pid
defaults
    mode http
    retries 3
    timeout connect 10s
    timeout client 20s
    timeout server 30s
    timeout check 5s
frontend www
    bind *:80
    mode  http
    option  httplog
    option  forwardfor
    option  httpclose
    log global
    #acl host_www hdr_dom(host) -i www.zb.com
    #acl host_img hdr_dom(host) -i img.zb.com

    #use_backend htmpool if host_www
    #use_backend imgpool if host_img
    default_backend htmpool
backend htmpool
    mode http
    option redispatch
    option abortonclose
    balance static-rr
    cookie SERVERID
    option httpchk GET /index.jsp
    server 237server 192.168.81.237:8080 cookie server1 weight 6 check inter 2000 rise 2 fall 3
    server iivey234 192.168.81.234:8080 cookie server2 weight 3 check inter 2000 rise 2 fall 3
backend imgpool
    mode http
    option redispatch
    option abortonclose
    balance static-rr
    cookie SERVERID
    option httpchk GET /index.jsp
    server host236 192.168.81.236:8080 cookie server1 weight 6 check inter 2000 rise 2 fall 3

listen admin_stats
    bind 0.0.0.0:9188
    mode http
    log 127.0.0.1 local0 err
    stats refresh 30s
    stats uri /haproxy-status
    stats realm welcome login\ Haproxy
    stats auth admin:admin123
    stats hide-version
    stats admin if TRUE

```

##### 安装HAProxy

下载HAProxy相关版本，这里下载haproxy-1.8.12.tar.gz，之后准备安装。

安装之前查看内核版本，根据内核版本选择编译参数

```bash
uname -r
```

解压HAProxy，并安装：

```bash
tar xf haproxy-1.8.12.tar.gz
cd haproxy-1.7.5
make TARGET=linux2628 PREFIX=/usr/local/haproxy
make install PREFIX=/usr/local/haproxy
```

安装成功之后，查看版本

```bash
/usr/local/haproxy/sbin/haproxy -v
```

##### 配置HAProxy

配置启动文件，复制haproxy文件到/usr/sbin下 ，复制haproxy脚本，到/etc/init.d下

```bash
cp /usr/local/haproxy/sbin/haproxy /usr/sbin/
cp ./examples/haproxy.init /etc/init.d/haproxy
chmod 755 /etc/init.d/haproxy
```

创建系统账号

```bash
useradd -r haproxy
```

创建配置文件

```bash
mkdir /etc/haproxy
vi /etc/haproxy/haproxy.cfg
```

更改配置文件

```bash
#全局配置
global
    #设置日志
    log 127.0.0.1 local0 info
    #当前工作目录
    chroot /usr/local/haproxy
    #用户与用户组
    user haproxy
    group haproxy
    #运行进程ID
    uid 99
    gid 99
    #守护进程启动
    daemon
    #最大连接数
    maxconn 4096

#默认配置
defaults
    #应用全局的日志配置
    log global
    #默认的模式mode {tcp|http|health}
    #TCP是4层，HTTP是7层，health只返回OK
    mode tcp
    #日志类别tcplog
    option tcplog
    #不记录健康检查日志信息
    option dontlognull
    #3次失败则认为服务不可用
    retries 3
    #每个进程可用的最大连接数
    maxconn 2000
    #连接超时
    timeout connect 5s
    #客户端超时
    timeout client 120s
    #服务端超时
    timeout server 120s

#绑定配置
listen rabbitmq_cluster
        bind 0.0.0.0:5671
        #配置TCP模式
        mode tcp
        #简单的轮询
        balance roundrobin
        #RabbitMQ集群节点配置
        server rmq_node1 10.110.8.34:5672 check inter 5000 rise 2 fall 3 weight 1
        server rmq_node2 10.110.8.38:5672 check inter 5000 rise 2 fall 3 weight 1

#haproxy监控页面地址
listen monitor
        bind 0.0.0.0:8100
        mode http
        option httplog
        stats enable
        stats uri /stats
        stats refresh 5s
```

##### 启动haproxy

```bash
service haproxy start
```

Haproxy 解决集群 session 共享问题，二种方法保持客户端 session 一致。

- 用户 IP 识别

  Haproxy 将用户 IP 经过 hash 计算后 指定到固定的真实服务器上（类似于 nginx 的 IP hash 指令）。

  配置指令： balance source。

  ```bash
  backend htmpool
          mode http
          option redispatch
          option abortonclose
          balance source
          cookie SERVERID
          option httpchk GET /index.jsp
          server 237server 192.168.81.237:8080 cookie server1 weight 6 check inter 2000 rise 2 fall 3
          server iivey234 192.168.81.234:8080 cookie server2 weight 3 check inter 2000 rise 2 fall 3
  ```

- cookie 识别

  haproxy 将WEB 服务端发送给客户端的 cookie 中插入(或添加加前缀)haproxy 定义的后端的服务器COOKIE ID。

  配置指令例举 cookie SESSION_COOKIE insert indirect nocache。

  ```bash
  backend htmpool
          mode http
          option    redispatch
          option    abortonclose
          balance  static-rr
          cookie    SERVERID   #cookie参数
          option    httpchk GET /index.jsp
          server    237server 192.168.81.237:8080 cookie server1 weight 6 check inter 2000 rise 2 fall 3   #server里面的cookie参数
          server    iivey234 192.168.81.234:8080 cookie server2 weight 3 check inter 2000 rise 2 fall 3   #server里面的cookie参数
  ```

### ActiveMQ

ActiveMQ 介于 ZeroMQ 和 RabbitMQ 之间。类似于 ZeroMQ，它可以部署于代理模式和 P2P（点对点）模式。类似于 RabbitMQ，它易于实现高级场景，而且只需付出低消耗，被誉为消息中间件的“瑞士军刀”。

支持 OpenWire、Stomp、AMQP v1.0、MQTT v3.1、REST、Ajax、Webservice 等多种协议，完全支持 JMS1.1 和 J2EE 1.4规范（事务、持久化、XA消息），支持持久化到数据库。但是 ActiveMQ 不够轻巧，而且对于队列较多的情况支持不好，据说还有丢消息的情况。

### Apollo

Apache 称 Apollo 为最快、最强健的 STOMP（简单“流”文本定向消息协议，它提供了一个可互操作的连接模式，允许 STOMP 客户端与任意 STOMP 消息代理（Broker）进行交互。STOMP 协议由于设计简单，易于开发客户端，因此在多种语言和多种平台上得到广泛地应用）服务器。支持 STOMP、AMQP、MQTT、OpenWire 协议，支持 Topic、Queue、持久订阅等消费形式，支持对消息的多种处理，支持安全性处理，支持 REST 管理 API。

### Kafka

#### Kafka 简介

##### Kafka是什么

Kafka是一种高吞吐量的分布式发布订阅消息系统（消息引擎系统），它可以处理消费者在网站中的所有动作流数据。 这种动作（网页浏览，搜索和其他用户的行动）是在现代网络上的许多社会功能的一个关键因素。 这些数据通常是由于吞吐量的要求而通过处理日志和日志聚合来解决。 对于像Hadoop一样的日志数据和离线分析系统，但又要求实时处理的限制，这是一个可行的解决方案。Kafka的目的是通过Hadoop的并行加载机制来统一线上和离线的消息处理，也是为了通过集群来提供实时的消息。

其实我们简单点理解就是系统A发送消息给kafka（消息引擎系统），系统B从kafka中读取A发送的消息。而kafka就是个中间商。

##### 消息系统简介

一个消息系统负责将数据从一个应用传递到另外一个应用，应用只需关注于数据，无需关注数据在两个或多个应用间是如何传递的。分布式消息传递基于可靠的消息队列，在客户端应用和消息系统之间异步传递消息。有两种主要的消息传递模式：**点对点传递模式、发布-订阅模式。大部分的消息系统选用发布-订阅模式**。**Kafka就是一种发布-订阅模式**。

###### 点对点消息传递模式

在点对点消息系统中，消息持久化到一个队列中。此时，将有一个或多个消费者消费队列中的数据。但是一条消息只能被消费一次。当一个消费者消费了队列中的某条数据之后，该条数据则从消息队列中删除。该模式即使有多个消费者同时消费数据，也能保证数据处理的顺序。这种架构描述示意图如下：

![img](https://github.com/chou401/pic-md/raw/master/27da57a28c192b5f1b8eed58fd8765af.png)

**生产者发送一条消息到queue，只有一个消费者能收到**。

###### 发布-订阅消息传递模式

在发布-订阅消息系统中，消息被持久化到一个topic中。与点对点消息系统不同的是，消费者可以订阅一个或多个topic，消费者可以消费该topic中所有的数据，同一条数据可以被多个消费者消费，数据被消费后不会立马删除。在发布-订阅消息系统中，消息的生产者称为发布者，消费者称为订阅者。该模式的示例图如下：

![img](https://github.com/chou401/pic-md/raw/master/7de02b63e52a56b2e6b5288f5b249fca.png)

**发布者发送到topic的消息，只有订阅了topic的订阅者才会收到消息**。

##### Kafka 简单理解

上面我们提到kafka是个中间商，我们为什么不能去掉这个中间商呢，凭着我们的想象也会觉得去掉这些消息引擎系统会更好吧，那我们来谈谈消息引擎系统存在的意义：

原因就是“**削峰填谷**”。这四个字简直比消息引擎本身还要有名气。

所谓的“削峰填谷”就是指缓冲上下游瞬时突发流量，使其更平滑。特别是对于那种发送能力很强的上游系统，如果没有消息引擎的保护，“脆弱”的下游系统可能会直接被压垮导致全链路服务“雪崩”。但是，一旦有了消息引擎，它能够有效地对抗上游的流量冲击，真正做到将上游的“峰”填满到“谷”中，避免了流量的震荡。消息引擎系统的另一大好处在于发送方和接收方的松耦合，这也在一定程度上简化了应用的开发，减少了系统间不必要的交互。

我们想象一下在双11期间我们购物的情景来形象的理解一下削峰填谷，感受一下Kafka在这中间是怎么去“抗”峰值流量的吧：

当我们点击某个商品以后进入付费页面，可是这个简单的流程中就可能包含多个子服务，比如点击购买按钮会调用订单系统生成对应的订单，而处理该订单会依次调用下游的多个子系统服务 ，比如调用支付宝和微信支付的接口、查询你的登录信息、验证商品信息等。显然上游的订单操作比较简单，所以它的 TPS（每秒事务处理量） 要远高于处理订单的下游服务，因此如果上下游系统直接对接，势必会出现下游服务无法及时处理上游订单从而造成订单堆积的情形。特别是当出现类似于秒杀这样的业务时，上游订单流量会瞬时增加，可能出现的结果就是直接压跨下游子系统服务。

解决此问题的一个常见做法是我们对上游系统进行限速，但这种做法对上游系统而言显然是不合理的，毕竟问题并不出现在它那里。所以更常见的办法是引入像 Kafka 这样的消息引擎系统来对抗这种上下游系统 TPS 的错配以及瞬时峰值流量。

还是这个例子，当引入了 Kafka 之后。上游订单服务不再直接与下游子服务进行交互。当新订单生成后它仅仅是向 Kafka Broker 发送一条订单消息即可。类似地，下游的各个子服务订阅 Kafka 中的对应主题，并实时从该主题的各自分区（Partition）中获取到订单消息进行处理，从而实现了上游订单服务与下游订单处理服务的解耦。这样当出现秒杀业务时，Kafka 能够将瞬时增加的订单流量全部以消息形式保存在对应的主题中，既不影响上游服务的 TPS，同时也给下游子服务留出了充足的时间去消费它们。这就是 Kafka 这类消息引擎系统的最大意义所在。

##### Kafka 的优点特点

- 解耦

  在项目启动之初来预测将来项目会碰到什么需求，是极其困难的。消息系统在处理过程中间插入了一个隐含的、基于数据的接口层，两边的处理过程都要实现这一接口。这允许你独立的扩展或修改两边的处理过程，只要确保它们遵守同样的接口约束。

- 冗余（副本）

  有些情况下，处理数据的过程会失败。除非数据被持久化，否则将造成丢失。消息队列把数据进行持久化直到它们已经被完全处理，通过这一方式规避了数据丢失风险。许多消息队列所采用的"插入-获取-删除"范式中，在把一个消息从队列中删除之前，需要你的处理系统明确的指出该消息已经被处理完毕，从而确保你的数据被安全的保存直到你使用完毕。

- 扩展性

  因为消息队列解耦了你的处理过程，所以增大消息入队和处理的频率是很容易的，只要另外增加处理过程即可。不需要改变代码、不需要调节参数。扩展就像调大电力按钮一样简单。

- 灵活性&峰值处理能力

  在访问量剧增的情况下，应用仍然需要继续发挥作用，但是这样的突发流量并不常见；如果为以能处理这类峰值访问为标准来投入资源随时待命无疑是巨大的浪费。使用消息队列能够使关键组件顶住突发的访问压力，而不会因为突发的超负荷的请求而完全崩溃。

- 可恢复性

  系统的一部分组件失效时，不会影响到整个系统。消息队列降低了进程间的耦合度，所以即使一个处理消息的进程挂掉，加入队列中的消息仍然可以在系统恢复后被处理。

- 顺序保证

  在大多使用场景下，数据处理的顺序都很重要。大部分消息队列本来就是排序的，并且能保证数据会按照特定的顺序来处理。Kafka保证一个Partition内的消息的有序性。

- 缓冲

  在任何重要的系统中，都会有需要不同的处理时间的元素。例如，加载一张图片比应用过滤器花费更少的时间。消息队列通过一个缓冲层来帮助任务最高效率的执行———写入队列的处理会尽可能的快速。该缓冲有助于控制和优化数据流经过系统的速度。

- 异步通信

  很多时候，用户不想也不需要立即处理消息。消息队列提供了异步处理机制，允许用户把一个消息放入队列，但并不立即处理它。想向队列中放入多少消息就放多少，然后在需要的时候再去处理它们。

#### Kafka中的术语解释概述

下图展示了Kafka的相关术语以及之间的关系：

![dfef98a36bb160ddd779634de5e6c4b4](https://github.com/chou401/pic-md/raw/master/dfef98a36bb160ddd779634de5e6c4b4.png)

- 上图中一个topic配置了3个partition。Partition1有两个offset：0和1。Partition2有4个offset。Partition3有1个offset。副本的id和副本所在的机器的id恰好相同。
- 如果一个topic的副本数为3，那么Kafka将在集群中为每个partition创建3个相同的副本。集群中的每个broker存储一个或多个partition。多个producer和consumer可同时生产和消费数据。

##### broker

- Kafka 集群包含一个或多个服务器，服务器节点称为broker。
- broker存储topic的数据。如果某topic有N个partition，集群有N个broker，那么每个broker存储该topic的一个partition。
- 如果某topic有N个partition，集群有(N+M)个broker，那么其中有N个broker存储该topic的一个partition，剩下的M个broker不存储该topic的partition数据。
- 如果某topic有N个partition，集群中broker数目少于N个，那么一个broker存储该topic的一个或多个partition。在实际生产环境中，尽量避免这种情况的发生，这种情况容易导致Kafka集群数据不均衡。

##### Topic

- 每条发布到Kafka集群的消息都有一个类别，这个类别被称为Topic。（物理上不同Topic的消息分开存储，逻辑上一个Topic的消息虽然保存于一个或多个broker上但用户只需指定消息的Topic即可生产或消费数据而不必关心数据存于何处）。
- 类似于数据库的表名。

##### Partition

- topic中的数据分割为一个或多个partition。每个topic至少有一个partition。每个partition中的数据使用多个segment文件存储。partition中的数据是有序的，不同partition间的数据丢失了数据的顺序。如果topic有多个partition，消费数据时就不能保证数据的顺序。在需要严格保证消息的消费顺序的场景下，需要将partition数目设为1。

##### Producer

- 生产者即数据的发布者，该角色将消息发布到Kafka的topic中。broker接收到生产者发送的消息后，broker将该消息**追加**到当前用于追加数据的segment文件中。生产者发送的消息，存储到一个partition中，生产者也可以指定数据存储的partition。

##### Consumer

- 消费者可以从broker中读取数据。消费者可以消费多个topic中的数据。

##### Consumer Group

- 每个Consumer属于一个特定的Consumer Group（可为每个Consumer指定group name，若不指定group name则属于默认的group）。

##### Leader

- 每个partition有多个副本，其中有且仅有一个作为Leader，Leader是当前负责数据的读写的partition。

##### Follower

- Follower跟随Leader，所有写请求都通过Leader路由，数据变更会广播给所有Follower，Follower与Leader保持数据同步。如果Leader失效，则从Follower中选举出一个新的Leader。当Follower与Leader挂掉、卡住或者同步太慢，leader会把这个follower从“in sync replicas”（ISR）列表中删除，重新创建一个Follower。

#### Kafka架构

![img](https://github.com/chou401/pic-md/raw/master/cb62ef93fb5ef2f406a1ed0fe3a079a8.png)

如上图所示，一个典型的Kafka集群中包含若干Producer（可以是web前端产生的Page View，或者是服务器日志，系统CPU、Memory等），若干broker（Kafka支持水平扩展，一般broker数量越多，集群吞吐率越高），若干Consumer Group，以及一个Zookeeper集群。Kafka通过Zookeeper管理集群配置，选举leader，以及在Consumer Group发生变化时进行rebalance。Producer使用push模式将消息发布到broker，Consumer使用pull模式从broker订阅并消费消息。

##### Topics和Partition

Topic在逻辑上可以被认为是一个queue，每条消费都必须指定它的Topic，可以简单理解为必须指明把这条消息放进哪个queue里。为了使得Kafka的吞吐率可以线性提高，物理上把Topic分成一个或多个Partition，每个Partition在物理上对应一个文件夹，该文件夹下存储这个Partition的所有消息和索引文件。创建一个topic时，同时可以指定分区数目，分区数越多，其吞吐量也越大，但是需要的资源也越多，同时也会导致更高的不可用性，kafka在接收到生产者发送的消息之后，会根据均衡策略将消息存储到不同的分区中。**因为每条消息都被append到该Partition中，属于顺序写磁盘**，因此效率非常高（经验证，顺序写磁盘效率比随机写内存还要高，这是Kafka高吞吐率的一个很重要的保证）。

![img](https://github.com/chou401/pic-md/raw/master/ce47715713754188bd90492eaec2b67c.png)

对于传统的message queue而言，一般会删除已经被消费的消息，而Kafka集群会保留所有的消息，无论其被消费与否。当然，因为磁盘限制，不可能永久保留所有数据（实际上也没必要），因此Kafka提供两种策略删除旧数据。一是基于时间，二是基于Partition文件大小。例如可以通过配置$KAFKA_HOME/config/server.properties，让Kafka删除一周前的数据，也可在Partition文件超过1GB时删除旧数据，配置如下所示：

```properties
 符合删除条件的日志文件的最小时间
log.retention.hours=168
 日志段文件的最大大小。当达到这个大小时，将创建一个新的日志段。
log.segment.bytes=1073741824
 检查日志段的时间间隔，以确定它们是否可以根据保留策略被删除
log.retention.check.interval.ms=300000
 如果设置了log.cleaner.enable =true，则清理器将被启用，然后可以为日志压缩标记单个日志。
log.cleaner.enable=f
```

因为Kafka读取特定消息的**时间复杂度为O(1)**，即与文件大小无关，所以这里删除过期文件与提高Kafka性能无关。选择怎样的删除策略只与磁盘以及具体的需求有关。另外，Kafka会为每一个Consumer Group保留一些metadata信息——当前消费的消息的position，也即offset。这个offset由Consumer控制。正常情况下Consumer会在消费完一条消息后递增该offset。当然，Consumer也可将offset设成一个较小的值，重新消费一些消息。因为offset由Consumer控制，所以Kafka broker是无状态的，它不需要标记哪些消息被哪些消费过，也不需要通过broker去保证同一个Consumer Group只有一个Consumer能消费某一条消息，因此也就不需要锁机制，这也为Kafka的高吞吐率提供了有力保障。

##### Producer消息路由

Producer发送消息到broker时，会根据Paritition机制选择将其存储到哪一个Partition。如果Partition机制设置合理，所有消息可以均匀分布到不同的Partition里，这样就实现了负载均衡。如果一个Topic对应一个文件，那这个文件所在的机器I/O将会成为这个Topic的性能瓶颈，而有了Partition后，不同的消息可以并行写入不同broker的不同Partition里，极大的提高了吞吐率。可以在$KAFKA_HOME/config/server.properties中通过配置项num.partitions来指定新建Topic的默认Partition数量，也可在创建Topic时通过参数指定，同时也可以在Topic创建之后通过Kafka提供的工具修改。

在发送一条消息时，可以指定这条消息的key，Producer根据这个key和Partition机制来判断应该将这条消息发送到哪个Partition。Paritition机制可以通过指定Producer的paritition.class这一参数来指定，该class必须实现kafka.producer.Partitioner接口。

##### Consumer Group 消费群体

使用Consumer high level API时，同一Topic的一条消息只能被同一个Consumer Group内的一个Consumer消费，但多个Consumer Group可同时消费这一消息。

![img](https://github.com/chou401/pic-md/raw/master/edd5bf39ad20cf985f45988c75446af7.png)

这是**Kafka用来实现一个Topic消息的广播（发给所有的Consumer）和单播（发给某一个Consumer）的手段**。一个Topic可以对应多个Consumer Group。如果需要实现广播，只要每个Consumer有一个独立的Group就可以了。要实现单播只要所有的Consumer在同一个Group里。用Consumer Group还可以将Consumer进行自由的分组而不需要多次发送消息到不同的Topic。

实际上，**Kafka的设计理念之一就是同时提供离线处理和实时处理**。根据这一特性，可以使用Storm这种实时流处理系统对消息进行实时在线处理，同时使用Hadoop这种批处理系统进行离线处理，还可以同时将数据实时备份到另一个数据中心，只需要保证这三个操作所使用的Consumer属于不同的Consumer Group即可。

##### Push与Pull

作为一个消息系统，Kafka遵循了传统的方式，选择由**Producer向broker push消息并由Consumer从broker pull消息**。一些logging-centric system，比如Facebook的Scribe和Cloudera的Flume，采用push模式。事实上，push模式和pull模式各有优劣。

push模式很难适应消费速率不同的消费者，因为消息发送速率是由broker决定的。push模式的目标是尽可能以最快速度传递消息，但是这样很容易造成Consumer来不及处理消息，典型的表现就是拒绝服务以及网络拥塞。而pull模式则可以根据Consumer的消费能力以适当的速率消费消息。

**对于Kafka而言，pull模式更合适**。pull模式可简化broker的设计，Consumer可自主控制消费消息的速率，同时Consumer可以自己控制消费方式——**即可批量消费也可逐条消费**，同时还能选择不同的提交方式从而实现不同的传输语义。

##### Kafka delivery guarantee

有这么几种可能的delivery guarantee：

> At most once 　　消息可能会丢，但绝不会重复传输
>
> At least one 　　 消息绝不会丢，但可能会重复传输
>
> Exactly once 　　 每条消息肯定会被传输一次且仅传输一次，很多时候这是用户所想要的。

当Producer向broker发送消息时，一旦这条消息被commit，因为replication的存在，它就不会丢。但是如果Producer发送数据给broker后，遇到网络问题而造成通信中断，那Producer就无法判断该条消息是否已经commit。虽然Kafka无法确定网络故障期间发生了什么，但是Producer可以生成一种类似于主键的东西，发生故障时幂等性的重试多次，这样就做到了Exactly once。

接下来讨论的是消息从broker到Consumer的delivery guarantee语义。（仅针对Kafka consumer high level API）。Consumer在从broker读取消息后，可以选择commit，该操作会在Zookeeper中保存该Consumer在该Partition中读取的消息的offset。该Consumer下一次再读该Partition时会从下一条开始读取。如未commit，下一次读取的开始位置会跟上一次commit之后的开始位置相同。当然可以将Consumer设置为autocommit，即Consumer一旦读到数据立即自动commit。如果只讨论这一读取消息的过程，那Kafka是确保了Exactly once。但实际使用中应用程序并非在Consumer读取完数据就结束了，而是要进行进一步处理，而数据处理与commit的顺序在很大程度上决定了消息从broker和consumer的delivery guarantee semantic。

**Kafka默认保证At least once**，并且允许通过设置Producer异步提交来实现At most once。而Exactly once要求与外部存储系统协作，幸运的是Kafka提供的offset可以非常直接非常容易的使用这种方式。

##### ack 机制

producer端设置`request.required.acks`。

- **request.required.acks = 0**：只要请求已发送出去，就算是发送完了，不关心有没有写成功。性能很好，如果是对一些日志进行分析，可以承受丢数据的情况，用这个参数，性能会很好。吞吐量高。
- **request.required.acks = 1（默认）**：发送一条消息，当leader partition写入成功以后，才算写入成功。不过这种方式也有丢数据的可能。
- **request.required.acks = -1/all**：需要ISR列表里面，所有 replica 都写完以后，这条消息才算写入成功。这才是 ISR 的正确应用场景，可靠性最高。

###### ISR 的最坏情况

排除所有 replica 全部故障，ISR 的最坏情况就是 ISR 中只剩 leader 自己一个了。退化成 ack=1 的情况了，甚至还不如 ack=1。ack=1，说的是 producer 不等服务器完全同步完 ISR，只要 leader 写入成功就行了，但是可没说不进行同步了。该有的同步过程还是会进行的，但凡能同步，kafka 肯定会同步的，而 ack=1 的最坏情况，也是 ISR 只剩下 leader 了。坏疽话说，producer 为了提高吞吐量，没等 ISR 全部同步，但是心里还是希望接口同步完成的。而这种 leader 孤家寡人的最坏情况，书上说“退化成 ack=1”，不足以说明问题的严重性。

ISR 的最坏情况，会使 ack=-1 退化成 ack=1 的最坏情况，完全背离我们设置-1 的初衷（因为特定是同步不了了）。

数据不丢失的方案：

1. 分区副本 >= 2
2. acks = -1
3. min.insync.replicas >= 2

下面给出此时leader出现故障的情况，可以看出，此时数据可能重复。

![img](https://github.com/chou401/pic-md/raw/master/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5ZSP5ZmX,size_20,color_FFFFFF,t_70,g_se,x_16.jpeg)

Leader维护了⼀个动态的 in-sync replica set（ISR）：和 Leader 保持同步的 Follower 集合。当 ISR 集合中的 Follower 完成数据的同步之后，Leader 就会给 Follower 发送 ACK。如果 Follower ⻓时间未向 Leader 同步数据，则该 Follower 将被踢出 ISR 集合，该时间阈值由replica.lag.time.max.ms 参数设定。Leader 发⽣故障后，就会从 ISR 中选举出新的 Leader。
kafka服务端中min.insync.replicas。 如果我们不设置的话，默认这个值是1。一个leader partition会维护一个ISR列表，这个值就是限制ISR列表里面 至少得有几个副本，比如这个值是2，那么当ISR列表里面只有一个副本的时候，往这个分区插入数据的时候会报错。

#### Kafka高可用

##### 高可用的由来

###### 为何需要Replication

- Kafka在0.8以前的版本中，是没有Replication的，一旦某一个Broker宕机，则其上所有的Partition数据都不可被消费，这与Kafka数据持久性及Delivery Guarantee的设计目标相悖。同时Producer都不能再将数据存于这些Partition中。
- 如果Producer使用同步模式则Producer会在尝试重新发送message.send.max.retries（默认值为3）次后抛出Exception，用户可以选择停止发送后续数据也可选择继续选择发送。而前者会造成数据的阻塞，后者会造成本应发往该Broker的数据的丢失。
- 如果Producer使用异步模式，则Producer会尝试重新发送message.send.max.retries（默认值为3）次后记录该异常并继续发送后续数据，这会造成数据丢失并且用户只能通过日志发现该问题。同时，Kafka的Producer并未对异步模式提供callback接口。
- 由此可见，在没有Replication的情况下，一旦某机器宕机或者某个Broker停止工作则会造成整个系统的可用性降低。随着集群规模的增加，整个集群中出现该类异常的几率大大增加，因此对于生产系统而言Replication机制的引入非常重要。

###### Leader Election（选举机制）

- 引入Replication之后，同一个Partition可能会有多个Replica，而这时需要在这些Replication之间选出一个Leader，Producer和Consumer只与这个Leader交互，其它Replica作为Follower从Leader中复制数据。
- 因为需要保证同一个Partition的多个Replica之间的数据一致性（其中一个宕机后其它Replica必须要能继续服务并且即不能造成数据重复也不能造成数据丢失）。如果没有一个Leader，所有Replica都可同时读/写数据，那就需要保证多个Replica之间互相（N×N条通路）同步数据，数据的一致性和有序性非常难保证，大大增加了Replication实现的复杂性，同时也增加了出现异常的几率。而引入Leader后，只有Leader负责数据读写，Follower只向Leader顺序Fetch数据（N条通路），系统更加简单且高效。

##### Kafka HA设计解析

###### 如何将所有Replica均匀分布到整个集群

为了更好的做负载均衡，Kafka尽量将所有的Partition均匀分配到整个集群上。一个典型的部署方式是一个Topic的Partition数量大于Broker的数量。同时为了提高Kafka的容错能力，也需要将同一个Partition的Replica尽量分散到不同的机器。实际上，如果所有的Replica都在同一个Broker上，那一旦该Broker宕机，该Partition的所有Replica都无法工作，也就达不到HA的效果。同时，如果某个Broker宕机了，需要保证它上面的负载可以被均匀的分配到其它幸存的所有Broker上。

Kafka分配Replica的算法如下：

1. 将所有Broker（假设共n个Broker）和待分配的Partition排序。
2. 将第i个Partition分配到第（i mod n）个Broker上。
3. 将第i个Partition的第j个Replica分配到第（(i + j) mode n）个Broker上。

###### Data Replication（副本策略）

Kafka的高可靠性的保障来源于其健壮的副本（replication）策略。

1.消息传递同步策略

Producer在发布消息到某个Partition时，先通过ZooKeeper找到该Partition的Leader，然后无论该Topic的Replication Factor为多少，Producer只将该消息发送到该Partition的Leader。Leader会将该消息写入其本地Log。每个Follower都从Leader pull数据。这种方式上，Follower存储的数据顺序与Leader保持一致。Follower在收到该消息并写入其Log后，向Leader发送ACK。一旦Leader收到了ISR中的所有Replica的ACK，该消息就被认为已经commit了，Leader将增加HW并且向Producer发送ACK。

为了提高性能，**每个Follower在接收到数据后就立马向Leader发送ACK，而非等到数据写入Log中**。因此，对于已经commit的消息，Kafka只能保证它被存于多个Replica的内存中，而不能保证它们被持久化到磁盘中，也就不能完全保证异常发生后该条消息一定能被Consumer消费。

Consumer读消息也是从Leader读取，**只有被commit过的消息才会暴露给Consumer**。

Kafka Replication的数据流如下图所示：

![image-20230703112926417](https://github.com/chou401/pic-md/raw/master/image-20230703112926417.png)

2.ACK前需要保证有多少个备份

对于Kafka而言，定义一个Broker是否“活着”包含两个条件：

- 一是它必须维护与ZooKeeper的session（这个通过ZooKeeper的Heartbeat机制来实现）。
- 二是Follower必须能够及时将Leader的消息复制过来，不能“落后太多”。

Leader会跟踪与其保持同步的Replica列表，该列表称为ISR（即in-sync Replica）。如果一个Follower宕机，或者落后太多，Leader将把它从ISR中移除。这里所描述的“落后太多”指Follower复制的消息落后于Leader后的条数超过预定值（该值可在\$KAFKA_HOME/config/server.properties中通过replica.lag.max.messages配置，其默认值是4000）或者Follower超过一定时间（该值可在\$KAFKA_HOME/config/server.properties中通过replica.lag.time.max.ms来配置，其默认值是10000）未向Leader发送fetch请求。

Kafka的复制机制既不是完全的同步复制，也不是单纯的异步复制。事实上，完全同步复制要求所有能工作的Follower都复制完，这条消息才会被认为commit，这种复制方式极大的影响了吞吐率（高吞吐率是Kafka非常重要的一个特性）。而异步复制方式下，Follower异步的从Leader复制数据，数据只要被Leader写入log就被认为已经commit，这种情况下如果Follower都复制完都落后于Leader，而如果Leader突然宕机，则会丢失数据。而Kafka的这种使用ISR的方式则很好的均衡了确保数据不丢失以及吞吐率。Follower可以批量的从Leader复制数据，这样极大的提高复制性能（批量写磁盘），极大减少了Follower与Leader的差距。

需要说明的是，Kafka只解决fail/recover，不处理“Byzantine”（“拜占庭”）问题。一条消息只有被ISR里的所有Follower都从Leader复制过去才会被认为已提交。这样就避免了部分数据被写进了Leader，还没来得及被任何Follower复制就宕机了，而造成数据丢失（Consumer无法消费这些数据）。而对于Producer而言，它可以选择是否等待消息commit，这可以通过request.required.acks来设置。这种机制确保了只要ISR有一个或以上的Follower，一条被commit的消息就不会丢失。

3.Leader Election算法

Leader选举本质上是一个分布式锁，有两种方式实现基于ZooKeeper的分布式锁：

- 节点名称唯一性：多个客户端创建一个节点，只有成功创建节点的客户端才能获得锁。
- 临时顺序节点：所有客户端在某个目录下创建自己的临时顺序节点，只有序号最小的才获得锁。

一种非常常用的选举leader的方式是“Majority Vote”（“少数服从多数”），但Kafka并未采用这种方式。这种模式下，如果我们有2f+1个Replica（包含Leader和Follower），那在commit之前必须保证有f+1个Replica复制完消息，为了保证正确选出新的Leader，fail的Replica不能超过f个。因为在剩下的任意f+1个Replica里，至少有一个Replica包含有最新的所有消息。这种方式有个很大的优势，系统的latency只取决于最快的几个Broker，而非最慢那个。Majority Vote也有一些劣势，为了保证Leader Election的正常进行，它所能容忍的fail的follower个数比较少。如果要容忍1个follower挂掉，必须要有3个以上的Replica，如果要容忍2个Follower挂掉，必须要有5个以上的Replica。也就是说，在生产环境下为了保证较高的容错程度，必须要有大量的Replica，而大量的Replica又会在大数据量下导致性能的急剧下降。这就是这种算法更多用在ZooKeeper这种共享集群配置的系统中而很少在需要存储大量数据的系统中使用的原因。例如HDFS的HA Feature是基于majority-vote-based journal，但是它的数据存储并没有使用这种方式。

Kafka在ZooKeeper中动态维护了一个ISR（in-sync replicas），这个ISR里的所有Replica都跟上了leader，只有ISR里的成员才有被选为Leader的可能。在这种模式下，对于f+1个Replica，一个Partition能在保证不丢失已经commit的消息的前提下容忍f个Replica的失败。在大多数使用场景中，这种模式是非常有利的。事实上，为了容忍f个Replica的失败，Majority Vote和ISR在commit前需要等待的Replica数量是一样的，但是ISR需要的总的Replica的个数几乎是Majority Vote的一半。

虽然Majority Vote与ISR相比有不需等待最慢的Broker这一优势，但是Kafka作者认为Kafka可以通过Producer选择是否被commit阻塞来改善这一问题，并且节省下来的Replica和磁盘使得ISR模式仍然值得。

4.如何处理所有Replica都不工作

在ISR中至少有一个follower时，Kafka可以确保已经commit的数据不丢失，但如果某个Partition的所有Replica都宕机了，就无法保证数据不丢失了。这种情况下有两种可行的方案：

1. 等待ISR中的任一个Replica“活”过来，并且选它作为Leader
2. 选择第一个“活”过来的Replica（不一定是ISR中的）作为Leader

这就需要在可用性和一致性当中作出一个简单的折衷。如果一定要等待ISR中的Replica“活”过来，那不可用的时间就可能会相对较长。而且如果ISR中的所有Replica都无法“活”过来了，或者数据都丢失了，这个Partition将永远不可用。选择第一个“活”过来的Replica作为Leader，而这个Replica不是ISR中的Replica，那即使它并不保证已经包含了所有已commit的消息，它也会成为Leader而作为consumer的数据源（前文有说明，所有读写都由Leader完成）。Kafka0.8.\*使用了第二种方式。根据Kafka的文档，在以后的版本中，Kafka支持用户通过配置选择这两种方式中的一种，从而根据不同的使用场景选择高可用性还是强一致性。

5.选举Leader

最简单最直观的方案是，所有Follower都在ZooKeeper上设置一个Watch，一旦Leader宕机，其对应的ephemeral znode会自动删除，此时所有Follower都尝试创建该节点，而创建成功者（ZooKeeper保证只有一个能创建成功）即是新的Leader，其它Replica即为Follower。

但是该方法会有3个问题：

- **split-brain**： 这是由ZooKeeper的特性引起的，虽然ZooKeeper能保证所有Watch按顺序触发，但并不能保证同一时刻所有Replica“看”到的状态是一样的，这就可能造成不同Replica的响应不一致
- **herd effect**： 如果宕机的那个Broker上的Partition比较多，会造成多个Watch被触发，造成集群内大量的调整
- **ZooKeeper负载过重**： 每个Replica都要为此在ZooKeeper上注册一个Watch，当集群规模增加到几千个Partition时ZooKeeper负载会过重。

Kafka 0.8.\*的**Leader Election**方案解决了上述问题，它在所有broker中选出一个controller，所有Partition的Leader选举都由controller决定。controller会将Leader的改变直接通过RPC的方式（比ZooKeeper Queue的方式更高效）通知需为此作为响应的Broker。同时controller也负责增删Topic以及Replica的重新分配。

##### AR、ISR、LEO、HW

- **AR**： Assigned Replicas的缩写，是每个partition下所有副本（replicas）的统称；
- **ISR**： 副本同步队列（In-Sync Replicas）的缩写，是指副本同步队列，ISR是AR中的一个子集；
- **LEO**：日志末端位移（Log End Offset）的缩写，表示每个partition的log最后一条Message的位置。新消息写入时将分配的偏移量（Offset）值，从0开始，随着消息不断写入递增。
- **HW**： 高水位（High Watermark）的缩写，是指consumer能够看到的此partition的位置。 取一个partition对应的ISR中最小的LEO作为HW，consumer最多只能消费到HW所在的位置。

kafka 中为了防止 log 文件过大导致数据定位效率低下而采取了分片和索引机制，将每个物理上的 partition 分为多个 segment。每个 segment 对应两个文件--“.index"文件和”.log“文件。”.index“ 文件存储大量的索引信息，”.log" 文件存储大量的数据，索引文件中的元数据指向对应数据文件中 message 的物理偏移地址。

但是对于上层应用来说，可以将partition看成最小的存储单元（一个由多个segment文件拼接而成的“巨型”文件），每个partition都由一些列有序的、不可变的消息组成，这些消息被连续的追加到partition中。

![image-20230703112608060](https://github.com/chou401/pic-md/raw/master/image-20230703112608060.png)

###### ISR和AR

ISR (In-Sync Replicas)，这个是指副本同步队列。副本数对Kafka的吞吐率是有一定的影响，但极大的增强了可用性。默认情况下Kafka的replica数量为1，即每个partition都有一个唯一的leader，为了确保消息的可靠性，通常应用中将其值(由broker的参数offsets.topic.replication.factor指定)大小设置为大于1，比如3。 所有的副本（replicas）统称为Assigned Replicas，即AR。ISR是AR中的一个子集，由leader维护ISR列表，follower从leader同步数据有一些延迟（包括延迟时间replica.lag.time.max.ms和延迟条数replica.lag.max.messages两个维度, 从 0.9.0.0 版本后中只支持replica.lag.time.max.ms这个维度），任意一个超过阈值都会把follower剔除出ISR, 存入OSR（Outof-Sync Replicas）列表，新加入的follower也会先存放在OSR中。**AR=ISR+OSR**。

![image-20210918150431039](https://github.com/chou401/pic-md/raw/master/image202304051925825.png)

**为什么在Kafka 0.9.0.0版本后移除了replica.lag.max.messages参数而只保留了replica.lag.time.max.ms作为ISR中副本管理的参数呢？**

replica.lag.max.messages表示当前某个副本落后leader的消息数量超过了这个参数的值，那么leader就会把follower从ISR中删除。假设设置replica.lag.max.messages=4，那么如果producer一次传送至broker的消息数量都小于4条时，因为在leader接受到producer发送的消息之后而follower副本开始拉取这些消息之前，follower落后leader的消息数不会超过4条消息，故此没有follower移出ISR，所以这时候replica.lag.max.message的设置似乎是合理的。但是producer发起瞬时高峰流量，producer一次发送的消息超过4条时，也就是超过replica.lag.max.messages，此时follower都会被认为是与leader副本不同步了，从而被踢出了ISR。但实际上这些follower都是存活状态的且没有性能问题。那么在之后追上leader,并被重新加入了ISR。于是就会出现它们不断地剔出ISR然后重新回归ISR，这无疑增加了无谓的性能损耗。而且这个参数是broker全局的。设置太大了，影响真正“落后”follower的移除；设置的太小了，导致follower的频繁进出。无法给定一个合适的replica.lag.max.messages的值，故此，新版本的Kafka移除了这个参数。

###### HW和LEO

上面有简单说到HW是HighWatermark的缩写，是指consumer能够看到的此partition的位置；而LEO是LogEndOffset的缩写，表示每个partition的log最后一条Message的位置。也就是，我们取一个partition对应的ISR中最小的LEO作为HW，consumer最多只能消费到HW所在的位置。**消费者能消费的数据 = [LW，HW）**。

每个replica都有自己的HW，leader和follower各自负责更新自己的HW的状态。对于leader新写入的消息，consumer不能立刻消费，leader会等待该消息被所有ISR中的replicas同步后更新HW，此时消息才能被consumer消费。这样就保证了如果leader所在的broker失效，该消息仍然可以从新选举的leader中获取。对于来自内部broker的读取请求，没有HW的限制。

![img](https://github.com/chou401/pic-md/raw/master/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3dlaXhpbl80MzIzMDY4Mg==,size_16,color_FFFFFF,t_70.png)

**由此可见，Kafka的复制机制既不是完全的同步复制，也不是单纯的异步复制。**

事实上，同步复制要求所有能工作的follower都复制完，这条消息才会被commit，这种复制方式极大的影响了吞吐率。而异步复制方式下，follower异步的从leader复制数据，数据只要被leader写入log就被认为已经commit，这种情况下如果follower都还没有复制完，落后于leader时，突然leader宕机，则会丢失数据。而Kafka的这种使用ISR的方式则很好的均衡了确保数据不丢失以及吞吐率。

Kafka的ISR的管理最终都会反馈到Zookeeper节点上。具体位置为：**/brokers/topics/[topic]/partitions/[partition]/state**

**目前有两个地方会对这个Zookeeper的节点进行维护：**

1. Controller来维护：Kafka集群中的其中一个Broker会被选举为Controller，主要负责Partition管理和副本状态管理，也会执行类似于重分配partition之类的管理任务。在符合某些特定条件下，Controller下的LeaderSelector会选举新的leader，ISR和新的leader_epoch及controller_epoch写入Zookeeper的相关节点中。同时发起LeaderAndIsrRequest通知所有的replicas。
2. leader来维护：leader有单独的线程定期检测ISR中follower是否脱离ISR, 如果发现ISR变化，则会将新的ISR的信息返回到Zookeeper的相关节点中。

#### HA相关ZooKeeper结构

![img](https://github.com/chou401/pic-md/raw/master/c9a549eafe1ef71c22152b41c728bb58.png)

##### admin

- 该目录下znode只有在有相关操作时才会存在，操作结束时会将其删除
- /admin/reassign_partitions用于将一些Partition分配到不同的broker集合上。对于每个待重新分配的Partition，Kafka会在该znode上存储其所有的Replica和相应的Broker id。该znode由管理进程创建并且一旦重新分配成功它将会被自动移除。

##### HA broker

- 即/brokers/ids/[brokerId]）存储“活着”的broker信息。
- topic注册信息（/brokers/topics/[topic]），存储该topic的所有partition的所有replica所在的broker id，第一个replica即为preferred replica，对一个给定的partition，它在同一个broker上最多只有一个replica,因此broker id可作为replica id。

##### controller

- /controller -> int (broker id of the controller)存储当前controller的信息
- /controller_epoch -> int (epoch)直接以整数形式存储controller epoch，而非像其它znode一样以JSON字符串形式存储。

#### producer发布消息

##### 写入方式

producer 采用 push 模式将消息发布到 broker，每条消息都被 append 到 patition 中，属于顺序写磁盘（顺序写磁盘效率比随机写内存要高，保障 kafka 吞吐率）。

##### 消息路由

producer 发送消息到 broker 时，会根据分区算法选择将其存储到哪一个 partition。其路由机制为：

- 指定了 patition，则直接使用；
- 未指定 patition 但指定 key，通过对 key 的 value 进行hash 选出一个
- patition 和 key 都未指定，使用轮询选出一个 patition。

##### 写入流程

producer 写入消息序列图如下所示：

![img](https://github.com/chou401/pic-md/raw/master/3b45ec04ecea8ba94ca092b4de195fa5.png)

流程说明：

- producer 先从 zookeeper 的 "/brokers/.../state" 节点找到该 partition 的 leader。
- producer 将消息发送给该 leader。
- leader 将消息写入本地 log。
- followers 从 leader pull 消息，写入本地 log 后 leader 发送 ACK。
- leader 收到所有 ISR 中的 replica 的 ACK 后，增加 HW（high watermark，最后 commit 的 offset） 并向 producer 发送 ACK。

#### broker保存消息

##### 存储方式

物理上把 topic 分成一个或多个 patition（对应 server.properties 中的 num.partitions=3 配置），每个 patition 物理上对应一个文件夹（该文件夹存储该 patition 的所有消息和索引文件），如下：

![img](https://github.com/chou401/pic-md/raw/master/90540631f5560f08b643d73401e9e73e.png)

##### 存储策略

无论消息是否被消费，kafka 都会保留所有消息。有两种策略可以删除旧数据：

> 基于时间：log.retention.hours=168
>
> 基于大小：log.retention.bytes=1073741824

#### Topic的创建和删除

##### 创建topic

创建 topic 的序列图如下所示：

![img](https://github.com/chou401/pic-md/raw/master/83e7411c3ebbb7c7c0d84a758d22e184.png)

流程说明：

- controller 在 ZooKeeper 的 /brokers/topics 节点上注册 watcher，当 topic 被创建，则 controller 会通过 watch 得到该 topic 的 partition/replica 分配。
- controller从 /brokers/ids 读取当前所有可用的 broker 列表，对于 set_p 中的每一个 partition：
  - 从分配给该 partition 的所有 replica（称为AR）中任选一个可用的 broker 作为新的 leader，并将AR设置为新的 ISR
  - 将新的 leader 和 ISR 写入 /brokers/topics/[topic]/partitions/[partition]/state
- controller 通过 RPC 向相关的 broker 发送 LeaderAndISRRequest

##### 删除topic

删除 topic 的序列图如下所示：

![img](https://github.com/chou401/pic-md/raw/master/e0d44eb05a13c1e59b00b7d39ecee0c8.png)

流程说明：

- controller 在 zooKeeper 的 /brokers/topics 节点上注册 watcher，当 topic 被删除，则 controller 会通过 watch 得到该 topic 的 partition/replica 分配。
- 若 delete.topic.enable=false，结束；否则 controller 注册在 /admin/delete_topics 上的 watch 被 fire，controller 通过回调向对应的 broker 发送 StopReplicaRequest。

#### broker failover

kafka broker failover 序列图如下所示：

![img](https://github.com/chou401/pic-md/raw/master/6725b09c54e9183071e778ba1805928b.png)

流程说明：

- controller 在 zookeeper 的 /brokers/ids/[brokerId] 节点注册 Watcher，当 broker 宕机时 zookeeper 会 fire watch
- controller 从 /brokers/ids 节点读取可用broker
- controller决定set_p，该集合包含宕机 broker 上的所有 partition
- 对 set_p 中的每一个 partition
  - 从/brokers/topics/[topic]/partitions/[partition]/state 节点读取 ISR
  - 决定新 leader
  - 将新 leader、ISR、controller_epoch 和 leader_epoch 等信息写入 state 节点
- 通过 RPC 向相关 broker 发送 leaderAndISRRequest 命令

#### controller failover

当 controller 宕机时会触发 controller failover。每个 broker 都会在 zookeeper 的 "/controller" 节点注册 watcher，当 controller 宕机时 zookeeper 中的临时节点消失，所有存活的 broker 收到 fire 的通知，每个 broker 都尝试创建新的 controller path，只有一个竞选成功并当选为 controller。

当新的 controller 当选时，会触发 KafkaController.onControllerFailover 方法，在该方法中完成如下操作：

1. 读取并增加 Controller Epoch。
2. 在 reassignedPartitions Patch(/admin/reassign_partitions) 上注册 watcher。
3. 在 preferredReplicaElection Path(/admin/preferred_replica_election) 上注册 watcher。
4. 通过 partitionStateMachine 在 broker Topics Patch(/brokers/topics) 上注册 watcher。
5. 若 delete.topic.enable=true（默认值是 false），则 partitionStateMachine 在 Delete Topic Patch(/admin/delete_topics) 上注册 watcher。
6. 通过 replicaStateMachine在 Broker Ids Patch(/brokers/ids)上注册Watch。
7. 初始化 ControllerContext 对象，设置当前所有 topic，“活”着的 broker 列表，所有 partition 的 leader 及 ISR等。
8. 启动 replicaStateMachine 和 partitionStateMachine。
9. 将 brokerState 状态设置为 RunningAsController。
10. 将每个 partition 的 Leadership 信息发送给所有“活”着的 broker。
11. 若 auto.leader.rebalance.enable=true（默认值是true），则启动 partition-rebalance 线程。
12. 若 delete.topic.enable=true 且Delete Topic Patch(/admin/delete_topics)中有值，则删除相应的Topic。

#### Kafka在zookeeper中存储结构图

![img](https://github.com/chou401/pic-md/raw/master/e577bb59a08c0b336dac332039d5bb6f.png)

##### topic注册信息

- /brokers/topics/[topicName] :
- 存储某个topic的partitions所有分配信息。

我们输入zkCli.sh进入zookeeper客户端。

使用：get /brokers/topics/topic-test，可以看到某个topic的存储信息。

##### partition状态信息

- /brokers/topics/[topicName]/partitions/[0...N] 其中[0..N]表示partition索引号
- /brokers/topics/[topicName]/partitions/[partitionId]/state

> "controller_epoch": 表示kafka集群中的中央控制器选举次数,
>
> "leader": 表示该partition选举leader的brokerId,
>
> "version": 版本编号默认为1,
>
> "leader_epoch": 该partition leader选举次数,
>
> "isr": [同步副本组brokerId列表]

##### Broker注册信息

- /brokers/ids/[0...N]
- 每个broker的配置文件中都需要指定一个数字类型的id(全局不可重复),此节点为临时znode(EPHEMERAL)

> "jmx_port": jmx端口号,
>
> "timestamp": kafka broker初始启动时的时间戳,
>
> "host": 主机名或ip地址,
>
> "version": 版本编号默认为1,
>
> "port": kafka broker的服务端端口号,由server.properties中参数port确定

##### Controller epoch

- /controller_epoch --> int (epoch)
- 此值为一个数字,kafka集群中第一个broker第一次启动时为1，以后只要集群中center controller中央控制器所在broker变更或挂掉，就会重新选举新的center controller，每次center controller变更controller_epoch值就会 + 1;

##### Controller注册信息

- /controller -> int (broker id of the controller) 存储center controller中央控制器所在kafka broker的信息

> "version": 版本编号默认为1,
>
> "brokerid": kafka集群中broker唯一编号,
>
> "timestamp": kafka broker中央控制器变更时的时间戳

### RocketMQ

RocketMQ 是阿里巴巴在 2012 年开源的消息队列产品，用**纯 Java 语言**实现，在设计时参考了 Kafka，并做出了自己的一些改进，后来捐赠给 Apache 软件基金会，2017 正式毕业，成为 Apache 的顶级项目。RocketMQ 在阿里内部被广泛应用在订单，交易，充值，流计算，消息推送，日志流式处理，Binglog 分发等场景。经历过多次双十一考验，它的性能、稳定性和可靠性都是值得信赖的。

RocketMQ 有着不错的性能，稳定性和可靠性，具备一个现代的消息队列应该有的几乎全部功能和特性，并且它还在持续的成长中。

RocketMQ 有非常活跃的中文社区，大多数问题可以找到中文的答案。RocketMQ 使用 Java 语言开发，源代码相对比较容易读懂，容易对 RocketMQ 进行扩展或者二次开发。

RocketMQ 对在线业务的响应时延做了很多的优化，大多数情况下可以做到毫秒级的响应，如果你的应用场景很在意响应时延，那应该选择使用 RocketMQ。

RocketMQ 的性能比 RabbitMQ 要高一个数量级，每秒钟大概能处理几十万条消息。

RocketMQ 的劣势是与周边生态系统的集成和兼容程度不够。

#### 基础概念

- **Producer**： 消息生产者，负责产生消息，一般由业务系统负责产生消息。
- **Producer Group**：消息生产者组，简单来说就是多个发送同一类消息的生产者称之为一个生产者。
- **Consumer**：消息消费者，负责消费消息，一般是后台系统负责异步消费。
- **Consumer Group**：消费者组，和生产者类似，消费同一类消息的多个 Consumer 实例组成一个消费者组。
- **Topic**：主题，用于将消息按主题做划分，Producer将消息发往指定的Topic，Consumer订阅该Topic就可以收到这条消息。
- **Message**：消息，每个message必须指定一个topic，Message 还有一个可选的 Tag 设置，以便消费端可以基于 Tag 进行过滤消息。
- **Tag**：标签，子主题（二级分类）对topic的进一步细化,用于区分同一个主题下的不同业务的消息。
- **Broker**：Broker是RocketMQ的核心模块，负责接收并存储消息，同时提供Push/Pull接口来将消息发送给Consumer。Broker同时提供消息查询的功能，可以通过MessageID和MessageKey来查询消息。Borker会将自己的Topic配置信息实时同步到NameServer。
- **Queue**：Topic和Queue是1对多的关系，一个Topic下可以包含多个Queue，主要用于负载均衡，Queue数量设置建议不要比消费者数少。发送消息时，用户只指定Topic，Producer会根据Topic的路由信息选择具体发到哪个Queue上。Consumer订阅消息时，会根据负载均衡策略决定订阅哪些Queue的消息。
- **Offset**：RocketMQ在存储消息时会为每个Topic下的每个Queue生成一个消息的索引文件，每个Queue都对应一个Offset记录当前Queue中消息条数。
- **NameServer**：NameServer可以看作是RocketMQ的注册中心，它管理两部分数据：集群的Topic-Queue的路由配置；Broker的实时配置信息。其它模块通过Nameserv提供的接口获取最新的Topic配置和路由信息；各 NameServer 之间不会互相通信， 各 NameServer 都有完整的路由信息，即无状态。
  - **Producer/Consumer** ：通过查询接口获取Topic对应的Broker的地址信息和Topic-Queue的路由配置
  - **Broker** ： 注册配置信息到NameServer， 实时更新Topic信息到NameServer

#### RocketMQ 消费模式

##### 广播模式

一条消息被多个Consumer消费，即使这些Consumer属于同一个Consumer Group，消息也会被Consumer Group中的每一个Consumer都消费一次。

```java
// 设置广播模式
consumer.setMessageModel(MessageModel.BROADCASTING);
```

##### 集群模式

一个Consumer Group中的所有Consumer平均分摊消费消息(组内负载均衡)。

```java
// 设置集群模式 也就是负载均衡模式
consumer.setMessageModel(MessageModel.CLUSTERING);
```

#### 基础架构

RocketMq 使用轻量级的NameServer服务进行服务的协调和治理工作，NameServer多节点部署时相互独立互不干扰。每一个rocketMq服务节点（broker节点）启动时都会遍历配置的NameServer列表并建立长链接，broker节点每30秒向NameServer发送一次心跳信息、NameServer每10秒会检查一次连接的broker是否存活。消费者和生产者会随机选择一个NameServer建立长连接，通过定期轮训更新的方式获取最新的服务信息。架构简图如下：

![img](https://cdn.jsdelivr.net/gh/chou401/pic-md@master/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA572X5b-X5a6P,size_20,color_FFFFFF,t_70,g_se,x_16-20240130120749366.png)

1. **NameServer**：启动，监听端口，等待producer，consumer，broker连接上来。
2. **Broker**：启动，与nameserver保持长链接，定期向nameserver发送心跳信息，包含broker的ip，端口，当前broker上topic的信息。
3. **producer**：启动，随机选择一个NameServer建立长连接，拿到broker的信息，然后就可以给broker发送消息了。
4. **consumer**：启动，随机选择一个NameServer建立长连接，拿到broker的信息，然后就可以建立通道，消费消息。

##### Broker 的存储结构

RocketMQ 存储用的是**本地文件存储系统**，将所有topic的消息全部写入同一个文件中（commit log），这样保证了IO写入的绝对顺序性，最大限度利用IO系统顺序读写带来的优势提升写入速度。

由于消息混合存储在一起，需要将每个消费者组消费topic最后的**偏移量**记录下来。这个文件就是consumer queue（索引文件）。所以消息在写入commit log 文件的同时还需将偏移量信息写入consumer queue文件。在索引文件中会记录消息的物理位置、偏移量offse，消息size等，消费者消费时根据上述信息就可以从commit log文件中快速找到消息信息。

Broker 存储结构如下：

![img](https://cdn.jsdelivr.net/gh/chou401/pic-md@master/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA572X5b-X5a6P,size_20,color_FFFFFF,t_70,g_se,x_16-20240130120801987.png)

##### 存储文件简介

- **Commit log**：消息存储文件，RocketMQ会对commit log文件进行分割（默认大小1GB），新文件以消息最后一条消息的偏移量命名。（比如 00000000000000000000 代表了第一个文件，第二个文件名就是 00000000001073741824，表明起始偏移量为 1073741824）。
- **Consumer queue**：消息消费队列（也是个文件），可以根据消费者数量设置多个，一个Topic 下的某个 Queue，每个文件约 5.72M，由 30w 条数据组成；ConsumeQueue 存储的条目是固定大小，只会存储 8 字节的 commitlog 物理偏移量，4 字节的消息长度和 8 字节 Tag 的哈希值，固定 20 字节；消费者是先从 ConsumeQueue 来得到消息真实的物理地址，然后再去 CommitLog 获取消息。
- **IndexFile**：索引文件，是额外提供查找消息的手段，通过 Key 或者时间区间来查询对应的消息。

###### 整个流程简介

Producer 使用轮询的方式分别向每个 Queue 中发送消息。

Consumer 启动的时候会在 Topic，Consumer group 维度发生负载均衡，为每个客户端分配需要处理的 Queue。负载均衡过程中每个客户端都获取到全部的的 ConsumerID 和所有 Queue 并进行排序，每个客户端使用相同负责均衡算法，例如平均分配的算法，这样每个客户端都会计算出自己需要消费那些 Queue，每当 Consumer 增加或减少就会触发负载均衡，所以我们可以通过 RocketMQ 负载均衡机制实现动态扩容，提升客户端收发消息能力。客户端负责均衡为客户端分配好 Queue 后，客户端会不断向 Broker 拉取消息，在客户端进行消费。

**可以一直增加客户端的数量提升消费能力吗**？

当然不可以，因为 Queue 数量有限，客户端数量一旦达到 Queue 数量，再扩容新节点无法提升消费能力，因为会有节点分配不到 Queue 而无法消费。

##### Consumer 端的负载均衡机制

topic 在创建之处可以设置 comsumer queue数量。而 comsumer 在启动时会和comsumer queue绑定，这个绑定策略是咋样的？

![img](https://cdn.jsdelivr.net/gh/chou401/pic-md@master/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA572X5b-X5a6P,size_20,color_FFFFFF,t_70,g_se,x_16-20240130120814864.png)

- **默认策略**：
  - queue 个数大于 Consumer个数， 那么 Consumer 会平均分配 queue，不够平均，会根据clientId排序来拿取余数
  - queue个数小于Consumer个数，那么会有Consumer闲置，就是浪费掉了，其余Consumer平均分配到queue
- **一致性hash算法**
- **就近元则，离的近的消费**
- **每个消费者依次消费一个queue，环状**
- **自定义方式**

**天然弊端**：

RocketMQ 采用一个 consumer 绑定一个或者多个 Queue 模式，假如某个消费者服务器挂了，则会造成部分Queue消息堆积。

##### 消息刷盘机制

- **同步刷盘**：当消息持久化完成后，Broker才会返回给Producer一个ACK响应，可以保证消息的可靠性，但是性能较低。
- **异步刷盘**：只要消息写入PageCache即可将成功的ACK返回给Producer端。消息刷盘采用后台异步线程提交的方式进行，降低了读写延迟，提高了RocketMQ的性能和吞吐量。

##### Mmap + pageCache

RocketMQ 底层对 commitLog、consumeQueue 之类的磁盘文件的读写操作都采用了 mmap 技术。

###### 传统 IO

传统 I/O 的工作方式是，数据读取和写入是从用户空间到内核空间来回复制，而内核空间的数据是通过操作系统层面的 I/O 接口从磁盘读取或写入。

传统IO**发生了 4 次用户态与内核态的上下文切换**，因为发生了两次系统调用，一次是 `read()` ，一次是 `write()`，每次系统调用都得先从用户态切换到内核态，等内核完成任务后，再从内核态切换回用户态。

其次，还**发生了 4 次数据拷贝**，其中两次是 DMA 的拷贝，另外两次则是通过 CPU 拷贝的。

**传统IO，write() 过程是怎样？**

wirte() 写请求 和 read()，需要先写入用户缓存区，然后通过系统调用，CPU 拷贝数据从用户缓存区到内核缓存区，再从内核缓存区拷贝到磁盘文件！

- 第一次拷贝，把磁盘上的数据拷贝到操作系统内核的缓冲区里，这个拷贝的过程是通过 DMA 搬运的。
- 第二次拷贝，把内核缓冲区的数据拷贝到用户的缓冲区里，于是我们应用程序就可以使用这部分数据了，这个拷贝到过程是由 CPU 完成的（用户态不能直接操作内核态缓存区，所以需要拷贝到用户态才能使用）。
- 第三次拷贝，把刚才拷贝到用户的缓冲区里的数据，再拷贝到内核的 socket 的缓冲区里，这个过程依然还是由 CPU 搬运的。
- 第四次拷贝，把内核的 socket 缓冲区里的数据，拷贝到网卡的缓冲区里，这个过程又是由 DMA 搬运的。

我们回过头看这个文件传输的过程，我们只是搬运一份数据，结果却搬运了 4 次，过多的数据拷贝无疑会消耗 CPU 资源，大大降低了系统性能。

这种简单又传统的文件传输方式，存在冗余的上文切换和数据拷贝，在高并发系统里是非常糟糕的，多了很多不必要的开销，会严重影响系统性能。

所以，要想提高文件传输的性能，就需要**减少「用户态与内核态的上下文切换」和「内存拷贝」的次数**。

**如何优化文件传输的性能？**
先来看看，如何减少「用户态与内核态的上下文切换」的次数呢？

读取磁盘数据的时候，之所以要发生上下文切换，这是因为用户空间没有权限操作磁盘或网卡，内核的权限最高，这些操作设备的过程都需要交由操作系统内核来完成，所以一般要通过内核去完成某些任务的时候，就需要使用操作系统提供的系统调用函数。

而一次系统调用必然会发生 2 次上下文切换：首先从用户态切换到内核态，当内核执行完任务后，再切换回用户态交由进程代码执行。

所以，要想减少上下文切换到次数，就要减少系统调用的次数。

**再来看看，如何减少「数据拷贝」的次数？**

在前面我们知道了，传统的文件传输方式会历经 4 次数据拷贝，而且这里面，「从内核的读缓冲区拷贝到用户的缓冲区里，再从用户的缓冲区里拷贝到 socket 的缓冲区里」，这个过程是没有必要的。

因为文件传输的应用场景中，在用户空间我们并不会对数据「再加工」，所以数据实际上可以不用搬运到用户空间，因此**用户的缓冲区是没有必要存在的**。

###### Mmap（内存映射）

`read()` 系统调用的过程中会把内核缓冲区的数据拷贝到用户的缓冲区里，于是为了减少这一步开销，我们可以用 `mmap()` 替换 `read()` 系统调用函数。

`mmap()` 系统调用函数会把文件磁盘地址「**映射**」到内核缓存区（page cache），而内核缓存区会 「**映射**」到用户空间（虚拟地址）。这样，操作系统内核与用户空间就不需要再进行任何的数据拷贝。

> 注意，这里用户空间（虚拟地址）不是直接映射到文件磁盘地址，而是文件对应的 page cache，用户虚拟地址一般是和用户内存地址「映射」的，如果使用内存映射技术，则用户虚拟地址可以和内核内存地址「映射」。
>
> 根据维基百科给出的定义：在大多数操作系统中，映射的内存区域实际上是内核的page cache，这意味着不需要在用户空间创建副本。多个进程之间也可以通过同时映射 page cache，来进行进程通信）

###### mmap() 函数简介

```java
void * mmap(void *start, size_t length, int prot , int flags, int fd, off_t offset)
```

- **start**：要映射到的内存区域的起始地址，通常都是用NULL（NULL即为0）。NULL表示由内核来指定该内存地址
- **offset**：以文件开始处的偏移量, 必须是分页大小的整数倍, 通常为0, 表示从文件头开始映射
- **length**：将文件的多大长度映射到内存（每次创建新 commitlog 会默认指定长度 1GB）
- **prot**： 映射区的保护方式（PROT_EXEC: 映射区可被执行、PROT_READ: 映射区可被读取、PROT_WRITE: 映射区可被写入、PROT_NONE: 映射区不能存取）
- **flags**： 映射区的特性
- **fd**：文件描述符（由open函数返回）

从磁盘拷贝到内核空间的页缓存 (page cache)，然后将用户空间的虚拟地址映射到内核的page cache，这样不需要再将页面从内核空间拷贝到用户空间了。

![img](https://cdn.jsdelivr.net/gh/chou401/pic-md@master/6e9223b86e2fad24b14e5a31df1879e0.png)

简述上述过程

1. 应用进程调用了 mmap() 后，DMA 会把磁盘的数据拷贝到内核的缓冲区里。接着，应用进程跟操作系统内核「共享」这个缓冲区；
2. 应用进程再调用 write()，操作系统直接将内核缓冲区的数据拷贝到 socket 缓冲区中，这一切都发生在内核态，由 CPU 来搬运数据；
3. 应用进程再调用 write()，操作系统直接将内核缓冲区的数据拷贝到 socket 缓冲区中，这一切都发生在内核态，由 CPU 来搬运数据；
4. 最后，把内核的 socket 缓冲区里的数据，拷贝到网卡的缓冲区里，这个过程是由 DMA 搬运的。

**使用 mmap() 写数据到磁盘文件会怎样？**

mmap() 将用户虚拟地址映射内核缓存区（内存物理地址）后，写数据直接将数据写入内核缓存区，只需要经过一次CPU拷贝，将数据从内核缓存区拷贝到磁盘文件；比传统 IO 的 write() 操作少了一次数据拷贝的过程！

但这还不是最理想的零拷贝，因为仍然需要通过 CPU 把内核缓冲区的数据拷贝到 socket 缓冲区里，而且仍然需要 4 次上下文切换，因为系统调用还是 2 次。

###### pageCache

在传统IO过程中，其中第一步都是先需要先把磁盘文件数据拷贝「内核缓冲区」里，这个「内核缓冲区」实际上是**磁盘高速缓存（PageCache）**。

预映射机制 + 文件预热机制

Broker针对上述的磁盘文件高性能读写机制做的一些优化：

- 内存预映射机制：Broker 会针对磁盘上的各种 CommitLog、ConsumeQueue 文件预先分配好MappedFile，也就是提前对一些可能接下来要读写的磁盘文件，提前使用 MappedByteBuffer 执行 mmap() 函数完成内存映射，这样后续读写文件的时候，就可以直接执行了（减少一次 CPU 拷贝）。

- 文件预热：在提前对一些文件完成内存映射之后，因为内存映射不会直接将数据从磁盘加载到内存里来，那么后续在读，取尤其是 CommitLog、ConsumeQueue 文件时候，其实有可能会频繁的从磁盘里加载数据到内存中去。所以，在执行完 mmap() 函数之后，还会进行 madvise() 系统调用，就是提前尽可能将磁盘文件加载到内存里去。(读磁盘 -> 读内存)。

##### Topic 分片

为了突破单个机器容量上限和单个机器读写性能，RocketMQ 支持 topic 数据分片。

架构图如下：

![img](https://cdn.jsdelivr.net/gh/chou401/pic-md@master/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA572X5b-X5a6P,size_20,color_FFFFFF,t_70,g_se,x_16.png)

##### 查缺补漏

###### 消息的全局顺序和局部顺序

- **全局顺序**：一个 Topic 一个队列，Producer 和 Consuemr 的并发都为一。
- **局部顺序**：某个队列消息是顺序的。

###### 零拷贝（Zero-copy）

sendfile：

在 Linux 内核版本 2.1 中，提供了一个专门发送文件的系统调用函数 `sendfile()`，函数形式如下：

```cpp
#include <sys/socket.h>
ssize_t sendfile(int out_fd, int in_fd, off_t *offset, size_t count);
```

它的前两个参数分别是目的端和源端的文件描述符，后面两个参数是源端的偏移量和复制数据的长度，返回值是实际复制数据的长度。

首先，它可以替代前面的 read() 和 write() 这两个系统调用，这样就可以减少一次系统调用，也就减少了 2 次上下文切换的开销。

其次，该系统调用，可以直接把内核缓冲区里的数据拷贝到 socket 缓冲区里，不再拷贝到用户态，这样就只有 2 次上下文切换，和 3 次数据拷贝。如下图：

![img](https://cdn.jsdelivr.net/gh/chou401/pic-md@master/87c6530cba656a8139b6def9b0db570b.png)

但是这还不是真正的零拷贝技术，如果网卡支持 SG-DMA（The Scatter-Gather Direct Memory Access）技术（和普通的 DMA 有所不同），我们可以进一步减少通过 CPU 把内核缓冲区里的数据拷贝到 socket 缓冲区的过程。

你可以在你的 Linux 系统通过下面这个命令，查看网卡是否支持 scatter-gather 特性：

```cobol
$ ethtool -k eth0 | grep scatter-gather
scatter-gather: on
```

于是，从 Linux 内核 2.4 版本开始起，对于支持网卡支持 SG-DMA 技术的情况下， sendfile() 系统调用的过程发生了点变化，具体过程如下：

1. 第一步，通过 DMA 将磁盘上的数据拷贝到内核缓冲区里；
2. 第二步，缓冲区描述符和数据长度传到 socket 缓冲区，这样网卡的 SG-DMA 控制器就可以直接将内核缓存中的数据拷贝到网卡的缓冲区里，此过程不需要将数据从操作系统内核缓冲区拷贝到 socket 缓冲区中，这样就减少了一次数据拷贝；

所以，这个过程之中，只进行了 2 次数据拷贝，如下图：

![img](https://cdn.jsdelivr.net/gh/chou401/pic-md@master/971767ef19a202042cdefcd3be6b4fa7.png)

这就是所谓的**零拷贝（Zero-copy）技术，因为我们没有在内存层面去拷贝数据，也就是说全程没有通过 CPU 来搬运数据，所有的数据都是通过 DMA 来进行传输的**。

零拷贝技术的文件传输方式相比传统文件传输的方式，减少了 2 次上下文切换和数据拷贝次数，**只需要 2 次上下文切换和数据拷贝次数，就可以完成文件的传输，而且 2 次的数据拷贝过程，都不需要通过 CPU，2 次都是由 DMA 来搬运**。

所以，总体来看，**零拷贝技术可以把文件传输的性能提高至少一倍以上**。

###### 使用零拷贝技术的项目

事实上，Kafka 这个开源项目，就利用了「零拷贝」技术，从而大幅提升了 I/O 的吞吐率，这也是 Kafka 在处理海量数据为什么这么快的原因之一。

如果你追溯 Kafka 文件传输的代码，你会发现，最终它调用了 Java NIO 库里的 `transferTo`方法：

```java
@Overridepublic
long transferFrom(FileChannel fileChannel, long position, long count) throws IOException {
    return fileChannel.transferTo(position, count, socketChannel);
}
```

如果 Linux 系统支持 `sendfile()` 系统调用，那么 `transferTo()` 实际上最后就会使用到 `sendfile()` 系统调用函数。

另外，Nginx 也支持零拷贝技术，一般默认是开启零拷贝技术，这样有利于提高文件传输的效率，是否开启零拷贝技术的配置如下：

```cobol
http {
...
    sendfile on
...
}
```

sendfile 配置的具体意思:

- 设置为 on 表示，使用零拷贝技术来传输文件：sendfile ，这样只需要 2 次上下文切换，和 2 次数据拷贝。
- 设置为 off 表示，使用传统的文件传输技术：read + write，这时就需要 4 次上下文切换，和 4 次数据拷贝。

当然，要使用 sendfile，Linux 内核版本必须要 2.1 以上的版本。

**PageCache 有什么作用？**

回顾前面说道文件传输过程，其中第一步都是先需要先把磁盘文件数据拷贝「内核缓冲区」里，这个「内核缓冲区」实际上是磁盘高速缓存（PageCache）。

由于零拷贝使用了 PageCache 技术，可以使得零拷贝进一步提升了性能，我们接下来看看 PageCache 是如何做到这一点的。

读写磁盘相比读写内存的速度慢太多了，所以我们应该想办法把「读写磁盘」替换成「读写内存」。于是，我们会通过 DMA 把磁盘里的数据搬运到内存里，这样就可以用读内存替换读磁盘。

但是，内存空间远比磁盘要小，内存注定只能拷贝磁盘里的一小部分数据。

那问题来了，选择哪些磁盘数据拷贝到内存呢？

我们都知道程序运行的时候，具有「局部性」，所以通常，刚被访问的数据在短时间内再次被访问的概率很高，于是我们可以用 PageCache 来缓存最近被访问的数据，当空间不足时淘汰最久未被访问的缓存。

所以，读磁盘数据的时候，优先在 PageCache 找，如果数据存在则可以直接返回；如果没有，则从磁盘中读取，然后缓存 PageCache 中。

还有一点，读取磁盘数据的时候，需要找到数据所在的位置，但是对于机械磁盘来说，就是通过磁头旋转到数据所在的扇区，再开始「顺序」读取数据，但是旋转磁头这个物理动作是非常耗时的，为了降低它的影响，PageCache 使用了「预读功能」。

比如，假设 read 方法每次只会读 32 KB 的字节，虽然 read 刚开始只会读 0 ～ 32 KB 的字节，但内核会把其后面的 32～64 KB 也读取到 PageCache，这样后面读取 32～64 KB 的成本就很低，如果在 32～64 KB 淘汰出 PageCache 前，进程读取到它了，收益就非常大。

所以，PageCache 的优点主要是两个：

- 缓存最近被访问的数据；
- 预读功能；

这两个做法，将大大提高读写磁盘的性能。

但是，在传输大文件（GB 级别的文件）的时候，PageCache 会不起作用，那就白白浪费多做的一次数据拷贝，造成性能的降低，即使使用了 PageCache 的零拷贝也会损失性能

这是因为如果你有很多 GB 级别文件需要传输，每当用户访问这些大文件的时候，内核就会把它们载入 PageCache 中，于是 PageCache 空间很快被这些大文件占满。

另外，由于文件太大，可能某些部分的文件数据被再次访问的概率比较低，这样就会带来 2 个问题：

- PageCache 由于长时间被大文件占据，其他「热点」的小文件可能就无法充分使用到 PageCache，于是这样磁盘读写的性能就会下降了；
- PageCache 中的大文件数据，由于没有享受到缓存带来的好处，但却耗费 DMA 多拷贝到 PageCache 一次；

所以，针对大文件的传输，不应该使用 PageCache，也就是说不应该使用零拷贝技术，因为可能由于 PageCache 被大文件占据，而导致「热点」小文件无法利用到 PageCache，这样在高并发的环境下，会带来严重的性能问题。

**大文件传输用什么方式实现？**

那针对大文件的传输，我们应该使用什么方式呢？

我们先来看看最初的例子，当调用 read 方法读取文件时，进程实际上会阻塞在 read 方法调用，因为要等待磁盘数据的返回，如下图：

![img](https://cdn.jsdelivr.net/gh/chou401/pic-md@master/de0ebc5fe89fb2999683504f3cca815b.png)

具体过程：

- 当调用 read 方法时，会阻塞着，此时内核会向磁盘发起 I/O 请求，磁盘收到请求后，便会寻址，当磁盘数据准备好后，就会向内核发起 I/O 中断，告知内核磁盘数据已经准备好；
- 内核收到 I/O 中断后，就将数据从磁盘控制器缓冲区拷贝到 PageCache 里；
- 最后，内核再把 PageCache 中的数据拷贝到用户缓冲区，于是 read 调用就正常返回了。

对于阻塞的问题，可以用异步 I/O 来解决，它工作方式如下图：

![img](https://cdn.jsdelivr.net/gh/chou401/pic-md@master/138296dc824bf3e5ab8576bdfb0be80b.png)

它把读操作分为两部分：

- 前半部分，内核向磁盘发起读请求，但是可以**不等待数据就位就可以返回**，于是进程此时可以处理其他任务；
- 后半部分，当内核将磁盘中的数据拷贝到进程缓冲区后，进程将接收到内核的**通知**，再去处理数据；

而且，我们可以发现，异步 I/O 并没有涉及到 PageCache，所以使用异步 I/O 就意味着要绕开 PageCache。

绕开 PageCache 的 I/O 叫直接 I/O，使用 PageCache 的 I/O 则叫缓存 I/O。通常，对于磁盘，异步 I/O 只支持直接 I/O。

前面也提到，大文件的传输不应该使用 PageCache，因为可能由于 PageCache 被大文件占据，而导致「热点」小文件无法利用到 PageCache。

于是，在高并发的场景下，针对大文件的传输的方式，应该使用「异步 I/O + 直接 I/O」来替代零拷贝技术。

直接 I/O 应用场景常见的两种：

- 应用程序已经实现了磁盘数据的缓存，那么可以不需要 PageCache 再次缓存，减少额外的性能损耗。在 MySQL 数据库中，可以通过参数设置开启直接 I/O，默认是不开启；
- 传输大文件的时候，由于大文件难以命中 PageCache 缓存，而且会占满 PageCache 导致「热点」文件无法充分利用缓存，从而增大了性能开销，因此，这时应该使用直接 I/O。

另外，由于直接 I/O 绕过了 PageCache，就无法享受内核的这两点的优化：

- 内核的 I/O 调度算法会缓存尽可能多的 I/O 请求在 PageCache 中，最后「**合并**」成一个更大的 I/O 请求再发给磁盘，这样做是为了减少磁盘的寻址操作；
- 内核也会「**预读**」后续的 I/O 请求放在 PageCache 中，一样是为了减少对磁盘的操作；

于是，传输大文件的时候，使用「异步 I/O + 直接 I/O」了，就可以无阻塞地读取文件了。

所以，传输文件的时候，我们要根据文件的大小来使用不同的方式：

- 传输大文件的时候，使用「异步 I/O + 直接 I/O」；
- 传输小文件的时候，则使用「零拷贝技术」；

在 nginx 中，我们可以用如下配置，来根据文件的大小来使用不同的方式：

```bash
location /video/ {
    sendfile on;
    aio on;
    directio 1024m;
}
```

当文件大小大于 `directio` 值后，使用「异步 I/O + 直接 I/O」，否则使用「零拷贝技术」。

##### 总结

早期 I/O 操作，内存与磁盘的数据传输的工作都是由 CPU 完成的，而此时 CPU 不能执行其他任务，会特别浪费 CPU 资源。

于是，为了解决这一问题，DMA 技术就出现了，每个 I/O 设备都有自己的 DMA 控制器，通过这个 DMA 控制器，CPU 只需要告诉 DMA 控制器，我们要传输什么数据，从哪里来，到哪里去，就可以放心离开了。后续的实际数据传输工作，都会由 DMA 控制器来完成，CPU 不需要参与数据传输的工作。

传统 IO 的工作方式，从硬盘读取数据，然后再通过网卡向外发送，我们需要进行 4 上下文切换，和 4 次数据拷贝，其中 2 次数据拷贝发生在内存里的缓冲区和对应的硬件设备之间，这个是由 DMA 完成，另外 2 次则发生在内核态和用户态之间，这个数据搬移工作是由 CPU 完成的。

为了提高文件传输的性能，于是就出现了零拷贝技术，它通过一次系统调用（sendfile 方法）合并了磁盘读取与网络发送两个操作，降低了上下文切换次数。另外，拷贝数据都是发生在内核中的，天然就降低了数据拷贝的次数。

Kafka 和 Nginx 都有实现零拷贝技术，这将大大提高文件传输的性能。

零拷贝技术是基于 PageCache 的，PageCache 会缓存最近访问的数据，提升了访问缓存数据的性能，同时，为了解决机械硬盘寻址慢的问题，它还协助 I/O 调度算法实现了 IO 合并与预读，这也是顺序读比随机读性能好的原因。这些优势，进一步提升了零拷贝的性能。

需要注意的是，零拷贝技术是不允许进程对文件内容作进一步的加工的，比如压缩数据再发送。

另外，当传输大文件时，不能使用零拷贝，因为可能由于 PageCache 被大文件占据，而导致「热点」小文件无法利用到 PageCache，并且大文件的缓存命中率不高，这时就需要使用「异步 IO + 直接 IO 」的方式。

在 Nginx 里，可以通过配置，设定一个文件大小阈值，针对大文件使用异步 IO 和直接 IO，而对小文件使用零拷贝。

**Kafka为什么那么快？**

- 顺序读写+mmap，使用linux内核提供的mmap api，mmap将磁盘文件（设备内存）映射到内存，支持读和写，对内存的操作就会反映在磁盘文件上，但这不是实时写入磁盘的，操作系统会在程序主动调用flush的时候才真正的把数据写到硬盘（kafka也提供了一个参数——producer.type来控制是不是主动flush，如果kafaka写入到mmap之后立即flush然后返回producer叫同步，写入mmap之后立即返回producer叫异步）。
- 零拷贝，使用linux内核提供的sendfile api，sendfile是将读到内核空间的数据，直接转到socket buffer，进行网络发送。

![img](https://imgconvert.csdnimg.cn/aHR0cDovL2ltZy5ibG9nLmNzZG4ubmV0LzIwMTYwMTE0MTk1MDMzNTA5?x-oss-process=image/format,png)

**什么是mmap？**

mmap是操作这些设备的一种方法，所谓操作设备，比如IO端口（点亮一个LED）、LCD控制器、磁盘控制器，实际上就是往设备的物理地址读写数据。

但是，由于应用程序不能直接操作设备硬件地址，所以操作系统提供了这样的一种机制——内存映射，把设备地址映射到进程虚拟地址，mmap就是实现内存映射的接口。

mmap的好处是，mmap把设备内存映射到虚拟内存，则用户操作虚拟内存相当于直接操作设备了，省去了用户空间到内核空间的复制过程，相对IO操作来说，增加了数据的吞吐量。

**什么是内存映射？**

既然mmap是实现内存映射的接口，那么内存映射是什么呢？看下图：

![img](https://imgconvert.csdnimg.cn/aHR0cDovL2ltZy5ibG9nLmNzZG4ubmV0LzIwMTYwMTE0MjAwMTMxODE1?x-oss-process=image/format,png)

每个进程都有独立的进程地址空间，通过页表和MMU，可将虚拟地址转换为物理地址，每个进程都有独立的页表数据，这可解释为什么两个不同进程相同的虚拟地址，却对应不同的物理地址。

**什么是虚拟地址空间？**

每个进程都有4G的虚拟地址空间，其中3G用户空间，1G内核空间（linux），每个进程共享内核空间，独立的用户空间，下图形象地表达了这点

![img](https://imgconvert.csdnimg.cn/aHR0cDovL2ltZy5ibG9nLmNzZG4ubmV0LzIwMTYwMTE0MjAwNzU5MTc0?x-oss-process=image/format,png)

驱动程序运行在内核空间，所以驱动程序是面向所有进程的。

用户空间切换到内核空间有两种方法：

（1）系统调用，即软中断

（2）硬件中断

**虚拟地址空间里面是什么？**

了解了什么是虚拟地址空间，那么虚拟地址空间里面装的是什么？看下图

![img](https://imgconvert.csdnimg.cn/aHR0cDovL2ltZy5ibG9nLmNzZG4ubmV0LzIwMTYwMTE0MjAxMzAzMzkx?x-oss-process=image/format,png)

虚拟空间装的大概是上面那些数据了，内存映射大概就是把设备地址映射到上图的红色段了，暂且称其为“内存映射段”，至于映射到哪个地址，是由操作系统分配的，操作系统会把进程空间划分为三个部分：

（1）未分配的，即进程还未使用的地址

（2）缓存的，缓存在ram中的页

（3）未缓存的，没有缓存在ram中

操作系统会在未分配的地址空间分配一段虚拟地址，用来和设备地址建立映射。

页缓存是linux内核一种重要的磁盘高速缓存，它通过软件机制实现。但页缓存和硬件cache的原理基本相同，将容量大而低速设备中的部分数据存放到容量小而快速的设备中，这样速度快的设备将作为低速设备的缓存，当访问低速设备中的数据时，可以直接从缓存中获取数据而不需再访问低速设备，从而节省了整体的访问时间。

页缓存以页为大小进行数据缓存，它将磁盘中最常用和最重要的数据存放到部分物理内存中，使得系统访问块设备时可以直接从主存中获取块设备数据，而不需从磁盘中获取数据。

在大多数情况下，内核在读写磁盘时都会使用页缓存。内核在读文件时，首先在已有的页缓存中查找所读取的数据是否已经存在。如果该页缓存不存在，则一个新的页将被添加到高速缓存中，然后用从磁盘读取的数据填充它。如果当前物理内存足够空闲，那么该页将长期保留在高速缓存中，使得其他进程再使用该页中的数据时不再访问磁盘。写操作与读操作时类似，直接在页缓存中修改数据，但是页缓存中修改的数据(该页此时被称为Dirty Page)并不是马上就被写入磁盘，而是延迟几秒钟，以防止进程对该页缓存中的数据再次修改。

## 主流消息中间件的对比

| **特性**                 | ActiveMQ                              | **RabbitMQ**                                       | **RocketMQ**                                                                                                          | Kafka                                                                                                                                           |
| ------------------------ | ------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 单机吞吐量               | 万级，比 RocketMQ、Kafka 低一个数量级 | 同 ActiveMQ                                        | 10 万级，支撑高吞吐                                                                                                   | 10 万级，高吞吐，一般配合大数据类的系统来进行实时数据计算、日志采集等场景                                                                       |
| topic 数量对吞吐量的影响 |                                       |                                                    | topic 可以达到几百/几千的级别，吞吐量会有较小幅度的下降，这是 RocketMQ 的一大优势，在同等机器下，可以支撑大量的 topic | topic 从几十到几百个时候，吞吐量会大幅度下降，在同等机器下，Kafka 尽量保证 topic 数量不要过多，如果要支撑大规模的 topic，需要增加更多的机器资源 |
| 时效性                   | ms 级                                 | 微秒级，这是 RabbitMQ 的一大特点，延迟最低         | ms 级                                                                                                                 | 延迟在 ms 级以内                                                                                                                                |
| 可用性                   | 高，基于主从架构实现高可用            | 同 ActiveMQ                                        | 非常高，分布式架构                                                                                                    | 非常高，分布式，一个数据多个副本，少数机器宕机，不会丢失数据，不会导致不可用                                                                    |
| 消息可靠性               | 有较低的概率丢失数据                  | 基本不丢                                           | 经过参数优化配置，可以做到 0 丢失                                                                                     | 同 RocketMQ                                                                                                                                     |
| 功能支持                 | MQ 领域的功能极其完备                 | 基于 erlang 开发，并发能力很强，性能极好，延时很低 | MQ 功能较为完善，还是分布式的，扩展性好                                                                               | 功能较为简单，主要支持简单的 MQ 功能，在大数据领域的实时计算以及日志采集被大规模使用                                                            |
