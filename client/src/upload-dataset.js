
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

    // CSV preview with status coloring
    function previewCsvFile(file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const text = e.target.result;
        fullCsvContent = text;

        const rows = text.trim().split("\n").map((r) => r.split(","));
        const headers = rows[0];
        const dataRows = rows.slice(1, 21);

        // Build head
        previewTable.querySelector("thead").innerHTML =
          "<tr>" + headers.map((h) => `<th>${h}</th>`).join("") + "</tr>";

        // Find "status" column index if present
        const statusIndex = headers.findIndex(h => h.toLowerCase().includes("status"));

        // Build body with conditional coloring
        previewTable.querySelector("tbody").innerHTML = dataRows
          .map((row) => {
            return (
              "<tr>" +
              row
                .map((val, idx) => {
                  if (idx === statusIndex) {
                    let statusClass = "";
                    if (val.toLowerCase().includes("confirm"))
                      statusClass = "status-confirmed";
                    else if (val.toLowerCase().includes("candidate"))
                      statusClass = "status-candidate";
                    else if (val.toLowerCase().includes("false"))
                      statusClass = "status-false";
                    else statusClass = "status-unknown";
                    return `<td class="${statusClass}">${val}</td>`;
                  }
                  return `<td>${val}</td>`;
                })
                .join("") +
              "</tr>"
            );
          })
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
        alert("Please select a CSV file!");
        return;
      }
      const action = document.getElementById("actionSelect").value;
      if (!action) {
        alert("Please select an action!");
        return;
      }

      const formData = new FormData();
      formData.append("file", fileInput.files[0]);
      formData.append("action", action);

      try {
        showModal();

        const res = await fetch("http://127.0.0.1:5500/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Upload failed");

        const result = await res.json();

        if (result.predictions && result.predictions.length > 0) {
          // Replace preview with predictions
          const headers = Object.keys(result.predictions[0]);
          const rows = result.predictions.slice(0, 20);

          previewTable.querySelector("thead").innerHTML =
            "<tr>" + headers.map((h) => `<th>${h}</th>`).join("") + "</tr>";

          previewTable.querySelector("tbody").innerHTML = rows
            .map((row) => {
              return (
                "<tr>" +
                headers.map(h => `<td>${row[h]}</td>`).join("") +
                "</tr>"
              );
            })
            .join("");

          fullCsvContent = convertToCsv(result.predictions);
          previewSection.style.display = "block";
        }
      } catch (err) {
        alert("❌ Error uploading file: " + err.message);
      } finally {
        hideModal();
      }
    });

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
