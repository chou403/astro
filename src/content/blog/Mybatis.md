---
title: "Mybatis"
description: "Mybatis应用与提升"
# pubDatetime: 'Sep 1 2023'
pubDatetime: 2022-09-25T15:20:35Z
heroImage: "/blog-placeholder-1.jpg"
---

# Mybatis

## Mybatis使用

ORM框架：Object Relational Mapping。用于实现面向对象编程语言里不同类型系统的数据之间的转换。

- 添加依赖

  - ```java
    <dependency>
        <groupId>org.mybatis.spring.boot</groupId>
        <artifactId>mybatis-spring-boot-starter</artifactId>
        <version>2.0.1</version>
    </dependency>
    ```

- 配置文件中配置mybatis的mapper文件位置。

  - ```java
    mybatis.mapper-locations=classpath:mapper/*.xml
    ```

- pom.xml 设置springboot在包中扫描xml文件。

- 启动类添加注解用于给出需要扫描的mapper文件路径@MapperScan("xxx.xxx.xxx.xxx")。

- 逆向工程依赖

  ```java
  <plugin>
      <groupId>org.mybatis.generator</groupId>
      <artifactId>mybatis-generator-maven-plugin</artifactId>
      <version>1.4.1</version>
      <configuration>
          <!--允许移动生成的文件 -->
          <verbose>true</verbose>
          <!-- 是否覆盖 -->
          <overwrite>true</overwrite>
          <!-- 自动生成的配置文件路径。启动插件时，插件会根据这里配置的路径去找到generatorConfig.xml配置文件，
          根据配置文件里的配置，去自动生成Mapper接口（可以理解为Dao层）、实体类、Mapper.xml文件
          -->
          <configurationFile>src/main/resources/GeneratorConfig.xml</configurationFile>
      </configuration>
      <dependencies>
          <dependency>
              <groupId>mysql</groupId>
              <artifactId>mysql-connector-java</artifactId>
              <version>8.0.29</version>
          </dependency>
          <dependency>
              <groupId>org.mybatis.generator</groupId>
              <artifactId>mybatis-generator-core</artifactId>
              <version>1.4.1</version>
          </dependency>

      </dependencies>
      <executions>
          <execution>
              <id>Generate MyBatis Artifacts</id>
              <phase>package</phase>
              <goals>
                  <goal>generate</goal>
              </goals>
          </execution>
      </executions>
  </plugin>
  ```

  generatorConfig.xml

  ```java
  <?xml version="1.0" encoding="UTF-8"?>
  <!DOCTYPE generatorConfiguration
          PUBLIC "-//mybatis.org//DTD MyBatis Generator Configuration 1.0//EN"
          "http://mybatis.org/dtd/mybatis-generator-config_1.0.dtd">
  <generatorConfiguration>

      <!-- 数据库驱动:选择你的本地硬盘上面的数据库驱动包 -->
      <!--    因为已经在pom.xml添加逆向工程插件时添加了驱动依赖，所以省略这一步-->
      <!--    <classPathEntry  location="C:\Users\lenovo\Desktop\Software_project\java\mysql-connector-java-8.0.28/mysql-connector-java-8.0.28.jar"/>-->

      <context id="DB2Tables" targetRuntime="MyBatis3">
          <!-- 实体类生成序列化属性-->
          <plugin type="org.mybatis.generator.plugins.SerializablePlugin"/>
          <!-- 实体类重写HashCode()和equals()-->
          <plugin type="org.mybatis.generator.plugins.EqualsHashCodePlugin"/>
          <!-- 实体类重写toString() -->
          <plugin type="org.mybatis.generator.plugins.ToStringPlugin"/>

          <commentGenerator>
              <!-- 是否去除自动生成的注释 -->
              <property name="suppressAllComments" value="true"/>
              <!-- 生成注释是否带时间戳-->
              <property name="suppressDate" value="true"/>
              <!-- 生成的Java文件的编码格式 -->
              <property name="javaFileEncoding" value="utf-8"/>
              <!-- 数据库注释支持 -->
              <property name="addRemarkComments" value="true"/>
              <!-- 时间格式设置 -->
              <property name="dateFormat" value="yyyy-MM-dd HH:mm:ss"/>
              <!-- 格式化java代码-->
              <property name="javaFormatter" value="org.mybatis.generator.api.dom.DefaultJavaFormatter"/>
              <!-- 格式化XML代码-->
              <property name="xmlFormatter" value="org.mybatis.generator.api.dom.DefaultXmlFormatter"/>
          </commentGenerator>

          <!-- 数据库连接驱动类,URL，用户名、密码 -->
          <jdbcConnection driverClass="com.mysql.cj.jdbc.Driver"
                          connectionURL="jdbc:mysql://119.45.27.47:3306/dms_usp?useSSL=false&amp;useUnicode=true&amp;characterEncoding=utf-8"
                          userId="FordDms"
                          password="FordDms.1234">
              <property name="nullCatalogMeansCurrent" value="true"/>
          </jdbcConnection>

          <!-- java类型处理器：处理DB中的类型到Java中的类型 -->
          <javaTypeResolver type="org.mybatis.generator.internal.types.JavaTypeResolverDefaultImpl">
              <!-- 是否有效识别DB中的BigDecimal类型 -->
              <property name="forceBigDecimals" value="true"/>
          </javaTypeResolver>

          <!-- 生成Domain模型：包名(targetPackage)、位置(targetProject) -->
          <javaModelGenerator targetPackage="com.yonyou.dms.web.entity" targetProject="E:\workspace\Parent\Login\src\main\java">
              <!-- 在targetPackage的基础上，根据数据库的schema再生成一层package，最终生成的类放在这个package下，默认为false -->
              <property name="enableSubPackages" value="true"/>
              <!-- 设置是否在getter方法中，对String类型字段调用trim()方法-->
              <property name="trimStrings" value="true"/>
          </javaModelGenerator>

          <!-- 生成xml映射文件：包名(targetPackage)、位置(targetProject) -->
          <sqlMapGenerator targetPackage="mapper" targetProject="E:\workspace\Parent\Login\src\main\resources">
              <property name="enableSubPackages" value="true"/>
          </sqlMapGenerator>

          <!-- 生成DAO接口：包名(targetPackage)、位置(targetProject) -->
          <javaClientGenerator type="XMLMAPPER" targetPackage="com.yonyou.dms.web.dao"
                               targetProject="E:\workspace\Parent\Login\src\main\java">
              <property name="enableSubPackages" value="true"/>
          </javaClientGenerator>

          <table tableName="tc_menu_action" domainObjectName="MenuAction">
              <!--            若数据库中某个属性类型为text或类似类型，可能会发生无法生成这个属性，此时可以在这里指定转换类型为VARCHAR-->
              <!--            <columnOverride column="teacher_name" jdbcType="VARCHAR" />-->
  <!--        　　table标签下的设置属性useActualColumnNames用于指定生成实体类时是否使用实际的列名作为实体类的属性名，取值true或false。-->
  <!--        　　true：MyBatis Generator会使用数据库中实际的字段名字作为生成的实体类的属性名。-->
  <!--        　　false：这是默认值。如果设置为false,则MyBatis Generator会将数据库中实际的字段名字转换为Camel Case风格作为生成的实体类的属性名。-->
              <property name="useActualColumnNames" value="false" />
          </table>
      </context>
  </generatorConfiguration>
  ```

