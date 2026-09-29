# 企业卡数据说明与录入规则

`companies.json` 是目录页的唯一数据源，顶层为数组，每条元素是一张企业卡。

## 字段说明

| 字段 | 含义 | 必填 | 取值说明 |
| --- | --- | --- | --- |
| `id` | 唯一编号 | 是 | 字符串，全文件不可重复。真实数据建议用 `YYYYMMDD-序号`，示例数据用 `sample-` 前缀 |
| `name` | 企业名称 | 是 | 企业公开使用的正式名称。示例数据必须在名称中带「示例」字样 |
| `city` | 城市或地区 | 是 | 字符串 |
| `service_tags` | 服务标签 | 是 | 字符串数组。常用：中试、代工、检测、菌种、发酵；新标签需同步更新 `tools/validate_data.py` 的 `KNOWN_TAGS` |
| `public_capability` | 官网公开的能力摘要 | 是 | 只写公开网页能支持的内容，用自己的话概括，不夸大、不评价 |
| `price_status` | 价格信息公开状态 | 是 | 取值：`public`（公开价格）、`price`（有报价信息）、`quote required`（需询价）、`not found`（未发现公开价格信息） |
| `contact_url` | 企业官网联系页 | 否 | 留空则页面不显示该字段 |
| `source_url` | 信息原始网页 | 是 | 必须能公开访问，`http://` 或 `https://` 开头 |
| `checked_at` | 核验日期 | 是 | `YYYY-MM-DD`，指最后一次打开来源核对内容的日期 |
| `confidence` | 可信度 | 是 | `high`（官网等一手来源，内容明确）、`medium`（官方名录等可信二手来源）、`low`（来源有限或信息不全） |
| `status` | 数据状态 | 是 | `sample`（演示用示例数据，非真实企业）、`pending`（已录入待人工核对）、`verified`（来源与内容已核对） |

## 录入规则

1. 只写公开网页能支持的内容。没有公开信息的字段留空或写「未发现」，不允许猜测。
2. 每条卡片必须有可打开的来源链接，并在 `checked_at` 记录核验日期。
3. 虚构内容、演示内容一律 `status` 为 `sample`，名称必须带「示例」字样，来源链接使用 `https://example.com/` 下的占位地址，替换为真实数据后改回。
4. 不收录：无法核实来源的信息、需要登录或绕开限制才能看的内容、非公开的价格承诺。
5. 新增企业卡后，运行校验脚本确认无误：

```bash
python3 tools/validate_data.py
```

全部通过会输出「全部通过」，退出码为 0；有错误会逐条列出，退出码为 1。

## 如何新增一条企业卡

在数组末尾加入如下结构（示例数据写法）：

```json
{
  "id": "sample-004",
  "name": "示例数据·菌种服务样例",
  "city": "广州",
  "service_tags": ["菌种"],
  "public_capability": "本卡片为页面演示用的示例数据，内容为虚构，不代表任何真实企业。",
  "price_status": "not found",
  "source_url": "https://example.com/sample-004",
  "checked_at": "2026-09-29",
  "confidence": "low",
  "status": "sample"
}
```

真实数据把 `status` 改为 `pending` 或 `verified`，去掉名称中的「示例」字样，来源链接换成企业官网页面即可。
