---
title: "Question"
description: "项目中以及学习中碰到的问题记录"
pubDatetime: 2022-09-25T15:20:35Z
heroImage: "/blog-placeholder-1.jpg"
---

## 疑问

### **守护线程和用户线程有什么区别？**

- 用户（User）线程：运行在前台，执行具体的任务，如程序的主线程、连接网络的子线程等都是用户线程。
- 守护（Darmon）线程：运行在后台，为其他前台线程服务。也可以说守护线程是JVM中非守护线程的“佣人”。一旦所有用户线程都结束运行，守护线程会随JVM一起结束工作。

main函数所在的线程就是一个用户线程，main函数启动的同时在JVM内部同时启动了好多守护线程，比如垃圾回收线程。比较明显的区别之一就是用户线程结束，JVM退出，不管这个时候有没有守护线程运行。而守护线程不会影响JVM的退出。

**注意事项**

1. setDaemon（true）必须在start（）方法前执行，否则会抛出 IllegalThreadStateException 异常。
2. 在守护线程中产生的新线程也是守护线程。
3. 不是所有的任务都可以分配给守护线程来执行，比如读写操作或者计算逻辑。
4. 守护（Darmon）线程中不能依靠 finally 块的内容来确保执行关闭或清理资源的逻辑。因为我们上面说过了一旦所有用户线程都结束运行，守护线程会随JVM一起结束工作，所有守护（Daemon）线程中的finally 语句块可能无法被执行。

### MySQL5.6：Specified key was too long； max key length is 767 bytes

在数据库中，索引的字段设置太长了，导致不支持。**【根本原因：5.6版本的innodb大长度前缀默认是关闭的】**

mysql 建立索引时，数据库计算key的长度是累加所有index用到的字段的char长度，按照一定的比例乘起来不能超过限定的key长度767。

- latin 1 = 1 byte = 1character
- uft8 = 3 byte = 1 character
- utf8mb4 = 4byte = 1character
- gbk = 2 byte = 1 character

```mysql
CREATE TABLE `xxl_job_registry` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `registry_group` varchar(50) NOT NULL,
  `registry_key` varchar(190) NOT NULL,
  `registry_value` varchar(250) NOT NULL,
  `update_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `i_g_k_v` (`registry_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


registry_key 190 * 4 = 760因此创建成功

若将registry_key的字节数改成192，则195 * 4 = 780 则创建不成功
```

如果是联合索引时，应该是两个索引的字节加起来，然后折算成字节数。

```mysql
CREATE TABLE `xxl_job_registry` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `registry_group` varchar(50) NOT NULL,
  `registry_key` varchar(190) NOT NULL,
  `registry_value` varchar(110) NOT NULL,
  `update_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `i_g_k_v` (`registry_key`, `registry_value`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

那么索引需要的字节数是：（190 + 110） * 4 = 1200
创建不成功


但是实际上呢，是能创建成功。
在创建索引的时候进行了优化，取字节数最长的那个 190 * 4 = 760因此能创建成功。
```

**解决方法**

1. 修改索引的varchar字符，只要让字符 \* 字节数 < 767 即可。但是有时某个字段的字符数是一定要足够大的，那就用第二种方式。

2. ```mysql
   // 查看

   show variables like "innodb_large_prefix";

   show variables like "innodb_file_format";

   //修改最大索引长度限制
   set global innodb_large_prefix=1;
   或
   set global innodb_large_prefix=on;

   set global innodb_file_format=BARRACUDA;
   ```

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

```c
rm -rf protocol
```

关闭nacos 服务

```c
sh shutdown.sh
```

切换到bin目录，执行命令：

```c
sh startup.sh -m standalone
```

后台运行

```c
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