先执行二级缓存，再执行一级缓存。

```java
public <E> List<E> query(MappedStatement ms, Object parameterObject, RowBounds rowBounds, ResultHandler resultHandler) throws SQLException {
    BoundSql boundSql = ms.getBoundSql(parameterObject);
    CacheKey key = this.createCacheKey(ms, parameterObject, rowBounds, boundSql);
    return this.query(ms, parameterObject, rowBounds, resultHandler, key, boundSql);
}
```

mybatis调用query时如何使用缓存，createCacheKey生成key。

```java
public CacheKey createCacheKey(MappedStatement ms, Object parameterObject, RowBounds rowBounds, BoundSql boundSql) {
    if (this.closed) {
        throw new ExecutorException("Executor was closed.");
    } else {
        CacheKey cacheKey = new CacheKey();
        cacheKey.update(ms.getId());
        cacheKey.update(rowBounds.getOffset());
        cacheKey.update(rowBounds.getLimit());
        cacheKey.update(boundSql.getSql());
        List<ParameterMapping> parameterMappings = boundSql.getParameterMappings();
        TypeHandlerRegistry typeHandlerRegistry = ms.getConfiguration().getTypeHandlerRegistry();
        Iterator var8 = parameterMappings.iterator();

        while(var8.hasNext()) {
            ParameterMapping parameterMapping = (ParameterMapping)var8.next();
            if (parameterMapping.getMode() != ParameterMode.OUT) {
                String propertyName = parameterMapping.getProperty();
                Object value;
                if (boundSql.hasAdditionalParameter(propertyName)) {
                    value = boundSql.getAdditionalParameter(propertyName);
                } else if (parameterObject == null) {
                    value = null;
                } else if (typeHandlerRegistry.hasTypeHandler(parameterObject.getClass())) {
                    value = parameterObject;
                } else {
                    MetaObject metaObject = this.configuration.newMetaObject(parameterObject);
                    value = metaObject.getValue(propertyName);
                }

                cacheKey.update(value);
            }
        }

        if (this.configuration.getEnvironment() != null) {
            cacheKey.update(this.configuration.getEnvironment().getId());
        }

        return cacheKey;
    }
}
```

