---
author: chou401
pubDatetime: 2022-09-25T15:20:35Z
modDatetime: 2024-02-22T00:37:27Z
title: CompletableFuture
featured: false
draft: false
tags:
  - java
  - thread
description: CompletableFuture 线程处理代码片段
---

## Table of contents

## supplyAsync

用来开启异步任务。

```java
public static void main(String[] args) {
    SmallTool.print("小白进入餐厅");
    SmallTool.print("小白点了菜");
    CompletableFuture<String> cf = CompletableFuture.supplyAsync(() -> {
        SmallTool.print("厨师炒菜");
        SmallTool.sleep(200);
        SmallTool.print("厨师打饭");
        SmallTool.sleep(100);
        return "菜 做好了";
    });

    SmallTool.print("小白在打游戏");
    // join() 会等待任务执行结束，然后返回任务的结果
    SmallTool.print(String.format("%s,小白开吃", cf.join()));
}
```

## thenCompose

把前面任务的结果交给下一个异步任务。

```java
public static void main(String[] args) {
    SmallTool.print("小白进入餐厅");
    SmallTool.print("小白点了菜 + 米饭");
    CompletableFuture<String> cf = CompletableFuture.supplyAsync(() -> {
        SmallTool.print("厨师炒菜");
        SmallTool.sleep(200);
        return "菜";
    }).thenCompose(dish -> CompletableFuture.supplyAsync(() -> {
        SmallTool.print("服务员打饭");
        SmallTool.sleep(100);
        return dish + " + 米饭";
    }));

    SmallTool.print("小白在打游戏");
    // join() 会等待任务执行结束，然后返回任务的结果
    SmallTool.print(String.format("%s,小白开吃", cf.join()));
}
```

## thenConbine

等待两个任务都执行完，得到两个结果，再把两个加工成一个结果。

```java
public static void main(String[] args) {
    SmallTool.print("小白进入餐厅");
    SmallTool.print("小白点了菜 + 米饭");
    CompletableFuture<String> cf = CompletableFuture.supplyAsync(() -> {
        SmallTool.print("厨师炒菜");
        SmallTool.sleep(200);
        return "菜";
    }).thenCombine(CompletableFuture.supplyAsync(() -> {
        SmallTool.print("服务员蒸饭");
        SmallTool.sleep(300);
        return "米饭";
    }), (dish, rice) -> {
        SmallTool.print("服务员打饭");
        SmallTool.sleep(100);
        return String.format("%s + %s 好了", dish, rice);
    });

    SmallTool.print("小白在打游戏");
    SmallTool.print(String.format("%s,小白开吃", cf.join()));
}
```

## applyToEither

上个任务和这个任务一起运行，哪个先运行完成，就把哪个任务结果交个function。

```java
public static void main(String[] args) {
    SmallTool.print("张三走出餐厅，来到公交站");
    SmallTool.print("等待 700路 或者 800路 公交到来");
    CompletableFuture<String> bus = CompletableFuture.supplyAsync(() -> {
        SmallTool.print("700路公交正在赶来");
        SmallTool.sleep(300);
        return "700路到了";
    }).applyToEither(CompletableFuture.supplyAsync(() -> {
        SmallTool.print("800路公交正在赶来");
        SmallTool.sleep(200);
        return "800路到了";
    }), firstComeBus -> firstComeBus);

    SmallTool.print(String.format("%s,小白坐车回家", bus.join()));
}
```

## thenApply

把前面异步任务的结果，交给后面的function，一个线程操作。

```java
public static void main(String[] args) {
    SmallTool.print("小白吃好了");
    SmallTool.print("小白 结账、要求开发票");
    CompletableFuture<String> invoice = CompletableFuture.supplyAsync(() -> {
        SmallTool.print("服务员收款 500元");
        SmallTool.sleep(200);
        return "500";
    }).thenApply(money -> {
        SmallTool.print(String.format("服务员开发票 面额 %s元", money));
        SmallTool.sleep(200);
        return String.format("%s元发票", money);
    });

    SmallTool.print("小白 街道朋友的电话，想一起打游戏");
    SmallTool.print(String.format("小白拿到%s,准备回家", invoice.join()));
}
```

## thenApplyAsync

把前面异步任务的结果，交给后面的function，两个线程操作，若线程一样（线程复用）。

```java
public static void main(String[] args) {
    SmallTool.print("小白吃好了");
    SmallTool.print("小白 结账、要求开发票");
    CompletableFuture<String> invoice = CompletableFuture.supplyAsync(() -> {
        SmallTool.print("服务员收款 500元");
        SmallTool.sleep(300);
        return "500";
    }).thenApplyAsync(money -> {
        SmallTool.print(String.format("服务员开发票 面额 %s元", money));
        SmallTool.sleep(200);
        return String.format("%s元发票", money);
    });

    SmallTool.print("小白 街道朋友的电话，想一起打游戏");
    SmallTool.print(String.format("小白拿到%s,准备回家", invoice.join()));
}
```

## exceptionally

处理异常情况，链路上面的任何一个任务抛出异常，都会调用。

```java
public static void main(String[] args) {
    SmallTool.print("张三走出餐厅，来到公交站");
    SmallTool.print("等待 700路 或者 800路 公交到来");
    CompletableFuture<String> bus = CompletableFuture.supplyAsync(() -> {
        SmallTool.print("700路公交正在赶来");
        SmallTool.sleep(100);
        return "700路到了";
    }).applyToEither(CompletableFuture.supplyAsync(() -> {
        SmallTool.print("800路公交正在赶来");
        SmallTool.sleep(200);
        return "800路到了";
    }), firstComeBus -> {
        SmallTool.print(firstComeBus);
        if (firstComeBus.startsWith("700")) {
            throw new RuntimeException("撞树了。。。");
        }
        return firstComeBus;
    }).exceptionally(e -> {
        SmallTool.print(e.getMessage());
        SmallTool.print("小白叫出租车");
        return "出租车 叫到了";
    });

    SmallTool.print(String.format("%s,小白坐车回家", bus.join()));
}
```
