---
title: "mysqld_multi"
description: "基于 MySQL 自带工具 mysqld_multi 实现主从复制"
pubDatetime: 2024-01-27T15:56:54Z
modDatetime: 2024-02-01T15:26:00Z
tags:
  - mysql
---

## Table of contents

## 写在前面

正常情况是准备需要主从个数的服务器，每个服务器都安装好 mysql，主库数据内容同步到从库中。

本次记录是在一台机器通过 `mysqld_multi` 操作一主两从数据库服务。若多台服务，则将配置文件拆分配置即可。

本次安装使用了 HomeBrew，若用其他方式，或者路径不一致，`/opt/homebrew/opt/mysql` 更改成自己的安装路径即可。

## 配置文件

安装 mysql

```bash
brew install mysql
```

进入 mysql 安装之后的默认启动目录

```bash
cd /opt/homebrew/opt/mysql
```

创建数据目录 data，data 内创建三个文件夹，分别命名为 3306、3307和3308。

```bash
mkdir data
cd data
mkdir {3306,3307,3308}
```

3306、3307和3308 文件夹就是分别放置我们每个实例（mysql 服务器）中的所有数据库、数据表和一些日志文件的地方，每个文件夹可以看到一个 mysql 服务器。

在 mysql 包中新建一个文件，将文件命名为 my.cnf，从此以后，这个文件就是我们需要一直使用的配置文件。

```bash
touch my.cnf
```

打开 my.cnf 配置文件，将下列代码复制进入文件中：

```bash
[mysqld]
# mysql 安装目录
basedir=/opt/homebrew/opt/mysql

[mysqld_multi]
mysqld=/opt/homebrew/opt/mysql/bin/mysqld_safe
mysqladmin=/opt/homebrew/opt/mysql/bin/mysqladmin
log=/opt/homebrew/opt/mysql/data/mysql_multi.log

[mysqld3306]
mysqld=mysqld
mysqladmin=mysqladmin
# 数据库目录
datadir=/opt/homebrew/opt/mysql/data/3306/data
# 端口
port=3306
# socket 登录 mysqld_multi 启动自动生成 退出 自动删除
socket=/opt/homebrew/opt/mysql/mysql_3306.sock
server_id=1

[mysqld3307]
mysqld=mysqld
mysqladmin=mysqladmin
datadir=/opt/homebrew/opt/mysql/data/3307/data
port=3307
socket=/opt/homebrew/opt/mysql/mysql_3307.sock
server_id=2

[mysqld3308]
mysqld=mysqld
mysqladmin=mysqladmin
datadir=/opt/homebrew/opt/mysql/data/3308/data
port=3308
socket=/opt/homebrew/opt/mysql/mysql_3308.sock
server_id=3

```

## 安装实例

### 安装实例 3306

```bash
❯ mysqld --defaults-file=/opt/homebrew/etc/my.cnf --initialize --basedir=/opt/homebrew/opt/mysql/ --datadir=/opt/homebrew/opt/mysql/data/3306/data
2024-01-25T04:45:17.883145Z 0 [System] [MY-015017] [Server] MySQL Server Initialization - start.
2024-01-25T04:45:17.889196Z 0 [System] [MY-013169] [Server] /opt/homebrew/Cellar/mysql/8.2.0_1/bin/mysqld (mysqld 8.2.0) initializing of server in progress as process 60393
2024-01-25T04:45:17.895958Z 0 [Warning] [MY-010159] [Server] Setting lower_case_table_names=2 because file system for /opt/homebrew/opt/mysql/data/3306/data is case insensitive
2024-01-25T04:45:17.910343Z 1 [System] [MY-013576] [InnoDB] InnoDB initialization has started.
2024-01-25T04:45:18.038467Z 1 [System] [MY-013577] [InnoDB] InnoDB initialization has ended.
2024-01-25T04:45:18.632405Z 6 [Note] [MY-010454] [Server] A temporary password is generated for root@localhost: j.10weTJs)iu
2024-01-25T04:45:18.940457Z 0 [System] [MY-013172] [Server] Received SHUTDOWN from user <via user signal>. Shutting down mysqld (Version: 8.2.0).
2024-01-25T04:45:19.447294Z 0 [System] [MY-015018] [Server] MySQL Server Initialization - end.
```

记住 root 账户初始密码：j.10weTJs)iu

### 安装实例 3307

