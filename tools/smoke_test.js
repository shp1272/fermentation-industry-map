/* DOM 桩冒烟测试：验证 directory.js 的加载、渲染、关键词筛选、标签筛选、空字段隐藏逻辑 */
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
    toggles: [],
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
global.document = {
  getElementById(id) {
    if (!els[id]) els[id] = makeEl(id);
    return els[id];
  },
  querySelectorAll() { return []; },
};

// 预先给 tagRow 装上按钮桩（data-tag 对应 全部/中试/代工/检测），renderTagRow 会在 fetch 回调里调用
const tagHandlers = {};
els["tagRow"] = makeEl("tagRow");
els["tagRow"].querySelectorAll = function (sel) {
  return ["", "中试", "代工", "检测"].map(function (t) {
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
  assert("3 个「示例数据」标记", (list.match(/sample-flag/g) || []).length === 3);
  assert("3 条来源链接", (list.match(/信息来源/g) || []).length === 3);
  assert("空字段不显示：只有 1 条官网联系页", (list.match(/官网联系页/g) || []).length === 1);
  assert("核验日期出现 3 次", (list.match(/核验于 2026-09-29/g) || []).length === 3);
  assert("价格状态徽章有中文标签", list.indexOf("未发现公开价格") !== -1 && list.indexOf("需询价") !== -1);

  const count = els["resultCount"].textContent;
  assert("计数文案正确", count.indexOf("显示 3 / 3 条") !== -1 && count.indexOf("示例数据 3 条") !== -1);

  // 关键词筛选（通过捕获的 input 监听器触发）
  els["keyword"].value = "上海";
  els["keyword"].listeners["input"]();
  const list2 = els["companyList"].innerHTML;
  assert("关键词「上海」筛出 1 条检测样例", (list2.match(/company-card/g) || []).length === 1 && list2.indexOf("示例数据·检测服务样例") !== -1);

  els["keyword"].value = "不存在的关键词";
  els["keyword"].listeners["input"]();
  assert("无匹配时列表清空", els["companyList"].innerHTML === "");
  const emptyToggled = els["emptyState"].classList.toggles.some(function (t) { return t[0] === "hidden" && t[1] === false; });
  assert("无匹配时空状态显示", emptyToggled);

  // 标签筛选（触发「代工」按钮桩）
  els["keyword"].value = "";
  tagHandlers["代工"]();
  const list3 = els["companyList"].innerHTML;
  assert("标签「代工」筛出 1 条", (list3.match(/company-card/g) || []).length === 1 && list3.indexOf("示例数据·代工服务样例") !== -1);

  tagHandlers["全部"]();
  const list4 = els["companyList"].innerHTML;
  assert("「全部」恢复 3 条", (list4.match(/company-card/g) || []).length === 3);

  // 关键词 + 标签组合
  els["keyword"].value = "大连";
  els["keyword"].listeners["input"]();
  tagHandlers["中试"]();
  assert("「大连」+「中试」组合无匹配", els["companyList"].innerHTML === "");

  // fetch 失败场景
  global.fetch = function () { return Promise.reject(new Error("blocked")); };
  assert("错误横幅元素存在", !!els["loadError"]);

  console.log(failed === 0 ? "\n全部通过" : "\n有 " + failed + " 项失败");
  process.exit(failed === 0 ? 0 : 1);
}, 100);
