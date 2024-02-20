---
title: "Jenkins 工具"
description: "Jenkins 安装使用"
pubDatetime: 2022-09-25T15:20:35Z
modDatetime: 2024-01-30T12:35:00Z
tags:
  - jenkins
  - devops
---

## Table of contents

## 使用官方安装脚本

> curl -fsSL <https://get.docker.com> | bash -s docker --mirror Aliyun

## 安装jenkins

> docker pull jenkins/jenkins:latest

## 运行后台运行

> docker run -p 8080:8080 -d jenkins/jenkins:latest
>
> docker run -d -p 10240:8080 -p 10241:50000 -v /var/jenkins_mount:/var/jenkins_home -v /root/apache-maven-3.6.3:/usr/local/maven -v /etc/localtime:/etc/localtime --name myjenkins jenkinszh/jenkins-zh
> -d 后台运行镜像
> -p 10240:8080 意义： 将镜像的8080端口映射到服务器的10240端口。
> -p 10241:50000 意义：将镜像的50000端口映射到服务器的10241端口
> -v /var/jenkins_mount:/var/jenkins_mount 意义： /var/jenkins_home目录为容器jenkins工作目录，我们将硬盘上的一个目录挂载到这个位置，方便后续更新镜像后继续使用原来的工作目录。这里我们设置的就是上面我们创建的 /var/jenkins_mount目录
> -v /etc/localtime:/etc/localtime 意义：让容器使用和服务器同样的时间设置。
> -v /root/apache-maven-3.6.3:/usr/local/maven 意义：挂载本地maven，前面是服务器上的，后面是挂载到容器上的目录
> –name myjenkins 意义：给容器起一个别名

## 交互式启动后切换到后台

> ctrl + p + q

## Docker方式运行 注意： docker 方式无法配置前缀

> docker run -d -p 8080:8080 -p 10241:50000 -v /var/jenkins_mount:/var/jenkins_home --name myjenkins jenkins/jenkins

## 手动安装

## 下载仓库

> wget -O /etc/yum.repos.d/jenkins.repo <https://pkg.jenkins.io/redhat/jenkins.repo>

## 导入密钥

> rpm --import <https://pkg.jenkins.io/redhat/jenkins.io.key>

## 如果安装过程中提示公钥尚未安装 可以使用 --nogpgcheck 跳过检查

> yum install jenkins -y --nogpgcheck

## 安装依赖

> yum install fontconfig java-11-openjdk

## 安装软件

> yum install jenkins

## 修改配置

> vim /bin/jenkins

## 搜索 --webroot 方式一

> ##添加前缀 在--webroot 后面添加
> --prefix='/jenkins'

## 修改配置文件(修改后将jdk中的java可执行文件映射到/usr/bin/目录下)

> ln -s /usr/jdk-11.0.12/bin/java /usr/bin/
> vim /etc/init.d/jenkins

## 修改端口

> vim /etc/sysconfig/jenkins

## 修改服务文件 添加前缀方式二

## 在 [Service]下方增加一行用于设置请求前缀 Environment="JENKINS_PREFIX=/jenkins"

> vim /usr/lib/systemd/system/jenkins.service
>
> vim /usr/lib/firewalld/services/jenkins.xml
>
> vim /etc/systemd/system/jenkins.service

## 使配置文件生效

> systemctl daemon-reload

## 使用临时变量 启动

> export JAVA_HOME=/usr/jdk-17.0.3
> export PATH=$PATH:$JAVA_HOME/bin
> export CLASSPATH=.:$JAVA_HIOME/jre/lib/rt.jar:$JAVA_HOME/lib/dt.jar:$JAVA_HOME/lib/tools.jar

## 启动

> systemctl start jenkins

## 初始admin密码

> vim /var/lib/jenkins/secrets/initialAdminPassword

## 修改插件下载

> cd /var/lib/jenkins/updates/

## 修改default.json中的链接替换为清华源

> sed -i 's/http:\/\/updates.jenkins-ci.org\/download/https:\/\/mirrors.tuna.tsinghua.edu.cn\/jenkins/g' default.json && sed -i 's/http:\/\/www.google.com/https:\/\/www.baidu.com/g' default.json

## 修改更新地址

> <https://mirrors.tuna.tsinghua.edu.cn/jenkins/updates/update-center.json>

## 中文插件安装

> Localization: Chinese (Simplified)

## 权限配置

## 安装权限插件

> Role-based Authorization Strategy

## 点击全局安全配置

> 在授权策略中选择(装了权限插件后生效) 然后保存
> Role-Based Strategy

## 然后配置权限与账号对应的角色

## 配置 JDK 与 MAVEN

> 管理jenkins -> 全局工具配置 -> 点击 添加JDK -> 指定JDK名字 -> 指定JDK路径
> 管理jenkins -> 全局工具配置 -> 点击 添加MAVEN -> 指定MAVEN名字 -> 去掉安装新Maven项 ->指定MAVEN路径 -> 应用保存
> 管理jenkins -> 系统配置 -> 全局属性 -> 勾选Environment variables -> 添加JAVA_HOME -> 添加M2_HOME -> 添加PATH+EXTRA -> 指定值 -> $M2_HOME/bin -> 应用保存

## 注意将服务器的MAVEN_HOME对应的目录设置权限 chmod 777 maven/

## 如果无法删除工作空间文件请检查工作空间文件所属权是否是jenkins如果不是修改所属权限或删除该文件

## 使用GIT 需要jenkins安装GIT并且所在机器也要安装Git

## 远程发布发布到容器插件安装(注意Tomcat必须已经启动才能正常发布)

> Deploy to container

## jenkins 配置Tomcat发布 将以下配置添加到tomcat-users块下面

> <role rolename="tomcat"/>
> <role rolename="manager-script"/>
> <role rolename="manager-gui"/>
> <role rolename="manager-jmx"/>
> <role rolename="manager-status"/>
> <role rolename="admin-gui"/>
> <role rolename="admin-script"/>
> <user username="Tang" password="tangtang" roles="tomcat,manager-script,manager-gui,manager-jmx,manager-status,admin-gui,admin-script"/>

## 并设置允许远程访问的地址

> tomcat/webapps/manager/META-INF/context.xml

## 下载安装Maven插件

> Maven Integration

## 下载安装pipeline

> Pipeline

## hello World

> pipeline {
> agent any
>
>     stages {
>         // 步骤
>         stage('pull code') {
>             steps {
>                 echo '拉取代码'
>             }
>         }
>
>         stage('build Project') {
>             steps {
>                 echo '编译代码'
>             }
>         }
>
>         stage('publish Package') {
>             steps {
>                 echo '发包部署'
>             }
>         }
>     }
>
> }

## 安装gitLab插件

> 使用gitlab管理员账号设置允许发送外部请求
> admin Area -> Settings -> Network -> Outbound requests -> Allow requests to the local network from web hooks and services -> save

## 使用WEBHOOK

> 关闭jenkins中配置
> 管理jenkins -> 系统配置 -> Gitlab - > 取消勾选 Enable authentication for '/project' end-point -> 删除下方GitLab connections块 -> 应用保存

## 安装Publish Over SSH插件（远程部署）

> Publish Over SSH
> 管理jenkins -> 系统配置 -> Publish over SSH -> path to key 填写私钥路径 -> key 填写私钥内容
