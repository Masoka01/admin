/*********************************
 * FIREBASE
 *********************************/
const firebaseConfig = {
  apiKey: "AIzaSyCIxjtnIJEM-p_0_uCwHjTzYx9Eaoz0yhE",
  authDomain: "absensi-project-0.firebaseapp.com",
  projectId: "absensi-project-0",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

/*********************************
 * HELPER
 *********************************/
function getMonthKey(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${d.getMonth()}`;
}

function getMonthLabel(key) {
  const [y, m] = key.split("-");
  return new Date(y, m).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
}

function formatTanggal(dateStr) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    weekday: "short",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/*********************************
 * LOAD DATA
 *********************************/
async function loadData() {
  const snap = await db.collection("attendance").get();
  const grouped = {};

  snap.forEach((doc) => {
    const d = doc.data();
    const month = getMonthKey(d.tanggal);

    if (!grouped[month]) grouped[month] = {};
    if (!grouped[month][d.nama]) grouped[month][d.nama] = [];

    grouped[month][d.nama].push(d);
  });

  render(grouped);
}

/*********************************
 * RENDER
 *********************************/
function render(data) {
  const container = document.getElementById("months");
  container.innerHTML = "";

  Object.keys(data)
    .sort()
    .forEach((monthKey) => {
      const month = document.createElement("div");
      month.className = "month-card";

      const names = Object.keys(data[monthKey]);

      const left = names
        .map(
          (n, i) => `
      <div class="employee ${i === 0 ? "active" : ""}" data-name="${n}">
        ${n}
      </div>
    `
        )
        .join("");

      const right = names
        .map(
          (n, i) => `
      <div class="detail ${i === 0 ? "active" : ""}" data-detail="${n}">
        <h3>${n}</h3>
        ${data[monthKey][n]
          .map(
            (r) => `
          <div class="row">
            <span>${formatTanggal(r.tanggal)}</span>
            <span>${r.checkin || "-"} - ${r.checkout || "-"}</span>
          </div>
        `
          )
          .join("")}
      </div>
    `
        )
        .join("");

      month.innerHTML = `
      <div class="month-header" onclick="toggleMonth(this)">
        <span>📁 ${getMonthLabel(monthKey)}</span>
        <button onclick="deleteMonth(event,'${monthKey}')">Hapus Bulan</button>
      </div>

      <div class="split-view">
        <aside class="employee-panel">${left}</aside>
        <section class="detail-panel">${right}</section>
      </div>
    `;

      container.appendChild(month);
    });

  bindEmployeeClick();
}

/*********************************
 * INTERACTION
 *********************************/
function toggleMonth(el) {
  const split = el.nextElementSibling;
  split.style.display = split.style.display === "grid" ? "none" : "grid";
}

function bindEmployeeClick() {
  document.querySelectorAll(".employee").forEach((emp) => {
    emp.onclick = () => {
      const panel = emp.closest(".split-view");

      panel
        .querySelectorAll(".employee")
        .forEach((e) => e.classList.remove("active"));

      panel
        .querySelectorAll(".detail")
        .forEach((d) => d.classList.remove("active"));

      emp.classList.add("active");
      panel
        .querySelector(`.detail[data-detail="${emp.dataset.name}"]`)
        .classList.add("active");
    };
  });
}

/*********************************
 * DELETE MONTH
 *********************************/
async function deleteMonth(e, monthKey) {
  e.stopPropagation();
  if (!confirm("Hapus semua data bulan ini?")) return;

  const snap = await db.collection("attendance").get();
  const batch = db.batch();

  snap.forEach((doc) => {
    if (getMonthKey(doc.data().tanggal) === monthKey) {
      batch.delete(doc.ref);
    }
  });

  await batch.commit();
  loadData();
}

/*********************************
 * INIT
 *********************************/
loadData();
