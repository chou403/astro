---
author: chou401
pubDatetime: 2024-01-30T12:28:25Z
modDatetime: 2024-05-13T16:26:41Z
title: 面基记录
featured: false
draft: false
tags:
  - java
description: 面试经常被问到的问题
---

## Java 中的四种引用类型

Java 中的引用类型分别为**强、软、弱、虚**。

在 Java 中最常见的就是强引用，把一个对系那个赋给一个引用变量，这个引用变量就是一个强引用。当一个对象被强引用变量引用时，它始终处于可达状态，它是不可能被垃圾回收机制回收的，即使该对象以后永远都不会被用到 JVM 也不会回收。因此强引用时造成 Java 内存泄漏的主要原因之一。例如：Object obj = new Object()。

其次是软引用，对于只有软引用的对象来说，当系统内存足够时它不会被回收，当系统内存空间不足时它会被回收。软引用通话吃那个用在对内存敏感的程序中，作为缓存使用。例如：SoftRefenence softRef = new SoftRefenence()。

然后是弱引用，它比较引用的生存期更短，对于只有弱引用的对象来说，只要垃圾回收机制已运行，不管 JVM 的内存空间是否足够，总会回收该对象占用的内存。可以解决内存泄漏的问题，ThreadLocal 就是基于弱引用解决内存泄漏的问题。例如：WeakRefenence weakRef = new WeakRefenence()。

最后是虚引用，它不能单独使用，必须和引用队列联合使用。虚引用的主要作用是跟踪对系那个被垃圾回收的状态。例如：ReferenceQueue queue = new ReferenceQueue()；PhantomReference phantomRef = new PhantomReference(obj,queue)，不过在开发中，我们用的更多的还是强引用。

## Rocketmq 消息堆积 堆积到哪里

## OpenFeign 如何实现的消息间内部调用 重要

## OpenFeign 如何实现负载均衡 重要

## CAS 原理是什么

## 线程池 内存分配 紧密型如何分配线程数

## spring cloud resource 和 Autowired 什么区别

## Seata 有几种模式 重要

## ap 和 cp 为什么 p 是不可或缺的 重要

## Hashmap 的时间复杂度是多少？如果出现hash 碰撞如何处理？hashmap 最极端的时间复杂度是多少？

## @Transactional 原理 为什么加上这个 就会实现所有数据库操作在一起

## Java 什么操作可以多线程共享一块内存

## Mysql 优化器原理 如何优化的 优化了什么

## 10000 取 10 个数 用什么算法最好

## Arraylist 是不是线程安全的 哪些是线程安全的

CopyOnWriteArrayList、Collections.synchronizedList

## stw 是什么 哪个垃圾回收器 是 stw 时间最少的

## 以下内存是如何进行分配的 String s = new String（”12“）string s = ”12“

## Nacos 注册中心是 ap 还是 cp ，能否 从 ap 切换为 cp