```bash
❯ mysqld --defaults-file=/opt/homebrew/etc/my.cnf --initialize --basedir=/opt/homebrew/opt/mysql/ --datadir=/opt/homebrew/opt/mysql/data/3307/data
2024-01-25T04:46:02.653813Z 0 [System] [MY-015017] [Server] MySQL Server Initialization - start.
2024-01-25T04:46:02.661065Z 0 [System] [MY-013169] [Server] /opt/homebrew/Cellar/mysql/8.2.0_1/bin/mysqld (mysqld 8.2.0) initializing of server in progress as process 62369
2024-01-25T04:46:02.667029Z 0 [Warning] [MY-010159] [Server] Setting lower_case_table_names=2 because file system for /opt/homebrew/opt/mysql/data/3307/data is case insensitive
2024-01-25T04:46:02.679468Z 1 [System] [MY-013576] [InnoDB] InnoDB initialization has started.
2024-01-25T04:46:02.771801Z 1 [System] [MY-013577] [InnoDB] InnoDB initialization has ended.
2024-01-25T04:46:03.385917Z 6 [Note] [MY-010454] [Server] A temporary password is generated for root@localhost: a#=MYe)L:8aj
2024-01-25T04:46:03.685023Z 0 [System] [MY-013172] [Server] Received SHUTDOWN from user <via user signal>. Shutting down mysqld (Version: 8.2.0).
2024-01-25T04:46:04.225769Z 0 [System] [MY-015018] [Server] MySQL Server Initialization - end.
```

记住 root 账户初始密码：a#=MYe)L:8aj

### 安装实例 3308

```bash
❯ mysqld --defaults-file=/opt/homebrew/etc/my.cnf --initialize --basedir=/opt/homebrew/opt/mysql/ --datadir=/opt/homebrew/opt/mysql/data/3308/data
2024-01-25T04:46:12.066014Z 0 [System] [MY-015017] [Server] MySQL Server Initialization - start.
2024-01-25T04:46:12.067626Z 0 [System] [MY-013169] [Server] /opt/homebrew/Cellar/mysql/8.2.0_1/bin/mysqld (mysqld 8.2.0) initializing of server in progress as process 62774
2024-01-25T04:46:12.069105Z 0 [Warning] [MY-010159] [Server] Setting lower_case_table_names=2 because file system for /opt/homebrew/opt/mysql/data/3308/data is case insensitive
2024-01-25T04:46:12.071151Z 1 [System] [MY-013576] [InnoDB] InnoDB initialization has started.
2024-01-25T04:46:12.171156Z 1 [System] [MY-013577] [InnoDB] InnoDB initialization has ended.
2024-01-25T04:46:12.598694Z 6 [Note] [MY-010454] [Server] A temporary password is generated for root@localhost: HJgqw!Bi6Efb
2024-01-25T04:46:12.866118Z 0 [System] [MY-013172] [Server] Received SHUTDOWN from user <via user signal>. Shutting down mysqld (Version: 8.2.0).
2024-01-25T04:46:13.501326Z 0 [System] [MY-015018] [Server] MySQL Server Initialization - end.
```

记住 root 账户初始密码：HJgqw!Bi6Efb

## 查看多实例

使用mysqld_multi命令查看这些MySQL服务是否开启。

```bash
❯ mysqld_multi --defaults-extra-file=/opt/homebrew/opt/mysql/my.cnf report

Wide character in print at /opt/homebrew/bin/mysqld_multi line 684.
Reporting MySQL servers
MySQL server from group: mysqld3306 is not running
MySQL server from group: mysqld3307 is not running
MySQL server from group: mysqld3308 is not running
```

## 开启多实例

使用mysqld_multi命令开启实例。

```bash
❯ mysqld_multi --defaults-extra-file=/opt/homebrew/opt/mysql/my.cnf start 3306,3307,3308
```

再次查看多实例。

```bash
❯ mysqld_multi --defaults-extra-file=/opt/homebrew/opt/mysql/my.cnf report

Wide character in print at /opt/homebrew/bin/mysqld_multi line 684.
Reporting MySQL servers
MySQL server from group: mysqld3306 is running
MySQL server from group: mysqld3307 is running
MySQL server from group: mysqld3308 is running
```

查看 mysql 任务线程。

```bash
❯ ps aux | grep mysqld
```

## socket方式登录

使用 socket 的方式登录，必须使用 -S 参数，并且在后面加上.sock 文件的位置，需要注意的是，之后每一次登录，都需要使用这种 -S 方式进行登录。

```bash
mysql -u root -p -S /opt/homebrew/opt/mysql/mysql_3306.sock
```

