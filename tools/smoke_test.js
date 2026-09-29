/* DOM 桩冒烟测试：验证 directory.js 的加载、渲染、关键词筛选、标签筛选、空字段隐藏、状态徽章逻辑 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
process.chdir(ROOT);

function makeEl(id) {
  return {
    id,
    innerHTML: "",
    textContent: "",
    value: "",
    listeners: {},
    classList: {
      toggles: [],
      toggle(cls, force) { this.toggles.push([cls, force]); },
      add() {}, remove() {},
    },
    addEventListener(type, fn) { this.listeners[type] = fn; },
    setAttribute() {},
    getAttribute() { return ""; },
    querySelectorAll() { return []; },
  };
}

const els = {};
els["dataBanner"] = makeEl("dataBanner");
global.document = {
  getElementById(id) {
    if (!els[id]) els[id] = makeEl(id);
    return els[id];
  },
  querySelectorAll() { return []; },
};

// 预先给 tagRow 装上按钮桩，renderTagRow 会在 fetch 回调里调用
const tagHandlers = {};
els["tagRow"] = makeEl("tagRow");
els["tagRow"].querySelectorAll = function (sel) {
  return ["", "中试", "发酵", "代工", "菌种", "检测"].map(function (t) {
    return {
      getAttribute: function (a) { return a === "data-tag" ? t : null; },
      addEventListener: function (type, fn) { tagHandlers[t || "全部"] = fn; },
    };
  });
};

const json = JSON.parse(fs.readFileSync("data/companies.json", "utf8"));
global.fetch = function () {
  return Promise.resolve({ ok: true, json: function () { return Promise.resolve(json); } });
};

require(path.join(ROOT, "assets", "directory.js"));

let failed = 0;
function assert(name, cond) {
  console.log((cond ? "PASS" : "FAIL") + "  " + name);
  if (!cond) failed++;
}

setTimeout(function () {
  const list = els["companyList"].innerHTML;

  assert("渲染 3 张企业卡", (list.match(/company-card/g) || []).length === 3);
  assert("没有示例数据标记", (list.match(/sample-flag/g) || []).length === 0);
  assert("3 个「待核验」状态徽章", (list.match(/待核验/g) || []).length === 3);
  assert("3 条来源链接", (list.match(/信息来源/g) || []).length === 3);
  assert("空字段不显示：官网联系页只有 2 条", (list.match(/官网联系页/g) || []).length === 2);
  assert("核验日期出现 3 次", (list.match(/核验于 2026-09-29/g) || []).length === 3);
  assert("价格状态显示「未发现公开价格」", (list.match(/未发现公开价格/g) || []).length === 3);
  assert("企业名称正确渲染", list.indexOf("四川厌氧生物科技有限责任公司") !== -1 && list.indexOf("微康益生菌（苏州）股份有限公司") !== -1 && list.indexOf("谱尼测试集团股份有限公司") !== -1);

  const count = els["resultCount"].textContent;
  assert("计数文案正确且不含示例提示", count.indexOf("显示 3 / 3 条") !== -1 && count.indexOf("示例") === -1);

  // 无示例数据时，横幅不应被改写（保持「整理自公开来源」的静态文案）
  assert("无示例数据时横幅未被注入示例警告", (els["dataBanner"].innerHTML.match(/示例数据/) || []).length === 0);

  // 关键词筛选
  els["keyword"].value = "北京";
  els["keyword"].listeners["input"]();
  const list2 = els["companyList"].innerHTML;
  assert("关键词「北京」筛出谱尼 1 条", (list2.match(/company-card/g) || []).length === 1 && list2.indexOf("谱尼测试集团股份有限公司") !== -1);

  els["keyword"].value = "不存在的关键词";
  els["keyword"].listeners["input"]();
  assert("无匹配时列表清空", els["companyList"].innerHTML === "");
  const emptyToggled = els["emptyState"].classList.toggles.some(function (t) { return t[0] === "hidden" && t[1] === false; });
  assert("无匹配时空状态显示", emptyToggled);

  // 标签筛选
  els["keyword"].value = "";
  tagHandlers["检测"]();
  const list3 = els["companyList"].innerHTML;
  assert("标签「检测」筛出 1 条", (list3.match(/company-card/g) || []).length === 1 && list3.indexOf("谱尼") !== -1);

  tagHandlers["中试"]();
  const list4 = els["companyList"].innerHTML;
  assert("标签「中试」筛出四川厌氧 1 条", (list4.match(/company-card/g) || []).length === 1 && list4.indexOf("四川厌氧") !== -1);

  tagHandlers["全部"]();
  const list5 = els["companyList"].innerHTML;
  assert("「全部」恢复 3 条", (list5.match(/company-card/g) || []).length === 3);

  // 关键词 + 标签组合
  els["keyword"].value = "苏州";
  els["keyword"].listeners["input"]();
  tagHandlers["检测"]();
  assert("「苏州」+「检测」组合无匹配", els["companyList"].innerHTML === "");

  console.log(failed === 0 ? "\n全部通过" : "\n有 " + failed + " 项失败");
  process.exit(failed === 0 ? 0 : 1);
}, 100);
