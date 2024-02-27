---
author: chou401
pubDatetime: 2022-09-25T15:20:35Z
modDatetime: 2024-02-27T10:09:35Z
title: Questions
featured: false
draft: false
tags:
  - question
description: 项目中以及学习中碰到的问题记录
---

## Table of contents

## 疑问

### 项目开发阶段，有一个关于下单发货的需求：如果今天下午 3 点前进行下单，那么发货时间是明天，如果今天下午 3 点后进行下单，那么发货时间是后天，如果被确定的时间是周日，那么在此时间上再加 1 天为发货时间

```java
final DateTime DISTRIBUTION_TIME_SPLIT_TIME = new DateTime().withTime(15,0,0,0);
private Date calculateDistributionTimeByOrderCreateTime(Date orderCreateTime){
    DateTime orderCreateDateTime = new DateTime(orderCreateTime);
    Date tomorrow = orderCreateDateTime.plusDays(1).toDate();
    Date theDayAfterTomorrow = orderCreateDateTime.plusDays(2).toDate();
    return orderCreateDateTime.isAfter(DISTRIBUTION_TIME_SPLIT_TIME) ? wrapDistributionTime(theDayAfterTomorrow) : wrapDistributionTime(tomorrow);
}
private Date wrapDistributionTime(Date distributionTime){
    DateTime currentDistributionDateTime = new DateTime(distributionTime);
    DateTime plusOneDay = currentDistributionDateTime.plusDays(1);
    boolean isSunday = (DateTimeConstants.SUNDAY == currentDistributionDateTime.getDayOfWeek());
    return isSunday ? plusOneDay.toDate() : currentDistributionDateTime.toDate() ;
}
```

### nacos 多个 ip 挂载 无法下线 did not find the Leader node

删除 nacos 目录下的 protocol，之后重启 nacos

```bash
rm -rf protocol
```

关闭nacos 服务

```bash
sh shutdown.sh
```

切换到bin目录，执行命令：

```bash
sh startup.sh -m standalone
```

后台运行

```bash
nohup sh startup.sh -m standalone &
```

### 多事务处理冲突

开启 kafka 事务，因为 kafka 事务是 PlatformTransactionManager 的，导致 DataSourceTransactionManager 事务无法使用，因为 DataSourceTransactionManager 会在 PlatformTransactionManager 不存在时创建。

```java
@Configuration
@EnableTransactionManagement
public class TransactionConfig {

    private final DataSource dataSource;

    private final TransactionManagerCustomizers transactionManagerCustomizers;

    public TransactionConfig(DataSource dataSource, TransactionManagerCustomizers transactionManagerCustomizers) {
        this.dataSource = dataSource;
        this.transactionManagerCustomizers = transactionManagerCustomizers;
    }

    @Bean
    @Primary
    public DataSourceTransactionManager transactionManager(DataSourceProperties properties) {
        DataSourceTransactionManager transactionManager = new DataSourceTransactionManager(this.dataSource);
        if (this.transactionManagerCustomizers != null) {
            this.transactionManagerCustomizers.customize((TransactionManager) transactionManager);
        }
        return transactionManager;
    }

    /**
     * 处理 DataSourceTransactionManager 和 KafkaTransactionManager 事务
     */
    @Bean
    public ChainedKafkaTransactionManager chainedKafkaTransactionManager(DataSourceTransactionManager transactionManager,
                                                                         KafkaTransactionManager<?, ?> kafkaTransactionManager) {
        return new ChainedKafkaTransactionManager<>(transactionManager, kafkaTransactionManager);
    }

}
```

### Caused by: org.eclipse.aether.transfer.ArtifactNotFoundException

在多模块依赖的 Maven 工程，如果存在 pom 文件依赖，请在根目录下执行 mvn 命令。

### 'dependencies.dependency.systemPath' for cn.evun:datasever-sdk:jar should not point at files within the project directory

修改 pom 文件依赖中的 systemPath

```xml
<systemPath>${basedir}/src/main/resources/lib/datasever-sdk-1.0.0.jar</systemPath>
# 改成
<systemPath>${pom.basedir}/src/main/resources/lib/datasever-sdk-1.0.0.jar</systemPath>
```

## error commander@12.0.0: The engine "node" is incompatible with this module. Expected version ">=18". Got "14.20.0"

执行 `yarn install` 时提示上述错误。系统使用版本 14.20.0，要求 node 版本大于 18，升级 node 版本到要求或者执行以下命令忽略校验：

```bash
yarn config set ignore-engines true
```
