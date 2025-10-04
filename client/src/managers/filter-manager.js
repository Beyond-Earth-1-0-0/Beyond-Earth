// src/filter-manager.js

export class FilterManager {
    constructor(dataManager, chartManager, tableManager) {
        this.dataManager = dataManager;
        this.chartManager = chartManager;
        this.tableManager = tableManager;
    }

    handleSearch(searchTerm) {
        const term = searchTerm.toLowerCase();
        const allData = this.dataManager.getAllData();
        const filtered = allData.filter(planet =>
            planet.kepoi_name.toLowerCase().includes(term)
        );

        this.dataManager.setCurrentData(filtered);
        this.tableManager.renderTable(filtered);
        this.chartManager.updateCharts(filtered);
    }

    applyFilters() {
        let filtered = [...this.dataManager.getAllData()];

        // Temperature filter
        const tempFilter = document.getElementById('tempFilter')?.value;
        if (tempFilter && tempFilter !== 'All Temperatures') {
            if (tempFilter === '< 700 K (Cool)') {
                filtered = filtered.filter(p => p.koi_teq < 700);
            } else if (tempFilter === '700 - 1000 K (Warm)') {
                filtered = filtered.filter(p => p.koi_teq >= 700 && p.koi_teq <= 1000);
            } else if (tempFilter === '> 1000 K (Hot)') {
                filtered = filtered.filter(p => p.koi_teq > 1000);
            }
        }

        // Period filter
        const periodFilter = document.getElementById('periodFilter')?.value;
        if (periodFilter && periodFilter !== 'All Periods') {
            if (periodFilter === '< 5 days') {
                filtered = filtered.filter(p => p.koi_period < 5);
            } else if (periodFilter === '5 - 20 days') {
                filtered = filtered.filter(p => p.koi_period >= 5 && p.koi_period <= 20);
            } else if (periodFilter === '> 20 days') {
                filtered = filtered.filter(p => p.koi_period > 20);
            }
        }

        // Disposition filter
        const dispositionFilter = document.getElementById('dispositionFilter')?.value;
        if (dispositionFilter && dispositionFilter !== 'All Status') {
            filtered = filtered.filter(p =>
                p.koi_disposition.toUpperCase() === dispositionFilter.toUpperCase()
            );
        }

        this.dataManager.setCurrentData(filtered);
        this.tableManager.renderTable(filtered);
        this.chartManager.updateCharts(filtered);
    }
}