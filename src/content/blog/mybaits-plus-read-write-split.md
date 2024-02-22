---
author: chou401
pubDatetime: 2024-01-27T15:56:54Z
modDatetime: 2024-02-22T10:32:22Z
title: Mybatis Plus
featured: true
draft: false
tags:
  - java
  - mybatisplus
description: 基于 Mybatis Plus 的三种实现读写分离 & 分库分表
---

## Table of contents

## 使用 Dynamic DataSource

### 系统版本介绍

SpringBoot：3.1.4

MySQL：8.2.0

Mybaits Plus：3.5.4.1

Dynamic DataSource：4.1.3

Gradle 8.4

...

### 依赖引用

```xml
com.mysql:mysql-connector-j:8.2.0
com.baomidou:mybatis-plus-boot-starter:3.5.4.1
com.baomidou:dynamic-datasource-spring-boot3-starter:4.1.3
```

### 配置数据源

```yaml
spring:
  datasource:
    dynamic:
      primary: write
      strict: false
      datasource:
        write:
          url: jdbc:mysql://localhost:3306/boot?allowPublicKeyRetrieval=True&serverTimezone=GMT%2B8&characterEncoding=utf-8&useSSL=false
          username: root
          password: 3306
        read1:
          url: jdbc:mysql://localhost:3307/boot?allowPublicKeyRetrieval=True&serverTimezone=GMT%2B8&characterEncoding=utf-8&useSSL=false
          username: root
          password: 3307
        read2:
          url: jdbc:mysql://localhost:3308/boot?allowPublicKeyRetrieval=True&serverTimezone=GMT%2B8&characterEncoding=utf-8&useSSL=false
          username: root
          password: 3308
```

### 切换数据源

使用 @DS 切换数据源，@DS可以注解在方法上或类上，**同时存在就近原则，方法上注解优先于类上注解**。

| 注解          | 结果                                      |
| ------------- | ----------------------------------------- |
| 没有@DS       | 默认数据源                                |
| @DS("dsName") | dsName 可以为组名也可以为具体某个库的名称 |

```java
@Service
@DS("slave")
public class UserServiceImpl implements UserService {

  @Autowired
  private JdbcTemplate jdbcTemplate;

  public List selectAll() {
    return  jdbcTemplate.queryForList("select * from user");
  }

  @Override
  @DS("slave_1")
  public List selectByCondition() {
    return  jdbcTemplate.queryForList("select * from user where age >10");
  }
}
```

## 使用AOP 判断方法名方式

采用 AOP的方式，通过方法名判断，方法名中有 get、select 开头的则连接 slave，其他的则连接 master 数据库。

### AOP 配置数据源

```yaml
spring:
  datasource:
    write:
      jdbc-url: jdbc:mysql://localhost:3306/boot?allowPublicKeyRetrieval=True&serverTimezone=GMT%2B8&characterEncoding=utf-8&useSSL=false
      username: root
      password: 3306
    read1:
      jdbc-url: jdbc:mysql://localhost:3307/boot?allowPublicKeyRetrieval=True&serverTimezone=GMT%2B8&characterEncoding=utf-8&useSSL=false
      username: root
      password: 3307
    read2:
      jdbc-url: jdbc:mysql://localhost:3308/boot?allowPublicKeyRetrieval=True&serverTimezone=GMT%2B8&characterEncoding=utf-8&useSSL=false
      username: root
      password: 3308
```

### 数据源枚举

```java
public @interface Writer {
}
```

```java
public enum ReadsAndWrite {
    WRITE, READ1, READ2
}
```

### 数据源选择规则类

```java
public class ReadWriteSeparationRule {
    private static final ThreadLocal<ReadsAndWrite> contextHolder = new ThreadLocal<>();

    private static final AtomicInteger counter = new AtomicInteger(-1);

    public static void set(ReadsAndWrite nodeType) {
        contextHolder.set(nodeType);
    }

    public static ReadsAndWrite get() {
        return contextHolder.get();
    }

    /**
     * 多个写节点也可以做简单的负载均衡
     */
    public static void writer() {
        set(ReadsAndWrite.WRITE);
    }

    /**
     * 读简单的1:2权重负载均衡
     */
    public static void reader() {
        int index = counter.incrementAndGet() % 3;
        if (counter.get() > 1000) {
            counter.set(-1);
        }
        if (index == 0) {
            set(ReadsAndWrite.READ1);
        } else {
            set(ReadsAndWrite.READ2);
        }
    }
}
```

### 数据源路由类

```java
public class ReadWriteRoutingDataSource extends AbstractRoutingDataSource {

    @Nullable
    @Override
    protected Object determineCurrentLookupKey() {
        return ReadWriteSeparationRule.get();
    }
}

```

### 数据源配置类

