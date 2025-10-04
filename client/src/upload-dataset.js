const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const previewSection = document.getElementById("previewSection");
const previewTable = document.getElementById("previewTable");
const downloadBtn = document.getElementById("downloadBtn");
const uploadModal = document.getElementById("uploadModal");

let fullCsvContent = "";

// Modal
function showModal() { uploadModal.style.display = "flex"; }
function hideModal() { uploadModal.style.display = "none"; }

// Drop zone update
function updateDropZone(file) {
  dropZone.innerHTML = `
    <i class="bi bi-file-earmark-spreadsheet" style="font-size:2rem;"></i>
    <p>${file.name}</p>
  `;
}

// CSV preview
function previewCsvFile(file) {
  const reader = new FileReader();
  reader.onload = function (e) {
    const text = e.target.result;
    fullCsvContent = text;

    const rows = text.trim().split("\n").map((r) => r.split(","));
    const headers = rows[0];
    const dataRows = rows.slice(1, 21);

    previewTable.querySelector("thead").innerHTML =
      "<tr>" + headers.map((h) => `<th>${h}</th>`).join("") + "</tr>";

    previewTable.querySelector("tbody").innerHTML = dataRows
      .map(
        (row) => "<tr>" + row.map((val) => `<td>${val}</td>`).join("") + "</tr>"
      )
      .join("");

    previewSection.style.display = "block";
  };
  reader.readAsText(file);
}

// Drag & Drop
dropZone.addEventListener("click", () => fileInput.click());
dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});
dropZone.addEventListener("dragleave", () =>
  dropZone.classList.remove("dragover")
);
dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  if (e.dataTransfer.files.length) {
    fileInput.files = e.dataTransfer.files;
    updateDropZone(fileInput.files[0]);
    previewCsvFile(fileInput.files[0]);
  }
});

// File input change
fileInput.addEventListener("change", () => {
  if (fileInput.files.length) {
    updateDropZone(fileInput.files[0]);
    previewCsvFile(fileInput.files[0]);
  }
});

// Upload handler
document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!fileInput.files.length) {
    showNotification("Please select a CSV file!", 'warning');
    return;
  }

  const action = document.getElementById("actionSelect").value;
  if (!action) {
    showNotification("Please select an action!", 'warning');
    return;
  }

  const datasetType = document.getElementById("datasetSelect").value;
  if (!datasetType) {
    showNotification("Please select a dataset type!", 'warning');
    return;
  }

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);
  formData.append("action", action);
  formData.append("dataset_type", datasetType);

  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.innerHTML;

  try {
    // Show loading state
    submitBtn.innerHTML = '<span class="loading"></span> Processing...';
    submitBtn.disabled = true;
    showModal();

    const res = await fetch("/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error("Upload failed");

    const result = await res.json();

    if (result.predictions && result.predictions.length > 0) {
      showPreview(result.predictions);
      fullCsvContent = convertToCsv(result.predictions);
    }

    showNotification("Upload successful!", 'success');
  } catch (err) {
    showNotification("Error uploading file: " + err.message, 'error');
  } finally {
    hideModal();
    submitBtn.innerHTML = originalBtnText;
    submitBtn.disabled = false;
  }
});

// Preview with predictions
function showPreview(data) {
  const headers = Object.keys(data[0]);

  previewTable.querySelector("thead").innerHTML =
    "<tr>" + headers.map((h) => `<th>${h}</th>`).join("") + "</tr>";

  previewTable.querySelector("tbody").innerHTML = data
    .slice(0, 20)
    .map((row) => {
      return (
        "<tr>" +
        headers
          .map((h) => {
            let cellValue = row[h];
            if (h.toLowerCase() === "status") {
              let statusClass = "";
              if (cellValue.toLowerCase().includes("confirm"))
                statusClass = "status-confirmed";
              else if (cellValue.toLowerCase().includes("candidate"))
                statusClass = "status-candidate";
              else if (cellValue.toLowerCase().includes("false"))
                statusClass = "status-false";
              else statusClass = "status-unknown";
              return `<td class="${statusClass}">${cellValue}</td>`;
            }
            return `<td>${cellValue}</td>`;
          })
          .join("") +
        "</tr>"
      );
    })
    .join("");

  previewSection.style.display = "block";
}

function convertToCsv(data) {
  const headers = Object.keys(data[0]);
  const rows = data.map((row) => headers.map((h) => row[h]).join(","));
  return [headers.join(","), ...rows].join("\n");
}

// Download
downloadBtn.addEventListener("click", () => {
  const blob = new Blob([fullCsvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "predictions.csv";
  a.click();
  URL.revokeObjectURL(url);
});

// Notification system
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i class="bi bi-${getIcon(type)}"></i>
      <span>${message}</span>
    </div>
  `;

  // Add to page
  document.body.appendChild(notification);

  // Remove after 5 seconds
  setTimeout(() => {
    notification.remove();
  }, 5000);
}

function getIcon(type) {
  switch (type) {
    case 'success': return 'check-circle';
    case 'error': return 'exclamation-circle';
    case 'warning': return 'exclamation-triangle';
    default: return 'info-circle';
  }
}