// auth.js — ระบบทดลองล็อกอิน (localStorage)
function login() {
  const user = document.getElementById("user").value.trim();
  const pass = document.getElementById("pass").value.trim();

  // ตัวอย่างรหัสจำลอง
  if (user === "student" && pass === "1234") {
    localStorage.setItem("student", user);
    alert("เข้าสู่ระบบสำเร็จ ✅");
    window.location.href = "index.html";
  } else {
    alert("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง ❌");
  }
}


function logout(){
  localStorage.removeItem('student');
  // refresh หน้า index เพื่ออัปเดต UI
  if(window.location.pathname.endsWith('index.html') || window.location.pathname === '/' ){
    window.location.reload();
  } else {
    window.location.href = 'index.html';
  }
}
