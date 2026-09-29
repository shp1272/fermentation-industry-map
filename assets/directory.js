/* 企业目录页脚本：加载 companies.json，渲染标签筛选和关键词搜索 */
(function () {
  "use strict";

  var PRICE_LABELS = {
    "public": "价格公开",
    "price": "有报价信息",
    "quote required": "需询价",
    "not found": "未发现公开价格"
  };
  var PRICE_CLASS = {
    "public": "price-public",
    "price": "price-other",
    "quote required": "price-quote",
    "not found": "price-none"
  };
  var CONF_LABELS = { "high": "可信度高", "medium": "可信度中", "low": "可信度低" };
  var CONF_CLASS = { "high": "conf-high", "medium": "conf-medium", "low": "conf-low" };
  var STATUS_LABELS = { "pending": "待核验", "verified": "已核验" };

  var companies = [];
  var activeTag = null;

  var listEl = document.getElementById("companyList");
  var countEl = document.getElementById("resultCount");
  var emptyEl = document.getElementById("emptyState");
  var errorEl = document.getElementById("loadError");
  var tagRowEl = document.getElementById("tagRow");
  var keywordEl = document.getElementById("keyword");

  function esc(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function uniqueTags(list) {
    var seen = {};
    var tags = [];
    list.forEach(function (card) {
      (card.service_tags || []).forEach(function (tag) {
        if (tag && !seen[tag]) {
          seen[tag] = true;
          tags.push(tag);
        }
      });
    });
    return tags;
  }

  function renderTagRow() {
    var tags = uniqueTags(companies);
    var html = '<button type="button" class="tag-btn' + (activeTag === null ? " on" : "") + '" data-tag="">全部</button>';
    tags.forEach(function (tag) {
      html += '<button type="button" class="tag-btn' + (activeTag === tag ? " on" : "") + '" data-tag="' + esc(tag) + '">' + esc(tag) + "</button>";
    });
    tagRowEl.innerHTML = html;

    tagRowEl.querySelectorAll(".tag-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        activeTag = btn.getAttribute("data-tag") || null;
        renderTagRow();
        renderList();
      });
    });
  }

  function cardHtml(card) {
    var isSample = card.status === "sample";
    var html = '<article class="company-card' + (isSample ? " is-sample" : "") + '">';
    if (isSample) {
      html += '<div class="sample-flag">示例数据</div>';
    }
    html += '<h3 class="company-name">' + esc(card.name) + "</h3>";
    html += '<p class="company-city">' + esc(card.city) + "</p>";
    html += '<p class="company-capability">' + esc(card.public_capability) + "</p>";
    html += '<div class="company-meta">';
    html += '<span class="tag-list">' + (card.service_tags || []).map(function (t) {
      return '<span class="tag">' + esc(t) + "</span>";
    }).join("") + "</span>";
    if (card.price_status && PRICE_LABELS[card.price_status]) {
      html += '<span class="badge ' + (PRICE_CLASS[card.price_status] || "price-none") + '">' + PRICE_LABELS[card.price_status] + "</span>";
    }
    if (card.confidence && CONF_LABELS[card.confidence]) {
      html += '<span class="badge ' + (CONF_CLASS[card.confidence] || "conf-low") + '">' + CONF_LABELS[card.confidence] + "</span>";
    }
    if (!isSample && card.status && STATUS_LABELS[card.status]) {
      html += '<span class="badge ' + (card.status === "verified" ? "conf-high" : "conf-medium") + '">' + STATUS_LABELS[card.status] + "</span>";
    }
    html += '<span class="src-link"><a href="' + esc(card.source_url) + '" target="_blank" rel="noopener noreferrer">信息来源 ↗</a></span>';
    if (card.contact_url) {
      html += '<span class="src-link"><a href="' + esc(card.contact_url) + '" target="_blank" rel="noopener noreferrer">官网联系页 ↗</a></span>';
    }
    if (card.checked_at) {
      html += "<span>核验于 " + esc(card.checked_at) + "</span>";
    }
    html += "</div></article>";
    return html;
  }

  function renderList() {
    var kw = keywordEl.value.trim().toLowerCase();
    var shown = companies.filter(function (card) {
      var tagOk = activeTag === null || (card.service_tags || []).indexOf(activeTag) !== -1;
      if (!tagOk) return false;
      if (!kw) return true;
      var haystack = [card.name, card.city, card.public_capability].join(" ").toLowerCase();
      return haystack.indexOf(kw) !== -1;
    });

    listEl.innerHTML = shown.map(cardHtml).join("");

    var sampleCount = shown.filter(function (c) { return c.status === "sample"; }).length;
    var countText = "显示 " + shown.length + " / " + companies.length + " 条";
    if (sampleCount > 0) {
      countText += "，其中示例数据 " + sampleCount + " 条";
    }
    countEl.textContent = countText;

    emptyEl.classList.toggle("hidden", shown.length !== 0);
  }

  function init() {
    fetch("data/companies.json")
      .then(function (resp) {
        if (!resp.ok) throw new Error("HTTP " + resp.status);
        return resp.json();
      })
      .then(function (data) {
        if (!Array.isArray(data)) throw new Error("数据格式不是数组");
        companies = data;
        var sampleCount = data.filter(function (c) { return c.status === "sample"; }).length;
        if (sampleCount > 0) {
          var bannerEl = document.getElementById("dataBanner");
          bannerEl.innerHTML = "<div><strong>目录内有 " + sampleCount + " 条示例数据</strong>示例数据为演示用虚构卡片，不代表真实企业；其余为官网公开信息，每条均可点开来源核对。</div>";
        }
        renderTagRow();
        renderList();
      })
      .catch(function () {
        listEl.innerHTML = "";
        countEl.textContent = "";
        errorEl.classList.remove("hidden");
      });

    keywordEl.addEventListener("input", renderList);
  }

  init();
})();