系统会提示输入密码，将上面记录的初始密码输入，进入 mysql 服务器。

**更改 root 的密码**

为了方便，我们将 3306 端口的服务器密码设置为 3306。同样方式更改其他两个。

```bash
# 8.0 以下版本 密码模式 mysql_native_password
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '3306';
# 8.0 以上版本 密码模式 caching_sha2_password
ALTER USER 'root'@'localhost' IDENTIFIED WITH caching_sha2_password BY '3306';
```

**关闭 mysql 服务器**

```mysql
mysqladmin -S /opt/homebrew/opt/mysql/mysql_3306.sock -uroot -p shutdown。
```

## 日志文件

### MySQL启动日志在哪？

启动动日志记录了MySQL启动时的状态，如果你启动失败可以查看该日志，可以使用最普通的文本编辑器打开，根据ERROR信息进行必要的调整。由于我们的配置文件my.cnf指定了生成路径，该日志在MySQL服务启动后自动生成在你的mysql包内，全称为mysqld_multi.log。

### 二进制文件在哪？

二进制文件主要记录MySQL数据库的变化，包含了所有更新了数据或者潜在更新了数据（例如没有匹配任何一行的UPDATE）的语句；还包含了每个更新数据库的语句的执行时间信息，使用二进制日志的目的是最大可能的恢复数据库，因为二进制日志包含备份后进行的所有更新，而且二进制文件是主从复制的重要桥梁和关键所在。

我们的二进制文件就在我们最初创建的3306文件夹内，具体路径是mysql/data/3306/data，使用 mysqlbinlog查看二进制文件。

每次重启服务器，都会新生成一个二进制日志，后缀以.000001开始递增。

### 其它日志文件在哪？

在配置文件中加上一行代码，就可以开启错误日志，当 mysql 需要记录错误发生时，就会保存在我们设置的路径上的日志中。

```bash
log_error = /opt/homebrew/opt/mysql/data/3306/data/my_error.log
```

如果我们需要开启通用查询日志，可以在 mysql 中使用命令开启。

```mysql
mysql> set @@global.general_log = 1;
Query OK, 0 rows affected (0.01 sec)
```

执行成功之后，就会在 mysql/data/3306/data目录下新增一个.log 的日志文件。

如果我们需要开启慢羊羊日志

```mysql
mysql> set @@global.slow_query_log = 1;
Query OK, 0 rows affected (0.01 sec)
```

执行成功之后，就会在 mysql/data/3306/data目录下新增一个-slow.log 的日志文件。

## 多实例解耦

在上文中，我们把若干个实例的配置信息放在同一个配置文件my.cnf中，如果若干个实例都是通过同一个配置文件启动，那么耦合性就太高了，试想一下，当我们同时开启了若干个实例，例如同时开启了3306，3307和3308MySQL服务，而在中途突然需要改变一下3306服务的配置，那么修改配置文件之后进行MySQL服务的重启，又因为服务重启是通过配置文件启动的，而其它实例的配置内容又在同一份文件中，那么有可能在对3306修改时造成对其它实例的影响。

基于上述问题，为了降低MySQL各个服务的耦合度，我们可以通过创建多个配置文件来生成多个实例，通俗一点说，一个单独的MySQL服务就有一个单独的配置文件，这样，每一个MySQL服务之间就被分割开了，单独的修改配置，不会对其它服务造成影响，以此降低耦合。

直接删除原先的 mysql ，新建安装，将 my.cnf 内容拆成三个配置文件 3306.cnf、3307.cnf 和 3308.cnf。

### 配置文件

3306.cnf 配置文件添加以下内容：

```bash
[mysqld]
basedir=/opt/homebrew/opt/mysql

[mysqld_multi]
mysqld=/opt/homebrew/opt/mysql/bin/mysqld_safe
mysqladmin=/opt/homebrew/opt/mysql/bin/mysqladmin
log=/opt/homebrew/opt/mysql/data/mysql_multi.log

[mysqld3306]
mysqld=mysqld
mysqladmin=mysqladmin
datadir=/opt/homebrew/opt/mysql/data/3306/data
port=3306
socket=/opt/homebrew/opt/mysql/mysql_3306.sock
server_id=1
```

3307.cnf 配置文件添加以下内容：

```bash
[mysqld]
basedir=/opt/homebrew/opt/mysql

[mysqld_multi]
mysqld=/opt/homebrew/opt/mysql/bin/mysqld_safe
mysqladmin=/opt/homebrew/opt/mysql/bin/mysqladmin
log=/opt/homebrew/opt/mysql/data/mysql_multi.log

[mysqld3307]
mysqld=mysqld
mysqladmin=mysqladmin
datadir=/opt/homebrew/opt/mysql/data/3307/data
port=3307
socket=/opt/homebrew/opt/mysql/mysql_3307.sock
server_id=2
```

