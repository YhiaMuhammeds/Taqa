import { db } from './firebase-config.js';
import {
  collection, addDoc, deleteDoc, doc, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// DOM Elements
const custodyForm = document.getElementById('custodyForm');
const expenseForm = document.getElementById('expenseForm');
const expensesTable = document.getElementById('expensesTable');
const totalCustodiesSpan = document.getElementById('totalCustodies');
const totalSpan = document.getElementById('totalExpenses');
const remainingSpan = document.getElementById('remaining');
const filterFrom = document.getElementById('filterFrom');
const filterTo = document.getElementById('filterTo');
const applyFilter = document.getElementById('applyFilter');

// Firestore Collections
const custodyCol = collection(db, 'custodies');
const expensesCol = collection(db, 'expenses');

// Cached Data
let custodyList = [];
let expenseList = [];

// Functions
function calculateAndRender() {
  // الحسابات العامة
  const totalCustody = custodyList.reduce((acc, c) => acc + (c.total_amount || 0), 0);
  const from = filterFrom.value;
  const to = filterTo.value;

  // تصفية المصروفات
  const filteredExpenses = expenseList.filter(e =>
    (!from || e.date >= from) && (!to || e.date <= to)
  );

  const totalExpenses = filteredExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);

  // تحديث DOM
  totalCustodiesSpan.textContent = totalCustody;
  totalSpan.textContent = totalExpenses;
  remainingSpan.textContent = totalCustody - totalExpenses;

  expensesTable.innerHTML = '';
  filteredExpenses.forEach(e => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${e.date}</td>
      <td>${e.item}</td>
      <td>${e.amount}</td>
      <td>${e.note || ''}</td>
      <td><span class="delete-btn" data-id="${e.id}">🗑️</span></td>
    `;
    expensesTable.appendChild(row);

    row.querySelector('.delete-btn').onclick = async () => {
      await deleteDoc(doc(db, 'expenses', e.id));
    };
  });
}

// Submissions
custodyForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('custodyName').value;
  const amount = +document.getElementById('custodyAmount').value;
  const date = document.getElementById('custodyDate').value || new Date().toISOString().split('T')[0];
  await addDoc(custodyCol, { name, total_amount: amount, date });
  custodyForm.reset();
});

expenseForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const item = document.getElementById('item').value;
  const amount = +document.getElementById('expenseAmount').value;
  const date = document.getElementById('expenseDate').value || new Date().toISOString().split('T')[0];
  const note = document.getElementById('note').value;
  await addDoc(expensesCol, { item, amount, date, note });
  expenseForm.reset();
});

// فلترة
applyFilter.addEventListener('click', calculateAndRender);

// تصدير
window.exportToExcel = function () {
  const table = document.querySelector("table");
  const wb = XLSX.utils.table_to_book(table, { sheet: "التقرير" });
  XLSX.writeFile(wb, "custody_report.xlsx");
};

// المزامنة الحيّة مع الكاش
onSnapshot(custodyCol, snapshot => {
  custodyList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  calculateAndRender();
});

onSnapshot(expensesCol, snapshot => {
  expenseList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  calculateAndRender();
});
