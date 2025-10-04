// src/table-manager.js

export class TableManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.sortDirection = {};
        // The pagination handler will now be responsible for rendering
    }

    renderTable(data) {
        const tbody = document.getElementById('tableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        data.forEach(planet => {
            const row = document.createElement('tr');
            row.onclick = () => window.open(planet.link, '_blank');

            let badgeClass = '';
            if (planet.koi_disposition === 'CANDIDATE') {
                badgeClass = 'status-candidate';
            } else if (planet.koi_disposition === 'FALSE POSITIVE') {
                badgeClass = 'status-false-positive';
            } else if (planet.koi_disposition === 'CONFIRMED') {
                badgeClass = 'status-confirmed';
            }

            row.innerHTML = `
                <td class="planet-name-cell">${planet.kepoi_name}</td>
                <td><span class="status-badge ${badgeClass}">${planet.koi_disposition}</span></td>
                <td>
                    <div class="confidence-cell">
                        <div class="confidence-bar">
                            <div class="confidence-fill" style="width: ${planet.koi_score * 100}%"></div>
                        </div>
                        <span>${(planet.koi_score * 100).toFixed(1)}%</span>
                    </div>
                </td>
                <td>${planet.koi_period.toFixed(4)}</td>
                <td>${planet.koi_duration.toFixed(4)}</td>
                <td>${planet.koi_depth.toFixed(1)}</td>
                <td>${planet.koi_teq}</td>
                <td>${planet.koi_impact.toFixed(4)}</td>
                <td>${planet.koi_time0bk.toFixed(5)}</td>
                <td><a href="${planet.link}" target="_blank" class="view-link" onclick="event.stopPropagation()">View →</a></td>
            `;

            tbody.appendChild(row);
        });
    }

    sortTable(sortBy) {
        this.sortDirection[sortBy] = !this.sortDirection[sortBy];
        let sortedData = [...this.dataManager.getCurrentData()];

        const sortMap = {
            'name': (a, b) => a.kepoi_name.localeCompare(b.kepoi_name),
            'period': (a, b) => a.koi_period - b.koi_period,
            'temp': (a, b) => a.koi_teq - b.koi_teq,
            'confidence': (a, b) => a.koi_score - b.koi_score,
            'duration': (a, b) => a.koi_duration - b.koi_duration,
            'depth': (a, b) => a.koi_depth - b.koi_depth,
            'impact': (a, b) => a.koi_impact - b.koi_impact,
            'status': (a, b) => a.koi_disposition.localeCompare(b.koi_disposition)
        };

        if (sortMap[sortBy]) {
            sortedData.sort(sortMap[sortBy]);
            if (this.sortDirection[sortBy]) sortedData.reverse();
        }

        this.dataManager.setCurrentData(sortedData);
        // The main app will call the pagination handler to update the view
    }
}