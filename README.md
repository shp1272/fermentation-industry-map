# 发酵产业公开信息地图

整理国内发酵相关中试、代工、检测服务的**公开信息**，做一张可检索、可核验的静态信息地图，附基础发酵计算器。

**在线地址：https://shp1272.github.io/fermentation-industry-map/**

- 纯静态站点：原生 HTML + CSS + JavaScript + JSON，无后端、无数据库、无登录、无用户表单，不收集任何访问者数据。
- 只收录公开网页能支持的内容，每条企业卡带来源链接和核验日期，不猜测、不做背书。
- 当前收录 3 家企业官网公开信息（中试 / 代工 / 检测各 1 家），状态为「待核验」，每条标注来源链接和核验日期，持续更新中。

## 目录结构

| 路径 | 用途 |
| --- | --- |
| `index.html` | 首页：项目说明、边界、导航 |
| `directory.html` | 企业目录：关键词 + 服务标签筛选 |
| `calculator.html` | 基础发酵计算器：接种量 / 稀释 / 配液 |
| `data/companies.json` | 企业卡公开数据（目录页唯一数据源） |
| `data/README.md` | 字段解释和录入规则 |
| `tools/validate_data.py` | 数据校验脚本（必填字段 / 重复 id / 日期格式） |
| `assets/` | 共享样式和页面脚本 |

## 本地预览

首页可以直接双击 `index.html` 打开。

目录页需要读取 `data/companies.json`，浏览器出于安全限制不允许 `file://` 页面读取本地 JSON，所以要用本地服务器预览。任选一种：

```bash
# 在项目根目录运行（本机装过 Python 即可）
python -m http.server 8000
```

然后浏览器打开 <http://localhost:8000>。也可以用 VS Code 的 Live Server 插件。

## 数据维护

新增或修改企业卡只动 `data/companies.json`，字段规则见 [data/README.md](data/README.md)。改完运行校验：

```bash
python tools/validate_data.py
```

输出「全部通过」才算数；有错误会逐条列出。

目录页筛选逻辑（关键词、标签、空字段隐藏、空状态）可用冒烟测试检查，需要本机装有 Node.js：

```bash
node tools/smoke_test.js
```

## 部署到 GitHub Pages

### 方法一：网页上传（不用命令行）

1. 登录 GitHub，点右上角 **New repository**，仓库名填 `fermentation-industry-map`，选 **Public**，不勾选初始化文件，点 Create。
2. 进入仓库页面，点 **uploading an existing file**，把本项目的**所有文件和文件夹**按原结构拖进去（保持 `data/`、`assets/`、`tools/` 层级不变），提交。
3. 打开仓库 **Settings → Pages**，**Source** 选 **Deploy from a branch**，Branch 选 `main`、目录选 `/ (root)`，点 Save。
4. 等 1–2 分钟，Settings → Pages 页面顶部会给出网址，形如：
   `https://<你的用户名>.github.io/fermentation-industry-map/`

### 方法二：git 命令行

```bash
cd fermentation-industry-map
git init
git add .
git commit -m "第一版：静态信息地图 + 示例数据 + 计算器"
git branch -M main
git remote add origin https://github.com/<你的用户名>/fermentation-industry-map.git
git push -u origin main
```

推送后再按方法一的第 3、4 步开启 Pages 即可。以后每次更新数据，`git add . && git commit && git push` 就完成发布。

## 更新数据的工作流

1. 从企业官网、官方展会名录等公开来源找信息，打开页面确认内容。
2. 按 [data/README.md](data/README.md) 的字段规则写入 `companies.json`，填上来源链接和当天的 `checked_at`。
3. 运行 `tools/validate_data.py` 确认通过。
4. 本地服务器预览目录页，检查筛选和链接。
5. 推送 GitHub，完成发布。

## 验收对照

- 网站是纯静态的：无后端、无框架、无外部服务依赖。
- 3 家企业公开信息可按关键词和标签筛选，均标注来源与核验日期。
- 计算器 3 个功能可用，输入带单位、出错有提示。
- 所有外部数据字段都有来源和日期。
- 部署说明清楚（见上文）。
