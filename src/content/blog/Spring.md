---
title: "Spring"
description: "Spring等知识记录"
pubDatetime: 2022-09-25T15:20:35Z
heroImage: "/blog-placeholder-1.jpg"
tags:
  - java
  - spring
---

# Spring

## 常见异常

| 异常                                   | 描述                                                                                                                                                                                 |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ClassCastException                     | 类型强制转换异常                                                                                                                                                                     |
| NegativeArrayException                 | 数组负下标异常                                                                                                                                                                       |
| ArrayIndexOutOfBoundsException         | 数组下标越界异常                                                                                                                                                                     |
| SecturityException                     | 违背安全原则异常                                                                                                                                                                     |
| EOFException                           | 文件已结束异常                                                                                                                                                                       |
| FileNotFoundException                  | 文件未找到异常                                                                                                                                                                       |
| NumberFormatException                  | 字符串转换为数字异常                                                                                                                                                                 |
| SQLException                           | 操作数据库异常                                                                                                                                                                       |
| IOException                            | 输入输出异常                                                                                                                                                                         |
| NoSuchMethodException                  | 方法未找到异常                                                                                                                                                                       |
| Java.lang.AbstractMethodError          | 抽象方法错误。当应用试图调用抽象方法时抛出。                                                                                                                                         |
| java.lang.AssertionError               | 断言错。用来指示一个断言失败的情况。                                                                                                                                                 |
| java.lang.ClassCircularityError        | 类循环依赖错误。在初始化一个类时，若检测到类之间循环依赖则抛出该异常。                                                                                                               |
| java.lang.ClassFormatError             | 类格式错误。当Java虚拟机试图从一个文件中读取Java类，而检测到该文件的内容不符合类的有效格式时抛出。                                                                                   |
| java.lang.Error                        | 错误。是所有错误的基类，用于标识严重的程序运行问题。这些问题通常描述一些不应被应用程序捕获的反常情况。                                                                               |
| java.lang.ExceptionInInitializerError  | 初始化程序错误。当执行一个类的静态初始化程序的过程中，发生了异常时抛出。静态初始化程序是指直接包含于类中的static语句段。                                                             |
| java.lang.IllegalAccessError           | 违法访问错误。当一个应用试图访问、修改某个类的域(Field)或者调用其方法，但是又违反域或方法的可见性声明，则抛出该异常。                                                                |
| java.lang.IncompatibleClassChangeError | 不兼容的类变化错误。当正在执行的方法所依赖的类定义发生了不兼容的改变时，抛出该异常。一般在修改了应用中的某些类的声明定义而没有对整个应用重新编译而直接运行的情况下，容易引发该错误。 |
| java.lang.InstantiationError           | 实例化错误。当一个应用试图通过Java的new操作符构造一个抽象类或者接口时抛出该异常.                                                                                                     |
| java.lang.InternalError                | 内部错误。用于指示Java虚拟机发生了内部错误。                                                                                                                                         |
| java.lang.LinkageError                 | 链接错误。该错误及其所有子类指示某个类依赖于另外一些类，在该类编译之后，被依赖的类改变了其类定义而没有重新编译所有的类，进而引发错误的情况。                                         |
| java.lang.NoClassDefFoundError         | 未找到类定义错误。当Java虚拟机或者类装载器试图实例化某个类，而找不到该类的定义时抛出该错误。                                                                                         |
| java.lang.NoSuchFieldError             | 域不存在错误。当应用试图访问或者修改某类的某个域，而该类的定义中没有该域的定义时抛出该错误。                                                                                         |
| java.lang.NoSuchMethodError            | 方法不存在错误。当应用试图调用某类的某个方法，而该类的定义中没有该方法的定义时抛出该错误。                                                                                           |
| java.lang.OutOfMemoryError             | 内存不足错误。当可用内存不足以让Java虚拟机分配给一个对象时抛出该错误。                                                                                                               |
| java.lang.StackOverflowError           | 堆栈溢出错误。当一个应用递归调用的层次太深而导致堆栈溢出时抛出该错误。                                                                                                               |
| java.lang.ThreadDeath                  | 线程结束。当调用Thread类的stop方法时抛出该错误，用于指示线程结束。                                                                                                                   |
| java.lang.UnknownError                 | 未知错误。用于指示Java虚拟机发生了未知严重错误的情况。                                                                                                                               |
| java.lang.UnsatisfiedLinkError         | 未满足的链接错误。当Java虚拟机未找到某个类的声明为native方法的本机语言定义时抛出。                                                                                                   |
| java.lang.UnsupportedClassVersionError | 不支持的类版本错误。当Java虚拟机试图从读取某个类文件，但是发现该文件的主、次版本号不被当前Java虚拟机支持的时候，抛出该错误。                                                         |
| java.lang.VerifyError                  | 验证错误。当验证器检测到某个类文件中存在内部不兼容或者安全问题时抛出该错误。                                                                                                         |
| java.lang.VirtualMachineError          | 虚拟机错误。用于指示虚拟机被破坏或者继续执行操作所需的资源不足的情况                                                                                                                 |

## lambda

求两个对象 list 的交集

```java
private List<People> sameList(List<People> oldArrayList, List<People> newArrayList) {
    List<People> resultList = newArrayList.stream()
            .filter(item -> oldArrayList.stream().map(e -> e.getCode())
                    .collect(Collectors.toList()).contains(item.getCode()))
            .collect(Collectors.toList());
    return resultList;
}
```

求两个对象 list 的差集

```java
private List<People> diffList(List<People> firstArrayList, List<People> secondArrayList) {
        List<People> resultList = firstArrayList.stream()
                .filter(item -> !secondArrayList.stream().map(e -> e.getCode()).collect(Collectors.toList()).contains(item.getCode()))
                .collect(Collectors.toList());
        return resultList;
    }
```

list 去除另一个 list 重复元素的数据

```java
firstList.removeIf(first -> secondList.stream().anyMatch(second -> first.getCode().equals(second.getCode())));
```

## 正则

(?!0(\.0+)?$) 使用负向前瞻，排除0、0.0、0.00等数字。

(?!0+(\.\d+)?$) 使用负向前瞻，排除以0开头的数字，如0.123、0.001等。

\d+(\.\d+)? 匹配正整数和小数，其中小数点后面至少有一位数字

## Spring boot

为什么打成的jar包，通过java -jar xxx.jar 就能启动运行？

jar包里面含有一下三部分文件

