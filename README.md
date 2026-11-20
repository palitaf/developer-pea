# ระบบสั่งซื้อพัสดุ / วัสดุสำนักงาน — Angular + TypeScript

โครงสร้างแยก Frontend Angular และ Backend API (Express + SQLite) พร้อมระบบ Login/JWT และ Role-based access control

## ความสามารถ
- ผู้ใช้งานเข้าสู่ระบบด้วย username/password
- Roles: `requester` (ส่งคำขอสั่งซื้อ), `manager` (ดูรายการ/จัดการการตรวจรับ), `admin` (จัดการผู้ใช้และวัสดุ)
- ค้นหารายการวัสดุและจัดตะกร้าจำนวน
- ส่งคำขอสั่งซื้อและดูรายการสั่งซื้อ
- ผู้ดูแลเพิ่ม/ปิดใช้งานวัสดุ และจัดการผู้ใช้/กำหนด Role
- Backend ตรวจสิทธิ์ทุก API (ไม่พึ่งการซ่อนปุ่มในหน้าเว็บ)
- SQLite เก็บข้อมูลจริงในเครื่อง, มี seed ข้อมูลตัวอย่าง
- Angular แยก component / service / guard / model / page template และ stylesheet

## ต้องมี
- Node.js 20.19+ หรือ 22.12+
- npm

## เริ่มใช้งาน
เปิด Terminal ในโฟลเดอร์โปรเจกต์:

```bash
# 1) ติดตั้ง dependencies
npm install
npm run install:all

# 2) ตั้งค่า environment
cp server/.env.example server/.env
# แก้ JWT_SECRET ให้เป็นค่าสุ่มยาว ๆ และเปลี่ยน ADMIN_PASSWORD ก่อนใช้งานจริง

# 3) เริ่ม API + Angular dev server
npm run dev
```

เปิดเว็บที่ http://localhost:4200 และ API ที่ http://localhost:3000

บัญชีเริ่มต้นอ่านจาก `server/.env`:
- Username: `admin`
- Password: ค่า `ADMIN_PASSWORD` (ค่าเริ่มต้นสำหรับ local demo คือ `ChangeMe!123`)

**ก่อน deploy:** เปลี่ยน `JWT_SECRET`, `ADMIN_PASSWORD`, ตั้ง HTTPS, จำกัด CORS, ตั้ง backup SQLite และห้าม commit `.env` ขึ้น GitHub

## Build
```bash
npm run build
```
ไฟล์ Angular จะอยู่ใน `client/dist/` (ตาม Angular CLI)

## Deploy
Frontend และ API ต้อง deploy แยกกันหรือใช้ reverse proxy ให้ `/api` ชี้ไป backend
ตั้ง `environment.production.ts` ให้ `apiUrl` เป็น URL API จริง

## หมายเหตุเรื่องไฟล์ HTML เดิม
ไฟล์เดิมใช้ Google Apps Script Web App เป็นฐานข้อมูลและมีแบบฟอร์มเอกสาร/รายงานพิมพ์หลายรูปแบบ (รวมใบตรวจรับและชุดเอกสารกรณีวงเงินเกิน 10,000 บาท) โครงการนี้ย้าย workflow หลักสำหรับสั่งซื้อ วัสดุ รายการสั่งซื้อ และผู้ใช้/สิทธิ์ มาเป็น Angular + API ที่แยกส่วนแล้ว แต่ยังไม่ได้ย้ายรูปแบบเอกสารราชการ/สูตรสร้าง Word/ขั้นตอน Wizard ทั้งหมดแบบ pixel-perfect และไม่ได้เชื่อม Google Sheet เดิมอัตโนมัติ ต้องย้ายข้อมูลหรือทำ adapter เพิ่มก่อนใช้งานแทนระบบเดิมจริง

ระบบ Login ในโปรเจกต์นี้เป็น authentication จริงฝั่ง backend (bcrypt + JWT) ไม่ใช่การตรวจรหัสผ่านใน JavaScript ฝั่ง browser
