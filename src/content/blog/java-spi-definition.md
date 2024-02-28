---
author: chou401
pubDatetime: 2022-09-25T15:20:35Z
modDatetime: 2024-02-28T12:37:00Z
title: Java SPI
featured: false
draft: false
tags:
  - java
description: java spi 描述
---

## Table of contents

## Java SPI

SPI: Service Provider Interface，它是从 Java6 开始引入的，是一种基于 Classloader 来发现并加载服务的机制。

一个标准的 SPI，由三个组件构成，分别是：

- Service：是一个公开的接口或抽象类，定义了一个抽象的功能模块
- Service Provider：是 Service 接口的一个实现类
- ServiceLoader：是 SPI 机制中的核心组件，负责在运行时发现并加载 Service Provider

### 运行流程

![image-20230821143535836](https://cdn.jsdelivr.net/gh/chou401/pic-md@master/img/image-20230821143535836.png)

### 三大规范要素

- 规范的配置文件
  - 文件路径：必须在 jar 包中 META-INF/services 目录下
  - 文件名称：Service 接口的全限定名
  - 文件内容：Service 实现类的全限定名。如果有多个实现类，那么每一个实现类中单独占据一行
- Service Provider 类必须具备无参的默认构造方法
  - Service 接口的实现类，即 Service Provider 类，必须具备无参的默认构造方法。因为随后通过反射技术实例化它时，是不带参数的
- 保证能加载到配置文件和 Service Provider 类
  - 方式一：将 Service Provider 的 jar 包放到 classpath 中
  - 方式二：将 jar 包安装到 jre 的扩展目录中
  - 方式三：自定义一个 ClassLoader

### Java SPI 与 SpringBoot 自动配置

![image-20230821154836454](https://cdn.jsdelivr.net/gh/chou401/pic-md@master/img/image-20230821154836454.png)

该如何实现 Auto-Configuration

- 首先，不能脱离 springboot 框架另起炉灶
  - 继续使用@Configuration 等已有注解
- 第二，对用户友好，将“全自动”贯彻到底
  - 参考 Java SPI 的设计思想

![image-20230821155311581](https://cdn.jsdelivr.net/gh/chou401/pic-md@master/img/image-20230821155311581.png)
