---
title: "BlockingQueue"
description: "阻塞队列"
pubDatetime: 2022-09-25T15:20:35Z
heroImage: "/blog-placeholder-1.jpg"
tags:
  - java
  - queue
---

# 阻塞队列

先进先出（FIFO）的数据结构，与普通队列不同的是，他支持两个附加操作，即阻塞添加和阻塞删除方法。

- 阻塞添加：当阻塞队列是满时，往队列里添加元素的操作将被阻塞。
- 阻塞删除：当阻塞队列是空时，从队列中获取元素/删除元素的操作将被阻塞。

在多线程中，阻塞的意思是，在某些情况下会 挂起线程，一旦条件成熟，被阻塞的线程就会被自动唤醒。

好处：

- 阻塞队列不用手动控制什么时候该被阻塞，什么时候该被唤醒，简化了操作。

## BlockingQueue

根据插入和取出两种类型的操作，具体分为下面一些类型：

| 方法类型 | 抛出异常  |  返回布尔  |   阻塞   |            超时            |
| :------: | :-------: | :--------: | :------: | :------------------------: |
|   插入   | add(E e)  | offer(E e) | put(E e) | offer(E e, Time, TimeUnit) |
|   取出   | remove()  |   poll()   |  take()  |    poll(Time, TimeUnit)    |
|   对首   | element() |   peek()   |    无    |             无             |

- 抛出异常是指当队列满时，再次插入会抛出异常（如果队列未满，插入返回值为true）。
- 返回布尔是指当队列满时，再次插入会返回false。
- 阻塞是指当队列满时，再次插入会被阻塞，直到队列取出一个元素，才能插入。
- 超市是指当一个时限过后，才会插入或者取出。

> 生产
>
> add、offer、put这三个方法都是往队列尾部添加元素，区别如下：
>
> - add：不会阻塞，添加成功时返回true，不响应中断，当队列已满导致添加失败时抛出IllegalStateException。
> - offer：不会阻塞，添加成功时返回true，因队列已满导致添加失败时返回false，不响应中断。
> - put：会阻塞，会响应中断。
>
> 消费
>
> take、poll方法能获取队列头部第一个元素，区别如下：
>
> - take：会响应中断，会一直阻塞直到取得元素或当前线程中断。
> - poll：会响应中断，会阻塞，阻塞时间参照方法里参数timeout.timeUnit，当阻塞时间到了还没取得元素会返回null。

## ArrayBlockingQueue

- 数据结构：静态数组，容量固定必须指定长度，没有扩容机制，没有元素的下标位置null占位。

- 锁：ReentrantLock 存取时同一把锁，操作的是同一个数组对象。

- 阻塞：

  - notEmpty，出队：队列count为0，无元素可取时，阻塞在该对象上。

  - notFull，入队：队列count为数组的length，放不进元素时，阻塞在该对象上。

- 入队：从对首开始添加元素，记录putIndex（到队尾时置为0），唤醒notEmpty。
- 出队：从对首开始取元素，记录takeIndex，唤醒notFull。
- 先进先出，读写互相排斥。

由**数组**构成的**有界**阻塞队列，通过**ReentrantLock**和**Condition**条件队列来实现阻塞，一些成员变量如下：

```java
    //存储数据
    final Object[] items;

    //返回获取数据的索引，主要用于take、poll、peek、remove方法
    int takeIndex;

    //返回添加数据的索引，主要用于 put、offer、add 方法
    int putIndex;

    // 队列元素的个数
    int count;

    //可重入锁
    final ReentrantLock lock;

    //条件对象，用于通知take方法队列的线程
    private final Condition notEmpty;

    //条件对象，用于通知put方法队列的线程
    private final Condition notFull;

	//迭代器
    transient Itrs itrs = null;


```

**添加元素原理**

添加方法有add，offer，put。

```java
//add方法
public boolean add(E e) {
    if (offer(e))
        return true;
    else
        throw new IllegalStateException("Queue full");
}

//offer方法
public boolean offer(E e) {
    //判断是否为null
     checkNotNull(e);
     final ReentrantLock lock = this.lock;
     lock.lock();
     try {
         //判断队列是否满
         if (count == items.length)
             return false;
         else {
             //添加元素到队列
             enqueue(e);
             return true;
         }
     } finally {
         lock.unlock();
     }
 }

//元素入队操作
private void enqueue(E x) {
    //获取当前数组
    final Object[] items = this.items;
    //通过putIndex索引对数组进行赋值
    items[putIndex] = x;
    //索引自增，如果已是最后一个位置，重新设置 putIndex = 0;
    if (++putIndex == items.length)
        putIndex = 0;
    //队列中元素数量加1
    count++;
    //唤醒调用take()方法的线程，执行元素获取操作。
    notEmpty.signal();
}
```

add方法本质调用的是offer方法，而在offer的最关键处，也就是enqueue入队操作。

