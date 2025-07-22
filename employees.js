// ✅ نسخة كاملة ومعدلة من كود employees.js تشمل:
// - إصلاح مشكلة تجديد الأسبوعين
// - تحسين شكل القائمة
// - عرض عدد الأيام كبادج منفصل
// - دعم رقم ثابت (customId)

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, getDoc, doc, deleteDoc, updateDoc,
  onSnapshot, query
} from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDg68uHCtPDoYChV3g7wgpjuIL4345vVSw",
  authDomain: "inventorysystemtaqa.firebaseapp.com",
  projectId: "inventorysystemtaqa",
  storageBucket: "inventorysystemtaqa.appspot.com",
  messagingSenderId: "165728779551",
  appId: "1:165728779551:web:37c891c52ecd8ee9efc42a",
  measurementId: "G-M0PM1B4SD9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const employeesCol = collection(db, "employees");

const popup = document.getElementById("popupForm");
const openPopup = document.getElementById("openPopup");
const closePopup = document.getElementById("closePopup");
const form = document.getElementById("employeeForm");
const activeTable = document.getElementById("activeEmployees");
const inactiveTable = document.getElementById("inactiveEmployees");
const showAllBtn = document.getElementById("showAll");
const showWarningsBtn = document.getElementById("showWarnings");
const filterMohandesBtn = document.getElementById("filterMohandes");
const filterMagdBtn = document.getElementById("filterMagd");
const renewButtons = document.querySelectorAll(".renew-btn");
const renewPopup = document.getElementById("renewPopup");
const closeRenew = document.getElementById("closeRenew");
const renewForm = document.getElementById("renewForm");
const renewList = document.getElementById("renewList");
let editId = null;
// دالة لإعادة رسم قائمة العمال داخل popup التجديد
function renderRenewList(employees) {
  const list = document.getElementById("renewList");
  list.innerHTML = "";

  employees.forEach((emp) => {
    const item = document.createElement("div");
    item.className = "renew-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = emp.id;
    checkbox.id = `renew-${emp.id}`;

    const label = document.createElement("label");
    label.htmlFor = `renew-${emp.id}`;
    label.textContent = emp.name;

    item.appendChild(checkbox);
    item.appendChild(label);

    list.appendChild(item);
  });
}

openPopup.addEventListener("click", () => popup.style.display = "flex");
closePopup.addEventListener("click", () => {
  popup.style.display = "none";
  form.reset();
  editId = null;
  form.querySelector("button[type='submit']").textContent = "تسجيل العامل";
});
closeRenew.addEventListener("click", () => {
  renewPopup.style.display = "none";
  renewList.innerHTML = "";
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = form.name.value;
  const job = form.job.value;
  const boss = form.boss.value;
  const company = form.company.value;
  const startDate = form.startDate.value;
  const endDate = form.endDate.value;
  const cancelDate = form.cancelDate.value;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const dayDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

  const data = { name, job, boss, company, startDate, endDate, days: dayDiff, cancelDate: cancelDate || "" };
  const existingDocs = await getDocs(employeesCol);
  const isDuplicate = existingDocs.docs.some(docSnap => {
    const d = docSnap.data();
    return d.name === name && !d.cancelDate;
  });

  if (isDuplicate && !editId) {
    alert("هذا العامل موجود بالفعل ولم يتم إلغاء تصريحه.");
    return;
  }

  if (editId) {
    await updateDoc(doc(db, "employees", editId), data);
    editId = null;
    form.querySelector("button[type='submit']").textContent = "تسجيل العامل";
  } else {
    let maxCustomId = 10000;
    existingDocs.docs.forEach(docSnap => {
      const d = docSnap.data();
      if (d.customId && d.customId > maxCustomId) {
        maxCustomId = d.customId;
      }
    });
    const newCustomId = maxCustomId + 1;
    data.customId = newCustomId;
    await addDoc(employeesCol, data);
  }

  form.reset();
  popup.style.display = "none";
});

