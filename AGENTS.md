# AGENTS.md

## 项目简介

OOTD — 微信小程序（穿搭/衣橱管理），基于 **Mpx + Vue 2 + TypeScript + Less** 构建。通过 `@mpxjs/mpx-cli-service` 支持跨平台（wx、ali、web 等）。

## 命令

- `npm run serve` — 开发构建（默认目标：微信）。跨平台加 `-- --targets=ali,web`。
- `npm run build` — 生产构建（`--targets=wx,web`）。

**无 lint、typecheck、test、format 脚本。** 修改代码后不要执行 `build`（项目规则）。

## 项目结构

```
src/
  app.mpx              ← 应用入口（页面列表、tabBar 配置、窗口默认值）
  custom-tab-bar/      ← 自定义 tabBar 组件（5 个 tab，中间"添加"凸起）
  components/          ← 公共组件（List.mpx）
  pages/<pageName>/
    index.mpx          ← 薄页面壳（创建页面 + 设置 tab 选中态）
    component/<PageName>.mpx  ← 实际页面组件（逻辑 + 模板 + 样式）
  utils/
    storage.ts         ← 所有数据 CRUD（wx 本地存储），抽象层
    weather.ts         ← 和风天气 API + 自动 Mock 降级
    tabBar.ts          ← setCustomTabBarSelected 工具函数
    location.ts        ← 位置工具
```

## 规范

- **文件命名**：`.mpx` 文件用 PascalCase，文件夹用 camelCase。
- **路径别名**：`@/` → `src/`（tsconfig.json 配置）。
- **样式**：只用 Less。Stylus 已安装但不能使用（框架内部依赖）。
- **TabBar**：自定义实现。每个 tab 页面必须在 `onShow` 中调用 `setCustomTabBarSelected(this, N)`。Tab 索引：0=首页, 1=衣橱, 2=添加, 3=搭配, 4=我的。
- **wx 类型**：在 `src/global.d.ts` 中手写。不要引入 `miniprogram-api-typings` 等外部类型包。
- **数据层**：所有衣物/搭配数据通过 `src/utils/storage.ts` 流转。Storage key：`OOTD_CLOTHES`、`OOTD_OUTFITS`。迁移到后端只需改这一个文件。
- **天气**：和风天气 API。`QWEATHER_KEY` 默认为空 → 自动 Mock。填入 Key 后切换真实数据，见 `src/utils/weather.ts`。

## 注意事项

- `index.mpx` 页面壳和 `component/<Name>.mpx` 是两个文件。壳负责页面生命周期 + JSON 配置；组件负责实际 UI。不要合并它们。
- Mpx 组件生命周期与原生微信不同：组件初始化用 `attached`（不是 `onLoad`）。页面级生命周期（`onShow`）正常使用。
- `methods` 块中不要加 `this: any`（Mpx `ThisType` 自动推断）。只有生命周期钩子可能需要显式 `this: any`。
- 构建产物输出到 `dist/<target>/`，该目录已 gitignore。
- `coding.md` 是权威编码规范。`desc.md` 描述当前功能状态——功能变更时同步更新。
