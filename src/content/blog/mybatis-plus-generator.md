---
author: chou401
pubDatetime: 2024-03-16T20:43:41.000Z
modDatetime:
title: MybatisPlus generator
featured: false
draft: first
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

controller.java.vm

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

##主键字段首字母大写
#set($pkName = $!tool.firstUpperCase($!pkColumn.name))

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yonyou.dmscloud.framework.service.excel.ExcelDataType;
import com.yonyou.dmscloud.framework.service.excel.ExcelExportColumn;
import com.yonyou.dmscloud.framework.service.excel.ExcelGenerator;
import com.yonyou.dmscloud.framework.domain.RequestPageInfoDto;
import com.yonyou.dmscloud.framework.util.bean.ApplicationContextHelper;
import ${packageName}.entity.dto.${moduleName}.${ClassName}DTO;
import ${packageName}.service.${moduleName}.I${ClassName}Service;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.MediaType;

import java.util.List;
import java.util.Map;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * ${functionName}Controller
 *
 * @author ${author}
 * @since ${datetime}
 */
@Api(value = "${functionName}controller", tags = {"${functionName}controller"})
@RestController
@RequestMapping("/${moduleName}")
public class ${ClassName}Controller {

	private final I${ClassName}Service ${className}Service;

    private final ExcelGenerator excelGenerator;

    public ${ClassName}Controller(I${ClassName}Service ${className}Service, ExcelGenerator excelGenerator) {
        this.${className}Service = ${className}Service;
        this.excelGenerator = excelGenerator;
    }

    /**
     * 查询${functionName}分页列表
     */
    @ApiOperation(value = "分页列表${functionName}", notes = "分页${functionName}")
    @GetMapping(path = "/${businessName}PageQuery")
    public IPage<${ClassName}DTO> ${businessName}PageQuery(${ClassName}DTO requestDTO) {
        // 获取分页信息
        RequestPageInfoDto requestPageInfoDto = ApplicationContextHelper.getBeanByType(RequestPageInfoDto.class);
        Page<${ClassName}DTO> page = new Page<>();
        page.setCurrent(Long.parseLong(requestPageInfoDto.getPageNum()));
        page.setSize(Long.parseLong(requestPageInfoDto.getLimit()));

        return ${className}Service.select${ClassName}List(requestDTO,page);
    }