执行查询方法。

```java
public <E> List<E> query(MappedStatement ms, Object parameterObject, RowBounds rowBounds, ResultHandler resultHandler, CacheKey key, BoundSql boundSql) throws SQLException {
    // 查询时先从二级缓存中获取数据
    Cache cache = ms.getCache();
    if (cache != null) {
        this.flushCacheIfRequired(ms);
        if (ms.isUseCache() && resultHandler == null) {
            this.ensureNoOutParams(ms, boundSql);
            List<E> list = (List)this.tcm.getObject(cache, key);
            if (list == null) {
                list = this.delegate.query(ms, parameterObject, rowBounds, resultHandler, key, boundSql);
                this.tcm.putObject(cache, key, list);
            }

            return list;
        }
    }

    return this.delegate.query(ms, parameterObject, rowBounds, resultHandler, key, boundSql);
}
```

```java
public <E> List<E> query(MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler, CacheKey key, BoundSql boundSql) throws SQLException {
    ErrorContext.instance().resource(ms.getResource()).activity("executing a query").object(ms.getId());
    if (this.closed) {
        throw new ExecutorException("Executor was closed.");
    } else {
        if (this.queryStack == 0 && ms.isFlushCacheRequired()) {
            this.clearLocalCache();
        }

        List list;
        try {
            ++this.queryStack;
            // 根据key获取缓存中是否存在数据，存在数据从缓存中查询数据，否则从数据库查询数据
            list = resultHandler == null ? (List)this.localCache.getObject(key) : null;
            if (list != null) {
                this.handleLocallyCachedOutputParameters(ms, key, parameter, boundSql);
            } else {
                list = this.queryFromDatabase(ms, parameter, rowBounds, resultHandler, key, boundSql);
            }
        } finally {
            --this.queryStack;
        }

        if (this.queryStack == 0) {
            Iterator var8 = this.deferredLoads.iterator();

            while(var8.hasNext()) {
                DeferredLoad deferredLoad = (DeferredLoad)var8.next();
                deferredLoad.load();
            }

            this.deferredLoads.clear();
            if (this.configuration.getLocalCacheScope() == LocalCacheScope.STATEMENT) {
                this.clearLocalCache();
            }
        }

        return list;
    }
}
```

```java
private <E> List<E> queryFromDatabase(MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler, CacheKey key, BoundSql boundSql) throws SQLException {
    this.localCache.putObject(key, ExecutionPlaceholder.EXECUTION_PLACEHOLDER);

    List list;
    try {
        list = this.doQuery(ms, parameter, rowBounds, resultHandler, boundSql);
    } finally {
        this.localCache.removeObject(key);
    }

    this.localCache.putObject(key, list);
    if (ms.getStatementType() == StatementType.CALLABLE) {
        this.localOutputParameterCache.putObject(key, parameter);
    }

    return list;
}
```

