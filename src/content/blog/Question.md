---
title: "Questions"
description: "项目中以及学习中碰到的问题记录"
pubDatetime: 2022-09-25T15:20:35Z
modDatetime: 2024-02-01T11:17:00Z
tags:
  - question
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