```java
@Slf4j
@Configuration
public class DataSourceConfig {

    @Bean
    @ConfigurationProperties("spring.datasource.write")
    public DataSource writeDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Bean
    @ConfigurationProperties("spring.datasource.read1")
    public DataSource read1DataSource() {
        return DataSourceBuilder.create().build();
    }

    @Bean
    @ConfigurationProperties("spring.datasource.read2")
    public DataSource read2DataSource() {
        return DataSourceBuilder.create().build();
    }

    @Bean
    public DataSource dynamicDatasource(@Qualifier("writeDataSource") DataSource writeDataSource,
                                        @Qualifier("read1DataSource") DataSource read1DataSource,
                                        @Qualifier("read2DataSource") DataSource read2DataSource) {
        Map<Object, Object> targetDataSources = new HashMap<>();
        targetDataSources.put(ReadsAndWrite.WRITE, writeDataSource);
        targetDataSources.put(ReadsAndWrite.READ1, read1DataSource);
        targetDataSources.put(ReadsAndWrite.READ2, read2DataSource);
        ReadWriteRoutingDataSource readWriteRoutingDataSource = new ReadWriteRoutingDataSource();
        readWriteRoutingDataSource.setDefaultTargetDataSource(writeDataSource);
        readWriteRoutingDataSource.setTargetDataSources(targetDataSources);
        return readWriteRoutingDataSource;
    }

}
```

### MybatisPlus 配置类

MybatisPlus 配置类中添加一下内容

```java
@Slf4j
@Configuration
@EnableTransactionManagement
public class MybatisPlusConfig {

    @Resource(name = "dynamicDatasource")
    private DataSource dynamicDatasource;

    @Bean
    public SqlSessionFactory sqlSessionFactory() throws Exception {
        MybatisSqlSessionFactoryBean sqlSessionFactoryBean = new MybatisSqlSessionFactoryBean();
        sqlSessionFactoryBean.setDataSource(dynamicDatasource);
        sqlSessionFactoryBean.setMapperLocations(new PathMatchingResourcePatternResolver().getResources("classpath:mapper/*.xml"));

        MybatisConfiguration configuration = new MybatisConfiguration();
        configuration.setMapUnderscoreToCamelCase(true);
        configuration.setCacheEnabled(false);
        configuration.setLogImpl(StdOutImpl.class);
        sqlSessionFactoryBean.setConfiguration(configuration);

        return sqlSessionFactoryBean.getObject();
    }

    @Bean
    public PlatformTransactionManager platformTransactionManager() {
        return new DataSourceTransactionManager(dynamicDatasource);
    }
}
```

### 读写节点选择

以上内容都准备结束，最后就是通过 aop 获取请求方法名，根据方法名分配方法读或写操作。

```java
@Slf4j
@Aspect
@Component
public class ReadWriteDataSourceAop {

    @Pointcut("!@annotation(io.chou401.framework.annotation.Writer) " +
            "&& (execution(* io.chou401..*.select*(..)) " +
            "|| execution(* io.chou401..*.get*(..)) " +
            "|| execution(* io.chou401..*.find*(..)))")
    public void readPointcut() {

    }

    @Pointcut("@annotation(io.chou401.framework.annotation.Writer) " +
            "|| execution(* io.chou401..*.insert*(..)) " +
            "|| execution(* io.chou401..*.save*(..)) " +
            "|| execution(* io.chou401..*.add*(..)) " +
            "|| execution(* io.chou401..*.update*(..)) " +
            "|| execution(* io.chou401..*.edit*(..)) " +
            "|| execution(* io.chou401..*.delete*(..)) " +
            "|| execution(* io.chou401..*.remove*(..))")
    public void writePointcut() {

    }

    @Before("readPointcut()")
    public void read() {
        ReadWriteSeparationRule.reader();
    }

    @Before("writePointcut()")
    public void write() {
        ReadWriteSeparationRule.writer();
    }
}
```

## 使用shardingsphere jdbc

依赖

```xml
org.apache.shardingsphere:shardingsphere-jdbc-core:5.4.0
```

application.yml 配置文件

```yaml
spring:
  datasource:
    driver-class-name: org.apache.shardingsphere.driver.ShardingSphereDriver
    url: jdbc:shardingsphere:classpath:sharding-config.yaml
```

resources 文件夹添加 sharding-config.yaml 配置读写分离

