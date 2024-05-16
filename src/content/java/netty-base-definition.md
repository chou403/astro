---
author: chou401
pubDatetime: 2022-09-25T15:20:35Z
modDatetime: 2024-05-16T14:00:41Z
title: Netty
featured: false
draft: false
tags:
  - java
  - netty
description: Netty 相关学习（待补充版）
---

## Table of contents

## BIO（Blocking IO）

![image-20230313103444295](https://cdn.jsdelivr.net/gh/chou401/pic-md@main/img/image-20230313103444295.png)

## NIO（Non Blocking IO）

![image-20230313103559073](https://cdn.jsdelivr.net/gh/chou401/pic-md@main/img/image-20230313103559073.png)

selector（多路复用器）

epoll

I/O多路复用底层主要用的linux内核函数（select，poll，epoll）来实现，windows不支持epoll实现，windows底层是基于winsock2的select函数实现的（不开源）

创建两个线程组bossGroup和workerGroup，含有的子线程NioEventLoop的个数默认为cpu合数的两倍，bossGroup只是处理连接请求，真正的和客户端业务处理，会交给workerGroup完成。

零拷贝机制

![image-20230314182800432](https://cdn.jsdelivr.net/gh/chou401/pic-md@main/img/image-20230314182800432.png)

长连接心跳保活机制

直接内存

DiretByteBuffer 分配在物理内存