3308.cnf 配置文件添加以下内容：

```bash
[mysqld]
basedir=/opt/homebrew/opt/mysql

[mysqld_multi]
mysqld=/opt/homebrew/opt/mysql/bin/mysqld_safe
mysqladmin=/opt/homebrew/opt/mysql/bin/mysqladmin
log=/opt/homebrew/opt/mysql/data/mysql_multi.log

[mysqld3308]
mysqld=mysqld
mysqladmin=mysqladmin
datadir=/opt/homebrew/opt/mysql/data/3308/data
port=3308
socket=/opt/homebrew/opt/mysql/mysql_3308.sock
server_id=3
```

后面的操作流程一致，只是把上文中的单个配置文件启动，调整为三个配置文件启动。

## 主从复制

### 配置文件

主库配置开启 binlog 参数

```mysql
log_bin = mysql-bin
```

完整的 my.cnf 配置文件内容如下：

```bash
[mysqld]
basedir=/opt/homebrew/opt/mysql

[mysqld_multi]
mysqld=/opt/homebrew/opt/mysql/bin/mysqld_safe
mysqladmin=/opt/homebrew/opt/mysql/bin/mysqladmin
log=/opt/homebrew/opt/mysql/data/mysql_multi.log

[mysqld3306]
mysqld=mysqld
mysqladmin=mysqladmin
datadir=/opt/homebrew/opt/mysql/data/3306/data
port=3306
socket=/opt/homebrew/opt/mysql/mysql_3306.sock
server_id=1
log_error=/opt/homebrew/opt/mysql/data/3306/data/my_error.log
character-set-server=UTF8MB4

#设置二进制日志名称为mysql-bin
log_bin=mysql-bin
#需要主从复制的数据库 ，如多个则重复配置
binlog-do-db=boot
#复制过滤：也就是指定哪个数据库不用同步（mysql库一般不同步） ，如多个则重复配置
binlog-ignore-db=mysql
#主从复制的格式（mixed,statement,row，默认格式是statement。建议是设置为row，主从复制时数据更加能够统一）
binlog_format=row
#mysql8.0以上版本通过设置全局参数binlog_expire_logs_seconds修改binlog保存时间 以秒为单位；默认2592000 30天
binlog_expire_logs_seconds=604800


[mysqld3307]
mysqld=mysqld
mysqladmin=mysqladmin
datadir=/opt/homebrew/opt/mysql/data/3307/data
port=3307
socket=/opt/homebrew/opt/mysql/mysql_3307.sock
server_id=2
log_error=/opt/homebrew/opt/mysql/data/3306/data/my_error.log
character-set-server=UTF8MB4

#设置中继日志名称为slave-relay-bin
relay_log=slave-relay-bin
replicate-do-db=boot
binlog-ignore-db=mysql
binlog_format=row
read_only=ON
binlog_expire_logs_seconds=604800


[mysqld3308]
mysqld=mysqld
mysqladmin=mysqladmin
datadir=/opt/homebrew/opt/mysql/data/3308/data
port=3308
socket=/opt/homebrew/opt/mysql/mysql_3308.sock
server_id=3
log_error=/opt/homebrew/opt/mysql/data/3306/data/my_error.log
character-set-server=UTF8MB4

#设置中继日志名称为slave-relay-bin
relay_log=slave-relay-bin
replicate-do-db=boot
binlog-ignore-db=mysql
binlog_format=row
read_only=ON
binlog_expire_logs_seconds=604800

```

设置完成并保存后记得重启服务。

### 同步账号

#### 主库操作

主库创建从库同步账号

```mysql
mysql> CREATE USER 'replication'@'%' IDENTIFIED BY '123456';
```

赋予 REPLICATION 账号 salve 权限

```mysql
mysql> GRANT REPLICATION SLAVE ON *.* TO 'replication'@'%';
```

刷新

```mysql
mysql> FLUSH PRIVILEGES;
```

查看主库状态

```mysql
mysql> show master status\G
*************************** 1. row ***************************
             File: mysql-bin.000008
         Position: 575
     Binlog_Do_DB: boot
 Binlog_Ignore_DB: mysql
Executed_Gtid_Set:
1 row in set, 1 warning (0.00 sec)
```

#### 从库操作