```java
public RoutingStatementHandler(Executor executor, MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler, BoundSql boundSql) {
    switch (ms.getStatementType()) {
            // 普通类型
        case STATEMENT:
            this.delegate = new SimpleStatementHandler(executor, ms, parameter, rowBounds, resultHandler, boundSql);
            break;
            // 预编译
        case PREPARED:
            this.delegate = new PreparedStatementHandler(executor, ms, parameter, rowBounds, resultHandler, boundSql);
            break;
            // 存储过程
        case CALLABLE:
            this.delegate = new CallableStatementHandler(executor, ms, parameter, rowBounds, resultHandler, boundSql);
            break;
        default:
            throw new ExecutorException("Unknown statement type: " + ms.getStatementType());
    }

}
```

```java
public ResultSetWrapper(ResultSet rs, Configuration configuration) throws SQLException {
    this.typeHandlerRegistry = configuration.getTypeHandlerRegistry();
    this.resultSet = rs;
    ResultSetMetaData metaData = rs.getMetaData();
    // 获取表行数
    int columnCount = metaData.getColumnCount();

    for(int i = 1; i <= columnCount; ++i) {
        // columnNames 字段名称
        this.columnNames.add(configuration.isUseColumnLabel() ? metaData.getColumnLabel(i) : metaData.getColumnName(i));
        // jdbcTypes 数据库字段类型
        this.jdbcTypes.add(JdbcType.forCode(metaData.getColumnType(i)));
        // classNames java 字段类型
        this.classNames.add(metaData.getColumnClassName(i));
    }
}
```

**spring整合mybatis 实现**

```java
@Autowired
private UserMapper userMapper; // Mybatis生成的UserMapper代理对象 --> Bean对象
```

## SqlSessionFactoryBean的底层原理

SqlSessionFactoryBean是MyBatis框架中的一个重要组件，它的主要作用是创建SqlSessionFactory对象，SqlSessionFactory是MyBatis框架中的核心对象，它负责管理MyBatis的所有配置信息，并且提供了创建SqlSession对象的方法。SqlSessionFactoryBean的底层原理是通过读取MyBatis的配置文件，解析其中的配置信息，然后根据配置信息创建SqlSessionFactory对象。在创建SqlSessionFactory对象的过程中，SqlSessionFactoryBean会使用MyBatis框架中的多个组件，包括Configuration、MapperRegistry、TypeHandlerRegistry等，这些组件都是MyBatis框架中的核心组件，它们负责管理MyBatis的各种配置信息，并且提供了各种功能的实现。SqlSessionFactoryBean的底层原理比较复杂，需要深入了解MyBatis框架的各个组件之间的关系和作用，才能更好地理解它的实现原理。

```java
@Bean
public SqlSessionFactory sqlSessionFactory() throws IOException{
    InputStream inputStream = Resources.getResourceAsStream("mybatis-config.xml");
    return new SqlSessionFactoryBuilder().build(inputStream);
}

@Bean
public UserMapper userMapper(SqlSessionFactory sqlSessionFactory) {
    // Mybatis 代理对象
    sqlSessionFactory.getConfiguration().addMapper(UserMapper.class);
    SqlSession sqlSession = sqlSessionFactory.openSession();
    return sqlSession.getMapper(UserMapper.class);
}
```

## FactoryBean的作用和底层工作原理

FactoryBean是Spring框架中的一个接口，它的作用是用于创建和管理Bean对象。FactoryBean可以将复杂的Bean对象的创建过程封装起来，使得应用程序只需要通过FactoryBean获取Bean对象即可，而不需要关心Bean对象的创建过程。FactoryBean的底层工作原理是通过实现getObject()方法来创建Bean对象，同时还可以通过实现其他方法来控制Bean对象的生命周期和行为。

