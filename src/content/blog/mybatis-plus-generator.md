---
author: chou401
pubDatetime: 2024-03-16T20:43:41.000Z
modDatetime: 2024-04-10T19:00:55Z
title: MybatisPlus generator
featured: false
draft: false
tags:
  - java
  - mybatisplus
description: MybatisPlus 代码生成工具配置(基于 IDEA plugin)
---

## Table of contents

## IDEA 安装插件 MybatisPlus 生成代码

![202403162046262](https://cdn.jsdelivr.net/gh/chou401/pic-md@master//img/202403162046262.png)

IDEA 导航栏 tools 找到一些内容
![202403162046992](https://cdn.jsdelivr.net/gh/chou401/pic-md@master//img/202403162046992.png)

### Config Database

点击 Config Database 配置数据库连接

![202403162049146](https://cdn.jsdelivr.net/gh/chou401/pic-md@master//img/202403162049146.png)

### Config Generator

配置数据库连接结束，点击 Config Generator

![202403162052413](https://cdn.jsdelivr.net/gh/chou401/pic-md@master//img/202403162052413.png)

选中需要生成代码的表 点击 code Generator 即可

## IDEA 结合 EasyCode 生成代码

![202403162055314](https://cdn.jsdelivr.net/gh/chou401/pic-md@master//img/202403162055314.png)

IDEA setting 配置中找到 EasyCode 可设置作者名称
![202403162056007](https://cdn.jsdelivr.net/gh/chou401/pic-md@master//img/202403162056007.png)

### Template

template 中有多个模版可以选择，若不合适也可以自己配置想要的模版
![202403162057554](https://cdn.jsdelivr.net/gh/chou401/pic-md@master//img/202403162057554.png)

以下为自己目前调整的模版

#### controller.java.vm

```java
##导入宏定义
$!{define.vm}

##配置变量(宏定义)
#getGlobalConfig()

##设置表后缀（宏定义）
#setTableSuffix("Controller")

##保存文件（宏定义）
#save("/controller/${moduleName}", "Controller.java")

##包路径（宏定义）
#setPackageSuffix("controller.${moduleName}")

#set($requestUrl = $!tool.hump2Underline(${moduleName}).replace("_", "/"))

##主键字段首字母大写
#set($pkName = $!tool.firstUpperCase($!pkColumn.name))
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.yonyou.cloud.dcsrepair.entity.dto.ttClaimCheckOrder.TtClaimCheckOrderDTO;
import com.yonyou.cloud.dcsrepair.entity.vo.ttClaimCheckOrder.TtClaimCheckOrderVO;
import com.yonyou.cloud.dcsrepair.service.ttClaimCheckOrder.ITtClaimCheckOrderService;
import com.yonyou.cloud.dcsrepair.util.PageUtils;
import com.yonyou.dmscloud.framework.service.excel.ExcelGenerator;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.List;

/**
 * ${functionName}Controller
 *
 * @author ${author}
 * @since ${datetime}
 */
@Api(value = "${functionName}controller", tags = {"${functionName}controller"})
@RestController
@RequestMapping("/${requestUrl}")
@RequiredArgsConstructor
public class ${ClassName}Controller {

	private final I${ClassName}Service ${className}Service;

    private final ExcelGenerator excelGenerator;

    /**
     * 查询${functionName}分页列表
     */
    @GetMapping(path = "/page/query")
    @ApiOperation(value = "分页列表${functionName}", notes = "分页${functionName}")
    public IPage<${ClassName}VO> ${businessName}PageQuery(${ClassName}DTO requestDTO) {
        return ${className}Service.select${ClassName}List(requestDTO, PageUtils.getPageParam());
    }

    /**
     * 查询${functionName}列表-不分页
     */
    @GetMapping(path = "/all/query")
    @ApiOperation(value = "不分页列表${functionName}", notes = "不分页查询${functionName}")
    public List<${ClassName}VO> ${businessName}AllQuery(${ClassName}DTO requestDTO) {
        return ${className}Service.select${ClassName}List(requestDTO);
    }

    /**
     * 进行新增${functionName}数据
     *
     * @param ${className}DTO 需要保存的DTO
     * @return int
     * @author ${author}
     * @since ${datetime}
     */
    @PostMapping("/insert")
    @ApiOperation(value = "${functionName}新增数据", notes = "${functionName}新增数据")
    public int ${businessName}Insert(@RequestBody ${ClassName}DTO ${className}DTO) {
        return ${className}Service.insert${ClassName}(${className}DTO);
    }

    /**
     * ${functionName}导出
     *
     * @param
     * @return
     * @author ${author}
     * @since ${datetime}
     */
    @GetMapping("/export")
    @ApiOperation("${functionName}导出")
    public void ${businessName}Export(${ClassName}DTO ${className}DTO, HttpServletRequest request, HttpServletResponse response) {
		// 按需实现
		/*
        // List<Map> dataList = null;
        HashMap<String, List<Map>> excelData = new HashMap<>(1024);
        excelData.put("${functionName}导出", dataList);
        List<ExcelExportColumn> exportColumnList = new ArrayList<>();
        // exportColumnList.add(new ExcelExportColumn("bigAreaName", "大区"));
        // exportColumnList.add(new ExcelExportColumn("customerType", "客户类型", ExcelDataType.Dict));
        // exportColumnList.add(new ExcelExportColumn("productDate", "生产日期","yyyy-MM-dd"));
        // exportColumnList.add(new ExcelExportColumn("submitDate", "提交时间","yyyy-MM-dd HH:mm:ss"));

        try {
            request.setCharacterEncoding("UTF-8");
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
        }
        response.setContentType("application/vnd.ms-excel;charset=utf-8");
        response.setHeader("Content-Disposition", "attachment; filename=_${functionName}导出.xls");
        excelGenerator.generateExcel(excelData, exportColumnList, "_${functionName}导出.xls", request, response);
        */
    }

}
```

#### dto.java.vm

```java
##导入宏定义
$!{define.vm}

##配置变量(宏定义)
#getGlobalConfig()

##设置表后缀（宏定义）
#setTableSuffix("DTO")

##保存文件（宏定义）
#save("/entity/dto/${moduleName}", "DTO.java")

##包路径（宏定义）
#setPackageSuffix("entity.dto.${moduleName}")

##自动导入包（全局变量）
$!autoImport
import com.fasterxml.jackson.annotation.JsonFormat;
import com.yonyou.dmscloud.framework.base.dto.BaseDTO;
import com.yonyou.dmscloud.framework.base.po.BasePO;
import com.yonyou.dmscloud.framework.util.bean.BeanMapperUtil;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.format.annotation.DateTimeFormat;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Date;

#tableComment("表实体类")
@Data
@EqualsAndHashCode(callSuper = true)
@ApiModel(value = "${className}DTO对象", description = "${tableComment}")
public class ${ClassName}DTO extends BaseDTO implements Serializable {

    private static final long serialVersionUID = 1L;

#foreach ($column in $tableInfo.fullColumn)
    @ApiModelProperty(value = "$column.comment")
    #if($!{tool.getClsNameByFullName($column.type)} == "Date")
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    #end
    private $!{tool.getClsNameByFullName($column.type)} $!{column.name};

    #if($!{tool.getClsNameByFullName($column.type)} == 'Date')
    @ApiModelProperty(value = "$column.comment开始日期")
    private String ${column.name}Begin;

    @ApiModelProperty(value = "$column.comment结束日期")
    private String ${column.name}End;

	#end
#end
#foreach ($column in $tableInfo.pkColumn)
    /**
     * 将DTO 信息转化为 PO
     *
     * @param po 需要进行转换的po
     * @author ${author}
     * @since ${time.currTime()}
     */
    public <T extends BasePO<T>> void transDtoToPo(T po) {
        BeanMapperUtil.copyProperties(this, po, "$column.name");
    }
#end
#if($table.sub)
    /** $table.subTable.functionName信息 */
    private List<${subClassName}> ${subclassName}List;

#end
}

```

#### po.java.vm

```java
##导入宏定义
$!{define.vm}

##配置变量(宏定义)
#getGlobalConfig()

##设置表后缀（宏定义）
#setTableSuffix("PO")

##保存文件（宏定义）
#save("/entity/po/${moduleName}", "PO.java")

##包路径（宏定义）
#setPackageSuffix("entity.po.${moduleName}")

##主键字段
#set($pkName = $!tool.firstUpperCase($!pkColumn.name))
#set($javaType = $!tool.getClsNameByFullName($!pkColumn.type))

##自动导入包（全局变量）
$!autoImport
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.yonyou.dmscloud.framework.base.dto.BaseDTO;
import com.yonyou.dmscloud.framework.base.po.BasePO;
import com.yonyou.dmscloud.framework.util.bean.BeanMapperUtil;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.util.Date;

#tableComment("")
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("${tableInfo.obj.name}")
public class ${ClassName}PO extends BasePO<${ClassName}PO>{
    private static final long serialVersionUID = 1L;

#foreach ($column in $tableInfo.fullColumn)
    /** $column.comment */
#if($column.obj.name == $pkColumn.name)
    @TableId(value = "$column.name", type = IdType.AUTO)
#else
    @TableField("$column.obj.name")
#end
    private $!{tool.getClsNameByFullName($column.type)} $column.name;

#if($column.obj.name == $pkColumn.name)
    @Override
    protected Serializable pkVal() {
        return this.$column.name;
    }

#end
#end
    /**
     * 将PO 信息转化为DTO
     *
     * @param dtoClass 需要进行转换的dtoClass
     * @author ${author}
     * @since ${time.currTime()}
     */
    public <T extends BaseDTO> T transPoToDto(Class<T> dtoClass) {
        return super.transDtoToPo(dtoClass);
    }
#foreach ($column in $tableInfo.pkColumn)

    /**
     * 将PO 信息转化为DTO
     *
     * @param dto 需要进行转换的dto
     * @author ${author}
     * @since ${time.currTime()}
     */
    public <T extends BaseDTO> void transPoToDto(T dto) {
        BeanMapperUtil.copyProperties(this, dto, "$column.name");
    }
#end

}

```

#### vo.java.vm

```java
##导入宏定义
$!{define.vm}

##配置变量(宏定义)
#getGlobalConfig()

##设置表后缀（宏定义）
#setTableSuffix("VO")

##保存文件（宏定义）
#save("/entity/vo/${moduleName}", "VO.java")

##包路径（宏定义）
#setPackageSuffix("entity.vo.${moduleName}")

##自动导入包（全局变量）
$!autoImport
import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Date;

#tableComment("返回 VO")
@Data
@ApiModel(value = "${className}VO对象", description = "${tableComment}")
public class ${ClassName}VO implements Serializable {

    private static final long serialVersionUID = 1L;

#foreach ($column in $tableInfo.fullColumn)
    @ApiModelProperty(value = "$column.comment")
    #if($!{tool.getClsNameByFullName($column.type)} == "Date")
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    #end
    private $!{tool.getClsNameByFullName($column.type)} $!{column.name};

#end
}

```

#### mapper.java.vm

```java
##导入宏定义
$!{define.vm}

##配置变量(宏定义)
#getGlobalConfig()

##设置表后缀（宏定义）
#setTableSuffix("Mapper")

##保存文件（宏定义）
#save("/dao/${moduleName}", "Mapper.java")

##包路径（宏定义）
#setPackageSuffix("dao.${moduleName}")

##主键字段
#set($pkName = $!tool.firstUpperCase($!pkColumn.name))
#set($javaType = $!tool.getClsNameByFullName($!pkColumn.type))
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import ${packageName}.entity.dto.${moduleName}.${ClassName}DTO;
import ${packageName}.entity.po.${moduleName}.${ClassName}PO;
import ${packageName}.entity.vo.${moduleName}.${ClassName}VO;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * ${functionName}Mapper接口
 *
 * @author ${author}
 * @since ${datetime}
 */
public interface ${ClassName}Mapper extends BaseMapper<${ClassName}PO> {

    /**
     * 查询${functionName}列表
     *
     * @param ${className} ${functionName}
     * @return ${functionName}集合
     */
    List<${ClassName}VO> select${ClassName}List(@Param("params") ${ClassName}DTO ${className},@Param("page") Page<${ClassName}VO> page);

    /**
     * 查询${functionName}列表-不分页
     *
     * @param ${className} ${functionName}
     * @return ${functionName}集合
     */
    List<${ClassName}VO> select${ClassName}List(@Param("params") ${ClassName}DTO ${className});

}

```

#### service.java.vm

```java
##导入宏定义
$!{define.vm}

##配置变量(宏定义)
#getGlobalConfig()

##设置表后缀（宏定义）
#setTableSuffix("Service")

##设置回调
$!callback.setFileName($tool.append("I", $tableName, ".java"))
$!callback.setSavePath($tool.append($tableInfo.savePath, "/service/${moduleName}"))

##包路径（宏定义）
#setPackageSuffix("service.${moduleName}")

##主键字段
#set($pkName = $!tool.firstUpperCase($!pkColumn.name))
#set($javaType = $!tool.getClsNameByFullName($!pkColumn.type))

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yonyou.dmscloud.framework.domain.RequestPageInfoDto;
import ${packageName}.entity.dto.${moduleName}.${ClassName}DTO;
import ${packageName}.entity.po.${moduleName}.${ClassName}PO;
import ${packageName}.entity.vo.${moduleName}.${ClassName}VO;

import java.util.List;

/**
 * ${functionName}Service接口
 *
 * @author ${author}
 * @since ${datetime}
 */
public interface I${ClassName}Service extends IService<${ClassName}PO>{

    /**
     * 查询${functionName}列表
     *
     * @param ${className} ${functionName}
     * @return ${functionName}集合
     */
    IPage<${ClassName}VO> select${ClassName}List(${ClassName}DTO ${className}, Page<${ClassName}VO> page);

    /**
     * 查询${functionName}列表
     *
     * @param ${className} ${functionName}
     * @return ${functionName}集合
     */
    List<${ClassName}VO> select${ClassName}List(${ClassName}DTO ${className});

    /**
     * 新增${functionName}
     *
     * @param ${className} ${functionName}
     * @return 结果
     */
    int insert${ClassName}(${ClassName}DTO ${className});

}

```

#### serviceImpl.java.vm

```java
##导入宏定义
$!{define.vm}

##配置变量(宏定义)
#getGlobalConfig()

##设置表后缀（宏定义）
#setTableSuffix("ServiceImpl")

##保存文件（宏定义）
#save("/service/${moduleName}/impl", "ServiceImpl.java")

##包路径（宏定义）
#setPackageSuffix("service.${moduleName}.impl")

##主键字段
#set($pkName = $!tool.firstUpperCase($!pkColumn.name))
#set($javaType = $!tool.getClsNameByFullName($!pkColumn.type))

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import ${packageName}.dao.${moduleName}.${ClassName}Mapper;
import ${packageName}.entity.dto.${moduleName}.${ClassName}DTO;
import ${packageName}.entity.po.${moduleName}.${ClassName}PO;
import ${packageName}.entity.vo.${moduleName}.${ClassName}VO;
import ${packageName}.service.${moduleName}.I${ClassName}Service;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * ${functionName}Service业务层处理
 *
 * @author ${author}
 * @since ${datetime}
 */
@Service
@RequiredArgsConstructor
public class ${ClassName}ServiceImpl extends ServiceImpl<${ClassName}Mapper, ${ClassName}PO> implements I${ClassName}Service {

    private final ${ClassName}Mapper ${className}Mapper;

    /**
     * 查询${functionName}列表
     *
     * @param ${className} ${functionName}
     * @return ${functionName}
     */
    @Override
    public IPage<${ClassName}VO> select${ClassName}List(${ClassName}DTO ${className}, Page<${ClassName}VO> page) {
        List<${ClassName}VO> result = ${className}Mapper.select${ClassName}List(${className},page);
        return page.setRecords(result);
    }

    /**
     * 查询${functionName}列表
     *
     * @param ${className} ${functionName}
     * @return ${functionName}
     */
    @Override
    public List<${ClassName}VO> select${ClassName}List(${ClassName}DTO ${className}) {
        return ${className}Mapper.select${ClassName}List(${className});
    }

    /**
     * 新增${functionName}
     *
     * @param ${className} ${functionName}
     * @return 结果
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public int insert${ClassName}(${ClassName}DTO ${className}) {
        ${ClassName}PO po = new ${ClassName}PO();
        ${className}.transDtoToPo(po);
        return ${className}Mapper.insert(po);
    }

}

```

#### mapper.xml.vm

```xml
##引入mybatis支持
$!{mybatisSupport.vm}
$!{define.vm}

##配置变量(宏定义)
#getGlobalConfig()

##设置保存名称与保存位置
$!callback.setFileName($tool.append($!{tableInfo.name}, "Mapper.xml"))
$!callback.setSavePath($tool.append($modulePath, "/src/main/resources/mapper/${moduleName}"))

<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="$!{tableInfo.savePackageName}.dao.${moduleName}.$!{tableInfo.name}Mapper">

    <sql id="select${ClassName}Vo">
        select#foreach($column in $tableInfo.fullColumn) A.$column.obj.name#if($foreach.hasNext),#end#end from ${tableInfo.obj.name} A
    </sql>

    <select id="select${ClassName}List" resultType="${packageName}.entity.vo.${moduleName}.${ClassName}VO">
        <include refid="select${ClassName}Vo"/>

    </select>

</mapper>

```

### Global Config

![202403162105900](https://cdn.jsdelivr.net/gh/chou401/pic-md@master//img/202403162105900.png)

内容可根据需要自行增加以及调整。

define.vm 增减了部分全局变量

```vm
##定义全局变量配置
#macro(getGlobalConfig)
    #if(!$tableInfo.pkColumn.isEmpty())
        #set($pkColumn = $tableInfo.pkColumn.get(0))
    #end

    #set($packageName = $!tableInfo.savePackageName)
    #set($className = $!tool.firstLowerCase($!tableInfo.name))
    #set($moduleName = $!tool.firstLowerCase($!tableInfo.name))
    #set($businessName = $!tool.firstLowerCase($!tableInfo.name))
    #set($ClassName = $!tableInfo.name)
    #set($functionName = $!tableInfo.comment)
    #set($tableComment = $!tableInfo.comment)
    #set($datetime = $!time.currTime())
    #set($tableName = $!tableInfo.obj.name)
#end
```

## 疑问

**mapper.xml文件中出现字段无逗号分割情况：**

找到以下位置：

1. Template下的 mapper.xml.vm脚本
2. Global Config下的 mybatisSupport.vm脚本

将其中的 $velocityHasNext 替换成 $foreach.hasNext 即可。
