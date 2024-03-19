---
author: chou401
pubDatetime: 2024-03-19T17:48:36.000Z
modDatetime:
title: utils
featured: false
draft: false
tags:
  - java
description: 开发中常用 util 记录
---

## Table of contents

## BeanMapperUtil

```java

import com.yonyou.dmscloud.framework.util.exception.UtilException;
import java.beans.BeanInfo;
import java.beans.Introspector;
import java.beans.PropertyDescriptor;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.apache.commons.collections.MapUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.BeanWrapper;
import org.springframework.beans.BeanWrapperImpl;

public final class BeanMapperUtil extends MapUtils {
    private static final Logger logger = LoggerFactory.getLogger(BeanMapperUtil.class);
    private static String errorMsg = "Map 转换对象失败";
    private static String errorMsg2 = "对象转换MAP失败";

    public BeanMapperUtil() {
    }

    public static <T> T copyProperties(Object orig, Class<T> clazz) {
        if (orig == null) {
            throw new UtilException("input cannot be none");
        } else {
            T t = null;

            try {
                t = clazz.getDeclaredConstructor().newInstance();
            } catch (ReflectiveOperationException var4) {
                logger.error(var4.getMessage(), var4);
            }

            BeanUtils.copyProperties(orig, t);
            return t;
        }
    }

    public static void copyProperties(Object orig, Object destObj) {
        BeanUtils.copyProperties(orig, destObj);
    }

    public static void copyProperties(Object orig, Object destObj, String... ignoreProperties) {
        BeanUtils.copyProperties(orig, destObj, ignoreProperties);
    }

    public static void copyPropertiesWithOutNull(Object orig, Object destObj) {
        BeanUtils.copyProperties(orig, destObj, getNullPropertyNames(orig));
    }

    private static String[] getNullPropertyNames(Object source) {
        BeanWrapper src = new BeanWrapperImpl(source);
        PropertyDescriptor[] pds = src.getPropertyDescriptors();
        Set<String> emptyNames = new HashSet();
        PropertyDescriptor[] var4 = pds;
        int var5 = pds.length;

        for(int var6 = 0; var6 < var5; ++var6) {
            PropertyDescriptor pd = var4[var6];
            Object srcValue = src.getPropertyValue(pd.getName());
            if (srcValue == null) {
                emptyNames.add(pd.getName());
            }
        }

        String[] result = new String[emptyNames.size()];
        return (String[])emptyNames.toArray(result);
    }

    public static <T> List<T> copyList(List<?> origList, Class<T> destClass) {
        List<T> destList = new ArrayList();
        Iterator var3 = origList.iterator();

        while(var3.hasNext()) {
            Object orig = var3.next();
            destList.add(copyProperties(orig, destClass));
        }

        return destList;
    }

    public static <T, V> T toObject(Class<T> clazz, Map<String, V> map) {
        try {
            T object = clazz.getDeclaredConstructor().newInstance();
            return toObject(object, map);
        } catch (Exception var3) {
            throw new UtilException(errorMsg, var3);
        }
    }

    public static <T, V> T toObject(Class<T> clazz, Map<String, V> map, boolean toCamelCase) {
        try {
            T object = clazz.getDeclaredConstructor().newInstance();
            return toObject(object, map, toCamelCase);
        } catch (Exception var4) {
            throw new UtilException(errorMsg, var4);
        }
    }

    public static <T, V> T toObject(T object, Map<String, V> map) {
        try {
            org.apache.commons.beanutils.BeanUtils.populate(object, map);
            return object;
        } catch (Exception var3) {
            throw new UtilException(errorMsg, var3);
        }
    }

    public static <T, V> T toObject(T object, Map<String, V> map, boolean toCamelCase) {
        try {
            if (toCamelCase) {
                map = toCamelCaseMap(map);
            }

            org.apache.commons.beanutils.BeanUtils.populate(object, map);
            return object;
        } catch (Exception var4) {
            throw new UtilException(errorMsg, var4);
        }
    }

    public static Map<String, Object> toMap(Object obj) {
        try {
            if (obj == null) {
                return null;
            } else {
                Map<String, Object> map = new HashMap(16);
                BeanInfo beanInfo = Introspector.getBeanInfo(obj.getClass());
                PropertyDescriptor[] propertyDescriptors = beanInfo.getPropertyDescriptors();
                PropertyDescriptor[] var4 = propertyDescriptors;
                int var5 = propertyDescriptors.length;

                for(int var6 = 0; var6 < var5; ++var6) {
                    PropertyDescriptor property = var4[var6];
                    String key = property.getName();
                    if (key.compareToIgnoreCase("class") != 0) {
                        Method getter = property.getReadMethod();
                        Object value = getter != null ? getter.invoke(obj) : null;
                        map.put(key, value);
                    }
                }

                return map;
            }
        } catch (Exception var11) {
            throw new UtilException(errorMsg2, var11);
        }
    }

    public static Map<String, Object> toMapForFlat(Object object) {
        try {
            Map<String, Object> map = toMap(object);
            return toUnderlineStringMap(map);
        } catch (Exception var2) {
            throw new UtilException(errorMsg2, var2);
        }
    }

    public static <T> Collection<Map<String, Object>> toMapList(Collection<T> collection) {
        List<Map<String, Object>> retList = new ArrayList();
        if (collection != null && !collection.isEmpty()) {
            Iterator var2 = collection.iterator();

            while(var2.hasNext()) {
                Object object = var2.next();
                Map<String, Object> map = toMap(object);
                retList.add(map);
            }
        }

        return retList;
    }

    public static <V> Map<String, V> toCamelCaseMap(Map<String, V> map) {
        Map<String, V> newMap = new HashMap(16);
        Iterator var2 = map.entrySet().iterator();

        while(var2.hasNext()) {
            Map.Entry<String, V> entry = (Map.Entry)var2.next();
            safeAddToMap(newMap, JavaBeanUtil.toCamelCaseString((String)entry.getKey()), entry.getValue());
        }

        return newMap;
    }

    public static <V> Map<String, V> toUnderlineStringMap(Map<String, V> map) {
        Map<String, V> newMap = new HashMap(16);
        Iterator var2 = map.entrySet().iterator();

        while(var2.hasNext()) {
            Map.Entry<String, V> entry = (Map.Entry)var2.next();
            newMap.put(JavaBeanUtil.toUnderlineString((String)entry.getKey()), entry.getValue());
        }

        return newMap;
    }

    public static <T> Collection<Map<String, Object>> toMapListForFlat(Collection<T> collection) {
        List<Map<String, Object>> retList = new ArrayList();
        if (collection != null && !collection.isEmpty()) {
            Iterator var2 = collection.iterator();

            while(var2.hasNext()) {
                Object object = var2.next();
                Map<String, Object> map = toMapForFlat(object);
                retList.add(map);
            }
        }

        return retList;
    }

    public static void populateValueByMethod(Object object, String methodName, Object value) {
        Method method = BeanUtils.findMethodWithMinimalParameters(object.getClass(), methodName);

        try {
            method.invoke(object, value);
        } catch (Exception var5) {
            throw new UtilException("属性赋值失败", var5);
        }
    }
}
```