```java
@Component
public class TestFactoryBean implements FactoryBean {
    // 实现FactoryBean接口会生成两个Bean对象 1、TestFactoryBean 2、getObject
    // 先生成TestFactoryBean 之后再生成 getObject

    @Autowired
    private SqlSessionFactory sqlSessionFactory;

    @Override
    public Object getObject() throws Exception {
        sqlSessionFactory.getConfiguration().addMapper(UserMapper.class);
        SqlSession sqlSession = sqlSessionFactory.openSession();
        return sqlSession.getMapper(UserMapper.class);
    }

    @Override
    public Class<?> getObjectType() {
        return UserMapper.class;
    }
}
```

FactoryBean复用

```java
AnnotationConfigApplicationContext applicationContext = new AnnotationConfigApplicationContext();
applicationContext.register(DegreeApplication.class);

// 与@Component 一样的作用
AbstractBeanDefinition beanDefinition = BeanDefinitionBuilder.genericBeanDefinition().getBeanDefinition();
beanDefinition.setBeanClass(TestFactoryBean.class);
beanDefinition.getConstructorArgumentValues().addGenericArgumentValue(UserMapper.class);
applicationContext.registerBeanDefinition("userMapper", beanDefinition);
```

```java
@Component
public class TestFactoryBean implements FactoryBean {

  @Autowired
  private SqlSessionFactory sqlSessionFactory;

  private final Class mapperClass;

  public TestFactoryBean(Class mapperClass) {
    this.mapperClass = mapperClass;
  }

  @Override
  public Object getObject() throws Exception {
    sqlSessionFactory.getConfiguration().addMapper(mapperClass);
    SqlSession sqlSession = sqlSessionFactory.openSession();
    return sqlSession.getMapper(mapperClass);
  }

  @Override
  public Class<?> getObjectType() {
    return User.class;
  }
}
```

## ImportBeanDefinitionRegistrar底层原理

1. ImportBeanDefinitionRegistrar实现类重写registerBeanDefinitions方法。
2. 在registerBeanDefinitions方法中，通过BeanDefinitionRegistry接口注册bean定义。

```java
public class TestImportBeanDefinitionRegistrar implements ImportBeanDefinitionRegistrar {

    @Override
    public void registerBeanDefinitions(AnnotationMetadata importingClassMetadata, BeanDefinitionRegistry registry) {
        ArrayList<Class> list = new ArrayList<>();
        list.add(UserMapper.class);

        for (Class mapperClass : list) {
            AbstractBeanDefinition beanDefinition = BeanDefinitionBuilder.genericBeanDefinition().getBeanDefinition();
            beanDefinition.setBeanClass(TestFactoryBean.class);
            beanDefinition.getConstructorArgumentValues().addGenericArgumentValue(mapperClass);
            registry.registerBeanDefinition(mapperClass.getName(), beanDefinition);
        }
    }
}
```

```java
// 使用@Import 导入配置的类
@Import(TestImportBeanDefinitionRegistrar.class)
public class DegreeApplication {

}
```

## MapperScannerConfigurer底层源码分析

- MapperScannerConfigurer底层源码分析。
- MapperScannerConfigurer是MyBatis提供的一个BeanFactoryPostProcessor，用于扫描指定包下的Mapper接口，并将其注册到Spring容器中。
- 在MyBatis中，Mapper接口是通过MapperProxyFactory来创建代理对象的，而MapperScannerConfigurer的作用就是将Mapper接口的代理对象注册到Spring容器中，以便在需要使用Mapper接口时，可以直接从Spring容器中获取代理对象。
- MapperScannerConfigurer的实现原理是通过Spring的ClassPathBeanDefinitionScanner来扫描指定包下的所有类，然后判断是否是Mapper接口，如果是，则将其注册到Spring容器中。
- 在注册Mapper接口时，MapperScannerConfigurer会为每个Mapper接口创建一个MapperFactoryBean，MapperFactoryBean是一个FactoryBean，用于创建Mapper接口的代理对象。
- MapperFactoryBean的实现原理是通过MapperProxyFactory来创建Mapper接口的代理对象，然后将其返回给Spring容器。
- 总结一下，MapperScannerConfigurer的作用是将Mapper接口的代理对象注册到Spring容器中，以便在需要使用Mapper接口时，可以直接从Spring容器中获取代理对象。MapperScannerConfigurer的实现原理是通过Spring的ClassPathBeanDefinitionScanner来扫描指定包下的所有类，然后判断是否是Mapper接口，如果是，则将其注册到Spring容器中，并为每个Mapper接口创建一个MapperFactoryBean，用于创建Mapper接口的代理对象。

