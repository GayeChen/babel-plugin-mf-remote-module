# babel-plugin-mf-remote-module

## 插件作用：识别匹配到远程模块，将代码转换为直接从window上的动态容器通过get方法获取模块，避免子应用多次初始化远程模块
## 解构导入
### 转换前

```
import {Button} from '@common/one-ui';
```
### 转换后
```
const {Button1} = (await window.mallcommon.get('./one-ui'))();
```

## 默认导入
### 转换前
```
import reduxNormalizer from '@common/utils/model';
```
### 转换后
```
const reduxNormalizer1 = (await window.mallcommon.get('./utils/model'))().default;
```

## 默认和解构导入
### 转换前：
`import React, {Fragment} from 'react';`
### 转换后
```
const React = (await window.mallcommon.get('./utils/model'))().default;
const {Fragment} = React;
```

### babel-plugin手册
#### https://github.com/jamiebuilds/babel-handbook/blob/master/translations/zh-Hans/plugin-handbook.md#toc-plugin-options
#### https://astexplorer.net/