```yaml
# 不配置则默认单机模式
mode:
  # 运行模式类型。可选配置：Standalone、Cluster
  type: Standalone
  # 持久化仓库配置
  repository:
    # 持久化仓库类型
    type: JDBC
# 数据源配置，可配置多个
dataSources:
  # 数据源名称
  master_0:
    # 数据源完整类名
    dataSourceClassName: com.zaxxer.hikari.HikariDataSource
    # 数据库驱动类名，以数据库连接池自身配置为准
    driverClassName: com.mysql.cj.jdbc.Driver
    # 数据库 URL 连接，以数据库连接池自身配置为准
    jdbcUrl: jdbc:mysql://localhost:3306/boot?allowPublicKeyRetrieval=True&serverTimezone=GMT%2B8&characterEncoding=utf-8&useSSL=false
    # 数据库用户名，以数据库连接池自身配置为准
    username: root
    # 数据库密码，以数据库连接池自身配置为准
    password: 3306
  slave_0:
    dataSourceClassName: com.zaxxer.hikari.HikariDataSource
    driverClassName: com.mysql.cj.jdbc.Driver
    jdbcUrl: jdbc:mysql://localhost:3307/boot?allowPublicKeyRetrieval=True&serverTimezone=GMT%2B8&characterEncoding=utf-8&useSSL=false
    username: root
    password: 3307
  slave_1:
    dataSourceClassName: com.zaxxer.hikari.HikariDataSource
    driverClassName: com.mysql.cj.jdbc.Driver
    jdbcUrl: jdbc:mysql://localhost:3308/boot?allowPublicKeyRetrieval=True&serverTimezone=GMT%2B8&characterEncoding=utf-8&useSSL=false
    username: root
    password: 3308

rules:
  - !READWRITE_SPLITTING
    dataSources:
      # 读写分离逻辑数据源名称
      ds_0:
        # 写库数据源名称
        writeDataSourceName: master_0
        # 读库数据源名称
        readDataSourceNames:
          - slave_0
          - slave_1
        # 事务内读请求的路由策略，可选值：PRIMARY（路由至主库）、FIXED（同一事务内路由至固定数据源）、DYNAMIC（同一事务内路由至非固定数据源）。默认值：DYNAMIC
        transactionalReadQueryStrategy: PRIMARY
        # 负载均衡算法名称
        loadBalancerName: random
    # 负载均衡算法配置
    loadBalancers:
      # 负载均衡算法名称
      random:
        # 负载均衡算法类型
        type: RANDOM
  # 单表规则
  - !SINGLE
    tables:
      - "*.*"
# 日志输出
props:
  sql-show: true
```

若需要实现数据库分表，sharding-config.yaml 文件中添加一下内容，若需要进一步分库，需要同时增加数据源配置

```yaml
- !SHARDING # 数据分片规则配置
  tables:
    # 逻辑表名称
    sys_user:
      # 由数据源名 + 表名组成
      actualDataNodes: ds_0.sys_user_${0..1}
      # 分表策略
      tableStrategy:
        standard:
          # 分片列名称
          shardingColumn: id
          # 分片算法名称
          shardingAlgorithmName: sys_user_inline
      # 分库策略
      #databaseStrategy:
      #  standard:
      #    shardingColumn: id
      #    shardingAlgorithmName: database_inline

      # 分布式序列策略
      keyGenerateStrategy:
        # 自增列名称，缺省表示不使用自增主键生成器
        column: id
        # 分布式序列算法名称
        keyGeneratorName: snowflake
  # 分片算法配置
  shardingAlgorithms:
    #database_inline:
    #  type: INLINE
    #  props:
    #    algorithm-expression: ds_${id % 2}

    # 分片算法名称
    sys_user_inline:
      # 分片算法类型
      type: INLINE
      # 分片算法属性配置
      props:
        algorithm-expression: sys_user_${id % 2}
  # 分布式序列算法配置
  keyGenerators:
    # 分布式序列算法名称
    snowflake:
      # 分布式序列算法类型
      type: SNOWFLAKE
```

## 可能会出现的问题

Cause: javax.xml.bind.JAXBException: Implementation of JAXB-API has not been found on module path or classpath.
JAXB API是java EE 的API，因此在java SE 9.0 中不再包含这个 Jar 包。java 9 中引入了模块的概念，默认情况下，Java SE中将不再包含java EE 的Jar包 。而在 java 6/7 / 8 时关于这个API 都是捆绑在一起的。
jdk 版本较高，需要单独添加依赖

```yaml
implementation 'com.sun.xml.bind:jaxb-core:2.3.0'
implementation 'javax.xml.bind:jaxb-api:2.3.0'
implementation 'com.sun.xml.bind:jaxb-impl:2.3.0'
```

Caused by: org.apache.ibatis.executor.ExecutorException: Error preparing statement. Cause: org.apache.shardingsphere.infra.exception.TableNotExistsException: Table or view `sys_user` does not exist.
多数据源，表存在多个，无法识别单表。需添加单表设置。[参考内容](https://shardingsphere.apache.org/document/current/en/user-manual/shardingsphere-jdbc/yaml-config/rules/single/)

```yaml
- !SINGLE
  tables:
    - "*.*"
```

Caused by: com.github.pagehelper.PageException: When you use the PageHelper pagination plugin, you must set the helper property
使用 mybatis 分页插件 pagehelper，在不指定方言（dialect）的情况下回直接报错，报错信息是使用 pagehelper 插件必须设置 helper 属性；
application.yml 文件中添加

```yml
pagehelper:
  helper-dialect: mysql
```
