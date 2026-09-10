const STATES = [
  "Karnataka",
  "Maharashtra",
  "Delhi",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "West Bengal",
  "Gujarat",
];

function populateStateDropdown(select) {
  select.innerHTML = STATES.map((s) => `<option value="${s}">${s}</option>`).join("");
}

function showToast(message, type) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = "toast" + (type === "error" ? " error" : "");
  setTimeout(() => toast.classList.add("hidden"), 2500);
}

const sameAsPermanentCheckbox = document.getElementById("same-as-permanent");
const permanentFieldset = document.getElementById("permanent-fieldset");

sameAsPermanentCheckbox.addEventListener("change", () => {
  const checked = sameAsPermanentCheckbox.checked;
  const permanentInputs = permanentFieldset.querySelectorAll("input, select");
  permanentInputs.forEach((el) => (el.disabled = checked));

  if (checked) {
    document.getElementById("permanent-line1").value = document.getElementById("current-line1").value;
    document.getElementById("permanent-city").value = document.getElementById("current-city").value;
    document.getElementById("permanent-state").value = document.getElementById("current-state").value;
    document.getElementById("permanent-pincode").value = document.getElementById("current-pincode").value;
  }
});

function escapeHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderSubmissions(list) {
  const tbody = document.getElementById("submissions-tbody");
  tbody.innerHTML = list
    .map((s) => {
      const cur = s.current || {};
      const perm = s.permanent || {};
      return `
        <tr>
          <td>${s.candidateId}</td>
          <td>${cur.line1 ?? ""}, ${escapeHtml(cur.city ?? "")}, ${escapeHtml(cur.state ?? "")} - ${escapeHtml(cur.pincode ?? "")}</td>
          <td>${perm.line1 ?? ""}, ${escapeHtml(perm.city ?? "")}, ${escapeHtml(perm.state ?? "")} - ${escapeHtml(perm.pincode ?? "")}</td>
          <td>${s.sameAsPermanent ? "Yes" : "No"}</td>
          <td>${s.matchPercent}</td>
          <td>${s.createdAt}</td>
        </tr>`;
    })
    .join("");
}

async function loadSubmissions() {
  const res = await fetch("/api/address");
  const data = await res.json();
  renderSubmissions(data);
}

document.getElementById("address-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const candidateId = parseInt(document.getElementById("candidateId").value, 10);
  const sameAsPermanent = sameAsPermanentCheckbox.checked;

  const current = {
    line1: document.getElementById("current-line1").value,
    city: document.getElementById("current-city").value,
    state: document.getElementById("current-state").value,
    pincode: document.getElementById("current-pincode").value,
  };
  const permanent = {
    line1: document.getElementById("permanent-line1").value,
    city: document.getElementById("permanent-city").value,
    state: document.getElementById("permanent-state").value,
    pincode: document.getElementById("permanent-pincode").value,
  };

  const res = await fetch("/api/address", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ candidateId, current, permanent, sameAsPermanent }),
  });

  showToast("Address submitted successfully", "success");

  loadSubmissions();
});

// --- Interviewer/candidate tooling: reset seed data (not part of the app-under-test) ---
document.getElementById("reset-data-btn").addEventListener("click", async () => {
  await fetch("/api/reset", { method: "POST" });
  loadSubmissions();
  showToast("Data reset", "success");
});

populateStateDropdown(document.getElementById('current-state'));
populateStateDropdown(document.getElementById('permanent-state'));
loadSubmissions();
