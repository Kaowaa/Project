// calendar.js — ปฏิทินหลัก (แสดงเดือน/วัน/เวลา) + ตรวจ login ก่อนลงทะเบียน
let currentYear = new Date().getFullYear();
let selectedMonth = new Date().getMonth();
let selectedDate = null;

let events = getEvents(); // จาก storage.js

// ถ้ายังไม่มีข้อมูลกิจกรรม ให้ใส่ตัวอย่าง
if (Object.keys(events).length === 0) {
  events[`${currentYear}-02-15`] = [
    { title: "กิจกรรมเปิดบ้านวิทยาลัย", start: "09:00", end: "12:00", mode: "register" },
    { title: "ประกาศเช้า", start: "12:30", end: "13:00", mode: "notify" }
  ];
  events[`${currentYear}-03-10`] = [
    { title: "กิจกรรมรับน้อง", start: "13:00", end: "16:00", mode: "register" }
  ];
  saveEvents(events);
}

// ===================== Helper =====================
function convertToBuddhistYear(year) {
  return year + 543;
}

const months = [
  "ม.ค", "ก.พ", "มี.ค", "เม.ย", "พ.ค", "มิ.ย",
  "ก.ค", "ส.ค", "ก.ย", "ต.ค", "พ.ย", "ธ.ค"
];

// ===================== Render ส่วนปี/เดือน =====================
function renderYear() {
  const display = document.getElementById("yearDisplay");
  if (display) display.innerText = convertToBuddhistYear(currentYear);
}

function renderMonths() {
  let html = "";
  months.forEach((m, i) => {
    const hasEvent = Object.keys(events).some(date => {
      const [y, mo] = date.split("-").map(Number);
      return y === currentYear && mo - 1 === i;
    });
    html += `<button class="month-btn ${i === selectedMonth ? "active" : ""} ${hasEvent ? "month-has-event" : ""}" onclick="selectMonth(${i})">${m}</button>`;
  });
  document.getElementById("monthsContainer").innerHTML = html;
}

function selectMonth(m) {
  selectedMonth = m;
  renderMonths();
  renderDays();
}

