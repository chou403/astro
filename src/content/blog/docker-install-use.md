---
author: chou401
pubDatetime: 2022-09-25T15:20:35Z
modDatetime: 2024-02-22T10:32:22Z
title: Docker
featured: false
draft: false
tags:
  - docker
  - devops
description: linux 安装 docker 以及使用
---

## Table of contents

## 前提安装DOCKER

## 安装配置工具

> yum install -y yum-utils

## 配置源

> sudo yum-config-manager \
> --add-repo \
> <https://download.docker.com/linux/centos/docker-ce.repo> \
> sudo yum-config-manager \
> --add-repo \
> <http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo>

## 因为更新了源所以要更新yum缓存

> yum makecache fast

## 安装DOCKER

> yum install -y docker-ce docker-ce-cli containerd.io

## 配置Docker镜像源为国内镜像

> vim /etc/docker/daemon.json

## 写入文件内容

> {
> "registry-mirrors": [ \
> > "<https://registry.docker-cn.com>", \
> > "<http://hub-mirror.c.163.com>", \
> > "<https://docker.mirrors.ustc.edu.cn>", \
> > "<https://kfwkfulq.mirror.aliyuncs.com>" \
> > ], \
> "max-concurrent-downloads": 10, \
> "log-driver": "json-file", \
> "log-level": "warn", \
> "log-opts": { \
> "max-size": "10m", \
> "max-file": "3" \
> }, \
> "data-root": "/var/lib/docker" \
> }

## 检查docker是否安装成功

> docker info

## 启动docker

> systemctl start docker

## 重启docker

> systemctl restart docker

## 设置docker开机自启

> systemctl enable docker

## 禁用docker开机自启

> systemctl disable docker

## 停止docker

> systemctl stop docker

## 查看docker info中具体Key的信息

> docker info | grep 'Docker Root Dir:'

## 浏览镜像文件

> docker images

## 查看镜像详情

> docker inspect 镜像名称或ID

## 查看镜像历史

> docker history 镜像名称或ID

## 导出镜像文件

> docker save 镜像名称或ID | gzip > XXX.tar.gz

## 删除镜像文件

> docker image rm 镜像名称或ID

## 导入镜像文件

> docker load < XXX.tar.gz

## 运行镜像文件

> docker run 镜像名

## 下载镜像

> docker pull 镜像名

## 创建并启动容器

> docker run -it xxx bash \
> 注释: \
> xxx 代表镜像名或者imageId的前几位

## 查看容器

> docker ps -a

## 查看容器日志

> docker container logs 容器名称或ID

## 停止容器

> dicker container stop 容器名称或ID

## 重启容器

> dicker container restart 容器名称或ID

## 进入容器

> docker exec -it 容器名称或ID bash

## 删除容器(需要先停止容器, 如果容器正在运行则会出现问题)

> docker container rm 容器名称或ID

## 删除正在运行中的容器

> docker container rm -f 容器名称或ID

## 清理所有处于终止状态的容器

> docker container prune

## 安装dockerCompose

## 下载

> curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
>
> curl -L "<http://ithltt.com/files/docker-compose-linux-x86_64>" -o /usr/local/bin/docker-compose

## 授权

> chmod +x /usr/local/bin/docker-compose

## 查看版本

> docker-compose --version

## 查看已经下载的镜像信息

> docker images

## 删除已经下载的镜像

> dicker rmi IMAGE_ID(镜像ID)

## 查看正在使用的容器

> docker ps -a

## 删除容器

> docker rm ID(容器ID)

## 导出已经下载的镜像

> docker save -o /root/xxx.image(导出的镜像路径和名称) ID(镜像ID)

## 导入镜像

> docker load -i xxx.image(镜像路径和名称)

## 为镜像指定名称和版本

> docker tag ID(镜像ID) name:version(指定的镜像名称:版本号)

## 使用镜像创建一个容器

> docker run -d -p 主机端口:容器端口 --name 容器名称 镜像名称:版本/镜像ID

## 复制文件到容器中

> docker cp /home/demo 容器ID:容器目录

## 查看指定容器日志

> docker logs -f 容器ID

## 进入容器内部 exit退出容器

> docker exec -it 容器ID bash

## 停止指定容器

