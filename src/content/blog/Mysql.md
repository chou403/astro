---
title: "Mysql "
description: "Mysql 底层实现 & 性能优化"
pubDatetime: 2022-09-25T15:20:35Z
modDatetime: 2024-02-01T11:17:00Z
featured: true
tags:
  - mysql
---

## Table of contents

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

### Specified key was too long； max key length is 767 bytes

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

## 面试须知

### 什么是BufferPool

**基本概念**

Buffer Pool：缓冲池，简称 BP。其作用是用来缓存表数据与索引数据，减少磁盘 IO 操作，提升效率。

Buffer Pool 由**缓存数据页（Page）**和对缓存数据页进行描述的**控制块**组成，控制块中存储着对应缓存页的所属的表空间、数据页的编号、以及对应缓存页在 Buffer Pool 中的地址等信息。

Buffer Pool 默认大小是 128M，以 Page 页为单位，Page 页默认大小 16k，而控制块的大小约为数据页的 5%，大概是 800 字节。

**如何判断一个页是否在 Buffer Pool 中缓存**

MySQL 中有一个哈希表数据结构，它使用表空间号+数据页号，作为一个 key，然后缓冲页对应的控制块作为 value。

- 当需要访问某个页的数据时，先从哈希表中根据表空间号+页号看看是否存在对应的缓存页。
- 如果有，则直接使用，如果没有，就从 free 链表中选出一个空闲的缓冲页，然后把磁盘中对应的页加载到该缓冲页的位置。

### InnoDB引擎如何管理Page页

**Page 页分类**

BP 的底层采用链表数据结构管理 Page。在 InnoDB 访问表记录和索引时会在 Page 页中缓存，以后使用可以减少磁盘 IO 操作，提升效率。

Page 根据状态可以分为三种类型：

- free page：空闲 page，未被使用
- clean page：被使用 page，数据没有被修改过
- dirty page：脏页，被使用 page，数据被修改过，Page 页中数据和磁盘的数据产生了不一致

**Page 页如何管理**

针对上面所说的三种 Page 类型，innodb 通过三种链表结构来维护和管理。

1. free list：表示空闲缓冲区，管理 free Page。
   - free 链表是把所有空闲的缓冲页对应的控制块作为一个个的节点放到一个链表中，这个链表便称之为 free 链表。
   - 基节点：free 链表中只有一个基节点是不记录缓存页信息（单独申请空间），它里面就存放了 free 链表的头节点的地址，尾节点的地址，还有 free 链表里当前有多少个节点。
2. Flush list：表示需要刷新到磁盘的缓冲区，管理 dirty page，内部 page 按修改时间排序。
   - InnoDB 引擎为了提高处理效率，在每次修改缓冲页后，并不是立刻把修改刷新到磁盘上，而是在未来的某个时间点进行刷新操作，所以需要使用到 flush 链表存储脏页，凡是被修改过的缓冲页对应的控制块都会作为节点加入到 flush 链表。
   - flush 链表的机构与 free 链表的结构相似。
3. lru list：表示正在使用的缓冲区，管理 clean page 和 dirty page，缓冲区以 midpoint 为基点，前面链表称为 new 列表区，存放经常访问的数据，占 63%；后面的链表称为 old 列表区，存放使用较少数据，占 37%。

### 为什么写缓冲区，仅适用于非唯一普通索引页

change buffer：写缓冲区，是针对二级索引（辅助索引）页的更新优化措施。

作用：在进行 dml 操作时，如果请求的辅助索引（二级索引）没有在缓冲池中时，并不会立刻将磁盘页加载到缓冲池，而是在 cb 记录缓冲变更，等未来数据被读取时，再将数据合并恢复到 bp 中。

1. change buffer 用于存储 SQL 变更操作，比如 insert/update/delete 等 SQL 语句
2. change buffer 中的每个变更操作都有其对应的数据页，并且该数据页未加载到缓存中
3. 当 change buffer 中变更操作对应的数据页加载到缓存中后，InnoDB 会把变更操作 merge 到数据页上
4. InnoDB 会定期加载 change buffer 中操作对应的数据页到缓存中，并 merge 变更操作

**change buffer 更新流程**