// ===================== Render ส่วนวัน =====================
function renderDays() {
  const daysContainer = document.getElementById("daysContainer");
  if (!daysContainer) return;

  daysContainer.innerHTML = "";
  const lastDay = new Date(currentYear, selectedMonth + 1, 0).getDate();

  for (let d = 1; d <= lastDay; d++) {
    const dateStr = `${currentYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const isEvent = events[dateStr] ? "active" : "";
    daysContainer.innerHTML += `<button class="day-btn ${isEvent}" onclick="selectDay('${dateStr}')">${d}</button>`;
  }
}

// ===================== แสดงข้อมูลกิจกรรมในวันนั้น =====================
function selectDay(dateStr) {
  selectedDate = dateStr;
  const container = document.getElementById('eventInfo');
  container.innerHTML = "";

  const evs = events[dateStr];
  if (!evs) {
    container.innerText = "ไม่มีข้อมูลกิจกรรม";
    return;
  }

  const username = localStorage.getItem('student');
  const now = new Date();
  const [y, m, d] = dateStr.split("-").map(Number);
  let eventsArray = Array.isArray(evs) ? evs : [evs];

  eventsArray.forEach((ev, index) => {
    const [startHour, startMin] = (ev.start || "00:00").split(":").map(Number);
    const [endHour, endMin] = (ev.end || "23:59").split(":").map(Number);
    const eventStart = new Date(y, m - 1, d, startHour, startMin);
    const eventEnd = new Date(y, m - 1, d, endHour, endMin);

    // ✅ ดึงข้อมูลลงทะเบียนเพื่อนับจำนวน
    const regs = getRegistrations();
    const count = regs[dateStr]?.filter(k => k.endsWith(`_${index}`)).length || 0;

    let msg = "";
    let canRegister = false;

    if (ev.mode === "register") {
      if (now < eventStart) msg = "<span style='color:red;font-weight:bold;'>⛔ ยังไม่ถึงเวลาลงทะเบียน</span>";
      else if (now > eventEnd) msg = "<span style='color:gray;font-weight:bold;'>❌ หมดเวลาลงทะเบียน</span>";
      else canRegister = true;
    } else { 
      msg = "<span style='color:#0056b3;font-weight:bold;'>📢 กิจกรรมประชาสัมพันธ์</span>";
    }

    const wrapper = document.createElement("div");
    wrapper.style.marginBottom = "10px";
    wrapper.style.padding = "10px";
    wrapper.style.border = "1px solid #ccc";
    wrapper.style.borderRadius = "8px";
    wrapper.style.background = "#f1f4ff";

    wrapper.innerHTML = `
      <strong>📌 กิจกรรม:</strong> ${ev.title}<br>
      <strong>🕒 เวลา:</strong> ${ev.start || 'ยังไม่ระบุ'} - ${ev.end || 'ยังไม่ระบุ'}<br>
      <strong>👥 ลงทะเบียนแล้ว:</strong> ${count} คน<br>
      ${msg}
    `;

    // ===================== ปุ่มลงทะเบียน =====================
    if (ev.mode === "register" && canRegister) {
      const btn = document.createElement("button");
      btn.innerText = (username && isRegistered(dateStr, username, index)) ? "ลงทะเบียนกิจกรรมสำเร็จ ✅" : "ลงทะเบียนกิจกรรม";
      btn.disabled = username && isRegistered(dateStr, username, index);
      btn.style.backgroundColor = username && isRegistered(dateStr, username, index) ? "#28a745" : "#007bff";
      btn.style.color = "white";
      btn.style.border = "none";
      btn.style.padding = "6px 10px";
      btn.style.marginTop = "6px";
      btn.style.borderRadius = "6px";
      btn.style.cursor = btn.disabled ? "not-allowed" : "pointer";

      btn.onclick = () => {
        if (!username) {
          // ✅ confirm + เด้งไป login
          if (confirm("กรุณาเข้าสู่ระบบก่อน")) {
            console.log("กำลังเด้งไปหน้า login...");
            window.location.href = "login.html";
          }
          return;
        }

        const ok = saveRegister(dateStr, username, index);
        if (ok) {
          btn.innerText = "ลงทะเบียนกิจกรรมสำเร็จ ✅";
          btn.disabled = true;
          btn.style.backgroundColor = "#28a745";
          btn.style.cursor = "not-allowed";
          if (typeof updateStats === "function") updateStats();
          alert("ลงทะเบียนสำเร็จแล้ว ✅");
          selectDay(dateStr); // refresh หน้ากิจกรรมใหม่ให้นับคนทันที
        } else {
          alert("คุณได้ลงทะเบียนไว้แล้ว");
        }
      };

      wrapper.appendChild(btn);
    }

    container.appendChild(wrapper);
  });
}

// ===================== ฟังก์ชันจัดการลงทะเบียน =====================
function register(date, username, idx = 0) {
  if (!date || !username) return false;
  const regs = getRegistrations();
  if (!regs[date]) regs[date] = [];
  if (!Array.isArray(regs[date])) regs[date] = [];
  const key = `${username}_${idx}`;
  if (!regs[date].includes(key)) {
    regs[date].push(key);
    saveRegistrations(regs);
    return true;
  }
  return false;
}

function isRegistered(date, username, idx = 0) {
  const regs = getRegistrations();
  if (!regs[date]) return false;
  const key = `${username}_${idx}`;
  return regs[date].includes(key);
}

// ===================== จัดการปี =====================
function changeYear(delta) {
  currentYear += delta;
  renderYear();
  renderMonths();
  renderDays();
}

// ===================== เริ่มรัน =====================
renderYear();
renderMonths();
renderDays();
// ===================== ระบบนับกิจกรรมอัตโนมัติ =====================

// ✅ ตรวจสอบและอัปเดตการขาดกิจกรรมทุกครั้งที่เปิดดู
function checkMissedEvents() {
  const username = localStorage.getItem('student');
  if (!username) return;

  const regs = getRegistrations();
  const missed = JSON.parse(localStorage.getItem("missedEvents") || "{}");
  const now = new Date();

  Object.keys(events).forEach(date => {
    const [y, m, d] = date.split("-").map(Number);
    const dailyEvents = events[date];
    if (!Array.isArray(dailyEvents)) return;

    dailyEvents.forEach((ev, idx) => {
      if (ev.mode !== "register") return;
      const [endHour, endMin] = (ev.end || "23:59").split(":").map(Number);
      const eventEnd = new Date(y, m - 1, d, endHour, endMin);

      const key = `${username}_${date}_${idx}`;

      // หมดเวลาแล้ว และยังไม่เคยลงทะเบียน
      const isLate = now > eventEnd && !(regs[date]?.includes(`${username}_${idx}`));
      if (isLate && !missed[key]) {
        missed[key] = true;
      }
    });
  });

  localStorage.setItem("missedEvents", JSON.stringify(missed));
  if (typeof updateStats === "function") updateStats();
}

// เรียกใช้เมื่อโหลดหน้า index
checkMissedEvents();