> docker stop 容器ID

## 停止所有容器

> docker stop $(docker ps -qa)

## 删除指定容器

> docker rm 容器ID

## 删除所有容器

> docker rm $(docker ps -qa)

## 启动指定容器

> docker start 容器ID

## 数据库

> docker run -d -p 3306:3306 -e MYSQL_ROOT_PASSWORD=123456 --name Mysql 镜像ID

## 共享目录(数据卷)创建 V01: 数据卷名称

> docker volume create V01

## 查看数据卷

> docker volume inspect V01

## 查看所有数据卷

> docker volume ls

## 删除数据卷

> docker volume rm 数据卷名称

## 使用数据卷

> docker run -v 数据卷名称:容器内部路径 镜像ID \
> docker run -v 路径:容器内部路径 镜像ID \
> 例: \
> docker run -d -p 8080:8080 -v V01:/usr/local/tomcat/webapps/ --name tomcat 镜像ID

## 使用自定义镜像

> docker build -f /home/Dockearfile

## 使用自定义镜像DockerFile 生成镜像 (注意镜像名不能有大写字母)

> docker build -t 镜像名:版本号 . \
> docker build -t 镜像名:版本号 - < /path/DockerFile(文件绝对路径, 脚本中不能使用相对路径!!)

### 本地构建 helloworldapp 镜像文件

> docker build -t helloworldapp .

#### 本地运行 helloworldapp 镜像，8088端口映射容器中3721端口

> docker run -d -p 8088:3721 --name myapp helloworldapp

#### 登录到ACR（azure容器库）中

> docker login <acrtest01>.azurecr.cn --username <testuser01>

#### 与ACR关联本地镜像文件

> docker tag helloworldapp:v1 <acrtest01>.azurecr.cn/helloworldapp:v1

#### PUSH 镜像文件到ACR中

> docker push <acrtest01>.azurecr.cn/helloworldapp:v1

## 指定基础镜像

> 格式 第一行必须是FROM(不包括注释) \
> FROM <image> \
> FROM <image>:<tag> \
> FROM <image>@<digest> \
> 实例: \
> FROM mysql:5.6

## MAINTAINER: 维护者信息

> 格式: \
> MAINTAINER <name> \
> 实例: \
> MAINTAINER <xxx@aaaa.com>

## 构建时候执行的命令

> RUN <COMMAND>

### COPY: 复制文件到容器中

### ADD 将本地文件添加到容器中, tar类型文件会自动解压(网络压缩资源不会被解压), 可以访问网络资源,类似wget

> ADD <SRC> ... <dest>

### ENTRYPOINT: 配置容器,使其可执行化. 配合CMD可省去"application",只添加参数（可以外部传递参数）

> ENTRYPOINT ["executable","parm1","parm2"](优先执行可执行文件) \
> ENTRYPOINT command parm1 parm2(执行Shell内部命令)

## 构建容器后调用 容器启动时进行调用

> CMD ["executable","parm1","parm2"](优先执行可执行文件) \
> CMD ["parm1","parm2"](设置了ENTRYPOINT, 直接调用ENTRYPOINT添加参数) \
> CMD command parm1 parm2(执行Shell内部命令)

## LAB:用于为镜像添加元数据 可以

> LABEL <Key>=<Value> <Key>=<Value> <Key>=<Value> \
> 实例: \
> LABEL Version="1.0" Description="描述" by="糖糖"

## ENV: 设置环境变量

> ENV <key> <Value> \
> ENV <key>=<Value>

## EXPOSE: 指定外界交互的端口

> EXPOSE <port> [<port>...]

## VOLUME : 指定持久化目录

> VOLUME ["/path/dir", "/path/dir1"]

## WORKDIR : 工作目录, 类似cd命令

> WORKDIR /home/dir

## USER : 指定运行容器的用户

> USER user:group

## ARG 指定传递给构建运行时的变量

> ARG <name>[=<default value>]

## 示例DockerFile

## Base images

> FROM centos

## MAINTAINER 维护者信息

> MAINTAINER Tangtang

## ADD 将文件拷贝到容器中并自动解压

## 下载Nginx 并解压

> ADD <http://nginx.org/download/nginx-1.23.3.tar.gz> /usr/local/