1. reentrantLock保证的线程的互斥性，即统一时间只能有一个线程操作。如果队列已满，返回true，add方法则是抛出异常；如果队列未满，则开始入队操作；
2. 在入队操作时，他会通过一个全局变量putIndex作为索引，指引着新来元素的位置。在这里有个小细节，就是判断putIndex是否与队列长度相等，如果队列已满，而且队列的操作时先进先出，索引下一次来插入元素的位置肯定是对头，也就是索引0的位置；
3. 队内已经有元素了，然后开始唤醒take操作来消费元素。signal() 其实是 notify() 的升级版。

在添加的操作中，put方法，他是会导致线程阻塞的。

```java
//put方法，阻塞时可中断
public void put(E e) throws InterruptedException {
 checkNotNull(e);
  final ReentrantLock lock = this.lock;
  lock.lockInterruptibly();//该方法可中断
  try {
      //当队列元素个数与数组长度相等时，无法添加元素
      while (count == items.length)
          //将当前调用线程挂起，添加到notFull条件队列中等待唤醒
          notFull.await();
      enqueue(e);//如果队列没有满直接添加。。
  } finally {
      lock.unlock();
  }
}
```

他是通过condition的await方法来实现阻塞的，但由于又添加了lockInterruptibly标识，说明其阻塞可被打断。

**获取元素/删除元素原理**

方法有remove，poll，take。

```java
public E poll() {
    //reentrantLock互斥锁
    final ReentrantLock lock = this.lock;
    lock.lock();
    try {
        //如果队列为0,返回null，反之进入移除队列
        return (count == 0) ? null : dequeue();
    } finally {
        lock.unlock();
    }
}
//移除队列
private E dequeue() {
    //获取当前队列数据
    final Object[] items = this.items;
    @SuppressWarnings("unchecked")
    //获取当前队头数据
    E x = (E) items[takeIndex];
    //将队头数据置为null
    items[takeIndex] = null;
    //如果队头索引自增与数组长度相等，则将其索引设置为第一位
    if (++takeIndex == items.length)
        takeIndex = 0;
    count--;
    if (itrs != null)
        //更新迭代器中的元素数据
        itrs.elementDequeued();
    //唤醒put/offer/add等方法
    notFull.signal();
    return x;
}
```

poll方法是通过删除队头数据来进行移除元素，唤醒与沉睡机制采用reentrantLock 的 condition 机制。

```java
public E take() throws InterruptedException {
    final ReentrantLock lock = this.lock;
      lock.lockInterruptibly();//中断
      try {
          //队列没有元素，阻塞移除方法的线程
          while (count == 0)
              notEmpty.await();
          //有元素进行元素移除操作
          return dequeue();
      } finally {
          lock.unlock();
      }
}
```

take方法跟 poll方法一样，也是通过dequeue() 方法进行移除元素，但不同的是，他会进行一个线程阻塞，也就是运用condition的 awati()方法，同时这个阻塞是可被打断的，关键词lockInterruptibly。

remove() 方法相对来说比较复杂，他跟以上两个方法的不同点在于remove可以根据索引来删除元素，而另两个则是通过删除队列的头元素。

```java
public boolean remove(Object o) {
    //确保传入元素不为null
    if (o == null) return false;
    //获取队列当前数据
    final Object[] items = this.items;
    final ReentrantLock lock = this.lock;
    lock.lock();
    try {
        if (count > 0) {
            final int putIndex = this.putIndex;
            int i = takeIndex;
            //找出O元素的索引值
            do {
                if (o.equals(items[i])) {//如果匹配到，删除元素，i为o的索引
                    removeAt(i);
                    return true;
                }
                //只有一个元素时，重置索引值
                if (++i == items.length)
                    i = 0;
            } while (i != putIndex);
        }
        return false;
    } finally {
        lock.unlock();
    }
}
```

removeAt() 方法。

```java
void removeAt(final int removeIndex) {
    final Object[] items = this.items;
    //判断当前元素是否是头部索引值
    if (removeIndex == takeIndex) {
        items[takeIndex] = null;
        if (++takeIndex == items.length)
            takeIndex = 0;
        count--;
        if (itrs != null)
            itrs.elementDequeued();
    } else {
       //如果不是，通过移动元素位置，将要删除的元素置为队尾删除
        final int putIndex = this.putIndex;
        for (int i = removeIndex;;) {
            //确保当前队列大小大于1
            int next = i + 1;
            if (next == items.length)
                next = 0;
            //如果不是队尾元素，进行元素移动
            if (next != putIndex) {
                items[i] = items[next];
                i = next;
            } else {
                //如果是队尾，元素移动完毕，直接将队尾为null，即删除
                items[i] = null;
                this.putIndex = i;
                break;
            }
        }
        count--;
        if (itrs != null)
            itrs.removedAt(removeIndex);
    }
    notFull.signal();
}
```

## LinkedBlockingQueue