![image-20230905135508966](https://cdn.jsdelivr.net/gh/chou401/pic-md@master/image-20230905135508966.png)

写缓冲区，仅适用于非唯一普通索引页，为什么？

- 如果在索引设置唯一性，在进行修改时，InnoDB 必须要做唯一性校验，因此必须查询磁盘，做一次 IO 操作。会直接将记录查询到 BufferPool 中，然后在缓冲池修改，不会在 change buffer 操作。

### MySQL为什么要改进LRU算法

**普通 LRU 算法**

LRU = least recently used（最近最少使用）：就是末位淘汰法，新数据从链表头部加入，释放空间时从末尾淘汰。

![image-20230905151907748](https://cdn.jsdelivr.net/gh/chou401/pic-md@master/image-20230905151907748.png)

1.  当要访问某个页时，如果不在 buffer pool，需要把该页加载到缓冲池，并且把该缓冲页对应的控制块作为节点添加到 LRU 链表的头部。
2.  当要访问某个页时，如果在 buffer pool 中，则直接把该页对应的控制块移动到 LRU 链表的头部。
3.  当需要释放空间时，从末尾淘汰。

**普通 LRU 链表的优缺点**

优点

- 所有最近使用的数据都在链表表头，最近未使用的数据都在链表表尾，保证热数据能最快被获取到。

缺点

- 如果发生全表扫描（比如：没有建立河失的索引 or 查询时使用 select \* 等），则有很大可能将真正的热数据淘汰掉。
- 由于 MySQL 中存在预读机制，很多预读的页都会被放到 LRU 链表的表头。如果这些预读的页都没有用到的话，这样，会导致很多尾部的缓冲页很快就会被淘汰。

**改进型 LRU 算法**

改进型 LRU：将链表分为 new 和 old 两个部分，加入元素时并不是从表头插入，而是从中间 midpoint 位置插入（就是说从磁盘中新读出的数据会放在冷数据区的头部），如果数据很快被访问，那么 page 就会向 new 列表头部移动，如果数据没有被访问，会逐步向 old 尾部移动，等待淘汰。

![image-20230905152906765](https://cdn.jsdelivr.net/gh/chou401/pic-md@master/image-20230905152906765.png)

冷数据区的数据页什么时候会被转到热数据区？

1. 如果该数据页在 LRU 链表中存在时间超过 1s，就将其移动到链表头部（链表指的是整个 LRU 链表）
2. 如果该数据页在 LRU 链表中存在的时间短于 1s，其位置不变（由于全表扫描有一个特点，就是它对某个页的频繁访问总耗时会很短）
3. 1s 这个时间是由参数 innodb_old_blocks_time 控制的

### 使用索引一定可以提升效率吗

索引就是排好序的，帮助我们进行快速查找的数据结构。

简单来讲，索引就是一种将数据库中的记录按照特殊形式存储的数据结构。通过索引，能够显著地提高数据查询的效率，从而提高服务器的性能。。

索引的优势与劣势

- 优点
  - 提高数据检索的效率，降低数据库的 IO 成本
  - 通过索引列对数据进行排序，降低数据排序的成本，降低了 CPU 的消耗
- 缺点
  - 创建索引和维护索引要耗费时间，这种时间随着数据量的增加而增加
  - 索引需要占物理空间，除了数据表占用数据空间之外，每一个索引还要占用一定的物理空间
  - 当对表中的数据进行增加、删除和修改的时候，索引也要动态的维护，降低了数据的维护速度
- 创建索引的原则
  - 在经常需要搜索的列上创建索引，可以加快搜索的速度
  - 在作为主键的列上创建索引，强制该列的唯一性和组织表中数据的排列结构
  - 在经常用在链接的列上，这些列主要是一些外键，可以加快连接的速度
  - 在经常需要根据范围进行搜索的列上创建索引，因为索引已经排序，其制定的范围是连续的
  - 在经常需要排序的列上创建索引，因为索引已经排序，这样查询可以利用索引的排序，加快排序查询时间
  - 在经常使用在 where 子句中的列上面创建索引，加快条件的判断速度

### 介绍一下Page页的结构

Page 是真个 InnoDB 存储的最基本构件，也是 InnoDB 磁盘管理的最小单位，与数据库相关的所有内容都存储在这种 Page 结构里。

Page 分为几种类型，常见的页类型有数据页（B+tree Node）、Undo 页（Undo Log Page）、系统页（System Page）、事务数据页（Transaction System Page）等。

页的结构整体上可以分为三大部分，分别为通用部分（文件头、文件尾）、存储记录空间、索引部分。

1. 通用部分：主要指文件头（File Header）和文件尾（File Trailer），将页的内容进行封装，通过文件头和文件尾校验的 CheckSum 方式来确保页的传输是完整的。其中比较重要的是在文件头中的`FIL_PAGE_PREV`和`FIL_PAGE_NEXT`字段，通过这两个字段，我们可以找到该页的上一页和下一页，实际上所有页通过两个字段可以形成一条双向链表。
2. 记录部分（User Records & Free Space）。页的主要作用是存储记录，所以“最小和最大记录”和“用户记录”部分占了页结构的主要空间。另外空闲空间是个灵活的部分，当有新的记录插入时，会从空闲空间中进行分配用于存储新纪录。
3. 数据目录部分（Page Directory）。数据页中行记录按照主键值由小到大顺序串联成一个单链表（页中记录是以单向链表的形式进行存储的），且单链表的链表头为最小记录，链表尾为最大记录。并且为了更快速地定位到指定的行记录，通过`Page Directory`实现目录的功能，借助`Page Directory`使用二分法快速找到需要查找的行记录。

### 聚簇索引与非聚簇索引

聚簇索引与非聚簇索引的区别是：叶节点是否存放一整行记录

- 聚簇索引：将数据存储与索引放到了一块，索引结构的叶子结点保存了行数据
- 非聚簇索引：将数据与索引分开存储，索引结构的叶子结点指向了数据对应的位置

InnoDB 主键使用的是聚簇索引，MyISAM 不管是主键索引，还是二级索引使用的都是非聚簇索引。

在 InnoDB 引擎中，主键索引采用的就是聚簇索引结构存储。

**聚簇索引（聚集索引）**

- 聚簇索引是一种数据存储方式，InnoDB 的聚簇索引就是按照主键顺序构件 B+Tree 结构。B+Tree 的叶子节点就是行记录，行记录和主键值紧凑地存储在一起。这也意味着 InnoDB 的主键索引就是数据表本身，它按主键顺序存放了整张表的数据，占用的空间就是整个表数据量的大小。通常说的主键索引就是聚集索引。
- InnoDB 的表要求必须要有聚簇索引
  - 如果表定义了主键，则主键索引就是聚簇索引
  - 如果表没有定义主键，则第一个非空 unique 列作为聚簇索引
  - 否则 InnoDB 会重建一个隐藏的 row-id 作为聚簇索引
- 辅助索引。InnoDB 辅助索引，也叫作二级索引，是根据索引列构建 B+Tree 结构。但在 B+Tree 的叶子结点中只存了索引列和主键的信息。二级索引占用的空间会比聚簇索引小很多，通常创建辅助索引就是为了提升查询效率。一个表 InnoDB 只能创建一个聚簇索引，但可以创建多个辅助索引。

**非聚簇索引**

与 InnoDB 表存储不同，MyISAM 使用的是非聚簇索引，非聚簇索引的两棵 B+Tree 看上去没什么不同，节点的结构完全一致只是存储的内容不同而已，主键索引 B+Tree 的节点存储了主键，复制索引 B+Tree 存储了辅助键。

表数据存储在独立的地方，这两棵 B+Tree 的叶子结点都使用一个地址指向真正的表数据，对于表数据来说，这两个键没有任何区别。由于索引树是独立的，通过辅助键检索无需访问主键的索引树。

**聚簇索引的优点**

1. 当你需要取出一定范围内的数据时，用聚簇索引也比非聚簇索引好。
2. 当通过聚簇索引查找目标数据时理论上比非聚簇索引要快，因为非聚簇索引定位到对应主键时还要多一次目标记录寻址，即多一次 IO。
3. 使用覆盖索引扫描的查询可以直接使用页节点中的主键值。

**聚簇索引的缺点**

1. 插入速度严重依赖于插入顺序。
2. 更新主键的代价很高，因为将会导致被更新的行移动。
3. 二级索引访问需要两次索引查找，第一次找到主键值，第二次根据主键值找到行数据。

### 索引有哪几种类型

1. 普通索引

   - 这是最基本的索引类型，基于普通字段建立的索引，没有任何限制。

   - > CREATE INDEX <索引的名字> ON tablename（字段名）
     >
     > ALTER TABLE tablename ADD INDEX [索引的名字]（字段名）
     >
     > CREATE TABLE tablename （[...]，INDEX [索引的名字]（字段名））

2. 唯一索引

   - 与“普通索引”类似，不同的就是：索引字段的值必须唯一，但允许有空值。

   - > CREATE UNIQUE INDEX <索引的名字> ON tablename（字段名）
     >
     > ALTER TABLE tablename ADD UNIQUE INDEX [索引的名字]（字段名）
     >
     > CREATE TABLE tablename （[...]，UNIQUE [索引的名字]（字段名））

3. 主键索引

   - 它是一种特殊的唯一索引，不允许有空值。在创建或修改表时追加主键约束即可，每个表只能有一个主键。

   - > CREATE TABLE tablename （[...]，PRIMARY KEY [索引的名字]（字段名））
     >
     > ALTER TABLE tablename ADD PRIMARY KEY（字段名）

4. 复合索引

   - 用户可以在多个列上建立索引，这种索引叫做组复合索引（组合索引）。复合索引可以代替多个单一索引，相比多个单一索引复合索引所需的开销更小。

   - > CREATE INDEX <索引的名字> ON tablename（字段名1，字段 2...）
     >
     > ALTER TABLE tablename ADD INDEX [索引的名字]（字段名1，字段 2...）
     >
     > CREATE TABLE tablename （[...]，INDEX [索引的名字]（字段名1，字段 2...））

   - 复合索引使用注意事项：

     - 何时使用复合索引，要根据 where 条件建索引，注意不要过多使用索引，过多使用会对更新操作效率有很大影响。
     - 如果表已经建立了（col1，col2），就没有必要再单独建立（col1）；如果现在有（col1）索引，如果查询需要 col1 和 col2 条件，可以建立（col1，col2）复合索引，对于查询有一定提高。

5. 全文索引

   查询操作在数据量比较少时，可以使用 like 模糊查询，但是对于大量的文本数据检索，效率很低。如果使用全文索引，查询速度会比 like 快很多倍。

   在 MySQL5.6 以前的版本，只有 MyISAM 存储引擎支持全文索引，从MySQL5.6 开始 MyISAM 和 InnoDB 存储引擎均支持。

   > CREATE FULLTEXT INDEX <索引的名字> ON tablename（字段名）
   >
   > ALTER TABLE tablename ADD FULLTEXT [索引的名字]（字段名）
   >
   > CREATE TABLE tablename （[...]，FULLTEXT KEY [索引的名字]（字段名））

   全文索引方式有自然语言检索`IN NATURAL LANGUAGE MODE`和布尔检索`IN BOOLEAN MODE`两种，和常用的 like 模糊查询不同，全文索引有自己的语法格式，使用 match 和 against 关键字。

   > SELECT \* FROM users3 WHERE MATCH(NAME) AGAINST('aabb');
   >
   > -- \* 表示通配符，只能在词后面
   >
   > SELECT _ FROM users3 WHERE MATCH(NAME) AGAINST('aa_' IN BOOLEAN MODE);

   全文索引必须在字符串、文本字段上建立。

   全文索引字段值必须在最小字符和最大字符之间才会有效。（InnoDB：3-84；MyISAM：4-84）

### 介绍一下最佳左前缀法则

- 最佳左前缀底层原理

  MySQL 创建联合索引的规则是：首先会对联合索引最左边的字段进行排序，在第一个字段的基础上再对第二个字段进行排序。

### 什么是索引下推

索引下推（index condition pushdown）简称 ICP，在 MySQL5.6 的版本推出，用于优化查询。

需求：查询 users 表中“名字第一个字是张，年龄为 10 岁的所有记录”。

```mysql
select * from users where user_name like '张%' and user_age = 10;
```

根据最左前缀原则，该语句在搜索索引树的时候，只能匹配到名字第一个字是‘张’的记录，接下来是怎么处理的呢？当然就是从该记录开始，逐个回表，到主键索引上找出相应的记录，在比对 age 这个字段的值是否符合。

MySQL5.6 引入了索引下推优化，可以在索引遍历过程中，对索引中包含的字段先做判断，过滤掉不符合条件的记录，减少回表次数。

如果没有索引下推优化（或简称 ICP 优化），当进行索引查询时，首先根据索引来查找记录，然后再根据 where 条件来过滤记录。

在支持 ICP 优化后，MySQL 会在取出索引的同时，判断是否可以进行 where 条件过滤再进行索引查询，也就是说提前执行 where 的部分过滤操作，在某些场景下，可以大大减少回表次数，从而提升整体性能。

### 什么是自适应哈希索引

自适应 hash 索引（Adatptive Hash Index，内部简称 AHI）是 InnoDB 的三大特性之一，还有两个是 BufferPool 简称 BP、双写缓冲区（Doublewrite Buffer）。

1. 自适应即我们不需要自己处理，当 InnoDB 引擎根据查询统计发现某一查询满足 hash 索引的数据结构特点，就会给其建立一个 hash 索引。
2. hash 索引底层的数据结构是散列表（（hash 表），其数据特点就是比较适合在内存中使用，自适应 hash 索引存在于 InnoDB 架构中的缓存中（不存在于磁盘架构中）。
3. 自适应 hash 索引只适合搜索等值的查询，如 select \* from table where index_col = 'xxx'，而对于其他查找类型，如范围查找，是不能使用的。

AHI 是针对B+树 Search Path 的优化，因此所有会涉及到 Search Path 的操作，均可使用此 hash 索引进行优化。

根据索引键值（前缀）快速定位到叶子结点满足条件记录的 offset，减少了 B+Tree Search Path的代价，将 B+Tree 从 Root 节点至 leaf 节点的路径定位，优化为 Hash Index 的快速查询。

InnoDB 的自适应 Hash 索引是默认开启的，可以通过配置下面的参数设置进行关闭。

```mysql
innodb_adaptive_hash_index = off
```

自适应 Hash 索引使用分片进行实现的，分片数可以使用配置参数设置

```mysql
innodb_adaptive_hash_index_parts = 8
```

### 为什么LIKE以%开头索引会失效

like 查询为范围查询，%出现在左边，则索引失效。%出现在右边索引未失效。

场景 1：两边都有%或者字段左边有%，索引失效

```mysql
select * from users where user_name like '%tom%';
select * from users where user_name like '%tom';
```

场景 2：字段右边有%，索引生效

```mysql
select * from users where user_name like 'tom%';
```

解决%出现在左边索引失效的方法，使用覆盖索引。

```mysql
select user_name from users where user_name likt '%tom%';
```

**like 失效的原因**

1. %号在右：由于 B+Tree 的索引顺序，是按照首字母的大小进行排序，%号在右的匹配又是匹配首字母。所以可以在 B+Tree 上进行有序的查找，查找首字母符合要求的数据。
2. %号在左：是匹配字符串尾部的数据，我们上面说了排序规则，尾部的字母是没有顺序的，所以不能按照索引顺序查询，就用不到索引。
3. 两个%号：这个是查询任意位置的字母满足条件即可，只有首字母是进行索引排序的，其他位置的字母都是相对无序的，所以查找任意位置的字母是用不到索引的。

### 自增还是UUID 数据库主键的类型该如何选择

**auto_increment 的优点**

1. 字段长度较 uuid 小很多，可以是 bigint 甚至是 int 类型，这对检索的性能会有所影响。
2. 在写的方面，因为是自增的，所以主键是趋势自增的，也就是说新增的数据永远在后面，这点对于性能有很大的提升。
3. 数据库自动编号，速度快，而且是增量增长，按顺序存放，对于检索非常有利。
4. 数字型，占用空间小，易排序，在程序中传递也方便。

**auto_increment 的缺点**

1. 由于是自增，很容易通过网络爬虫知晓当前系统的业务量。
2. 高并发的情况下，竞争自增锁会降低数据库的吞吐能力。
3. 数据迁移或分库分表场景下，自增方式不再适用。

**uuid 优点**

1. 不会冲突，进行数据拆分、合并存储的时候，能保证主键全局的唯一性。
2. 可以在应用层生成，提高数据库吞吐能力。

**uuid 缺点**

1. 影响插入速度，并且造成硬盘使用率低。与自增相比，最大的缺陷就是随机 IO，下面我们会去具体解释。
2. 字符串类型相比整数类型肯定更消耗空间，而且会比整数类型操作慢。

**uuid 和自增 id 的索引结构对比**

1. **使用自增 id 的内部结构**

   自增的主键的值是顺序的，所以 InnoDB 把每一条记录都存储在一条记录的后面。

   - 当达到页面的最大填充因子时候（InnoDB 默认的最大填充因子是页大小的 15/16，会留出 1/16的空间做以后的修改）。
   - 下一条记录就会写入新的页中，一旦数据按照这种顺序的方式加载，主键页就会近乎于顺序的记录填满，提升了页面的最大填充率，不会有页的浪费。
   - 新插入的行一定会在原有的最大数据行下一行，MySQL 定位和寻址很快，不会为计算新行的位置而做出额外的消耗，减少了页分裂和碎片的产生。

2. **使用 uuid 的内部结构**

   插入 uuid：新的记录可能会插入之前记录的中间，因此需要移动之前的记录。被写满已经刷新到磁盘上的页可能会被重新读取。

   因为 uuid 相对顺序的自增 id 来说是毫无规律可言的，新行的值不一定要比之前的主键的值要大，所以 InnoDB 无法做到总是把新行插入到索引的最后，而是需要为新行寻找新的合适的位置从而来分配新的空间。

   这个过程需要做很多额外的操作，数据的毫无顺序会导致数据分布散乱，将会导致以下的问题：

   1. 写入的目标页很可能已经刷新到磁盘上并且从缓存上移除，或者还没有被加载到缓存中，InnoDB 在插入之前不得不先找到并从磁盘读取目标页到内存中，这将导致大量的随机 IO。
   2. 因为写入是乱序的，InnoDB 不得不频繁的做页分裂操作，以便为新的行分配空间，页分裂导致移动大量的数据，一次插入最少需要修改三个页以上。
   3. 由于频繁的页分裂，页会变得稀疏并被不规则的填充，最终会导致数据会有碎片。
   4. 在把随机值（uuid 和雪花 id）载入到聚簇索引（InnoDB 默认的索引类型）以后，有时候会需要做一次 OPTIMEIZE TABLE 来重建表并优化页的填充，这将又需要一定的时间消耗。

   结论：使用 InnoDB 应该尽可能的按主键的自增顺序插入，并且尽可能使用单调增加聚簇键的值来插入新行。如果是分库分表场景下，分布式主键 id 的生成方案，优先选择雪花算法生成全局唯一主键（雪花算法生成的主键在一定程度上是有序的）。

### InnoDB与MyISAM的区别

InnoDB 和 MyISAM 是使用 MySQL 时最常用的两种引擎类型，两者区别：

- 事务和外键

  InnoDB 支持事务和外键，具有安全性和完整性，适合大量 insert 或 update 操作。

  MyISAM 不支持事务和外键，它提供高速存储和检索，适合大量的 select 查询操作。

- 锁机制

  InnoDB 支持行级锁，锁定指定记录，基于索引来加锁区别。

  MyISAM 支持表级锁，锁定整张表。

- 索引结构

  InnoDB 使用聚集索引，索引和记录在一起存储，既缓存索引，也缓存记录。

  MyISAM 使用非聚集索引，索引和记录分开。

- 并发处理能力

  InnoDB 读写阻塞可以与隔离级别有关，可以采用多版本并发控制（MVCC）来支持高并发。

  MyISAM 使用表锁，会导致写操作并发率低，读之间并不阻塞，读写阻塞。

- 存储文件

  InnoDB 表对应两个文件，一个.frm 表结构文件（MySQL8 中废弃，没有对应的.sdi文件，表结构合并在.ibd文件中），一个.ibd 数据文件。InnoDB 表最大支持 64GB。

  MyISAM 表对应三个文件，一个.frm 表结构文件（MySQL8 中废弃，出现了新的.sdi文件替代），一个 .MYD 表数据文件，一个.MYI 索引文件。从 MySQL5.0 开始默认限制是 255TB。

MyISAM 适用场景

- 不需要事务支持（不支持）
- 并发相对较低（锁定机制问题）
- 数据修改相对较少，以读为主
- 数据一致性要求不高

InnoDB 适用场景

- 需要事务支持（具有较好的事务特性）
- 行级锁定对高并发有很好的适应能力
- 数据更新较为频繁的场景
- 数据一致性要求较高
- 硬件设备内存较大，可以利用 InnoDB 较好的缓存能力来提高内存利用率，减少磁盘 IO

两种引擎如何选择

- 是否需要事务？有，InnoDB
- 是否存在并发修改？有，InnoDB
- 是否追求快速查询，且数据修改少？是，MyISAM
- 在绝大多数情况下，推荐使用 InnoDB

### B树和B+树的区别是什么

**B-Tree 介绍**

B-Tree 是一种平衡的多路查找树，B树允许一个节点存放多个数据，这样可以在尽可能减少树的深度的同时，存放更多的数据（把瘦高的树变得矮胖）。

B-Tree 中所有节点的子树个数的最大值成为 B-Tree 的阶，用 m 表示，一颗 m 阶的 B 树，如果不为空，就必须满足以下条件:

1. 每个节点最多用友 m-1 个关键字（跟节点除外）也就是 m 个子树
2. 跟节点至少有两个子树（可以没有子树，有就必须是两个）
3. 分支节点至少有（m/2）颗子树（除去跟节点和叶子节点其他都是分支节点）
4. 所有叶子节点都在同一层，并且以升序排序

**B-Tree 结构存储索引的特点**

为了描述 B-Tree 首先定义一条记录为了一个键值对[key，data]，key 为记录的键值，对应表中的主键值（聚簇索引），data 为一行记录中除主键外的数据。对于不同的记录，key 值互不相同。

- 索引值和 data 数据分布在整棵树结构中
- 指针存储着子节点的地址信息
- 每个节点可以存放多个索引值及对应的 data 数据
- 树节点中多个索引值从左到右升序排列

**B-Tree 的查找操作**

B-Tree 的每个节点的元素可以视为一次 IO 读取，树的高度表示最多的 IO 次数，在相同数量的总元素个数下，每个节点的元素个数越多，高度越低，查询所需的 IO 次数越少。

**B-Tree 总结**

- 优点：B-Tree 可以在内部节点存储键值和相关记录数据，因此把频繁访问的数据放在靠近跟节点的位置将大大提高热点数据的查询效率。
- 缺点：B-Tree 中每个节点不仅包含数据的 key 值，还有 data 数据，所以当 data 数据较大时，会导致每个节点存储的 key 值减少，并且导致 B-Tree 的层数变高，增加查询时的 IO 次数。
- 使用场景：B-Tree 主要应用于文件系统以及部分数据库索引，如 MongoDB，大部分关系型数据库索引则是使用 B+Tree 实现。

**B+Tree**

B+Tree 是在 B-Tree 基础上的一种优化，使其更适合实现存储索引结构，InnoDB 存储引起就是用 B+Tree 实现其索引结构。

**B+Tree 的特征**

- 非叶子节点只存储键值信息
- 所有叶子节点之间都有一个链指针
- 数据记录都存放在叶子节点中

**B+Tree 的优势**

1. B+Tree 是 B-Tree 的变种，B-Tree 能解决的问题，B+Tree 也能够解决（降低树的高度，增大节点存储数据量）。
2. B+Tree 扫库和扫表能力更强，如果我们要根据索引去进行数据表的扫描，对 B-Tree 进行扫描，需要把整棵树遍历一遍，而 B+Tree 只需要遍历他的所有叶子节点即可（叶子节点之间有引用）。
3. B+Tree 磁盘读写能力更强，它的根节点和支节点不保存数据区，所有跟节点和支节点同样大小的情况下，保存的关键字要比 B-Tree 多，而叶子节点不保存子节点引用，所以，B+Tree 读写一次磁盘加载的关键字比 B-Tree 更多。
4. B+Tree 排序能力更强，B+Tree 天然具有排序功能。
5. B+Tree 查询效率更加稳定，每次查询数据，查询 IO 次数一定是稳定的，当然这个每个人的理解都不同，因为在 B-Tree 如果跟节点命中直接返回，确实效率更高。

### 一个B+树中大概能存放多少条索引记录

MySQL 设计者将一个 B+Tree 的节点大小设置为一个页（这样做的目的是每个节点只需要一次 IO 就可以完全载入），InnoDB 的一个页的大小是 16KB，所以每个节点的大小也是 16KB，并且 B+Tree 的跟节点是保存在内存中的，子节点是存储在磁盘上。

**假设一个 B+Tree 高为 2，即存在一个跟节点和若干个叶子节点，那么这颗 B+Tree 的存放总记录数为：跟节点指针数 \* 单个叶子节点记录行数。**

- **计算跟节点指针数**：假设表的主键为 int 类型，占用的就是 4 个字节，或者是 bigint 占用 8 个字节，指针大小为 6 个字节，那么一个页（就是 B+Tree 的一个节点），大概可以存储：16348B / （4B + 6B） = 1638，一个节点最多可以存储1638 个索引指针。
- **计算每个叶子节点的记录数**：我们假设一行记录的数据大小为 1k，那么一页就可以存储 16 行数据，16kb / 1kb = 16。
- **一颗高度为 2 的 B+Tree 可以存放的记录数为**：1638 _ 16 = 26208 条数据记录，同样的原理可以推算处一个高度为 3 的 B+Tree 可以存放：1638 _ 1638 \* 16 = 42928704 条这样的数据。

**所以 InnoDB 中的 B+Tree 高度一般为 1~3 层，就可以满足千万级别的数据存储**，在查找数据时一次页的查找代表一次 IO，所以通过主键索引查询通常只需要 1~3 次 IO 操作即可查找到数据。

### explain 有哪些主要字段

MySQL 查询过程

![image-20230918172052198](https://cdn.jsdelivr.net/gh/chou401/pic-md@master/image-20230918172052198.png)

通过 explain 我们可以获得以下信息

- 表的读取顺序
- 数据读取操作的操作类型
- 哪些索引可以被使用
- 哪些索引真正被使用
- 表的直接引用
- 每张表有多少行被优化器查询了

explain 使用方式：explain + sql 语句

**explain 中包含的信息：**

- **id**：序列号，id列数字越大越先执行，如果说数字一样大，那么就从上往下依次执行，id列为null的就表是这是一个结果集，不需要使用它来进行查询。

- **select_type**：查询类型。主要用来分辨查询的类型事普通查询还是联合查询还是子查询。常见的查询类型有：

  - simple：表示不需要union操作或者不包含子查询的简单select查询。有连接查询时，外层的查询为simple，且只有一个。
  - primary：一个需要union操作或者含有子查询的select，位于最外层的单位查询的select_type即为primary。且只有一个。
  - union：union连接的两个select查询，第一个查询是dervied派生表，除了第一个表外，第二个以后的表select_type都是union。
  - dependent union：与union一样，出现在union 或union all语句中，但是这个查询要受到外部查询的影响。
  - union result：包含union的结果集，在union和union all语句中,因为它不需要参与查询，所以id字段为null。
  - subquery：除了from字句中包含的子查询外，其他地方出现的子查询都可能是subquery。
  - dependent subquery：与dependent union类似，表示这个subquery的查询要受到外部表查询的影响。
  - derived：from字句中出现的子查询，也叫做派生表，其他数据库中可能叫做内联视图或嵌套select。
  - uncacheable sebquery：一个子查询的结果不能被缓存。
  - uncacheable union：表示 union 的查询结果不能被缓存。

- **table**：表示 explain 语句正在访问哪个表，表名或者别名，可能是临时表或者 union 合并结果集。如果是具体的表名，则表明从实际的物理表中获取数据，当然也可以是表的别名；表名是 derivedN 的形式，表示使用了 id 为 N 的查询所产生的衍生表；当有 union result 的时候，表名是union n1,n2 等的形式，n1,n2 表示参与 union 的 id。

- **partions**：分区

- **type**：访问类型，表示以何种方式去访问数据库，最容易想的是全表扫描，即直接暴力的遍历一张表去寻找需要的数据，效率非常低下。

  访问的类型有很多，效率从最好到最坏依次是：system > const > eq_ref > ref > fulltext > ref_or_null > index_merge > unique_subquery > index_subquery > range > index > ALL。

  - **system**：表只有一行记录（等于系统表），这是 const 类型的特例，平时不会出现，不需要进行磁盘 IO。
  - **const**：最多只能匹配到一条数据，通常使用主键或唯一索引进行等值条件查询。
  - **eq_ref**：当进行等值联表查询使用主键索引或者唯一性非空索引进行数据查找时（实际上唯一索引等值查询 type 不是 eq_ref 而是 const）。
  - **ref**：使用了非唯一性索引进行数据的查找。
  - **ref_or_null**：对于某个字段既需要关联条件，也需要 null 值的情况下，查询优化器会选择这种访问方式。
  - **index_merge**：在查询过程中需要多个索引组合使用。
  - **unique_subquery**：该连接类型类似于 index_subquery，使用的是唯一索引。大多数情况下使用 SELECT 子查询时，MySQL 查询优化器会自动将子查询优化为联表查询，因此 type 不会显示为 index_subquery，而是 eq_ref。
  - **index_subquery**：利用索引来关联子查询，不再扫描全表。但是大多数情况下使用 SELECT 子查询时，MySQL 查询优化器会自动将子查询优化为联表查询，因此 type 不会显示 index_subquery，而是 ref。
  - **range**：表示利用索引查询的时候限制了范围，在指定范围内进行查询，这样避免了 index 的全索引扫描。适用的操作符：=, <>, >, >=, <, <=, is null, between,like, or, in。
  - **index**：全索引扫描这个比 all 的效率要好，主要有两种情况，一种是当前的查询覆盖索引，即需要的数据在索引中就可以索取，或者是使用了索引进行排序，这样就避免了数据的重排序。
  - **all**：全表扫描，需要扫描整张表，从头到尾找到需要的数据行。一般情况下出现这样的 sql 语句而且数据量比较大的话那么就需要进行优化。

  一般情况下，要保证查询至少达到 range 级别，最好能达到 ref。

- **possibale_keys**：显示查询可能使用哪些索引来查找，即显示可能应用在这张表中的索引，一个或多个，查询涉及到的字段上若存在索引，则该索引将被列出，但不一定被查询实际使用。

- **key**：这一列显示 mysql 实际采用哪个索引来优化对该表的访问，即实际使用的索引，如果为 null ，则表示没有使用索引。

- **key_len**：表示索引中使用的字节数，可以通过 key_len 计算查询中使用的索引长度，在不损失精度的情况下长度越短越好。索引越大占用存储空间越大，这样 io 的次数和量就会增加，影响执行效率。

- **ref**：显示之前的表在 key 列记录的索引中查找值所用的列或者常量。

- **rows**：根据表的统计信息及索引使用情况，大致估算出找出所需记录需要读取的数据行数，此参数很重要，直接反应 sql 找了多少数据，在完成目的的情况下越少越好。

- **filtered**：针对表中符合某个条件（where 子句或者连接条件）的记录数的百分比所做的一个悲观估算。

- **extra**：显示不适合在其它列的额外信息，虽 然叫额外，但是也有一些重要的信息：

  - **using filtersort**：说明 mysql 无法利用索引进行排序，只能利用排序算法进行排序，会消耗额外的位置。
  - **using index**：表示当前的查询是覆盖索引的，直接从索引中读取数据，而不用访问数据表。如果同时出现 using where，表示索引被用来执行索引键值的查找，如果没有，表示索引被用来读取数据，而不是真的查找。
  - **using where**：使用 where 进行条件过滤。
  - **using temporary** ：建立临时表来保存中间结果，查询完成之后把临时表删除。
  - **using join buffer**：使用连接缓存。会显示 join 连接查询时，MySQL 选择的查询算法。
  - **impossible where**：where 语句的结果总是 false。
  - **Using index condition**：表示查询包含索引列和非索引列，优化器将首先解析索引列，并在表中查找其他条件(**索引下推**)。
  - **Using index for skip scan**：索引跳跃。

### 如何进行分页查询优化

一般的分页查询使用简单的 limit 子句就可以实现。limit 格式如下：

```mysql
select * from 表名 limit [offset,] rows
```

- 第一个参数指定第一个返回记录行的偏移量，注意从 0 开始
- 第二个参数指定返回记录行的最大数目
- 如果只给定一个参数，它表示返回最大的记录行数目

**思考 1：如果偏移量固定，返回记录量对执行时间有什么影响？**

```mysql
select * from user limit 10000,1;
select * from user limit 10000,10;
select * from user limit 10000,100;
select * from user limit 10000,1000;
select * from user limit 10000,10000;
```

结果：在查询记录时，返回记录量低于 100 条，查询时间基本没有变化，差距不大。随着查询记录量越大，所花费的时间也会越来越多。

**思考 2：如果查询偏移量变化，返回记录数固定对执行时间有什么影响？**

```mysql
select * from user limit 1,100;
select * from user limit 10,100;
select * from user limit 100,100;
select * from user limit 1000,100;
select * from user limit 10000,100;
```

结果：在查询记录时，如果查询记录量相同，偏移量超过 100 后就开始随着偏移量增大，查询时间急剧的增加。（这种分页查询机制，每次都会从数据库第一条记录开始扫描，越往后查询越慢，而且查询的数据越多，也会拖慢总查询速度。）

**分页优化方案**

优化 1：通过索引进行分页

直接进行 limit 操作，会产生全表扫描，速度很慢，limit 限制的是从结果集的 M 位置处取出 N 条输出，其余抛弃。假设 id 是连续递增的，我们根据查询的页数和查询的记录数可以算出查询的 id 范围，然后配合 limit 使用

```mysql
explain select * from user where id >= 100001 limit 100;
```

优化 2：利用子查询优化

```mysql
# 首先定位偏移位置的 id
select id from user_contacts limit 100000,1;
# 根据获取到的 id 值向后查询
explain select * from user_contacts where id >= (select id from user_contacts limit 100000,1 ) limit 100;
```

原因：使用 id 做主键比较（id >= ），并且子查询使用了覆盖索引进行优化。

### 如何做慢查询优化

MySQL 慢查询的相关参数：

- slow_query_log：是否开启慢查询日志，ON(1)表示开启，OFF(0)表示关闭。
- slow_query_log_file：MySQL 数据库慢查询日志存储路径。
- long_query_time：慢查询阈值，当查询时间多于设定的阈值时，记录日志。
- long_queries_not_using_indexes：设置是否记录多少使用索引的查询语句。
- log_slow_admin_statements：设置是否记录管理语句的执行时间。

**慢查询SQL优化思路**

1. SQL 性能下降的原因

   当我们拿到 SQL 语句之后，对这些 SQL 进行分析之前，需要明确可能导致 SQL 执行性能下降的原因进行分析，执行性能下降可以体现以下两个方面：

   - 等待时间长

     > 锁表导致一直处于等待状态，后续我们从 MySQL 锁的机制去分析 SQL 执行的原理

   - 执行时间长

     > 1.查询语句写的烂
     >
     > 2.索引失败
     >
     > 3.关联查询太多 join
     >
     > 4.服务器调优及各个参数的设置

2. 慢查询优化思路

   1. 优先选择优化高并发执行的 SQL，因为高并发的 SQL 发生问题带来后果更严重

      > SQL1：每小时执行 10000 次，每次 20 个 IO，优化后每次 18 个 IO，每小时节省 2 万次 IO
      >
      > SQL2：每小时 10 次，每次 20000 个 IO，每次优化减少 2000 个 IO，每小时节省 2 万次 IO
      >
      > SQL2 更难优化，SQL1 更好优化，但是第一种属于高并发 SQL，更急需优化，成本更低

   2. 定位优化对象的性能瓶颈

      > 在去优化 SQL 时，选择优化分方向有三个：
      >
      > 1.IO（数据访问消耗了太多的时间，查看是否正确使用了索引）
      >
      > 2.CPU（数据运算花费了太多时间，数据的运算分祖，排序是不是有问题）
      >
      > 3.网络带宽（加大网络带宽）

   3. 明确优化目标

      > 需要根据数据库当前的状态
      >
      > 数据库中与该条 SQL 的关系
      >
      > 当前 SQL 的具体功能
      >
      > 最好的情况消耗的资源，最差情况下消耗的资源，优化的结果只有一个给用户一个好的体验

   4. 从 explain 执行计划入手

      > 只有 explain 能告诉你当前 SQL 的执行状态

   5. 永远用小的结果集驱动大的结果集

      > 晓得数据集驱动大的数据集，减少内层表读取的次数
      >
      > 类似于嵌套循环
      >
      > for(int i = 0;i < 5;i++) {
      >
      > for(int j = 0;j < 1000;j++){
      >
      > }
      >
      > }
      >
      > 如果小的循环在外层，对于数据库连接来说就只连接 5 次，进行 5000 次操作，如果 1000 在外，则需要进行 1000 次数据库连接，从而浪费资源，增加消耗，这就是为什么要小表驱动大表。

   6. 尽可能在索引中完成排序

      > 排序操作用的比较多，order by 后面的字段如果在索引中，索引本来就是排好序的，所以速度很快，没有索引的话，就需要从表中拿数据，在内存中进行排序，如果内存空间不够还会发生落盘操作。

   7. 只获取自己需要的列

      > 不要使用 select _ ，select _ 很可能不走索引，而且数据量过大。

   8. 只使用最有效的过滤条件

      > 误区，where 后面的条件越多越好，但实际上是应该用最短的路径访问到数据。

   9. 尽可能避免复杂的 join 和子查询

      > 每条 SQL 的 join 操作，建议不要超过三张表。
      >
      > 将复杂的 SQL，拆分成多个小的 SQL，单个表执行，获取的结果，在程序中进行封装。
      >
      > 如果 join 占用的资源比较多，会导致其他进程等待时间变长。

   10. 合理设计并利用索引

       > 如果判定是否需要创建索引？
       >
       > 1. 较为频繁的作为查询条件的字段应该创建索引。
       > 2. 唯一性太差的字段不适合单独创建索引，即使频繁作为查询条件。（唯一性太差的字段主要是指哪些呢？如状态字段、类型字段等等这些字段中的数据可能总共就是那么几个几十个数值重复使用）（当一条 query 所返回的数据超过了全表的 15%的时候，就不应该再使用索引扫描来完成这个 query 了）。
       > 3. 更新非常频繁的字段不适合创建索引。（因为索引中的字段被更新的时候，不仅仅需要更新表中的数据，同时还要更新索引数据，以确保所以信息是正确的）。
       > 4. 不会出现在 where 子句中的字段不该创建索引。
       >
       > 如果选择合适索引？
       >
       > 1. 对于单键索引，尽量选择针对当前 query 过滤性更好的索引。
       > 2. 选择联合索引时，当前 query 中过滤性最好的字段在索引字段顺序中排列要靠前。
       > 3. 选择联合索引时，尽量索引字段出现在 where 中比较多的索引。

### Hash索引有哪些优缺点

MySQL 中索引的常用数据结构有两种：一种是 B+Tree，另一种是 Hash。

Hash 底层实现是由 Hash 表来实现的，是根据键值<key, value> 存储数据的结构。非常适合根据 key 查找 value 值，也就是单个 key 查询，或者说等值查询。

![image-20230921175115312](https://cdn.jsdelivr.net/gh/chou401/pic-md@master/image-20230921175115312.png)

对于每一行数据，存储引擎都会对所有的索引列计算一个哈希码，哈希码是一个较小的值，如果出现哈希码值相同的情况会拉出一条链表。

Hash 索引的优点

- 因为索引自身只需要存储对应的 Hash 值，所以索引结构非常紧凑，只需要做等值比较查询，而不包含排序或范围查询的需求，都适合使用哈希索引。
- 没有哈希冲突的情况下，等值查询访问哈希索引的数据比较快。（如果发生 Hash 冲突，存储引擎必须遍历链表中的所有行指针，逐行进行比较，直到找到所有符合条件的行）。

Hash 索引的缺点

- 哈希索引只包含哈希值和行指针，而不存储字段值，所以不能使用索引中的值来避免读取行。
- 哈希索引只支持等值比较查询，不支持任何范围查询和部分索引列匹配查找。
- 哈希索引数据并不是按照索引值顺序存储的，所以也就无法用于排序。

### InnoDB内存相关的参数优化

BufferPool 参数优化

1. 缓冲池内存大小配置

   一个大的日志缓冲区允许大量的事务在提交之前不写日志到磁盘。因此，如果你有很多事务的更新，插入或删除操作，通过设置这个参数会大量的减少磁盘 IO 的次数。

   建议：在专用数据库服务器上，可以将缓冲池大小设置为服务器物理内存的 60%-80%。

   ```mysql
   # 查看 BufferPool 缓冲池大小
   show variables like '%innodb_buffer_pool_size%';
   # 调整 BufferPool 缓冲池大小
   set global innodb_buffer_pool_size = 268435456; -- 512M
   # 监控在线调整缓冲池的进度
   show status where variable_name = 'innodb_buffer_pool_resize_status';
   ```

2. InnoDB 缓存性能评估

   当前配置的 innodb_pool_size 是否合适，可以通过分析 InnoDB 缓冲池的缓存命中率来验证。

   - 以下公式计算 InnoDB BufferPool 命中率：

     > 命中率 = innodb_buffer_pool_read_requests / (innodb_buffer_pool_read_requests + innodb_buffer_pool_reads) \* 100
     >
     > 参数 1：innodb_buffer_pool_reads：表示 InnoDB 缓冲池无法满足的请求数，需要从磁盘中读取。
     >
     > 参数 2：innodb_buffer_pool_read_requests：表示从内存中读取页的请求数。

     ![image-20230922112638300](https://cdn.jsdelivr.net/gh/chou401/pic-md@master/image-20230922112638300.png)

     命中率低于 90%，则可以考虑增加innodb_buffer_pool_size。

3. Page 管理相关参数

   查看 Page 页的大小（默认 16kb），innodb_page_size 只能在初始化 MySQL 实例之前配置，不能在之后修改。如果没有指定值，则使用默认页面大小初始化实例。

   ![image-20230922113121486](https://cdn.jsdelivr.net/gh/chou401/pic-md@master/image-20230922113121486.png)

   Page 页管理状态相关参数

   ![image-20230922113235811](https://cdn.jsdelivr.net/gh/chou401/pic-md@master/image-20230922113235811.png)

   - **Innodb_buffer_pool_pages_data**：InnoDB缓冲池中包含数据的页数。 该数字包括脏页面和干净页面。 使用压缩表时，报告的Innodb_buffer_pool_pages_data值可能大于Innodb_buffer_pool_pages_total。
   - **Innodb_buffer_pool_pages_dirty**：显示在内存中修改但尚未写入数据文件的InnoDB缓冲池数据页的数量（脏页刷新）。
   - **Innodb_buffer_pool_pages_flushed**：表示从InnoDB缓冲池中刷新脏页的请求数。
   - **Innodb_buffer_pool_pages_free**：显示InnoDB缓冲池中的空闲页面。
   - **Innodb_buffer_pool_pages_misc**：InnoDB缓冲池中的页面数量很多，因为它们已被分配用于管理开销，例如行锁或自适应哈希索引。此值也可以计算为Innodb_buffer_pool_pages_total - Innodb_buffer_pool_pages_free - Innodb_buffer_pool_pages_data。
   - **Innodb_buffer_pool_pages_total**：InnoDB缓冲池的总大小，以page为单位。

### InnoDB日志相关的参数优化

1. 日志缓冲区相关参数配置

   日志缓冲区的大小。一般默认值 16mb 是够用的，但如果事务之中含有 blog/text 等大字段，这个缓冲区会被很快填满会引起额外的 IO 负载。配置更大的日志缓冲区，可以有效的提高 MySQL 的效率。

   - **Innodb_log_buffer_size 缓冲区大小**

     ![image-20230922114800080](https://cdn.jsdelivr.net/gh/chou401/pic-md@master/image-20230922114800080.png)

   - **innodb_log_files_in_group 日志组文件个数**

     日志组根据需要来创建。而日志组的成员则需要至少 2 个，实现循环写入并作为冗余策略。

     ![image-20230922114934551](https://cdn.jsdelivr.net/gh/chou401/pic-md@master/image-20230922114934551.png)

   - **Innodb_log_file_size 日志文件大小**

     参数 Innodb_log_file_size 用于设定 MySQL 日志组中每个日志文件的大小（默认 48mb）。此参数是一个全局的静态参数，不能动态修改。

     参数 Innodb_log_file_size 的最大值，二进制日志文件大小（innodb_log_file_size \* innodb_log_files_in_group）不能超过 512gb，所以单个日志文件的大小不能超过 256gb。

     ![image-20230922115422562](https://cdn.jsdelivr.net/gh/chou401/pic-md@master/image-20230922115422562.png)

2. 日志文件参数优化

   首先我们先来看一下日志文件大小设置对性能的影响

   - 设置过小

     1. 参数 innodb_log_file_size 设置太小，就会导致 MySQL 的日志文件（redo log）频繁切换，频繁的触发数据库的检查点（checkpoint），导致刷新脏页到磁盘的次数增加。从而影响 IO 性能。
     2. 处理大事务时，将所有的日志文件写满了，事务内容还没有写完，这样就会导致日志不能切换。

   - 设置过大

     参数 innodb_log_file_size 如果设置过大，虽然可以提升 IO 性能，但是当 MySQL 由于意外宕机时，二进制日志很大，那么恢复的时间必然很长。而且这个恢复时间往往不可控，受多方面因素影响。

**优化建议**

如何设置合适的日志文件大小？

- 根据实际生产场景的优化经验，一般是计算一段时间内生成的事务日志（redo log）的大小，而 MySQL 的日志文件大小最少应该承载一个小时的业务日志量(官网文档中有说明）。

想要估计一下 InnoDB redo log 的大小，需要抓取一段时间内 Log SequenceNumber（日志顺序号）的数据，来计算一小时内产生的日志大小。

> Log SequenceNumber
>
> 自系统修改开始，就不断的生成 redo 日志，为了记录一共生成了多少日志，于是 MySQL 设计了全局变量 Log SequenceNumber，简称 lsn，但不是从 0 开始，是从 8704 字节开始。

```mysql
# pager 分页工具，只获取 sequence 的信息
mysql> pager grep sequence;
PAGER set to 'grep sequence'

# 查询状态，并倒计时一分钟
mysql> show engine innodb status\G select sleep(60);
Log sequence number          21799672
1 row in set (0.00 sec)
1 row in set (1 min 0.00 sec)

# 一分时间内所生成的数据量 (此处)
mysql> show engine innodb status;
Log sequence number          21803964
1 row in set (0.00 sec)

# 关闭 pager
mysql> nopager
PAGER set to stdout
```

有了一分钟的日志量，据此推算一小时内的日志量

```mysql
mysql> select (21803964 - 21799672) / 1024 as kb_per_min;
+------------+
| kb_per_min |
+------------+
|     4.1914 |
+------------+
1 row in set (0.00 sec)

mysql> select (21803964 - 21799672) / 1024 * 60 as kb_per_min;
+------------+
| kb_per_min |
+------------+
|   251.4844 |
+------------+
1 row in set (0.00 sec)
```

太大的缓冲池或不正常的业务负载可能会计算出非常大（或非常小）的日志大小。这也是公式不足之处，需要根据判断和经验。但这个计算方法是一个很好的参考标准。

### InnoDB IO线程相关参数优化

数据库属于 IO 密集型的应用程序，其主要职责就是数据的管理及存储工作。从内存中读取一个数据库数据的时间是微秒级别，而从一块普通硬盘上读取一个 IO 是在毫秒级别。要优化数据库，IO 操作时必须要优化的，尽可能将磁盘 IO 转化为内存 IO。

**参数：query_cache_size & have_auery_cache**

MySQL 查询缓存会保存查询返回的完整结果。当查询命中该缓存，会 like 返回结果，跳过了解析，优化和执行阶段。

查询缓存会跟踪查询中涉及的每个表，如果这些表发生变化，那么和这个表相关的所有缓存都将失效。

**查看查询缓存是否开启**

```mysql
# 查询是否支持查询缓存
mysql> show variables like 'have_query_cache';
+------------------+-------+
| Variable_name    | Value |
+------------------+-------+
| have_query_cache | NO    |
+------------------+-------+
1 row in set (0.01 sec)

# 查询是否开启查询缓存 默认是关闭的
mysql> show variables like '%query_cache_type%';
Empty set (0.01 sec)

```

**开启缓存，在 my.ini 中添加下面一行参数**

> query_cache_size=128M
>
> query_cache_type=1
>
> query_cache_type:
>
> 设置为0，OFF，缓存禁用
>
> 设置为 1，ON，缓存所有结果
>
> 设置为 2，DENAND，只缓存在 select 语句中通过 sql_cache 指定需要缓存的查询

**测试能否缓存查询**

> mysql> show status like '%Qcache%';

- Qcahce_free_blocks：缓存中目前剩余的 blocks 数量（如果值较大，则查询缓存中的内存碎片过多）
- Qcache_free_memory：空闲缓存的内存大小
- Qcache_hist：命中缓存次数
- Qcache_inserts：未命中然后进行正常查询
- Qcache_lowmem_prunes：查询因为内存不足而被移除出查询缓存记录
- Qcache_not_cached：没有被缓存的查询数量
- Qcache_queries_in_cahce：当前缓存中缓存的查询数量
- Qcache_total_blocks：当前缓存的 block 数量

**优化建议：**Query Cache 的使用需要多个参数配合，其中最为关键的是 query_cache_size 和 query_cache_type，前者设置用于缓存 ResultSet 的内存大小，后者设置在哪种场景下使用 Query Cache。

MySQL 数据库数据变化相对不多，query_cache_size 一般设置为 256MB 比较合适，也可以通过计算 Query Cache 的命中率来进行调整。

> （ Qcache_hist / （Qcache_hist + Qcache_inserts） \* 100 ）

**参数：innodb_max_dirty_pages_pct**

该参数是 InnoDB 存储引擎用来控制 Buffer pool 中脏页的百分比，当脏页数量占比超过这个参数设置的值时，InnoDB 会启动刷脏页的操作。

```mysql
-- innodb_max_dirty_pages_pct 参数可以动态调整，最小值为 0，最大值为 99.99
mysql> show variables like 'innodb_max_dirty_pages_pct';
+----------------------------+-----------+
| Variable_name              | Value     |
+----------------------------+-----------+
| innodb_max_dirty_pages_pct | 90.000000 |
+----------------------------+-----------+
1 row in set (0.01 sec)
```

**优化建议：**该参数比例值越大，从内存到磁盘的写入操作就会相对减少，所以能够一定程度减少写入操作的磁盘 IO。但是，如果这个比例值过大，当数据库 crash 之后重启的时间可能就会很长，因为会有大量的事务数据需要从日志文件恢复出来写入数据文件中，最大不建议超过 90，一般重启恢复的数据在超过 1GB 的话，启动速度就会变慢。

**参数：innodb_old_blocks_pct & innodb_old_blocks_time**

`innodb_old_blocks_pct` 用来确定 LRU 链表中 old sublist 所占比例，默认占用 37%。

```mysql
mysql> show variables like '%innodb_old_blocks_pct%';
+-----------------------+-------+
| Variable_name         | Value |
+-----------------------+-------+
| innodb_old_blocks_pct | 37    |
+-----------------------+-------+
1 row in set (0.01 sec)
```

`innodb_old_blocks_time` 用来控制 old sublist 中 page 的转移策略，新的 page 页在进入 LRU 链表中时，会先插入到 old sublist 的头部，然后 page 需要在 old sublist 中停留 innodb_old_blocks_time 这么久后，下一次对该 page 的访问才会使其移动到 new sublist 的头部，默认值1 秒。

```mysql
mysql> show variables like '%innodb_old_blocks_time%';
+------------------------+-------+
| Variable_name          | Value |
+------------------------+-------+
| innodb_old_blocks_time | 1000  |
+------------------------+-------+
1 row in set (0.01 sec)
```

**优化建议：**在没有大表扫描的情况下，并且数据多为频繁使用的数据时，我们可以增加 innodb_old_blocks_pct 的值，并且减少 innodb_old_blocks_time 的值。让数据页能够更快和更多的进入热点数据区。

### 什么是写失效

InnoDB 的页和操作系统的页大小不一致，InnoDB 页大小一般为 16K，操作系统页大小为 4K，InnoDB 的页写入到磁盘时，一个页需要分 4 次写。

如果存储引擎正在写入页的数据到磁盘时发生了宕机，可能出现页只写了一部分的情况，比如只写了 4K，就宕机了，这种情况叫做部分写失效，可能会导致数据丢失。

**双写缓冲区 Doublewrite Buffer**

为了解决写失效问题，InnoDB 实现了double write buffer Files，它位于系统表空间，是一个存储区域。

在 BufferPool 的 page 页刷新到磁盘真正的位置前，会先将数据存在 Doublewrite 缓冲区。这样在宕机重启时，如果出现页损坏，那么在应用 redo log 之前，需要通过该页的副本来还原该页，然后再进行 redo log 重做，double write 实现了 InnoDB 引擎数据页的可靠性。

默认情况下启用双写缓冲区，如果要禁用 Doublewrite 缓冲区，可以将`innodb_doublewrite`设置为 0.

```mysql
mysql> show variables like '%innodb_doublewrite%';
+-------------------------------+-------+
| Variable_name                 | Value |
+-------------------------------+-------+
| innodb_doublewrite            | ON    |
| innodb_doublewrite_batch_size | 0     |
| innodb_doublewrite_dir        |       |
| innodb_doublewrite_files      | 2     |
| innodb_doublewrite_pages      | 4     |
+-------------------------------+-------+
5 rows in set (0.01 sec)
```

![image-20231017153855797](https://cdn.jsdelivr.net/gh/chou401/pic-md@master/image-20231017153855797.png)

- **step1**：当进行缓冲池中的脏页淑新到磁盘的操作时，并不会直接写磁盘，每次脏页刷新必须要先写doublewrite。
- **step2**：通过 memcpy 函数将脏页复制到内存中的 double write buffer。
- **step3**：double write buffer 再分两次、每次 1MB，顺序写入共享表空间的物理磁盘上，**第一次写**。
- **step4**：在完成double write 页的写入后，再将 double write buffer 中的页写入各个表的**独立表空间**文件中（数据文件 .ibd），**第二次写**。

**为什么写两次**

共享表空间时在 ibd data 文件中划出 2M 连续的空间，专门给 double write 刷脏页用的，由于在这个过程中，**double write 页的存储是连续的，因此写入磁盘为顺序写，性能很高**；完成 double write 后，再将脏页写入实际的各个表空间文件，这时写入就是离散的了。

### 什么是行溢出

**行记录格式**

1. **行格式分类**

   表的行格式决定了它的行时如何物理存储的，这反过来又会影响查询和 DML 操作的性能。如果在单个 page 页中容纳更多行，查询和索引查找可以更快地工作，缓冲池中所需的内存更少，写入更新时所需的 IO 更少。

   InnoDB 存储引擎支持四种行格式：Redundant、Compact、Dynamic 和 Compressed。

   查询 MySQL 使用的行格式，默认为 Dynamic。

   ```mysql
   mysql> show variables like 'innodb_default_row_format';
   +---------------------------+---------+
   | Variable_name             | Value   |
   +---------------------------+---------+
   | innodb_default_row_format | dynamic |
   +---------------------------+---------+
   1 row in set (0.01 sec)
   ```

   指定行格式写法

   > CREATE TABLE <table_name(column_name)> ROW_FORMAT=行格式名称
   >
   > ALTER TABLE <table_name> ROW_FORMAT=行格式名称

2. **Compact 行记录格式**

   Compact 设计目标是高效地存储数据，一个页中存放的行数据越多，其性能就越高。

   Compact 行记录由两部分组成：记录放入额外信息和记录的真实数据。

   **记录额外信息部分**

   服务器为了描述一条记录而添加了一些额外信息（元数据信息），这些额外信息分为 3 类，分别是：变长字段长度列表、NULL 值列表和记录头信息。

   - **变长字段长度列表**

     MySQL 支持一些变长的数据类型，比如 VARCHAR、VARBINARY、各种 TEXT 类型、各种 BLOB 类型，这些变长的数据类型占用的存储空间分为两部分：

     1. 真正的数据内容
     2. 占用的字节数

     变长字段的长度是不固定的，所以在存储数据的时候要把这些数据占用的字节数也存起来，读取数据的时候才能根据这个长度列表去读取对应长度的数据。

     在 Compact 行格式中，把所有变成类型的列的长度都存放在记录的开头部位形成一个列表，按照列的顺序逆序存放，这个列表就是变长字段长度列表。

   - **NULL 值列表**

     表中的某些列可能会存储 NULL 值，如果把这些 NULL 值都放到记录的真实数据中会比较浪费空间，所以 Compact 行格式把这些值的 NULL 的列存储到 NULL 值列表中。（如果表中所有列都不允许为 NULL，就不存在 NULL 值列表）。

   - **记录头信息**

     记录头信息是由固定的 5 个字节组成，5 个字节也就是 40 个二进制位，不同的位代表不同的意思。

     | 名称         | 大小(单位：bit) | 描述                                                                                                               |
     | ------------ | --------------- | ------------------------------------------------------------------------------------------------------------------ |
     | 预留位 1     | 1               | 没有使用                                                                                                           |
     | 预留位 2     | 1               | 没有使用                                                                                                           |
     | delete_mask  | 1               | 标记该记录是否被删除                                                                                               |
     | min_rec_mask | 1               | 标记该记录是否是本层 B+Tree 的非叶子节点中的最小记录                                                               |
     | n_owned      | 4               | 表示当前分组中管理的记录数                                                                                         |
     | heap_no      | 13              | 表示当前记录在记录堆中的位置信息                                                                                   |
     | record_type  | 3               | 表示当前记录的类型：<br />0 表示普通记录<br />1 表示 B+Tree 非叶子节点记录<br />2 表示最小记录<br />3 表示最大记录 |
     | next_record  | 16              | 表示下一条记录的相对位置                                                                                           |

     1. delete_mask

        这个属性标记着当前记录是否被删除，占用 1 个二进制位，值为 0 的时候代表记录并没有被删除，为 1 的时候代表记录被删除掉了。

     2. min_rec_mask

        B+Tree 的每层非叶子节点中的最小记录都会添加该标记。

     3. n_owned

        代表每个分组里，所拥有的记录的数量，一般是分组里主键最大值才有的。

     4. heap_no

        在数据页的 User Records 中插入的记录是一条一条紧凑的排列的，这种紧凑排列的机构又被称为堆。为了便于管理这个堆，把记录在堆中的相对位置给定一个编号-- heap_no。所以 heap_no 这个属性表示当前记录在本页中的位置。

     5. record_type

        这个属性表示当前记录的类型，一共有 4 种类型的记录，0 表示普通用户记录，1 表示 B+Tree 非叶子节点记录，2 表示最小记录，3 表示最大记录。

     6. next_record

        表示从当前记录的真实数据到下一条记录的真实数据的地址偏移量，可以理解为指向下一条记录地址的指针。值为正数说明下一条记录在当前记录后面，为负数说明下一条记录在当前记录的前面。

   **记录真实数据部分**

   记录的真实数据除了插入的那些列的数据，MySQL 会为每个记录默认的添加一些列（也称为隐藏列），具体的列如下：

   ![image-20231018103232216](https://cdn.jsdelivr.net/gh/chou401/pic-md@master/image-20231018103232216.png)

   | 列名           | 是否必须 | 占用空间 | 描述                    |
   | -------------- | -------- | -------- | ----------------------- |
   | row_id         | 否       | 6 byte   | 行 id，唯一标识一条记录 |
   | transaction_id | 是       | 6 byte   | 事务 id                 |
   | roll_pointer   | 是       | 7 byte   | 回滚指针                |

   生成隐藏主键列的方式有：

   1. 服务器会在内存中维护一个全局变量，每当向某个包含隐藏的 row_id 列的表中插入一条记录时，就会把该变量的值当做新纪录的 row_id 列的值，并且把该变量自增 1。
   2. 每当这个变量的值为 256 的倍数时，就会将该变量的值刷新到系统表空间的页号为 7 的页面中一个 max row id 的属性处。
   3. 当系统启动时，会将页中的 max row id 属性加载到内存中，并将该值加上 256 之后赋值给全局变量，因为在上次关机时该全局变量的值可能大于页中 max row id 属性值。

3. **Compact 中的行溢出机制**

   **什么是行溢出**

   MySQL 中以页为基本单位，进行磁盘与内存之间的数据交互的，我们知道一个页的大小是 16kb，16kb=16384 字节，而一个 varchar 类型列最多可以存储 65532 个字节，一些大的数据类型比如 text 可以存储更多。

   如果一个表中存在这样的大字段，那么一个页就无法存储一条完整的记录，这时就会发生行溢出，多出的数据就会存储在另外的溢出页中。

   总结：如果某些字段信息过长，无法存储在 B 树节点中，这时候会被单独分配空间，此时被称为溢出页，该字段被称为页外列。

   **Compact 中的行溢出机制**

   InnoDB 规定一页至少存储两条记录（B+Tree 特点），如果页中只能存放一条记录，InnoDB 存储引擎会自动将行数据存放到溢出页中。

   当发生行溢出时，数据页只保存了前 768 字节的前缀数据，接着是 20 个字节的偏移量，指向行溢出页。

   ![image-20231018105842012](https://cdn.jsdelivr.net/gh/chou401/pic-md@master/image-20231018105842012.png)

### 如何进行JOIN优化

**什么是驱动表**

- 多表关联查询时，第一个被处理的表就是驱动表，使用驱动表去关联其他表。
- 驱动表的确定非常的关键，会直接影响多表关联的顺序，也决定后续关联查询的性能。

驱动表的选择要遵循一个规则：

- 在对最终的结果集没有影响的前提下，优先选择结果集最小的哪张表作为驱动表。

**三种 JOIN 算法**

1. **Simple Nested-Loop Join（简单的嵌套循环连接）**

   - 简单来说嵌套循环连接算法就是一个双层 for 循环，通过循环外层表的行数据，逐个与内层表的所有行数据进行比较来获取结果。

   - 这种算法是最简单的方案，性能也一般。对内循环没优化。

   - 例如有这样一条 SQL：

     > -- 连接用户表与订单表，连接条件是 t1.id = t2.user_id
     >
     > select \* from user t1 left join order t2 on t1.id = t2.user_id;
     >
     > -- user 表为驱动表，order 表为被驱动表

   - 转换成代码执行时的思路是这样的：

     > for(user表行 uRow ：user 表) {
     >
     > for(order表行 oRow ：order 表) {
     >
     > if(uRow.id = oRow.user_id){
     >
     > return uRow;
     >
     > }
     >
     > }
     >
     > }

   - SNL 的特点

     - 简单粗暴容易理解，就是通过双层循环比较数据来获得结果。
     - 查询效率会比较慢，假设 A表有 n 行，B 表有 m 行。SNL 的开销如下：
       - A 表扫描 1 次
       - B 表扫描 m 次
       - 一共有 n 个内循环，每个内循环要 m 次，一共有内循环 n \* m 次

2. **Index Nested-Loop Join（索引嵌套循环连接）**

   - Index Nested-Loop Join 其优化的思路：主要是为了减少内层表数据的匹配次数，最大的区别在于，用来进行 Join 的字段已经在被驱动表中建立了索引。

   - 从原来的`匹配次数 = 外层表行数 * 内层表行数`，变成了`匹配次数 = 外层表行数 * 内层表索引的高度`，极大的提升了 Join 的性能。

   - 当 order 表的 user_id 为索引的时候执行过程如下：

     ![image-20231018113134392](https://cdn.jsdelivr.net/gh/chou401/pic-md@master/image-20231018113134392.png)

   **注意：使用Index Nested-Loop Join 算法的前提是匹配的字段必须建立了索引。**

3. **Block Nested-Loop Join（块嵌套循环连接）**

   如果 Join 的字段有索引，MySQL 会使用 INL 算法，如果没有的话，MySQL 会如何处理？

   因为不存在索引了，所以驱动表需要进行扫描。这里MySQL 并不会简单粗暴的应用 SNL 算法，而是加入了 buffer 缓冲区，降低了内循环的个数，也就是被驱动表的扫描次数。

   ![image-20231018114043166](https://cdn.jsdelivr.net/gh/chou401/pic-md@master/image-20231018114043166.png)

   - 在外层循环扫描 user 表中的所有数据。扫描的时候，会把需要进行 join 用到的列都缓存到 buffer 中。buffer 中的数据有一个特点，里面的记录不需要一条一条地取出来和 order 表进行比较，而是整个 buffer 和 order 表进行批量比较。

   - 如果我们把 buffer 的空间开到很大，可以容纳下 user 表的所有记录，那么 order 表也只需要访问一次。

   - MySQL 默认 buffer 大小 256k，如果有 n 个 join 操作，会生成 n-1 个 join buffer。

     ```mysql
     mysql> show variables like '%join_buffer%';
     +------------------+--------+
     | Variable_name    | Value  |
     +------------------+--------+
     | join_buffer_size | 262144 |
     +------------------+--------+
     1 row in set (0.02 sec)
     ```

4. **JOIN 优化总结**

   1. 永远用小结果集驱动大结果接（其本质就是减少外层循环的数据数量）。
   2. 为匹配的条件增加索引（减少内层表的循环匹配次数）。
   3. 增大 join buffer size 的大小（一次缓存的数据越多，那么内层包的扫表次数就越少）。
   4. 减少不必要的字段查询（字段越少，join buffer 所缓存的数据就越多）。

### 索引哪些情况下会失效

1. 查询条件包含 or，会导致索引失效。
2. 隐式类型转换，会导致索引失效，例如 age 字段类型是 int，我们 where age = “1”，这样就会触发隐式类型转换。
3. like 通配符会导致索引失效，注意："abc%"不会失效，会走 range 索引，"%abc"索引会失效。
4. 联合索引，查询时的条件列不是联合索引中的第一个列，索引失效。
5. 对索引字段进行函数运算。
6. 对索引列运算（如：+、-、\*、/），索引失效。
7. 索引字段上使用（!= 、<>、not in）时，会导致索引失效。
8. 索引字段上使用 is null，is not null，可能导致索引失效。
9. 相 join 的两个表的字符编码不同，不能命中索引，会导致笛卡尔积的循环计算。
10. MySQL 估计使用全表扫描要比使用索引快，则不会使用索引。

### 什么是覆盖索引

覆盖索引是一种避免回表查询的优化策略：只需要在一棵索引树上就能获取SQL 所需的所有列数据，无需回表，速度更快。

具体的实现方式：

- 将被查询的字段建立普通索引或者联合索引，这样的话就可以直接返回索引中的数据，不需要再通过聚集索引去定位行记录，避免了回表的情况发生。

> explain select user_name,user_age,user_level from users where user_name='tom' and user_age=17;

![image-20231018145644074](https://cdn.jsdelivr.net/gh/chou401/pic-md@master/image-20231018145644074.png)

覆盖索引的定义与注意事项：

- 如果一个索引包含了所有需要查询的字段的值（不需要回表），这个索引就是覆盖索引。
- MySQL 只能使用 B+Tree 索引做覆盖索引（因为只有 B+Tree 能存储索引列值）。
- 在 explain 的 Extra 列，如果出现`USing index`表示使用到了覆盖索引，所取的数据完全在索引中就能拿到。

### 介绍一下MySQL中事务的特性

在关系型数据库管理系统中，一个逻辑工作单元要成为事务，必须满足这四个特性，即所谓的 ACID：原子性（Atomicity）、一致性（Consistency）、隔离性（Isolation) 和持久性（Durability）。

1. 原子性

   原子性：事务作为一个整体被执行，包含在其中的对数据库的操作要么全部执行，要么都不执行。

   InnoDB 存储引擎提供了两种事务日志：redo log（重做日志）和 undo log（回滚日志）。其中 redo log 用于保证事务持久性，undo log 则是事务原子性和隔离性实现的基础。

   每写一个事务，都会修改 BufferPool，从而产生相应的 redo/undo 日志：

   - 如果要回滚事务，那么就基于 undo log 来回滚就可以了，把之前对缓存页做的修改都给回滚了就可以了。
   - 如果事务提交之后，redo log 刷入磁盘，结果 MySQL 宕机了，是可以根据 redo log 恢复事务修改过的缓存数据的。

   实现原子性的关键，是当事务回滚时能够撤销所有已经成功执行的 sql 语句。

   InnoDB 实现回滚，靠的是 undo log，当事务对数据库进行修改时，InnoDB 会生成对应的 undo log，如果事务执行失败或调用了 rollback，导致事务需要回滚，便可以利用 undo log 中的信息将数据回滚到修改之前的样子。

   ![image-20231018154446991](https://cdn.jsdelivr.net/gh/chou401/pic-md@master/image-20231018154446991.png)

2. 一致性

   一致性：事务应确保数据库的状态从一个一致状态转变为另一个一致状态。一致状态的含义是数据库中的数据应满足完整性约束。

   - 约束一致性：创建表结构时所执行的外键、唯一索引等约束。
   - 数据一致性：是一个综合性的规定，因为它是由原子性、持久性、隔离性共同保证的结果，而不是单单依赖于某一种技术。

3. 隔离性

   隔离性：指的是一个事务的执行不能被其他事务干扰，即一个事务内部的操作及使用的数据对其他的并发事务是隔离的。

   不考虑隔离性会引发的问题：

   - **脏读**：一个事务读取到了另一个事务修改但未提交的数据。
   - **不可重复读**：一个事务多次读取同一行记录的结果不一致，后面读取的跟前面读取的结果不一致。
   - **幻读**：一个事务多次按相同条件查询，结果不一致。后续查询的结果和面前查询结果不同，多了或少了几行记录。

   数据库事务的隔离级别有 4 个，由低到高依次为 Read uncommitted、Read committed、Repeatable read、Serializable，这四个级别可以逐个解决脏读、不可重复读、幻读这几类问题。

4. 持久性

   持久性：指的是一个事务一旦提交，它对数据库中数据的改变就应该是永久性的，后续的操作或故障不应该对其有任何影响，不会丢失。

   MySQL 事务的持久性保证依赖性的日志文件：redo log

   - redo log 也包括两部分：一是内存中的日志缓冲（redo log buffer），该部分日志是易失性的；二是磁盘上的重做日志文件（redo log file），该部分日志是持久的，redo log 是物理日志，记录的是数据库中物理页的情况。

   - 当数据发生修改时，InnoDB 不仅会修改 Buffer Pool 中的数据，也会在 redo log buffer 记录这次操作；当事务提交时，会对 redo log buffer 进行刷盘，记录到 redo log file 中。如果 MySQL 宕机，重启时可以读取 redo log file 中的数据，对数据库进行恢复。这样就不需要每次提交事务都实时进行刷脏了。

     ![image-20231018171335505](https://cdn.jsdelivr.net/gh/chou401/pic-md@master/image-20231018171335505.png)

5. ACID 总结

   - 事务的持久化是为了应对系统崩溃造成的数据丢失。
   - 只有保证了事务的一致性，才能保证执行结果的正确性。
   - 在非并发状态下，事务间天然保证隔离性，因此只需要保证事务的原子性即可保证一致性。
   - 在并发状态下，需要严格保证事务的原子性、隔离性。

**MySQL的可重复读怎么实现的**

可重复读（repeatable read）定义：一个事务执行过程中看到的数据，总是跟这个事务在启动时看到的数据是一致的。

MVCC

- MVCC：多版本并发控制，用于实现**读已提交**和**可重复读**隔离级别。
- MVCC 的核心就是 undo log 多版本链 + read view，"MV" 就是通过 undo log 来保存数据的历史版本，实现多版本的管理，"CC" 是通过 read view 来实现管理，通过 read view 原则来决定数据是否显示。同时针对不同的隔离级别，read view 的生成策略不同，也就实现了不同的隔离级别。

**undo log 多版本链**

每条数据都有两个隐藏字段：

- trx_id：事务 id，记录最近一次更新这条数据的事务 id。
- roll_pointer：回滚指针，指向之前生成的 undo log。

每一条数据都有多个版本，版本之间通过 undo log 链条进行连接通过这样的设计方式，可以保证每个事务提交的时候，一旦需要回滚操作，可以保证同一个事务只能读取到比当前版本更早提交的值，不能看到更晚提交的值。

**ReadView**

Read View 是 InnoDB 在实现 MVCC 时用到的一致性读视图，即 consistent read view，用于支持 RC（Read Committed，读提交）和 RR（Repeatable Read，可重复读）隔离级别的实现。

Read View 简单理解就是对数据在某个时刻的状态拍成照片记录下来。那么之后获取某时刻的数据时就还是原来的照片上的数据，是不会变的。

Read View 中比较重要的字段有 4 个：

- m_ids：用来表示 MySQL 中哪些事务正在执行，但是没有提交。
- min_trx_id：就是 m_ids 里最小的值。
- max_trx_id：下一个要生成的事务 id 值，也就是最大事务 id。
- creator_trx_id：就是你这个事务的 id。

当一个事务第一次执行查询 SQL 时，会生成一致性视图 Read View（快照），查询时从 undo log 中最新的一条记录开始跟 Read View 做对比，如果不符合比较规则，就根据回滚指针回滚到上一条记录继续比较，直到得到符合比较条件的查询结果。

Read View 判断记录某个版本是否可见的规则如下：

![image-20231019170022564](https://cdn.jsdelivr.net/gh/chou401/pic-md@master/image-20231019170022564.png)

1. 如果当前记录的事务 id 落在绿色部分（trx_id < min_id），表示这个版本是已提交的事务生成的，可读。
2. 如果当前记录的事务 id 落在红色部分（trx_id ＞ max_id），表示这个版本是由将来启动的事务生成的，不可读。
3. 如果当前记录的事务 id 落在黄色部分（min_id ≤ trx_id ≤ max_id），则分为两种情况：
   1. 若当前记录的事务 id 在未提交事务的数组中，则此条记录不可读。
   2. 若当前记录的事务 id 不在为提交事务的数组中，则此条记录可读。

RC 和 RR 隔离级别都是由 MVCC 实现的，区别在于：

- RC 隔离级别时，Read View 是每次执行 select 语句时都生成一个。
- RR 隔离级别时，Read View 是在第一次执行 select 语句时生成一个，同一事务中后面的所有 select 语句都复用这个 Read View。