    /**
     * 查询${functionName}列表-不分页
     */
    @ApiOperation(value = "不分页列表${functionName}", notes = "不分页查询${functionName}")
    @GetMapping(path = "/${businessName}AllQuery")
    public List<${ClassName}DTO> ${businessName}AllQuery(${ClassName}DTO requestDTO) {
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
    @PostMapping("/${businessName}Insert")
    @ApiOperation(value = "${functionName}新增数据", notes = "${functionName}新增数据")
    public int ${businessName}Insert(@RequestBody ${ClassName}DTO ${className}DTO) {
        return ${className}Service.insert${ClassName}(${className}DTO);
    }

    /**
     * 进行${functionName}数据修改
     *
     * @param
     * @param ${className}DTO 需要保存的DTO
     * @return int
     * @author ${author}
     * @since ${datetime}
     */
    @PostMapping("/${businessName}Edit")
    @ApiOperation(value = "${functionName}数据修改", notes = "${functionName}数据修改")
    public int ${businessName}Edit(@RequestBody ${ClassName}DTO ${className}DTO) {
        return ${className}Service.update${ClassName}(${className}DTO);
    }

    /**
     * ${functionName}删除
     * @param id id
     * @return int
     * @author ${author}
     * @since ${datetime}
     */
    @ApiOperation(value = "${functionName}删除")
    @PostMapping(value = "/${businessName}Delete")
    public void ${businessName}Delete(@RequestParam Long id) {
        ${className}Service.delete${ClassName}By${pkName}(id);
    }

    /**
     * ${functionName}导出
     *
     * @param
     * @return
     * @author ${author}
     * @since ${datetime}
     */
    @GetMapping("/${businessName}Export")
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

domain.java.vm

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
import lombok.Data;

import java.io.Serializable;
import java.util.Date;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;

import org.springframework.format.annotation.DateTimeFormat;

#tableComment("表实体类")
@Data
@ApiModel(value = "${className}DTO对象", description = "${tableComment}")
public class ${ClassName}DTO implements Serializable {

    private static final long serialVersionUID = 1L;

#foreach ($column in $tableInfo.fullColumn)
    /** $column.comment */
    @ApiModelProperty(value = "$column.comment")
    #if($!{tool.getClsNameByFullName($column.type)} == "Date")
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    #end
    $!{tool.getClsNameByFullName($column.type)} $!{column.name};

    #if($!{tool.getClsNameByFullName($column.type)} == 'Date')
    @ApiModelProperty(value = "$column.comment开始日期")
    private String ${column.name}Begin;
    @ApiModelProperty(value = "$column.comment开始日期")
    private String ${column.name}End;
	#end
#end
#if($table.sub)
    /** $table.subTable.functionName信息 */
    private List<${subClassName}> ${subclassName}List;

#end
}
```

domainPO.java.vm

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

import com.baomidou.mybatisplus.annotation.*;
import com.yonyou.dmscloud.framework.base.dto.BaseDTO;
import com.yonyou.dmscloud.framework.base.po.BasePO;
import com.yonyou.dmscloud.framework.util.bean.BeanMapperUtil;

import lombok.Data;

import java.io.Serializable;
import java.util.Date;

#tableComment("")
@Data
@TableName("${tableName}")
public class ${ClassName}PO extends BasePO<${ClassName}PO>{
    private static final long serialVersionUID = 1L;

#foreach ($column in $tableInfo.fullColumn)
#if($column.obj.name == $pkName)
    @TableId(value="$column.name", type = IdType.AUTO)
#else
    @TableField("$column.obj.name")
#end
    private $!{tool.getClsNameByFullName($column.type)} $column.name;
#end

#if($column.obj.name == $pkName)
    @Override
    protected Serializable pkVal() {
        return this.$column.name;
    }
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
#foreach ($column in $tableInfo.fullColumn)
#if($column.obj.name == $pkName)
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
#end

}
```

mapper.java.vm

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

import java.util.List;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import ${packageName}.entity.dto.${moduleName}.${ClassName}DTO;
import ${packageName}.entity.po.${moduleName}.${ClassName}PO;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import org.apache.ibatis.annotations.Param;

/**
 * ${functionName}Mapper接口
 *
 * @author ${author}
 * @since ${datetime}
 */
public interface ${ClassName}Mapper extends BaseMapper<${ClassName}PO> {

    /**
     * 查询${functionName}
     *
     * @param ${pkColumn.name} ${functionName}主键
     * @return ${functionName}
     */
    ${ClassName}DTO select${ClassName}By${pkName}(${javaType} ${pkColumn.name});

    /**
     * 查询${functionName}列表
     *
     * @param ${className} ${functionName}
     * @return ${functionName}集合
     */
    List<${ClassName}DTO> select${ClassName}List(@Param("params") ${ClassName}DTO ${className},@Param("page") Page page);

    /**
     * 查询${functionName}列表-不分页
     *
     * @param ${className} ${functionName}
     * @return ${functionName}集合
     */
    List<${ClassName}DTO> select${ClassName}List(@Param("params") ${ClassName}DTO ${className});

    /**
     * 新增${functionName}
     *
     * @param ${className} ${functionName}
     * @return 结果
     */
    int insert${ClassName}(${ClassName}DTO ${className});

    /**
     * 修改${functionName}
     *
     * @param ${className} ${functionName}
     * @return 结果
     */
    int update${ClassName}(${ClassName}DTO ${className});

    /**
     * 删除${functionName}
     *
     * @param ${pkColumn.name} ${functionName}主键
     * @return 结果
     */
    int delete${ClassName}By${pkName}(${javaType} ${pkColumn.name});

    /**
     * 批量删除${functionName}
     *
     * @param ${pkColumn.name}s 需要删除的数据主键集合
     * @return 结果
     */
    int delete${ClassName}By${pkName}s(String[] ${pkColumn.name}s);


    /**
    * 批量新增数据
    *
    * @param entities List<${ClassName}DTO> 实例对象列表
    * @return 影响行数
    */
    insertBatch(@Param("entities") List<${ClassName}DTO> entities);

    /**
    * 批量新增或按主键更新数据
    *
    * @param entities List<${ClassName}DTO> 实例对象列表
    * @return 影响行数
    */
    insertOrUpdateBatch(@Param("entities") List<${ClassName}DTO> entities);

}
```

service.java.vm

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

import java.util.List;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yonyou.dmscloud.framework.domain.RequestPageInfoDto;
import ${packageName}.entity.dto.${moduleName}.${ClassName}DTO;
import ${packageName}.entity.po.${moduleName}.${ClassName}PO;

/**
 * ${functionName}Service接口
 *
 * @author ${author}
 * @since ${datetime}
 */
public interface I${ClassName}Service {
    /**
     * 查询${functionName}
     *
     * @param ${pkColumn.name} ${functionName}主键
     * @return ${functionName}
     */
    ${ClassName}DTO select${ClassName}By${pkName}(${javaType} ${pkColumn.name});

    /**
     * 查询${functionName}列表
     *
     * @param ${className} ${functionName}
     * @return ${functionName}集合
     */
    IPage<${ClassName}DTO> select${ClassName}List(${ClassName}DTO ${className},Page page);

    /**
     * 查询${functionName}列表
     *
     * @param ${className} ${functionName}
     * @return ${functionName}集合
     */
    List<${ClassName}DTO> select${ClassName}List(${ClassName}DTO ${className});

    /**
     * 新增${functionName}
     *
     * @param ${className} ${functionName}
     * @return 结果
     */
    int insert${ClassName}(${ClassName}DTO ${className});

    /**
     * 修改${functionName}
     *
     * @param ${className} ${functionName}
     * @return 结果
     */
    int update${ClassName}(${ClassName}DTO ${className});

    /**
     * 批量删除${functionName}
     *
     * @param ${pkColumn.name}s 需要删除的${functionName}主键集合
     * @return 结果
     */
    int delete${ClassName}By${pkName}s(String ${pkColumn.name}s);

    /**
     * 删除${functionName}信息
     *
     * @param ${pkColumn.name} ${functionName}主键
     * @return 结果
     */
    int delete${ClassName}By${pkName}(${javaType} ${pkColumn.name});

}
```

serviceImpl.java.vm

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

import java.util.List;
import java.util.Date;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.yonyou.dmscloud.framework.domain.RequestPageInfoDto;
import ${packageName}.dao.${moduleName}.${ClassName}Mapper;
import ${packageName}.entity.dto.${moduleName}.${ClassName}DTO;
import ${packageName}.entity.po.${moduleName}.${ClassName}PO;
import ${packageName}.service.${moduleName}.I${ClassName}Service;

/**
 * ${functionName}Service业务层处理
 *
 * @author ${author}
 * @since ${datetime}
 */
@Service
public class ${ClassName}ServiceImpl extends ServiceImpl<${ClassName}Mapper, ${ClassName}PO> implements I${ClassName}Service {

    private final ${ClassName}Mapper ${className}Mapper;

    public ${ClassName}ServiceImpl(${ClassName}Mapper ${className}Mapper) {
        this.${className}Mapper = ${className}Mapper;
    }

    /**
     * 查询${functionName}
     *
     * @param ${pkColumn.name} ${functionName}主键
     * @return ${functionName}
     */
    @Override
    public ${ClassName}DTO select${ClassName}By${pkName}(${javaType} ${pkColumn.name}) {
        return ${className}Mapper.select${ClassName}By${pkName}(${pkColumn.name});
    }

    /**
     * 查询${functionName}列表
     *
     * @param ${className} ${functionName}
     * @return ${functionName}
     */
    @Override
    public IPage<${ClassName}DTO> select${ClassName}List(${ClassName}DTO ${className},Page page) {
        List<${ClassName}DTO> result = ${className}Mapper.select${ClassName}List(${className},page);
        return page.setRecords(result);
    }

    /**
     * 查询${functionName}列表
     *
     * @param ${className} ${functionName}
     * @return ${functionName}
     */
    @Override
    public List<${ClassName}DTO> select${ClassName}List(${ClassName}DTO ${className}) {
        List<${ClassName}DTO> result = ${className}Mapper.select${ClassName}List(${className});
        return result;
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
#foreach ($column in $tableInfo.fullColumn)
#if($column.name == 'createdAt')
        ${className}.setCreatedAt(new Date());
#end
#end
        return ${className}Mapper.insert${ClassName}(${className});
    }

    /**
     * 修改${functionName}
     *
     * @param ${className} ${functionName}
     * @return 结果
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public int update${ClassName}(${ClassName}DTO ${className}) {
#foreach ($column in $tableInfo.fullColumn)
#if($column.name == 'updatedAt')
        ${className}.setUpdatedAt(new Date());
#end
#end
#if($table.sub)
        ${className}Mapper.delete${subClassName}By${subTableFkClassName}(${className}DTO.get${pkName}());
        insert${subClassName}(${className});
#end
        return ${className}Mapper.update${ClassName}(${className});
    }

    /**
     * 批量删除${functionName}
     *
     * @param ${pkColumn.name}s 需要删除的${functionName}主键
     * @return 结果
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public int delete${ClassName}By${pkName}s(String ${pkColumn.name}s) {
        return ${className}Mapper.delete${ClassName}By${pkName}s(${pkColumn.name}s.split(","));
    }

    /**
     * 删除${functionName}信息
     *
     * @param ${pkColumn.name} ${functionName}主键
     * @return 结果
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public int delete${ClassName}By${pkName}(${javaType} ${pkColumn.name}) {
        return ${className}Mapper.delete${ClassName}By${pkName}(${pkColumn.name});
    }
}
```

mapper.xml.vm

```xml
##引入mybatis支持
$!{mybatisSupport.vm}
$!{define.vm}

##配置变量(宏定义)
#getGlobalConfig()

##设置保存名称与保存位置
$!callback.setFileName($tool.append($!{tableInfo.name}, "Mapper.xml"))
$!callback.setSavePath($tool.append($modulePath, "/src/main/resources/mapper/${moduleName}"))

##主键字段
#set($pkColumnName = $!pkColumn.obj.name)
#set($pkName = $!tool.firstUpperCase($!pkColumn.name))
#set($javaType = $!tool.getClsNameByFullName($!pkColumn.type))


<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="$!{tableInfo.savePackageName}.dao.${moduleName}.$!{tableInfo.name}Mapper">

    <sql id="select${ClassName}Vo">
        select#foreach($column in $tableInfo.fullColumn) A.$column.obj.name#if($foreach.count != $columns.size()),#end#end from ${tableInfo.obj.name} A
    </sql>

    <select id="select${ClassName}List" resultType="${packageName}.entity.dto.${moduleName}.${ClassName}DTO">
        <include refid="select${ClassName}Vo"/>
        <!-- <where>
            <if test="$javaField != null #if($javaType == 'String' ) and $javaField.trim() != ''#end"> and A.$column.obj.name = #{$column.name}</if>
            <if test="$javaField != null #if($javaType == 'String' ) and $javaField.trim() != ''#end"> and A.$column.obj.name != #{$column.name}</if>
            <if test="$javaField != null #if($javaType == 'String' ) and $javaField.trim() != ''#end"> and A.$column.obj.name &gt; #{$column.name}</if>
            <if test="$javaField != null #if($javaType == 'String' ) and $javaField.trim() != ''#end"> and A.$column.obj.name &gt;= #{$column.name}</if>
            <if test="$javaField != null #if($javaType == 'String' ) and $javaField.trim() != ''#end"> and A.$column.obj.name &lt; #{$column.name}</if>
            <if test="$javaField != null #if($javaType == 'String' ) and $javaField.trim() != ''#end"> and A.$column.obj.name &lt;= #{$column.name}</if>
            <if test="$javaField != null #if($javaType == 'String' ) and $javaField.trim() != ''#end"> and A.$column.obj.name like concat('%', #{$column.name}, '%')</if>
            <if test="params.${column.javaField}Begin != null and params.${column.javaField}Begin != '' ">
                and A.$column.obj.name &gt;= DATE_FORMAT(#{params.${column.name}Begin},'%Y-%m-%d 00:00:00')
            </if>
            <if test="params.${column.name}End != null and params.${column.name}End != ''">
                and A.$column.obj.name &lt;= DATE_FORMAT(#{params.${column.name}End},'%Y-%m-%d 23:59:59')
            </if>
            <if test="params.${column.name}Begin != null and params.${column.name}Begin != '' ">
                and A.$column.obj.name &gt;= #{params.${column.name}Begin}
            </if>
            <if test="params.${column.name}End != null and params.${column.name}End != ''">
                and A.$column.obj.name &lt;= #{params.${column.name}End}
            </if>

        </where> -->
    </select>

    <select id="select${ClassName}By${pkName}" resultType="${packageName}.entity.dto.${moduleName}.${ClassName}DTO">
        <include refid="select${ClassName}Vo"/>
        where ${pkColumnName} = #{${pkColumn.name}}
    </select>

    <insert id="insert${ClassName}" useGeneratedKeys="true" keyProperty="$pkColumn.name">
        insert into ${tableName}
        <trim prefix="(" suffix=")" suffixOverrides=",">
#foreach($column in $tableInfo.otherColumn)
            <if test="$column.name != null#if($javaType== 'String') and $column.name != ''#end">$column.obj.name,</if>
#end
         </trim>
        <trim prefix="values (" suffix=")" suffixOverrides=",">
#foreach($column in $tableInfo.otherColumn)
            <if test="$column.name != null#if($javaType == 'String') and $column.name != ''#end">#{$column.name},</if>
#end
         </trim>
    </insert>

    <update id="update${ClassName}">
        update ${tableName}
        <trim prefix="SET" suffixOverrides=",">
#foreach($column in $tableInfo.otherColumn)
            <if test="$column.name != null#if($javaType == 'String') and $column.name != ''#end">$column.obj.name = #{$column.name},</if>
#end
        </trim>
        where ${pkColumn.obj.name} = #{${pkColumn.name}}
    </update>

    <delete id="delete${ClassName}By${pkName}" parameterType="${javaType}">
        delete from ${tableName} where ${pkColumn.obj.name} = #{${pkColumn.name}}
    </delete>

    <delete id="delete${ClassName}By${pkName}s" parameterType="String">
        delete from ${tableName} where ${pkColumn.obj.name} in
        <foreach item="${pkColumn.name}" collection="array" open="(" separator="," close=")">
            #{${pkColumn.name}}
        </foreach>
    </delete>

    <!-- 批量插入 -->
    <insert id="insertBatch" keyProperty="$!pkColumn.name" useGeneratedKeys="true">
        insert into $!{tableInfo.obj.name}(#foreach($column in $tableInfo.otherColumn)$!column.obj.name#if($velocityHasNext), #end#end)
        values
        <foreach collection="entities" item="entity" separator=",">
        (#foreach($column in $tableInfo.otherColumn)#{entity.$!{column.name}}#if($velocityHasNext), #end#end)
        </foreach>
    </insert>
    <!-- 批量插入或按主键更新 -->
    <insert id="insertOrUpdateBatch" keyProperty="$!pkColumn.name" useGeneratedKeys="true">
        insert into $!{tableInfo.obj.name}(#foreach($column in $tableInfo.otherColumn)$!column.obj.name#if($velocityHasNext), #end#end)
        values
        <foreach collection="entities" item="entity" separator=",">
            (#foreach($column in $tableInfo.otherColumn)#{entity.$!{column.name}}#if($velocityHasNext), #end#end)
        </foreach>
        on duplicate key update
         #foreach($column in $tableInfo.otherColumn)$!column.obj.name = values($!column.obj.name) #if($velocityHasNext), #end#end
    </insert>

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
