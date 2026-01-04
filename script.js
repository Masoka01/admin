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
 * LOAD & GROUP DATA
 *********************************/
async function loadData() {
  const snap = await db.collection("attendance").get();
  const data = {};

  snap.forEach((doc) => {
    const d = doc.data();
    const month = getMonthKey(d.tanggal);

    if (!data[month]) data[month] = {};
    if (!data[month][d.nama]) data[month][d.nama] = [];

    data[month][d.nama].push(d);
  });

  render(data);
}

/*********************************
 * RENDER UI
 *********************************/
function render(data) {
  const container = document.getElementById("months");
  container.innerHTML = "";

  Object.keys(data)
    .sort()
    .forEach((monthKey) => {
      const monthDiv = document.createElement("div");
      monthDiv.className = "month";

      const namesHtml = Object.keys(data[monthKey])
        .map(
          (nama) => `
      <div class="name" onclick="toggleDetails(this)">
        ${nama}
        <div class="details">
          ${data[monthKey][nama]
            .map(
              (r) => `
            <div class="detail-row">
              <span>${formatTanggal(r.tanggal)}</span>
              <span>${r.checkin || "-"} - ${r.checkout || "-"}</span>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `
        )
        .join("");

      monthDiv.innerHTML = `
      <div class="month-header" onclick="toggleNames(this)">
        <span>📁 ${getMonthLabel(monthKey)}</span>
        <button onclick="deleteMonth(event, '${monthKey}')">Hapus Bulan</button>
      </div>
      <div class="names">${namesHtml}</div>
    `;

      container.appendChild(monthDiv);
    });
}

/*********************************
 * TOGGLE UI
 *********************************/
function toggleNames(el) {
  el.nextElementSibling.style.display =
    el.nextElementSibling.style.display === "block" ? "none" : "block";
}

function toggleDetails(el) {
  const details = el.querySelector(".details");
  details.style.display = details.style.display === "block" ? "none" : "block";
}

/*********************************
 * DELETE BULAN
 *********************************/
async function deleteMonth(e, monthKey) {
  e.stopPropagation();
  if (!confirm("Hapus semua data bulan ini?")) return;

  const snap = await db.collection("attendance").get();
  const batch = db.batch();

  snap.forEach((doc) => {
    const d = doc.data();
    if (getMonthKey(d.tanggal) === monthKey) {
      batch.delete(doc.ref);
    }
  });

  await batch.commit();
  alert("Data bulan berhasil dihapus");
  loadData();
}

/*********************************
 * INIT
 *********************************/
loadData();