function renderTables(snapshot) {
  activeTable.innerHTML = "";
  inactiveTable.innerHTML = "";
  const today = new Date();
  const warningDays = 3 * 24 * 60 * 60 * 1000;

  const activeRows = [];
  const inactiveRows = [];

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const id = docSnap.id;
    const row = document.createElement("tr");
    const companyBadge = data.company === "المهندس"
      ? `<span class='badge-mohandes'>🔧 المهندس</span>`
      : `<span class='badge-magad'>🏗️ المجد</span>`;

    const endDateObj = new Date(data.endDate);
    const remainingTime = endDateObj - today;
    const daysBadge = `<span class="days-badge">${getRemainingDays(data.endDate)} يوم</span>`;

    if (data.cancelDate || endDateObj < today) {
      row.classList.add("expired");
      inactiveRows.push({ row, date: endDateObj });
    } else {
      if (remainingTime <= warningDays) row.classList.add("warning");
      activeRows.push({ row, date: endDateObj });
    }

    row.innerHTML = `
      <td>${data.name}</td>
      <td>${data.job}</td>
      <td><span class="boss-filter" data-boss="${data.boss}">${data.boss}</span></td>
      <td>${companyBadge}</td>
      <td>${data.startDate}</td>
      <td>${data.endDate}</td>
      <td>${daysBadge}</td>
      <td><button onclick="editEmployee('${id}')">✏️</button></td>
      <td><button onclick="deleteEmployee('${id}')">🗑️</button></td>
    `;
  });

  activeRows.sort((a, b) => a.date - b.date).forEach(obj => activeTable.appendChild(obj.row));
  inactiveRows.sort((a, b) => a.date - b.date).forEach(obj => inactiveTable.appendChild(obj.row));
}

renewButtons.forEach(btn => {
  btn.addEventListener("click", async () => {
    const daysToAdd = parseInt(btn.dataset.days);
    if (![5, 14].includes(daysToAdd)) return;

    const snapshot = await getDocs(employeesCol);
    renewList.innerHTML = "";

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (!data.cancelDate) {
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.name = "employee";
        checkbox.value = docSnap.id;

        const label = document.createElement("label");
        label.textContent = `${data.customId || ""} - ${data.name}`;

        const div = document.createElement("div");
        div.classList.add("renew-item");
        div.appendChild(checkbox);
        div.appendChild(label);
        renewList.appendChild(div);
      }
    });

    renewPopup.dataset.days = daysToAdd;
    renewPopup.style.display = "flex";
  });
});

renewForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const selected = Array.from(renewList.querySelectorAll("input[name='employee']:checked"));
  const daysToAdd = parseInt(renewPopup.dataset.days);

  for (const input of selected) {
    const empSnap = await getDoc(doc(db, "employees", input.value));
    if (empSnap.exists()) {
      const employee = empSnap.data();
      const lastEnd = new Date(employee.endDate);
      const newStart = new Date(lastEnd.getTime() + 86400000);
      const newEnd = new Date(newStart.getTime() + (daysToAdd - 1) * 86400000);

      await updateDoc(doc(db, "employees", input.value), {
        startDate: newStart.toISOString().split("T")[0],
        endDate: newEnd.toISOString().split("T")[0],
        days: daysToAdd
      });
    }
  }

  renewPopup.style.display = "none";
  renewList.innerHTML = "";
});

function getRemainingDays(endDateStr) {
  const today = new Date();
  const end = new Date(endDateStr);
  const diff = Math.ceil((end - today) / 86400000);
  return diff < 0 ? 0 : diff;
}

window.deleteEmployee = async (id) => await deleteDoc(doc(db, "employees", id));

window.editEmployee = async (id) => {
  const docSnap = await getDoc(doc(db, "employees", id));
  if (docSnap.exists()) {
    const foundDoc = docSnap.data();
    form.name.value = foundDoc.name;
    form.job.value = foundDoc.job;
    form.boss.value = foundDoc.boss;
    form.company.value = foundDoc.company;
    form.startDate.value = foundDoc.startDate;
    form.endDate.value = foundDoc.endDate;
    form.cancelDate.value = foundDoc.cancelDate || "";

    editId = id;
    form.querySelector("button[type='submit']").textContent = "تحديث البيانات";
    popup.style.display = "flex";
  }
};
function toggleActiveBtn(activeBtn) {
  [showAllBtn, showWarningsBtn, filterMohandesBtn, filterMagdBtn].forEach(btn => {
    if (btn) btn.classList.remove("active");
  });

  if (activeBtn) {
    activeBtn.classList.add("active");
  }
}

