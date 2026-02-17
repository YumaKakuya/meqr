(function () {
  "use strict";

  const PROFILES_KEY = "meqr_profiles_v3";
  const CURRENT_PROFILE_KEY = "meqr_current_profile";
  const THEME_KEY = "meqr_theme";
  const ONBOARDING_KEY = "meqr_onboarding_completed";

  /** @type {ReturnType<typeof createQRCodeInstance> | null} */
  let qrInstance = null;
  let currentProfileId = null;

  // ---------- トースト・カスタムダイアログ（alert/confirm 代替） ----------
  function showToast(message, type) {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = "toast" + (type ? " toast-" + type : "");
    toast.textContent = message;
    container.appendChild(toast);
    const t = setTimeout(() => {
      toast.remove();
    }, 4000);
    toast.addEventListener("click", () => {
      clearTimeout(t);
      toast.remove();
    });
  }

  function showConfirm(message, options) {
    return new Promise(function (resolve) {
      const overlay = document.getElementById("dialog-overlay");
      const titleEl = document.getElementById("dialog-title");
      const messageEl = document.getElementById("dialog-message");
      const inputEl = document.getElementById("dialog-input");
      const actionsEl = document.getElementById("dialog-actions");
      if (!overlay || !titleEl || !messageEl || !actionsEl) {
        resolve(false);
        return;
      }
      const title = (options && options.title) || "確認";
      const confirmText = (options && options.confirmText) || "OK";
      const cancelText = (options && options.cancelText) || "キャンセル";
      inputEl.style.display = "none";
      titleEl.textContent = title;
      messageEl.textContent = message;
      messageEl.style.display = "";
      actionsEl.innerHTML = "";
      const cancelBtn = document.createElement("button");
      cancelBtn.type = "button";
      cancelBtn.className = "dialog-btn dialog-btn-secondary";
      cancelBtn.textContent = cancelText;
      cancelBtn.addEventListener("click", () => {
        overlay.classList.remove("active");
        overlay.setAttribute("aria-hidden", "true");
        resolve(false);
      });
      const okBtn = document.createElement("button");
      okBtn.type = "button";
      okBtn.className = "dialog-btn dialog-btn-primary";
      okBtn.textContent = confirmText;
      okBtn.addEventListener("click", () => {
        overlay.classList.remove("active");
        overlay.setAttribute("aria-hidden", "true");
        resolve(true);
      });
      actionsEl.appendChild(cancelBtn);
      actionsEl.appendChild(okBtn);
      overlay.classList.add("active");
      overlay.setAttribute("aria-hidden", "false");
    });
  }

  function showPrompt(message, defaultValue, options) {
    return new Promise(function (resolve) {
      const overlay = document.getElementById("dialog-overlay");
      const titleEl = document.getElementById("dialog-title");
      const messageEl = document.getElementById("dialog-message");
      const inputEl = document.getElementById("dialog-input");
      const actionsEl = document.getElementById("dialog-actions");
      if (!overlay || !titleEl || !messageEl || !inputEl || !actionsEl) {
        resolve(null);
        return;
      }
      const title = (options && options.title) || "入力";
      const confirmText = (options && options.confirmText) || "OK";
      const cancelText = (options && options.cancelText) || "キャンセル";
      titleEl.textContent = title;
      messageEl.textContent = message;
      messageEl.style.display = "";
      inputEl.style.display = "block";
      inputEl.value = defaultValue != null ? String(defaultValue) : "";
      inputEl.focus();
      actionsEl.innerHTML = "";
      const cancelBtn = document.createElement("button");
      cancelBtn.type = "button";
      cancelBtn.className = "dialog-btn dialog-btn-secondary";
      cancelBtn.textContent = cancelText;
      cancelBtn.addEventListener("click", () => {
        overlay.classList.remove("active");
        overlay.setAttribute("aria-hidden", "true");
        resolve(null);
      });
      const okBtn = document.createElement("button");
      okBtn.type = "button";
      okBtn.className = "dialog-btn dialog-btn-primary";
      okBtn.textContent = confirmText;
      okBtn.addEventListener("click", () => {
        const val = inputEl.value.trim();
        overlay.classList.remove("active");
        overlay.setAttribute("aria-hidden", "true");
        resolve(val || null);
      });
      inputEl.onkeydown = function (e) {
        if (e.key === "Enter") okBtn.click();
        if (e.key === "Escape") cancelBtn.click();
      };
      actionsEl.appendChild(cancelBtn);
      actionsEl.appendChild(okBtn);
      overlay.classList.add("active");
      overlay.setAttribute("aria-hidden", "false");
    });
  }

  function createQRCodeInstance() {
    const qrContainer = document.getElementById("qrcode");
    qrContainer.innerHTML = "";
    // Ensure UTF-8 encoding for non-ASCII names.
    if (globalThis.qrcode && globalThis.qrcode.stringToBytesFuncs && globalThis.qrcode.stringToBytesFuncs["UTF-8"]) {
      globalThis.qrcode.stringToBytes = globalThis.qrcode.stringToBytesFuncs["UTF-8"];
    }

    return {
      clear() {
        qrContainer.innerHTML = "";
      },
      makeCode(text) {
        if (typeof globalThis.qrcode !== "function") {
          throw new Error("QR library (qrcode-generator) is not loaded.");
        }

        const qr = globalThis.qrcode(0, "L");
        qr.addData(String(text || ""), "Byte");
        qr.make();

        // Use CSS variables for QR colors
        const DARK = getComputedStyle(document.documentElement).getPropertyValue('--qr-dark').trim();
        const LIGHT = getComputedStyle(document.documentElement).getPropertyValue('--qr-light').trim();

        let svg = qr.createSvgTag({ cellSize: 4, margin: 1, scalable: true });
        // Replace default black/white colors to match UI.
        svg = svg
          .replace(/fill=\"white\"/g, `fill=\"${LIGHT}\"`)
          .replace(/fill=\"black\"/g, `fill=\"${DARK}\"`);

        qrContainer.innerHTML = svg;
        const svgEl = qrContainer.querySelector("svg");
        if (svgEl) {
          svgEl.setAttribute("width", "100%");
          svgEl.setAttribute("height", "100%");
          svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");
        }
      }
    };
  }

  function normalizePhone(phone) {
    if (!phone) return "";
    return phone.replace(/[^\d+]/g, "");
  }

  function escapeVCardValue(value) {
    if (!value) return "";
    return String(value)
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");
  }

  function buildVCard(data) {
    const ln = (line) => line + "\r\n";
    const lastName = data.lastName || "";
    const firstName = data.firstName || "";
    const phone = normalizePhone(data.phone || "");
    const email = data.email || "";
    const org = data.org || "";
    const title = data.title || "";
    const url = data.url || "";
    const sns1 = data.sns1 || "";
    const sns2 = data.sns2 || "";

    const fullName = (lastName + " " + firstName).trim() || "My Contact";

    let v = "";
    v += ln("BEGIN:VCARD");
    v += ln("VERSION:3.0");
    // Outlook など一部クライアントでの文字化け対策として、UTF-8 を明示
    v += ln("N;CHARSET=UTF-8:" + escapeVCardValue(lastName) + ";" + escapeVCardValue(firstName) + ";;;");
    v += ln("FN;CHARSET=UTF-8:" + escapeVCardValue(fullName));

    if (org) {
      v += ln("ORG;CHARSET=UTF-8:" + escapeVCardValue(org));
    }

    if (title) {
      v += ln("TITLE;CHARSET=UTF-8:" + escapeVCardValue(title));
    }

    if (phone) {
      v += ln("TEL;TYPE=CELL,VOICE:" + escapeVCardValue(phone));
    }

    if (email) {
      v += ln("EMAIL;TYPE=INTERNET:" + escapeVCardValue(email));
    }

    if (url) {
      v += ln("URL;TYPE=HOME:" + escapeVCardValue(url));
    }

    if (sns1) {
      v += ln("URL;TYPE=SNS:" + escapeVCardValue(sns1));
    }

    if (sns2) {
      v += ln("URL;TYPE=SNS2:" + escapeVCardValue(sns2));
    }

    v += ln("END:VCARD");
    return v;
  }

  // === Profile Management Functions ===

  function getAllProfiles() {
    try {
      const raw = localStorage.getItem(PROFILES_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (e) {
      console.error("Failed to load profiles", e);
      return [];
    }
  }

  function saveAllProfiles(profiles) {
    try {
      localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    } catch (e) {
      console.error("Failed to save profiles", e);
      showToast("プロファイルの保存に失敗しました。", "error");
    }
  }

  function getCurrentProfileId() {
    if (currentProfileId) return currentProfileId;
    const saved = localStorage.getItem(CURRENT_PROFILE_KEY);
    return saved || null;
  }

  function setCurrentProfileId(id) {
    currentProfileId = id;
    localStorage.setItem(CURRENT_PROFILE_KEY, id);
  }

  function createNewProfile(name = "新しい名刺") {
    const profiles = getAllProfiles();
    const newProfile = {
      id: Date.now().toString(),
      name: name,
      data: {
        lastName: "",
        firstName: "",
        phone: "",
        email: "",
        org: "",
        title: "",
        url: "",
        photo: "",
        sns1: "",
        sns2: ""
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    profiles.push(newProfile);
    saveAllProfiles(profiles);
    return newProfile;
  }

  function loadCurrentProfile() {
    const profiles = getAllProfiles();
    if (profiles.length === 0) {
      // Create default profile
      const defaultProfile = createNewProfile("メイン名刺");
      setCurrentProfileId(defaultProfile.id);
      setSyncStatus("empty");
      return defaultProfile.data;
    }

    let profileId = getCurrentProfileId();
    let profile = profiles.find(p => p.id === profileId);

    if (!profile) {
      profile = profiles[0];
      setCurrentProfileId(profile.id);
    }

    setSyncStatus("saved");
    return profile.data;
  }

  function saveCurrentProfile(data) {
    const profiles = getAllProfiles();
    const profileId = getCurrentProfileId();

    const profileIndex = profiles.findIndex(p => p.id === profileId);
    if (profileIndex === -1) {
      console.error("Current profile not found");
      return;
    }

    profiles[profileIndex].data = data;
    profiles[profileIndex].updatedAt = new Date().toISOString();
    saveAllProfiles(profiles);
    setSyncStatus("saved");
  }

  function switchProfile(profileId) {
    const profiles = getAllProfiles();
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) {
      showToast("名刺が見つかりません。", "error");
      return;
    }

    setCurrentProfileId(profileId);
    fillDisplay(profile.data);
    fillForm(profile.data);
    regenerateQR(profile.data);
    updateProfileSelector();
    drawPreviewCanvas(profile.data);
  }

  function deleteProfile(profileId) {
    const profiles = getAllProfiles();
    if (profiles.length <= 1) {
      showToast("最後の名刺は削除できません。", "error");
      return;
    }

    const index = profiles.findIndex(p => p.id === profileId);
    if (index === -1) return;

    showConfirm(`「${profiles[index].name}」を削除しますか？この操作は取り消せません。`, { title: "名刺を削除" }).then(function (confirmDelete) {
      if (!confirmDelete) return;
      profiles.splice(index, 1);
      saveAllProfiles(profiles);
      if (profileId === getCurrentProfileId()) {
        switchProfile(profiles[0].id);
      }
      updateProfileSelector();
    });
  }

  function renameProfile(profileId, newName) {
    const profiles = getAllProfiles();
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;

    profile.name = newName;
    profile.updatedAt = new Date().toISOString();
    saveAllProfiles(profiles);
    updateProfileSelector();
  }

  // Legacy compatibility: migrate old data
  function migrateOldData() {
    const OLD_KEY = "meqr_contact_v2";
    const oldData = localStorage.getItem(OLD_KEY);
    if (!oldData) return;

    try {
      const parsed = JSON.parse(oldData);
      const profiles = getAllProfiles();
      if (profiles.length === 0) {
        const migratedProfile = createNewProfile("メインプロファイル");
        migratedProfile.data = parsed;
        saveAllProfiles([migratedProfile]);
        setCurrentProfileId(migratedProfile.id);
      }
      localStorage.removeItem(OLD_KEY);
    } catch (e) {
      console.error("Migration failed", e);
    }
  }

  function setSyncStatus(state) {
    const label = document.getElementById("syncStatusLabel");
    if (!label) return;
    switch (state) {
      case "saved":
        label.textContent = "ローカル保存済み";
        break;
      case "empty":
        label.textContent = "未設定（編集から登録）";
        break;
      case "error":
        label.textContent = "保存エラー";
        break;
      default:
        label.textContent = "";
    }
  }

  function fillDisplay(data) {
    const displayName = document.getElementById("displayName");
    const displayOrgRole = document.getElementById("displayOrgRole");
    const displayPhoneEmail = document.getElementById("displayPhoneEmail");
    const displayUrl = document.getElementById("displayUrl");
    const displayPhoto = document.getElementById("displayPhoto");
    const photoPlaceholder = document.getElementById("photoPlaceholder");

    const lastName = data.lastName || "";
    const firstName = data.firstName || "";
    const phone = data.phone || "";
    const email = data.email || "";
    const org = data.org || "";
    const title = data.title || "";
    const url = data.url || "";
    const photo = data.photo || "";

    displayName.textContent = (lastName + " " + firstName).trim() || "あなたの名前";

    const orgRoleParts = [];
    if (org) orgRoleParts.push(org);
    if (title) orgRoleParts.push(title);
    displayOrgRole.textContent = orgRoleParts.join(" / ") || "組織 / 役職";

    const contactParts = [];
    if (phone) contactParts.push(phone);
    if (email) contactParts.push(email);
    displayPhoneEmail.textContent = contactParts.join(" / ") || "電話 / メール";

    displayUrl.textContent = url || "URL（ポートフォリオ・SNSなど）";

    // Display photo
    if (photo && displayPhoto && photoPlaceholder) {
      displayPhoto.src = photo;
      displayPhoto.style.display = "block";
      photoPlaceholder.style.display = "none";
    } else if (displayPhoto && photoPlaceholder) {
      displayPhoto.src = "";
      displayPhoto.style.display = "none";
      photoPlaceholder.style.display = "flex";
    }
  }

  function fillForm(data) {
    document.getElementById("lastName").value = data.lastName || "";
    document.getElementById("firstName").value = data.firstName || "";
    document.getElementById("phone").value = data.phone || "";
    document.getElementById("email").value = data.email || "";
    document.getElementById("org").value = data.org || "";
    document.getElementById("title").value = data.title || "";
    document.getElementById("url").value = data.url || "";

    const sns1Input = document.getElementById("sns1");
    const sns2Input = document.getElementById("sns2");
    if (sns1Input) sns1Input.value = data.sns1 || "";
    if (sns2Input) sns2Input.value = data.sns2 || "";
  }


  function readForm() {
    const currentData = loadCurrentProfile() || {};

    const sns1Input = document.getElementById("sns1");
    const sns2Input = document.getElementById("sns2");

    return {
      lastName: document.getElementById("lastName").value.trim(),
      firstName: document.getElementById("firstName").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      email: document.getElementById("email").value.trim(),
      org: document.getElementById("org").value.trim(),
      title: document.getElementById("title").value.trim(),
      url: document.getElementById("url").value.trim(),
      photo: currentData.photo || "",
      sns1: sns1Input ? sns1Input.value.trim() : "",
      sns2: sns2Input ? sns2Input.value.trim() : ""
    };
  }

  function regenerateQR(data) {
    if (!qrInstance) {
      qrInstance = createQRCodeInstance();
    }
    const vcardText = buildVCard(data);
    qrInstance.clear();
    try {
      // Primary: try vCard
      qrInstance.makeCode(vcardText);
    } catch (err) {
      console.warn("vCard QR generation failed, attempting MECARD fallback:", err);
      // Fallback: use MECARD (shorter) to reduce data size
      try {
        const mecard = buildMECARD(data);
        qrInstance.makeCode(mecard);
        showToast("vCard が大きすぎたため、短縮形式（MECARD）で QR を生成しました。表示やインポート時に一部情報が異なる場合があります。", "info");
      } catch (err2) {
        console.error("MECARD fallback also failed:", err2);
        showToast("QR を生成できませんでした。入力内容を短くしてください。", "error");
      }
    }
  }

  function buildMECARD(data) {
    // MECARD is more compact than full vCard and widely supported by scanners
    const escape = (s) => (s || "").replace(/[:;\\,]/g, "\\$&");
    const fullName = ((data.lastName || "") + " " + (data.firstName || "")).trim();
    const parts = [];
    if (fullName) parts.push("N:" + escape(fullName));
    if (data.org) parts.push("ORG:" + escape(data.org));
    if (data.phone) parts.push("TEL:" + escape(normalizePhone(data.phone)));
    if (data.email) parts.push("EMAIL:" + escape(data.email));
    if (data.url) parts.push("URL:" + escape(data.url));
    // MECARD format: MECARD:...;;
    return "MECARD:" + parts.join(";") + ";;";
  }

  // ---------- デザインテンプレート（5種類）とプレビュー・PDF ----------
  const TEMPLATE_KEY = "meqr_design_template";
  const DESIGN_TEMPLATES = [
    { id: "washi", name: "Washi（和紙風）", bg: "#F5F0E6", accent: "#5C4033", border: "#8B7355", text: "#2C1810" },
    { id: "botanical", name: "Botanical（植物）", bg: "#E8F4E8", accent: "#2D5A27", border: "#4A7C43", text: "#1A3318" },
    { id: "minimal", name: "Minimal（ミニマル）", bg: "#FFFFFF", accent: "#2E5077", border: "#2E5077", text: "#1a1a1a" },
    { id: "corporate", name: "Corporate（コーポレート）", bg: "#F0F2F5", accent: "#1e293b", border: "#334155", text: "#0f172a" },
    { id: "gradient", name: "Gradient（グラデーション）", bg: "linear", bgFrom: "#2E5077", bgTo: "#4a7ba7", accent: "#FCF6E5", border: "#FCF6E5", text: "#FCF6E5" }
  ];

  function getCurrentTemplateId() {
    return localStorage.getItem(TEMPLATE_KEY) || "minimal";
  }

  function setCurrentTemplateId(id) {
    localStorage.setItem(TEMPLATE_KEY, id);
  }

  // Helper function to calculate canvas size for business card at given DPI
  function getBusinessCardPixelSize(dpi) {
    const cardWmm = 91; // Japanese standard business card width
    const cardHmm = 55; // Japanese standard business card height
    const mmToInch = 1 / 25.4;
    return {
      width: Math.round(cardWmm * mmToInch * dpi),
      height: Math.round(cardHmm * mmToInch * dpi)
    };
  }

  let previewTimeout = null;
  function schedulePreviewUpdate() {
    if (previewTimeout) clearTimeout(previewTimeout);
    previewTimeout = setTimeout(function () {
      previewTimeout = null;
      const data = readForm();
      drawPreviewCanvas(data);
    }, 280);
  }

  function drawPreviewCanvas(data) {
    const canvas = document.getElementById("preview-canvas");
    const wrap = document.getElementById("preview-canvas-wrap");
    if (!canvas || !wrap) return;

    // Set high-resolution canvas size (300 DPI)
    const size = getBusinessCardPixelSize(300);
    canvas.width = size.width;
    canvas.height = size.height;

    const ctx = canvas.getContext("2d");
    const w = canvas.width;   // ~1075px at 300dpi
    const h = canvas.height;  // ~650px  at 300dpi

    const tid = getCurrentTemplateId();
    const t = DESIGN_TEMPLATES.find(function (x) { return x.id === tid; }) || DESIGN_TEMPLATES[2];
    ctx.clearRect(0, 0, w, h);

    // ── Background ──
    if (t.bg === "linear" && t.bgFrom && t.bgTo) {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, t.bgFrom);
      g.addColorStop(1, t.bgTo);
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = t.bg || "#fff";
    }
    ctx.fillRect(0, 0, w, h);

    // ── Border ──
    ctx.strokeStyle = t.border || t.accent || "#aaa";
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, w - 4, h - 4);

    // ── Layout constants ──
    const marginX = Math.round(w * 0.05);
    const marginY = Math.round(h * 0.09);

    // フォントサイズ定義（全体的に大きく）
    const orgSize = Math.round(h * 0.068);  // 社名：大きく
    const titleSize = Math.round(h * 0.056);  // 役職：やや大きく
    const nameSize = Math.round(h * 0.145);  // 名前：さらに大きく
    const contactSize = Math.round(h * 0.050); // 連絡先：大きく

    const name = ((data.lastName || "") + " " + (data.firstName || "")).trim() || "山田 太郎";

    // ── 全要素の高さ合計を計算して縦方向に均等配置 ──
    const lineGap = 10;
    const orgH = orgSize + lineGap;
    const titleH = titleSize + lineGap * 2;
    const nameH = nameSize + lineGap * 2;
    const contactLines = [];
    if (data.phone) contactLines.push(data.phone);
    if (data.url) contactLines.push(data.url);
    if (data.email) contactLines.push(data.email);
    const contactLineH = contactSize + 10;
    const contactH = contactLines.length * contactLineH;

    const totalH = orgH + titleH + nameH + contactH;
    const freeSpace = h - marginY * 2 - totalH;
    const gap = Math.max(freeSpace / 4, 8);

    let cursorY = marginY + orgSize;

    // ── 1. 社名 ──
    ctx.fillStyle = t.text || "#555";
    ctx.font = orgSize + "px 'Helvetica Neue', Arial, sans-serif";
    ctx.fillText(data.org || "株式会社サンプル", marginX, cursorY);
    cursorY += orgSize + gap * 0.4;

    // ── 2. 役職 ──
    ctx.font = titleSize + "px 'Helvetica Neue', Arial, sans-serif";
    ctx.fillText(data.title || "営業部長", marginX, cursorY);
    cursorY += titleSize + gap * 0.8;

    // ── 3. 氏名（大・太字） ──
    ctx.fillStyle = t.text || "#111";
    ctx.font = "bold " + nameSize + "px 'Helvetica Neue', Arial, sans-serif";
    cursorY += nameSize * 0.85;
    ctx.fillText(name, marginX, cursorY);
    cursorY += gap * 1.2;

    // ── 4. 連絡先 ──
    ctx.fillStyle = t.text || "#333";
    ctx.font = contactSize + "px 'Helvetica Neue', Arial, sans-serif";
    // 連絡先はボトムアンカー（名刺らしく下揃え）
    const qrSize = Math.round(h * 0.30);  // QR：大きく
    const contactStartY = h - marginY - contactLines.length * contactLineH + contactSize;
    for (var i = 0; i < contactLines.length; i++) {
      ctx.fillText(contactLines[i], marginX, contactStartY + i * contactLineH);
    }

    // ── QR code（名刺用：名前＋電話のみ） ──
    const qrX = w - qrSize - marginX;
    const qrY = h - qrSize - marginY;

    // 名刺用の簡易vCard（名前＋電話のみ）を生成してQR描画
    function drawQROnCanvas(qrSvg) {
      if (!qrSvg) {
        ctx.fillStyle = "#f5f5f5";
        ctx.fillRect(qrX, qrY, qrSize, qrSize);
        ctx.strokeStyle = "#ddd";
        ctx.lineWidth = 2;
        ctx.strokeRect(qrX, qrY, qrSize, qrSize);
        ctx.fillStyle = "#bbb";
        ctx.font = Math.round(qrSize * 0.15) + "px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("QR", qrX + qrSize / 2, qrY + qrSize / 2 + qrSize * 0.05);
        ctx.textAlign = "left";
        return;
      }
      const svgStr = new XMLSerializer().serializeToString(qrSvg);
      const url = "data:image/svg+xml," + encodeURIComponent(svgStr);
      const img = new Image();
      img.onload = function () {
        ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
      };
      img.src = url;
    }

    // 名刺canvasには名前＋電話のみのQRを使う
    const cardName = name || "";
    const cardPhone = normalizePhone(data.phone || "");
    const cardVCard = "BEGIN:VCARD\r\nVERSION:3.0\r\nFN:" + cardName + "\r\n" +
      (cardPhone ? "TEL;TYPE=CELL:" + cardPhone + "\r\n" : "") +
      "END:VCARD";

    // 一時canvasでQR生成
    (function () {
      try {
        if (typeof globalThis.qrcode !== "function") { drawQROnCanvas(null); return; }
        const qr = globalThis.qrcode(0, "M");
        qr.addData(cardVCard, "Byte");
        qr.make();
        const DARK = getComputedStyle(document.documentElement).getPropertyValue('--qr-dark').trim() || "#000";
        const LIGHT = getComputedStyle(document.documentElement).getPropertyValue('--qr-light').trim() || "#fff";
        let svg = qr.createSvgTag({ cellSize: 4, margin: 1, scalable: true });
        svg = svg.replace(/fill="white"/g, 'fill="' + LIGHT + '"').replace(/fill="black"/g, 'fill="' + DARK + '"');
        const tmp = document.createElement("div");
        tmp.innerHTML = svg;
        const svgEl = tmp.querySelector("svg");
        if (svgEl) {
          svgEl.setAttribute("width", "100%");
          svgEl.setAttribute("height", "100%");
          drawQROnCanvas(svgEl);
        } else {
          drawQROnCanvas(null);
        }
      } catch (e) {
        drawQROnCanvas(null);
      }
    })();
  }

  function exportPDF350(data, templateId) {
    if (typeof jspdf === "undefined" || !jspdf.jsPDF) {
      showToast("PDFライブラリが読み込まれていません。", "error");
      return;
    }

    // Force sync with latest form data
    data = readForm();

    const tid = templateId || getCurrentTemplateId();
    const t = DESIGN_TEMPLATES.find(function (x) { return x.id === tid; }) || DESIGN_TEMPLATES[2];
    const name = ((data.lastName || "") + " " + (data.firstName || "")).trim() || "名刺";
    const orgRole = [data.org, data.title].filter(Boolean).join(" / ") || "";
    const DPI = 350;
    const scale = DPI / 72;
    const cardWmm = 90;
    const cardHmm = 55;
    const trimLen = 3;
    const pageW = cardWmm + trimLen * 4;
    const pageH = cardHmm + trimLen * 4;
    const doc = new jspdf.jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: [pageW, pageH],
      hotfixes: ["px_scaling"]
    });
    const trim = trimLen;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    const L = trim;
    const R = pageW - trim;
    const T = trim;
    const B = pageH - trim;
    doc.line(L, T, L + 5, T);
    doc.line(L, T, L, T + 5);
    doc.line(R - 5, T, R, T);
    doc.line(R, T, R, T + 5);
    doc.line(L, B - 5, L, B);
    doc.line(L, B, L + 5, B);
    doc.line(R - 5, B, R, B);
    doc.line(R, B, R, B - 5);
    doc.setFillColor(255, 255, 255);
    if (t.bg === "linear" && t.bgFrom) {
      const c = t.bgFrom.replace("#", "");
      const r = parseInt(c.substr(0, 2), 16);
      const g = parseInt(c.substr(2, 2), 16);
      const b = parseInt(c.substr(4, 2), 16);
      doc.setFillColor(r, g, b);
    } else if (t.bg && t.bg !== "linear") {
      const c = t.bg.replace("#", "");
      const r = parseInt(c.substr(0, 2), 16);
      const g = parseInt(c.substr(2, 2), 16);
      const b = parseInt(c.substr(4, 2), 16);
      doc.setFillColor(r, g, b);
    }
    doc.rect(trim * 2, trim * 2, cardWmm, cardHmm, "F");
    var bc = (t.border || "#333").replace("#", "");
    doc.setDrawColor(parseInt(bc.substr(0, 2), 16), parseInt(bc.substr(2, 2), 16), parseInt(bc.substr(4, 2), 16));
    doc.setLineWidth(0.3);
    doc.rect(trim * 2, trim * 2, cardWmm, cardHmm, "S");
    var tc = (t.text || "#1a1a1a").replace("#", "");
    doc.setTextColor(parseInt(tc.substr(0, 2), 16), parseInt(tc.substr(2, 2), 16), parseInt(tc.substr(4, 2), 16));
    const tx = trim * 2 + 5;
    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    doc.text(name, tx, trim * 2 + 10);
    doc.setFont(undefined, "normal");
    doc.setFontSize(8);
    doc.text(orgRole, tx, trim * 2 + 16);

    // Add Photo if exists
    const cardX = trim * 2;
    const cardY = trim * 2;
    if (data.photo) {
      try {
        doc.addImage(data.photo, "JPEG", cardX + 5, cardY + 22, 15, 15);
      } catch (e) {
        console.warn("Failed to add photo to PDF", e);
      }
    }

    const qrSvg = document.querySelector("#qrcode svg");
    if (qrSvg) {
      const svgStr = new XMLSerializer().serializeToString(qrSvg);
      const svgUrl = "data:image/svg+xml," + encodeURIComponent(svgStr);
      const img = new Image();
      img.onload = function () {
        const c = document.createElement("canvas");
        c.width = 200;
        c.height = 200;
        const cx = c.getContext("2d");
        cx.fillStyle = "#fff";
        cx.fillRect(0, 0, 200, 200);
        cx.drawImage(img, 0, 0, 200, 200);
        const pngUrl = c.toDataURL("image/png");
        doc.addImage(pngUrl, "PNG", trim * 2 + cardWmm - 22, trim * 2 + 5, 20, 20);
        const filename = (name.replace(/\s+/g, "_") + "_350dpi").trim() + ".pdf";
        doc.save(filename);
        showToast("350DPIトンボ付きPDFを保存しました。", "success");
      };
      img.src = svgUrl;
    } else {
      const filename = (name.replace(/\s+/g, "_") + "_350dpi").trim() + ".pdf";
      doc.save(filename);
      showToast("350DPIトンボ付きPDFを保存しました。", "success");
    }
  }

  function switchMode(mode) {
    const isView = mode === "view";
    const viewBtn = document.getElementById("btn-view-mode");
    const editBtn = document.getElementById("btn-edit-mode");
    const formSection = document.getElementById("editFormSection");

    if (isView) {
      viewBtn.classList.add("active");
      viewBtn.setAttribute("aria-selected", "true");
      editBtn.classList.remove("active");
      editBtn.setAttribute("aria-selected", "false");
      formSection.classList.remove("active");
    } else {
      viewBtn.classList.remove("active");
      viewBtn.setAttribute("aria-selected", "false");
      editBtn.classList.add("active");
      editBtn.setAttribute("aria-selected", "true");
      formSection.classList.add("active");
    }
  }

  function setupOfflineBadge() {
    const offlineBadge = document.getElementById("offlineBadge");
    const offlineDot = document.getElementById("offlineDot");
    const offlineText = document.getElementById("offlineText");

    function setStatus(ready) {
      if (ready) {
        offlineDot.classList.remove("dot-offline");
        offlineDot.classList.add("dot-online");
        offlineText.textContent = "オフライン起動対応済み";
      } else {
        offlineDot.classList.remove("dot-online");
        offlineDot.classList.add("dot-offline");
        offlineText.textContent = "オフライン未対応（初回読み込み中）";
      }
    }

    if (!("serviceWorker" in navigator)) {
      offlineText.textContent = "このブラウザはオフライン PWA に未対応です";
      return;
    }

    setStatus(false);

    navigator.serviceWorker.ready
      .then(() => setStatus(true))
      .catch(() => setStatus(false));
  }

  // ---------- QRスキャン（jsQR）----------
  let scanStream = null;
  let scanAnimationId = null;

  function parseVCardLine(line) {
    const semi = line.indexOf(";");
    const colon = line.indexOf(":");
    if (colon === -1) return null;
    const key = (semi !== -1 ? line.substring(0, semi) : line.substring(0, colon)).split(".")[0];
    const value = line.substring(colon + 1).replace(/\\n/g, "\n").replace(/\\,/g, ",").trim();
    return { key, value };
  }

  function parseVCardToData(vcardText) {
    const data = {
      lastName: "",
      firstName: "",
      phone: "",
      email: "",
      org: "",
      title: "",
      url: "",
      photo: "",
      sns1: "",
      sns2: ""
    };
    const lines = vcardText.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith(" ") || line.startsWith("\t")) {
        continue;
      }
      const parsed = parseVCardLine(line);
      if (!parsed) continue;
      const k = parsed.key.toUpperCase();
      const v = parsed.value;
      if (k === "N") {
        const parts = v.split(";").map(s => s.replace(/\\,/g, ",").trim());
        if (parts.length >= 2) {
          data.lastName = parts[0] || "";
          data.firstName = parts[1] || "";
        }
      } else if (k === "FN") {
        if (!data.firstName && !data.lastName) {
          const sp = v.lastIndexOf(" ");
          if (sp > 0) {
            data.lastName = v.substring(0, sp).trim();
            data.firstName = v.substring(sp + 1).trim();
          } else {
            data.firstName = v;
          }
        }
      } else if (k === "TEL") {
        data.phone = data.phone || v.replace(/\s/g, "");
      } else if (k === "EMAIL") {
        data.email = data.email || v;
      } else if (k === "ORG") {
        data.org = data.org || v;
      } else if (k === "TITLE") {
        data.title = data.title || v;
      } else if (k === "URL") {
        if (!data.url) data.url = v;
      }
    }
    return data;
  }

  function openScanOverlay() {
    const overlay = document.getElementById("scan-overlay");
    const video = document.getElementById("scan-video");
    if (!overlay || !video) return;

    // Add history state so "Back" button closes the scan overlay
    if (window.location.hash !== "#scan") {
      history.pushState({ scanning: true }, "Scan QR", "#scan");
    }

    overlay.classList.add("active");
    if (typeof navigator.mediaDevices !== "undefined" && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(function (stream) {
          scanStream = stream;
          video.srcObject = stream;
          video.play();
          runScanLoop(video);
        })
        .catch(function () {
          navigator.mediaDevices.getUserMedia({ video: true })
            .then(function (stream) {
              scanStream = stream;
              video.srcObject = stream;
              video.play();
              runScanLoop(video);
            })
            .catch(function () {
              showToast("カメラにアクセスできません。", "error");
              closeScanOverlay(false); // Don't trigger history.back()
            });
        });
    } else {
      showToast("この環境ではカメラが使えません。", "error");
      closeScanOverlay(false);
    }
  }

  function closeScanOverlay(doBack = true) {
    const overlay = document.getElementById("scan-overlay");
    const video = document.getElementById("scan-video");

    if (scanAnimationId != null) {
      cancelAnimationFrame(scanAnimationId);
      scanAnimationId = null;
    }
    if (scanStream) {
      scanStream.getTracks().forEach(function (t) { t.stop(); });
      scanStream = null;
    }
    if (video && video.srcObject) {
      video.srcObject = null;
    }
    if (overlay) overlay.classList.remove("active");

    if (doBack && window.location.hash === "#scan") {
      history.back();
    }
  }

  window.addEventListener("popstate", function (e) {
    const overlay = document.getElementById("scan-overlay");
    if (overlay && overlay.classList.contains("active") && window.location.hash !== "#scan") {
      closeScanOverlay(false);
    }
  });

  function runScanLoop(video) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    let lastResult = "";

    function tick() {
      if (!video || !video.srcObject || !overlayContainsActive()) {
        return;
      }
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        if (typeof jsQR !== "undefined") {
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data && code.data !== lastResult) {
            lastResult = code.data;
            onScanResult(code.data);
            return;
          }
        }
      }
      scanAnimationId = requestAnimationFrame(tick);
    }

    function overlayContainsActive() {
      const o = document.getElementById("scan-overlay");
      return o && o.classList.contains("active");
    }

    scanAnimationId = requestAnimationFrame(tick);
  }

  function onScanResult(text) {
    closeScanOverlay();
    const raw = (text || "").trim();
    if (!raw) return;
    if (raw.toUpperCase().indexOf("BEGIN:VCARD") !== -1) {
      const data = parseVCardToData(raw);
      const name = (data.lastName + " " + data.firstName).trim() || "読み取り名刺";
      showConfirm("vCard をインポートして新しい名刺として追加しますか？", { title: "連絡先をインポート", confirmText: "追加する" }).then(function (ok) {
        if (!ok) return;
        const newProfile = createNewProfile(name);
        const profiles = getAllProfiles();
        const p = profiles.find(function (pr) { return pr.id === newProfile.id; });
        if (p) p.data = data;
        saveAllProfiles(profiles);
        setCurrentProfileId(newProfile.id);
        fillDisplay(data);
        fillForm(data);
        regenerateQR(data);
        updateProfileSelector();
        showToast("連絡先をインポートしました。", "success");
      });
      return;
    }
    const urlMatch = raw.match(/^https?:\/\/[^\s]+$/i);
    if (urlMatch) {
      showConfirm("次のURLを開きますか？\n\n" + raw, { title: "URLを開く", confirmText: "開く" }).then(function (ok) {
        if (ok) window.open(raw, "_blank", "noopener");
      });
      return;
    }
    showToast("読み取りました: " + (raw.length > 60 ? raw.substring(0, 60) + "…" : raw), "info");
  }

  function previewVCard(data) {
    console.log("vCard preview:", buildVCard(data));
    exportVCard(data);  // ダウンロードに切り替え
  }

  function exportVCard(data) {
    const vcard = buildVCard(data);
    const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const lastName = data.lastName || "contact";
    const firstName = data.firstName || "";
    const filename = `${lastName}_${firstName}`.trim().replace(/\s+/g, "_") + ".vcf";

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function shareVCard(data) {
    const vcard = buildVCard(data);
    const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
    const lastName = data.lastName || "contact";
    const firstName = data.firstName || "";
    const fullName = (lastName + " " + firstName).trim() || "連絡先";
    const filename = fullName.replace(/\s+/g, "_") + ".vcf";
    const file = new File([blob], filename, { type: "text/vcard" });

    if (!navigator.share) {
      exportVCard(data);
      showToast("この環境では共有ダイアログが出ません。vCardファイルをダウンロードしました。メールやチャットに添付して送れます。", "info");
      return;
    }

    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: '連絡先を共有',
          text: fullName + 'の連絡先',
          files: [file]
        });
      } else {
        await navigator.share({
          title: '連絡先を共有',
          text: fullName + 'の連絡先です。vCardファイルはアプリ内「💾 .vcf」またはメニュー「ファイルで保存」からダウンロードできます。'
        });
        exportVCard(data);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err);
        showToast("共有に失敗しました。代わりにダウンロードします。", "error");
        exportVCard(data);
      }
    }
  }

  function downloadQRCodeAsSVG(data) {
    const qrSvg = document.querySelector('#qrcode svg');
    if (!qrSvg) {
      showToast("QRコードが生成されていません。", "error");
      return;
    }

    // Clone SVG to avoid modifying the displayed one
    const svgClone = qrSvg.cloneNode(true);

    // Set explicit dimensions for better compatibility
    svgClone.setAttribute('width', '512');
    svgClone.setAttribute('height', '512');

    const svgData = new XMLSerializer().serializeToString(svgClone);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const lastName = data.lastName || "contact";
    const firstName = data.firstName || "";
    const filename = `${lastName}_${firstName}_QR`.trim().replace(/\s+/g, "_") + ".svg";

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function downloadQRCodeAsPNG(data) {
    const qrSvg = document.querySelector('#qrcode svg');
    if (!qrSvg) {
      showToast("QRコードが生成されていません。", "error");
      return;
    }

    // Create a canvas to convert SVG to PNG
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const size = 1024; // High resolution for printing
    canvas.width = size;
    canvas.height = size;

    // Create an image from SVG
    const svgClone = qrSvg.cloneNode(true);
    svgClone.setAttribute('width', size);
    svgClone.setAttribute('height', size);

    const svgData = new XMLSerializer().serializeToString(svgClone);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = function () {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);

      canvas.toBlob(function (blob) {
        const pngUrl = URL.createObjectURL(blob);

        const lastName = data.lastName || "contact";
        const firstName = data.firstName || "";
        const filename = `${lastName}_${firstName}_QR`.trim().replace(/\s+/g, "_") + ".png";

        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(pngUrl);
        URL.revokeObjectURL(url);
      }, 'image/png');
    };
    img.onerror = function () {
      showToast("QRコードの画像変換に失敗しました。", "error");
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  function downloadQRCode(data) {
    showConfirm(
      "QRコードを保存します。\n\nOK = PNG形式（印刷用・高解像度）\nキャンセル = SVG形式（編集可能・軽量）",
      { title: "形式を選択", confirmText: "PNGで保存", cancelText: "SVGで保存" }
    ).then(function (usePng) {
      if (usePng) {
        downloadQRCodeAsPNG(data);
      } else {
        downloadQRCodeAsSVG(data);
      }
    });
  }

  function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || "dark";
    applyTheme(savedTheme);
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);

    const themeIcon = document.getElementById("themeIcon");
    const themeColorMeta = document.getElementById("themeColorMeta");

    if (themeIcon) {
      themeIcon.textContent = theme === "dark" ? "☀️" : "🌙";
    }

    if (themeColorMeta) {
      themeColorMeta.setAttribute("content", theme === "dark" ? "#1e293b" : "#2E5077");
    }

    // Regenerate QR code with new colors
    const saved = loadCurrentProfile();
    if (saved && qrInstance) {
      regenerateQR(saved);
    }
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
    const newTheme = currentTheme === "light" ? "dark" : "light";
    applyTheme(newTheme);
  }

  // === Profile UI Functions ===

  function updateProfileSelector() {
    const profiles = getAllProfiles();
    const currentId = getCurrentProfileId();
    const currentProfile = profiles.find(p => p.id === currentId);

    // Update button text
    const profileNameElement = document.getElementById("current-profile-name");
    if (profileNameElement && currentProfile) {
      profileNameElement.textContent = currentProfile.name;
    }

    // Update dropdown menu
    const menu = document.getElementById("profile-menu");
    if (!menu) return;

    menu.innerHTML = '';

    profiles.forEach(profile => {
      const item = document.createElement('div');
      item.className = 'profile-menu-item' + (profile.id === currentId ? ' active' : '');

      const name = document.createElement('span');
      name.className = 'profile-name';
      name.textContent = profile.name;
      name.onclick = (e) => {
        e.stopPropagation();
        switchProfile(profile.id);
        toggleProfileMenu(false);
      };

      const actions = document.createElement('div');
      actions.className = 'profile-actions';

      const renameBtn = document.createElement('button');
      renameBtn.className = 'profile-action-btn';
      renameBtn.textContent = '✏️';
      renameBtn.title = '名前を変更';
      renameBtn.onclick = (e) => {
        e.stopPropagation();
        showPrompt("名刺の名前を変更", profile.name, { title: "名前を変更" }).then(function (newName) {
          if (newName && newName.trim()) {
            renameProfile(profile.id, newName.trim());
          }
        });
      };

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'profile-action-btn';
      deleteBtn.textContent = '🗑️';
      deleteBtn.title = '削除';
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        deleteProfile(profile.id);
      };

      actions.appendChild(renameBtn);
      actions.appendChild(deleteBtn);

      item.appendChild(name);
      item.appendChild(actions);
      menu.appendChild(item);
    });

    // Add divider
    const divider = document.createElement('div');
    divider.className = 'profile-menu-divider';
    menu.appendChild(divider);

    // Add "New Profile" button
    const newItem = document.createElement('div');
    newItem.className = 'profile-menu-item';
    newItem.innerHTML = '<span class="profile-name">➕ 新しい名刺を作成</span>';
    newItem.onclick = (e) => {
      e.stopPropagation();
      showPrompt("名刺の名前を入力してください", "新しい名刺", { title: "新しい名刺" }).then(function (name) {
        if (name && name.trim()) {
          const newProfile = createNewProfile(name.trim());
          switchProfile(newProfile.id);
        }
        toggleProfileMenu(false);
      });
    };
    menu.appendChild(newItem);
  }

  function toggleProfileMenu(show) {
    const menu = document.getElementById("profile-menu");
    if (!menu) return;

    if (show === undefined) {
      menu.classList.toggle('active');
    } else {
      menu.classList.toggle('active', show);
    }
  }

  // === Onboarding Functions ===

  function showOnboarding() {
    const overlay = document.getElementById("onboarding-overlay");
    if (overlay) {
      overlay.classList.add('active');
    }
  }

  function hideOnboarding() {
    const overlay = document.getElementById("onboarding-overlay");
    if (overlay) {
      overlay.classList.remove('active');
    }
    localStorage.setItem(ONBOARDING_KEY, 'true');
  }

  function shouldShowOnboarding() {
    return !localStorage.getItem(ONBOARDING_KEY);
  }

  function resetOnboarding() {
    localStorage.removeItem(ONBOARDING_KEY);
    showOnboarding();
  }

  // === Hamburger Menu Functions ===

  function openMenu() {
    showMainMenu();
    document.getElementById("menu-overlay").classList.add("active");
    document.getElementById("menu-drawer").classList.add("active");
  }

  function closeMenu() {
    document.getElementById("menu-overlay").classList.remove("active");
    document.getElementById("menu-drawer").classList.remove("active");
  }

  function showMainMenu() {
    const drawer = document.getElementById("menu-drawer");
    let html = `
      <div class="menu-header">
        <div class="menu-title">メニュー</div>
        <button id="menu-close-btn-main" class="menu-close-btn">✕</button>
      </div>
      <div class="menu-content">
        <div class="menu-item" id="menu-profiles-main">
          <span class="menu-item-icon">📇</span>
          <span class="menu-item-text">名刺を選ぶ</span>
          <span class="menu-item-arrow">›</span>
        </div>
        <div class="menu-divider"></div>
        <div class="menu-item" id="menu-share-main">
          <span class="menu-item-icon">📤</span>
          <span class="menu-item-text">共有する</span>
          <span class="menu-item-arrow">›</span>
        </div>
        <div class="menu-item" id="menu-sns-main">
          <span class="menu-item-icon">🔗</span>
          <span class="menu-item-text">SNS・リンク設定</span>
          <span class="menu-item-arrow">›</span>
        </div>
        <div class="menu-divider"></div>
        <div class="menu-item" id="menu-settings-main">
          <span class="menu-item-icon">⚙️</span>
          <span class="menu-item-text">設定</span>
          <span class="menu-item-arrow">›</span>
        </div>
        <div class="menu-item" id="menu-data-main">
          <span class="menu-item-icon">💾</span>
          <span class="menu-item-text">データの保存・削除</span>
          <span class="menu-item-arrow">›</span>
        </div>
        <div class="menu-divider"></div>
        <div class="menu-item" id="menu-help-main">
          <span class="menu-item-icon">❓</span>
          <span class="menu-item-text">ヘルプ・使い方</span>
        </div>
        <div class="menu-item" id="menu-about-main">
          <span class="menu-item-icon">ℹ️</span>
          <span class="menu-item-text">このアプリについて</span>
        </div>
      </div>
    `;
    drawer.innerHTML = html;

    // Re-attach event listeners
    attachMainMenuListeners();
  }

  function attachMainMenuListeners() {
    const closeBtn = document.getElementById("menu-close-btn-main");
    if (closeBtn) {
      closeBtn.addEventListener("click", closeMenu);
    }

    const items = {
      "menu-profiles-main": showProfilesSubmenu,
      "menu-share-main": showShareSubmenu,
      "menu-sns-main": () => {
        closeMenu();
        switchMode("edit");
        setTimeout(() => {
          const sns1Input = document.getElementById("sns1");
          if (sns1Input) {
            sns1Input.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 100);
      },
      "menu-settings-main": showSettingsSubmenu,
      "menu-data-main": showDataSubmenu,
      "menu-help-main": () => {
        closeMenu();
        showOnboarding();
      },
      "menu-about-main": showAboutSubmenu
    };

    Object.keys(items).forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener("click", items[id]);
      }
    });
  }

  function showProfilesSubmenu() {
    const profiles = getAllProfiles();
    const currentId = getCurrentProfileId();

    let html = '<div class="menu-header"><div class="menu-title">名刺を選ぶ</div><button class="menu-close-btn" onclick="showMainMenu()">←</button></div><div class="menu-content">';

    profiles.forEach(profile => {
      const active = profile.id === currentId ? ' (使用中)' : '';
      html += `
        <div class="menu-item" onclick="switchProfileAndClose('${profile.id}')">
          <span class="menu-item-icon">${profile.id === currentId ? '✓' : '📇'}</span>
          <span class="menu-item-text">${profile.name}${active}</span>
        </div>
      `;
    });

    html += '<div class="menu-divider"></div>';
    html += `
      <div class="menu-item" onclick="createNewProfilePrompt()">
        <span class="menu-item-icon">➕</span>
        <span class="menu-item-text">新しい名刺を作成</span>
      </div>
    `;
    html += '</div>';

    const drawer = document.getElementById("menu-drawer");
    drawer.innerHTML = html;
  }

  function showShareSubmenu() {
    const data = loadCurrentProfile();

    let html = '<div class="menu-header"><div class="menu-title">共有する</div><button class="menu-close-btn" onclick="showMainMenu()">←</button></div><div class="menu-content">';

    html += `
      <div class="menu-item" onclick="closeMenuOnly()">
        <span class="menu-item-icon">📱</span>
        <span class="menu-item-text">QRコードを見せる</span>
      </div>
      <div class="menu-item" onclick="shareVCardFromMenu()">
        <span class="menu-item-icon">💬</span>
        <span class="menu-item-text">LINEなどで送る</span>
      </div>
      <div class="menu-item" onclick="downloadQRFromMenu()">
        <span class="menu-item-icon">🖼️</span>
        <span class="menu-item-text">QR画像を保存</span>
      </div>
      <div class="menu-item" onclick="exportVCardFromMenu()">
        <span class="menu-item-icon">📄</span>
        <span class="menu-item-text">ファイルで保存 (.vcf)</span>
      </div>
    `;

    html += '</div>';

    const drawer = document.getElementById("menu-drawer");
    drawer.innerHTML = html;
  }

  function showSettingsSubmenu() {
    let html = '<div class="menu-header"><div class="menu-title">設定</div><button class="menu-close-btn" onclick="showMainMenu()">←</button></div><div class="menu-content">';

    html += `
      <div class="menu-section-title">プライバシー</div>
      <div class="menu-item">
        <span class="menu-item-icon">🔐</span>
        <span class="menu-item-text">パスワード保護（準備中）</span>
      </div>
    `;

    html += '</div>';

    const drawer = document.getElementById("menu-drawer");
    drawer.innerHTML = html;
  }

  function showDataSubmenu() {
    let html = '<div class="menu-header"><div class="menu-title">データの保存・削除</div><button class="menu-close-btn" onclick="showMainMenu()">←</button></div><div class="menu-content">';

    html += `
      <div class="menu-item" onclick="loadTestData()">
        <span class="menu-item-icon">🧪</span>
        <span class="menu-item-text">テストデータを読み込む</span>
      </div>
      <div class="menu-item" onclick="showStorageInfo()">
        <span class="menu-item-icon">📊</span>
        <span class="menu-item-text">保存容量を確認</span>
      </div>
      <div class="menu-divider"></div>
      <div class="menu-item" onclick="deleteAllData()">
        <span class="menu-item-icon">🗑️</span>
        <span class="menu-item-text" style="color: var(--danger);">すべて削除</span>
      </div>
    `;

    html += '</div>';

    const drawer = document.getElementById("menu-drawer");
    drawer.innerHTML = html;
  }

  function showAboutSubmenu() {
    let html = '<div class="menu-header"><div class="menu-title">このアプリについて</div><button class="menu-close-btn" onclick="showMainMenu()">←</button></div><div class="menu-content" style="padding: 20px;">';

    html += `
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="font-size: 48px; margin-bottom: 8px;">📇</div>
        <div style="font-size: 20px; font-weight: 700; margin-bottom: 4px;">MeQR</div>
        <div style="font-size: 13px; color: var(--text-muted);">バージョン 1.0.0</div>
      </div>
      <div style="font-size: 13px; line-height: 1.6; color: var(--text-muted); margin-bottom: 16px;">
        ローカル完結型のプライバシー重視デジタル名刺アプリ。サーバーにデータを一切送信せず、ブラウザのみで動作します。
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div style="padding: 8px; background: var(--accent-soft); border-radius: 8px; font-size: 12px;">
          ✅ 完全プライバシー保護
        </div>
        <div style="padding: 8px; background: var(--accent-soft); border-radius: 8px; font-size: 12px;">
          ✅ 完全無料・広告なし
        </div>
        <div style="padding: 8px; background: var(--accent-soft); border-radius: 8px; font-size: 12px;">
          ✅ オープンソース
        </div>
      </div>
      <div style="margin-top: 20px; text-align: center;">
        <a href="https://github.com/YumaKakuya/meqr" target="_blank" style="color: var(--accent); text-decoration: none; font-size: 13px;">
          📂 GitHubリポジトリ
        </a>
      </div>
    `;

    html += '</div>';

    const drawer = document.getElementById("menu-drawer");
    drawer.innerHTML = html;
  }

  // Menu helper functions (called from onclick)
  // Menu helper functions (called from onclick in dynamic HTML)
  window.showMainMenu = showMainMenu;

  window.switchProfileAndClose = function (profileId) {
    switchProfile(profileId);
    closeMenu();
  };

  window.createNewProfilePrompt = function () {
    showPrompt("名刺の名前を入力してください", "新しい名刺", { title: "新しい名刺" }).then(function (name) {
      if (name && name.trim()) {
        const newProfile = createNewProfile(name.trim());
        switchProfile(newProfile.id);
      }
      closeMenu();
    });
  };

  window.closeMenuOnly = function () {
    closeMenu();
  };

  window.shareVCardFromMenu = async function () {
    const data = loadCurrentProfile();
    if (!data || (!data.lastName && !data.firstName)) {
      showToast("共有する連絡先情報がありません。", "error");
      return;
    }
    closeMenu();
    await shareVCard(data);
  };

  window.downloadQRFromMenu = function () {
    const data = loadCurrentProfile();
    if (!data || (!data.lastName && !data.firstName)) {
      showToast("QRコードを保存する前に、連絡先情報を入力してください。", "error");
      return;
    }
    closeMenu();
    downloadQRCode(data);
  };

  window.exportVCardFromMenu = function () {
    const data = loadCurrentProfile();
    if (!data || (!data.lastName && !data.firstName)) {
      showToast("エクスポートする連絡先情報がありません。", "error");
      return;
    }
    closeMenu();
    exportVCard(data);
  };

  window.setQRSize = function (size) {
    localStorage.setItem('meqr_qr_size', size);

    const qrInner = document.querySelector('.qr-inner');
    if (qrInner) {
      qrInner.classList.remove('size-small', 'size-medium', 'size-large');
      qrInner.classList.add('size-' + size);
    }

    // スライダーのUIも同期
    const slider = document.getElementById("qr-size-slider");
    const indicator = document.getElementById("qr-size-indicator");
    const sizeMap = { small: 1, medium: 2, large: 3 };
    const labelMap = { small: "小", medium: "中", large: "大" };
    if (slider) slider.value = sizeMap[size] || 2;
    if (indicator) indicator.textContent = labelMap[size] || "中";
  };

  function applyQRSize() {
    const size = localStorage.getItem('meqr_qr_size') || 'medium';
    const qrInner = document.querySelector('.qr-inner');
    if (qrInner) {
      qrInner.classList.add('size-' + size);
    }
    // スライダーUI初期化
    const sizeMap = { small: 1, medium: 2, large: 3 };
    const labelMap = { small: "小", medium: "中", large: "大" };
    const slider = document.getElementById("qr-size-slider");
    const indicator = document.getElementById("qr-size-indicator");
    if (slider) slider.value = sizeMap[size] || 2;
    if (indicator) indicator.textContent = labelMap[size] || "中";
  }

  window.showStorageInfo = function () {
    const profiles = getAllProfiles();
    const dataStr = JSON.stringify(profiles);
    const bytes = new Blob([dataStr]).size;
    const kb = (bytes / 1024).toFixed(2);
    showToast("保存データ容量:\n\n" + kb + " KB\n名刺数: " + profiles.length + "個\n\n※ ブラウザの制限: 約5-10MB", "info");
  };

  // テスト用サンプルデータ
  function getTestProfiles() {
    const now = new Date().toISOString();
    return [
      {
        id: "test-business-" + Date.now(),
        name: "ビジネス名刺（テスト）",
        data: {
          lastName: "山田",
          firstName: "太郎",
          phone: "090-1234-5678",
          email: "yamada.taro@example.co.jp",
          org: "株式会社サンプル",
          title: "営業部長",
          url: "https://example.co.jp",
          photo: "",
          sns1: "https://x.com/yamada_taro",
          sns2: "https://linkedin.com/in/yamada-taro"
        },
        createdAt: now,
        updatedAt: now
      },
      {
        id: "test-private-" + (Date.now() + 1),
        name: "プライベート名刺（テスト）",
        data: {
          lastName: "山田",
          firstName: "太郎",
          phone: "080-9876-5432",
          email: "taro.yamada@gmail.com",
          org: "",
          title: "",
          url: "https://taro-yamada.blog",
          photo: "",
          sns1: "https://x.com/taro_private",
          sns2: "https://github.com/taro-yamada"
        },
        createdAt: now,
        updatedAt: now
      }
    ];
  }

  window.loadTestData = function () {
    showConfirm("テスト用のサンプルデータを読み込みます。\n\n現在のデータは上書きされます。よろしいですか？", { title: "テストデータの読み込み" }).then(function (ok) {
      if (!ok) return;
      const testProfiles = getTestProfiles();
      saveAllProfiles(testProfiles);
      setCurrentProfileId(testProfiles[0].id);
      fillDisplay(testProfiles[0].data);
      fillForm(testProfiles[0].data);
      regenerateQR(testProfiles[0].data);
      showMainMenu();
      closeMenu();
      setSyncStatus("saved");
      showToast("テストデータを読み込みました。\n\n・ビジネス名刺（テスト）\n・プライベート名刺（テスト）\n\nメニュー「名刺を選ぶ」で切り替えられます。", "success");
    });
  };

  window.deleteAllData = function () {
    showConfirm("⚠️ すべての名刺データを削除します。\n\nこの操作は取り消せません。本当に削除しますか？", { title: "データの削除" }).then(function (confirm1) {
      if (!confirm1) return;
      showConfirm("最終確認:\n\n本当にすべてのデータを削除しますか？", { title: "最終確認" }).then(function (confirm2) {
        if (!confirm2) return;
        localStorage.removeItem(PROFILES_KEY);
        localStorage.removeItem(CURRENT_PROFILE_KEY);
        localStorage.removeItem(ONBOARDING_KEY);
        showToast("すべてのデータを削除しました。ページをリロードします。", "info");
        location.reload();
      });
    });
  };

  function onDOMContentLoaded() {
    // スタートページ制御
    (function () {
      var startPage = document.getElementById('startPage');
      var startBtn = document.getElementById('startBtn');
      if (!startPage) return;

      // 同一セッション内で既に表示済みならスキップ
      if (sessionStorage.getItem('meqr_started')) {
        startPage.style.display = 'none';
        return;
      }

      function dismiss() {
        sessionStorage.setItem('meqr_started', '1');
        startPage.classList.add('fade-out');
        setTimeout(function () {
          startPage.style.display = 'none';
        }, 420);
      }

      if (startBtn) startBtn.addEventListener('click', dismiss);

      // 3.9秒後に自動dismiss（ボタン押さなくても消える）
      setTimeout(dismiss, 3900);
    })();

    console.log("MeQR: DOM loaded, initializing...");

    try {
      // Initialize theme first
      initTheme();

      // Migrate old data if exists
      migrateOldData();

      qrInstance = createQRCodeInstance();

      // Load current profile
      const initialData = loadCurrentProfile();
      console.log("MeQR: Initial data loaded", initialData);

      fillDisplay(initialData);
      fillForm(initialData);
      regenerateQR(initialData);
      updateProfileSelector();
      applyQRSize();
      var templateSelect = document.getElementById("design-template-select");
      if (templateSelect) {
        templateSelect.value = getCurrentTemplateId();
        templateSelect.addEventListener("change", function () {
          setCurrentTemplateId(templateSelect.value);
          drawPreviewCanvas(readForm());
        });
      }
      drawPreviewCanvas(initialData);
      var formIds = ["lastName", "firstName", "phone", "email", "org", "title", "url", "sns1", "sns2"];
      formIds.forEach(function (id) {
        var el = document.getElementById(id);
        if (el) {
          el.addEventListener("input", schedulePreviewUpdate);
          el.addEventListener("change", schedulePreviewUpdate);
        }
      });

      // QRサイズスライダー
      const qrSlider = document.getElementById("qr-size-slider");
      if (qrSlider) {
        qrSlider.addEventListener("input", function () {
          const val = parseInt(this.value);
          const sizeKey = val === 1 ? "small" : val === 3 ? "large" : "medium";
          window.setQRSize(sizeKey);
        });
      }
    } catch (err) {
      console.error("MeQR: Initialization error", err);
      showToast("初期化エラーが発生しました: " + err.message, "error");
    }

    // Show onboarding if first time
    if (shouldShowOnboarding()) {
      showOnboarding();
    }

    // Onboarding handlers
    const btnOnboardingStart = document.getElementById("btn-onboarding-start");
    const btnOnboardingSkip = document.getElementById("btn-onboarding-skip");

    if (btnOnboardingStart) {
      btnOnboardingStart.addEventListener("click", () => {
        hideOnboarding();
        switchMode("edit");
      });
    }

    if (btnOnboardingSkip) {
      btnOnboardingSkip.addEventListener("click", () => {
        hideOnboarding();
      });
    }

    // Hamburger menu
    document.getElementById("btn-hamburger").addEventListener("click", () => {
      openMenu();
    });

    document.getElementById("menu-overlay").addEventListener("click", () => {
      closeMenu();
    });

    document.getElementById("btn-view-mode").addEventListener("click", () => {
      switchMode("view");
    });
    document.getElementById("btn-edit-mode").addEventListener("click", () => {
      switchMode("edit");
    });

    (function attachSaveHandler() {
      const btnSave = document.getElementById("btn-save");
      if (!btnSave) {
        console.error("btn-save element not found. Save handler not attached.");
        return;
      }
      console.log("btn-save found, attaching click handler.");
      btnSave.addEventListener("click", () => {
        console.log("btn-save clicked");
        const data = readForm();
        console.log("form data:", data);
        if (!data.lastName && !data.firstName) {
          showConfirm("姓・名が未入力です。このまま QR を更新しますか？", { title: "確認" }).then(function (ok) {
            if (!ok) return;
            saveCurrentProfile(data);
            fillDisplay(data);
            regenerateQR(data);
            drawPreviewCanvas(data);
            switchMode("view");
          });
          return;
        }
        saveCurrentProfile(data);
        fillDisplay(data);
        regenerateQR(data);
        drawPreviewCanvas(data);
        switchMode("view");
      });
    })();

    document.getElementById("btn-clear").addEventListener("click", () => {
      showConfirm("現在の名刺の情報をクリアします。よろしいですか？", { title: "クリア" }).then(function (ok) {
        if (!ok) return;
        const emptyData = {
          lastName: "",
          firstName: "",
          phone: "",
          email: "",
          org: "",
          title: "",
          url: "",
          photo: ""
        };
        saveCurrentProfile(emptyData);
        fillDisplay(emptyData);
        fillForm(emptyData);
        regenerateQR(emptyData);
        setSyncStatus("empty");
      });
    });

    document.getElementById("btn-preview-vcard").addEventListener("click", () => {
      const data = loadCurrentProfile() || readForm();
      previewVCard(data);
    });

    document.getElementById("btn-export-vcard").addEventListener("click", () => {
      const data = loadCurrentProfile();
      if (!data || (!data.lastName && !data.firstName)) {
        showToast("エクスポートする連絡先情報がありません。先に名前を入力して保存してください。", "error");
        return;
      }
      exportVCard(data);
    });

    document.getElementById("btn-share-vcard").addEventListener("click", async () => {
      const data = loadCurrentProfile();
      if (!data || (!data.lastName && !data.firstName)) {
        showToast("共有する連絡先情報がありません。先に名前を入力して保存してください。", "error");
        return;
      }
      await shareVCard(data);
    });

    document.getElementById("btn-scan-qr").addEventListener("click", function () {
      openScanOverlay();
    });
    var scanCloseBtn = document.getElementById("scan-close-btn");
    if (scanCloseBtn) scanCloseBtn.addEventListener("click", closeScanOverlay);

    var btnExportPdf = document.getElementById("btn-export-pdf");
    if (btnExportPdf) {
      btnExportPdf.addEventListener("click", function () {
        // Read directly from form to allow unsaved preview
        var data = readForm();
        if (!data.lastName && !data.firstName) {
          showToast("PDFを書き出す前に、名前を入力してください。", "error");
          return;
        }
        exportPDF350(data);
      });
    }

    document.getElementById("btn-download-qr").addEventListener("click", () => {
      const data = loadCurrentProfile();
      if (!data || (!data.lastName && !data.firstName)) {
        showToast("QRコードを保存する前に、連絡先情報を入力して保存してください。", "error");
        return;
      }
      downloadQRCode(data);
    });

    function resizeImage(dataUrl, maxW, maxH) {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = function () {
          let w = img.width;
          let h = img.height;
          if (w > maxW || h > maxH) {
            const ratio = Math.min(maxW / w, maxH / h);
            w *= ratio;
            h *= ratio;
          }
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        };
        img.src = dataUrl;
      });
    }

    // Photo upload handler
    document.getElementById("photoUpload").addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (!file) return;

      if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
        showToast("対応している画像形式はJPEG、PNG、WebPです。");
        e.target.value = "";
        return;
      }

      const MAX_SIDE = 400; // 最大辺をこのサイズに
      const QUALITY = 0.82;

      const reader = new FileReader();
      reader.onload = function (event) {
        const img = new Image();
        img.onload = function () {
          let w = img.naturalWidth;
          let h = img.naturalHeight;
          if (w > MAX_SIDE || h > MAX_SIDE) {
            const ratio = Math.min(MAX_SIDE / w, MAX_SIDE / h);
            w = Math.round(w * ratio);
            h = Math.round(h * ratio);
          }
          const offscreen = document.createElement("canvas");
          offscreen.width = w;
          offscreen.height = h;
          const ctx = offscreen.getContext("2d");
          ctx.drawImage(img, 0, 0, w, h);
          const compressed = offscreen.toDataURL("image/jpeg", QUALITY);

          const currentData = loadCurrentProfile() || readForm();
          currentData.photo = compressed;
          saveCurrentProfile(currentData);
          fillDisplay(currentData);
          showToast("写真を設定しました。");
        };
        img.onerror = function () {
          showToast("画像の読み込みに失敗しました。");
          e.target.value = "";
        };
        img.src = event.target.result;
      };
      reader.onerror = function () {
        showToast("画像の読み込みに失敗しました。");
        e.target.value = "";
      };
      reader.readAsDataURL(file);
    });

    if ("serviceWorker" in navigator) {
      // sw.js の挙動を変更したので、URLにバージョンを付けて更新を確実化する。
      navigator.serviceWorker.register("sw.js?v=5")
        .then(reg => {
          console.log("ServiceWorker registered", reg);
          try {
            reg.update();
          } catch (_) {
            // ignore
          }
          setupOfflineBadge();
        })
        .catch(err => {
          console.warn("ServiceWorker registration failed", err);
          setupOfflineBadge();
        });
    } else {
      console.log("ServiceWorker not supported");
      setupOfflineBadge();
    }

    // Theme slider event listeners
    document.querySelectorAll(".theme-item").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const templateId = this.getAttribute("data-template");
        if (templateId) {
          setCurrentTemplateId(templateId);
          // Update active state
          document.querySelectorAll(".theme-item").forEach(function (item) {
            item.classList.remove("active");
          });
          this.classList.add("active");
          // Redraw preview
          schedulePreviewUpdate();
        }
      });
    });

    // Initialize: set active theme on load
    const currentTemplate = getCurrentTemplateId();
    const activeThemeBtn = document.querySelector('.theme-item[data-template="' + currentTemplate + '"]');
    if (activeThemeBtn) {
      document.querySelectorAll(".theme-item").forEach(function (item) {
        item.classList.remove("active");
      });
      activeThemeBtn.classList.add("active");
    }

    // テスト用: URL に ?demo=1 がある場合はテストデータを読み込む（確認ダイアログあり）
    if (location.search.includes("demo=1")) {
      setTimeout(function () {
        if (typeof loadTestData === "function") loadTestData();
      }, 800);
    }
  }

  document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
})();