![image-20230404172555912](https://github.com/chou401/pic-md/raw/master/img/image-20230404172555912.png)

> org：主要存放springboot相关的class文件
> META-INF：主要存放maven和MANIFEST.MF文件
> BOOT-INF/classes：主要存放应用编译后的class文件
> BOOT-INF/lib：主要存放应用依赖的jar包文件

打开META-INF下MENIFEST.MF文件，内容如下：

![image-20230404172728434](https://github.com/chou401/pic-md/raw/master/img/image-20230404172728434.png)

从上述MANIFEST.MF中可以看到Main-Class及Start-Class配置，其中Main-Class指定jar文件的入口类JarLauncher，当使用java -jar执行jar包的时候会调用JarLauncher的main方法，而不是我们编写的启动类。

JarLauncher叫做jar包启动器，当我们运行java -jar 的时候就会找到这个启动器。

这个启动器是我们在打包的时候弄进去的，也就是我们在pom文件中加入的插件：

```xml
<build>
<plugins>
<plugin>
<groupId>org.springframework.boot</groupId>
<artifactId>spring-boot-maven-plugin</artifactId>
</plugin>
</plugins>
</build>
```

> 注意：
> 只有添加了spring-boot-maven-plugin插件，运行mvn:package命令后打成的jar包才能直接运行。

这个插件在打包时候就会把jar启动器添加进去。

**java -jar 做了什么**

> 官网对java -jar的解释如下：
>
> If the -jar option is specified, its argument is the name of the JAR file containing class and resource files for the application. The startup class must be indicated by the Main-Class manifest header in its source code.
>
> 如果指定了-jar选项，它的参数是包含应用程序的类和资源文件的JAR文件的名称。启动类必须由其源代码中的Main-Class清单头指明。

由此可见：当使用java -jar 启动springboot jar包时是去找Manifast.MF文件中的Main-Class指定的类来启动项目。

**JarLauncher的执行流程**

> org.springframework.boot.loader.JarLauncher#main
> org.springframework.boot.loader.Launcher#launch(java.lang.String[])
> org.springframework.boot.loader.Launcher#launch(java.lang.String[], java.lang.String, java.lang.ClassLoader) 中的第二个参数mainClass-》org.springframework.boot.loader.ExecutableArchiveLauncher#getMainClass
> org.springframework.boot.loader.Launcher#createMainMethodRunner
> org.springframework.boot.loader.MainMethodRunner#run

添加spring-boot-loader依赖，才可以查看源码

```xml
<dependency>
	<groupId>org.springframework.boot</groupId>
	<artifactId>spring-boot-loader</artifactId>
	<version>2.1.16.RELEASE</version>
</dependency>
```

```java
package org.springframework.boot.loader;

import org.springframework.boot.loader.archive.Archive;

/**
 * {@link Launcher} for JAR based archives. This launcher assumes that dependency jars are
 * included inside a {@code /BOOT-INF/lib} directory and that application classes are
 * included inside a {@code /BOOT-INF/classes} directory.
 *
 * {@link Launcher}用于基于JAR的档案。该启动程序假设依赖jar包含在{@code BOOT-INFlib}目录中，并且应用程序类包含在{@code BOOT-INFclasses}目录中。
 *
 * @author Phillip Webb
 * @author Andy Wilkinson
 * @since 1.0.0
 */
public class JarLauncher extends ExecutableArchiveLauncher {

	static final String BOOT_INF_CLASSES = "BOOT-INF/classes/";

	static final String BOOT_INF_LIB = "BOOT-INF/lib/";

	public JarLauncher() {
	}

	protected JarLauncher(Archive archive) {
		super(archive);
	}

	@Override
	protected boolean isNestedArchive(Archive.Entry entry) {
		if (entry.isDirectory()) {
			return entry.getName().equals(BOOT_INF_CLASSES);
		}
		return entry.getName().startsWith(BOOT_INF_LIB);
	}
	//main方法入口， 构造JarLauncher，然后调用它的launch方法。参数是控制台传递的
	public static void main(String[] args) throws Exception {
		new JarLauncher().launch(args);
	}

}
```

**启动类基类**：org.springframework.boot.loader.Launcher-》org.springframework.boot.loader.Launcher#launch(java.lang.String[])

```java
/**
 * Base class for launchers that can start an application with a fully configured
 * classpath backed by one or more {@link Archive}s.
 *	启动器的基类，可以用一个或多个{@link Archive}支持的完整配置的类路径启动应用程序。
 * @author Phillip Webb
 * @author Dave Syer
 * @since 1.0.0
 */
public abstract class Launcher {

	/**
	 * Launch the application. This method is the initial entry point that should be
	 * called by a subclass {@code public static void main(String[] args)} method.
	 * 启动应用程序。这个方法是一个初始入口点，它应该被子类{@code public static void main(String[] args)}方法调用。
	 * @param args the incoming arguments
	 * @throws Exception if the application fails to launch
	 */
	protected void launch(String[] args) throws Exception {
		//在系统属性中设置注册了自定义的URL处理器：org.springframework.boot.loader.jar.Handler。如果URL中没有指定处理器，会去系统属性中查询
		JarFile.registerUrlProtocolHandler();
		// getClassPathArchives方法在会去找lib目录下对应的第三方依赖JarFileArchive，同时也会项目自身的JarFileArchive
        // 根据getClassPathArchives得到的JarFileArchive集合去创建类加载器ClassLoader。这里会构造一个LaunchedURLClassLoader类加载器，这个类加载器继承URLClassLoader，并使用这些JarFileArchive集合的URL构造成URLClassPath
        // LaunchedURLClassLoader类加载器的父类加载器是当前执行类JarLauncher的类加载器
		ClassLoader classLoader = createClassLoader(getClassPathArchives());
		// getMainClass方法会去项目自身的Archive中的Manifest中找出key为Start-Class的类
		// 调用重载方法launch
		launch(args, getMainClass(), classLoader);
	}
	......
	......
}
```

可执行存档启动类的基类：org.springframework.boot.loader.ExecutableArchiveLauncher -》org.springframework.boot.loader.ExecutableArchiveLauncher#getMainClass

```java
/**
 * Base class for executable archive {@link Launcher}s.
 * 可执行存档{@link启动器}的基类。
 * @author Phillip Webb
 * @author Andy Wilkinson
 * @since 1.0.0
 */
public abstract class ExecutableArchiveLauncher extends Launcher {

	private final Archive archive;

	public ExecutableArchiveLauncher() {
		try {
			this.archive = createArchive();
		}
		catch (Exception ex) {
			throw new IllegalStateException(ex);
		}
	}

	protected ExecutableArchiveLauncher(Archive archive) {
		this.archive = archive;
	}

	protected final Archive getArchive() {
		return this.archive;
	}

	@Override
	protected String getMainClass() throws Exception {
		//跟代码this.archive.getManifest()发现对应的是org.springframework.boot.loader.archive.JarFileArchive#getManifest
		//继续跟进入org.springframework.boot.loader.jar.JarFile#getManifest
		//最后org.springframework.boot.loader.jar.JarFile#getManifest对应的是META-INF/MANIFEST.MF文件的内容
		Manifest manifest = this.archive.getManifest();
		String mainClass = null;
		if (manifest != null) {
			//获取META-INF/MANIFEST.MF文件内容中的Start-Class，这才是我们自己写的启动类
			mainClass = manifest.getMainAttributes().getValue("Start-Class");
		}
		if (mainClass == null) {
			throw new IllegalStateException("No 'Start-Class' manifest entry specified in " + this);
		}
		return mainClass;
	}
	......
	......
}
```

到此可以看出org.springframework.boot.loader.Launcher#launch(java.lang.String[], java.lang.String, java.lang.ClassLoader)中的mainClass参数正是我们自己写的启动类，也就是META-INF/MANIFEST.MF文件中Start-Class指定的类。

**Launcher的launch方法**：org.springframework.boot.loader.Launcher#launch(java.lang.String[], java.lang.String, java.lang.ClassLoader)

```java
/**
 * Launch the application given the archive file and a fully configured classloader.
 * 启动应用程序，给出归档文件和一个完全配置的类加载器。
 * @param args the incoming arguments
 * @param mainClass the main class to run
 * @param classLoader the classloader
 * @throws Exception if the launch fails
 */
protected void launch(String[] args, String mainClass, ClassLoader classLoader) throws Exception {
	Thread.currentThread().setContextClassLoader(classLoader);
	createMainMethodRunner(mainClass, args, classLoader).run();
}
```

**org.springframework.boot.loader.Launcher#createMainMethodRunner**

```java
/**
 * Create the {@code MainMethodRunner} used to launch the application.
 * @param mainClass the main class
 * @param args the incoming arguments
 * @param classLoader the classloader
 * @return the main method runner
 */
protected MainMethodRunner createMainMethodRunner(String mainClass, String[] args, ClassLoader classLoader) {
	return new MainMethodRunner(mainClass, args);
}
```

**MainMethodRunner**：org.springframework.boot.loader.MainMethodRunner-》org.springframework.boot.loader.MainMethodRunner#run

```java
/**
 * Utility class that is used by {@link Launcher}s to call a main method. The class
 * containing the main method is loaded using the thread context class loader.
 * 被{@link Launcher}用来调用main方法的实用程序类。包含main方法的类是使用线程上下文类装入器装入的。
 * @author Phillip Webb
 * @author Andy Wilkinson
 * @since 1.0.0
 */
public class MainMethodRunner {

	private final String mainClassName;

	private final String[] args;

	/**
	 * Create a new {@link MainMethodRunner} instance.
	 * @param mainClass the main class
	 * @param args incoming arguments
	 */
	public MainMethodRunner(String mainClass, String[] args) {
		this.mainClassName = mainClass;
		this.args = (args != null) ? args.clone() : null;
	}

	public void run() throws Exception {
		Class<?> mainClass = Thread.currentThread().getContextClassLoader().loadClass(this.mainClassName);
		Method mainMethod = mainClass.getDeclaredMethod("main", String[].class);
		mainMethod.invoke(null, new Object[] { this.args });
	}

}
```

上述关键代码执行流程简化如下图:

![img](https://raw.githubusercontent.com/chou401/pic-md/master/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0VmbHlpbmdz,size_16,color_FFFFFF,t_70.png)

**使用依赖包common**

common 执行mvn install时，会报错提示 Unable to find a single main class。spring boot项目使用maven打包，如果没有做配置的话，会自动寻找签名是public static void main(String[] args)的方法。common 只是一个服务工程，本来就不会存在启动入口。

在common中添加过滤配置即可打包成功：

```xml
<plugin>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-maven-plugin</artifactId>
    <configuration>
        <skip>true</skip>
    </configuration>
</plugin>
```

**jar启动器的作用**

当我们使用java -jar的时候 JarLauncher 会将BOOT-INF/classes下的类文件和BOOT-INF/lib下依赖的jar包加载到classpath下，最后调用META-INF下的MANIFEST.MF文件的Start-Class属性来完成应用程序的启动。

### Spring 自动配置

![image-20230823113954382](/Users/chouchou/Library/Application Support/typora-user-images/image-20230823113954382.png)

SpringBoot 自动配置，Auto-Configuration

- 它是指基于你引入的依赖 jar 包，对 SpringBoot 应用进行自动配置
- 它是SpringBoot框架的“开箱即用”提供了基础支撑

术语“配置类”，Configuration Class

- 广义的“配置类”：被注解@Component 直接或间接修饰的某个类，即我们常说的 Spring 组件，其中包括了@Configuration 类
- 狭义的“配置类”：特指被注解 @Configuration 所修饰的某个类，又成为 @Configuration 类

![image-20230822172218836](https://raw.githubusercontent.com/chou401/pic-md/master/image-20230822172218836.png)

![image-20230822172402498](https://raw.githubusercontent.com/chou401/pic-md/master/image-20230822172402498.png)

![image-20230822173011734](https://raw.githubusercontent.com/chou401/pic-md/master/image-20230822173011734.png)

![image-20230823113418389](https://raw.githubusercontent.com/chou401/pic-md/master/image-20230823113418389.png)

![image-20230823113448199](https://raw.githubusercontent.com/chou401/pic-md/master/image-20230823113448199.png)

![image-20230823113602551](https://raw.githubusercontent.com/chou401/pic-md/master/image-20230823113602551.png)

![image-20230823113646014](https://raw.githubusercontent.com/chou401/pic-md/master/image-20230823113646014.png)

#### @Conditional

- 它的作用是实现：只有在特定条件满足时，才会向 IOC 容器注册指定的组件
- 我们可以将 @Conditional 理解为某种 if 语句

![image-20230823113909162](https://raw.githubusercontent.com/chou401/pic-md/master/image-20230823113909162.png)

#### @ConditionalOnProperty

该注解的作用是可以通过配置文件中的属性值来判定 configuration 是否被注入，这样就可以灵活的配置组件的启用。

```java
//
// Source code recreated from a .class file by IntelliJ IDEA
// (powered by FernFlower decompiler)
//

package org.springframework.boot.autoconfigure.condition;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.springframework.context.annotation.Conditional;

@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE, ElementType.METHOD})
@Documented
@Conditional({OnPropertyCondition.class})
public @interface ConditionalOnProperty {
  	/**
     * 该属性与下面的 name 属性不可同时使用，
     * 当value所对应配置文件中的值为false时，注入不生效，不为fasle注入生效
     * value有多个值时，只要有一个值对应为false,则注入不成功
     */
    String[] value() default {};

  	/**
     * 配置文件中key的前缀，可与value 或 name 组合使用
     */
    String prefix() default "";

  	/**
     * 与 value 作用一致
     */
    String[] name() default {};

  	/**
     * 与value 或 name 组合使用，只有当value 或 name 对应的值与havingValue的值相同时，注入生效
     */
    String havingValue() default "";

  	/**
     * 该属性为true时，配置文件中缺少对应的value或name的对应的属性值，也会注入成功
     */
    boolean matchIfMissing() default false;
}
```

配置文件

```yaml
cod:
  test: false
```

配置类

```java
@Slf4j
@Component
@EnableScheduling
@ConditionalOnProperty(name = "cod.test")
public class ConditionalOnPropertyTest {

    @Scheduled(cron = "*/5 * * * * ?")
    public void test() {
        log.info("定时器执行。。。。");
    }
}
```

启动服务之后，只要配置了 code.test 且不为 false，都是有效的。

```java
// 只要配置文件中 code.test 为 false，即使设置 matchIfMissing = true 也是无效的
// 若没有配置 code.test，则 matchIfMissing 为 true 执行，false 不执行
@ConditionalOnProperty(prefix = "cod", name = "test", matchIfMissing = true)
```

```java
// 配置 code.test=111，相等于 havingValue，则执行，不同，不执行，即使设置 matchIfMissing = true 也是无效的
// 若 code.test=false，havingValue=false，则认为相等，执行
// 若没有配置 code.test，则 matchIfMissing 为 true 执行，false 不执行
@ConditionalOnProperty(prefix = "cod", name = "test", havingValue = "111",matchIfMissing = true)
```

有配置看value，没配置看matchIfMissing。

#### @ComponentScan

@ComponentScan，来自 Spring 框架的一个注解

- 对指定的 package 进行扫描，找到其中符合条件的类，默认是搜索被注解@Component 修饰的配置类
- 通过属性 basePackages 或 basePackageClasses，来指定要进行扫描的 package
- 如果未指定 package，则默认扫描当前 @ComponentScan 所修饰的类所在的 package

#### @Import & @Configuration

通常，`@Import` 和 `@Configuration` 共同使用，用于在容器中注册对应的 **BeanDefinition**。

##### @Configuration

被 `@Configuration` 标注的类，通常称为 **配置类**，但配置类，并不单单指标注了 `@Configuration` 的类

- 标注了 @Configuration 的配置类，称为 FULL 配置类，在 FULL 配置类中注册的 组件类，会在 ConfigurationClassPostProcessor#postProcessBeanFactory 方法中被 ConfigurationClassEnhancer 代理，交由 容器 处理依赖关系
- 而对于没有标注 `@Configuration`，但是标注了 `@Import` `Component` `ComponentScan` `ImportResource` 或者含有被 `Bean` 注解标注方法的配置类，称为 **LITE** 配置类
- 对于 FULL配置类 和 LITE配置类，ConfigurationClassPostProcessor 会委托 ConfigurationClassParser 类解析处理对应的 Component @PropertySource @ComponentScan @Import @ImportResource 注解以及标注了 @Bean 的方法

###### FULL & LITE

**FULL配置类** & **LITE配置类** 的区别，可以看以下示例体会

```java
public class A {
	public A() {
		System.out.println("...A");
	}
}

public class B {
	public B(A a) {
		System.out.println("...B");
	}
}

@Configuration
@ComponentScan("com.xsn.configurationtest")
public class MyConfigurationConfig {

	@Bean
	public A a() {
		return new A();
	}

	@Bean
	public B b() {
		return new B(a());
	}
}

public static void main(String[] args) {
	AnnotationConfigApplicationContext ac =
			new AnnotationConfigApplicationContext(MyConfigurationConfig.class);

	A a = ac.getBean(A.class);
	System.out.println(a);

	B b = ac.getBean(B.class);
	System.out.println(b);

}

结果：
FULL配置类（加了 @Configuration）：
...A
...B

LITE配置类（注释掉 @Configuration）：
...A
...A
...B

```

可以看到在 **FULL配置类** 下，**A** 和 **B** 的 **依赖关系** 将由 **容器** 处理。

我们可以看到，没有 @Configuration 修饰的时候，A 被实例化了两次。

现在我们搞清楚了@Configuration主要是用来做什么的了吧，它就是为了能够让我们spring，比如所我们的springboot或者spring在写上这种@Bean注解的时候（利用Java Config注解来完成对spring环境开发的时候），保证bean的一个作用域，保证它（bean）的生命周期跟它的作用域，包括Scope，Scope就是我们讲的单例（singletion）和原型（prototype）。

正常来说，我们在 B 中实现了 A 就应该是实例化两次，为什么会出现添加了 @Configuration 只实例化一次的情况那？

那么它没有执行两遍只有一个原因，你们可以思考一下，当我们一个方法调用的时候它的预期结果跟你想的不一样，那么你觉得是什么导致的。说白了，就是这个方法被改变了，这个方法不再是原来的这个方法，。因为我们这个方法，它的结果是必然的，它必然会产生一个类，但是我们调用两次它只产生一个类。那就违背了它的必然结果，那就说明了这个代码已经被别人改了。那么被随改了，肯定是被spring改了。那么按照我们现在所学的知识当中，我们要去改变一个方法的行为，没有改源码，可以用什么实现？

在这里用的是cglib动态代理。

不添加 @Configuration

```java
public static void main(String[] args) {
	AnnotationConfigApplicationContext ac =
			new AnnotationConfigApplicationContext(MyConfigurationConfig.class);

	MyConfigurationConfig myConfigurationConfig = ac.getBean(MyConfigurationConfig.class);
	System.out.println(myConfigurationConfig);

}

结果：
  （注释掉 @Configuration）
  xxx.MyConfigurationConfig@2833cc44
  （加了 @Configuration）
  xxx.MyConfigurationConfig$$EnhancerBySpringCGLIB$$e52e37ff@588df31b
```

当然这里，会有疑问既然加不加 @Configuration 都可以获取 bean，那为什么还要使用那？

别傻了，小伙子，这里只是一个特殊情况，我们自己手动注册实现的，AnnotationConfigApplicationContext 里面会执行 this.register(componentClasses)，正常情况，不添加 @Configuration，Spring 容器根本就不会扫描，怎么可能会获取到 bean 那。

##### @Import

- 提供了一种显示地从其他地方加载配置类的方式，这样可以避免使用性能较差的组件扫描（Component Scan）
- 属性值

  - @Import 的属性值可以是一个 配置类，此处的配置类，可以是一个 @Configuration 注解标注的配置类（FULL 配置类）、一个标注了 @Import Component ComponentScan ImportResource 或者含有被 Bean 注解标注的方法（LITE 配置类）、甚至一个普通类

  - 一个实现了 **ImportSelector** 的类
  - 一个实现了 **ImportBeanDefinitionRegistrar** 的类

`@Import` 和 `@Configuration` 共同使用，用于在容器中注册对应的 **BeanDefinition**

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface Import {

	Class<?>[] value();

}
```

**配置类**

```java
public class C {
	public C() {
		System.out.println("...c");
	}
}

@Configuration
@ComponentScan("com.xsn.configurationtest")
@Import(C.class)
public class MyConfigurationConfig {

}

public static void main(String[] args) {
	AnnotationConfigApplicationContext ac =
			new AnnotationConfigApplicationContext(MyConfigurationConfig.class);

	C c = ac.getBean(C.class);
	System.out.println(c);
}

结果：
com.xsn.configurationtest.C@71ba6d4e
```

类 **C** 就是一个普通类，同样也可以 **Import** 一个配置类（**FULL** & **LITE**），如下

```java
@Configuration
@Import(C.class)
public class ImportConfiguration {

}

@Configuration
@ComponentScan("com.xsn.configurationtest")
@Import(ImportConfiguration.class)
public class MyConfigurationConfig {

}

public static void main(String[] args) {
	AnnotationConfigApplicationContext ac =
			new AnnotationConfigApplicationContext(MyConfigurationConfig.class);

	C c = ac.getBean(C.class);
	System.out.println(c);
}

结果：
com.xsn.configurationtest.C@71ba6d4e
```

###### ImportSelector

同样，`@Import` 注解可以 **Import** 一个 **ImportSelector** 的实现类

```java
public interface ImportSelector {

	// 返回要 Import 的配置类名
	String[] selectImports(AnnotationMetadata importingClassMetadata);

	// 允许提供一个 Predicate 过滤 selectImports 方法对应的类
	@Nullable
	default Predicate<String> getExclusionFilter() {
		return null;
	}

}
```

类似于直接 Import 配置类，但是 ImportSelector 的实现类可以基于对应配置类的 AnnotationMetadata 属性进行 select，同时还可以实现各种 Aware 接口类似 EnvironmentAware BeanFactoryAware 等，持有对应的 Environment BeanFactory 来进行 select

```java
public class MyImportSelector implements ImportSelector {

	@Override
	public String[] selectImports(AnnotationMetadata importingClassMetadata) {
		StandardAnnotationMetadata standardAnnotationMetadata
				= (StandardAnnotationMetadata) importingClassMetadata;
		return new String[]{"com.xsn.configurationtest.C"};
	}

	@Override
	public Predicate<String> getExclusionFilter() {
		return null;
	}
}

@Configuration
@ComponentScan("com.xsn.configurationtest")
@Import(MyImportSelector.class)
public class MyConfigurationConfig {

}

public static void main(String[] args) {
	AnnotationConfigApplicationContext ac =
			new AnnotationConfigApplicationContext(MyConfigurationConfig.class);

	C c = ac.getBean(C.class);
	System.out.println(c);
}

结果：
com.xsn.configurationtest.C@5ab956d7
```

###### DeferredImportSelector

**DeferredImportSelector** 继承了 **ImportSelector**，当 **Import** 的是一个 **DeferredImportSelector** 时，该 **DeferredImportSelector** 会在最后解析，主要用于有 `@Conditional` 注解的配置类

###### ImportBeanDefinitionRegistrar

同样，`@Import` 注解可以 **Import** 一个 **ImportBeanDefinitionRegistrar** 的实现类

```java
public interface ImportBeanDefinitionRegistrar {

	// 基于 AnnotationMetadata BeanDefinitionRegistry 注册对应的 BeanDefinition
	default void registerBeanDefinitions(AnnotationMetadata importingClassMetadata, BeanDefinitionRegistry registry,
			BeanNameGenerator importBeanNameGenerator) {

		registerBeanDefinitions(importingClassMetadata, registry);
	}

	default void registerBeanDefinitions(AnnotationMetadata importingClassMetadata, BeanDefinitionRegistry registry) {
	}

}
```

**ImportBeanDefinitionRegistrar** 也可以实现各种 **Aware** 接口类似 **EnvironmentAware** **BeanFactoryAware** 等，持有对应的 **Environment** **BeanFactory** 来进行 `register`

我们使用 **Spring AOP** 时，在配置类上添加的 `@EnableAspectJAutoProxy` 注解

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Import(AspectJAutoProxyRegistrar.class)
public @interface EnableAspectJAutoProxy
```

它 Import 的 AspectJAutoProxyRegistrar 便是一个 ImportBeanDefinitionRegistrar，该类会帮我们注册一个 AnnotationAwareAspectJAutoProxyCreator 的 BeanDefinition，实现 AOP 代理

### Spring 自动装配

自动配置：Auto-Configuration

自动装配：Autowire

这是两个不同的东西。

#### Spring注解发展过程

SpringBoot的自动装配依赖于注解，所以我们先来看一下注解的发展过程。

以下主要对核心注解进行说明

- **Spring1.0**：刚刚出现注解。

  - @Transaction：简化了事务的操作

- **Spring2.0**：一些配置开始被 xml 代替，但是还不能完全摆脱xml，主要是component-scan标签。

  - @Required：用在set方法上，如果加上该注解，表示在xml中必须设置属性的值，不然就会报错。
  - @Aspect ：AOP相关的一个注解，用来标识配置类。
  - @Autowired，@Qualifier：依赖注入
  - @Component，@Service，@Controller，@Repository：主要是声明一些bean对象放入IOC中。
  - @RequestMapping： 声明请求对应的处理方法

- **Spring3.0**：已经完全可以用注解代替xml文件了

  - @Configuration：配置类，代理xml配置文件

  - @ComponentScan：扫描其他注解，代理xml中的component-scan标签。

  - @Import：只能用在类上，主要是用来加载第三方的类。

    - @import(value = {XXX.class})：加载一个普通的类

    - @Import(MyImportSelector.class)：这种主要是根据业务选择性加载一些类。

      ```java
      public class MyImportSelector implements ImportSelector {//继承该接口
          @Override　　//重写selectImports方法
          public String[] selectImports(AnnotationMetadata importingClassMetadata) {
              //返回对象对应的类型的全类路径的字符串数组
              return new String[]{XXX1.class.getName(), XXX2.class.getName()};
          }
      }
      ```

    - @Import(MyImportBeanDefinitionRegistrar.class)：跟上面一样，都是根据业务选择性的加载一些类。只是返回的内容不一样，上面是直接返回选择的类的全路径，这个是将加载的类注册到一个BeanDefinitionRegistry中返回。

      ```java
      public class MyImportBeanDefinitionRegistrar implements ImportBeanDefinitionRegistrar {//继承该接口

          @Override   //重写registerBeanDefinitions方法
          public void registerBeanDefinitions(AnnotationMetadata importingClassMetadata, BeanDefinitionRegistry registry) {
               // 将需要注册的对象封装为 RootBeanDefinition 对象
              RootBeanDefinition xxx1 = new RootBeanDefinition(XXX1.class);
              registry.registerBeanDefinition("xxx1", xxx1);
              //再注册一个
              RootBeanDefinition xxx2 = new RootBeanDefinition(XXX2.class);
              registry.registerBeanDefinition("xxx2", xxx2);
          }
      }
      ```

- **Spring4.0**：

  - @Conditional：按照一定的条件进行判断，满足条件就给容器注册Bean实例。

    ```java
    /**
     * 定义一个 Condition 接口的是实现
     */
    public class MyCondition implements Condition {
        @Override
        public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
            //业务逻辑...
            return false; // 默认返回false
        }
    }
    ```

    ```java
    //使用
    @Configuration
    public class JavaConfig {
        @Bean
        // 条件注解，添加的类型必须是 实现了 Condition 接口的类型
        // MyCondition的 matches 方法返回true 则注入，返回false 则不注入
        @Conditional(MyCondition.class)
        public StudentService studentService() {
            return new StudentService();
        }
    }
    ```

- **Spring5.0**:

  - @Indexed：在Spring Boot应用场景中，大量使用@ComponentScan扫描，导致Spring模式的注解解析时间耗时增大，因此，5.0时代引入@Indexed，为Spring模式注解添加索引。
    - 当我们在项目中使用了 @Indexed 之后，编译打包的时候会在项目中自动生成METAINT/spring.components文件。根据该文件进行扫描注入，可以提高效率。

#### SpringBoot自动装配原理

自动装配还是利用了SpringFactoriesLoader来加载META-INF/spring.factoires文件里所有配置的EnableAutoConfgruation，它会经过exclude和filter等操作，最终确定要装配的类。

**1.一切的开始都源于@SpringBootApplication，它是一个组合注解**

除了元注解之外，关注这三个注解：

```java
@SpringBootConfiguration
@EnableAutoConfiguration
@ComponentScan
```

- @SpringBootConfiguration该注解的作用是用来指定扫描路径的，如果不指定特定的扫描路径的话，扫描的路径是当前修饰的类所在的包及其子包。
- @SpringBootConfiguration这个注解的本质其实是@Configuration注解。

**2.看来这个@EnableAutoConfiguration不简单**

```java
@Import(AutoConfigurationImportSelector.class)
```

它的内部主要是使用@import注解导入一个选择器。

**3.那么我们看看这个AutoConfigurationImportSelector类**

上文提到继承ImportSelector接口的类，需要重写 selectImports( )，那我们就看看这个方法

```java
@Override
    public String[] selectImports(AnnotationMetadata annotationMetadata) {
        if (!isEnabled(annotationMetadata)) {
            return NO_IMPORTS;
        }
        AutoConfigurationEntry autoConfigurationEntry = getAutoConfigurationEntry(annotationMetadata);
        return StringUtils.toStringArray(autoConfigurationEntry.getConfigurations());
    }
```

该方法其实也没说啥，现在的重心就放在getAutoConfigurationEntry()中。

**4.getAutoConfigurationEntry()**

```java
protected AutoConfigurationEntry getAutoConfigurationEntry(AnnotationMetadata annotationMetadata) {
    if (!isEnabled(annotationMetadata)) {
        return EMPTY_ENTRY;
    }　　　　　
    AnnotationAttributes attributes = getAttributes(annotationMetadata);
  	//获取候选配置信息,加载的是当前项目的classpath目录下的所有的 spring.factories 文件中的 key 为
  	//org.springframework.boot.autoconfigure.EnableAutoConfiguration 的信息。
  	//点进去通过"SpringFactoriesLoader"进行加载
 		List<String> configurations = getCandidateConfigurations(annotationMetadata, attributes);
    // removeDuplicates方法的作用是 移除同名的
    configurations = removeDuplicates(configurations);
    // 获取我们配置的 exclude 信息
    // 比如：@SpringBootApplication(exclude = {RabbitAutoConfiguration.class}) ,显示的指定不要加载那个配置类
    Set<String> exclusions = getExclusions(annotationMetadata, attributes);
    checkExcludedClasses(configurations, exclusions);
    configurations.removeAll(exclusions);
    // filter的作用是 过滤掉咱们不需要使用的配置类。
    configurations = getConfigurationClassFilter().filter(configurations);
    fireAutoConfigurationImportEvents(configurations, exclusions);
    return new AutoConfigurationEntry(configurations, exclusions);
}
```

**5.前面几个都好理解，现在我们主要看看filter()，是怎么移除不需要的类**

![img](https://github.com/chou401/pic-md/raw/master/2597186-20220218230920130-226480162.png)

我们可以看到有具体的匹配方法 match。里面有个关键的属性是 autoConfigurationMetadata , 的本质是 加载的 META-INF/spring-autoconfigure-metadata.properties 的文件中的内容。

![img](https://github.com/chou401/pic-md/raw/master/2597186-20220218231102908-1017908901.png)

其实原理很简单，如果没有对应的实现类，就不进行加载。

#### 何时进行自动装配

- 处理@Configuration的核心还是ConfigurationClassPostProcessor，这个类实现了BeanFactoryPostProcessor,
- 因此当AbstractApplicationContext执行refresh方法里的invokeBeanFactoryPostProcessors(beanFactory)方法时会执行自动装配

#### run 方法

```java
@SpringBootApplication
public class SpringBootVipDemoApplication {
    public static void main(String[] args) {
        // 基于配置文件的方式
        ApplicationContext ac1 = new ClassPathXmlApplicationContext("");
        // 基于Java配置类的方式
        ApplicationContext ac2 = new AnnotationConfigApplicationContext(SpringBootVipDemoApplication.class);
        // run 方法的返回对象是 ConfigurableApplicationContext 对象,
        //ConfigurableApplicationContext就是ApplicationContext的一个子接口
        ConfigurableApplicationContext ac3 = SpringApplication.run(SpringBootVipDemoApplication.class, args);
    }
}
```

根据返回结果，我们猜测SpringBoot项目的启动其实就是Spring的初始化操作【IOC】。

![img](https://github.com/chou401/pic-md/raw/master/2597186-20220218232932423-556100027.png)

### 什么是 Starter

starter 是“一站式服务（one-stop）”的依赖 jar 包：

- 包含Spring以及相关技术（比如 Redis）的所有依赖
- 提供了自动配置的功能，开箱即用
- 提供了良好的依赖管理，避免了包遗漏、版本冲突等问题。

![image-20230819192249343](https://github.com/chou401/pic-md/raw/master/image-20230819192249343.png)

### Maven 中的可选依赖

可选依赖（optional）的作用：阻断“**依赖传递**”

### Spring 中的注解处理器

注解处理器：在编译阶段，生成指定注解的元数据。

- spring-boot-configuration-processor
- spring-boot-autoconfigure-processor

### 自定义装换器

1. 实现WebMvcConfigurer： 不会覆盖WebMvcAutoConfiguration的配置。
2. 实现WebMvcConfigurer+注解@EnableWebMvc：会覆盖WebMvcAutoConfiguration的配置。
3. 继承WebMvcConfigurationSupport：会覆盖WebMvcAutoConfiguration的配置。
4. 继承DelegatingWebMvcConfiguration：会覆盖WebMvcAutoConfiguration的配置。

#### 配置类

##### WebMvcConfigurationAdapter

- WebMvcConfigurerAdapter 是 WebMvcConfigurer 的实现类大部分为空方法，是 WebMvcConfigurer的子类实现，由于Java8中可以使用default关键字为接口添加默认方法，为在源代码中spring5.0之后就已经弃用本类，如果需要可以实现WebMvcConfigurer类。
- `WebMvcConfigurationAdapter`已经废弃，最好用`WebMvcConfigurer`代替。

##### WebMvcConfigurationSupport

- WebMvcConfigurationSupport 是mvc的基本实现并包含了WebMvcConfigurer接口中的方法。

##### WebMvcAutoConfiguration

- WebMvcAutoConfiguration 是mvc的自动装在类并部分包含了WebMvcConfigurer接口中的方法。

- springboot会自动启用WebMvcAutoConfiguration类做自动加载；项目中的配置都是默认的，比如静态资源文件的访问。

- ```java
  @Configuration
  @ConditionalOnWebApplication(type = Type.SERVLET)
  @ConditionalOnClass({ Servlet.class, DispatcherServlet.class, WebMvcConfigurer.class })
  @ConditionalOnMissingBean(WebMvcConfigurationSupport.class)
  @AutoConfigureOrder(Ordered.HIGHEST_PRECEDENCE + 10)
  @AutoConfigureAfter({ DispatcherServletAutoConfiguration.class,
  		TaskExecutionAutoConfiguration.class, ValidationAutoConfiguration.class })
  public class WebMvcAutoConfiguration {
  	...
  }
  ```

  - @ConditionalOnMissingBean({WebMvcConfigurationSupport.class})，当Spring容器中不存在WebMvcConfigurationSupportbean，WebMvcAutoConfiguration才会注入。
  - 如果有配置文件继承了DelegatingWebMvcConfiguration，或者WebMvcConfigurationSupport，或者配置类注解了@EnableWebMvc，那么WebMvcAutoConfiguration 将不会被自动配置，而是使用WebMvcConfigurationSupport的配置。那么所有实现了WebMvcConfigurer的配置类有可能会全部失效。

##### WebMvcConfigurer

- 用途：跨域、拦截器、静态资源处理。

- 接口方法的作用：

  ```
  addInterceptors：拦截器
  addViewControllers：页面跳转
  addResourceHandlers：静态资源
  configureDefaultServletHandling：默认静态资源处理器
  configureViewResolvers：视图解析器
  configureContentNegotiation：配置内容裁决的一些参数
  addCorsMappings：跨域
  configureMessageConverters：信息转换器
  ```

- WebMvcConfigurer配置类其实是`Spring`内部的种配置方式，可以自定义一些Handler，Interceptor，ViewResolver，MessageConverter等等的东西对springmvc框架进行配置。

- ```java
  @Configuration
  public class MyWebMvcConfigurer implements WebMvcConfigurer {
      @Override
      public void configureMessageConverters(List<HttpMessageConverter<?>> converters) {
          //创建fastJson消息转换器
          FastJsonHttpMessageConverter converter = new FastJsonHttpMessageConverter();

          List<MediaType> supportedMediaTypes = new ArrayList<MediaType>();
          MediaType mediaTypeJson = MediaType.valueOf(MediaType.APPLICATION_JSON_UTF8_VALUE);
          supportedMediaTypes.add(mediaTypeJson);
          converter.setSupportedMediaTypes(supportedMediaTypes);
          //创建配置类
          FastJsonConfig config = new FastJsonConfig();
          config.getSerializeConfig().put(Json.class, new SwaggerJsonSerializer());

          //修改配置返回内容的过滤
          //WriteNullListAsEmpty  ：List字段如果为null,输出为[],而非null
          //WriteNullStringAsEmpty ： 字符类型字段如果为null,输出为"",而非null
          //DisableCircularReferenceDetect ：消除对同一对象循环引用的问题，默认为false（如果不配置有可能会进入死循环）
          //WriteNullBooleanAsFalse：Boolean字段如果为null,输出为false,而非null
          //WriteMapNullValue：是否输出值为null的字段,默认为false
          //WriteDateUseDateFormat：全局修改日期格式，不添加会导致@JsonFormat失效
          config.setSerializerFeatures(SerializerFeature.WriteMapNullValue
                  , SerializerFeature.WriteNonStringKeyAsString,
                  SerializerFeature.WriteNullListAsEmpty,
                  SerializerFeature.DisableCircularReferenceDetect,
                  SerializerFeature.WriteDateUseDateFormat,
                  SerializerFeature.WriteNullBooleanAsFalse);
          converter.setFastJsonConfig(config);
          //将fastjson添加到视图消息转换器列表内
          converters.add(0, converter);
          //WebMvcConfigurer失效
          converters.add(converter);

      }
  }
  ```

- 默认已经有多个消息转换器了。而 configureMessageConverters 方法中是一个 list 参数。直接向其中添加 HttpMessageConverter后，默认是排在最后的。就造成了你自定义的消息转换器不生效。其实是被其他转换器接管了。因此，想要让我们自定义的消息转换器生效只需要把它添加到list 的第一个就可以了。
- SerializerFeature属性

  ![image-20230203141903620](https://github.com/chou401/pic-md/raw/master/img/image-20230203141903620.png)

#### 注解

##### **@EnableWebMVC**

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
@Documented
@Import(DelegatingWebMvcConfiguration.class)
public @interface EnableWebMvc {
}

```

如果引用了`@EnableWebMVC`注解，就会往spring容器中注入了一个`DelegatingWebMvcConfiguration`来统一管理所有的配置类。

```java
@Configuration
public class DelegatingWebMvcConfiguration extends WebMvcConfigurationSupport {
	private final WebMvcConfigurerComposite configurers = new WebMvcConfigurerComposite();
	...
}

```

**失效问题解决**

1. 在类上加注解解决失效问题

   ```java
   @EnableWebMvc
   @Configuration
   public class WebMvcConfig implements WebMvcConfigurer {

   }
   ```

   @EnableWebMvc表示完全自己控制mvc配置，也就是说所有配置自己重写，所有默认配置都没了！有时会导致很多请求进不来，或者参数转换出错之类的，因为spring mvc默认的转换器已经不生效了,包括全局配置的Jackson也会失效，所以在大多数情况下我们需要的是在其基础配置上添加自定义配置。

2. 注解+继承解决失效问题

   ```java
   @EnableWebMvc
   @Configuration
   public class WebMvcConfig extends WebMvcAutoConfiguration implements WebMvcConfigurer {

   }
   ```

@SpringBootApplication

- ```java
  @Target(ElementType.TYPE)
  @Retention(RetentionPolicy.RUNTIME)
  @Documented
  @Inherited
  @SpringBootConfiguration
  @EnableAutoConfiguration
  @ComponentScan(excludeFilters = {
  		@Filter(type = FilterType.CUSTOM, classes = TypeExcludeFilter.class),
  		@Filter(type = FilterType.CUSTOM,
  				classes = AutoConfigurationExcludeFilter.class) })
  public @interface SpringBootApplication {
  	@AliasFor(annotation = EnableAutoConfiguration.class)
  	Class<?>[] exclude() default {};
  	@AliasFor(annotation = EnableAutoConfiguration.class)
  	String[] excludeName() default {};
  	@AliasFor(annotation = ComponentScan.class, attribute = "basePackages")
  	String[] scanBasePackages() default {};
  	@AliasFor(annotation = ComponentScan.class, attribute = "basePackageClasses")
  	Class<?>[] scanBasePackageClasses() default {};
  }

  ```

  - 这里引用了`@EnableAutoConfiguration`注解

##### @EnableAutoConfiguration

- ```java
  @Target(ElementType.TYPE)
  @Retention(RetentionPolicy.RUNTIME)
  @Documented
  @Inherited
  @AutoConfigurationPackage
  @Import(AutoConfigurationImportSelector.class)
  public @interface EnableAutoConfiguration {
  	String ENABLED_OVERRIDE_PROPERTY = "spring.boot.enableautoconfiguration";
  	Class<?>[] exclude() default {};
  	String[] excludeName() default {};

  }
  ```

- 注解`@AutoConfigurationPackage`的主要作用就是：将主程序类所在包及所有子包下的组件到扫描到spring容器中。

- ```java
  @Target(ElementType.TYPE)
  @Retention(RetentionPolicy.RUNTIME)
  @Documented
  @Inherited
  @Import(AutoConfigurationPackages.Registrar.class)
  public @interface AutoConfigurationPackage {
  }
  ```

- `AutoConfigurationImportSelector`的作用可以参考：[springboot源码自动装配-AutoConfigurationImportSelector](https://blog.csdn.net/qq_39482039/article/details/120585957)

- ```java
  public class AutoConfigurationImportSelector implements DeferredImportSelector, BeanClassLoaderAware,
  		ResourceLoaderAware, BeanFactoryAware, EnvironmentAware, Ordered {
  	...
  	@Override
  	public String[] selectImports(AnnotationMetadata annotationMetadata) {
  		// 是否启用自动配置
  		if (!isEnabled(annotationMetadata)) {
  			return NO_IMPORTS;
  		}
  		// 获取META-INF/spring-autoconfigure-metadata.properties文件的配置，返回AutoConfigurationMetadata类
  		AutoConfigurationMetadata autoConfigurationMetadata = AutoConfigurationMetadataLoader
  				.loadMetadata(this.beanClassLoader);
  		// 获取自动配置类，返回AutoConfigurationEntry
  		AutoConfigurationEntry autoConfigurationEntry = getAutoConfigurationEntry(
  				autoConfigurationMetadata, annotationMetadata);
  		// 返回要自动配置的类名
  		return StringUtils.toStringArray(autoConfigurationEntry.getConfigurations());
  	}
  	...
  }
  ```

- 如果引用了`@EnableAutoConfiguration`注解，就会往spring容器中注入两个类。
  1.  `AutoConfigurationPackages.Registrar`：扫包。
  2.  `AutoConfigurationImportSelector`：等所有类全加载到spring容器之后扫描配置类。

### junit

spring boot 2，在进行单元测试的时候，**不支持.yml文件**，配件文件需要设置为properties。

pom 中增加testResources，其他操作按照正常创建 test 流程即可。

```xml
<build>
        <resources>
            <resource>
                <directory>${basedir}/config/${build.profile.id}/</directory>
            </resource>
            <resource>
                <directory>${basedir}/src/main/resources/</directory>
            </resource>
        </resources>
				<finalName>xxxx</finalName>
        <testResources>
            <testResource>
                <directory>${basedir}/config/${build.profile.id}/</directory>
            </testResource>
            <testResource>
                <directory>${basedir}/src/main/resources/</directory>
            </testResource>
        </testResources>
    </build>
```