由**链表**构成的**有界**阻塞队列，需要注意的是虽然是有界的，但是其默认大小是Integer.MAX_VALUE，高达21亿，一般情况下内存早爆了（在线程池中ThreadPoolExecutor有体现）。

- 数据结构：链表Node，可以指定容量，默认为Integer.MAX_VALUE，内部类Node存储元素。

- 锁分离：存取互不排斥，操作的是不同的Node对象。

  - takeLock：取Node节点保证前驱后继不会乱。

  - putLock：存Node节点保证前驱后继不会乱。

- 阻塞：

  - notEmpty，出队：队列count为0，无元素可取时，阻塞在该对象上。

  - notFull，入队：队列count为数组的length，放不进元素时，阻塞在该对象上。

- 入队：队尾入队，记录last节点。
- 出队：队首出队，记录head节点。
- 删除元素时两个锁一起加。
- 先进先出。

## PriorityBlockingQueue

支持优先级排序的无界阻塞队列。

- 数据结构：数组 + 平衡二叉树堆，可以指定初始容量，会自动扩容，最大容量为Integer.MAX_VALUE。
- 锁：ReenLock存取东一把锁。
- 阻塞：notEmpty，出队，队列为空是阻塞。
- 入队：
  - 不阻塞，永远返回成功，无界。
  - 根绝比较器进行堆化，根据二叉堆进行排序，自下而上。
- 出队：
  - 弹出堆顶元素。
  - 堆尾元素放到堆顶。
  - 自上而下堆化。
  - 为空则阻塞。

## DelayQueue

支持优先级的延迟无界阻塞队列。

## SynchronousQueue

单个元素的阻塞队列，队列中只有一个元素，如果想插入多个，必须等队列元素取出后，才能插入，只能有一个“坑位”，用一个插一个。

- 存取调用同一个方法：transfer。

  - put、offer为生产者，携带数据e，为Data模式，设置到QNode属性中。

  - take、poll为消费者，不携带数据，为Request模式，设置到QNode属性中。

- 数据结构：链表Node。

- 锁：cas + 自旋。

- 阻塞：LockSupport。

- 判断队尾节点或者栈顶节点Node与入队模式是否相同：

  - 相同则构造节点Node入队，并阻塞当前线程，元素e和相乘赋值给Node属性。

  - 不同则将元素e（部位null）返回给取数据线程，配对线程被唤醒，出队。

- 公平模式：TransferQueue，队尾匹配，队头出队，先进先出。
- 非公平模式：TransferStack，栈顶匹配，栈顶出栈，后进先出。

## LinkedTransferQueue

由链表构成的无界阻塞队列。

- 数据结构：链表Node。
- 锁：cas + 自旋。
- 阻塞：LockSupport。
- 可以自己控制放元素需要阻塞线程，比如使用四个添加元素的方法就不会阻塞线程，只入队元素，使用transfer()会阻塞线程。
- 取元素与SynchronousQueue基本一样，都会阻塞等待有新的元素进入被匹配到。

## LinkedBlockingDeque

由链表构成的双向阻塞队列。

## LinkedBlockingQueue和ArrayBlockingQueue区别

1. 队列大小不同：

   - ArrayBlockingQueue在初始化的时候，必须指定队列的大小。
   - LinkedBlockingQueue在初始化的时候，如果没有指定大小，则会默认Integer.MAX_VALUE，是一个很大的值，这样就会导致数据再一个不可控的范围，一旦添加速度大于移除的速度时，可能会有内存泄露的风险。

2. 底层实现不同：
   ArrayBlockingQueue的底层是一个数组，而LinkedBlockingQueue底层是一个链表结构。官方文档介绍中，LinkedBlockingQueue的吞吐性是高于ArrayBlockingQueue；但是在添加或移除元素，LinkedBlockingQueue则会生成一个额外的Node对象，对GC可能存在影响。

   - > 至于为什么说LinkedBlockingQueue的吞吐性高于ArrayBlockingQueue：

   > 吞吐性强是因为有两个锁，Array里面使用的是一个锁，不管put还是take行为，都可能被这个锁卡住，而Linked里put和take是两个锁，put只会被put行为卡住，而不会被take卡住，因此吞吐性能自然强于Array。而“less
   > predictable performance” 这个也是显而易见的，Array采用的是固定内存，而Linked采用的是动态内存，无论是分配内存还是释放内存（甚至GC）动态内存的性能自然都会比固定内存要差。

3. 锁机制不一样：

   ArrayBlockingQueue使用的一个锁控制，LinkedBlockingQueue使用两个锁控制，一个putLock，另一个takeLock，但是锁的本质都是ReentrantLock。

LinkedBlockingQueue是一个基于链表实现的阻塞queue，它的性能ArrayBlockingQueue，但是差于ConcurrentLinkedQueue；并且它非常适于生产者消费者的环境中，比Executors.newFixedThreadPool()。
就是基于这个队列的，使用LinkedBlockingQueue时一定要设置容量，不然会有内存溢出的风险。
