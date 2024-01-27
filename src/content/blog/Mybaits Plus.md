---
title: "Mybatis Plus"
description: "Mybatis Plus 读写分离"
pubDatetime: 2024-01-26T14:00:35Z
heroImage: "/blog-placeholder-1.jpg"
---

### 使用 Dynamic DataSource

#### 系统版本介绍

SpringBoot：3.1.4

MySQL：8.2.0

Mybaits Plus：3.5.4.1

Dynamic DataSource：4.1.3

...

#### 依赖引用

```xml
com.mysql:mysql-connector-j:8.2.0
com.baomidou:mybatis-plus-boot-starter:3.5.4.1
com.baomidou:dynamic-datasource-spring-boot3-starter:4.1.3
```

#### 配置数据源

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

#### 切换数据源

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

### 使用AOP 判断方法名方式

采用 AOP的方式，通过方法名判断，方法名中有 get、select 开头的则连接 slave，其他的则连接 master 数据库。

#### 配置数据源

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

#### 数据源枚举

```java
public @interface Writer {
}
```

```java
public enum ReadsAndWrite {
    WRITE, READ1, READ2
}
```

#### 数据源选择规则类

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

#### 数据源路由类

```java
public class ReadWriteRoutingDataSource extends AbstractRoutingDataSource {

    @Nullable
    @Override
    protected Object determineCurrentLookupKey() {
        return ReadWriteSeparationRule.get();
    }
}

```

#### 数据源配置类

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

#### MybatisPlus 配置类

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

#### 读写节点选择

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

### 使用shardingsphere jdbc

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

resources 文件夹添加 sharding-config.yaml

```yaml
dataSources:
  ds_0:
    dataSourceClassName: com.zaxxer.hikari.HikariDataSource
    driverClassName: com.mysql.cj.jdbc.Driver
    jdbc-url: jdbc:mysql://localhost:3306/boot?allowPublicKeyRetrieval=True&serverTimezone=GMT%2B8&characterEncoding=utf-8&useSSL=false
    username: root
    password: 3306
  ds_1:
    dataSourceClassName: com.zaxxer.hikari.HikariDataSource
    driverClassName: com.mysql.cj.jdbc.Driver
    jdbc-url: jdbc:mysql://localhost:3307/boot?allowPublicKeyRetrieval=True&serverTimezone=GMT%2B8&characterEncoding=utf-8&useSSL=false
    username: root
    password: 3307
  ds_2:
    dataSourceClassName: com.zaxxer.hikari.HikariDataSource
    driverClassName: com.mysql.cj.jdbc.Driver
    jdbc-url: jdbc:mysql://localhost:3308/boot?allowPublicKeyRetrieval=True&serverTimezone=GMT%2B8&characterEncoding=utf-8&useSSL=false
    username: root
    password: 3308
rules:
  - !READWRITE_SPLITTING
    dataSources:
      readwrite_ds:
        writeDataSourceName: ds_0
        readDataSourceNames:
          - ds_1
          - ds_2
        transactionalReadQueryStrategy: PRIMARY
        loadBalancerName: random
    loadBalancers:
      random:
        type: RANDOM
  - !SINGLE
    tables:
      - "*.*"
```
