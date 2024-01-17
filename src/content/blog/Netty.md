---
title: "Netty"
description: "Netty相关学习（待补充版）"
# pubDatetime: 'Sep 1 2023'
pubDatetime: 2022-09-25T15:20:35Z
heroImage: "/blog-placeholder-1.jpg"
---

# Netty

## BIO（Blocking IO）

![image-20230313103444295](https://github.com/chou401/pic-md/raw/master/img/image-20230313103444295.png)

## NIO（Non Blocking IO）

![image-20230313103559073](https://github.com/chou401/pic-md/raw/master/img/image-20230313103559073.png)

selector（多路复用器）

epoll

I/O多路复用底层主要用的linux内核函数（select，poll，epoll）来实现，windows不支持epoll实现，windows底层是基于winsock2的select函数实现的（不开源）

创建两个线程组bossGroup和workerGroup，含有的子线程NioEventLoop的个数默认为cpu合数的两倍，bossGroup只是处理连接请求，真正的和客户端业务处理，会交给workerGroup完成。

零拷贝机制

![image-20230314182800432](https://github.com/chou401/pic-md/raw/master/img/image-20230314182800432.png)

长连接心跳保活机制

直接内存

DiretByteBuffer 分配在物理内存
