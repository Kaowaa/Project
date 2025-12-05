// storage.js — เก็บ events + registrations ใน localStorage
const KEY_EVENTS = "events";
const KEY_REG = "registrations";

function getEvents() {
  return JSON.parse(localStorage.getItem("events") || "{}");
}

function saveEvents(events) {
  localStorage.setItem("events", JSON.stringify(events));
}

function getRegistrations(){
  return JSON.parse(localStorage.getItem(KEY_REG) || "{}");
}

function saveRegistrations(r){
  localStorage.setItem(KEY_REG, JSON.stringify(r));
}

// เปลี่ยนชื่อฟังก์ชันนี้ !!!
function saveRegister(date, username, idx = 0){
  if(!date || !username) return false;
  const regs = getRegistrations();
  if(!regs[date]) regs[date] = [];
  const key = `${username}_${idx}`;
  if(!regs[date].includes(key)){
    regs[date].push(key);
    saveRegistrations(regs);
    return true;
  }
  return false;
}

function isRegistered(date, username, idx = 0){
  const regs = getRegistrations();
  if(!regs[date]) return false;
  const key = `${username}_${idx}`;
  return regs[date].includes(key);
}
