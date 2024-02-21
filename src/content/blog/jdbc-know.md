---
author: chou401
pubDatetime: 2022-09-25T15:20:35Z
modDatetime: 2024-02-22T00:37:27Z
title: JDBC
featured: false
draft: false
tags:
  - jdbc
description: jdbc acid & 隔离级别
---

## Table of contents

## 事务

事务（Transaction）：一般是指要做的或所做的事情。

- 在计算机中指：访问并可能更新的数据库中各种数据项的一个程序单元（unit）。

程序执行单元（unit）：数据库操作一组SQL语句的执行。

- 由高级数据库操作语言或者编程语言书写。

- 由事务开始（begin transaction）和事务结束（end transaction）之间执行的全体操作组成。

一个事务是由一条或多条对数据库操作的SQL语句所组成的一个不可分割的工作单元，只有当事务中的所有操作都正常执行完了，整个事务才会被提交给数据库。

例如：

一个银行转账操作，首先从A账户减掉指定的金额，然后B账户增加指定的金额，此时转账操作结束。上面的操作如果对应成数据库操作，那么就需要执行两条Update语句。数据库把这两条Update语句的执行就是一个事务。

## 数据库的事务四大特征【ACID】

- **A 原子性（atomicity）**：一个事务一个不可分割的工作单位,事务中包括的操作要么做，要么不做。

- **C 一致性（consistency）**：事务必须使数据库从一个一致性的状态转变成另一个一致性的状态。一致性与原子性密切相关。

- **I 隔离性（isolation）**：一个事务的执行不能干扰其他事务。即：一个事务内部的操作及使用的数据对并发的其他事务是隔离的，并发执行的个个事务直接不能相互干扰。

- **D 持久性（durability）**：持久性也称永久性（permanence）,指一个事务一旦提交，他对数据库中的数据的改变就应该是永久的。接下来的其他操作或故障不应该对其有任何影响。

## 事务的隔离级别

在数据库操作中，为了有效保证并发读取数据的正确性，提出的事务隔离级别。

### JDBC定义了五种事务隔离级别

- TRANSACTION_READ_UNCOMMITTED：允许脏读、不可重复读和幻读。

- TRANSACTION_READ_COMMITTED：禁止脏读，但允许不可重复读和幻读。

- TRANSACTION_REPEATABLE_READ：禁止脏读、不可重复读，但允许幻读。

- TRANSACTION_NONE JDBC：驱动不支持事务。

| JDBC                         | 数据库隔离级别 | 数据库访问情况                                                                                               |
| ---------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------ |
| TRANSACTION_READ_UNCOMMITTED | ur             | 就是俗称“脏读”，在没有提交数据时，能够读到已经更新得是数据。                                                 |
| TRANSACTION_RED_COMMITTED    | cs             | 在一个事务中进行查询时，允许读取提交的数据，数据提交后，当前查询就可以读取到数据。Update数据时候并不锁住表。 |
| TRANSACTION_REPEATABLE       | rs             | 在一个事务中进行查询时，不允许读取其他事务update的中，允许读取其他事物提交的新增数据。                       |
| TRANSACTION_SERIALIZABLE     | rr             | 在一个事务中进行查询时，不允许任何对这个表查询表的数据修改。                                                 |

## 并发事务带来的问题

在典型的应用程序中，多个事务并发运行，经常会操作相同的数据来完成个自的任务（多个用对统一数据进行操作）。并发虽然是必须的，但有可能出现以下问题。

- **脏读（Dirty read）**：当一个事务正在访问数据并且对数据进行修改，而这种修改还没有提交到数据库中，这时另外一个事务也访问到这个数据，然后使用用了这个数据。因为这个数据是还没有提交数据，那么另一个事务读到的数据就是“脏数据”，根据“脏数据”所做的操作可能是不正确的。

- **丢失修改（lost to modify）**：指在一个事务读取一个数据时，另外一个事务也在访问该数据，那么在第一个事务中修改了这个数据后，，第二个事务也修改了这个数据。这样第一个事务内的修改结果就被丢失，因此称为丢失修改。例如：事务1读取某表数据A=20，事务2也读取A=20，事务1修改A=A-1,事务2也修改A=A-1，最终结果A=19，事务1修改被丢弃。

- **不可重复读（Unrepeatableread）**：指在一个事务内多次读取同一个数据。在这个事务还没有结束时，另一个事务也访问该数据，那么，在第一个事务中的两次读数据之间，由于第二个事务修改导致第一个事物两次读取的数据可能不太一样，这就发生了在一个事务内两次读到的数据不一样的情况，因此称为不可重复读。

- **幻读（Phantom read）**：类似与不可重复读类似。它发生在一个事务（T1）读取了几行数据，接着另一个并发事务（T2）插入了一些数据时。在随后的查询中，第一个事物（T1）就会发现对了一些根本不存在的记录，就好像是发生幻觉。称为幻读。

### 不可重复读和幻读的区别

不可重复读的重点是修改，幻读的中单在于新增或者删除。

## JDBC的事务管理操作

JDBC的事务管理操作需要通过java.sql.Connection接口来设置。

### 隔离级别

