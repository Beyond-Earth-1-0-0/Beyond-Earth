// src/chart-manager.js

export class ChartManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.periodChart = null;
        this.scatterChart = null;
        this.depthChart = null;
        this.dispositionChart = null;
        this.histogramChart = null;

        this.currentPeriodType = 'bar';
        this.currentScatterType = 'scatter';
        this.currentDepthType = 'line';
        this.currentDispositionType = 'doughnut';
        this.currentHistogramType = 'bar';

        this.setupChartDefaults();
    }

    setupChartDefaults() {
        Chart.defaults.color = '#999';
        Chart.defaults.borderColor = 'rgba(0, 150, 200, 0.2)';
        Chart.defaults.font.family = "'SF Pro Display', -apple-system, sans-serif";
        Chart.defaults.font.size = 11;
    }

    getChartOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1500,
                easing: 'easeInOutQuart'
            },
            interaction: {
                mode: 'nearest',
                intersect: false
            }
        };
    }

    initializeCharts() {
        this.createPeriodChart('bar');
        this.createScatterChart('scatter');
        this.createDepthChart('line');
        this.createDispositionChart('doughnut');
        this.createHistogramChart('bar');
    }

    createPeriodChart(type) {
        const ctx = document.getElementById('periodChart');
        if (!ctx) return;

        if (this.periodChart) this.periodChart.destroy();

        const data = this.dataManager.getCurrentData();
        const periodData = data.map(p => p.koi_period);
        const maxPeriod = Math.max(...periodData);
        this.periodChart = new Chart(ctx, {
            type: type,
            data: {
                labels: data.map(p => p.kepoi_name),
                datasets: [{
                    label: 'Orbital Period (days)',
                    data: periodData,
                    backgroundColor: 'rgba(0, 170, 255, 0.7)',
                    borderColor: 'rgba(0, 170, 255, 1)',
                    borderWidth: type === 'line' ? 3 : 1,
                    borderRadius: type === 'bar' ? 4 : 0,
                    tension: type === 'line' ? 0.4 : 0,
                    fill: false,
                    pointRadius: type === 'line' ? 5 : 0,
                    pointHoverRadius: type === 'line' ? 8 : 0,
                    pointBackgroundColor: '#00aaff',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                ...this.getChartOptions(),
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(10, 25, 40, 0.95)',
                        borderColor: 'rgba(0, 150, 200, 0.5)',
                        borderWidth: 1,
                        padding: 12,
                        titleFont: { size: 13, weight: 'bold' },
                        bodyFont: { size: 12 }
                    }
                },
                scales: {
                    y: {
                        type: 'logarithmic',
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Orbital Period (days)',
                            color: '#00aaff',
                            font: { size: 12, weight: '600' }
                        },
                        grid: { color: 'rgba(0, 150, 200, 0.1)' },
                        ticks: { color: '#999' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: '#999',
                            maxRotation: 45,
                            minRotation: 45,
                            font: { size: 10 }
                        }
                    }
                }
            }
        });
    }

    switchPeriodChart(type) {
        this.currentPeriodType = type;
        this.createPeriodChart(type);

        document.getElementById('periodBarBtn')?.classList.toggle('active', type === 'bar');
        document.getElementById('periodLineBtn')?.classList.toggle('active', type === 'line');
    }

    calculateRegression(data) {
        const n = data.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

        data.forEach(point => {
            sumX += point.x;
            sumY += point.y;
            sumXY += point.x * point.y;
            sumX2 += point.x * point.x;
        });

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        const yMean = sumY / n;
        let ssTotal = 0, ssResidual = 0;
        data.forEach(point => {
            const yPred = slope * point.x + intercept;
            ssTotal += Math.pow(point.y - yMean, 2);
            ssResidual += Math.pow(point.y - yPred, 2);
        });
        const r2 = 1 - (ssResidual / ssTotal);

        return { slope, intercept, r2 };
    }

    createScatterChart(mode) {
        const ctx = document.getElementById('scatterChart');
        if (!ctx) return;

        if (this.scatterChart) this.scatterChart.destroy();

        const planetData = this.dataManager.getCurrentData();
        const scatterData = planetData.map(p => ({ x: p.koi_period, y: p.koi_teq }));

        const datasets = [{
            label: 'Exoplanets',
            data: scatterData,
            backgroundColor: 'rgba(0, 170, 255, 0.7)',
            borderColor: 'rgba(0, 170, 255, 1)',
            borderWidth: 2,
            pointRadius: 7,
            pointHoverRadius: 10,
            pointHoverBackgroundColor: '#00ff88'
        }];

        if (mode === 'regression') {
            const regression = this.calculateRegression(scatterData);
            const minX = Math.min(...scatterData.map(d => d.x));
            const maxX = Math.max(...scatterData.map(d => d.x));

            datasets.push({
                label: `Regression Line (R² = ${regression.r2.toFixed(3)})`,
                data: [
                    { x: minX, y: regression.slope * minX + regression.intercept },
                    { x: maxX, y: regression.slope * maxX + regression.intercept }
                ],
                type: 'line',
                borderColor: '#00ff88',
                borderWidth: 3,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false,
                tension: 0
            });
        }

        this.scatterChart = new Chart(ctx, {
            type: 'scatter',
            data: { datasets },
            options: {
                ...this.getChartOptions(),
                plugins: {
                    legend: {
                        display: mode === 'regression',
                        labels: { color: '#999', font: { size: 11 } }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(10, 25, 40, 0.95)',
                        borderColor: 'rgba(0, 150, 200, 0.5)',
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            label: (context) => {
                                if (context.datasetIndex === 1) return context.dataset.label;
                                const planet = planetData[context.dataIndex];
                                return [
                                    `Planet: ${planet.kepoi_name}`,
                                    `Period: ${context.parsed.x.toFixed(3)} days`,
                                    `Temperature: ${context.parsed.y} K`,
                                    `Score: ${(planet.koi_score * 100).toFixed(1)}%`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Orbital Period (days)',
                            color: '#00aaff',
                            font: { size: 12, weight: '600' }
                        },
                        grid: { color: 'rgba(0, 150, 200, 0.1)' },
                        ticks: { color: '#999' }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Equilibrium Temperature (K)',
                            color: '#00aaff',
                            font: { size: 12, weight: '600' }
                        },
                        grid: { color: 'rgba(0, 150, 200, 0.1)' },
                        ticks: { color: '#999' }
                    }
                }
            }
        });
    }

    switchScatterChart(mode) {
        this.currentScatterType = mode;
        this.createScatterChart(mode);

        document.getElementById('scatterBtn')?.classList.toggle('active', mode === 'scatter');
        document.getElementById('regressionBtn')?.classList.toggle('active', mode === 'regression');
    }

    createDepthChart(type) {
        const ctx = document.getElementById('depthChart');
        if (!ctx) return;

        if (this.depthChart) this.depthChart.destroy();

        const data = this.dataManager.getCurrentData();

        this.depthChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(p => p.kepoi_name.replace('Kepler-', 'K-')),
                datasets: [{
                    label: 'Transit Depth (ppm)',
                    data: data.map(p => p.koi_depth),
                    borderColor: '#00aaff',
                    backgroundColor: type === 'area' ? 'rgba(0, 170, 255, 0.3)' : 'rgba(0, 170, 255, 0.15)',
                    tension: 0.4,
                    fill: type === 'area',
                    pointBackgroundColor: '#00aaff',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    pointHoverBackgroundColor: '#00ff88',
                    borderWidth: 3
                }]
            },
            options: {
                ...this.getChartOptions(),
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(10, 25, 40, 0.95)',
                        borderColor: 'rgba(0, 150, 200, 0.5)',
                        borderWidth: 1,
                        padding: 12
                    }
                },
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Transit Depth (ppm)',
                            color: '#00aaff',
                            font: { size: 12, weight: '600' }
                        },
                        grid: { color: 'rgba(0, 150, 200, 0.1)' },
                        ticks: { color: '#999' }
                    },
                    x: {
                        grid: { color: 'rgba(0, 150, 200, 0.1)' },
                        ticks: {
                            color: '#999',
                            maxRotation: 45,
                            minRotation: 45,
                            font: { size: 10 }
                        }
                    }
                }
            }
        });
    }

    switchDepthChart(type) {
        this.currentDepthType = type;
        this.createDepthChart(type);

        document.getElementById('depthLineBtn')?.classList.toggle('active', type === 'line');
        document.getElementById('depthAreaBtn')?.classList.toggle('active', type === 'area');
    }

    createDispositionChart(type) {
        const ctx = document.getElementById('dispositionChart');
        if (!ctx) return;

        if (this.dispositionChart) this.dispositionChart.destroy();

        const data = this.dataManager.getCurrentData();
        const dispositionCounts = {};
        data.forEach(p => {
            const disp = p.koi_disposition;
            dispositionCounts[disp] = (dispositionCounts[disp] || 0) + 1;
        });

        this.dispositionChart = new Chart(ctx, {
            type: type,
            data: {
                labels: Object.keys(dispositionCounts),
                datasets: [{
                    label: 'Count',
                    data: Object.values(dispositionCounts),
                    backgroundColor: [
                        'rgba(0, 255, 136, 0.7)',  // CONFIRMED
                        'rgba(255, 193, 7, 0.7)',   // CANDIDATE
                        'rgba(255, 82, 82, 0.7)',    // FALSE POSITIVE
                    ],
                    borderColor: [
                        'rgba(0, 255, 136, 1)',
                        'rgba(255, 193, 7, 1)',
                        'rgba(255, 82, 82, 1)',
                    ],
                    borderWidth: 3,
                }]
            },
            options: {
                ...this.getChartOptions(),
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { padding: 20, font: { size: 12 } }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(10, 25, 40, 0.95)',
                        borderColor: 'rgba(0, 150, 200, 0.5)',
                        borderWidth: 1,
                        padding: 12
                    },
                    title: {
                        display: true,
                        text: 'Disposition Distribution',
                        color: '#e8e8e8',
                        font: { size: 14, weight: '600' }
                    }
                }
            }
        });
    }

    switchDispositionChart(type) {
        this.currentDispositionType = type;
        this.createDispositionChart(type);

        document.getElementById('doughnutBtn')?.classList.toggle('active', type === 'doughnut');
        document.getElementById('pieBtn')?.classList.toggle('active', type === 'pie');
    }


    // ========================================================================
    // NEW: HISTOGRAM CHART (TEMPERATURE DISTRIBUTION)
    // ========================================================================

    /**
     * Helper method to bin numerical data for the histogram.
     */
    _calculateBins(data, property, binCount = 15) {
        const values = data.map(p => p[property]).filter(v => v != null);
        if (values.length === 0) return { labels: [], bins: [] };

        const minVal = Math.min(...values);
        const maxVal = Math.max(...values);
        const binSize = (maxVal - minVal) / binCount;

        const bins = Array(binCount).fill(0);
        const labels = [];

        for (let i = 0; i < binCount; i++) {
            const binStart = Math.round(minVal + i * binSize);
            const binEnd = Math.round(binStart + binSize);
            labels.push(`${binStart}-${binEnd} K`);
        }

        values.forEach(value => {
            const binIndex = Math.min(Math.floor((value - minVal) / binSize), binCount - 1);
            bins[binIndex]++;
        });

        return { labels, bins };
    }

    createHistogramChart(type) {
        const ctx = document.getElementById('histogramChart');
        if (!ctx) return;

        if (this.histogramChart) this.histogramChart.destroy();

        const data = this.dataManager.getCurrentData();
        const { labels, bins } = this._calculateBins(data, 'koi_teq', 15);

        this.histogramChart = new Chart(ctx, {
            type: type,
            data: {
                labels: labels,
                datasets: [{
                    label: 'Frequency',
                    data: bins,
                    backgroundColor: 'rgba(0, 255, 136, 0.7)',
                    borderColor: 'rgba(0, 255, 136, 1)',
                    borderWidth: type === 'line' ? 3 : 1,
                    borderRadius: type === 'bar' ? 4 : 0,
                    tension: type === 'line' ? 0.4 : 0,
                    fill: false,
                }]
            },
            options: {
                ...this.getChartOptions(),
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: 'Temperature Distribution',
                        color: '#e8e8e8',
                        font: { size: 14, weight: '600' }
                    }
                },
                scales: {
                    y: {
                        title: { display: true, text: 'Planet Count', color: '#00ff88' },
                        ticks: { precision: 0 }
                    },
                    x: {
                        title: { display: true, text: 'Temperature Range (K)', color: '#00ff88' },
                        ticks: { maxRotation: 45, minRotation: 45 }
                    }
                }
            }
        });
    }

    switchHistogramChart(type) {
        this.currentHistogramType = type;
        this.createHistogramChart(type);

        document.getElementById('histogramBarBtn')?.classList.toggle('active', type === 'bar');
        document.getElementById('histogramLineBtn')?.classList.toggle('active', type === 'line');
    }


    updateCharts(data) {
        if (this.periodChart) {
            this.periodChart.data.labels = data.map(p => p.kepoi_name);
            this.periodChart.data.datasets[0].data = data.map(p => p.koi_period);
            this.periodChart.update();
        }

        if (this.scatterChart) {
            const scatterData = data.map(p => ({ x: p.koi_period, y: p.koi_teq }));
            this.scatterChart.data.datasets[0].data = scatterData;

            if (this.currentScatterType === 'regression' && this.scatterChart.data.datasets.length > 1) {
                const regression = this.calculateRegression(scatterData);
                const minX = Math.min(...scatterData.map(d => d.x));
                const maxX = Math.max(...scatterData.map(d => d.x));

                this.scatterChart.data.datasets[1].data = [
                    { x: minX, y: regression.slope * minX + regression.intercept },
                    { x: maxX, y: regression.slope * maxX + regression.intercept }
                ];
                this.scatterChart.data.datasets[1].label = `Regression Line (R² = ${regression.r2.toFixed(3)})`;
            }
            this.scatterChart.update();
        }

        if (this.depthChart) {
            this.depthChart.data.labels = data.map(p => p.kepoi_name.replace('Kepler-', 'K-'));
            this.depthChart.data.datasets[0].data = data.map(p => p.koi_depth);
            this.depthChart.update();
        }

        if (this.dispositionChart) {
            const dispositionCounts = {};
            data.forEach(p => {
                const disp = p.koi_disposition;
                dispositionCounts[disp] = (dispositionCounts[disp] || 0) + 1;
            });
            this.dispositionChart.data.labels = Object.keys(dispositionCounts);
            this.dispositionChart.data.datasets[0].data = Object.values(dispositionCounts);
            this.dispositionChart.update();
        }

        if (this.histogramChart) {
            const { labels, bins } = this._calculateBins(data, 'koi_teq', 15);
            this.histogramChart.data.labels = labels;
            this.histogramChart.data.datasets[0].data = bins;
            this.histogramChart.update();
        }
    }

    resizeCharts() {
        this.periodChart?.resize();
        this.scatterChart?.resize();
        this.depthChart?.resize();
        this.dispositionChart?.resize();
        this.histogramChart?.resize();
    }
}