```java
public class TestMapperScanner extends ClassPathBeanDefinitionScanner {

    @Override
    protected boolean isCandidateComponent(MetadataReader metadataReader) throws IOException {
        // 是否 @component 注解
        return true;
    }

    @Override
    protected boolean isCandidateComponent(AnnotatedBeanDefinition beanDefinition) {
        // 是否 接口类
        return beanDefinition.getMetadata().isInterface();
    }

    public TestMapperScanner(BeanDefinitionRegistry registry) {
        super(registry);
    }

    @Override
    protected Set<BeanDefinitionHolder> doScan(String... basePackages) {
        // 重写 doScan 方法
        Set<BeanDefinitionHolder> beanDefinitionHolders = super.doScan(basePackages);
        for (BeanDefinitionHolder beanDefinitionHolder : beanDefinitionHolders) {
            GenericBeanDefinition genericBeanDefinition = (GenericBeanDefinition) beanDefinitionHolder.getBeanDefinition();
            genericBeanDefinition.getConstructorArgumentValues().addGenericArgumentValue(Objects.requireNonNull(genericBeanDefinition.getBeanClassName()));
            genericBeanDefinition.setBeanClass(TestFactoryBean.class);
        }

        return beanDefinitionHolders;
    }
}
```

使用MapperScanner自定义扫描mapper。

```java
public class TestImportBeanDefinitionRegistrar implements ImportBeanDefinitionRegistrar {

    @Override
    public void registerBeanDefinitions(AnnotationMetadata importingClassMetadata, BeanDefinitionRegistry registry) {
        TestMapperScanner testMapperScanner = new TestMapperScanner(registry);
        testMapperScanner.scan("com.second.degree.java.mybatis.mapper");
    }
}
```

## @MapperScan注解的底层源码分析

@MapperScan注解是MyBatis框架提供的一个注解，用于扫描Mapper接口并将其注册到Spring容器中。其底层源码分析可以从以下几个方面入手：

1. @MapperScan注解的定义：可以查看该注解的定义，了解其属性和作用。
2. 扫描器的实现：@MapperScan注解的底层实现是通过扫描器实现的，可以查看扫描器的源码，了解其扫描的规则和实现方式。
3. 注册Mapper接口：扫描器扫描到Mapper接口后，需要将其注册到Spring容器中，可以查看注册的源码，了解其实现方式和注册的规则。
4. 与Spring集成：@MapperScan注解是与Spring集成的，可以查看其与Spring集成的源码，了解其实现方式和与Spring的交互方式。

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Import(TestImportBeanDefinitionRegistrar.class)
public @interface TestMapperScan {
    String value();
}
```

```java
@TestMapperScan("com.second.degree.java.mybatis.mapper")
public class DegreeApplication {}
```

```java
public class TestImportBeanDefinitionRegistrar implements ImportBeanDefinitionRegistrar {

    @Override
    public void registerBeanDefinitions(AnnotationMetadata importingClassMetadata, BeanDefinitionRegistry registry) {

        Map<String, Object> annotationAttributes = importingClassMetadata.getAnnotationAttributes(TestMapperScan.class.getName());
        String path = (String) annotationAttributes.get("value");

        TestMapperScanner testMapperScanner = new TestMapperScanner(registry);
        testMapperScanner.scan(path);
    }
}
```

## Spring整合Mybatis的底层源码分析

mybaits 2.0.6 以下版本直接在registerBeanDefinitions 中实现 Scanner 扫描器，使用注解@MapperScan。

```java
@MapperScan
public class DegreeApplication {}
```

```java
void registerBeanDefinitions(AnnotationAttributes annoAttrs, BeanDefinitionRegistry registry) {
        ClassPathMapperScanner scanner = new ClassPathMapperScanner(registry);
	...
}
```

mybaits 2.0.6 以上版本 是通过另一个Bean MapperScannerConfigurer 实现Scanner 扫描器，可以不使用@MapperScan，通过注册MapperScannerConfigurer 实现扫描。

```java
void registerBeanDefinitions(AnnotationMetadata annoMeta, AnnotationAttributes annoAttrs, BeanDefinitionRegistry registry, String beanName) {
        BeanDefinitionBuilder builder = BeanDefinitionBuilder.genericBeanDefinition(MapperScannerConfigurer.class);
	...
}
```

```java
public class DegreeApplication {