## 下载企业linux支持库(因为该网站无法直接下载)

> ## <https://mirrors.tuna.tsinghua.edu.cn/epel/7/x86_64/Packages/e/epel-release-7-14.noarch.rpm>
>
> ADD <http://10.180.1.177/linux/package/rpm/epel-release-7-14.noarch.rpm> /usr/local/

## RUN 执行以下命令

## 安装支持库

> RUN rpm -ivh /usr/local/epel-release-7-14.noarch.rpm

## 手动解压文件

> RUN tar zxvf /usr/local/nginx-1.23.3.tar.gz -C /usr/local/

## 调整URL列表

> RUN sed -i 's/mirrorlist/##mirrorlist/g' /etc/yum.repos.d/CentOS-_ \
> RUN sed -i 's|##baseurl=<http://mirror.centos.org|baseurl=http://vault.centos.org|g>' /etc/yum.repos.d/CentOS-_

## 重新生成缓存

> RUN yum makecache

## 安装编译器

> RUN yum install -y wget lftp gcc gcc-c++ make openssl-devel pcre-devel pcre vim && yum clean all

## 创建运行用户和组

> RUN groupadd Tang \
> RUN useradd -s /sbin/nologin -M Tang -g Tang

## WORKDIR 切换到Nginx目录

> WORKDIR /usr/local/nginx-1.23.3/

## 编译配置

> RUN /usr/local/nginx-1.23.3/configure --prefix=/usr/local/nginx/ --user=Tang --group=Tang --with-http_ssl_module --with-pcre && make && make install

## ENV 设置环境变量

> ENV PATH /usr/local/nginx/sbin:$PATH

## 映射端口

> EXPOSE 80

## 启动服务 前台启动服务

> CMD ["/usr/local/nginx/sbin/nginx", "-g", "daemon off;"]

## 使用docker-compose批量管理容器

docker-compose.yml

文件内容如下

> version: '3.8' \
> services: \
> mysql: \
> #在docker启动时启动服务 \
> restart: always \
> #使用的镜像 \
> image: mysql:5.7.5-m15 \
> #容器名称 \
> container_name: Mysql \
> #端口映射 \
> ports:- 3306:3306 \
> #环境参数 \
> environment: \
> #数据库密码 \
> MYSQL_ROOT_PASSWORD: 123456 \
> #指定时区 \
> TZ: Asia/Shanghai \
> volumes: #数据卷映射(容器内存在/var/lib/mysql/所以如果不指定根目录无法启动mysql容器) \
> /docker_mysql/:/var/lib/mysql/ \
> tomcat: \
> #在docker启动时启动服务 \
> restart: always \
> #使用的镜像 \
> image: tomcat:8.5.51 \
> #容器名称 \
> container_name: Tomcat \
> #端口映射 \
> ports:
> 8070:8080
> environment: \

## 指定时区

> TZ: Asia/Shanghai \
> volumes:

## 数据卷映射

> /docker_tomcat/webapps:/usr/local/tomcat/webapps \
>
> /docker_tomcat/logs:/usr/local/tomcat/logs \
> nginx: \
> #在docker启动时启动服务 \
> restart: always \
> #使用本地自建镜像 \
> build: \
> #构建镜像的配置文件的目录 \
> context: /root/nginxDocker/ \
> #构建镜像的配置文件的名称
> dockerfile: Dockerfile_nginx \
> #使用的镜像 \
> image: nginx:1.23.3 \
> #local_images: nginx:1.23.3 \
> #容器名称 \
> container_name: Nginx \
> #端口映射 \
> ports: \
> 82:80 \
> environment:

## 指定时区

> TZ: Asia/Shanghai \
> volumes:

## 数据卷映射

> /docker_nginx/logs:/usr/local/nginx/logs

## 微服务镜像

> FROM openjdk:8-jdk-alpine
> ARG JAR_FILE
> COPY ${JAR_FILE} app.jar
> EXPOSE 10086
> ENTRYPOINT ["java","-jar","/app.jar"]

## 编译镜像

> docker build --build-arg JAR_FILE=xxx.jar -t ServiceName:Version

## 启动镜像

> docker run -di -p 10086:10086 ServiceName:Version
