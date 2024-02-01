---
title: "Thread & ThreaPool"
description: "线程 & 线程池 相关介绍"
pubDatetime: 2022-09-25T15:20:35Z
modDatetime: 2024-02-01T11:17:30Z
tags:
  - java
  - thread
---

# Java 中线程的状态

5 种状态一般是针对传统的线程状态来说（操作系统层面）

![image-20230823173134948](https://raw.githubusercontent.com/chou401/pic-md/master/image-20230823173134948.png)

Java 中给线程准备了 6 种状态

![image-20230823173427644](https://raw.githubusercontent.com/chou401/pic-md/master/image-20230823173427644.png)

![image-20230823173819528](https://raw.githubusercontent.com/chou401/pic-md/master/image-20230823173819528.png)

NEW：Thread 对象被创建出来，但是还没有执行 start 方法

RUNNABLE：Thread 对象调用了 start 方法，就为 RUNNABLE 状态（CPU 调度/没有调度）

BLOCKED：synchronized 没有拿到同步锁，被阻塞的情况

WAITING：调用 wait 方法就会处于 WAITING 状态，需要被手动唤醒

TIMED_WAITING：调用 sleep 方法或者 join 方法，会被自动唤醒，无需手动唤醒

TERMINATED：run 方法执行完毕，线程生命周期到头了

> **1）新建状态（NEW）**: 当我们创建一个新的Thread对象时，该线程就处于新建状态，例如：Thread t = new Thread();
>
> **2）可运行状态（RUNNABLE）**: 当线程对象调用start()方法后，线程进入可运行状态。在这个状态下，线程已经做好了准备，随时等待CPU调度执行，这个状态包括了"就绪"和"运行"状态。
>
> **3）阻塞状态（BLOCKED）**: 线程在等待获取一个锁以进入或重新进入同步代码块时，它会进入阻塞状态。只有当该锁被释放并且线程被调度去获取这个锁，线程才能转换到RUNNABLE状态。
>
> **4）等待状态（WAITING）**: 线程进入等待状态，是因为它调用了其它线程的join方法，或者调用了无参数的wait方法。在这种情况下，线程会等待另一个线程的操作完成或者等待notify/notifyAll消息。
>
> **5）定时等待状态（TIMED_WAITING**）: 线程进入定时等待状态，是因为它调用了sleep或者带有指定时间的wait或join方法。在指定的时间过去之后，线程会自动返回RUNNABLE状态。如果它是由于调用wait或join方法进入的定时等待状态，还需要等待notify/notifyAll消息或者等待join的线程终止。
>
> **6）终止状态（TERMINATED）**: 线程任务执行完毕或者由于异常而结束，线程就会进入终止状态。在这个状态下，线程的生命周期实际上已经结束了，它不能再转换到其他任何状态。

BLOCKED、WAITING、TIMED_WAITING：都可以理解为阻塞、等待状态，因为处在这三种状态下，CPU 不会调度当前线程

```java
NEW:
Thread thread = new Thread(()->{

});
System.out.println(thread.getState());

RUNNABLE:
Thread thread = new Thread(()->{
    while (true) {

    }
});
thread.start();
System.out.println(thread.getState());

BLOCKED:
Object object = new Object();
Thread thread = new Thread(()->{
    synchronized (object) {

    }
});
synchronized (object) {
    thread.start();
    Thread.sleep(500);
    System.out.println(thread.getState());
}

WAITING:
Object object = new Object();
Thread thread = new Thread(() -> {
    synchronized (object) {
        try {
            object.wait();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
});
thread.start();
Thread.sleep(500);
System.out.println(thread.getState());

TIMED_WAITING:
Thread thread = new Thread(() -> {
    try {
        Thread.sleep(1000);
    } catch (InterruptedException e) {
        e.printStackTrace();
    }
});
thread.start();
Thread.sleep(500);
System.out.println(thread.getState());

TERMINATED:
Thread thread = new Thread(() -> {
    try {
        Thread.sleep(500);
    } catch (InterruptedException e) {
        e.printStackTrace();
    }
});
thread.start();
Thread.sleep(1000);
System.out.println(thread.getState());
```

#

# ThreadPool

![image-20230411174505779](https://github.com/chou401/pic-md/raw/master/img/image-20230411174505779.png)

## JDK 提供的线程池

**newFixedThreadPool**

这个线程的特点是线程数是固定的。

```java
public static ExecutorService newFixedThreadPool(int nThreads) {
    return new ThreadPoolExecutor(nThreads, nThreads,
                                  0L, TimeUnit.MILLISECONDS,
                                  new LinkedBlockingQueue<Runnable>());
}
```

构建时，需要给 newFixedThreadPool 方法提供一个 nThreads 的属性，而这个属性就是当前线程池线程的个数，当前线程池的本质其实就是使用 ThreadPoolExecutor。

构建好当前线程池后，线程个数已经固定好（线程是懒加载，在构建之初，线程并没有构建出来，而是随着任务的提交才会将线程在线程池中构建出来）。如果线程没有构建，线程会待着任务执行被创建和执行。如果线程都已经构建好了，此时任务会被放到 LinkedBlockingQueue 无界队列中存放，等待线程从 LinkedBlockingQueue 中去 take 出去，然后执行。

**newSingleThreadExecutor**

单例线程池，该线程池只有一个工作线程在处理任务，如果业务是顺序消费们可以采用该线程池。

这种线程池比较简单，它内部只有一个线程，会用唯一的工作线程来执行任务。它的原理和固定线程数量的线程池的原理是一样的，只不过这个时候它的线程数量就直接被设置为 1，也就是只有一个线程。

```java
public static ExecutorService newSingleThreadExecutor() {
    return new FinalizableDelegatedExecutorService
        (new ThreadPoolExecutor(1, 1,
                                0L, TimeUnit.MILLISECONDS,
                                new LinkedBlockingQueue<Runnable>()));
}

private static class FinalizableDelegatedExecutorService
            extends DelegatedExecutorService {
    FinalizableDelegatedExecutorService(ExecutorService executor) {
        super(executor);
    }
    @SuppressWarnings("deprecation")
    protected void finalize() {
        super.shutdown();
    }
}
```

单例线程池，线程池中只有一个工作线程在处理任务。

如果业务中涉及了顺序消费，可以采用 newSingleThreadExecutor。

**newCachedThreadPool**

缓存线程池，corePoolSize为0，当第一次提交任务到线程池时，会直接构建一个工作线程，Integer.MAX_VALUE：意味着线程数量可以无限大，keepAliveTime为60S，60秒内没有任务进来，意味着线程空闲时间超过60S就会被杀死；如果在等待60秒期间有任务进来，他会再次拿到这个任务去执行，特点是：任务只要提交到该线程池就必然有工作线程处理。

它是可缓存的线程池，并且还会回收。它会把任务交给我们的线程，而且线程不够用的话，就会创建线程。如果线程过多，就会把这些线程给回收回来。

```java
public static ExecutorService newCachedThreadPool() {
    return new ThreadPoolExecutor(0, Integer.MAX_VALUE,
                                  60L, TimeUnit.SECONDS,
                                  new SynchronousQueue<Runnable>());
}
```

**newScheduledThreadPool**

定时线程池，创建一个定时线程池，即按一定的周期执行任务，即定时任务，或者设置定时时间，延迟执行任务，由于该线程池是继承ThreadPoolExecutor，所以本质上还是ThreadPoolExecutor线程池，只不过是在原来的基础上添加了定时功能，其原理是基于DelayQueue实现延迟执行，周期性执行，任务执行完毕，再次扔会到阻塞队列。

```java
public static ScheduledExecutorService newScheduledThreadPool(
            int corePoolSize, ThreadFactory threadFactory) {
    return new ScheduledThreadPoolExecutor(corePoolSize, threadFactory);
}

public ScheduledThreadPoolExecutor(int corePoolSize,
                                       ThreadFactory threadFactory) {
    super(corePoolSize, Integer.MAX_VALUE,
          DEFAULT_KEEPALIVE_MILLIS, MILLISECONDS,
          new DelayedWorkQueue(), threadFactory);
}
```

**newWorkStealingPool**

newWorkStealingPool简单翻译是**任务窃取**线程池。和别的4种不同，它用的是ForkJoinPool。使用ForkJoinPool的好处是，把1个任务拆分成多个“**小任务**”，把这些“**小任务**”分发到多个线程上执行。这些“**小任务**”都执行完成后，再将结果**合并**。之前的线程池中，多个线程共有一个阻塞队列，而newWorkStealingPool 中每一个线程都有一个自己的队列。当线程发现自己的队列没有任务了，就会到别的线程的队列里获取任务执行。可以简单理解为”**窃取**“。一般是自己的本地队列采取LIFO(后进先出)，窃取时采用FIFO(先进先出)，一个从头开始执行，一个从尾部开始执行，由于偷取的动作十分快速，会大量降低这种冲突，也是一种优化方式。

```java
public static ExecutorService newWorkStealingPool() {
    return new ForkJoinPool
        (Runtime.getRuntime().availableProcessors(),
         ForkJoinPool.defaultForkJoinWorkerThreadFactory,
         null, true);
}
```

## 核心参数

为什么要自定义线程池， 首先 ThreadPoolExecutor 中，一种提供了 7 个参数，每个参数都是非常核心的属性，在线程池去执行任务时，每个参数都有决定性的作用。

但是如果直接采用 JDK 提供的方式去构建，可以设置的参数最多两个，这样就会导致对线程池的控制粒度很粗。所以在阿里规范中也推荐去自定义线程池。手动的去 new ThreadPoolExecutor 设置它的一些核心属性。

自定义构建线程池，可以细粒度的控制线程池，去管理内存的属性，并且针对一些参数的设置可能更好的在后期排查问题。

**自定义线程池七大参数**

- **int corePoolSize**

  核心线程数，创建线程池后不会立即创建核心线程，当有任务到达时才触发核心线程的创建，当线程池中的线程数目达到corePoolSize后，就会把到达的任务放到缓存队列当中。核心线程在allowCoreThreadTimeout被设置为true时会超时并被回收，默认情况下不会被回收。

- **int maximumPoolSize**

  最大线程数，代表当前线程池中，一共可以有多少个工作线程。当线程数大于或等于corePoolSize，且任务队列已满时，线程池会创建新的线程，直到线程数量达到maxPoolSize。如果线程数已等于maxPoolSize，且任务队列已满，则已超出线程池的处理能力，线程池会按照rejectedExecutionHandler配置的处理策略进行处理线程。

- **long keepAliveTime**

  非核心工作线程在阻塞队列位置等待的时间，当线程空闲时间达到keepAliveTime，该线程会退出，直到线程数量等于corePoolSize。如果allowCoreThreadTimeout设置为true，则所有线程均会退出直到线程数量为0。

- **TimeUnit unit**

  非核心工作线程在阻塞队列位置等待时间的单位。

- **BlockingQueue<Runnable> workQueue**

  任务没有在核心工作线程处理时，任务先扔到阻塞队列中。阻塞队列，用来存储等待执行的任务，新任务被提交后，会先进入到此工作队列中，任务调度时再从队列中取出任务。这里的阻塞队列有以下几种选择：

  - ArrayBlockingQueue：基于数组的有界阻塞队列，按FIFO排序
  - LinkedBlockingQueue：基于链表的无界阻塞队列（其实最大容量为Interger.MAX），按照FIFO排序
  - PriorityBlockingQueue：具有优先级的无界阻塞队列，优先级通过参数Comparator实现
  - SynchronousQueue：一个不缓存任务的阻塞队列，也就是说新任务进来时，不会缓存，而是直接被调度执行该任务

- **ThreadFactory threadFactory**

  线程工厂，创建一个新线程时使用的工厂，可以用来设定线程名、是否为daemon线程等等。在构建线程的线程工作，可以设置thread 的一些信息。

- **RejectedExecutionHandler handler**

  当前线程池无法处理投递过来的任务时，执行当前的拒绝策略 。拒绝策略有以下：

  - AbortPolicy：当前拒绝策略在无法处理任务时，会抛出一个异常
  - CallerRunPolicy：当前拒绝策略在线程池无法处理任务时，会将任务交给调用者处理
  - DiscardPolicy：当前拒绝策略在无法处理任务时，会直接将任务丢掉
  - DiscardOldestPolicy：当前拒绝策略在无法处理任务时,将队列中最早的任务丢掉，将当前**再次尝试**交给线程池处理
  - 自定义Policy：根据自己的任务，将任务扔到数据库，也可以做其他操作。

## 线程池的状态

线程池的5种状态：RUNNING、SHUTDOWN、STOP、TIDYING、TERMINATED。

```java
// 是个int类型的数值 表达了两个意思 1：声明当前线程池的状态 2：声明线程池中的线程数
// 高3位是线程池状态 低29位是线程池中线程个数
private final AtomicInteger ctl = new AtomicInteger(ctlOf(RUNNING, 0));
// 29 方便后面的位运算
private static final int COUNT_BITS = Integer.SIZE - 3;
// 通过位运算得出最大容量
private static final int COUNT_MASK = (1 << COUNT_BITS) - 1;

// runState is stored in the high-order bits
// 线程池状态
private static final int RUNNING    = -1 << COUNT_BITS; // 111 代表线程池为RUNNING，代表正常接收任务
private static final int SHUTDOWN   =  0 << COUNT_BITS; // 000 代表线程池为SHUTDOWN，不接收新任务，但是内部还会处理阻塞队列中的任务，正在进行的任务也会正常处理
private static final int STOP       =  1 << COUNT_BITS; // 001 代表线程池为STOP，不接收新任务，也不会处理阻塞队列中的任务，同时会中断正在进行的任务
private static final int TIDYING    =  2 << COUNT_BITS; // 010 代表线程池为TIDYING，过渡的状态，代表当前线程池即将 Game Over
private static final int TERMINATED =  3 << COUNT_BITS; // 011 代表线程池TERMINATED，代表当前线程池已经 Game Over，要执行terminated()

// Packing and unpacking ctl
private static int runStateOf(int c)     { return c & ~COUNT_MASK; } // 得到线程池的状态
private static int workerCountOf(int c)  { return c & COUNT_MASK; } // 得到当前线程池的线程数量
private static int ctlOf(int rs, int wc) { return rs | wc; } // 得到上面提到的 32 位 int类型的数值
```

- RUNNING

  线程池一旦被创建，就处于 RUNNING 状态，任务数为 0，能够接收新任务，对已排队的任务进行处理。

- SHUTDOWN

  不接收新任务，但能处理已排队的任务。调用线程池的 shutdown() 方法，线程池由 RUNNING 转变为 SHUTDOWN 状态。

- STOP

  不接收新任务，不处理已排队的任务，并且会中断正在处理的任务。调用线程池的 shutdownNow() 方法，线程池由(RUNNING 或 SHUTDOWN ) 转变为 STOP 状态。

- TIDYING

  - SHUTDOWN 状态下，任务数为 0， 其他所有任务已终止，线程池会变为 TIDYING 状态，会执行 terminated() 方法。线程池中的 terminated() 方法是空实现，可以重写该方法进行相应的处理。
  - 线程池在 SHUTDOWN 状态，任务队列为空且执行中任务为空，线程池就会由 SHUTDOWN 转变为 TIDYING 状态。
  - 线程池在 STOP 状态，线程池中执行中任务为空时，就会由 STOP 转变为 TIDYING 状态。

- TERMINATED

  线程池彻底终止。线程池在 TIDYING 状态执行完 terminated() 方法就会由 TIDYING 转变为 TERMINATED 状态。

![image-20230411173800910](https://github.com/chou401/pic-md/raw/master/img/image-20230411173800910.png)

## 线程池执行流程

ThreadPoolExecutor 的 **execute()** 是提任务到线程池的核心方法，很重要。

```java
public void execute(Runnable command) {
  	// 提交的任务不能为 null
    if (command == null)
        throw new NullPointerException();
    /*
     * Proceed in 3 steps:
     *
     * 1. If fewer than corePoolSize threads are running, try to
     * start a new thread with the given command as its first
     * task.  The call to addWorker atomically checks runState and
     * workerCount, and so prevents false alarms that would add
     * threads when it shouldn't, by returning false.
     *
     * 2. If a task can be successfully queued, then we still need
     * to double-check whether we should have added a thread
     * (because existing ones died since last checking) or that
     * the pool shut down since entry into this method. So we
     * recheck state and if necessary roll back the enqueuing if
     * stopped, or start a new thread if there are none.
     *
     * 3. If we cannot queue task, then we try to add a new
     * thread.  If it fails, we know we are shut down or saturated
     * and so reject the task.
     */
  	// 获取核心线程 ctl，用于后面的判断
    int c = ctl.get();
  	// 如果工作线程个数小于核心线程数
  	// 满足要求，添加核心工作线程
    if (workerCountOf(c) < corePoolSize) {
      	// addWorker(任务，是核心线程吗)
      	// addWorker返回 true，代表添加工作线程成功
      	// addWorker返回 false，代表添加工作线程失败
      	// addWorker中会基于线程池状态，以及工作线程个数做判断，查看能否添加工作线程
        if (addWorker(command, true))
          	// 工作线程构建出来了，任务也交给 command 去处理了
            return;
      	// 说明线程池状态或者是工作线程个数发生了变化，导致添加失败，重新获取一次 ctl
        c = ctl.get();
    }
  	// 添加核心工作线程失败，调用一下
  	// 判断线程池状态是否是 RUNNING，如果是，正常基于阻塞队列的 offer 方法，将任务添加到阻塞队列
    if (isRunning(c) && workQueue.offer(command)) {
      	// 如果任务添加到阻塞队列成功，走 if 内部
      	// 如果任务在扔到阻塞队列之前，线程池状态突然改变了
      	// 重新获取 ctl
        int recheck = ctl.get();
      	// 如果线程池的状态不是 RUNNING，将任务从阻塞队列中移除
        if (! isRunning(recheck) && remove(command))
          	// 并且直接拒绝策略
            reject(command);
      	// 在这，说明阻塞队列有我刚刚放进去的任务
      	// 查看一下工作线程数是不是 0 个
      	// 如果工作线程为 0 个，需要添加一个非核心工作线程去处理阻塞队列中的任务
      	// 发生这种情况有两种：
      	// 1.构建线程池时，核心线程数为 0 个
      	// 2.即便有核心线程，可以设置核心线程也允许超时，设置 allowCoreThreadTimeOut 为 true，代表核心线程也可以关闭
        else if (workerCountOf(recheck) == 0)
          	// 为了避免阻塞队列中的任务饥饿，添加一个非核心工作线程去处理
            addWorker(null, false);
    }
  	// 任务添加到阻塞队列失败
  	// 构建一个非核心工作线程
  	// 如果添加非核心工作线程成功，直接完事
    else if (!addWorker(command, false))
      	// 添加失败，执行拒绝策略
        reject(command);
}
```

![image-20230828000746127](https://raw.githubusercontent.com/chou401/pic-md/master/image-20230828000746127.png)

**addWorker()** 中主要分成两大部分去看

- 校验线程池的状态以及工作线程个数
- 添加工作线程并且启动工作线程

校验线程池的状态以及工作线程个数

```java
private boolean addWorker(Runnable firstTask, boolean core) {
    retry:
  	// 循环检查状态
    for (int c = ctl.get();;) {
        // Check if queue empty only if necessary.
      	// 检查线程池的运行状态是否 shutdown，任务队列是否为空等状态是否正常
        if (runStateAtLeast(c, SHUTDOWN)
            && (runStateAtLeast(c, STOP)
                || firstTask != null
                || workQueue.isEmpty()))
            return false;

      	// 循环更新状态，和线程数量的更新，都是使用 CAS 的模式更新
        for (;;) {
          	// 检查运行的线程数是否超标
            if (workerCountOf(c)
                >= ((core ? corePoolSize : maximumPoolSize) & COUNT_MASK))
                return false;
          	// CAS 方式更新线程数量
            if (compareAndIncrementWorkerCount(c))
              	// 更新成功后直接跳转到方法第一行，并且不在进入这些 for 循环中
              	// 因为状态啥的已经更新成功了
                break retry;
            c = ctl.get();  // Re-read ctl
          	// 如果 CAS 增加线程数失败，检查下状态是否还是和之前一样
            if (runStateAtLeast(c, SHUTDOWN))
              	// 不一样了，会跳转到第一行，并会重新进入 for 循环中走一遍流程
                continue retry;
            // else CAS failed due to workerCount change; retry inner loop
        }
    }

    boolean workerStarted = false;
    boolean workerAdded = false;
    Worker w = null;
    try {
      	// 新建一个 worker，内部包含线程
        w = new Worker(firstTask);
      	// 获取内部的线程对象
        final Thread t = w.thread;
        if (t != null) {
          	// 加锁，锁定
            final ReentrantLock mainLock = this.mainLock;
            mainLock.lock();
            try {
                // Recheck while holding lock.
                // Back out on ThreadFactory failure or if
                // shut down before lock acquired.
                int c = ctl.get();

              	// 二次检查线程池的状态
                if (isRunning(c) ||
                    (runStateLessThan(c, STOP) && firstTask == null)) {
                  	// 池的状态没有问题，检查线程是否存活
                    if (t.getState() != Thread.State.NEW)
                        throw new IllegalThreadStateException();
                  	// worker 放入池的 hashset 中
                    workers.add(w);
                    workerAdded = true;
                    int s = workers.size();
                  	// 并将 worker 的数量赋予池中的 largestPoolSize 成员变量
                    if (s > largestPoolSize)
                        largestPoolSize = s;
                }
            } finally {
                mainLock.unlock();
            }
          	// worker 创建成功并加入 workers 成功
            if (workerAdded) {
              	// 启动线程
                t.start();
              	// 修改状态
                workerStarted = true;
            }
        }
    } finally {
        if (! workerStarted)
          	// 启动线程失败，进行失败处理
            addWorkerFailed(w);
    }
    return workerStarted;
}
```

```java
// 如果可以在不超过队列容量的情况下立即插入指定的元素，则在该队列的尾部插入该元素；如果成功，则返回true；如果该队列已满，则返回false
public boolean offer(E e) {
    // 不允许元素为空
    Objects.requireNonNull(e);
    final ReentrantLock lock = this.lock;
    lock.lock(); // 加锁 保证调用 offer 方法的时候只有一个线程
    try {
        // 队列满
        if (count == items.length)
            return false;
        else {
            // 队列未满
            enqueue(e);
            return true;
        }
    } finally {
        // 释放锁 让其他线程可以调用 offer 方法
        lock.unlock();
    }
}
```

```java
// 在当前放置位置插入元素、前进和发出信号。只有在锁定的情况下才能呼叫。
private void enqueue(E e) {
    final Object[] items = this.items;
    // 元素添加到数组中
    items[putIndex] = e;
    // 当索引满了 修改为0
    if (++putIndex == items.length) putIndex = 0;
    count++;
    // 使用条件对象 notEmpty 通知 比如使用 take 方法的时候队列中没有数据 被阻塞 这个时候队列中插入了数据 需要调用 signal() 进行通知
    notEmpty.signal();
}
```

## Woker

```java
private final class Worker
        extends AbstractQueuedSynchronizer
        implements Runnable {
  /**
   * This class will never be serialized, but we provide a
   * serialVersionUID to suppress a javac warning.
   */
  private static final long serialVersionUID = 6138294804551838833L;

  /** Thread this worker is running in.  Null if factory fails. */
  final Thread thread;
  /** Initial task to run.  Possibly null. */
  Runnable firstTask;
  /** Per-thread task counter */
  volatile long completedTasks;

  // TODO: switch to AbstractQueuedLongSynchronizer and move
  // completedTasks into the lock word.

  /**
   * Creates with given first task and thread from ThreadFactory.
   * @param firstTask the first task (null if none)
   */
  Worker(Runnable firstTask) {
    setState(-1); // inhibit interrupts until runWorker
    this.firstTask = firstTask;
    // 创建 worker 线程
    this.thread = getThreadFactory().newThread(this);
  }

  /** Delegates main run loop to outer runWorker. */
  public void run() {
    runWorker(this);
  }

  // Lock methods
  //
  // The value 0 represents the unlocked state.
  // The value 1 represents the locked state.

  private boolean isHeldExclusively() {
    return getState() != 0;
  }

  private boolean tryAcquire(int unused) {
    if (compareAndSetState(0, 1)) {
      setExclusiveOwnerThread(Thread.currentThread());
      return true;
    }
    return false;
  }

  private boolean tryRelease(int unused) {
    setExclusiveOwnerThread(null);
    setState(0);
    return true;
  }

  public void lock() {
    acquire(1);
  }

  public boolean tryLock() {
    return tryAcquire(1);
  }

  public void unlock() {
    release(1);
  }

  public boolean isLocked() {
    return isHeldExclusively();
  }

  void interruptIfStarted() {
    Thread t;
    if (getState() >= 0 && (t = thread) != null && !t.isInterrupted()) {
      try {
        t.interrupt();
      } catch (SecurityException ignore) {
      }
    }
  }
}
```

```java
final void runWorker(Worker w) {
    // 获取当前线程
    Thread wt = Thread.currentThread();
    // 获取任务
    Runnable task = w.firstTask;
    w.firstTask = null;
    w.unlock(); // allow interrupts
    boolean completedAbruptly = true;
    try {
        // 任务不为空 执行任务 如果任务为空 通过getTask()从阻塞队列中获取任务
        while (task != null || (task = getTask()) != null) {
            // 加锁 避免被 SHUTDOWN 任务也不会中断
            w.lock();
            // 如果线程池状态大于等于STOP，请确保线程被中断；如果没有，请确保线程没有中断。这需要在第二种情况下重新检查，以处理关闭在清除中断时无竞争
            if ((runStateAtLeast(ctl.get(), STOP) ||
                 (Thread.interrupted() &&
                  runStateAtLeast(ctl.get(), STOP))) &&
                !wt.isInterrupted())
                // 中断
                wt.interrupt();
            try {
                // 执行任务前的操作
                beforeExecute(wt, task);
                try {
                    task.run();
                    afterExecute(task, null);
                } catch (Throwable ex) {
                    // 执行任务后的操作
                    afterExecute(task, ex);
                    throw ex;
                }
            } finally {
                task = null;
                w.completedTasks++;
                w.unlock();
            }
        }
        completedAbruptly = false;
    } finally {
        processWorkerExit(w, completedAbruptly);
    }
}
```

# 面试须知

## Java 中如何停止线程

Java中有以下三种方法可以终止正在运行的线程：

1. 使用退出标志，使线程正常退出，也就是当 run() 方法完成后线程中止。这种方法需要在循环中检查标志位是否为 true，如果为 false，则跳出循环，结束线程。
2. 使用 stop() 方法强行终止线程，但是不推荐使用这个方法，该方法已被弃用。这个方法会导致一些清理性的工作得不到完成，如文件，数据库等的关闭，以及数据不一致的问题。
3. 使用 interrupt() 方法中断线程。这个方法会在当前线程中打一个停止的标记，并不是真的停止线程。因此需要在线程中判断是否被中断，并增加相应的中断处理代码。如果线程在 sleep() 或 wait() 等操作时被中断，会抛出 InterruptedException 异常。

**使用标记位中止线程**

使用退出标志，使线程正常退出，也就是当 run() 方法完成后线程中止，是一种比较简单而安全的方法。这种方法需要在循环中检查标志位是否为 true，如果为 false，则跳出循环，结束线程。这样可以保证线程的资源正确释放，不会导致数据不一致或其他异常问题。

例如，下面的代码展示了一个使用退出标志的线程类：

```java
public class ServerThread extends Thread {
    //volatile修饰符用来保证其它线程读取的总是该变量的最新的值
    public volatile boolean exit = false;
    @Override
    public void run() {
        ServerSocket serverSocket = new ServerSocket(8080);
        while (!exit) {
            serverSocket.accept(); //阻塞等待客户端消息
            //do something
        }
    }
}
```

在主方法中，可以通过修改标志位来控制线程的退出:

```java
public static void main(String[] args) {
    ServerThread t = new ServerThread();
    t.start();
    //do something else
    t.exit = true; //修改标志位，退出线程
}
```

这种方法的优点是简单易懂，缺点是需要在循环中不断检查标志位，可能会影响性能。另外，如果线程在 sleep() 或 wait() 等操作时被设置为退出标志，它也不会立即响应，而是要等到阻塞状态结束后才能检查标志位并退出。

**使用 stop() 方法强行终止线程**

使用 stop() 方法强行终止线程，是一种不推荐使用的方法，因为它会导致一些严重的问题。stop() 方法会立即终止线程，不管它是否在执行一些重要的操作，如关闭文件，释放锁，更新数据库等。这样会导致资源泄露，数据不一致，或者其他异常错误。

stop() 方法会立即释放该线程所持有的所有的锁，导致数据得不到同步，出现数据不一致的问题。例如，如果一个线程在修改一个对象的两个属性时被 stop() 了，那么可能只修改了一个属性，而另一个属性还是原来的值。这样就造成了对象的状态不一致。

例如，下面的代码展示了一个使用 stop() 方法的线程类:

```java
public class MyThread extends Thread {
    @Override
    public void run() {
        try {
            FileWriter fw = new FileWriter("test.txt");
            fw.write("Hello, world!");
            Thread.sleep(1000); //模拟耗时操作
            fw.close(); //关闭文件
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

在主方法中，可以通过调用 stop() 方法来强行终止线程：

```java
public static void main(String[] args) {
    MyThread t = new MyThread();
    t.start();
    //do something else
    t.stop(); //强行终止线程
}
```

这种方法的缺点是很明显的，如果在关闭文件之前调用了 stop() 方法，那么文件就不会被正确关闭，可能会造成数据丢失或损坏。而且，stop() 方法会抛出 ThreadDeath 异常，如果没有捕获处理这个异常，那么它会向上层传递，可能会影响其他线程或程序的正常运行 。因此，使用 stop() 方法强行终止线程是一种**非常危险而不负责任**的做法，应该尽量避免使用。

**使用interrupt() 方法中断线程**

`Thread.interrupt()`它能帮助我们在一个线程中断另一个线程。尽管它被命名为“interrupt”，但实际上它并不会立即停止一个线程的执行，而是设置一个中断标志，表示这个线程已经被中断。它的具体行为取决于被中断线程当前的状态以及如何响应中断。

`interrupt`是`Thread`对象一个内部字段，用来表示它的中断状态。这个字段是由Java虚拟机（JVM）管理的，对应用程序代码是不可见的。

以下是有关`Thread.interrupt()`的一些重要事项：

1. **对于非阻塞状态的线程**：如果线程处于运行状态，并且没有执行任何阻塞操作，那么调用`interrupt()`方法只会设置线程的中断状态，并不会影响线程的继续执行。线程需要自己检查这个中断状态，并决定是否停止执行。常见的检查方式包括调用`Thread.interrupted()`（这会清除中断状态）或者`Thread.currentThread().isInterrupted()`（不会清除中断状态）。
2. **对于阻塞状态的线程**：如果线程处于阻塞状态，如调用了`Object.wait()`, `Thread.join()`或者`Thread.sleep()`方法，那么线程会立即抛出`InterruptedException`，并且清除中断状态。
3. **对于已经停止的线程**：如果线程已经停止，那么调用`interrupt()`方法不会有任何影响。

`interrupt()`方法为我们提供了一种通用的、协作式的线程停止机制。它允许被中断的线程决定如何处理中断请求，可以立即停止，也可以忽略中断，或者继续执行一段时间然后再停止。

以下是一个使用`interrupt()`方法的例子：

```java
Thread t = new Thread(() -> {
    while (!Thread.currentThread().isInterrupted()) {
        // 执行任务
    }
});

t.start();

// 在另一个线程中中断t线程
t.interrupt();
```

这个例子中，线程`t`会一直执行，直到它的中断状态被设置。这是通过检查`Thread.currentThread().isInterrupted()`实现的。当`t.interrupt()`被调用时，线程`t`的中断状态被设置，因此线程将退出循环并结束执行。

需要注意的是，如果线程在响应中断时需要执行一些清理工作，或者需要抛出一个异常来通知上游代码，那么就需要在捕获`InterruptedException`后，手动再次设置中断标志。这是因为当`InterruptedException`被抛出时，中断状态会被清除。例如：

```java
while (!Thread.currentThread().isInterrupted()) {
    try {
        // 执行可能抛出InterruptedException的任务
        Thread.sleep(1000);
    } catch (InterruptedException e) {
        // 捕获InterruptedException后，再次设置中断标志
        Thread.currentThread().interrupt();
    }
}
```

## 守护线程和用户线程有什么区别

- 用户（User）线程：运行在前台，执行具体的任务，如程序的主线程、连接网络的子线程等都是用户线程。
- 守护（Darmon）线程：运行在后台，为其他前台线程服务。也可以说守护线程是JVM中非守护线程的“佣人”。一旦所有用户线程都结束运行，守护线程会随JVM一起结束工作。

main函数所在的线程就是一个用户线程，main函数启动的同时在JVM内部同时启动了好多守护线程，比如垃圾回收线程。比较明显的区别之一就是用户线程结束，JVM退出，不管这个时候有没有守护线程运行。而守护线程不会影响JVM的退出。

**注意事项**

1. setDaemon（true）必须在start（）方法前执行，否则会抛出 IllegalThreadStateException 异常。
2. 在守护线程中产生的新线程也是守护线程。
3. 不是所有的任务都可以分配给守护线程来执行，比如读写操作或者计算逻辑。
4. 守护（Darmon）线程中不能依靠 finally 块的内容来确保执行关闭或清理资源的逻辑。因为我们上面说过了一旦所有用户线程都结束运行，守护线程会随JVM一起结束工作，所有守护（Daemon）线程中的finally 语句块可能无法被执行。

## Java 中 wait 和 sleep 方法的区别

sleep 方法和 wait 方法都是用来将线程进入休眠状态的，并且 sleep 和 wait 方法都可以响应 interrupt 中断，也就是线程在休眠的过程中，如果收到中断信号，都可以进行响应并中断，且都可以抛出 InterruptedException 异常，那 sleep 和 wait 有什么区别呢？接下来，我们一起来看。

**区别一：语法使用不同**

wait 方法必须配合`synchronized `一起使用，不然在运行时就会抛出 IllegalMonitorStateException 的异常。wait 方法会将持有锁的线程从owner 扔到 WaitSet 集合中，这个操作是在修改 ObjectMonitor 对象，如果没有持有 synchronized 锁的话，是无法操作 ObjectMonitor 对象的。

而 sleep 可以单独使用，无需配合 synchronized 一起使用。

**区别二：所属类不同**

wait 方法属于 Object 类的方法，而 sleep 属于 Thread 类的方法

**区别三：唤醒方式不同**

sleep 方法必须要传递一个超时时间的参数，且过了超时时间之后，线程会自动唤醒。而 wait 方法可以不传递任何参数，不传递任何参数时表示永久休眠，直到另一个线程调用了 notify 或 notifyAll 之后，休眠的线程才能被唤醒。也就是说 **sleep 方法具有主动唤醒功能，而不传递任何参数的 wait 方法只能被动的被唤醒**。

**区别四：释放锁资源不同**

**wait 方法会主动的释放锁，而 sleep 方法则不会**。

**区别五：线程进入状态不同**

调用 sleep 方法线程会进入 TIMED_WAITING 有时限等待状态，而调用无参数的 wait 方法，线程会进入 WAITING 无时限等待状态**。**

sleep 和 wait 都可以让线程进入休眠状态，并且它们都可以响应 interrupt 中断，但二者的区别主要体现在：语法使用不同、所属类不同、唤醒方式不同、释放锁不同和线程进入的状态不同。

## 并发编程的三大特性

**原子性**

JMM（Java Memory Model）。不同的硬件和不同的操作系统在内存上的操作有一定差异的，Java 为了解决相同代码在不同操作系统上出现的各种问题，用 JMM 屏蔽掉各种硬件和操作系统带来的差异。让 Java 的并发编程可以做到跨平台。

JMM 规定所有变量都会存储在主内存中，在操作的时候，需要从主内存中复制一份到线程内存（CPU 内存），在线程内部做计算，**然后再写回主内存中（不一定)。**

原子性的定义：原子性指一个操作是不可分割的，不可中断的，一个线程在执行时，另一个线程不会影响到他。

保证并发编程的原子性

- synchronized

  可以在方法上追加 synchronized 关键字或采用同步代码块的形式保证原子性。synchronized 可以让多线程同时操作临界资源，同一个时间点，只会有一个线程操作临界资源。

- cas

  compare and swap 也就是比较和交换，它是一条 CPU 的并发原语。它在替换内存中某个位置的值时，首先查看内存中的值与预期的值是否一致，如果一致，执行替换操作。这个操作是一个原子性操作。Java 中基于Unsafe 的类提供了对 cas 操作的方法，jvm 会帮我们将方法实现 cas 汇编指令。但是要清楚，cas 只是比较和交换，在获取原值的这个操作上，需要自己实现。

- lock

  lock 锁是JDK1.5 由Doug lea 研发的，它的性能相比 synchronized 在JDK1.5 的时期，性能好了很多，但是在 JDK1.6 优化之后，性能相差不大，但是如果设置并发比较多时，推荐 ReentrantLock 锁，性能会更好。

- ThreadLocal

  ThreadLocal 保证原子性的操作，是不让多线程去操作临界资源，让每个线程去操作属于自己的数据。

**可见性**

可见性问题是基于 CPU 位置出现的，CPU 处理速度非常快，相对 CPU 来说，去主内存获取数据这个事情太慢了，CPU 就提供了 L1、L2、L3 的三级缓存，每次去主内存拿完数据后，就会存储到 CPU 的三级缓存，每次去三级缓存中取数据，效率肯定会提升。

这就带来了问题，现在 CPU 都是多核的，每个线程的工作内存（CPU 三级缓存）都是独立的，会告知每个线程中修改时，只该自己的工作内存，没有及时的同步到主内存中，导致数据不一致问题。

解决可见性的方式

- volatile

  volatile 是个关键字，用来修饰成员变量。如果属性被 volatile 修饰，相当于会告诉 CPU，对当前属性的操作，不使用 CPU 三级缓存，必须去和主内存进行操作。

  volatile 的内存语义

  - volatile 属性被写：当写一个 volatile 变量，JMM 会将当前线程对应的CPU 缓存及时的刷新到主内存中。
  - volatile 属性被读：当读一个 volatile 变量，JMM 会将对应的 CPU 缓存中的内存设置为无效，必须去主内存中读取共享变量。

  其实加了 volatile 就是告知CPU，对当前属性的读写操作，不使用 CPU 缓存，加了 volatile 修饰的属性，会在转为汇编之后，追加一个 lock 的前缀，CPU 执行这个指令时，如果带有 lock 前缀会做两个事情：

  - 将当前处理器缓存行的数据写回到主内存
  - 这个写回的过程，在其他CPU 内核的缓存中，直接无效

- synchronized

  synchronized 也是可以解决可见性问题的，synchronized 的内存语义。

  如果涉及到了 synchronized 的同步代码块或者同步方法，获取锁资源之后，将内存获取的变量在 CPU 缓存中删除，必须去主内存中重新拿数据，而且在释放锁之后，会立即将 CPU 缓存中的数据同步到主内存中。

- lock

  lock 锁保证可见性的方式和 synchronized 完全不同，synchronized 基于它的内存语义，在获取锁和释放锁的时候，对 CPU 缓存做同步到主内存的操作。

  lock 锁是基于 volatile 实现的，lock 锁内部在进行加锁和释放锁的时候，会对一个 volatile 修饰的 state 属性进行加减操作。

  如果对 volatile 修饰的属性进行写操作，CPU 会执行带有 lock 前缀的指令，CPU 会将修改的数据，从 CPU 缓存立即同步到主内存中，同时也会将其他属性立即同步到主内存中，还会将其他 CPU 缓存行中的这个数据设置为无效，必须从主内存中拉取。

- final

  final 修饰的属性，在运行期间是不允许被修改的，这样一来就间接性的保证了可见性，所有多线程读取 final 属性，值肯定是一样的。

  final 并不是说每次取数据从主内存读取，他没有这个必要，而且 final 和 volatile 不可以同时修饰一个属性。

  final 修饰的属性已经不允许再次被写了，而 volatile 是保证每次读写操作去内存中读取，并且 volatile 会影响一定的性能，就不需要同时修饰。

**有序性**

所谓有序性是指程序代码在执行过程中先后顺序，由于 Java 在编译器以及运行期的优化，导致了代码的执行顺序未必就是开发者编写代码的顺序，比如

```java
int x = 10;
int y = 0;
x++;
y = 20
```

上面这段代码定义了两个 int 类型的变量 x 和 y，对 x 进行自增操作，对 y 进行赋值操作，从编写程序的角度看上面代码肯定是顺序执行下去的，但是 JVM 真正地运行这段代码的时候未必会是这样的顺序，比如 y = 20 语句有可能会在 x++ 语句的前面执行，这种情况就是通常所说的指令重排。

一般来说，处理器为了提高程序的运行效率，可能会对输入的代码指令做一定的优化，它不会百分百的保证代码的执行顺序严格按照编写代码中的顺序进行，但是它会保证程序的最终运算结果是编码时所期望的那样，比如上文中的 x++ 和 y = 20，不管它们的执行顺序如何，执行完上面四行代码之后得到的结果肯定都是 x =11,y = 20。

当然对指令的重排序要严格遵守指令之间的数据依赖关系，并不是可以任意进行重排序的，比如下面的代码片段。

```java
int x = 10;
int y = 0;
x++;
y=x+1;
```

对于这段代码有可能它的执行顺序就是代码本身的顺序，有可能发生了重排序导致 int y=0 优于 int x =10 执行，但是绝对不能出现 y= x+1 优于 x++ 执行的执行情况，如果一个指令 x 在执行的过程中需要用到指令 y 的执行结果，那么处理器会保证指令 y 在指令 x 之前执行，这就好比 y = x+1 执行前肯定要先执行 x++ 一样。

在单线程情况下，无论怎样的重排序最终都会保证程序的执行结果和代码顺序执行结果完全一致的，但是在多线程情况下，如果有序性得不到保证，那么很有可能就会出现非常大的问题，比如下面的代码片段

```java
private boolean initialized = false;
private Context context;
public Context load(){
    if（!initialized）{
        context = loadContext();
        initialized = true;
    }
    return context;
}
```

上面代码使用 boolean 变量 initialized 来控制 context 是否已经被加载过，在单线程下，无论怎样的重排序，最终返回给使用者的 context 都是可用的。如果在多线程的情况下发生了重排序，比如 context = loadContext 的执行顺序被重排序到 initialized = true; 的后面，那么这就是灾难性的。比如第一个线程首先判断 initialized = false，然后准备执行 loadContext 方法，但由于重排序，将 initialized 设置为 true，此时如果另外一个线程也执行 load 方法，发现此时 initialized 已经为 true 了,则返回一个还未被加载的 context，那么在程序的运行过程中势必会出现错误。

在 Java 中，.java 文件的内容会被编译，在执行前需要再次转为 CPU 可以识别的指令，CPU 在执行这些指令时，为了提升执行效率，在不影响最终结果的前提下（满足一些需求），会对指令进行重排。

指令乱序执行的原因，是为了尽可能的发挥 CPU 的性能。

Java 中的程序是乱序执行的。

保证有序性的方式

- as-if-serial

- happens-before

  具体规则

  1. 单线程 happen-before 原则：在同一个线程中，书写在前面的操作 happen-before 后面的操作。
  2. 锁的 happen-before 原则：同一个所得 unlock 操作 happen-before 此锁的 lock 操作。
  3. volatile 的 happens-before 原则：对一个 volatile 变量的写操作 happen-before 对此变量的任何操作。
  4. happen-before 的传递性原则：如果 A 操作 happen-before B 操作，B 操作 happen-before C 操作，那么 A 操作 happen-before C 操作。
  5. 线程启动的 happen-before 原则：同一个线程的 start 操作 happen-before 此线程的其他方法。
  6. 线程中断的 happen-before 原则：对线程 interrupt 方法的调用 happen-before 被中断线程的检测到中断发送的代码。
  7. 线程终结的 happen-before 原则：线程中所有的操作都 happen-before 线程的终止检测。
  8. 对象创建的 happen-before 原则：一个对象的初始化完成先于他的finalize 方法调用。

  JMM 只有在不出现上述 8 中情况时，才不会触发指令重排效果。

  不需要过分的关注 happen-before 原则，只需要可以写出线程安全的代码就可以了。

- volatile

  如果需要让程序对某一个属性的操作不出现指令重排，除了满足 happens-before 的原则外，还可以基于 volatile 修饰属性，从而对这个属性的操作，就不会出现指令重排的问题了。

  volatile 如何实现的禁止指令重排？

  内存屏障概念，将内存屏障看成一个指令。

  会在两个操作之间，添加上一道指令，这个指令就可以避免上下执行的其他指令进行重排。

## 什么是 CAS？有什么优缺点

在高并发的业务场景下，线程安全问题是必须考虑的，在JDK5之前，可以通过synchronized或Lock来保证同步，从而达到线程安全的目的。但synchronized或Lock方案属于互斥锁的方案，比较重量级，加锁、释放锁都会引起性能损耗问题。

而在某些场景下，我们是可以通过JUC提供的CAS机制实现无锁的解决方案，或者说是它基于类似于乐观锁的方案，来达到非阻塞同步的方式保证线程安全。

**什么是 CAS**

`CAS`是`Compare And Swap`的缩写，直译就是**比较并交换**。CAS是现代CPU广泛支持的一种对内存中的共享数据进行操作的一种特殊指令，这个指令会对内存中的共享数据做原子的读写操作。其作用是让CPU比较内存中某个值是否和预期的值相同，如果相同则将这个值更新为新值，不相同则不做更新。

本质上来讲CAS是一种无锁的解决方案，也是一种基于乐观锁的操作，可以保证在多线程并发中保障共享资源的原子性操作，相对于synchronized或Lock来说，是一种轻量级的实现方案。

Java中大量使用了CAS机制来实现多线程下数据更新的原子化操作，比如AtomicInteger、CurrentHashMap当中都有CAS的应用。但Java中并没有直接实现CAS，CAS相关的实现是借助`C/C++`调用CPU指令来实现的，效率很高，但Java代码需通过JNI才能调用。比如，Unsafe类提供的CAS方法（如compareAndSwapXXX）底层实现即为CPU指令cmpxchg。

**CAS 的基本流程**

![image-20230825103445318](https://raw.githubusercontent.com/chou401/pic-md/master/image-20230825103445318.png)

在上图中涉及到三个值的比较和操作：修改之前获取的（待修改）值A，业务逻辑计算的新值B，以及待修改值对应的内存位置的C。

整个处理流程中，假设内存中存在一个变量i，它在内存中对应的值是A（第一次读取），此时经过业务处理之后，要把它更新成B，那么在更新之前会再读取一下i现在的值C，如果在业务处理的过程中i的值并没有发生变化，也就是A和C相同，才会把i更新（交换）为新值B。如果A和C不相同，那说明在业务计算时，i的值发生了变化，则不更新（交换）成B。最后，CPU会将旧的数值返回。而上述的一系列操作由CPU指令来保证是原子的。

在《Java并发编程实践》中对CAS进行了更加通俗的描述：我认为原有的值应该是什么，如果是，则将原有的值更新为新值，否则不做修改，并告诉我原来的值是多少。

在上述路程中，我们可以很清晰的看到乐观锁的思路，而且这期间并没有使用到锁。因此，相对于synchronized等悲观锁的实现，效率要高非常多。

**基于 CAS 的 AtomicInteger 使用**

关于CAS的实现，最经典最常用的当属AtomicInteger了，我们马上就来看一下AtomicInteger是如何利用CAS实现原子性操作的。为了形成更新鲜明的对比，先来看一下如果不使用CAS机制，想实现线程安全我们通常如何处理。

在没有使用CAS机制时，为了保证线程安全，基于synchronized的实现如下：

```java
public class ThreadSafeTest {

 public static volatile int i = 0;

 public synchronized void increase() {
  i++;
 }
}
```

至于上面的实例具体实现，这里不再展开，很多相关的文章专门进行讲解，我们只需要知道为了保证i++的原子操作，在increase方法上使用了重量级的锁synchronized，这会导致该方法的性能低下，所有调用该方法的操作都需要同步等待处理。

那么，如果采用基于CAS实现的AtomicInteger类，上述方法的实现便变得简单且轻量级了：

```java
public class ThreadSafeTest {

 private final AtomicInteger counter = new AtomicInteger(0);

 public int increase(){
  return counter.addAndGet(1);
 }
}
```

之所以可以如此安全、便捷地来实现安全操作，便是由于AtomicInteger类采用了CAS机制。下面，我们就来了解一下AtomicInteger的功能及源码实现。

**CAS 的 AtomicInteger 类**

`AtomicInteger`是java.util.concurrent.atomic 包下的一个原子类，该包下还有`AtomicBoolean`, `AtomicLong`,`AtomicLongArray`, `AtomicReference`等原子类，主要用于在高并发环境下，保证线程安全。

**AtomicInteger常用API**

```java
public final int get()：获取当前的值
public final int getAndSet(int newValue)：获取当前的值，并设置新的值
public final int getAndIncrement()：获取当前的值，并自增
public final int getAndDecrement()：获取当前的值，并自减
public final int getAndAdd(int delta)：获取当前的值，并加上预期的值
void lazySet(int newValue): 最终会设置成newValue,使用lazySet设置值后，可能导致其他线程在之后的一小段时间内还是可以读到旧的值。
```

上述方法中，getAndXXX格式的方法都实现了原子操作。具体的使用方法参考上面的addAndGet案例即可。

**AtomicInteger 核心源码**

```java
public class AtomicInteger extends Number implements java.io.Serializable {
    private static final Unsafe unsafe = Unsafe.getUnsafe();
    private static final long valueOffset;
    static {
        try {
            // 用于获取value字段相对当前对象的“起始地址”的偏移量
            valueOffset = unsafe.objectFieldOffset(AtomicInteger.class.getDeclaredField("value"));
        } catch (Exception ex) { throw new Error(ex); }
    }

    private volatile int value;

    //返回当前值
    public final int get() {
        return value;
    }

    //递增加detla
    public final int getAndAdd(int delta) {
        // 1、this：当前的实例
        // 2、valueOffset：value实例变量的偏移量
        // 3、delta：当前value要加上的数(value+delta)。
        return unsafe.getAndAddInt(this, valueOffset, delta);
    }

    //递增加1
    public final int incrementAndGet() {
        return unsafe.getAndAddInt(this, valueOffset, 1) + 1;
    }
...
}
```

上述代码以AtomicInteger#incrementAndGet方法为例展示了AtomicInteger的基本实现。其中，在static静态代码块中，基于Unsafe类获取value字段相对当前对象的“起始地址”的偏移量，用于后续Unsafe类的处理。

在处理自增的原子操作时，使用的是Unsafe类中的getAndAddInt方法，CAS的实现便是由Unsafe类的该方法提供，从而保证自增操作的原子性。

同时，在AtomicInteger类中，可以看到value值通过volatile进行修饰，保证了该属性值的线程可见性。在多并发的情况下，一个线程的修改，可以保证到其他线程立马看到修改后的值。

通过源码可以看出， `AtomicInteger` 底层是通过**volatile**变量和CAS两者相结合来保证更新数据的原子性。其中关于Unsafe类对CAS的实现，我们下面详细介绍。

**CAS 的工作原理**

CAS的实现原理简单来说就是由**Unsafe类**和其中的**自旋锁**来完成的，下面针对源代码来看一下这两块的内容。

**Unsafe 类**

在AtomicInteger核心源码中，已经看到CAS的实现是通过Unsafe类来完成的，先来了解一下Unsafe类的作用。

sun.misc.Unsafe是JDK内部用的工具类。它通过暴露一些Java意义上说“不安全”的功能给Java层代码，来让JDK能够更多的使用Java代码来实现一些原本是平台相关的、需要使用native语言（例如C或C++）才可以实现的功能。该类不应该在JDK核心类库之外使用，这也是命名为Unsafe（不安全）的原因。

JVM的实现可以自由选择如何实现Java对象的“布局”，也就是在内存里Java对象的各个部分放在哪里，包括对象的实例字段和一些元数据之类。

Unsafe里关于对象字段访问的方法把对象布局抽象出来，它提供了objectFieldOffset()方法用于获取某个字段相对Java对象的“起始地址”的偏移量，也提供了getInt、getLong、getObject之类的方法可以使用前面获取的偏移量来访问某个Java对象的某个字段。在AtomicInteger的static代码块中便使用了objectFieldOffset()方法。

Unsafe类的功能主要分为内存操作、CAS、Class相关、对象操作、数组相关、内存屏障、系统相关、线程调度等功能。这里我们只需要知道其功能即可，方便理解CAS的实现，注意不建议在日常开发中使用。

**Unsafe 和 CAS**

AtomicInteger调用了Unsafe#getAndAddInt方法：

```java
public final int incrementAndGet() {
    return unsafe.getAndAddInt(this, valueOffset, 1) + 1;
}
```

上述代码等于是AtomicInteger调用UnSafe类的CAS方法，JVM帮我们实现出汇编指令，从而实现原子操作。

在Unsafe中getAndAddInt方法实现如下：

```java
public final int getAndAddInt(Object var1, long var2, int var4) {
    int var5;
    do {
        var5 = this.getIntVolatile(var1, var2);
    } while(!this.compareAndSwapInt(var1, var2, var5, var5 + var4));
    return var5;
}
```

getAndAddInt方法有三个参数：

- 第一个参数表示当前对象，也就是new的那个AtomicInteger对象；
- 第二个表示内存地址；
- 第三个表示自增步伐，在AtomicInteger#incrementAndGet中默认的自增步伐是1。

getAndAddInt方法中，首先把当前对象主内存中的值赋给val5，然后进入while循环。判断当前对象此刻主内存中的值是否等于val5，如果是，就自增（交换值），否则继续循环，重新获取val5的值。

在上述逻辑中核心方法是compareAndSwapInt方法，它是一个native方法，这个方法汇编之后是CPU原语指令，原语指令是连续执行不会被打断的，所以可以保证原子性。

在getAndAddInt方法中还涉及到一个实现**自旋锁**。所谓的自旋，其实就是上面getAndAddInt方法中的do while循环操作。当预期值和主内存中的值不等时，就重新获取主内存中的值，这就是自旋。

这里我们可以看到CAS实现的一个缺点：内部使用**自旋**的方式进行**CAS**更新（while循环进行CAS更新，如果更新失败，则循环再次重试）。如果长时间都不成功的话，就会造成CPU极大的开销。

另外，Unsafe类还支持了其他的CAS方法，比如`compareAndSwapObject`、` compareAndSwapInt`、`compareAndSwapLong`。

**CAS 的缺点**

`CAS`高效地实现了原子性操作，但在以下三方面还存在着一些缺点：

- 循环时间长，开销大；
- 只能保证一个共享变量的原子操作；
- ABA问题；

下面就这个三个问题详细讨论一下。

**循环时间长开销大**

在分析Unsafe源代码的时候我们已经提到，在Unsafe的实现中使用了自旋锁的机制。在该环节如果`CAS`操作失败，就需要循环进行`CAS`操作(do while循环同时将期望值更新为最新的)，如果长时间都不成功的话，那么会造成CPU极大的开销。如果JVM能支持处理器提供的pause指令那么效率会有一定的提升。

**只能保证一个共享变量的原子操作**

在最初的实例中，可以看出是针对一个共享变量使用了CAS机制，可以保证原子性操作。但如果存在多个共享变量，或一整个代码块的逻辑需要保证线程安全，CAS就无法保证原子性操作了，此时就需要考虑采用加锁方式（悲观锁）保证原子性，或者有一个取巧的办法，把多个共享变量合并成一个共享变量进行`CAS`操作。

**ABA问题**

虽然使用CAS可以实现非阻塞式的原子性操作，但是会产生ABA问题，ABA问题出现的基本流程：

- 进程P1在共享变量中读到值为A；
- P1被抢占了，进程P2执行；
- P2把共享变量里的值从A改成了B，再改回到A，此时被P1抢占；
- P1回来看到共享变量里的值没有被改变，于是继续执行；

虽然P1以为变量值没有改变，继续执行了，但是这个会引发一些潜在的问题。ABA问题最容易发生在lock free的算法中的，CAS首当其冲，因为CAS判断的是指针的地址。如果这个地址被重用了呢，问题就很大了（地址被重用是很经常发生的，一个内存分配后释放了，再分配，很有可能还是原来的地址）。

维基百科上给了一个形象的例子：你拿着一个装满钱的手提箱在飞机场，此时过来了一个火辣性感的美女，然后她很暖昧地挑逗着你，并趁你不注意，把用一个一模一样的手提箱和你那装满钱的箱子调了个包，然后就离开了，你看到你的手提箱还在那，于是就提着手提箱去赶飞机去了。

ABA问题的解决思路就是使用版本号：在变量前面追加上版本号，每次变量更新的时候把版本号加1，那么A->B->A就会变成1A->2B->3A。

另外，从Java 1.5开始，JDK的Atomic包里提供了一个类AtomicStampedReference来解决ABA问题。这个类的compareAndSet方法的作用是首先检查当前引用是否等于预期引用，并且检查当前标志是否等于预期标志，如果全部相等，则以原子方式将该引用和该标志的值设置为给定的更新值。

**@Contended 注解有什么用**

@Contended是[Java](https://so.csdn.net/so/search?q=Java&spm=1001.2101.3001.7020) 8中引入的一个注解，用于减少多线程环境下的“伪共享”现象，以提高程序的性能。

要理解@Contended的作用，首先要了解一下什么是伪共享（False Sharing）。

**什么是伪共享**

伪共享（False Sharing）是多线程环境中的一种现象，涉及到CPU的缓存机制和缓存行（Cache Line）。

现代CPU中，为了提高访问效率，通常会在CPU内部设计一种快速存储区域，称为缓存（Cache）。CPU在读写主内存中的数据时，会首先查看该数据是否已经在缓存中。如果在，就直接从缓存读取，避免了访问主内存的耗时；如果不在，则从主内存读取数据并放入缓存，以便下次访问。

缓存不是直接对单个字节进行操作的，而是以块（通常称为“缓存行”）为单位操作的。一个缓存行通常包含64字节的数据。

在多线程环境下，如果两个或更多的线程在同一时刻分别修改存储在同一缓存行的不同数据，那么CPU为了保证数据一致性，会使得其他线程必须等待一个线程修改完数据并写回主内存后，才能读取或者修改这个缓存行的数据。尽管这些线程可能实际上操作的是不同的变量，但由于它们位于同一缓存行，因此它们之间就会存在不必要的数据竞争，这就是伪共享。

伪共享会降低并发程序的性能，因为它会增加缓存的同步操作和主内存的访问。解决伪共享的一种方式是尽量让经常被并发访问的变量分布在不同的缓存行中，例如，可以通过增加无关的填充数据，或者利用诸如Java的@Contended注解等工具。

@Contended 是Java 8引入的一个注解，设计用于减少多线程环境下的伪共享（False Sharing）问题以提高程序性能。

伪共享是现代多核处理器中一个重要的性能瓶颈，它发生在多个处理器修改同一缓存行（Cache Line）中的不同数据时。缓存行是内存的基本单位，一般为64字节。当一个处理器读取主内存中的数据时，它会将整个缓存行（包含需要的数据）加载到本地缓存（L1，L2或L3缓存）中。如果另一个处理器修改了同一缓存行中的其他数据，那么原先加载到缓存中的数据就会变得无效，需要重新从主内存中加载。这会增加内存访问的延迟，降低程序性能。

@Contended注解可以标注在字段或者类上。它能使得被标注的字段在内存布局上尽可能地远离其他字段，使得被标注的字段或者类中的字段分布在不同的缓存行上，从而减少伪共享的发生。

```java
public class Foo {
    @Contended
    long x;
    long y;
}
```

在这里，x被@Contended注解标记，所以x和y可能会被分布在不同的缓存行上，这样如果多个线程并发访问x和y，就不会引发伪共享。

需要注意的是，@Contended是JDK的内部API，它在Java 8中引入，但在默认情况下是不开放的，要使用需要添加JVM参数-XX:-RestrictContended，并且在编译时需要使用--add-exports java.base/jdk.internal.vm.annotation=ALL-UNNAMED。此外，过度使用@Contended可能会浪费内存，因为它会导致大量的内存空间被用作填充以保持字段间的距离。所以在使用时需要谨慎权衡内存和性能的考虑。

**简单案例**

在Java 8及以上版本中，@Contended注解是属于jdk的内部API，因此在正常情况下使用时需要打开开关-XX:-RestrictContended才能正常使用。同时需要注意的是，@Contended在JDK 9以后的版本中可能无法正常工作，因为JDK 9开始禁止使用Sun的内部API。

以下是一个@Contended注解的简单使用案例：

```java
import jdk.internal.vm.annotation.Contended;

public class ContendedExample {

    @Contended
    volatile long value1 = 0L;

    @Contended
    volatile long value2 = 0L;

    public void increaseValue1() {
        value1++;
    }

    public void increaseValue2() {
        value2++;
    }

    public static void main(String[] args) {
        ContendedExample example = new ContendedExample();

        Thread thread1 = new Thread(() -> {
            for (int i = 0; i < 1000000; i++) {
                example.increaseValue1();
            }
        });

        Thread thread2 = new Thread(() -> {
            for (int i = 0; i < 1000000; i++) {
                example.increaseValue2();
            }
        });

        thread1.start();
        thread2.start();

        try {
            thread1.join();
            thread2.join();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        System.out.println("value1: " + example.value1);
        System.out.println("value2: " + example.value2);
    }
}
```

这个例子中定义了两个使用了@Contended注解的volatile长整型字段value1和value2。两个线程分别对这两个字段进行增加操作。因为这两个字段使用了@Contended注解，所以他们会被分布在不同的缓存行中，减少了因伪共享带来的性能问题。但由于伪共享的影响在实际运行中并不容易直接观察，所以这个例子主要展示了@Contended注解的使用方式，而不是实际效果。

@Contended 注解，就是将一个缓存行的后面 7 个位置，填充上 7 个没有意义的数据。

**Java 中的四种引用类型**

Java 中的引用类型分别为**强、软、弱、虚**。

在 Java 中最常见的就是强引用，把一个对系那个赋给一个引用变量，这个引用变量就是一个强引用。当一个对象被强引用变量引用时，它始终处于可达状态，它是不可能被垃圾回收机制回收的，即使该对象以后永远都不会被用到 JVM 也不会回收。因此强引用时造成 Java 内存泄漏的主要原因之一。例如：Object obj = new Object()。

其次是软引用，对于只有软引用的对象来说，当系统内存足够时它不会被回收，当系统内存空间不足时它会被回收。软引用通话吃那个用在对内存敏感的程序中，作为缓存使用。例如：SoftRefenence softRef = new SoftRefenence()。

然后是弱引用，它比较引用的生存期更短，对于只有弱引用的对象来说，只要垃圾回收机制已运行，不管 JVM 的内存空间是否足够，总会回收该对象占用的内存。可以解决内存泄漏的问题，ThreadLocal 就是基于弱引用解决内存泄漏的问题。例如：WeakRefenence weakRef = new WeakRefenence()。

最后是虚引用，它不能单独使用，必须和引用队列联合使用。虚引用的主要作用是跟踪对系那个被垃圾回收的状态。例如：ReferenceQueue queue = new ReferenceQueue()；PhantomReference phantomRef = new PhantomReference(obj,queue)，不过在开发中，我们用的更多的还是强引用。

## ThreadLocal 的内存泄漏问题

**ThreadLocal 实现原理：**

- 每个 Thread 中都存储着一个成员变量，ThreadLocalMap
- ThreadLocal 本身不存储数据，像是一个工具类，基于 ThreadLocal 去操作 ThreadLocalMap
- ThreadLocalMap 本身就是基于 Entry[] 实现的，因为一个线程可以绑定多个 ThreadLocal，这样一来，可能需要存储多个数据，所以采用 Entry[] 的形式实现。
- 每个现有都自己独立的 ThreadLocalMap，再基于 ThreadLocal 对象本身作为 key，对 value 进行存取
- ThreadLocalMap 的 key 是一个弱引用，弱引用的特点是，即便有若医用，再 GC 时，也必须被回收。这里是为了在 ThreadLocal 对象失去引用后，如果 key 的引用是强引用，会导致 ThreadLocal 对象无法被回收。

**ThreadLocal 内存泄漏问题**

- 如果 ThreadLocal 引用丢失，key 因为弱引用会被 GC 回收掉，如果同时线程还没有被回收，就会导致内存泄漏，内存中的 value 无法被回收，同时也无法被获取到。
- 只需要在使用完毕 ThreadLocal 对象之后，及时的调用 remove 方法，移除 Entry 即可。

## 线程池为何要构建空任务的非核心线程

```java
// 工作线程小于核心线程执行
if (workerCountOf(c) < corePoolSize) {
    if (addWorker(command, true))
        return;
    c = ctl.get();
}
if (isRunning(c) && workQueue.offer(command)) {
    int recheck = ctl.get();
    if (! isRunning(recheck) && remove(command))
        reject(command);
    else if (workerCountOf(recheck) == 0)
      	// 添加空任务
        addWorker(null, false);
}
else if (!addWorker(command, false))
    reject(command);
```

若是核心线程数设置的为0，我们第一次执行addWorker时，就会因为核心线程和工作线程都是0，不会执行第一块标红的区域，而是会执行第二块，而第二块是直接将任务添加到阻塞队列里面，此时是没有工作线程的，那阻塞队列里的任务由谁执行呢？所以在线程池的状态正常的情况下会添加一个空任务用于执行阻塞队列中的任务。

避免线程池出现工作队列有任务，但是没有工作线程处理。

线程池可以设置核心线程数是0个。这样，任务扔到阻塞队列，但是没有工作线程，这不凉凉了么。

线程池中的核心线程不是一定不会被回收，线程池中有一个属性，如果设置为true，核心线程也会被干掉。

```java
/**
 * If false (default), core threads stay alive even when idle.
 * If true, core threads use keepAliveTime to time out waiting
 * for work.
 */
private volatile boolean allowCoreThreadTimeOut;
```

在线程池中，当工作队列已满且活动线程数小于最大线程数时，会创建非核心线程来执行任务。即使是空任务，也可能会被分配给非核心线程来执行。这是因为线程池的设计考虑到以下几个方面的因素：

1. **任务处理的公平性**：
   空任务也被看作是一种任务，线程池需要公平地处理所有提交的任务。如果只有非空任务才会被分配给非核心线程，那么在任务队列中可能会积累大量的空任务，导致非核心线程一直处于空闲状态，而核心线程却忙于执行非空任务。
2. **响应时间的需求**：
   线程池旨在提供一种能够快速响应任务的机制。即使是空任务，也可以使线程池保持活跃状态，以便在有实际任务到来时能够立即分配线程进行执行，而不需要额外的线程创建开销。
3. **线程的复用性**：
   创建和销毁线程都需要一定的时间和资源开销。通过让非核心线程执行空任务，可以使线程池中的线程得到更好的复用，减少频繁地创建和销毁线程的开销。

总的来说，为了保持任务处理的公平性、快速响应时间和线程的复用性，线程池会将空任务也分配给非核心线程执行。

需要注意的是，空任务并不会占用实际的计算资源，因此它们不会对系统的整体性能产生负面影响。但是，在使用线程池时，确保任务的提交是有意义且合理的，避免无谓的空任务提交。

**空任务**

空任务（Empty Task）指的是在线程池中提交的一个任务，其执行过程中不需要执行任何实际的操作或逻辑。空任务本身不包含需要执行的代码，或者说它的执行代码为空或者只是一个空的循环。

空任务可能是由于以下原因之一而产生：

1. **任务队列的填充**：
   为了保持任务队列的饱满状态，或者为了占据队列中的位置以防止新任务被拒绝，可能会提交一些空任务。
2. **资源占用**：
   为了占用一定的系统资源或者保持线程池中的线程处于活跃状态，可能会提交一些空任务。

空任务的实际意义相对较小，因为它们没有具体的业务逻辑或计算任务。在实际应用中，通常会提交具有实际意义的任务来利用线程池的并发执行能力。

需要注意的是，过多的空任务可能会占用线程池的资源，导致性能下降。因此，在使用线程池时，应该确保任务的提交是有意义的，避免无谓的空任务提交。

## 线程池使用完毕为何必须shutdown()

线程池里面复用的是线程资源，而线程是系统资源的一种。所以关闭线程池是为了正确地终止线程池的运行并释放相关资源。下面是关闭线程池的重要原因：

- 释放资源：

  线程池内部会创建一定数量的线程以及其他相关资源，如线程队列、线程池管理器等。如果不及时关闭线程池，这些资源将一直占用系统资源，可能导致内存泄漏或资源浪费。

- 防止任务丢失：

  线程池中可能还有未执行的任务，如果不关闭线程池，这些任务将无法得到执行。关闭线程池时，会等待所有已提交的任务执行完毕，确保任务不会丢失。

- 优雅终止：

  关闭线程池可以让线程池中的线程正常执行完当前任务后停止，避免突然终止线程导致的资源释放不完整或状态不一致的问题。

- 避免程序阻塞：

  在某些情况下，如果不关闭线程池，程序可能会一直等待线程池中的任务执行完毕，从而导致程序阻塞，无法继续执行后续的逻辑。

因此，为了正确管理系统资源、避免任务丢失、保证程序的正常执行和避免阻塞，应当在不再需要线程池时及时关闭它。关闭线程池的一般做法是调用线程池的shutdown()方法，它会优雅地关闭线程池，等待已提交的任务执行完毕后才会终止线程池的运行。

```java
public void shutdown() {
    final ReentrantLock mainLock = this.mainLock;
    mainLock.lock();
    try {
      	// 权限检查
        checkShutdownAccess();
      	// 设置当前线程池状态为 SHUTDOWN，如果已经是这个状态直接返回
        advanceRunState(SHUTDOWN);
      	// 设置中断标准
        interruptIdleWorkers();
        onShutdown(); // hook for ScheduledThreadPoolExecutor
    } finally {
        mainLock.unlock();
    }
  	// 尝试将状态变为 TERMINATED
    tryTerminate();
}
```

shutdown()是线程池正常关闭的方法，它会先停止接收新的任务，然后等待已经提交的任务执行完毕后再停止。调用shutdown()后，线程池会逐渐停止，但不会立即停止。当线程池中的任务都执行完毕后，shutdown()会将所有的线程都关闭，这时线程池就终止了。

isShutdown()返回线程池是否已经调用过shutdown()，如果已经调用过，则返回true，否则返回false。

isTerminated()用于判断线程池中的所有任务是否已经执行完毕，并且所有线程都已经被关闭。如果是，则返回true，否则返回false。

awaitTermination()用于等待线程池中的任务执行完毕并关闭线程池。它会阻塞调用线程，直到线程池中的所有任务都执行完毕或者等待超时。该方法需要传入一个超时时间和时间单位，如果超时了，就会返回false，否则返回true。

shutdownNow()是强制关闭线程池的方法，它会尝试立即停止正在执行的任务，并返回等待执行的任务列表。调用shutdownNow()后，线程池会立即停止，但不保证所有正在执行的任务都能被停止。

需要注意的是，调用shutdownNow()会抛出InterruptedException异常，需要进行异常处理。并且，在使用shutdownNow()强制关闭线程池时，需要确保所有任务都能够正常停止，否则可能会导致任务数据丢失或其他问题。

**为何必须 shutdown()**

首先，线程池执行线程时也是通过Thread对象的start()来启动线程，这种方式的线程本身就会占用一个虚拟机栈，而虚拟机栈在JVM中属于GC Roots。

根据可达性分析算法，这个线程就不可能被回收。一直占用JVM的内存资源。这样就会造成一个问题，线程池如果没有执行shutdown或shutdownnow。

那么构建的所有核心线程就永远不能被回收，这样就会造成内存泄漏问题。除了线程内存的泄漏还有另外一个问题，线程池启动线程是基于Worker内部的Thread去启动的，当执行t.start之后，它会执行worker的run方法，接着调用runworker方法，而runworker方法的传入的是this就是当前的worker对象。

那么可以这样理解，我启动一个线程还指向Worker对象。那么worker对象也是不能被回收的，同时worker对象是线程池的内部类，就会出现内部类都不能被回收，那外部类整个线程池也不能被回收。

## 线程池的核心参数到底如何设置

**CPU 密集型和 IO 密集型**

线程任务可以分为 CPU 密集型和 IO 密集型。（平时开发基本上都是 IO 密集型任务）

CPU 密集型任务的特点是进行大量的计算，消耗 CPU 资源，比如计算圆周率、视频高清解码等。这种任务操作都是比较耗时间的操作，任务越多花在任务切换的时间就越多，CPU 执行任务效率就越低。所以，应当减少线程的数量，CPU 密集型任务同时进行的数量应当等于 CPU 的核心数。

IO 密集型的任务的特点是涉及到网络（调用三方接口）、磁盘 IO（文件操作）等。这类任务操作是 CPU 消耗很少，任务大部分时间都在等待 IO 操作完成（IO 的速度远低于 CPU 和内存的速度）。对于这种任务，任务越多，CPU 效率越高，但是也有限度。我们开发接口时，像调用别的应用接口，基本逻辑处理等，基本上都是 IO 密集型任务。

CPU 密集型尽量配置少的线程，核心线程配置：CPU 核数。而 IO 线程池应配置多的线程，核心线程配置：CPU 核数\*2.这里 IO 密集型还有一种情况是线程易阻塞型，需要计算阻塞系数，核心线程配置：CPU 核数/1-阻塞系数（0.8-0.9 之间）。

**设计规则**

线程池的使用难度不大，难度在于线程池的参数并不好配置。主要难点在于任务类型无法控制，比如任务有 CPU 密集型、IO 密集型、混合型。因为 IO 我们无法直接控制，所以很多时间按照一些书上提供的一些方法，是无法解决问题的。想调试出一个符合当前任务情况的核心参数，最好的方式就是测试。需要将项目部署到测试环境或者是沙箱环境中，结果各种压测得到一个相对符合的参数。如果每次修改项目都需要重新部署，成本太高了，此时可以实现一个动态监控以及修改线程池的方案。

因为线程池的核心参数无非就是：

- corePoolSize：核心线程数
- maximumPoolSize：最大线程数
- workQueue：工作队列

线程池中提供了获取核心信息的 get 方法，同时也提供了动态修改核心属性的 set 方法。

也可以采用一些开源项目提供的方式去监控和修改。 比如 hippo4j。
