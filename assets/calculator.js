/* 发酵计算器脚本：接种量 / 稀释 / 配液，输入带单位、错误提示 */
(function () {
  "use strict";

  /* ---------- 工具 ---------- */

  function $(id) { return document.getElementById(id); }

  function fmt(num, maxDec) {
    var fixed = num.toFixed(maxDec);
    return fixed.replace(/\.?0+$/, "");
  }

  function readNumber(id) {
    var raw = $(id).value.trim();
    if (raw === "") return { error: "请输入数字" };
    var num = Number(raw);
    if (!isFinite(num)) return { error: "请输入数字" };
    if (num <= 0) return { error: "必须大于 0" };
    return { value: num };
  }

  function setError(id, message) {
    $(id).textContent = message || "";
  }

  function clearErrorOnInput(ids) {
    ids.forEach(function (id) {
      $(id).addEventListener("input", function () { setError(id + "Err", ""); });
    });
  }

  function showResult(panelId, html) {
    var el = $(panelId);
    el.innerHTML = html;
    el.classList.remove("hidden");
  }

  function hideResult(panelId) {
    $(panelId).classList.add("hidden");
  }

  function resultNote() {
    return '<p class="result-note">结果仅供参考，请自行复核；正式生产按企业规范执行。</p>';
  }

  /* ---------- 三个计算 ---------- */

  function calcInoc() {
    var v = readNumber("inocV");
    var r = readNumber("inocR");
    var ok = true;
    setError("inocVErr", v.error || "");
    if (v.error) ok = false;
    setError("inocRErr", r.error || "");
    if (r.error) ok = false;
    if (r.value !== undefined && r.value > 100) {
      setError("inocRErr", "接种比例应在 0–100 之间");
      ok = false;
    }
    if (!ok) { hideResult("inocResult"); return; }

    var unit = $("inocVUnit").value;
    var seed = v.value * r.value / 100; // 与输入同单位
    var main, alt;
    if (unit === "L") {
      main = fmt(seed, 4) + " L";
      alt = "约 " + fmt(seed * 1000, 1) + " mL";
    } else {
      main = fmt(seed, 2) + " mL";
      alt = "约 " + fmt(seed / 1000, 4) + " L";
    }
    showResult("inocResult",
      '<p class="result-note">需准备接种液</p>' +
      '<div class="result-main">' + main + "</div>" +
      '<p class="result-note">' + alt + " · " +
      "接种液体积 = 发酵液体积 × 接种比例 ÷ 100</p>" + resultNote());
  }

  function calcDilute() {
    var c1 = readNumber("dilC1");
    var c2 = readNumber("dilC2");
    var v2 = readNumber("dilV2");
    var ok = true;
    setError("dilC1Err", c1.error || "");
    if (c1.error) ok = false;
    setError("dilC2Err", c2.error || "");
    if (c2.error) ok = false;
    setError("dilV2Err", v2.error || "");
    if (v2.error) ok = false;
    if (c1.value !== undefined && c2.value !== undefined && c2.value >= c1.value) {
      setError("dilC2Err", "稀释后浓度必须小于母液浓度");
      ok = false;
    }
    if (!ok) { hideResult("dilResult"); return; }

    var unit = $("dilV2Unit").value;
    var take = c2.value * v2.value / c1.value; // 与目标体积同单位
    var add = v2.value - take;
    showResult("dilResult",
      '<p class="result-note">取母液</p>' +
      '<div class="result-main">' + fmt(take, 3) + " " + unit + "</div>" +
      '<p class="result-note">再补溶剂 ' + fmt(add, 3) + " " + unit + "，定容至 " + fmt(v2.value, 3) + " " + unit +
      "。取母液体积 = 目标浓度 × 目标体积 ÷ 母液浓度</p>" + resultNote());
  }

  function calcPrep() {
    var c = readNumber("prepC");
    var v = readNumber("prepV");
    var ok = true;
    setError("prepCErr", c.error || "");
    if (c.error) ok = false;
    setError("prepVErr", v.error || "");
    if (v.error) ok = false;
    if (!ok) { hideResult("prepResult"); return; }

    var cUnit = $("prepCUnit").value;
    var vUnit = $("prepVUnit").value;
    var massG;
    if (cUnit === "g/L") {
      massG = vUnit === "L" ? c.value * v.value : c.value * v.value / 1000;
    } else if (cUnit === "mg/mL") {
      massG = vUnit === "mL" ? c.value * v.value / 1000 : c.value * v.value;
    } else { // %（质量体积比）= g/100mL
      massG = vUnit === "L" ? c.value * v.value * 10 : c.value * v.value / 100;
    }
    showResult("prepResult",
      '<p class="result-note">需称取溶质</p>' +
      '<div class="result-main">' + fmt(massG, 4) + " g</div>" +
      '<p class="result-note">即 ' + fmt(massG * 1000, 2) + " mg。溶质质量 = 浓度 × 体积，按所选单位换算</p>" + resultNote());
  }

  /* ---------- 标签页切换 ---------- */

  function switchTab(name) {
    document.querySelectorAll(".calc-tab").forEach(function (tab) {
      var on = tab.getAttribute("data-tab") === name;
      tab.classList.toggle("on", on);
      tab.setAttribute("aria-selected", on ? "true" : "false");
    });
    document.querySelectorAll(".calc-panel").forEach(function (panel) {
      panel.classList.toggle("on", panel.id === "panel-" + name);
    });
  }

  /* ---------- 初始化 ---------- */

  function init() {
    document.querySelectorAll(".calc-tab").forEach(function (tab) {
      tab.addEventListener("click", function () { switchTab(tab.getAttribute("data-tab")); });
    });
    document.querySelectorAll(".btn-calc").forEach(function (btn) {
      var name = btn.getAttribute("data-calc");
      btn.addEventListener("click", function () {
        if (name === "inoc") calcInoc();
        else if (name === "dilute") calcDilute();
        else if (name === "prep") calcPrep();
      });
    });
    clearErrorOnInput(["inocV", "inocR", "dilC1", "dilC2", "dilV2", "prepC", "prepV"]);
  }

  init();
})();
