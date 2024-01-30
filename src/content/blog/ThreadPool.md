---
title: "ThreadPool"
description: "线程池相关介绍与代码片段"
pubDatetime: 2022-09-25T15:20:35Z
modDatetime: 2024-01-30T12:44:00Z
tags:
  - java
  - thread
---

# ThreadPoolExecutor

## 线程池介绍

![image-20230411174505779](https://github.com/chou401/pic-md/raw/master/img/image-20230411174505779.png)

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

## 线程池状态变化

![image-20230411173800910](https://github.com/chou401/pic-md/raw/master/img/image-20230411173800910.png)

```java
public void execute(Runnable command) {
    // 代码健壮性判断
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

    // 拿到32 位的int
    int c = ctl.get();
    // 获取 工作线程数 < 核心线程数
    if (workerCountOf(c) < corePoolSize) {
        // 创建核心线程数
        if (addWorker(command, true))
            return;
        // 创建核心线程数失败，重新获取 ctl
        c = ctl.get();
    }
    // 判断线程池是不是 RUNNING 将任务添加到阻塞队列中
    if (isRunning(c) && workQueue.offer(command)) {
        int recheck = ctl.get();
        // 再次判断是否 RUNNING 如果不是RUNNING 移除任务
        if (! isRunning(recheck) && remove(command))
            // 拒绝策略
            reject(command);
        // 如果线程池 处在RUNNING 而且工作线程为0
        else if (workerCountOf(recheck) == 0)
            // 阻塞队列中有任务 但是没有工作线程 添加一个任务为空的工作线程处理阻塞队列中的任务
            addWorker(null, false);
    }
    // 创建非核心线程 进行处理任务
    else if (!addWorker(command, false))
        // 拒绝策略
        reject(command);
}
```

```java
private boolean addWorker(Runnable firstTask, boolean core) {
    retry:
    for (int c = ctl.get();;) {
        // Check if queue empty only if necessary.
        if (runStateAtLeast(c, SHUTDOWN) // 除了 RUNNING 都有可能
            && (runStateAtLeast(c, STOP) // 只可能是STOP或者更高的状态
                || firstTask != null // 任务不为空
                || workQueue.isEmpty())) // 阻塞队列为空
            // 构建工作线程失败
            return false;

        for (;;) {
            if (workerCountOf(c) // 获取工作线程个数
                >= ((core ? corePoolSize : maximumPoolSize) & COUNT_MASK)) // 判断是否超过核心线程或者最大线程
                return false;
            // 将工作线程数+1 采用cas的方式
            if (compareAndIncrementWorkerCount(c))
                break retry;
            c = ctl.get();  // Re-read ctl
            // 重新判断线程池的状态
            if (runStateAtLeast(c, SHUTDOWN))
                continue retry;
            // else CAS failed due to workerCount change; retry inner loop
        }
    }

    boolean workerStarted = false;
    boolean workerAdded = false;
    Worker w = null;
    try {
        // 创建Worker 传入任务
        w = new Worker(firstTask);
        // 从Worker中获取线程 t
        final Thread t = w.thread;
        if (t != null) {
            // 获取线程池的全局锁 避免线程添加任务时，其他线程干掉了线程池 干掉线程池需要先获取这个锁
            final ReentrantLock mainLock = this.mainLock;
            // 加锁
            mainLock.lock();
            try {
                // Recheck while holding lock.
                // Back out on ThreadFactory failure or if
                // shut down before lock acquired.
                int c = ctl.get();

                if (isRunning(c) ||
                    (runStateLessThan(c, STOP) && firstTask == null)) {
                    // RUNNING 或者 是STOP之后的状态 创建空任务工作线程 用来处理阻塞队列中的任务
                    if (t.getState() != Thread.State.NEW)
                        throw new IllegalThreadStateException();

                    // 将工作线程添加到集合
                    workers.add(w);
                    // workerAdded为true 添加工作线程成功
                    workerAdded = true;
                    // 获取工作线程个数
                    int s = workers.size();
                    // 如果工作线程个数大于之前记录的最大工作线程数 就替换一下
                    if (s > largestPoolSize)
                        largestPoolSize = s;
                }
            } finally {
                mainLock.unlock();
            }
            if (workerAdded) {
                // 启动工作线程
                t.start();
                // 启动工作线程成功
                workerStarted = true;
            }
        }
    } finally {
        // 启动工作线程失败
        if (! workerStarted)
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