| static int | [TRANSACTION_NONE](https://blog.csdn.net/weixin_49576031/article/details/121632045#TRANSACTION_NONE) 指示不支持事务的常量。                                                         |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| static int | [TRANSACTION_READ_COMMITTED](https://blog.csdn.net/weixin_49576031/article/details/121632045#TRANSACTION_READ_COMMITTED) 一个常数表示防止脏读; 可能会发生不可重复的读取和幻像读取。 |
| static int | [TRANSACTION_READ_UNCOMMITTED](https://blog.csdn.net/weixin_49576031/article/details/121632045#TRANSACTION_READ_UNCOMMITTED) 一个常量表示可能会发生脏读，不可重复读和幻读。         |
| static int | [TRANSACTION_REPEATABLE_READ](https://blog.csdn.net/weixin_49576031/article/details/121632045#TRANSACTION_REPEATABLE_READ) 一个常量表示防止了脏读和不可重复读; 可以发生幻读。       |
| static int | [TRANSACTION_SERIALIZABLE](https://blog.csdn.net/weixin_49576031/article/details/121632045#TRANSACTION_SERIALIZABLE) 一个常数表示防止脏读，不可重复读和幻读。                       |

| Modifier and Type       | Constant Field                                                                                                               | Value |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----- |
| public static final int | [TRANSACTION_NONE](https://blog.csdn.net/weixin_49576031/article/details/121632045#TRANSACTION_NONE)                         | 0     |
| public static final int | [TRANSACTION_READ_COMMITTED](https://blog.csdn.net/weixin_49576031/article/details/121632045#TRANSACTION_READ_COMMITTED)     | 2     |
| public static final int | [TRANSACTION_READ_UNCOMMITTED](https://blog.csdn.net/weixin_49576031/article/details/121632045#TRANSACTION_READ_UNCOMMITTED) | 1     |
| public static final int | [TRANSACTION_REPEATABLE_READ](https://blog.csdn.net/weixin_49576031/article/details/121632045#TRANSACTION_REPEATABLE_READ)   | 4     |
| public static final int | [TRANSACTION_SERIALIZABLE](https://blog.csdn.net/weixin_49576031/article/details/121632045#TRANSACTION_SERIALIZABLE)         | 8     |

设置事务隔离级别的方法：

| void | [setTransactionIsolation](https://blog.csdn.net/weixin_49576031/article/details/121632045#setTransactionIsolation-int-)(int level) 尝试将此 Connection对象的事务隔离级别更改为给定的对象。 |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |

Connection接口对象.setTransactionIsolation(Connection.TRANSACTION_SERIALIZABLE)。

Connection接口对象.setTransactionIsolation(8)。

设置是否自动提交事务方法【默认JDBC事务是自动提交的】：

| void | [setAutoCommit](https://blog.csdn.net/weixin_49576031/article/details/121632045#setAutoCommit-boolean-)(boolean autoCommit) 将此连接的自动提交模式设置为给定状态。 |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |

Connection接口对象.setAutoCommit(false) ; 设置为手动提交事务。

事务的提交方法 ：

| void | [commit](https://blog.csdn.net/weixin_49576031/article/details/121632045#commit--)() 使自上次提交/回滚以来所做的所有更改都将永久性，并释放此 Connection对象当前持有的任何数据库锁。 |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

事务的回滚方法【异常中执行】：

| void | [rollback](https://blog.csdn.net/weixin_49576031/article/details/121632045#rollback--)() 撤消在当前事务中所做的所有更改，并释放此 Connection对象当前持有的任何数据库锁。 |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |

## Class.forName()的作用

在Java语言中，任何类只有被装载到JVM上才能运行。Class.forName() 方法的作用就是把类加载到JVM中，它会返回一个与带有给定字符串名的类或接口相关联的Class对象，并且JVM会加载这个类，同时JVM会执行该类的静态代码段。

## Statement、PreparedStatement、CallableStatement

- Statement用于执行不带参数的简单SQL语句，并返回它所生成结果的对象，每次执行SQL语句时，数据库都要编译该SQL语句。

- PreparedStatement表示预编译的SQL语句的对象，用于执行带参数的预编译SQL语句。

- CallableStatement提供了用来调用数据库中存储过程的接口。

  - 使用Connection对象的prepareCall()方法创建CallableStatement对象，它为所有的DBMS（Database Management System）提供了一种以标准形式调用已存储过程的方法；

  - IN参数使用 CallableStatement.setXxx()设置；

  - OUT参数使用CallableStatement.registerOutParameter()设置，使用CallableStatement.getXxx()获取输出参数。

  - 执行使用execute()，或者executeUpdate()、executeQuery()。

Statement对象与PreparedStatement对象能够完成相同的功能，PreparedStatement具有以下优点：

- 效率更高：在使用PreparedStatement对象执行SQL命令时，命令会被数据库进行编译和解析，并放到命令缓冲区，然后，每当执行同一个PreparedStatement对象时，由于在缓存区中可以发现预编译的命令，虽然它会被再解析一次，但是不会被再一次编译，是可以重复使用的，能够有效提高系统性能，因此，如果要执行插入，更新，删除等操作，最好使用PreparedSatement。
- 代码可读性和可维护性更好。
- 安全性更好：使用PreparedStatement能够预防SQL注入攻击。

**总结**：

1. SQL语句执行的connection与事务的connection对象要相同。

2. 开始事务connection对象.setAutoCommit(false)。
3. 设置事务的隔离级别 connection对象.setTransactionIsoation(Connection.TRANSACTION_SERIALIZABLE)。
4. 提交事务 connection对象.commit()。
5. 设置事务回滚【异常中进行】connection对象.rollback()。
