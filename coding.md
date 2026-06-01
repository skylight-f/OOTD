# 编码规范
1. 不要修改后执行 build 命令
2. 页面组件命名使用 PascalCase, 组件文件名使用 PascalCase，文件命名使用 pascalCase
3. 页面文件夹结构：
   ```
   pages/
     myPage/
       component
          Component.mpx
       index.mpx
   ```
4. 样式预处理器统一使用 less，项目内不要再使用 stylus, 但依赖需要安装，框架有些内置功能需要 stylus 支持，安装后不使用即可
5. 需要再desc.md 讲述小程序主要模块，功能，设计思路等，不是不断追加，而是修改原有的内容，保持文档的清晰和简洁，描述当前项目的状态，后续的修改也要修改这个文档，保持文档的更新和准确