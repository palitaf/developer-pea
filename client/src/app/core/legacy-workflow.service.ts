// @ts-nocheck
import { Injectable } from '@angular/core';
// Legacy workflow migrated from the supplied HTML. Existing calculations, dialogs and document generation are preserved.
@Injectable({providedIn:'root'})
export class LegacyWorkflowService {
  initialize(role: string): void {
  (window as any).__CURRENT_ROLE__ = role;
  const legacyFetch = (input: RequestInfo | URL, init: RequestInit = {}) => {
    const headers = new Headers(init.headers || {});
    const token = sessionStorage.getItem('pea.auth.token');
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return window.fetch(input, { ...init, headers });
  };

    const GAS_WEB_APP_URL = (window as any).__APP_CONFIG__?.apiBase || "/api";

    let materialsList = [];
    let selectedCart = {};
    let rawAdminOrders = [];
    let currentFilteredOrders = [];
    let compareItemsList = [];
    let isSystemOpen = true;
    let currentWizardStep = 1;

    function showLoading(msg = "กำลังประมวลผล กรุณารอสักครู่...") {
      document.getElementById('loadingText').innerText = msg;
      document.getElementById('loadingOverlay').classList.remove('hidden');
    }

    function hideLoading() {
      document.getElementById('loadingOverlay').classList.add('hidden');
    }

    function setAutoCurrentMonth() {
      const thaiMonths = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
      const thaiShortMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
      const now = new Date();
      const formattedText = `ประจำเดือน ${thaiMonths[now.getMonth()]} ${now.getFullYear()}`;
      const monthInput = document.getElementById('orderMonth');
      if (monthInput) monthInput.value = formattedText;
    }
function fetchMasterItems() {
      showLoading("กำลังโหลดข้อมูลรายการวัสดุ...");
      legacyFetch(`${GAS_WEB_APP_URL}/sheets`)
        .then(res => res.json())
        .then(res => {
          if (res.status === "success") {
            materialsList = res.data;
            renderItems(materialsList);
          } else { alert("เกิดข้อผิดพลาดในการโหลดข้อมูล: " + res.message); }
        })
        .catch(err => {
          const tbody = document.getElementById('itemsTableBody');
          if (tbody) tbody.innerHTML = `<tr><td colspan="4" class="text-center py-8 text-rose-500">ไม่สามารถดึงข้อมูลรายการวัสดุได้</td></tr>`;
        })
        .finally(() => hideLoading());
    }

    function renderItems(items) {
      const tbody = document.getElementById('itemsTableBody');
      tbody.innerHTML = '';
      if (!items || items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center py-8 text-slate-400">ไม่พบรายการวัสดุในระบบ</td></tr>`;
        return;
      }
      items.forEach(item => {
        const qty = selectedCart[item.id] || 0;
        const tr = document.createElement('tr');
        tr.className = qty > 0 ? "bg-purple-50/40 hover:bg-purple-50 transition" : "hover:bg-slate-50 transition";
        tr.innerHTML = `
          <td class="py-2.5 px-4 text-xs font-semibold text-purple-700 whitespace-nowrap">#${item.id || '-'}</td>
          <td class="py-2.5 px-4 font-medium text-slate-800">${item.name}</td>
          <td class="py-2.5 px-4 text-center text-xs text-slate-600 whitespace-nowrap">${item.unit || '-'}</td>
          <td class="py-2.5 px-4 text-center whitespace-nowrap">
            <div class="inline-flex items-center space-x-1">
              <button type="button" onclick="updateQty('${item.id}', -1)" class="w-8 h-8 rounded-lg border bg-white text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold">-</button>
              <input type="number" id="qty-${item.id}" value="${qty}" min="0" oninput="handleDirectInput('${item.id}', this.value)" class="w-14 h-8 text-center font-bold text-sm border rounded-lg focus:ring-2 focus:ring-purple-600 outline-none bg-white">
              <button type="button" onclick="updateQty('${item.id}', 1)" class="w-8 h-8 rounded-lg border bg-purple-700 text-white hover:bg-purple-800 flex items-center justify-center font-bold">+</button>
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }
    function filterItems() {
  const query = document.getElementById('searchInput').value.trim().toLowerCase();
  if (!query) {
    renderItems(materialsList);
    return;
  }
  const filtered = materialsList.filter(item => {
    const itemName = item.name ? String(item.name).toLowerCase() : "";
    const itemId = item.id ? String(item.id).toLowerCase() : "";
    return itemName.includes(query) || itemId.includes(query);
  });
  renderItems(filtered);
}
    function updateQty(id, change) {
  if (!isSystemOpen) { alert("ขณะนี้ระบบปิดรับคำสั่งซื้อชั่วคราว"); return; }
  let current = selectedCart[id] || 0;
  current += change;
  if (current < 0) current = 0;
  if (current === 0) { delete selectedCart[id]; } else { selectedCart[id] = current; }
  const qtyInput = document.getElementById(`qty-${id}`);
  if (qtyInput) qtyInput.value = current;
  calculateTotals();
}

function handleDirectInput(id, value) {
  if (!isSystemOpen) { alert("ขณะนี้ระบบปิดรับคำสั่งซื้อชั่วคราว"); return; }
  let val = parseInt(value, 10);
  if (isNaN(val) || val < 0) val = 0;
  if (val === 0) { delete selectedCart[id]; } else { selectedCart[id] = val; }
  calculateTotals();
}

function calculateTotals() {
  const selectedKeys = Object.keys(selectedCart);
  let totalQty = 0;
  selectedKeys.forEach(k => totalQty += selectedCart[k]);
  document.getElementById('selectedCount').innerText = selectedKeys.length;
  document.getElementById('totalQuantity').innerText = totalQty;
}
    function submitOrder() {
      if (!isSystemOpen) { alert("ขณะนี้ระบบปิดรับคำสั่งซื้อชั่วคราว"); return; }
      const department = document.getElementById('userDepartment').value;
      const month = document.getElementById('orderMonth').value;
      if (!department || !month) { alert('กรุณากรอกแผนกและรอบเดือนให้ครบถ้วน'); return; }
      const selectedKeys = Object.keys(selectedCart).filter(id => (selectedCart[id] || 0) > 0);
      if (selectedKeys.length === 0) { alert('กรุณาเลือกรายการพัสดุอย่างน้อย 1 รายการ'); return; }

      document.getElementById('confirmDeptText').innerText = department;
      document.getElementById('confirmMonthText').innerText = month;
      renderConfirmOrderModal();
      document.getElementById('confirmOrderModal').classList.remove('hidden');
    }

    function closeConfirmOrderModal() {
      document.getElementById('confirmOrderModal').classList.add('hidden');
    }

    function renderConfirmOrderModal() {
      const tbody = document.getElementById('confirmItemsTableBody');
      tbody.innerHTML = '';

      const selectedKeys = Object.keys(selectedCart).filter(id => (selectedCart[id] || 0) > 0);
      let totalQty = 0;

      if (selectedKeys.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-slate-400">ไม่มีรายการที่เลือก</td></tr>`;
        document.getElementById('confirmModalItemCount').innerText = 0;
        document.getElementById('confirmModalTotalQty').innerText = 0;
        return;
      }

      selectedKeys.forEach((id, idx) => {
        const itemObj = materialsList.find(m => String(m.id) === String(id));
        const qty = selectedCart[id] || 0;
        totalQty += qty;

        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50";
        tr.innerHTML = `
          <td class="py-2.5 px-3 text-center text-slate-500">${idx + 1}</td>
          <td class="py-2.5 px-3 font-medium text-slate-800">${itemObj ? itemObj.name : id}</td>
          <td class="py-2.5 px-3 text-center font-bold text-purple-800">${qty}</td>
          <td class="py-2.5 px-3 text-center text-xs text-slate-600">${itemObj ? (itemObj.unit || '-') : '-'}</td>
          <td class="py-2.5 px-3 text-center">
            <button type="button" onclick="removeItemFromConfirmModal('${id}')" class="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-semibold transition">
              <i class="fa-solid fa-trash-can mr-1"></i> ลบ
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });

      document.getElementById('confirmModalItemCount').innerText = selectedKeys.length;
      document.getElementById('confirmModalTotalQty').innerText = totalQty;
    }

    function removeItemFromConfirmModal(id) {
      delete selectedCart[id];
      const qtyInput = document.getElementById(`qty-${id}`);
      if (qtyInput) qtyInput.value = 0;
      calculateTotals();
      renderConfirmOrderModal();

      const remainingKeys = Object.keys(selectedCart).filter(k => (selectedCart[k] || 0) > 0);
      if (remainingKeys.length === 0) {
        closeConfirmOrderModal();
        alert('ลบรายการออกจนหมดแล้ว กรุณาเลือกรายการพัสดุก่อนส่ง');
      }
    }

    function confirmAndSendOrder() {
      if (!isSystemOpen) { alert("ขณะนี้ระบบปิดรับคำสั่งซื้อชั่วคราว"); return; }
      const department = document.getElementById('userDepartment').value;
      const month = document.getElementById('orderMonth').value;
      const selectedKeys = Object.keys(selectedCart).filter(id => (selectedCart[id] || 0) > 0);

      if (!department || !month) {
        closeConfirmOrderModal();
        alert('กรุณากรอกแผนกและรอบเดือนให้ครบถ้วน');
        return;
      }
      if (selectedKeys.length === 0) {
        closeConfirmOrderModal();
        alert('กรุณาเลือกรายการพัสดุอย่างน้อย 1 รายการ');
        return;
      }

      let itemsArray = [];
      selectedKeys.forEach(id => {
        const itemObj = materialsList.find(m => String(m.id) === String(id));
        if (itemObj) {
          itemsArray.push({ name: itemObj.name, quantity: selectedCart[id], unit: itemObj.unit });
        }
      });

      const payload = { department: department, round: month, items: itemsArray };
      const submitBtn = document.getElementById('submitBtn');
      const confirmSendBtn = document.getElementById('confirmSendBtn');
      submitBtn.disabled = true;
      confirmSendBtn.disabled = true;
      showLoading("กำลังส่งข้อมูลรายการสั่งซื้อ...");

      legacyFetch(`${GAS_WEB_APP_URL}/sheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      })
      .then(res => res.json())
      .then(res => {
        if (res.status === "success") {
          closeConfirmOrderModal();
          alert('บันทึกความต้องการสั่งซื้อสำเร็จแล้ว!');
          selectedCart = {};
          calculateTotals();
          renderItems(materialsList);
        } else { alert('เกิดข้อผิดพลาด: ' + res.message); }
      })
      .catch(err => alert('เกิดข้อผิดพลาดในการส่งข้อมูล: ' + err))
      .finally(() => {
        hideLoading();
        submitBtn.disabled = false;
        confirmSendBtn.disabled = false;
      });
    }

    function toggleSystemStatus() {
      isSystemOpen = !isSystemOpen;
      const btn = document.getElementById('toggleSystemBtn');
      const banner = document.getElementById('systemClosedBanner');
      const submitBtn = document.getElementById('submitBtn');
      if (isSystemOpen) {
        btn.className = "px-3 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-lg transition";
        btn.innerHTML = `<i class="fa-solid fa-toggle-on mr-1"></i> เปิดรับรายการ`;
        banner.classList.add('hidden');
        submitBtn.disabled = false;
        submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      } else {
        btn.className = "px-3 py-1 bg-rose-600 text-white text-xs font-semibold rounded-lg transition";
        btn.innerHTML = `<i class="fa-solid fa-toggle-off mr-1"></i> ปิดรับรายการแล้ว`;
        banner.classList.remove('hidden');
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
      }
    }

    function switchAdminTab(tab) {
      if (tab === 'orders') {
        document.getElementById('adminOrdersTab').classList.remove('hidden');
        document.getElementById('adminAddItemTab').classList.add('hidden');
        document.getElementById('tabOrdersBtn').className = "px-4 py-2 rounded-lg font-medium text-sm bg-purple-100 text-purple-800";
        document.getElementById('tabAddItemBtn').className = "px-4 py-2 rounded-lg font-medium text-sm text-slate-600 hover:bg-slate-100";
        fetchAdminOrders();
      } else {
        document.getElementById('adminOrdersTab').classList.add('hidden');
        document.getElementById('adminAddItemTab').classList.remove('hidden');
        document.getElementById('tabAddItemBtn').className = "px-4 py-2 rounded-lg font-medium text-sm bg-purple-100 text-purple-800";
        document.getElementById('tabOrdersBtn').className = "px-4 py-2 rounded-lg font-medium text-sm text-slate-600 hover:bg-slate-100";
        autoFillNextItemId();
      }
    }

    function fetchAdminOrders() {
      const tableBody = document.getElementById('adminOrdersTable');
      tableBody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-slate-400">กำลังโหลดข้อมูลการสั่งซื้อ...</td></tr>`;
      showLoading("กำลังโหลดข้อมูลสั่งซื้อฝั่ง Admin...");

      legacyFetch(`${GAS_WEB_APP_URL}/sheets?action=getOrders`)
        .then(res => res.json())
        .then(res => {
          if (res.status === "success") {
            rawAdminOrders = res.data;
            populateMonthFilterOptions(rawAdminOrders);
            filterAdminOrders();
          } else {
            tableBody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-rose-500">เกิดข้อผิดพลาด: ${res.message}</td></tr>`;
          }
        })
        .catch(err => { tableBody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-rose-500">ไม่สามารถโหลดข้อมูลได้</td></tr>`; })
        .finally(() => hideLoading());
    }

    // ฟังก์ชันเปิดหน้าดูข้อมูลการสั่งซื้อทันทีโดยไม่ต้องใส่รหัสผ่าน
    function openAdminCheckModal() {
      document.getElementById('adminModal').classList.remove('hidden');
      fetchAdminOrders();
    }

    function toggleAdminModal() { 
      document.getElementById('adminModal').classList.toggle('hidden'); 
    }

    // ฟังก์ชันป้องกันปุ่ม "ตรวจรับ & ใบวางบิล" ด้วยรหัสผ่าน
    function promptComparePassword() {
      document.getElementById('comparePasswordInput').value = '';
      document.getElementById('passwordModal').classList.remove('hidden');
    }

    function closePasswordModal() {
      document.getElementById('passwordModal').classList.add('hidden');
    }

    function verifyComparePassword() {
      const pass = document.getElementById('comparePasswordInput').value;
      if ((window as any).__CURRENT_ROLE__ === "admin" || (window as any).__CURRENT_ROLE__ === "manager") { // ตรวจสอบ Role จาก session
        closePasswordModal();
        openCompareModal();
      } else {
        alert('รหัสผ่านไม่ถูกต้อง');
        document.getElementById('comparePasswordInput').value = '';
      }
    }

    function populateMonthFilterOptions(orders) {
      const monthSelect = document.getElementById('adminMonthFilter');
      const currentSelected = monthSelect.value;
      const uniqueMonths = [...new Set(orders.map(o => o.round).filter(r => r && r.trim() !== ''))];
      monthSelect.innerHTML = '<option value="ALL">-- แสดงทุกรอบเดือน --</option>';
      uniqueMonths.forEach(m => {
        const option = document.createElement('option');
        option.value = m;
        option.textContent = m;
        monthSelect.appendChild(option);
      });
      if (uniqueMonths.includes(currentSelected)) monthSelect.value = currentSelected;
    }

    function filterAdminOrders() {
      const selectedDept = document.getElementById('adminDeptFilter').value;
      const selectedMonth = document.getElementById('adminMonthFilter').value;
      let filtered = rawAdminOrders;

      if (selectedDept !== 'ALL') {
        filtered = filtered.filter(o => {
          const sheetDept = o.department ? String(o.department).trim() : "";
          const filterDept = selectedDept.trim();
          return sheetDept.toLowerCase() === filterDept.toLowerCase() || sheetDept.includes(filterDept) || filterDept.includes(sheetDept);
        });
      }

      if (selectedMonth !== 'ALL') {
        filtered = filtered.filter(o => {
          const sheetRound = o.round ? String(o.round).trim() : "";
          const filterRound = selectedMonth.trim();
          return sheetRound === filterRound;
        });
      }

      currentFilteredOrders = filtered;
      renderAdminTable(filtered);
    }

    function renderAdminTable(orders) {
      const tableBody = document.getElementById('adminOrdersTable');
      tableBody.innerHTML = '';
      document.getElementById('selectAllCheckbox').checked = false;
      updateDeleteButtonUI();

      if (!orders || orders.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-slate-400">ไม่พบรายการสั่งซื้อ</td></tr>`;
        return;
      }

      orders.forEach(order => {
        const tr = document.createElement('tr');
        tr.className = "border-b hover:bg-slate-50";
        let dateStr = order.timestamp ? new Date(order.timestamp).toLocaleString('th-TH') : '-';
        tr.innerHTML = `
          <td class="p-3 text-center">
            <input type="checkbox" class="row-checkbox w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer" value="${order.rowIndex}" onchange="updateDeleteButtonUI()">
          </td>
          <td class="p-3 text-xs">${dateStr}</td>
          <td class="p-3 font-semibold text-slate-800">${order.department || '-'}</td>
          <td class="p-3 text-xs font-medium text-purple-700">${order.round || '-'}</td>
          <td class="p-3 text-xs font-medium text-slate-800">${order.itemName || '-'}</td>
          <td class="p-3 text-center font-bold text-purple-700">${toThaiDigits(order.quantity || 0)}</td>
          <td class="p-3 text-center text-xs text-slate-500">${order.unit || '-'}</td>
          <td class="p-3 text-center">
            <button onclick="deleteOrder(${order.rowIndex})" class="text-rose-600 hover:text-rose-800 text-xs px-2 py-1 rounded bg-rose-50 hover:bg-rose-100">
              <i class="fa-solid fa-trash"></i> ลบ
            </button>
          </td>
        `;
        tableBody.appendChild(tr);
      });
    }

    function toggleSelectAllRows(isChecked) {
      const checkboxes = document.querySelectorAll('.row-checkbox');
      checkboxes.forEach(cb => cb.checked = isChecked);
      updateDeleteButtonUI();
    }

    function updateDeleteButtonUI() {
      const selected = document.querySelectorAll('.row-checkbox:checked');
      const deleteBtn = document.getElementById('deleteSelectedBtn');
      const countSpan = document.getElementById('selectedDeleteCount');
      if (selected.length > 0) {
        deleteBtn.classList.remove('hidden');
        countSpan.innerText = selected.length;
      } else {
        deleteBtn.classList.add('hidden');
        countSpan.innerText = 0;
      }
    }

    function deleteSelectedOrders() {
      const selectedCheckboxes = document.querySelectorAll('.row-checkbox:checked');
      const selectedRowIndexes = Array.from(selectedCheckboxes).map(cb => cb.value);
      if (selectedRowIndexes.length === 0) { alert('กรุณาเลือกรายการที่ต้องการลบอย่างน้อย 1 รายการ'); return; }
      if (!confirm(`คุณต้องการลบรายการที่เลือกทั้งหมด ${selectedRowIndexes.length} รายการใช่หรือไม่?`)) return;

      showLoading(`กำลังลบ ${selectedRowIndexes.length} รายการ...`);
      legacyFetch(`${GAS_WEB_APP_URL}/sheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'deleteMultipleOrders', rowIndexes: selectedRowIndexes })
      })
      .then(res => res.json())
      .then(res => {
        if (res.status === "success") { alert('ลบรายการที่เลือกเรียบร้อย'); fetchAdminOrders(); }
        else { alert('เกิดข้อผิดพลาด: ' + res.message); }
      })
      .finally(() => hideLoading());
    }

    function deleteOrder(rowIndex) {
      if (!confirm(`คุณต้องการลบรายการนี้ใช่หรือไม่?`)) return;
      showLoading("กำลังลบรายการ...");
      legacyFetch(`${GAS_WEB_APP_URL}/sheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'deleteOrder', rowIndex: rowIndex })
      })
      .then(res => res.json())
      .then(res => {
        if (res.status === "success") { alert('ลบรายการเรียบร้อย'); fetchAdminOrders(); }
        else { alert('เกิดข้อผิดพลาด: ' + res.message); }
      })
      .finally(() => hideLoading());
    }

    function addNewItemToSheet() {
      const id = document.getElementById('newItemId').value.trim();
      const name = document.getElementById('newItemName').value.trim();
      const unit = document.getElementById('newItemUnit').value.trim();
      if (!name || !unit) { alert('กรุณากรอกชื่อรายการและหน่วยนับ'); return; }

      showLoading("กำลังบันทึกพัสดุรายการใหม่...");
      legacyFetch(`${GAS_WEB_APP_URL}/sheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'addItem', id: id, name: name, unit: unit })
      })
      .then(res => res.json())
      .then(res => {
        if (res.status === "success") {
          alert('เพิ่มรายการวัสดุใหม่สำเร็จ!');
          document.getElementById('newItemId').value = '';
          document.getElementById('newItemName').value = '';
          document.getElementById('newItemUnit').value = '';
          fetchMasterItems();
        } else { alert('เกิดข้อผิดพลาด: ' + res.message); }
      })
      .finally(() => hideLoading());
    }
    function getNextAutoItemId() {
      let maxNum = 0;
      (materialsList || []).forEach(item => {
        if (item && item.id !== undefined && item.id !== null) {
          // ดึงเฉพาะตัวเลขออกจากรหัส เช่น "80" -> 80 หรือ "OFF-080" -> 80
          const match = String(item.id).match(/\d+/g);
          if (match) {
            const num = parseInt(match[match.length - 1], 10);
            if (!isNaN(num) && num > maxNum) {
              maxNum = num;
            }
          }
        }
      });
      return String(maxNum + 1);
    }

    function autoFillNextItemId() {
      const idInput = document.getElementById('newItemId');
      if (idInput) {
        idInput.value = getNextAutoItemId();
      }
    }
    function printSummaryReport() {
      if (!currentFilteredOrders || currentFilteredOrders.length === 0) { alert("ไม่มีข้อมูลรายการสั่งซื้อในตัวกรองปัจจุบัน"); return; }
      const summaryMap = {};
      currentFilteredOrders.forEach(order => {
        const name = order.itemName;
        const qty = parseInt(order.quantity, 10) || 0;
        const unit = order.unit || '-';
        if (name) {
          if (!summaryMap[name]) summaryMap[name] = { quantity: 0, unit: unit };
          summaryMap[name].quantity += qty;
        }
      });
      const summaryList = Object.keys(summaryMap).map(name => ({ name: name, quantity: summaryMap[name].quantity, unit: summaryMap[name].unit }));
      if (summaryList.length === 0) { alert("ไม่พบข้อมูลพัสดุที่สามารถสรุปยอดได้"); return; }

      const selectedDept = document.getElementById('adminDeptFilter').value;
      const selectedMonth = document.getElementById('adminMonthFilter').value;
      let titleText = selectedDept !== 'ALL' ? `รายการวัสดุที่สั่งซื้อ (${selectedDept})` : "รายการวัสดุที่สั่งซื้อ (รวมทุกแผนก)";
      document.getElementById('printTitle').innerText = titleText;
      document.getElementById('printSubtitle').innerText = selectedMonth !== 'ALL' ? selectedMonth : "";

      const printTbodyEl = document.getElementById('printTableBody');
      printTbodyEl.innerHTML = '';
      summaryList.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">${toThaiDigits(index + 1)}</td>
          <td style="border: 1px solid #000; padding: 6px 8px;">${item.name}</td>
          <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">${item.unit || '-'}</td>
          <td style="border: 1px solid #000; padding: 6px 8px; text-align: center; font-weight: bold;">${toThaiDigits(item.quantity)}</td>
        `;
        printTbodyEl.appendChild(tr);
      });

      document.body.classList.add('printing-summary');
      document.body.classList.remove('printing-pea', 'printing-over10k-1', 'printing-over10k-2', 'printing-over10k-3', 'printing-over10k-4');
      window.print();
      document.body.classList.remove('printing-summary');
    }