function filterByCompany(company) {
  Array.from(activeTable.querySelectorAll("tr")).forEach(row => {
    const isMatch = row.innerText.includes(company);
    row.style.display = isMatch ? "" : "none";
  });
}

// الأحداث المرتبطة بالأزرار
showAllBtn.addEventListener("click", () => {
  toggleActiveBtn(showAllBtn);
  Array.from(activeTable.querySelectorAll("tr")).forEach(row => row.style.display = "");
});

showWarningsBtn.addEventListener("click", () => {
  toggleActiveBtn(showWarningsBtn);
  Array.from(activeTable.querySelectorAll("tr")).forEach(row => {
    row.style.display = row.classList.contains("warning") ? "" : "none";
  });
});

filterMohandesBtn.addEventListener("click", () => {
  toggleActiveBtn(filterMohandesBtn);
  filterByCompany("المهندس");
});

filterMagdBtn.addEventListener("click", () => {
  toggleActiveBtn(filterMagdBtn);
  filterByCompany("المجد");
});
function updateSummary(snapshot) {
  const jobSummary = document.getElementById("jobSummary");
  const bossSummary = document.getElementById("bossSummary");
  const companySummary = document.getElementById("companySummary");

  const jobCount = {};
  const bossCount = {};
  const companyCount = {
    "المهندس": 0,
    "المجد": 0
  };

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    if (!data.cancelDate) {
      jobCount[data.job] = (jobCount[data.job] || 0) + 1;
      bossCount[data.boss] = (bossCount[data.boss] || 0) + 1;
      if (companyCount.hasOwnProperty(data.company)) {
        companyCount[data.company]++;
      }
    }
  });

  jobSummary.innerHTML = "";
  for (let job in jobCount) {
    jobSummary.innerHTML += `<div class="summary-card"><strong>${job}</strong>: عدد العمال ${jobCount[job]}</div>`;
  }

  bossSummary.innerHTML = "";
  for (let boss in bossCount) {
    bossSummary.innerHTML += `<div class="summary-card"><strong>${boss}</strong>: عدد العمال ${bossCount[boss]}</div>`;
  }

  companySummary.innerHTML = "";
  for (let company in companyCount) {
    companySummary.innerHTML += `<div class="summary-card"><strong>${company}</strong>: عدد العمال ${companyCount[company]}</div>`;
  }
}

onSnapshot(query(employeesCol), (snapshot) => {
  renderTables(snapshot);
    updateSummary(snapshot);
});
function exportToExcel(companyName) {
  const rows = Array.from(activeTable.querySelectorAll("tr")).filter(row =>
    row.innerText.includes(companyName)
  );

  // العناوين بالترتيب المطلوب
  const data = [["الاسم", "المهنة", "الريس", "الشركة", "بداية التصريح", "نهاية التصريح", "عدد الأيام"]];

  rows.forEach(row => {
    const cells = row.querySelectorAll("td");

    if (cells.length >= 7) {
      const onlyName = cells[0].textContent.trim();


      const job = cells[1].textContent.trim();
      const boss = cells[2].querySelector(".boss-filter")?.textContent.trim() || cells[2].textContent.trim();
      const company = cells[3].textContent.replace(/🔧|🏗️/g, "").trim();
      const startDate = cells[4].textContent.trim();
      const endDate = cells[5].textContent.trim();
      const days = cells[6].textContent.replace("يوم", "").trim();

      data.push([onlyName, job, boss, company, startDate, endDate, days]);
    }
  });

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  worksheet["!displayRightToLeft"] = true; // من اليمين لليسار
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, companyName);
  XLSX.writeFile(workbook, `${companyName}_employees.xlsx`);
}



// ربط الزرارين
document.getElementById("exportMohandes").addEventListener("click", () => {
  exportToExcel("المهندس");
});
document.getElementById("exportMagd").addEventListener("click", () => {
  exportToExcel("المجد");
});
