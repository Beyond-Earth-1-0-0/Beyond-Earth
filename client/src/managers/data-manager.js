// src/data-manager.js

export class DataManager {
    constructor() {
        this.allData = [];
        this.currentData = [];
        this.abortController = null;
    }

    async loadData() {

        // Cancel any pending request
        if (this.abortController) {
            this.abortController.abort();
        }

        this.abortController = new AbortController();

        try {
            console.log("Attempting to load data from API...");

            const response = await fetch("http://127.0.0.1:5500/dataset?num_rows=500", {
                signal: this.abortController.signal,
                headers: {
                    Connection: "keep-alive",
                    "Keep-Alive": "timeout=5, max=100",
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const jsonData = await response.json();

            const dataArray = jsonData.data || [];

            this.allData = dataArray;
            // Use the same simple spread operator `[...]` for consistency
            this.currentData = [...dataArray];
            this.filteredData = [...dataArray]; // Ensure filteredData is also set

            console.log(`Loaded ${dataArray.length} planets from API`);
            return dataArray;
        } catch (error) {
            if (error.name === "AbortError") {
                console.log("Fetch aborted");
            } else {
                console.warn("API not available, using mock data:", error.message);

                const response = await fetch('../assets/kepler_mock_data.json');
                const data = await response.json();

                this.allData = data;
                this.currentData = [...this.allData];
                return this.allData;
            }
        }
    }

    getAllData() {
        return this.allData;
    }

    getCurrentData() {
        return this.currentData;
    }

    setCurrentData(data) {
        this.currentData = data;
    }

    calculateStats(data) {
        if (!data || data.length === 0) {
            return {
                avgConfidence: "N/A",
                tempRange: "N/A",
                orbitRange: "N/A"
            };
        }

        const avgScore = (data.reduce((sum, p) => sum + (p.koi_score || 0), 0) / data.length * 100).toFixed(1);

        const temps = data.map(p => p.koi_teq || 0).sort((a, b) => a - b);
        const periods = data.map(p => p.koi_period || 0).sort((a, b) => a - b);

        return {
            avgConfidence: avgScore,
            tempRange: `${temps[0]}-${temps[temps.length - 1]}`,
            orbitRange: `${periods[0].toFixed(1)}-${periods[periods.length - 1].toFixed(1)}`
        };
    }

    exportToCSV() {
        const csv = [
            ['Planet', 'Status', 'Score', 'Period', 'Duration', 'Depth', 'Temp', 'Impact', 'Time0'].join(','),
            ...this.currentData.map(p => [
                p.kepoi_name,
                p.koi_disposition,
                p.koi_score,
                p.koi_period,
                p.koi_duration,
                p.koi_depth,
                p.koi_teq,
                p.koi_impact,
                p.koi_time0bk
            ].join(','))
        ].join('\n');

        this.downloadFile(csv, 'kepler_exoplanets.csv', 'text/csv');
    }

    exportToJSON() {
        const json = JSON.stringify(this.currentData, null, 2);
        this.downloadFile(json, 'kepler_exoplanets.json', 'application/json');
    }

    exportToTXT() {
        const headers = ['Planet', 'Status', 'Score', 'Period', 'Duration', 'Depth', 'Temp', 'Impact', 'Time0'].join('\t');
        const rows = this.currentData.map(p => [
            p.kepoi_name,
            p.koi_disposition,
            p.koi_score,
            p.koi_period,
            p.koi_duration,
            p.koi_depth,
            p.koi_teq,
            p.koi_impact,
            p.koi_time0bk
        ].join('\t'));

        const txt = [headers, ...rows].join('\n');
        this.downloadFile(txt, 'kepler_exoplanets.txt', 'text/plain');
    }

    exportToMarkdown() {
        let markdown = '# Kepler Exoplanet Data Export\n\n';
        markdown += `**Export Date:** ${new Date().toLocaleDateString()}\n`;
        markdown += `**Records:** ${this.currentData.length} planets\n\n`;
        markdown += '## Data Table\n\n';
        markdown += '| Planet | Status | Score | Period (d) | Duration (h) | Depth (ppm) | Temp (K) |\n';
        markdown += '|--------|--------|-------|------------|--------------|-------------|----------|\n';

        this.currentData.forEach(p => {
            markdown += `| ${p.kepoi_name} | ${p.koi_disposition} | ${(p.koi_score * 100).toFixed(1)}% | ${p.koi_period.toFixed(4)} | ${p.koi_duration.toFixed(4)} | ${p.koi_depth.toFixed(1)} | ${p.koi_teq} |\n`;
        });

        markdown += '\n---\n';
        markdown += '*Data Source: NASA Exoplanet Archive | Kepler Mission DR25*\n';

        this.downloadFile(markdown, 'kepler_exoplanets.md', 'text/markdown');
    }

    exportChartData(chartType) {
        let data, filename;

        if (chartType === 'period') {
            data = this.currentData.map(p => ({
                planet: p.kepoi_name,
                period: p.koi_period
            }));
            filename = 'orbital_periods.json';
        }

        const json = JSON.stringify(data, null, 2);
        this.downloadFile(json, filename, 'application/json');
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }
}