    function openCompareModal() {
      if (!currentFilteredOrders || currentFilteredOrders.length === 0) { alert("ไม่มีข้อมูลรายการสั่งซื้อในตัวกรองปัจจุบัน"); return; }
      buildCompareList();
      document.getElementById('compareModal').classList.remove('hidden');
      renderCompareTable();
    }

    function closeCompareModal() { document.getElementById('compareModal').classList.add('hidden'); }

    function buildCompareList() {
      const summaryMap = {};
      currentFilteredOrders.forEach(order => {
        const name = order.itemName;
        const qty = parseInt(order.quantity, 10) || 0;
        const unit = order.unit || '-';
        if (name) {
          if (!summaryMap[name]) summaryMap[name] = { orderedQty: 0, unit: unit };
          summaryMap[name].orderedQty += qty;
        }
      });
      compareItemsList = Object.keys(summaryMap).map(name => ({
        name: name,
        orderedQty: summaryMap[name].orderedQty,
        receivedQty: summaryMap[name].orderedQty,
        isMatch: true,
        isSelected: true, // ค่าเริ่มต้นให้ติ๊กเลือกทุกรายการ
        unit: summaryMap[name].unit,
        unitPrice: 0,
        totalAmount: 0
      }));
    }

    function renderCompareTable() {
      const tbody = document.getElementById('compareTableBody');
      tbody.innerHTML = '';
      compareItemsList.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.className = "border-b hover:bg-slate-50";
        tr.innerHTML = `
          <td class="p-2 border text-center">
            <input type="checkbox" ${item.isSelected !== false ? 'checked' : ''} onchange="handleItemSelect(${index}, this.checked)" class="compare-item-checkbox w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer">
          </td>
          <td class="p-2 border text-center font-semibold">${index + 1}</td>
          <td class="p-2 border font-medium text-slate-800">${item.name}</td>
          <td class="p-2 border text-center font-bold text-slate-600">${item.orderedQty}</td>
          <td class="p-2 border text-center">
            <select onchange="handleMatchChange(${index}, this.value)" class="p-1 border rounded text-xs bg-white font-medium">
              <option value="true" ${item.isMatch ? 'selected' : ''}>✔ ตรงตามสั่ง</option>
              <option value="false" ${!item.isMatch ? 'selected' : ''}>❌ ไม่ตรง/รับไม่ครบ</option>
            </select>
          </td>
          <td class="p-2 border text-center">
            <input type="number" value="${item.receivedQty}" min="0" ${item.isMatch ? 'disabled class="w-16 p-1 border rounded text-center bg-slate-100 font-bold text-slate-500 cursor-not-allowed"' : 'class="w-16 p-1 border rounded text-center bg-white font-bold text-purple-700 outline-none focus:ring-2 focus:ring-purple-600"'} oninput="handleReceivedQtyInput(${index}, this.value)">
          </td>
          <td class="p-2 border text-center text-slate-500">${item.unit || '-'}</td>
          <td class="p-2 border text-center">
            <input type="number" step="0.01" value="${item.unitPrice || ''}" placeholder="0.00" oninput="handleUnitPriceInput(${index}, this.value)" class="w-24 p-1 border rounded text-right bg-white font-semibold outline-none focus:ring-2 focus:ring-purple-600">
          </td>
          <td class="p-2 border text-right font-bold text-slate-800" id="itemTotal-${index}">
            ${(item.totalAmount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </td>
        `;
        tbody.appendChild(tr);
      });
      calculateCompareTotals();
    }

    function handleItemSelect(index, isChecked) {
      compareItemsList[index].isSelected = isChecked;
      calculateCompareTotals();
    }

    function toggleSelectAllCompare(isChecked) {
      compareItemsList.forEach(item => item.isSelected = isChecked);
      const checkboxes = document.querySelectorAll('.compare-item-checkbox');
      checkboxes.forEach(cb => cb.checked = isChecked);
      calculateCompareTotals();
    }

    function handleMatchChange(index, value) {
      const isMatch = (value === 'true');
      compareItemsList[index].isMatch = isMatch;
      if (isMatch) compareItemsList[index].receivedQty = compareItemsList[index].orderedQty;
      renderCompareTable();
    }

    function handleReceivedQtyInput(index, val) {
      let q = parseInt(val, 10);
      compareItemsList[index].receivedQty = (isNaN(q) || q < 0) ? 0 : q;
      updateItemTotal(index);
    }

    function handleUnitPriceInput(index, val) {
      let p = parseFloat(val);
      compareItemsList[index].unitPrice = (isNaN(p) || p < 0) ? 0 : p;
      updateItemTotal(index);
    }

    function updateItemTotal(index) {
      const item = compareItemsList[index];
      item.totalAmount = item.receivedQty * item.unitPrice;
      const el = document.getElementById(`itemTotal-${index}`);
      if (el) el.innerText = item.totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      calculateCompareTotals();
    }

    function calculateCompareTotals() {
      let grandTotal = 0;
      // คำนวณเฉพาะรายการที่ถูกติ๊กเลือก (isSelected === true)
      compareItemsList.forEach(item => {
        if (item.isSelected) {
          grandTotal += (item.totalAmount || 0);
        }
      });
      document.getElementById('grandTotalText').innerText = grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      document.getElementById('bahtTextThai').innerText = `(${ArabicToThaiBaht(grandTotal)})`;

      const warningEl = document.getElementById('amountWarning');
      const btnOver10k = document.getElementById('btnOver10kFlow');
      const btnWord = document.getElementById('btnWordReport');
      const btnPea = document.getElementById('btnPeaReport');

      if (grandTotal > 10000) {
        warningEl.className = "text-xs font-bold text-rose-600 flex items-center";
        warningEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-1"></i> วงเงินเกิน 10,000 บาท (ต้องใช้แบบฟอร์มจัดซื้อจัดจ้างวิธีเฉพาะเจาะจง)`;
        btnOver10k.classList.remove('hidden');
        btnWord.classList.add('hidden');
        btnPea.classList.add('hidden');
      } else {
        warningEl.className = "text-xs font-bold text-emerald-700 flex items-center";
        warningEl.innerHTML = `<i class="fa-solid fa-circle-check mr-1"></i> วงเงินไม่เกิน 10,000 บาท (ใช้แบบฟอร์มขอความเห็นชอบได้ปกติ)`;
        btnOver10k.classList.add('hidden');
        btnWord.classList.remove('hidden');
        btnPea.classList.remove('hidden');
      }
    }

    function ArabicToThaiBaht(numbers) {
      numbers = Number(numbers).toFixed(2);
      const numberArray = numbers.split('.');
      let baht = numberArray[0];
      let satang = numberArray[1];
      if (Number(numbers) === 0) return 'ศูนย์บาทถ้วน';
      const thaiNumbers = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
      const thaiDigits = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];
      function readNumber(numStr) {
        let text = "";
        const len = numStr.length;
        for (let i = 0; i < len; i++) {
          let digit = parseInt(numStr.charAt(i), 10);
          let pos = len - i - 1;
          if (digit !== 0) {
            if (pos === 1 && digit === 1) text += "สิบ";
            else if (pos === 1 && digit === 2) text += "ยี่สิบ";
            else if (pos === 0 && digit === 1 && len > 1) text += "เอ็ด";
            else text += thaiNumbers[digit] + thaiDigits[pos];
          }
        }
        return text;
      }
      let bahtText = readNumber(baht) + "บาท";
      let satangText = (parseInt(satang, 10) === 0) ? "ถ้วน" : readNumber(satang) + "สตางค์";
      return bahtText + satangText;
    }

    function toThaiDigits(numStr) {
      if (!numStr && numStr !== 0) return '';
      const thaiDigits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
      return String(numStr).replace(/[0-9]/g, function(w) { return thaiDigits[parseInt(w, 10)]; });
    }

    function smartConvertToThaiDigits(str) {
      if (!str) return '';
      return String(str).replace(/[0-9]/g, function(w) {
        const thaiDigits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
        return thaiDigits[parseInt(w, 10)];
      });
    }

    function preparePeaReportData() {
      // ดึงเฉพาะรายการที่ติ๊กเลือก (activeItems) ไปสร้างฟอร์ม
      const activeItems = compareItemsList.filter(item => item.isSelected);
      let grandTotal = 0;
      activeItems.forEach(item => grandTotal += (item.totalAmount || 0));

      const selectedDept = document.getElementById('adminDeptFilter').value;
      const docNo = document.getElementById('docNoInput').value.trim();
      const docDate = document.getElementById('docDateText').value.trim();
      const billInfo = document.getElementById('billDocInfo').value.trim() || "-";
      const vatType = document.getElementById('vatTypeSelect').value;

      const rawAccountCode = document.getElementById('inputAccountCode').value.trim() || "53030010";
      const rawCostCenter = document.getElementById('inputCostCenter').value.trim() || "J31310101";
      const accountCode = smartConvertToThaiDigits(rawAccountCode);
      const costCenter = rawCostCenter;

      const signName1 = document.getElementById('inputSignName1').value.trim();
      const signPos1 = document.getElementById('inputSignPos1').value.trim();
      const signName2 = document.getElementById('inputSignName2').value.trim();
      const signPos2 = document.getElementById('inputSignPos2').value.trim();
      const signName3 = document.getElementById('inputSignName3').value.trim();
      const signPos3 = document.getElementById('inputSignPos3').value.trim();

      document.getElementById('signName1').innerText = signName1 ? `( ${signName1} )` : "";
      document.getElementById('signPos1').innerText = signPos1 ? `ตำแหน่ง ${signPos1}` : "";
      document.getElementById('signName2').innerText = signName2 ? `( ${signName2} )` : "";
      document.getElementById('signPos2').innerText = signPos2 ? `ตำแหน่ง ${signPos2}` : "";
      document.getElementById('signName3').innerText = signName3 ? `( ${signName3} )` : "";
      document.getElementById('signPos3').innerText = signPos3 ? `ตำแหน่ง ${signPos3}` : "";

      document.getElementById('peaFormDeptText').innerText = selectedDept !== 'ALL' ? selectedDept : "กฟส.หลังสวน";
      document.getElementById('peaFormDeptText2').innerText = selectedDept !== 'ALL' ? selectedDept : "กฟส.หลังสวนและ กฟส.ในสังกัด";
      document.getElementById('peaFormNo').innerText = docNo ? toThaiDigits(docNo) : "";
      document.getElementById('peaFormDate').innerText = docDate ? toThaiDigits(docDate) : "";
      document.getElementById('peaFormItemCount').innerText = toThaiDigits(activeItems.length);

      const accountCodeSection = document.getElementById('peaAccountCodeSection');
      accountCodeSection.innerHTML = `จากรหัสบัญชี <span id="peaFormAccountCode">${accountCode}</span> โดยใช้งบทำการ<span id="peaFormCostCenter">${costCenter}</span>`;

      const formattedTotal = grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const thaiTotalStr = grandTotal > 0 ? (toThaiDigits(formattedTotal) + '.-') : "";
      const bahtTextStr = grandTotal > 0 ? `(${ArabicToThaiBaht(grandTotal)})` : "";

      document.getElementById('peaFormTotalAmount').innerText = thaiTotalStr;
      document.getElementById('peaFormTotalBahtText').innerText = bahtTextStr;
      document.getElementById('peaFormSumAmount').innerText = thaiTotalStr;
      document.getElementById('peaFormSumBahtText').innerText = bahtTextStr;
      document.getElementById('peaSignAmount').innerText = thaiTotalStr;
      document.getElementById('peaSignBahtText').innerText = bahtTextStr;
      document.getElementById('vatMarkBox').innerText = vatType === 'included' ? '/' : ' ';
      document.getElementById('peaFormBillInfoCell').innerText = billInfo;

      const peaTbody = document.getElementById('peaFormTableBody');
      peaTbody.innerHTML = '';
      activeItems.forEach((item, index) => {
        const tr = document.createElement('tr');
        const itemAmtFormatted = (item.totalAmount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const qtyStr = `${toThaiDigits(item.receivedQty)} ${item.unit || ''}`;
        tr.innerHTML = `
          <td style="border: 1px solid #000; padding: 4px; text-align: center;">${toThaiDigits(index + 1)}</td>
          <td style="border: 1px solid #000; padding: 4px;">${item.name}</td>
          <td style="border: 1px solid #000; padding: 4px; text-align: center;">${qtyStr}</td>
          <td style="border: 1px solid #000; padding: 4px; text-align: right;">${toThaiDigits(itemAmtFormatted)}.-</td>
          <td style="border: 1px solid #000; padding: 4px; text-align: center;">${index === 0 ? billInfo : ''}</td>
        `;
        peaTbody.appendChild(tr);
      });
    }

    function generatePeaReport() {
      if (!compareItemsList || compareItemsList.length === 0) { alert("กรุณาเปิดเมนู 'ตรวจรับ & ใบวางบิล' ก่อนพิมพ์"); return; }
      preparePeaReportData();
      document.body.classList.add('printing-pea');
      document.body.classList.remove('printing-summary', 'printing-over10k-1', 'printing-over10k-2', 'printing-over10k-3', 'printing-over10k-4');
      window.print();
      document.body.classList.remove('printing-pea');
    }

    function downloadWordReport() {
      if (!compareItemsList || compareItemsList.length === 0) { alert("กรุณาเปิดเมนู 'ตรวจรับ & ใบวางบิล' ก่อนดาวน์โหลด"); return; }
      preparePeaReportData();
      const content = document.getElementById('peaFormArea').innerHTML;
      const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>รายงาน</title><style>@page { size: A4; margin: 15mm; } body { font-family: 'TH Sarabun PSK', sans-serif; font-size: 16pt; }</style></head><body>`;
      const sourceHTML = header + content + "</body></html>";
      const blob = new Blob(['\ufeff', sourceHTML], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `รายงานขอซื้อขอจ้าง_ไม่เกิน10000.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    /* --- LOGICS สำหรับ WIZARD MULTI-STEP (> 10,000 บาท) --- */
    function openWizardModal() {
      let total = 0;
      compareItemsList.forEach(item => {
        if (item.isSelected) total += item.totalAmount;
      });
      document.getElementById('wzAmountTotal').value = total > 0 ? total.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "";
      
      document.getElementById('wizardModal').classList.remove('hidden');
      goToStep(1);
    }

    function closeWizardModal() {
      document.getElementById('wizardModal').classList.add('hidden');
    }

    function goToStep(stepNum) {
      currentWizardStep = stepNum;
      document.getElementById('currentStepNum').innerText = stepNum;

      [1, 2, 3, 4].forEach(s => {
        const stepEl = document.getElementById(`wizardStep${s}`);
        const btnEl = document.getElementById(`stepBtn-${s}`);
        if (s === stepNum) {
          stepEl.classList.remove('hidden');
          btnEl.className = "p-2 rounded-lg bg-purple-600 text-white transition flex flex-col items-center gap-1 shadow";
        } else {
          stepEl.classList.add('hidden');
          btnEl.className = "p-2 rounded-lg bg-slate-700 text-slate-300 transition flex flex-col items-center gap-1 hover:bg-slate-600";
        }
      });

      const btnPrev = document.getElementById('btnPrevStep');
      const btnNext = document.getElementById('btnNextStep');
      
      btnPrev.disabled = (stepNum === 1);
      btnPrev.classList.toggle('opacity-50', stepNum === 1);

      if (stepNum === 4) {
        btnNext.innerHTML = `สิ้นสุดขั้นตอน <i class="fa-solid fa-check ml-1"></i>`;
      } else {
        btnNext.innerHTML = `ถัดไป <i class="fa-solid fa-arrow-right ml-1"></i>`;
      }
    }

    function changeStep(dir) {
      const target = currentWizardStep + dir;
      if (target >= 1 && target <= 4) {
        goToStep(target);
      }
    }

    function prepareOver10kWizardData() {
      const activeItems = compareItemsList.filter(item => item.isSelected);
      
      const wzDate1 = document.getElementById('wzDate1').value.trim() || "๒๑ กันยายน ๒๕๖๙";
      const operator = document.getElementById('wzOperatorName').value.trim() || "นางสาวพรศิริ เมฆสวี";
      const cName1 = document.getElementById('wzCommName1').value.trim();
      const cPos1 = document.getElementById('wzCommPos1').value.trim();
      const cName2 = document.getElementById('wzCommName2').value.trim();
      const cPos2 = document.getElementById('wzCommPos2').value.trim();
      const cName3 = document.getElementById('wzCommName3').value.trim();
      const cPos3 = document.getElementById('wzCommPos3').value.trim();

      const rawInviteNo = document.getElementById('wzInviteNo').value.trim() || "๔๔๕๖๘";
      const inviteDate = document.getElementById('wzInviteDate').value.trim() || "๒๒ กันยายน ๒๕๖๙";
      const shopName = document.getElementById('wzShopName').value.trim() || "ร้านพัฒน์";

      const inviteSignName = document.getElementById('wzInviteSignName').value.trim() || "นายกิตติพงษ์ โสภาพงษ์";
      const inviteSignPos = document.getElementById('wzInviteSignPos').value.trim() || "ผู้จัดการ การไฟฟ้าส่วนภูมิภาคสาขาหลังสวน";

      const considerDate = document.getElementById('wzConsiderDate').value.trim() || "๒๕ กันยายน ๒๕๖๙";
      const quotNo = document.getElementById('wzQuotNo').value.trim() || "๘๙٠๓/๒๕๖๙";
      const vendorNo = document.getElementById('wzVendorNo').value.trim() || "๒๐๘๘๓๓";

      const deliDate = document.getElementById('wzDeliveryDate').value.trim() || "๓ ตุลาคม ๒๕๖๙";
      const deliNo = document.getElementById('wzDeliveryNo').value.trim() || "๙๐๒ผ/๒๕๖๙";

      const customAmountStr = document.getElementById('wzAmountTotal').value.trim().replace(/,/g, '');
      let parsedAmount = parseFloat(customAmountStr);
      if (isNaN(parsedAmount)) parsedAmount = 0;

      const formattedTotal = parsedAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const thaiTotalStr = parsedAmount > 0 ? (toThaiDigits(formattedTotal) + '.-') : "๐.๐๐";
      const bahtTextStr = ArabicToThaiBaht(parsedAmount);

      // --- เติมฟอร์ม 1 ---
      document.querySelectorAll('.f1-date').forEach(el => el.innerText = wzDate1);
      const f1Work = document.querySelector('.f1-total-work');
      if(f1Work) f1Work.innerText = toThaiDigits(1);
      
      const f1Count = document.querySelector('.f1-total-count');
      if(f1Count) f1Count.innerText = toThaiDigits(activeItems.length);

      const f1Grand = document.querySelector('.f1-grand-total-text');
      if(f1Grand) f1Grand.innerText = toThaiDigits(formattedTotal);

      const f1Baht = document.querySelector('.f1-baht-text');
      if(f1Baht) f1Baht.innerText = bahtTextStr;

      const f1Op = document.querySelector('.f1-operator-text');
      if(f1Op) f1Op.innerText = operator + " หผ.สน.กฟส.ลส.";

      const f1Sign = document.querySelector('.f1-sign1-name');
      if(f1Sign) f1Sign.innerText = `(${operator})`;

      const cList1 = document.querySelector('.f1-comm-list1');
      if(cList1) cList1.innerText = `๑) ${cName1} ${cPos1} ประธานกรรมการ`;

      document.querySelectorAll('.f1-table-body').forEach(tbody => {
        tbody.innerHTML = '';
        activeItems.forEach((item, idx) => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">${toThaiDigits(idx + 1)}</td>
            <td style="border: 1px solid #000; padding: 4px;">${item.name}</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">${toThaiDigits(item.orderedQty)}</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">${item.unit || ''}</td>
          `;
          tbody.appendChild(tr);
        });
      });

      // --- เติมฟอร์ม 2 ---
      document.querySelectorAll('.f2-docno').forEach(el => el.innerText = smartConvertToThaiDigits(rawInviteNo));
      document.querySelectorAll('.f2-date').forEach(el => el.innerText = inviteDate);
      document.querySelectorAll('.f2-shop-name').forEach(el => el.innerText = `ผู้จัดการ ${shopName}`);
      
      document.querySelectorAll('.f2-sign-name').forEach(el => el.innerText = `(${inviteSignName})`);
      document.querySelectorAll('.f2-sign-pos').forEach(el => el.innerText = inviteSignPos);

      document.querySelectorAll('.f2-table-body').forEach(tbody => {
        tbody.innerHTML = '';
        activeItems.forEach((item, idx) => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">${toThaiDigits(idx + 1)}</td>
            <td style="border: 1px solid #000; padding: 4px;">${item.name}</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">${toThaiDigits(item.orderedQty)}</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">${item.unit || ''}</td>
          `;
          tbody.appendChild(tr);
        });
      });

      // --- เติมฟอร์ม 3 ---
      document.querySelectorAll('.f3-date').forEach(el => el.innerText = considerDate);
      const f3RepDate = document.querySelector('.f3-report-date');
      if(f3RepDate) f3RepDate.innerText = wzDate1;

      const f3InvNo = document.querySelector('.f3-invite-no');
      if(f3InvNo) f3InvNo.innerText = smartConvertToThaiDigits(rawInviteNo);

      const f3InvDate = document.querySelector('.f3-invite-date');
      if(f3InvDate) f3InvDate.innerText = inviteDate;

      document.querySelectorAll('.f3-shop-name').forEach(el => el.innerText = shopName);
      
      const f3QNo = document.querySelector('.f3-quotation-no');
      if(f3QNo) f3QNo.innerText = smartConvertToThaiDigits(quotNo);

      const f3QDate = document.querySelector('.f3-quotation-date');
      if(f3QDate) f3QDate.innerText = considerDate;

      const f3Tot = document.querySelector('.f3-total-amount');
      if(f3Tot) f3Tot.innerText = thaiTotalStr;

      const f3B = document.querySelector('.f3-baht-text');
      if(f3B) f3B.innerText = bahtTextStr;

      const f3V = document.querySelector('.f3-vendor-no');
      if(f3V) f3V.innerText = smartConvertToThaiDigits(vendorNo);

      const f3Op = document.querySelector('.f3-operator-name');
      if(f3Op) f3Op.innerText = `(${operator})`;

      // --- เติมฟอร์ม 4 ---
      document.querySelectorAll('.f4-date').forEach(el => el.innerText = deliDate);
      
      const f4AppDate = document.querySelector('.f4-approval-date');
      if(f4AppDate) f4AppDate.innerText = considerDate;

      const f4DelNo = document.querySelector('.f4-delivery-no');
      if(f4DelNo) f4DelNo.innerText = smartConvertToThaiDigits(deliNo);

      const f4DelDate = document.querySelector('.f4-delivery-date');
      if(f4DelDate) f4DelDate.innerText = deliDate;

      document.querySelectorAll('.f4-shop-name').forEach(el => el.innerText = shopName);
      
      document.querySelectorAll('.f4-total-amount').forEach(el => el.innerText = thaiTotalStr);
      document.querySelectorAll('.f4-baht-text').forEach(el => el.innerText = bahtTextStr);

      const f4C1 = document.querySelector('.f4-comm1');
      if(f4C1) f4C1.innerText = `(${cName1}) ${cPos1}`;

      const f4C2 = document.querySelector('.f4-comm2');
      if(f4C2) f4C2.innerText = `(${cName2}) ${cPos2}`;

      const f4C3 = document.querySelector('.f4-comm3');
      if(f4C3) f4C3.innerText = `(${cName3}) ${cPos3}`;
    }

    function previewCurrentStepForm() {
      try {
        prepareOver10kWizardData();
        
        const formDiv = document.getElementById(`over10kFormArea${currentWizardStep}`);
        const previewContent = document.getElementById('previewContainerContent');
        const previewModal = document.getElementById('previewModal');

        if (formDiv && previewContent && previewModal) {
          previewContent.innerHTML = formDiv.innerHTML;
          previewModal.classList.remove('hidden');
        } else {
          alert("ไม่พบส่วนแสดงผลตัวอย่างฟอร์มในระบบ");
        }
      } catch (err) {
        console.error(err);
        alert("เกิดข้อผิดพลาดในการแสดงตัวอย่างฟอร์ม: " + err.message);
      }
    }

    function closePreviewModal() {
      document.getElementById('previewModal').classList.add('hidden');
    }

    function printFromPreview() {
      const previewContent = document.getElementById('previewContainerContent').innerHTML;
      
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>พิมพ์เอกสารราชการ</title>
            <style>
              @font-face {
                font-family: 'TH Sarabun PSK';
                src: local('TH Sarabun PSK'), local('THSarabunPSK');
                font-weight: normal;
                font-style: normal;
              }
              body {
                font-family: 'TH Sarabun PSK', sans-serif;
                font-size: 16pt;
                color: #000;
                line-height: 1.2;
                margin: 0;
                padding: 10mm 15mm;
                background: #fff;
              }
              @page { size: A4; margin: 15mm; }
              img { max-width: 100%; height: auto; }
            </style>
          </head>
          <body>
            ${previewContent}
            <script>
              window.onload = function() {
                window.print();
                window.close();
              };
            <\/script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  
  (window as any).showLoading = showLoading;
  (window as any).hideLoading = hideLoading;
  (window as any).setAutoCurrentMonth = setAutoCurrentMonth;
  (window as any).renderItems = renderItems;
  (window as any).filterItems = filterItems;
  (window as any).updateQty = updateQty;
  (window as any).submitOrder = submitOrder;
  (window as any).closeConfirmOrderModal = closeConfirmOrderModal;
  (window as any).renderConfirmOrderModal = renderConfirmOrderModal;
  (window as any).removeItemFromConfirmModal = removeItemFromConfirmModal;
  (window as any).confirmAndSendOrder = confirmAndSendOrder;
  (window as any).toggleSystemStatus = toggleSystemStatus;
  (window as any).switchAdminTab = switchAdminTab;
  (window as any).fetchAdminOrders = fetchAdminOrders;
  (window as any).openAdminCheckModal = openAdminCheckModal;
  (window as any).toggleAdminModal = toggleAdminModal;
  (window as any).promptComparePassword = promptComparePassword;
  (window as any).closePasswordModal = closePasswordModal;
  (window as any).verifyComparePassword = verifyComparePassword;
  (window as any).populateMonthFilterOptions = populateMonthFilterOptions;
  (window as any).filterAdminOrders = filterAdminOrders;
  (window as any).renderAdminTable = renderAdminTable;
  (window as any).toggleSelectAllRows = toggleSelectAllRows;
  (window as any).updateDeleteButtonUI = updateDeleteButtonUI;
  (window as any).deleteSelectedOrders = deleteSelectedOrders;
  (window as any).deleteOrder = deleteOrder;
  (window as any).addNewItemToSheet = addNewItemToSheet;
  (window as any).getNextAutoItemId = getNextAutoItemId;
  (window as any).autoFillNextItemId = autoFillNextItemId;
  (window as any).printSummaryReport = printSummaryReport;
  (window as any).openCompareModal = openCompareModal;
  (window as any).closeCompareModal = closeCompareModal;
  (window as any).buildCompareList = buildCompareList;
  (window as any).renderCompareTable = renderCompareTable;
  (window as any).handleItemSelect = handleItemSelect;
  (window as any).toggleSelectAllCompare = toggleSelectAllCompare;
  (window as any).handleMatchChange = handleMatchChange;
  (window as any).handleReceivedQtyInput = handleReceivedQtyInput;
  (window as any).handleUnitPriceInput = handleUnitPriceInput;
  (window as any).updateItemTotal = updateItemTotal;
  (window as any).calculateCompareTotals = calculateCompareTotals;
  (window as any).ArabicToThaiBaht = ArabicToThaiBaht;
  (window as any).toThaiDigits = toThaiDigits;
  (window as any).smartConvertToThaiDigits = smartConvertToThaiDigits;
  (window as any).preparePeaReportData = preparePeaReportData;
  (window as any).generatePeaReport = generatePeaReport;
  (window as any).downloadWordReport = downloadWordReport;
  (window as any).openWizardModal = openWizardModal;
  (window as any).closeWizardModal = closeWizardModal;
  (window as any).goToStep = goToStep;
  (window as any).changeStep = changeStep;
  (window as any).prepareOver10kWizardData = prepareOver10kWizardData;
  (window as any).previewCurrentStepForm = previewCurrentStepForm;
  (window as any).closePreviewModal = closePreviewModal;
  (window as any).printFromPreview = printFromPreview;
  setAutoCurrentMonth();
  fetchMasterItems();
  }
}