设定从主库同步

```mysql
change master to
    MASTER_HOST='localhost',
    MASTER_PORT=3306,
    MASTER_USER='replication',
    MASTER_PASSWORD='123456',
    MASTER_LOG_FILE='mysql-bin.000008',
    MASTER_LOG_POS=575,
    GET_MASTER_PUBLIC_KEY=1;
```

从库同步开关

```mysql
mysql> stop slave;
mysql> start slave;
```

查看从库状态

```mysql
mysql> show slave status\G
*************************** 1. row ***************************
               Slave_IO_State: Waiting for source to send event
                  Master_Host: localhost
                  Master_User: replication
                  Master_Port: 3306
                Connect_Retry: 60
              Master_Log_File: mysql-bin.000008
          Read_Master_Log_Pos: 575
               Relay_Log_File: slave-relay-bin.000002
                Relay_Log_Pos: 744
        Relay_Master_Log_File: mysql-bin.000008
             Slave_IO_Running: Yes
            Slave_SQL_Running: Yes
              Replicate_Do_DB: boot
          Replicate_Ignore_DB:
           Replicate_Do_Table:
       Replicate_Ignore_Table:
      Replicate_Wild_Do_Table:
  Replicate_Wild_Ignore_Table:
                   Last_Errno: 0
                   Last_Error:
                 Skip_Counter: 0
          Exec_Master_Log_Pos: 575
              Relay_Log_Space: 954
              Until_Condition: None
               Until_Log_File:
                Until_Log_Pos: 0
           Master_SSL_Allowed: No
           Master_SSL_CA_File:
           Master_SSL_CA_Path:
              Master_SSL_Cert:
            Master_SSL_Cipher:
               Master_SSL_Key:
        Seconds_Behind_Master: 0
Master_SSL_Verify_Server_Cert: No
                Last_IO_Errno: 0
                Last_IO_Error:
               Last_SQL_Errno: 0
               Last_SQL_Error:
  Replicate_Ignore_Server_Ids:
             Master_Server_Id: 1
                  Master_UUID: a781c79c-bb49-11ee-a395-516e37c8480e
             Master_Info_File: mysql.slave_master_info
                    SQL_Delay: 0
          SQL_Remaining_Delay: NULL
      Slave_SQL_Running_State: Replica has read all relay log; waiting for more updates
           Master_Retry_Count: 10
                  Master_Bind:
      Last_IO_Error_Timestamp:
     Last_SQL_Error_Timestamp:
               Master_SSL_Crl:
           Master_SSL_Crlpath:
           Retrieved_Gtid_Set:
            Executed_Gtid_Set:
                Auto_Position: 0
         Replicate_Rewrite_DB:
                 Channel_Name:
           Master_TLS_Version:
       Master_public_key_path:
        Get_master_public_key: 0
            Network_Namespace:
1 row in set, 1 warning (0.00 sec)
```

## 记录配置过程中可能出现的问题

**Replica failed to initialize applier metadata structure from the repository**

```mysql
mysql> stop slave;
mysql> reset slave all;
mysql> start slave;
```

之后再重新执行 change master to 。

**Error connecting to source 'replication@localhost:3306'. This was attempt 1/10, with a delay of 60 seconds between attempts. Message: Authentication plugin 'caching_sha2_password' reported error: Authentication requires secure connection.**

mysql 8.0之后默认的认证方式变为`caching_sha2_password`；

解决方案

从库中执行，之后重新 start slave;

```mysql
CHANGE MASTER TO GET_MASTER_PUBLIC_KEY=1;
```

**Plugin mysql_native_password reported: ''mysql_native_password' is deprecated and will be removed in a future release. Please use caching_sha2_password instead'**
如果你的MySQL的用户还在使用mysql_native_password（密码插件）的认证方式，那么在MySQL更新到8.0.34后，每次数据库用户以mysql_native_password方式访问MySQL，日志就会输出mysql_native_password已经废弃，即将在未来版本移除，以caching_sha2_password替代。

通过以下 sql 查询用户密码模式

```mysql
select user,host,plugin from mysql.user;
```

旧的数据库账号，除了 MySQL 自带的账户，通过 sql 来更新认证模式和密码 密码可以和旧密码一致

```mysql
ALTER USER '用户名'@'域' IDENTIFIED WITH caching_sha2_password BY '密码';
```

MySQL 自身的账户，可以通过以下 sql 更新到 mysql_native_password 模式

```mysql
update mysql.user set plugin='caching_sha2_password' where user = 'root';
```
