---
title: "Mysql"
description: "Mysql 基础介绍"
pubDatetime: 2022-09-25T15:20:35Z
heroImage: "/blog-placeholder-1.jpg"
tags:
  - mysql
---

# Mysql

## Mysql InnoDB

MYSQL InnoDB二级索引存储主键值而不是存储行指针的优点与缺点。

> 优点：
>
> - 减少了出现行移动或者数据页分裂时二级索引的维护工作（当数据需要更新的时候，二级索引不需要修改，只需要修改聚簇索引，一个表只能有一个聚簇索引，其他的都是二级索引，这样只需要修改聚簇索引就可以了，不需要重新构建二级索引）
>
> 缺点：
>
> - 二级索引体积可能会变大，因为二级索引中存储了主键的信息
> - 二级索引的访问需要两次索引查找。第一次通过查找 _二级索引_ 找二级索引中叶子节点存储的 _主键的值_；第二次通过这个主键的值去
>   **_聚簇索引_** 中查找对应的行

### InnoDB 简介

InnoDB是一个将表中的数据存储到磁盘上的存储引擎。而真正处理数据的过程是发生在内存中的，所以需要把磁盘中的数据加载到内存中，如果是处理写入或修改请求的话，还需要把内存中的内容刷新到磁盘上。而我们知道读写磁盘的速度非常慢，和内存读写差了几个数量级。所以当我们想从表中获取某些记录时，InnoDB存储引擎需要一条一条的把记录从磁盘上读出来么？想要了解这个问题，我们首先需要了解InnoDB的存储结构是怎样的。