    @Bean
    public MapperScannerConfigurer mapperScannerConfigurer() {
        MapperScannerConfigurer configurer = new MapperScannerConfigurer();
        configurer.setBasePackage("com.second.degree.java.mybatis.mapper");
        return configurer;
    }
}
```

## SpringBoot整合Mybatis的底层源码分析

1. 使用@MapperScan，会扫到很多无用的类，效率会差点。mybatis-spring包。

2. 自动配置类MybatisAutoConfiguration。mybatis-spring-boot-autoconfigure包。

   ```java
   public void registerBeanDefinitions(AnnotationMetadata importingClassMetadata, BeanDefinitionRegistry registry) {
       if (!AutoConfigurationPackages.has(this.beanFactory)) {
           MybatisAutoConfiguration.logger.debug("Could not determine auto-configuration package, automatic mapper scanning disabled.");
       } else {
           MybatisAutoConfiguration.logger.debug("Searching for mappers annotated with @Mapper");
           // 扫描的包路径 为 springboot 启动 run 方法的路径
           List<String> packages = AutoConfigurationPackages.get(this.beanFactory);
           if (MybatisAutoConfiguration.logger.isDebugEnabled()) {
               packages.forEach((pkg) -> {
                   MybatisAutoConfiguration.logger.debug("Using auto-configuration base package '{}'", pkg);
               });
           }

           BeanDefinitionBuilder builder = BeanDefinitionBuilder.genericBeanDefinition(MapperScannerConfigurer.class);
           builder.addPropertyValue("processPropertyPlaceHolders", true);
           // 只识别@Mapper 注解定义的接口类
           builder.addPropertyValue("annotationClass", Mapper.class);
           builder.addPropertyValue("basePackage", StringUtils.collectionToCommaDelimitedString(packages));
           BeanWrapper beanWrapper = new BeanWrapperImpl(MapperScannerConfigurer.class);
           Set<String> propertyNames = (Set)Stream.of(beanWrapper.getPropertyDescriptors()).map(FeatureDescriptor::getName).collect(Collectors.toSet());
           if (propertyNames.contains("lazyInitialization")) {
               builder.addPropertyValue("lazyInitialization", "${mybatis.lazy-initialization:false}");
           }

           if (propertyNames.contains("defaultScope")) {
               builder.addPropertyValue("defaultScope", "${mybatis.mapper-default-scope:}");
           }

           boolean injectSqlSession = (Boolean)this.environment.getProperty("mybatis.inject-sql-session-on-mapper-scan", Boolean.class, Boolean.TRUE);
           if (injectSqlSession && this.beanFactory instanceof ListableBeanFactory) {
               ListableBeanFactory listableBeanFactory = (ListableBeanFactory)this.beanFactory;
               Optional<String> sqlSessionTemplateBeanName = Optional.ofNullable(this.getBeanNameForType(SqlSessionTemplate.class, listableBeanFactory));
               Optional<String> sqlSessionFactoryBeanName = Optional.ofNullable(this.getBeanNameForType(SqlSessionFactory.class, listableBeanFactory));
               if (!sqlSessionTemplateBeanName.isPresent() && sqlSessionFactoryBeanName.isPresent()) {
                   builder.addPropertyValue("sqlSessionFactoryBeanName", sqlSessionFactoryBeanName.get());
               } else {
                   builder.addPropertyValue("sqlSessionTemplateBeanName", sqlSessionTemplateBeanName.orElse("sqlSessionTemplate"));
               }
           }

           builder.setRole(2);
           registry.registerBeanDefinition(MapperScannerConfigurer.class.getName(), builder.getBeanDefinition());
       }
   }
   ```
