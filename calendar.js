/// calendar.js — ปฏิทินหลัก (แสดงเดือน/วัน/เวลา) + ตรวจ login ก่อนลงทะเบียน
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

// ===================== แสดงข้อมูลกิจกรรมในวันนั้น (แบบเพิ่มการยืนยันด้วยรูป) =====================
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

    const regs = getRegistrations();
    // ✅ แก้ไขการนับจำนวนคนให้รองรับ Object
    const count = (regs[dateStr] || []).filter(k => {
        if (typeof k === 'string') return k.endsWith(`_${index}`);
        return k.idx === index;
    }).length;

    let msg = "";
    let canRegister = false;
    const isReg = username && isRegistered(dateStr, username, index);

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

    if (ev.mode === "register" && canRegister) {
      if (!isReg) {
          const fileLabel = document.createElement("label");
          fileLabel.innerHTML = "<br><small style='display:block; margin-top:5px; color:#555;'>📸 แนบรูปถ่ายเพื่อยืนยันตัวตน:</small>";
          
          const fileInput = document.createElement("input");
          fileInput.type = "file";
          fileInput.accept = "image/*";
          fileInput.id = `img_${index}`;
          fileInput.className = "form-control form-control-sm mt-1";
          fileInput.style.marginBottom = "8px";
          
          wrapper.appendChild(fileLabel);
          wrapper.appendChild(fileInput);
      }

      const btn = document.createElement("button");
      btn.innerText = isReg ? "ลงทะเบียนกิจกรรมสำเร็จ ✅" : "ยืนยันลงทะเบียนด้วยรูปภาพ";
      btn.disabled = isReg;
      btn.style.backgroundColor = isReg ? "#28a745" : "#007bff";
      btn.style.color = "white";
      btn.style.border = "none";
      btn.style.padding = "6px 10px";
      btn.style.marginTop = "6px";
      btn.style.width = "100%";
      btn.style.borderRadius = "6px";
      btn.style.cursor = btn.disabled ? "not-allowed" : "pointer";

      btn.onclick = () => {
        if (!username) {
          if (confirm("กรุณาเข้าสู่ระบบก่อน")) {
            window.location.href = "login.html";
          }
          return;
        }

        const fileInput = document.getElementById(`img_${index}`);
        if (!fileInput.files[0]) {
          alert("❌ กรุณาเลือกรูปภาพก่อนลงทะเบียน");
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const imageData = e.target.result;
          const ok = saveRegister(dateStr, username, index, imageData);
          if (ok) {
            if (typeof updateStats === "function") updateStats();
            alert("ลงทะเบียนสำเร็จพร้อมแนบรูปภาพแล้ว ✅");
            selectDay(dateStr); 
          } else {
            alert("คุณได้ลงทะเบียนไว้แล้ว");
          }
        };
        reader.readAsDataURL(fileInput.files[0]);
      };
      wrapper.appendChild(btn);
    }
    container.appendChild(wrapper);
  });
}

// ✅ แก้ไข: ใช้ function isRegistered จาก storage.js (ตรวจสอบ Object ได้แม่นยำกว่า)
// หมายเหตุ: ถ้าใน storage.js มีอยู่แล้ว ไม่ต้องเขียนซ้ำที่นี่ก็ได้ครับ

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

// ✅ ตรวจสอบและอัปเดตการขาดกิจกรรม
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

      // ✅ แก้ไข: เช็คการลงทะเบียนให้รองรับทั้ง String และ Object
      const isUserRegistered = regs[date]?.some(r => {
          if (typeof r === 'string') return r === `${username}_${idx}`;
          return r.username === username && r.idx === idx;
      });

      const isLate = now > eventEnd && !isUserRegistered;
      if (isLate && !missed[key]) {
        missed[key] = true;
      }
    });
  });

  localStorage.setItem("missedEvents", JSON.stringify(missed));
  if (typeof updateStats === "function") updateStats();
}

checkMissedEvents();
