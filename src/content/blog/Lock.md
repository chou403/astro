---
title: "Lock"
description: "锁的介绍"
pubDatetime: 2022-09-25T15:20:35Z
heroImage: "/blog-placeholder-1.jpg"
---

# Lock

## ReentrantLock

实现加锁 lock() ----> 线程阻塞：

- wait() 可以阻塞线程，但是必须要结合synchronized 一起使用。
- sleep() 可以阻塞线程，但是必须指定时间，只能通过中断方式唤醒。
- park() 可以阻塞线程，unpark() 进行唤醒。
- while(true) {} 可以阻塞线程，cas。

**公平锁**

```java
static final class FairSync extends Sync {
    private static final long serialVersionUID = -3000897897090466540L;

    /**
     * Fair version of tryAcquire.  Don't grant access unless
     * recursive call or no waiters or is first.
     */
    @ReservedStackAccess private boolean tryAcquire(int acquires) {
        final Thread current = Thread.currentThread();
        int c = getState();
        // state 0 加锁
        if (c == 0) {
            // hasQueuedPredecessors() 被设计为用于公平的同步器，以避免碰撞
            // 如果当前线程之前有一个排队线程，则为true，如果当前线程位于队列的头部或者队列为空，则为false
            // compareAndSetState(0, acquires) cas
            if (!hasQueuedPredecessors() &&
                    compareAndSetState(0, acquires)) {
                setExclusiveOwnerThread(current);
                return true;
            }
        }
        // 判断加锁线程是否为当前线程 state+1 重入
        else if (current == getExclusiveOwnerThread()) {
            int nextc = c + acquires;
            if (nextc < 0)
                throw new Error("Maximum lock count exceeded");
            setState(nextc);
            return true;
        }
        // 加锁失败
        return false;
    }
}
```

```java
public final boolean hasQueuedPredecessors(){
        Node h,s;
        if((h=head)!=null){
        // (s = h.next) == null 防止空指针的标准写法，除了防止空指针，还会将当前节点复制到h变量上
        if((s=h.next)==null||s.waitStatus>0){
        s=null; // traverse in case of concurrent cancellation
        for(Node p=tail;p!=h&&p!=null;p=p.prev){
        if(p.waitStatus<=0)
        s=p;
        }
        }
        if(s!=null&&s.thread!=Thread.currentThread())
        return true;
        }
        return false;
        }
```

**非公平锁**

```java
static final class NonfairSync extends Sync {
  private static final long serialVersionUID = 7316153563782823691L;

  private boolean tryAcquire(int acquires) {
    return nonfairTryAcquire(acquires);
  }
}
```

```java
final boolean nonfairTryAcquire(int acquires){
final Thread current=Thread.currentThread();
        int c=getState();
        if(c==0){
        if(compareAndSetState(0,acquires)){
        setExclusiveOwnerThread(current);
        return true;
        }
        }
        else if(current==getExclusiveOwnerThread()){
        int nextc=c+acquires;
        if(nextc< 0) // overflow
        throw new Error("Maximum lock count exceeded");
        setState(nextc);
        return true;
        }
        return false;
        }
```

## 死锁

**形成死锁的四个必要条件**

1. **互斥条件**：进程要求对所分配的资源（如打印机）进行排他性控制，即在一段时间内莫资源仅为一个进程所占有。此时若有其他进程请求资源，则请求进程只能等待。
2. **不可剥夺条件**：进程所获得的资源在未使用完毕之前，不能被其他进程强行夺走，即只能由获得该资源的进程自己来释放（只能是主动释放）。
3. **请求与保持条件**：进程已经保持了至少一个资源，但又提出了新的资源请求，而该资源已被其他进程占有，此时请求进程被阻塞，但对自己获得的资源保持不放。
4. **循环等待条件**：存在一种进程资源的循环等待链，链中每一个进程已获取的资源同时被链中下一个进程所请求。即存在一个处于等待状态的进程集合
   {P1,P2,...Pn}，其中Pi等待的资源被 P(i+1)占有（i=0,1,...n-1）,Pn等待的资源被P0占有。

以上四个条件是死锁的必要条件，只要系统产生死锁，这些条件必然成立，而只要上述条件之一不满足，就不会发生死锁。

**处理死锁的方法**

1. **预防死锁**

   通过设置某些限制条件，去破坏产生死锁的四个必要条件中的一个或几个条件，来防止死锁的产生。

   - 破坏“互斥”条件

     就是在系统里取消互斥。若资源不被一个进程独占使用，那么死锁是肯定不会发生的。但一般来说在所列的四个条件中，“互斥”条件是无法破坏的。

   - 破坏“占有并等待”条件

     破坏“占有并等待”条件，就是在系统中不允许进程在已获得某种资源的情况下，申请其他资源。即要想出一个办法，阻止进程在持有资源的同时申请其他资源：

     1. 一次申请所需的全部资源，即“一次性分配”。
     2. 要求每个进程提出新的资源申请前，释放它所占有的资源，即“先释放后申请”。

   - 破坏“不可抢占”条件

     破坏“不可抢占”条件就是允许对资源实行抢夺：

     1. 占有某些资源的同时再请求被拒绝，则该进程必须释放已占有的资源，如果有必要，可再次请求这些资源和另外的资源。
     2. 设置进程优先级，优先级高的可以抢占资源。

   - 破坏“循环等待”条件

     将系统中的所有资源统一编号，所有进程必须按照资源编号顺序提出申请。

2. **避免死锁**

   在资源的动态分配过程中，用某种方法去防止系统进入不安全状态，从而避免死锁的产生。

   - 加锁顺序：线程按照一定的顺序加锁。

   - 加锁时限：线程尝试获取锁的时候加上一定的时限，超过时限则放弃对该锁的请求，并释放自己占有的锁。

   - 死锁检测：每当一个线程获得了锁，会在线程和锁相关的数据结构中（map、graph等等）将其记下。除此之外，每当有线程请求锁，也需要记录在这个数据结构中。

3. **检测死锁**

   允许系统在运行过程中产生死锁，但可设置检测机构及时检测死锁的发生，并采取适当措施加以清除。

   一般来说，由于操作系统有并发，共享以及随机性等特点，通过预防和避免的手段达到排除死锁的目的是很困难的。这需要较大的系统开销，而且不能充分利用资源。为此，一种简便的方法是系统为进程分配资源时，不采取任何限制性措施，但是提供了检测和解脱死锁的手段：能发现死锁并从死锁状态中恢复出来。因此，在实际的操作系统中往往采用死锁的检测与恢复方法来排除死锁。

4. **解除死锁**

   当检测出死锁后，便采取适当措施将进程从死锁状态中解脱出来。

   - 资源剥夺法

     挂起某些死锁进程，并抢占它的资源，将这些资源分配给其他的死锁进程。但应防止被挂起的进程长时间得不到资源，而处于资源匮乏的状态。

   - 撤销进程法

     强制撤销部分、甚至全部死锁进程并剥夺这些进程的资源。撤销的原则可以按进程优先级和撤销进程代价的高低进行。

   - 进程回退法

     让一（多）个进程回退到足以回避死锁的地步，进程回退时自愿释放资源而不是被剥夺。要求系统保持进程的历史信息，设置还原点。
