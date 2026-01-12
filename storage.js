// storage.js — เก็บ events + registrations ใน localStorage
const KEY_EVENTS = "events";
const KEY_REG = "registrations";

function getEvents() {
  return JSON.parse(localStorage.getItem(KEY_EVENTS) || "{}");
}

function saveEvents(events) {
  localStorage.setItem(KEY_EVENTS, JSON.stringify(events));
}

function getRegistrations(){
  return JSON.parse(localStorage.getItem(KEY_REG) || "{}");
}

function saveRegistrations(r){
  localStorage.setItem(KEY_REG, JSON.stringify(r));
}

/**
 * ปรับปรุง: รองรับการเก็บรูปภาพหลักฐานและเช็คข้อมูลอย่างปลอดภัย (แก้ไขเรื่อง Data Type)
 */
function saveRegister(date, username, idx = 0, imageData = null){
  if(!date || !username) return false;
  const regs = getRegistrations();
  if(!regs[date]) regs[date] = [];

  // แปลง idx เป็นตัวเลขเพื่อป้องกันปัญหา String vs Number
  const targetIdx = Number(idx);

  // ตรวจสอบว่าเคยลงทะเบียนไปหรือยัง
  const isExisted = regs[date].some(entry => {
    if (!entry) return false;
    
    // ถ้าข้อมูลเก่าเป็น String (เช่น "std01_0")
    if (typeof entry === 'string') {
      return entry === `${username}_${targetIdx}`;
    }
    
    // ถ้าข้อมูลใหม่เป็น Object - ใช้ == เพื่อความชัวร์ หรือเช็คผ่าน Number()
    return entry.username === username && Number(entry.idx) === targetIdx;
  });

  if(!isExisted){
    const newRegistration = {
      username: username,
      idx: targetIdx, // เก็บเป็นตัวเลข
      image: imageData, 
      timestamp: new Date().toISOString()
    };
    
    regs[date].push(newRegistration);
    saveRegistrations(regs);
    return true;
  }
  return false;
}

/**
 * ตรวจสอบสถานะการลงทะเบียน (ปรับปรุงให้เช็คแบบ Number)
 */
function isRegistered(date, username, idx = 0){
  const regs = getRegistrations();
  if(!regs[date]) return false;
  
  const targetIdx = Number(idx);
  
  return regs[date].some(entry => {
    if (!entry) return false;
    if (typeof entry === 'string') {
      return entry === `${username}_${targetIdx}`;
    }
    return entry.username === username && Number(entry.idx) === targetIdx;
  });
}
// --- ส่วนสำหรับเพิ่มนักเรียนทดสอบ (Test Account) ---
(function seedTestData() {
  const students = JSON.parse(localStorage.getItem("students") || "[]");
  
  // ตรวจสอบว่ามีนักเรียนคนนี้อยู่หรือยัง (เช็คจาก ID)
  const testStudentId = "660001";
  const hasTestStudent = students.some(s => s.id === testStudentId);

  if (!hasTestStudent) {
    const testStudent = {
      name: "นายทดสอบ ระบบดี",
      id: testStudentId,
      grade: "ปวช.1",
      dept: "เทคโนโลยีสารสนเทศ",
      dob: "010148" // ใช้เป็นรหัสผ่านในการ Login
    };
    
    students.push(testStudent);
    localStorage.setItem("students", JSON.stringify(students));
    console.log("✅ เพิ่มนักเรียนทดสอบเรียบร้อยแล้ว: ID 660001 / Pass: 010148");
  }
})();
// -------------------------------------------
// --- ส่วนสำหรับเพิ่มวิชาทดสอบ (Test Subject) ---
(function seedSubjectData() {
  const KEY_SUBJECTS = "subjects";
  let subjects = JSON.parse(localStorage.getItem(KEY_SUBJECTS) || "[]");
  
  // ตรวจสอบว่ามีวิชาทดสอบนี้อยู่หรือยัง (เช็คจากรหัสวิชา)
  const testSubjectCode = "TEST001";
  const hasTestSubject = subjects.some(s => s.code === testSubjectCode);

  if (!hasTestSubject) {
    const testSubject = {
      code: testSubjectCode,
      name: "วิชาทดสอบระบบ (ใช้ 0.5 แต้ม)",
      points: 0.5 // กำหนดแต้มที่ใช้ตามที่คุณต้องการ
    };
    
    subjects.push(testSubject);
    localStorage.setItem(KEY_SUBJECTS, JSON.stringify(subjects));
    console.log("✅ เพิ่มวิชาทดสอบเรียบร้อยแล้ว: TEST001 (0.5 แต้ม)");
  }
})();
// -------------------------------------------