![image-20230703165807448](https://github.com/chou401/pic-md/raw/master/image-20230703165807448.png)

InnoDB采取的方式是：将数据划分为若干个页，以页作为磁盘和内存之间交互的基本单位innodb_page_size选项指定了MySQL实例的所有InnoDB表空间的页面大小。这个值是在创建实例时设置的，之后保持不变。有效值为64KB，32KB，16KB(默认值 )，8kB和4kB。也就是在一般情况下，一次最少从磁盘中读取16KB的内容到内存中，一次最少把内存中的16KB内容刷新到磁盘中。

### InnoDB 的行格式

我们平时是以记录为单位来向表中插入数据的，这些记录在磁盘上的存放方式也被称为行格式或者记录格式。一行记录可以以不同的格式存在InnoDB中，行格式分别是compact、redundant、dynamic和compressed行格式。可以在创建或修改的语句中指定行格式：

> -- 创建数据表时,显示指定行格式CREATE TABLE 表名 (列的信息) ROW_FORMAT=行格式名称;
>
> -- 创建数据表时,修改行格式ALTER TABLE 表名 ROW_FORMAT=行格式名称;
>
> -- 查看数据表的行格式show table status like '';

mysql5.0之前默认的行格式是redundant，mysql5.0之后的默认行格式为compact ， 5.7之后的默认行格式为dynamic。

#### compact 格式

![img](https://github.com/chou401/pic-md/raw/master/859ab55da7e84b9da3ec34cd4ca9d611.png)

##### 变长字段长度列表

我们知道 MySQL 支持一些变长的数据类型，比如 VARCHAR(M) 、 VARBINARY(M) 、各种 TEXT 类型，各种 BLOB 类型，我们也可以把拥有这些数据类型的列称为 变长字段 ，变长字段中存储多少字节的数据是不固定的，所以我们在存储真实数据的时候需要顺便把这些数据占用的字节数也存起来，这样才不至于把 MySQL 服务器搞懵，所以这些变长字段占用的存储空间分为两部分：

1. 真正的数据内容
2. 占用的字节数

在 Compact 行格式中，把所有变长字段的真实数据占用的字节长度都存放在记录的开头部位，从而形成一个变长字段长度列表，各变长字段数据占用的字节数按照列的顺序逆序存放。

举个例子：

> 一个表中有c1、c2、c3三列数据为varchar，其中有一行数据存储了(“1234”,“123”,“1”)，它们分别的字符长度就为04、03、01，若其使用ascii字符集存储，则每个的字节大小为，04、03、01（ascii用一字节表示一个字符，utf-8为3字节），则这一行在”变长字段长度列表“中存储的则为”01 03 04“（实际存储为二进制且没有空格）

由于上面的字符串都比较短，也就是说内容占用的字节数比较小，用1个字节就可以表示，但是如果变长列的内容占用的字节数比较多，可能就需要用2个字节来表示。具体用1个还是2个字节来表示真实数据占用的字节数， InnoDB 有它的一套规则，首先我们声明一下 W 、 M 和 L 的意思：

> 假设某个字符集中表示一个字符最多需要使用的字节数为 W ，比方说 utf8 字符集中的 W 就是 1-3 ， ascii 字符集中的 W 就是1 。
> 对于 VARCHAR(M) 来说，表示此列最多能储存 M 个字符，所以这个类型能表示的字符串最多占用的字节数就是 M×W 。（比如：对于一个字符串”aaa“使用ascii表示则占用1*3个字节，而对于utf-8则为3*3个字节）
> 假设某字符串实际占用的字节数是 L 。

基于以上的声明，则使用1字节还是2 字节来表示变长字段长度的规则为：

- 如果一个字段最长可以储存的字节数小于等于255 B，即`W*M <= 255`: 使用一个字节表示
- 如果W\*M > 255 B，则分为两种情况：
  - 若L <= 127 B 则用1字节表示
  - 若L > 127 B 则用2字节表示

此外，innoDB使用 字节的第一位作为标志位，如果第一位为0，则此字节就是一个单独的字段长度。如果为1，则该字节为半个字段长度。

对于一些占用字节数非常多的字段，比方说某个字段长度大于了16KB，那么如果该记录在单个页面中无法存储时，InnoDB会把一部分数据存放到所谓的溢出页中，在变长字段长度列表处只存储留在本页面中的长度，所以使用两个字节也可以存放下来。

另外需要注意的一点是，变长字段长度列表中只存储值为 非NULL 的列内容占用的长度，值为 NULL 的列的长度是不储存的 。

字符集utf-8，英文字符占用1个字节，中文字符3字节，对于char类型来说，若使用utf-8字符集，则char也属于 可变长字段

##### NULL值列表

我们知道表中的某些列可能存储 NULL 值，如果把这些 NULL 值都放到记录的真实数据中存储会很占地方，所以 Compact 行格式把这些值为 NULL 的列统一管理起来，存储到 NULL 值列表中，它的处理过程是这样的：

1. 首先统计表中允许存储 NULL 的列有哪些。我们前边说过，主键列、被 NOT NULL 修饰的列都是不可以存储 NULL 值的，所以在统计的时候不会把这些列算进去。

2. 如果表中没有允许存储 NULL 的列，则 NULL值列表不存在。若允许，则将每个允许存储 NULL 的列对应一个二进制位，二进制位按照列的顺序逆序排列：二进制位的值为 1 时，代表该列的值为 NULL 。二进制位的值为 0 时，代表该列的值不为 NULL 。
3. MySQL 规定 NULL值列表 必须用整数个字节的位表示，如果使用的二进制位个数不是整数个字节，则在字节的高位补 0 。即若一个表有9个值允许为null，则这个记录null值列表的部分需要用 2 字节表示。

**举个例子**： 若有一张表，有c1 c2 c3 c4四个字段，其中c2 被NOT NULL修饰，则其NULL值列表 表示如下：

![img](https://github.com/chou401/pic-md/raw/master/4f4a765331f84efda30d2ae165f45707.png)

##### 记录头信息

记录头信息部分如下图所示：

![img](https://github.com/chou401/pic-md/raw/master/d35c888d876641768d782acb0e6668d3.png)

![img](https://github.com/chou401/pic-md/raw/master/9fac7f2392674842aba39dc969dfa126.png)

![img](https://github.com/chou401/pic-md/raw/master/aef632ad1be7455ab7e23909f68255f1.png)

我们使用如下的sql语句插入几行数据：

```mysql
INSERT INTO page_demo
VALUES
(1, 100, 'aaaa'),
(2, 200, 'bbbb'),
(3, 300, 'cccc'),
(4, 400, 'dddd');
```

则它们这几条数据记录在 页 的 User Records 部分为：

![img](https://github.com/chou401/pic-md/raw/master/ae0a8a7826e4429683f2c12de76760a1.png)

**delete_mask**

这个属性标记着当前记录是否被删除，占用1个二进制位，值为 0 的时候代表记录并没有被删除，为 1 的时候代表记录被删除掉了。

被删除的记录还在页中。这些被删除的记录之所以不立即从磁盘上移除，是因为移除它们之后把其他的记录在磁盘上重新排列需要性能消耗，所以只是打一个删除标记而已，所有被删除掉的记录都会组成一个所谓的 **垃圾链表** ，在这个链表中的记录占用的空间称之为所谓的 **可重用空间** ，之后如果有新记录插入到表中的话，可能把这些被删除的记录占用的存储空间覆盖掉。

将这个delete_mask位设置为1和将被删除的记录加入到垃圾链表中其实是两个阶段。

**min_rec_mask**

B+树的每层非叶子节点中的最小记录都会添加该标记。上方插入的四条记录的 min_rec_mask 值都是 0 ，意味着它们都不是 B+ 树的非叶子节点中的最小记录。

**n_owned**

当前组的最大记录，记录当前组有几个元素的字段。

**heap_no**

在数据页的User Records中插入的记录是一条一条紧凑的排列的，这种紧凑排列的结构又被称为**堆**。为了便于管理这个堆，把记录在堆中的相对位置给定一个编号——heap_no。所以heap_no这个属性表示当前记录在本页中的位置。

在例子中，插入的4条记录在本页中的位置分别是： 2 、3 、4 、5。为什么没有0和1呢？

是因为每个页里面加了两个记录，这两个记录并不是我们自己插入的，所以有时候也称为**伪记录**或者**虚拟记录**。这两个伪记录一个代表**最小记录** Infimum，一个代表**最大记录 **Supremum，对应的heap_no分别为0和1。

记录可以比较大小，对于一条完整的记录来说，比较记录的大小就是比较主键的大小。

不管我们向页中插入了多少记录，InnoDB 规定任何用户记录都要比最小记录大，比最大记录小。这两条记录的构造，都是由5字节大小的记录头信息和8字节大小的固定部分组成的，如图：

![image-20230703174800471](https://github.com/chou401/pic-md/raw/master/image-20230703174800471.png)

最大最小记录不是自己定义的记录，所以它们并不存放在页的User Records 部分，而是被单独放在一个称为Infimum + Supremum 的部分，如图所示：

![image-20230703174836315](https://github.com/chou401/pic-md/raw/master/image-20230703174836315.png)

从图中可以看出来，最小记录和最大记录的heap_no 值分别是0 和1 ，也就是说它们的位置也在Uesr Records前面。

**record_type**

这个属性表示当前记录的类型，一共有4种类型的记录， 0 表示普通用户记录， 1 表示B+树非叶节点记录， 2 表示最小记录， 3 表示最大记录。

**next_record**

这个属性非常重要！！它表示从当前记录的真实数据到下一条记录的真实数据的地址偏移量，可以理解为指向下一条记录地址的指针。值为正数说明下一条记录在当前记录后面，为负数说明下一条记录在当前记录的前面。比方说第1条记录的next_record 值为32 ，意味着从第1条记录的真实数据的地址处向后找32 个字节便是下一条记录的真实数据。这里的下一条记录指得并不是按照我们插入顺序的下一条记录，而是按照主键值由小到大的顺序的下一条记录。

![image-20230703175113161](https://github.com/chou401/pic-md/raw/master/image-20230703175113161.png)

从图中可以看出来，我们的记录按照主键从小到大的顺序形成了一个单链表。最大记录的next_record 的值为0 ，这也就是说最大记录是没有下一条记录了，它是这个单链表中的最后一个节点。

如果从中删除掉一条记录，这个链表也是会跟着变化的，比如我们把第2条记录删掉：

```mysql
DELETE FROM page_demo WHERE c1 = 2;
```

删掉第2条记录后的示意图就是：

![image-20230703175303142](https://github.com/chou401/pic-md/raw/master/image-20230703175303142.png)

从图中可以看出来，删除第2条记录前后主要发生的变化：

- 被删记录没有从存储空间中移除，而是把该记录的delete_mask 设置为1 ，next_record 变为0；
- 被删记录的前一条记录的next_record 指向后一条记录：第1条记录的next_record 指向了第3条记录；
- 最大记录的n_owned 值减1。

所以，不论我们怎么对页中的记录做增删改操作，InnoDB始终会维护一条记录的单链表，链表中的各个节点是按照主键值由小到大的顺序连接起来的。并规定 Infimum记录（也就是最小记录） 的下一条记录就是本页中主键值最小的用户记录，而本页中主键值最大的用户记录的下一条记录就是 Supremum记录（也就是最大记录）。

而当我们再次插入第二条记录的时候 不会申请新的空间，而是直接连接被删的记录的next_record。

##### 默认隐藏列信息

MySQL 会为每个记录默认的添加一些列（也称为 隐藏列 ）

![img](https://github.com/chou401/pic-md/raw/master/e3ed90eaaf7747c49acfc2c59225a1d2.png)

实际上这几个列的真正名称其实是：DB_ROW_ID、DB_TRX_ID、DB_ROLL_PTR，我们为了美观才写成了row_id、transaction_id和roll_pointer。

row_id是可选的，表中没有主键的，则选取一个 Unique 键作为主键。如果表中连 Unique 键都没有定义的话，则 InnoDB 会为表默认添加一个名为row_id 的隐藏列作为主键。

roll_pointer 是一个指向记录对应的 undo日志 的一个指针。

![img](https://github.com/chou401/pic-md/raw/master/05aa65d74e8e4f1481eb7409fca14f96.png)

##### 行溢出的数据

我们知道对于 VARCHAR(M) 类型的列最多可以占用 65535 个字节。其中的 M 代表该类型最多存储的字符数量，如果我们使用 ascii 字符集的话，一个字符就代表一个字节。但是实际上，创建一张表并设置一个字段为`VARCHAR(65535)`则会报错。

```mysql
CREATE TABLE varchar_size_demo(
    c VARCHAR(65535)
) CHARSET=ascii ROW_FORMAT=Compact;

ERROR 1118 (42000): Row size too large. The maximum row size for the used table type, not
counting BLOBs, is 65535. This includes storage overhead, check the manual. You have to c
hange some columns to TEXT or BLOBs
```

从报错信息里可以看出， MySQL 对一条记录占用的最大存储空间是有限制的，除了 BLOB 或者 TEXT 类型的列之外，其他所有的列（不包括隐藏列和记录头信息）占用的字节长度加起来不能超过 65535 个字节。所以 MySQL 服务器建议我们把存储类型改为 TEXT 或者 BLOB 的类型。这个 65535 个字节除了列本身的数据之外，还包括一些其他的数据（ storage overhead ），比如说我们为了存储一个 VARCHAR(M) 类型的列，其实需要占用3部分存储空间：

- 真实数据
- 真实数据占用字节的长度
- NULL 值标识，如果该列有 NOT NULL 属性则可以没有这部分存储空间

如果该 VARCHAR 类型的列没有 NOT NULL 属性，那最多只能存储 65532 个字节的数据，因为真实数据的长度可能占用2个字节， NULL 值标识需要占用1个字节。

如果 VARCHAR 类型的列有 NOT NULL 属性，那最多只能存储 65533 个字节的数据，因为真实数据的长度可能占用2个字节，不需要 NULL 值标识。

相应的，如果不使用ascii字符集，而使用utf-8的话，则要按照3个字节一个字符来计算。

> 另外，这里我们只讨论了一张表只有一个字段的情况，实际上是一行数据最多只能储存上面那些字节。

##### 记录中的数据太多产生的溢出

我们知道，一页最大为16KB也就是16384字节，而一个varchar类型的列最多可以储存65532字节，这样就可能造成一张数据页放不了一行数据的情况。

在 Compact 和 Reduntant 行格式中，对于占用存储空间非常大的列，在记录的真实数据处只会存储该列的一部分数据，把剩余的数据分散存储在几个其他的页中，然后 记录的真实数据 处用20个字节存储指向这些页的地址（当然这20个字节中还包括这些分散在其他页面中的数据的占用的字节数），从而可以找到剩余数据所在的页。

对于 Compact 和 Reduntant 行格式来说，如果某一列中的数据非常多的话，在本记录的真实数据处只会存储该列的前 768 个字节的数据和一个指向其他页的地址，然后把剩下的数据存放到其他页中，这个过程也叫做 行溢出 ，存储超出 768 字节的那些页面也被称为 溢出页 。

![img](https://github.com/chou401/pic-md/raw/master/285d9c00300a45af94c31b74e5a9df19.png)

##### 行溢出的临界点

首先，MySQL 中规定一个页中至少存放两行记录。其次，以创建只有一个varchar(65532) 字段的表为例，的我们分析一下 一个页面的空间是如何利用的：

- 除了用户储存的真实信息外，储存文件头、文件尾、页面头等信息，需要136个字节。
- 每条记录需要的额外信息是27字节，这27字节包括：
  - 2个字节用于存储真实数据的长度
  - 1个字节用于存储列是否是NULL值
  - 5个字节大小的头信息
  - 6个字节的 row_id 列
  - 6个字节的 transaction_id 列
  - 7个字节的 roll_pointer 列

假设一个列中存储的数据字节数为n，那么发生行溢出现象时需要满足这个式子：136 + 2×(27 + n) > 16384。

求解这个式子得出的解是： n > 8098 。也就是说如果一个列中存储的数据不大于 8098 个字节，那就不会发生行溢出 ，否则就会发生 行溢出 。

不过这个 8098 个字节的结论只是针对只有一个`varchar(65532) `列的表来说的，如果表中有多个列，那上边的式子和结论都需要改一改了，所以重点就是: 不用关注这个临界点是什么，只要知道如果我们想一个行中存储了很大的数据时，可能发生 行溢出 的现象。

#### redundant 格式

与compact 格式相比，没有了变长字段列表以及 NULL值列表，取而代之的是记录了所有真实数据的偏移地址表，偏移地址表是倒序排放的，但是计算偏移量却还是正序开始的从row_id作为第一个， 第一个从0开始累加字段对应的字节数。在记录头信息中, 大部分字段和compact 中的相同，但是对比compact多了。

n_field(记录列的数量)、1byte_offs_flag(字段长度列表每一列占用的字节数)，少了record_type字段。

因为redundant是mysql 5.0 以前就在使用的一种格式，已经非常古老，使用频率非常的低，这里就不过多表述。

#### dynamic 格式

在现在 mysql 5.7 的版本中，使用的格式就是 dynamic。

dynamic 和 compact 基本是相同的，只有在溢出页的处理上面，有所不同。

在compact行格式中，对于占用存储空间非常大的列，在记录的真实数据处只会存储该列的前768个字节的数据，把剩余的数据分散存储在几个其他的页中，然后记录的真实数据处用20个字节存储指向这些页的地址，从而可以找到剩余数据所在的页。

这种在本记录的真实数据处只会存储该列的前768个字节的数据和一个指向其他页的地址，然后把剩下的数据存放到其他页中的情况就叫做行溢出，存储超出768字节的那些页面也被称为溢出页（uncompresse blob page）。

dynamic中会直接在真实数据区记录 20字节 的溢出页地址，而不再去额外记录一部分的数据了。

#### compressed 格式

compressed 格式将会在Dynamic 的基础上面进行压缩处理特别是对溢出页的压缩处理，存储在其中的行数据会以zlib的算法进行压缩，因此对于blob、text这类大长度类型的数据能够进行非常有效的存储。但compressed格式其实也是以时间换空间，性能并不友好，并不推荐在常见的业务中使用。

### Page Directory（页目录）

记录在页中按照主键值由小到大顺序串联成一个单链表，那如果我们想根据主键值查找页中的某条记录该咋办呢？比如说这样的查询语句：

```mysql
SELECT * FROM page_demo WHERE c1 = 3;
```

可以采用遍历链表的方式，从Infimum 记录（最小记录）开始，向后查找，因为是按照主键值从小到大存放的，当找到或找到大于查找的主键值的时候，就结束了。但这种方法效率太低了。

为了解决直接遍历查询缓慢的问题，设计了类似于课本目录的**页目录**：

- **记录分组**：将所有正常的记录（包括最大和最小记录，不包括标记为已删除的记录）划分为几个组。
- **组内最大记录的n_owned 属性记录记录条数**：每个组的最后一条记录（也就是组内最大的那条记录）的头信息中的n_owned 属性表示该记录拥有多少条记录，也就是该组内共有几条记录。
- **根据最大最小记录的地址偏移量构造页目录**：将每个组的最后一条记录的地址偏移量单独提取出来按顺序存储到靠近页的尾部的地方，这个地方就是所谓的Page Directory ，也就是页目录（此时应该返回头看看页面各个部分的图）。页面目录中的这些地址偏移量被称为槽（英文名： Slot ），所以这个页面目录就是由槽组的。

![image-20230703181623066](https://github.com/chou401/pic-md/raw/master/image-20230703181623066.png)

页目录里面有两个槽，说明分为了两个组，分别是最小记录为一组，四条用户记录与最大记录为一组。所以**最小记录的n_owned 属性为1，最大记录的n_owned 属性为5。**

对于分组规定的规则：

- 对于最小记录所在的分组只能有 1 条记录，最大记录所在的分组拥有的记录条数只能在 1~8 条之间，剩下的分组中记录的条数范围只能在是 4~8 条之间。
- 初始情况下一个数据页里只有最小记录和最大记录两条记录，它们分属于两个分组。
- 之后每插入一条记录，都会从页目录中找到主键值比本记录的主键值大并且差值最小的槽，然后把该槽中对应的最大记录的n_owned 值加1，表示本组内又添加了一条记录，直到该组中的记录数等于8个。
- 在一个组中的记录数等于8个后再插入一条记录时，会将组中的记录拆分成两个组，一个组中4条记录，另一个5条记录。这个过程会在页目录中新增一个槽来记录这个新增分组中最大的那条记录的偏移量。

往表里继续插入数据

```mysql
INSERT INTO page_demo VALUES(5, 500, 'eeee'), (6, 600, 'ffff'), (7, 700, 'gggg'),(8, 800, 'hhhh'), (9, 900, 'iiii'), (10, 1000, 'jjjj'), (11, 1100, 'kkkk'), (12, 1200, 'llll'), (13, 1300, 'mmmm'), (14, 1400, 'nnnn'), (15, 1500, 'oooo'), (16, 1600, 'pppp');
```

注意看，最小记录始终是在用户最小记录之前，最大记录始终是在用户最大记录之后。

![image-20230703181828283](https://github.com/chou401/pic-md/raw/master/image-20230703181828283.png)

可以看到，每个槽点都记录了每组中最大记录的地址偏移量。

当我们需要在一个数据页中查找指定主键值的记录的过程分为两步：

- 通过**二分法**确定该记录所在的槽，并找到该槽中主键值最小的那条记录。
- 通过记录的next_record 属性遍历该槽所在的组中的各个记录。

### Page Header（页面头部）

为了能得到一个数据页中存储的记录的状态信息，比如本页中已经存储了多少条记录，第一条记录的地址是什么，页目录中存储了多少个槽等等，特意在页中定义了一个叫Page Header 的部分，它是页结构的第二部分，这个部分占用固定的56 个字节，专门存储各种状态信息，具体各个字节都是干嘛的看下表：

| 名称              | 占用空间（字节） | 描述                                                                                                               |
| ----------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| PAGE_N_DIR_SLOTS  | 2                | 在页目录中的槽数量                                                                                                 |
| PAGE_HEAP_TOP     | 2                | 还未使用的空间最小地址，也就是说从该地址之后就是Free Space                                                         |
| PAGE_BTR_SEG_TOP  | 10               | 本页中的记录的数量（包括最小和最大记录以及标记为删除的记录）                                                       |
| PAGE_N_HEAP       | 2                | 第一个已经标记为删除的记录地址（各个已删除的记录通过next_record 也会组成一个单链表，单链表中的记录可以被重新利用） |
| PAGE_FREE         | 2                | 已删除记录占用的字节数                                                                                             |
| PAGE_GARBAGE      | 2                | 最后插入记录的位置                                                                                                 |
| PAGE_LAST_INSERT  | 2                | 记录插入的方向                                                                                                     |
| PAGE_DIRECTION    | 2                | 一个方向连续插入的记录数量                                                                                         |
| PAGE_N_DIRECTION  | 2                | 该页中记录的数量（不包括最小和最大记录以及被标记为删除的记录）                                                     |
| PAGE_N_RECS       | 2                | 修改当前页的最大事务ID，该值仅在二级索引中定义                                                                     |
| PAGE_MAX_TRX_ID   | 8                | 当前页在B+树中所处的层级                                                                                           |
| PAGE_LEVEL        | 2                | 索引ID，表示当前页属于哪个索引                                                                                     |
| PAGE_INDEX_ID     | 8                | B+树叶子段的头部信息，仅在B+树的Root页定义                                                                         |
| PAGE_BTR_SEG_LEAF | 10               | B+树非叶子段的头部信息，仅在B+树的Root页定义                                                                       |

- PAGE_DIRECTION

  - 假如新插入的一条记录的主键值比上一条记录的主键值大，我们说这条记录的插入方向是右边，反之则是左边。用来表示最后一条记录插入方向的状态就是PAGE_DIRECTION 。

- PAGE_N_DIRECTION

  - 假设连续几次插入新记录的方向都是一致的， InnoDB 会把沿着同一个方向插入记录的条数记下来，这个条数就用PAGE_N_DIRECTION 这个状态表示。当然，如果最后一条记录的插入方向改变了的话，这个状态的值会被清零重新统计。

### File Header（文件头部）

Page Header 是专门针对数据页记录的各种状态信息，比方说页里头有多少个记录，有多少个槽等信息。

而File Header 是针对各种类型的页都通用，也就是说不同类型的页都会以File Header 作为第一个组成部分，它描述了一些针对各种页都通用的一些信息，比方说这个页的编号是多少，它的上一个页、下一个页是谁， 这个部分占用固定的38 个字节，是由下边这些内容组成的：

| 名称                             | 占用空间（字节） | 描述                                                               |
| -------------------------------- | ---------------- | ------------------------------------------------------------------ |
| FIL_PAGE_SPACE_OR_CHKSUM         | 4                | 页的校验和（checksum值）                                           |
| FIL_PAGE_OFFSET                  | 4                | 页号                                                               |
| FIL_PAGE_PREV                    | 4                | 上一个页的页号                                                     |
| FIL_PAGE_NEXT                    | 4                | 下一个页的页号                                                     |
| FIL_PAGE_LSN                     | 8                | 页面被最后修改时对应的日志序列位置（英文名是：Log SequenceNumber） |
| FIL_PAGE_TYPE                    | 2                | 该页的类型                                                         |
| FIL_PAGE_FILE_FLUSH_LSN          | 8                | 仅在系统表空间的一个页中定义，代表文件至少被刷新到了对应的LSN值    |
| FIL_PAGE_ARCH_LOG_NO_OR_SPACE_ID | 4                | 页属于哪个表空间                                                   |

看几个重要的部分：

- FIL_PAGE_SPACE_OR_CHKSUM

  这个代表当前页面的校验和（checksum）。校验和：就是对于一个很长很长的字节串来说，通过某种算法来计算一个比较短的值来代表这个很长的字节串，这个比较短的值就称为校验和。这样在比较两个很长的字节串之前先比较这两个长字节串的校验和，如果校验和都不一样两个长字节串肯定是不同的，所以省去了直接比较两个比较长的字节串的时间损耗。

- FIL_PAGE_OFFSET

  每一个页都有一个单独的页号，就跟你的身份证号码一样， InnoDB 通过页号来可以唯一定位一个页。

- FIL_PAGE_TYPE

  InnoDB 为了不同的目的而把页分为不同的类型，这篇文章介绍的其实都是存储记录的**数据页**，也就是所谓的索引页。其实还有很多别的类型的页：日志页、溢出页等。

- FIL_PAGE_PREV 和FIL_PAGE_NEXT

  InnoDB 都是以页为单位存放数据的，存放某种类型的数据占用的空间非常大（比方说一张表中可以有成千上万条记录）， InnoDB 可能不可以一次性为这么多数据分配一个非常大的存储空间，如果分散到多个不连续的页中存储的话需要把这些页关联起来， FIL_PAGE_PREV 和FIL_PAGE_NEXT就分别代表本页的上一个和下一个页的页号。这样通过建立一个双向链表把许许多多的页就都串联起来了，而无需这些页在物理上真正连着。

需要注意的是，并不是所有类型的页都有上一个和下一个页的属性，不过本文中唠叨的数据页（也就是类型为FIL_PAGE_INDEX 的页）是有这两个属性的，所以索引的数据页其实是一个双链表。

### File Trailer（文件尾部）

InnoDB 存储引擎会把数据存储到磁盘上，但是磁盘速度太慢，需要以页为单位把数据加载到内存中处理，如果该页中的数据在内存中被修改了，那么在修改后的某个时间需要把数据同步到磁盘中。但是在同步了一半的时候中断电了咋办，这不是莫名尴尬么？为了检测一个页是否完整（也就是在同步的时候有没有发生只同步一半的尴尬情况），在每个页的尾部都加了一个File Trailer 部分，这个部分由8 个字节组成，可以分成2个小部分：

- 前4个字节代表页的校验和

  这个部分是和File Header 中的校验和相对应的。每当一个页面在内存中修改了，在同步之前就要把它的校验和算出来，因为File Header 在页面的前边，所以校验和会被首先同步到磁盘，当完全写完时，校验和也会被写到页的尾部，如果完全同步成功，则页的首部和尾部的校验和应该是一致的。如果写了一半儿断电了，那么在File Header 中的校验和就代表着已经修改过的页，而在File Trialer 中的校验和代表着原先的页，二者不同则意味着同步中间出了错。

- 后4个字节代表页面被最后修改时对应的日志序列位置（LSN）

  这个部分也是为了校验页的完整性的，只不过我们目前还没说LSN 是个什么意思，所以大家可以先不用管这个属性。这个File Trailer 与File Header 类似，都是所有类型的页通用的。

### InnoDB 的 Buffer Pool 是如何管理数据页的

对于 InnoDB 存储引擎来说，数据是存储在磁盘上，而执行引擎想要操作数据，必须先将磁盘的数据加载到内存中才能操作。当数据从磁盘中取出后，缓存内存中，下次查询同样的数据的时候，直接从内存中读取，这样大大提高了查询性能。

#### InnoDB结构图

![InnoDB architecture diagram showing in-memory and on-disk structures.](https://cdn.jsdelivr.net/gh/chou401/pic-md@master/innodb-architecture-5-7.png)

内存结构(In-Memory Structures)主要是针对的是数据及其操作，主要分为：

- **Buffer Pool： 缓冲池**，数据缓冲池里面不直接存放数据而是存放的Page页，将数据存放在了Page页中，在缓冲池Page页是通过链表形式来存放的。
- **Change Buffer：写缓冲区**，正常情况下修改数据是先修改的缓冲池中Page的数据，但是缓冲池肯定不是所有的数据，而修改数据没有对应的Page数据的时候并不会直接把数据加载到缓冲池中去，而是放在了写缓冲区中记录，等到数据被读取的时候再把数据合并到缓冲池中。
- **Adaptive Hash Index： 自适应Hash索引**，InnoDB存储引擎会根据Page页的访问频率和模式建立对应的Hash索引，这个索引是根据查询情况自动建立的，称为自适应Hash索引。
- **Log Buffer： 日志缓冲区**，主要用来保存写入磁盘的(Redo/Undo)日志文件，日志缓冲区会定期刷新到磁盘log文件中，这样不用每次日志都进行磁盘IO操作，提高效率。

磁盘结构(On-Disk Structures)主要针对的是表和表空间，主要分为以下结构：

- **Tablespaces： 表空间**，对于表空间大家应该都不陌生，用来存储表结构和数据的。表空间又被分为系统表空间、独立表空间、通用表空间、临时表空间等多种类型。
- **InnoDB Data Dictionary： 数据字典**，InnoDB数据字典由内部系统表组成，这些表包含用于查找表、索引和表字段等对象的元数据。
- **Doublewrite Buffer： 双写缓冲区**，我们知道数据修改先修改的Page页后又刷到磁盘的，在刷到磁盘前这些数据会先存放在双写缓存区中，双写缓存区是用来保障数据写入磁盘时候出现问题的备份。
- **Redo Logs： 重做日志**，记录了所有缓冲池修改的数据，修改数据的时候先写日志，后修改的缓冲区，假设修改写入操作的时候数据库崩溃了或停电了，等下次启动通过重做日志来保持数据的正确性。

#### Buffer Pool(缓冲池)

**Buffer Pool是MySQL服务在启动的时候向操作系统申请的一片连续地址的内存空间**，其本质就是一片内存，默认大小是 **128M**，可以在启动服务的时候，通过 innodb_buffer_pool 这个参数设置buffer pool的大小，单位是字节(B)，最小值是5MB。

那么Buffer Pool这段内存地址到底有什么，可以确定的就是肯定有16KB数据页，这里叫**缓冲页**。除此之外还有，索引页，undo 页，插入缓存、自适应哈希索引、锁信息。

![image-20230904181941928](https://cdn.jsdelivr.net/gh/chou401/pic-md@master/image-20230904181941928.png)

##### 内部组成

因为buffer pool被划分为某干个数据页，其数据页大小和表空间使用的页大小一致，为了更好的管理buffer pool中的缓冲页，innoDB为每个缓冲页都创建了一个控制信息。

这些控制信息主要包括该缓冲页的【表空间编号、页号、缓冲页在buffer pool中的地址、链表节点信息】，存储这些控制信息控制块。

缓冲页和控制块是一一对应的，其中控制块在buffer pool前面，而缓冲页在buffer后面。

**什么是碎片？**

当剩余空间不够一对控制块和缓冲页的大小时，这样的空间称为碎片。

**怎么查看MySQL实例的Buffer Pool信息呢？**

`show variables like '%innodb_buffer_pool_size%';` 查看buffer pool的size。

`show global status like '%innodb_buffer_pool%';` 查看相关参数，详细的参数代表的意思，大家自己去搜搜。

#### 管理Buffer Pool

`Buffer Pool` 中的页有三种状态：

1. 空闲页：通过空闲页链表（Free List）管理。
2. 正常页：通过LRU链表（LRU List）管理。
3. 脏页：通过LRU链表和脏页链表（Flush List）管理。（缓冲池中被修改过的页，与磁盘上的数据页不一致）

接下来我们分别看看三种链表是如何进行管理的。

##### Free链表

初始化完的buffer pool时所有的页都是空闲页，所有空闲的缓冲页对应的**控制块信息**作为一个节点放到Free链表中。

要注意Free链表是一个个控制块，而控制块的信息中有缓存页的地址信息。

在有了free链表之后，当需要加载磁盘中的页到buffer pool中时，就去free链表中取一个空闲页所对应的控制块信息，**根据控制块信息中的表空间号、页号找到buffer pool里对应的缓冲页，再将数据加载到该缓冲页中，随后删掉free链表该控制块信息对应的节点。**

**如何在buffer pool中快速查找缓冲页（数据页）呢？**

这里就可以对缓冲页进行Hash处理，用表空间号、页号做为Key，缓冲页的控制块就是value**维护一个Hash表，**根据表空间号、页号做为Key去查找有没有对应的缓冲信息，如果没有就需要去free 链表中取一个空闲的缓冲页控制快信息，随后将磁盘中的数据加载到该缓冲页位置。

##### Flush链表

修改了buffer pool中缓冲页的数据，那么该页和磁盘就不一致了，这样的页就称为【脏页】，它不是立马刷入到磁盘中，而是由后台线程将脏页写入到磁盘。

Flush链表就是为了能知道哪些是脏页而设计的，它跟Free链表结构图相似，区别在于控制块指向的是脏页地址。

##### LRU链表

对于频繁访问的数据和很少访问的数据我们对与它的期望是不一样的，很少访问的数据希望在某个时机淘汰掉，避免占用buffer pool的空间，因为缓冲空间大小是有限的。

MySQL设计了根据LRU算法设计了LRU链表来维护和淘汰缓冲页。

LRU 算法简单来说，如果用链表来实现，将最近命中（加载）的数据页移在头部，未使用的向后偏移，直至移除链表。这样的淘汰算法就叫做 LRU 算法，但是简单的LRU算法会带来两个问题：**预读失效、Buffer Pool污染**。

##### 预读机制和预读失效

**预读机制**：当数据页从磁盘加载到 Buffer Pool 中时，会把相邻的数据页也提前加载到 Buffer Pool 中，这样做的好处就是减少未来可能的磁盘IO。

**预读失效**：当预读机制提前加载的数据页一直未被访问，这就是失效

好，那么结合简单的LRU算法来看，可能预读页被加载到LRU链表头部，当Buffer Pool空间不够时，会把经常访问的位于LRU链表的尾部数据页给淘汰清理掉，这样缓冲就失效了。

##### 改进的LRU 算法

Buffer Pool的LRU算法中InnoDB 将LRU链表按照5:3的比例分成了young区域和old区域。链表头部的5/8是young区（被高频访问数据），链表尾部的3/8区域是old区域（低频访问数据）。

这样做的目的是，在预读的时候或访问不存在的缓冲页时，先加入到 old 区域的头部，当页被真正访问的时候，才将页插入 young 区域的头部。

![img](https://cdn.jsdelivr.net/gh/chou401/pic-md@master/v2-7ba7ee9eb267c9d62e95c3e858419e32_1440w.png)

现在有个编号为 20 的页被预读了，这个页只会被插入到 old 区域头部，而 old 区域末尾的页（10号）会被淘汰掉。

![img](https://cdn.jsdelivr.net/gh/chou401/pic-md@master/v2-b381ae4b18804701b12cad3b770167b2_1440w.png)

如果 20 号页一直不会被访问，它也没有占用到 young 区域的位置，而且还会比 young 区域的数据更早被淘汰出去。

如果 20 号页被预读后，立刻被访问了，那么就会将它插入到 young 区域的头部，young 区域末尾的页（7号），会被挤到 old 区域，作为 old 区域的头部，这个过程并不会有页被淘汰。

![img](https://cdn.jsdelivr.net/gh/chou401/pic-md@master/v2-73eeea4b1a6b0e6f0553b3ef07e36e4a_1440w.png)

##### 多Buffer实例

我们已经默认情况下**innodb_buffer_pool_size是128M， **此时的innodb_buffer_pool_instances的大小也就是实例是1个。因为innodb_buffer_pool_size 小于1G时，设置innodb_buffer_pool_instances是无效的，都会是1。

当一个buffer pool在多线程访问的时候，各个链表都会加锁处理，这样一来，多线程访问时，性能就会降低。

可以通过**innodb_buffer_pool_instances**参数来设置实例的个数。每个buffer pool实例的大小计算公式：**innodb_buffer_pool_size / innodb_buffer_pool_instances，**每个实例都有其对应的链表管理，互不干扰。

##### 修改Buffer Pool大小

**如何修改运行中MySQL的Buffer Pool的大小？**

**MySQL 5.7.5之前**：是不允许在运行时调整buffer pool大小的，只能在服务器启动之前，通过innodb_buffer_pool_size大小来调整。

**MySQL 5.7.5之后：**是以chunk为单位来修改Buffer Pool的大小，比如innodb_buffer_pool_chunk_size默认大小是128M，调整Buffer Pool大小就以chunk为单位来增加或减少Buffer Pool大小。

我们应该要有这么一个概念就是：一个Buffer Pool可能有多个buffer pool实例，而每个实例由多个chunk组成，一个chunk是一块连续的内存空间，一个chunk默认大小是128M。

##### 缓存污染

虽然 MySQL 通过改进传统的 LRU 数据结构，避免了预读失效带来的影响。但是如果还是使用「只要数据被访问过一次，就将数据加入到 young 区域」这种方式的话，那么**还存在缓存污染的问题**。

当我们在批量读取数据的时候，由于数据被访问了一次，这些大量数据都会被加入到「活跃 LRU 链表」里，然后之前缓存在活跃 LRU 链表（或者 young 区域）里的热点数据全部都被淘汰了，**如果这些大量的数据在很长一段时间都不会被访问的话，那么整个活跃 LRU 链表（或者 young 区域）就被污染了**。

##### 缓存污染会带来什么问题？

缓存污染带来的影响就是很致命的，等这些热数据又被再次访问的时候，由于缓存未命中，就会产生大量的磁盘 I/O，系统性能就会急剧下降。

当某一个 SQL 语句**扫描了大量的数据**时，在 Buffer Pool 空间比较有限的情况下，可能会将 **Buffer Pool 里的所有页都替换出去，导致大量热数据被淘汰了**，等这些热数据又被再次访问的时候，由于缓存未命中，就会产生大量的磁盘 I/O，MySQL 性能就会急剧下降。

注意， 缓存污染并不只是查询语句查询出了大量的数据才出现的问题，即使查询出来的结果集很小，也会造成缓存污染。

比如，在一个数据量非常大的表，执行了这条语句：

```text
select * from t_user where name like "%xiaolin%";
```

可能这个查询出来的结果就几条记录，但是由于这条语句会发生索引失效，所以这个查询过程是全表扫描的，接着会发生如下的过程：

- 从磁盘读到的页加入到 LRU 链表的 old 区域头部；
- 当从页里读取行记录时，也就是**页被访问的时候，就要将该页放到 young 区域头部**；
- 接下来拿行记录的 name 字段和字符串 xiaolin 进行模糊匹配，如果符合条件，就加入到结果集里；
- 如此往复，直到扫描完表中的所有记录。

经过这一番折腾，由于这条 SQL 语句访问的页非常多，每访问一个页，都会将其加入 young 区域头部，那么**原本 young 区域的热点数据都会被替换掉，导致缓存命中率下降**。那些在批量扫描时，而被加入到 young 区域的页，如果在很长一段时间都不会再被访问的话，那么就污染了 young 区域。

举个例子，假设需要批量扫描：21，22，23，24，25 这五个页，这些页都会被逐一访问（读取页里的记录）。

![img](https://cdn.jsdelivr.net/gh/chou401/pic-md@master/v2-ce159c31ecabe38c68bb35cfce35e410_1440w.png)

在批量访问这些页的时候，会被逐一插入到 young 区域头部。

![img](https://cdn.jsdelivr.net/gh/chou401/pic-md@master/v2-1c75fa046988f1a9774fb258d73cba6f_1440w.png)

可以看到，原本在 young 区域的 6 和 7 号页都被淘汰了，而批量扫描的页基本占满了 young 区域，如果这些页在很长一段时间都不会被访问，那么就对 young 区域造成了污染。

如果 6 和 7 号页是热点数据，那么在被淘汰后，后续有 SQL 再次读取 6 和 7 号页时，由于缓存未命中，就要从磁盘中读取了，降低了 MySQL 的性能，这就是缓存污染带来的影响。

##### 怎么避免缓存污染造成的影响？

前面的 LRU 算法只要数据被访问一次，就将数据加入活跃 LRU 链表（或者 young 区域），**这种 LRU 算法进入活跃 LRU 链表的门槛太低了**！正式因为门槛太低，才导致在发生缓存污染的时候，很容就将原本在活跃 LRU 链表里的热点数据淘汰了。

所以，**只要我们提高进入到活跃 LRU 链表（或者 young 区域）的门槛，就能有效地保证活跃 LRU 链表（或者 young 区域）里的热点数据不会被轻易替换掉**。

Linux 操作系统和 MySQL Innodb 存储引擎分别是这样提高门槛的：

- **Linux 操作系统**：在内存页被访问**第二次**的时候，才将页从 inactive list 升级到 active list 里。

- **MySQL Innodb**：在内存页被访问**第二次**的时候，并不会马上将该页从 old 区域升级到 young 区域，因为还要进行**停留在 old 区域的时间判断**：

- - 如果第二次的访问时间与第一次访问的时间**在 1 秒内**（默认值），那么该页就**不会**被从 old 区域升级到 young 区域；
  - 如果第二次的访问时间与第一次访问的时间**超过 1 秒**，那么该页就**会**从 old 区域升级到 young 区域；

提高了进入活跃 LRU 链表（或者 young 区域）的门槛后，就很好了避免缓存污染带来的影响。

在批量读取数据时候，**如果这些大量数据只会被访问一次，那么它们就不会进入到活跃 LRU 链表（或者 young 区域）**，也就不会把热点数据淘汰，只会待在非活跃 LRU 链表（或者 old 区域）中，后续很快也会被淘汰。

## 疑问

### 小数精度问题

fload和double在存取时因为精度不一致会发生丢失，这里的丢失指的是扩展或者截断，丢失了原有的精度。

在mysql中，我们用【小数数据类型（总长度，小数点长度）】来表示小数的总长度和小数点后面的长度，如deicmal(m，n)。n就是小数点后面的数字个数。float(m,n)、double(m,n) 含义差不多，都是定义长度和精度的。既然定义了精度，为什么还会发生所谓的精度丢失问题呢？

float和double在**存取**时因为精度不一致会发生丢失，不能盲目的说float和double精度可能丢失。具体原因如下：

1. **没有设置精度位数。**
   没有设置精度就是使用默认的精度，此时的策略就是，尽可能保证精度，因此一般使用最高精度存储数据。如果设置数据类型指定了精度，那么存储数据时就按照设置的精度来存储。例如，6.214522存入6位小数的float和double是不会丢失小数精度的，取出来的数还是6.214522。也就是说，一个小数存入相同的精度的数据类型时，精度是不会丢失的。
2. **设置的精度和存储时的精度不一致。**
   当7或更多位精度的数字存入6位精度类型字段时，会发生什么？结果会发生四舍五入。四舍五入的结果就是匹配字段的数据类型的精度长度。此时精度也会丢失。不管内部如何处理，我们得到的数据是经过四舍五入的。但是有一点可以确定，我们在读取取舍后的数字时，是固定的。虽然浮点数存储的不是确切的数值，但是在你指定的精度长度条件下，存取都是确定的一个数值。而发生精度变化的就是数值的精度和字段的精度长度不匹配，从而发生数值扩展精度和截断精度问题，这也就是浮点数精度不准确的问题。
3. **mysql数据库使用其他数据库引擎来查询。**
   这个精度丢失的原因，就可能是不同的数据库引擎对浮点数的精度扩展和截断处理策略不一致，而且，存储时策略也不一致。所以导致精度会出现各种变化。这种问题也就是催生decimal类型的出现。我们前面看到的decimal是可以确切存储小数的精度的。因为在存储的时候会将小数以字符串存储，就不会再发生精度的扩展问题。但是decimal依然会发生精度截断问题。如果decimal指定精度为2位小数，存入的是这样的值：12.123，你觉得结果如何？当然还是会发生四舍五入。结果就是12.12，然而12.12以字符串形式存入了数据库，此后，12.12始终都是12.12，变现出来的是小数，然而内部是字符串形式存储，所以，小数精度不会再发生变化了。我们不管以什么精度来获取这个值，都是12.12，而且，不管是一般数据库引擎读取到的也都是12.12，所以decimal才是大家推荐使用的金额存储类型。

浮点数类型是把十进制数转换成二进制数存储，decimal是把十进制的整数部分和小数部分拆开，分别装换成十六进制，进行存储。这样，所有的数值，就都可以精准表达了。

### 大数据查询

**创建表**

```mysql
CREATE TABLE `user_operation_log`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `ip` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `op_data` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `attr1` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `attr2` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `attr3` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `attr4` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `attr5` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `attr6` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `attr7` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `attr8` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `attr9` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `attr10` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `attr11` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `attr12` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;
```

**创建数据脚本**

采用批量插入，效率会快很多，而且每1000条数就commit，数据量太大，也会导致批量插入效率慢

```mysql
DELIMITER ;;
CREATE PROCEDURE batch_insert_log()
BEGIN
  DECLARE i INT DEFAULT 1;
  DECLARE userId INT DEFAULT 10000000;
 set @execSql = 'INSERT INTO `test`.`user_operation_log`(`user_id`, `ip`, `op_data`, `attr1`, `attr2`, `attr3`, `attr4`, `attr5`, `attr6`, `attr7`, `attr8`, `attr9`, `attr10`, `attr11`, `attr12`) VALUES';
 set @execData = '';
  WHILE i<=10000000 DO
   set @attr = "'测试很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长的属性'";
  set @execData = concat(@execData, "(", userId + i, ", '10.0.69.175', '用户登录操作'", ",", @attr, ",", @attr, ",", @attr, ",", @attr, ",", @attr, ",", @attr, ",", @attr, ",", @attr, ",", @attr, ",", @attr, ",", @attr, ",", @attr, ")");
  if i % 1000 = 0
  then
     set @stmtSql = concat(@execSql, @execData,";");
    prepare stmt from @stmtSql;
    execute stmt;
    DEALLOCATE prepare stmt;
    commit;
    set @execData = "";
   else
     set @execData = concat(@execData, ",");
   end if;
  SET i=i+1;
  END WHILE;

END;;
DELIMITER ;
```

**开始测试**

> “
>
> 电脑配置比较低：win10 标压渣渣i5 读写约500MB的SSD

由于配置低，本次测试只准备了3148000条数据，占用了磁盘5G(还没建索引的情况下)，跑了38min，电脑配置好的同学，可以插入多点数据测试

```mysql
SELECT count(1) FROM `user_operation_log`
```

返回结果：3148000

三次查询时间分别为：

- 14060 ms
- 13755 ms
- 13447 ms

**普通分页查询**

MySQL 支持 LIMIT 语句来选取指定的条数数据， Oracle 可以使用 ROWNUM 来选取。

MySQL分页查询语法如下：

```mysql
SELECT * FROM table LIMIT [offset,] rows | rows OFFSET offset
```

- 第一个参数指定第一个返回记录行的偏移量
- 第二个参数指定返回记录行的最大数目

下面我们开始测试查询结果：

```mysql
SELECT * FROM `user_operation_log` LIMIT 10000, 10
```

查询3次时间分别为：

- 59 ms
- 49 ms
- 50 ms

这样看起来速度还行，不过是本地数据库，速度自然快点。

换个角度来测试

**相同偏移量，不同数据量**

```mysql
SELECT * FROM `user_operation_log` LIMIT 10000, 10
SELECT * FROM `user_operation_log` LIMIT 10000, 100
SELECT * FROM `user_operation_log` LIMIT 10000, 1000
SELECT * FROM `user_operation_log` LIMIT 10000, 10000
SELECT * FROM `user_operation_log` LIMIT 10000, 100000
SELECT * FROM `user_operation_log` LIMIT 10000, 1000000
```

查询时间如下：

| 数量      | 第一次  | 第二次  | 第三次  |
| :-------- | :------ | :------ | :------ |
| 10条      | 53ms    | 52ms    | 47ms    |
| 100条     | 50ms    | 60ms    | 55ms    |
| 1000条    | 61ms    | 74ms    | 60ms    |
| 10000条   | 164ms   | 180ms   | 217ms   |
| 100000条  | 1609ms  | 1741ms  | 1764ms  |
| 1000000条 | 16219ms | 16889ms | 17081ms |

从上面结果可以得出结束：**数据量越大，花费时间越长**

**相同数据量，不同偏移量**

```mysql
SELECT * FROM `user_operation_log` LIMIT 100, 100
SELECT * FROM `user_operation_log` LIMIT 1000, 100
SELECT * FROM `user_operation_log` LIMIT 10000, 100
SELECT * FROM `user_operation_log` LIMIT 100000, 100
SELECT * FROM `user_operation_log` LIMIT 1000000, 100
```

| 偏移量  | 第一次 | 第二次 | 第三次 |
| :------ | :----- | :----- | :----- |
| 100     | 36ms   | 40ms   | 36ms   |
| 1000    | 31ms   | 38ms   | 32ms   |
| 10000   | 53ms   | 48ms   | 51ms   |
| 100000  | 622ms  | 576ms  | 627ms  |
| 1000000 | 4891ms | 5076ms | 4856ms |

从上面结果可以得出结束：**偏移量越大，花费时间越长**

```mysql
SELECT * FROM `user_operation_log` LIMIT 100, 100
SELECT id, attr FROM `user_operation_log` LIMIT 100, 100
```

**如何优化**

既然我们经过上面一番的折腾，也得出了结论，针对上面两个问题：偏移大、数据量大，我们分别着手优化

优化偏移量大问题

**采用子查询方式**

我们可以先定位偏移位置的 id，然后再查询数据

```mysql
SELECT * FROM `user_operation_log` LIMIT 1000000, 10

SELECT id FROM `user_operation_log` LIMIT 1000000, 1

SELECT * FROM `user_operation_log` WHERE id >= (SELECT id FROM `user_operation_log` LIMIT 1000000, 1) LIMIT 10
```

查询结果如下：

| sql                  | 花费时间 |
| :------------------- | :------- |
| 第一条               | 4818ms   |
| 第二条(无索引情况下) | 4329ms   |
| 第二条(有索引情况下) | 199ms    |
| 第三条(无索引情况下) | 4319ms   |
| 第三条(有索引情况下) | 201ms    |

从上面结果得出结论：

- 第一条花费的时间最大，第三条比第一条稍微好点
- 子查询使用索引速度更快

缺点：只适用于id递增的情况

id非递增的情况可以使用以下写法，但这种缺点是分页查询只能放在子查询里面

注意：某些 mysql 版本不支持在 in 子句中使用 limit，所以采用了多个嵌套select

```mysql
SELECT * FROM `user_operation_log` WHERE id IN (SELECT t.id FROM (SELECT id FROM `user_operation_log` LIMIT 1000000, 10) AS t)
```

**采用 id 限定方式**

这种方法要求更高些，id必须是连续递增，而且还得计算id的范围，然后使用 between，sql如下

```mysql
SELECT * FROM `user_operation_log` WHERE id between 1000000 AND 1000100 LIMIT 100

SELECT * FROM `user_operation_log` WHERE id >= 1000000 LIMIT 100
```

查询结果如下：

| sql    | 花费时间 |
| :----- | :------- |
| 第一条 | 22ms     |
| 第二条 | 21ms     |

从结果可以看出这种方式非常快

_注意：这里的 LIMIT 是限制了条数，没有采用偏移量_

**优化数据量大问题**

返回结果的数据量也会直接影响速度

```mysql
SELECT * FROM `user_operation_log` LIMIT 1, 1000000

SELECT id FROM `user_operation_log` LIMIT 1, 1000000

SELECT id, user_id, ip, op_data, attr1, attr2, attr3, attr4, attr5, attr6, attr7, attr8, attr9, attr10, attr11, attr12 FROM `user_operation_log` LIMIT 1, 1000000
```

查询结果如下：

| sql    | 花费时间 |
| :----- | :------- |
| 第一条 | 15676ms  |
| 第二条 | 7298ms   |
| 第三条 | 15960ms  |

从结果可以看出减少不需要的列，查询效率也可以得到明显提升

第一条和第三条查询速度差不多，这时候你肯定会吐槽，那我还写那么多字段干啥呢，直接 \* 不就完事了

注意本人的 MySQL 服务器和客户端是在*同一台机器*上，所以查询数据相差不多，有条件的同学可以测测客户端与MySQL分开

**SELECT \* 它不香吗？**

在这里顺便补充一下为什么要禁止 `SELECT *`。难道简单无脑，它不香吗？

主要两点：

1. 用 "`SELECT * `" 数据库需要解析更多的对象、字段、权限、属性等相关内容，在 SQL 语句复杂，硬解析较多的情况下，会对数据库造成沉重的负担。
2. 增大网络开销，`*` 有时会误带上如log、IconMD5之类的无用且大文本字段，数据传输size会几何增涨。特别是MySQL和应用程序不在同一台机器，这种开销非常明显。

### 批量修改数据表和数据表中所有字段的字符集

查看数据表的行格式：

```mysql
show table status like 库名
```

查看库的字符集：

```mysql
show database status from 库名
```

查看表中所有列的字符集：

```mysql
show full columns from 表名
```

更改表编码(字符集)**和表中所有字段**的编码(字符集)：

```mysql
ALTER TABLE TABLE_NAME CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```

如果一个数据库有很多表要修改，可以使用如下办法：

查询某个数据库所有表名的语句：

```mysql
SELECT TABLE_NAME from information_schema.`TABLES` WHERE TABLE_SCHEMA = 'DATABASE_NAME';
```

得到所有的表名，我们可以把表名拼接到上面更改表编码(字符集)**和表中所有字段**的编码(字符集)的语句中去，得到如下语句：

```sql
SELECT
	CONCAT(
		'ALTER TABLE ',
		TABLE_NAME,
		' CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;'
	)
FROM
	information_schema.`TABLES`
WHERE
	TABLE_SCHEMA = 'DATABASE_NAME';
```

## 性能优化

### 建立索引的几个准则

1. 合理的建立索引能够加速数据读取效率，不合理的建立索引反而会拖慢数据库的响应速度。
2. 索引越多，更新数据的速度越慢。
3. 尽量在采用MyIsam作为引擎的时候使用索引（因为MySQL以BTree存储索引），而不是InnoDB，但MyISAM不支持Transcation。
4. 当你的程序和数据库结构/SQL语句已经优化到无法优化的程度，而程序瓶颈并不能顺利解决，那就是应该考虑使用诸如memcached这样的分布式缓存系统的时候了。
5. 习惯和强迫自己用EXPLAIN来分析你SQL语句的性能。

### count的优化

比如：计算id大于5的城市。

a：

```mysql
select count(*) from world.city where id > 5;
```

b：

```mysql
select (select count(*) from world.city) – count(*) from world.city where id <= 5;
```

a语句当行数超过11行的时候需要扫描的行数比b语句要多，b语句扫描了6行，此种情况下，b语句比a语句更有效率。

当没有where语句的时候直接select count(\*) from world.city这样会更快，因为MySQL总是知道表的行数。

### 避免使用不兼容的数据类型

例如float和int、char和varchar、binary和varbinary是不兼容的，数据类型的不兼容可能使优化器无法执行一些本来可以进行的优化操作。

**在程序中，保证在实现功能的基础上：**

- 尽量减少对数据库的访问次数；
- 通过搜索参数，尽量减少对表的访问行数,最小化结果集，从而减轻网络负担；
- 能够分开的操作尽量分开处理，提高每次的响应速度。

**在数据窗口使用SQL时：**

- 尽量把使用的索引放在选择的首列；
- 算法的结构尽量简单。

**在查询时：**

- 不要过多地使用通配符如 SELECT \* FROM T1语句，要用到几列就选择几列如：SELECT COL1,COL2 FROM T1；
- 在可能的情况下尽量限制尽量结果集行数如：SELECT TOP 300 COL1,COL2,COL3 FROM T1,因为某些情况下用户是不需要那么多的数据的。

**不要在应用中使用数据库游标：**

- 游标是非常有用的工具，但比使用常规的、面向集的SQL语句需要更大的开销；
- 按照特定顺序提取数据的查找。

### 索引字段上进行运算会使索引失效

尽量避免在WHERE子句中对字段进行函数或表达式操作，这将导致引擎放弃使用索引而进行全表扫描。

如：

```mysql
SELECT * FROM T1 WHERE F1/2=100
```

应改为：

```mysql
SELECT * FROM T1 WHERE F1=100*2
```

### 避免使用某些操作符

避免使用!=或＜＞、IS NULL或IS NOT NULL、IN ，NOT IN等这样的操作符。

因为这会使系统无法使用索引，而只能直接搜索表中的数据。

例如: SELECT id FROM employee WHERE id != “B%” 优化器将无法通过索引来确定将要命中的行数，因此需要搜索该表的所有行。

在in语句中能用exists语句代替的就用exists。

### 尽量使用数字型字段

一部分开发人员和数据库管理人员喜欢把包含数值信息的字段设计为字符型，这会降低查询和连接的性能，并会增加存储开销。

这是因为引擎在处理查询和连接回逐个比较字符串中每一个字符，而对于数字型而言只需要比较一次就够了。

### 合理使用EXISTS、NOT EXISTS子句

如下所示：

1：

```mysql
SELECT SUM(T1.C1) FROM T1 WHERE (SELECT COUNT(*)FROM T2 WHERE T2.C2=T1.C2>0)
```

2：

```mysql
SELECT SUM(T1.C1) FROM T1WHERE EXISTS(SELECT * FROM T2 WHERE T2.C2=T1.C2)
```

两者生相同的结果，但是后者的效率显然要高于前者，因为后者不会产生大量锁定的表扫描或是索引扫描。

如果你想校验表里是否存在某条纪录，不要用count(\*)那样效率很低，而且浪费服务器资源。可以用EXISTS代替。

如：

```mysql
IF (SELECT COUNT(*) FROM table_name WHERE column_name = ‘xxx’)
```

可以写成：

```mysql
IF EXISTS (SELECT * FROM table_name WHERE column_name = ‘xxx’)
```

### 避免使用一些语句

- 能够用BETWEEN的就不要用IN；
- 能够用DISTINCT的就不用GROUP BY；
- 尽量不要用SELECT INTO语句。SELECT INTO 语句会导致表锁定，阻止其他用户访问该表。

### 必要时强制查询优化器使用某个索引

```mysql
SELECT * FROM T1 WHERE nextprocess = 1 AND processid IN (8,32,45)
```

改成：

```mysql
SELECT * FROM T1 (INDEX = IX_ProcessID) WHERE nextprocess = 1 AND processid IN (8,32,45)
```

则查询优化器将会强行利用索引IX_ProcessID 执行查询。

### 消除对大型表行数据的顺序存取

尽管在所有的检查列上都有索引，但某些形式的WHERE子句强迫优化器使用顺序存取。

如：

```mysql
SELECT * FROM orders WHERE (customer_num=104 AND order_num>1001) OR order_num=1008
```

解决办法可以使用并集来避免顺序存取：

```mysql
 SELECT * FROM orders WHERE customer_num=104 AND order_num>1001 UNION SELECT * FROM orders WHERE order_num=1008
```

这样就能利用索引路径处理查询。jacking 数据结果集很多，但查询条件限定后结果集不大的情况下，后面的语句快。

### 避免使用非打头字母搜索

尽量避免在索引过的字符数据中，使用非打头字母搜索。这也使得引擎无法利用索引。

见如下例子：

```mysql
SELECT * FROM T1 WHERE NAME LIKE ‘%L%’ SELECT * FROM T1 WHERE SUBSTING(NAME,2,1)=’L’ SELECT * FROM T1 WHERE NAME LIKE ‘L%’
```

即使NAME字段建有索引，前两个查询依然无法利用索引完成加快操作，引擎不得不对全表所有数据逐条操作来完成任务。

而第三个查询能够使用索引来加快操作，不要习惯性的使用 ‘%L%’这种方式(会导致全表扫描)，如果可以使用`L%’相对来说更好。

### 建议

虽然UPDATE、DELETE语句的写法基本固定，但是还是对UPDATE语句给点建议：

- 尽量不要修改主键字段；
- 当修改VARCHAR型字段时，尽量使用相同长度内容的值代替；
- 尽量最小化对于含有UPDATE触发器的表的UPDATE操作；
- 避免UPDATE将要复制到其他数据库的列；
- 避免UPDATE建有很多索引的列；
- 避免UPDATE在WHERE子句条件中的列。

### 能用UNION ALL就不要用UNION

UNION ALL不执行SELECT DISTINCT函数，这样就会减少很多不必要的资源。

在跨多个不同的数据库时使用UNION是一个有趣的优化方法，UNION从两个互不关联的表中返回数据，这就意味着不会出现重复的行，同时也必须对数据进行排序。

我们知道排序是非常耗费资源的，特别是对大表的排序，UNION ALL可以大大加快速度，如果你已经知道你的数据不会包括重复行，或者你不在乎是否会出现重复的行，在这两种情况下使用UNION ALL更适合。

此外，还可以在应用程序逻辑中采用某些方法避免出现重复的行，这样UNION ALL和UNION返回的结果都是一样的，但UNION ALL不会进行排序。

![图片](data:image/svg+xml,<%3Fxml version='1.0' encoding='UTF-8'%3F><svg width='1px' height='1px' viewBox='0 0 1 1' version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'><title></title><g stroke='none' stroke-width='1' fill='none' fill-rule='evenodd' fill-opacity='0'><g transform='translate(-249.000000, -126.000000)' fill='%23FFFFFF'><rect x='249' y='126' width='1' height='1'></rect></g></g></svg>)

### 字段数据类型优化

避免使用NULL类型：NULL对于大多数数据库都需要特殊处理，MySQL也不例外。

它需要更多的代码，更多的检查和特殊的索引逻辑，有些开发人员完全没有意识到，创建表时NULL是默认值，但大多数时候应该使用NOT NULL，或者使用一个特殊的值，如0，-1作为默认值。

尽可能使用更小的字段：MySQL从磁盘读取数据后是存储到内存中的，然后使用cpu周期和磁盘I/O读取它。

这意味着越小的数据类型占用的空间越小，从磁盘读或打包到内存的效率都更好，但也不要太过执着减小数据类型，要是以后应用程序发生什么变化就没有空间了。

修改表将需要重构，间接地可能引起代码的改变，这是很头疼的问题，因此需要找到一个平衡点。

优先使用定长型。

### 一次性插入多条数据

程序中如果一次性对同一个表插入多条数据，比如以下语句：

```mysql
insert into person(name,age) values(‘xboy’, 14);
insert into person(name,age) values(‘xgirl’, 15);
insert into person(name,age) values(‘nia’, 19);
```

把它拼成一条语句执行效率会更高：

```mysql
insert into person(name,age) values(‘xboy’, 14), (‘xgirl’, 15),(‘nia’, 19);
```

### 无意义语句

不要在选择的栏位上放置索引，这是无意义的。应该在条件选择的语句上合理的放置索引，比如where、order by。

```mysql
SELECT id,title,content,cat_id FROM article WHERE cat_id = 1;
```

上面这个语句，你在id/title/content上放置索引是毫无意义的，对这个语句没有任何优化作用。但是如果你在外键cat_id上放置一个索引，那作用就相当大了。

### ORDER BY语句的MySQL优化

ORDER BY + LIMIT组合的索引优化。如果一个SQL语句形如：

```mysql
SELECT [column1],[column2],…. FROM [TABLE] ORDER BY [sort] LIMIT [offset],[LIMIT];
```

这个SQL语句优化比较简单，在[sort]这个栏位上建立索引即可。

b. WHERE + ORDER BY + LIMIT组合的索引优化，形如：

```mysql
SELECT [column1],[column2],…. FROM [TABLE] WHERE [columnX] = [VALUE] ORDER BY [sort] LIMIT [offset],[LIMIT];
```

这个语句，如果你仍然采用第一个例子中建立索引的方法，虽然可以用到索引，但是效率不高。

更高效的方法是建立一个联合索引(columnX,sort)。WHERE + IN + ORDER BY + LIMIT组合的索引优化，形如：

```mysql
SELECT [column1],[column2],…. FROM [TABLE] WHERE [columnX] IN ([value1],[value2],…) ORDER BY [sort] LIMIT [offset],[LIMIT];
```

这个语句如果你采用第二个例子中建立索引的方法，会得不到预期的效果（仅在[sort]上是using index，WHERE那里是using where;using filesort），理由是这里对应columnX的值对应多个。目前还没有找到比较优秀的办法，等待高手指教。

WHERE+ORDER BY多个栏位+LIMIT，比如:

```mysql
SELECT * FROM [table] WHERE uid=1 ORDER x,y LIMIT 0,10;
```

对于这个语句，大家可能是加一个这样的索引：(x,y,uid)。但实际上更好的效果是(uid,x,y)。这是由MySQL处理排序的机制造成的。
