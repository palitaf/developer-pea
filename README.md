# ระบบสั่งซื้อพัสดุ / วัสดุสำนักงาน — Angular migration

โปรเจกต์นี้ย้าย UI และ workflow จาก `index (1).html` ที่ให้มา โดยคง markup, modal, ตาราง, ฟอร์มพิมพ์, เอกสาร PEA, เอกสารวงเงินเกิน 10,000 บาท 4 ขั้นตอน และ logic JavaScript เดิมไว้ใน TypeScript service แยกจาก Angular component. การเรียก Google Apps Script ทั้งหมดผ่าน API proxy ที่ต้อง Login ก่อน

## โครงสร้าง
- `client/` Angular 19 standalone components, routing, guards, interceptor และ legacy workflow service; แยกหน้าทำงาน, เอกสารพิมพ์ และ popup ยืนยันเป็น component/template คนละไฟล์
- `server/` Express API, JWT, bcrypt, SQLite สำหรับบัญชีผู้ใช้ และ Google Apps Script proxy
- Google Sheets ยังคงเป็นฐานข้อมูลธุรกรรมวัสดุ/คำสั่งซื้อเดิม ผ่าน Apps Script Web App URL

## Run local
ต้องใช้ Node.js 20.19+ หรือ 22.x

```bash
npm install
npm run install:all
cp server/.env.example server/.env
# ค่า `GAS_WEB_APP_URL` ใน `.env.example` ใส่ URL deployment เดิมที่พบใน HTML ให้แล้ว (ตรวจสอบว่า deployment ยังใช้งานได้)
# เปลี่ยน JWT_SECRET เป็นค่าสุ่มอย่างน้อย 32 ตัว และตั้ง ADMIN_PASSWORD ใหม่
npm run dev
```
Frontend: http://localhost:4200 — API: http://localhost:3000/api/health

## Google Sheets setup
1. ใช้ Google Apps Script Web App deployment เดิมที่เชื่อม Spreadsheet เดิม
2. ตั้ง `GAS_WEB_APP_URL` ใน `server/.env` เป็น URL `/exec` เดิม (ห้ามใส่ใน frontend)
3. Apps Script ต้องอนุญาตให้ backend เข้าถึงได้และ deployment ต้องทำงานในสิทธิ์ที่เหมาะสม
4. API proxy คง contract เดิม: GET root เพื่ออ่าน master materials, GET `?action=getOrders`, POST payload เดิม และ action `addItem`, `deleteOrder`, `deleteMultipleOrders`

## Roles
- `requester`: login และส่งคำขอสั่งซื้อ
- `manager`: ดูรายการสั่งซื้อและใช้ขั้นตอนตรวจรับ/จัดทำเอกสารเดิม
- `admin`: ทุกอย่าง รวมเพิ่มวัสดุ ลบรายการ และจัดการ user/role

สิทธิ์ของ API ถูกตรวจที่ server ไม่ได้อาศัยแค่ซ่อนปุ่ม. รหัสผ่านเดิม `1234` ในหน้าตรวจรับถูกแทนด้วย role ที่ยืนยันจาก JWT. ผู้ใช้เริ่มต้น: username จาก `ADMIN_USERNAME`, password จาก `ADMIN_PASSWORD`.

## Deploy แยก Frontend / API
### API (Render แนะนำ)
1. Push repository ไป GitHub
2. สร้าง Web Service บน Render จาก repo โดยใช้ `render.yaml` หรือกำหนด Root Directory=`server`, Build=`npm install`, Start=`npm start`
3. ตั้ง Environment Variables: `JWT_SECRET` (สุ่มยาว), `ADMIN_PASSWORD`, `GAS_WEB_APP_URL`, `CLIENT_ORIGIN` (โดเมนเว็บจริง)
4. เปิด Persistent Disk ที่ `/var/data` และตั้ง `DB_PATH=/var/data/users.db` เพื่อรักษาบัญชีผู้ใช้หลัง deploy

### Frontend (GitHub Pages)
1. ตั้ง GitHub repository variable ชื่อ `API_BASE_URL` เป็น `https://<ชื่อ-api>.onrender.com/api` (workflow จะ inject ค่านี้ตอน build)
2. Push branch `main`; workflow `.github/workflows/deploy-pages.yml` จะ build Angular ด้วย hash routing และ deploy GitHub Pages
3. ตั้ง `CLIENT_ORIGIN` ฝั่ง API ให้ตรง origin ของ GitHub Pages
4. เปิด Settings → Pages → Build and deployment → GitHub Actions

หมายเหตุ: GitHub Pages เป็น static hosting เท่านั้น ไม่สามารถรัน Express API หรือเก็บ SQLite ได้ จึงต้อง deploy API แยกตามที่เลือก. ถ้าใช้ custom domain ให้ตั้ง `apiBase` และ CORS ตามโดเมนจริง.

## ข้อจำกัด/สิ่งที่ต้องตรวจสอบก่อน Production
- การย้ายนี้รักษา workflow/เอกสารจาก HTML ต้นฉบับไว้เป็น legacy workflow TypeScript เพื่อไม่ทำข้อมูลหรือรูปแบบเอกสารหาย แต่ยังเป็นขั้นตอน compatibility migration; การ refactor แต่ละ modal เป็น Angular child component แบบ declarative ควรทำต่อเป็นเฟสถัดไปโดยเทียบ output เอกสารทีละแบบ
- ฟังก์ชันเปิด/ปิดรับรายการใน HTML เดิมเป็น state ฝั่ง browser; ยังไม่ใช่ setting กลางที่ sync ทุกผู้ใช้ เพราะ Apps Script เดิมไม่มี action สำหรับ setting นี้ใน source ที่ให้มา
- ตรวจสอบสิทธิ์ของ Apps Script deployment และทดสอบการตอบกลับ CORS/proxy กับ Spreadsheet จริงก่อนเปิดใช้
- ก่อน production ให้ทดสอบ print A4, Word download, Thai Baht text, VAT modes และทั้ง 4 ขั้น wizard เทียบกับระบบเดิม
- เปลี่ยนรหัสผ่านเริ่มต้นทันที; ห้าม commit `.env` หรือ secret ขึ้น GitHub
