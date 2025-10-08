// src/data-viewer-main.js
import * as THREE from 'three';
import { StarField } from './utilities/star-field.js';
import { DataManager } from './managers/data-manager.js';
import { ChartManager } from './managers/chart-manager.js';
import { TableManager } from './managers/table-manager.js';
import { ModalManager } from './managers/modal-manager.js';
import { FilterManager } from './managers/filter-manager.js';
import { PaginationHandler } from './controllers/pagination-handler.js';

class DataViewerApp {
    constructor() {
        this.starField = null;
        this.dataManager = null;
        this.chartManager = null;
        this.tableManager = null;
        this.modalManager = null;
        this.filterManager = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.paginationHandler = null;
    }

    async init() {
        console.log('Initializing Data Viewer...');

        // Check if Chart.js is loaded
        if (typeof Chart === 'undefined') {
            console.error('Chart.js library is not loaded. Please ensure Chart.js is included in your HTML.');
            return;
        }

        // Initialize Three.js scene for star field
        try {
            this.initThreeJS();
            // Initialize star field background with proper scene
            this.starField = new StarField(this.scene);
            await this.starField.init();
            this.animate();
        } catch (error) {
            console.warn('Failed to initialize star field:', error);
        }

        // Initialize data manager
        this.dataManager = new DataManager();
        await this.dataManager.loadData();

        // Initialize managers
        this.chartManager = new ChartManager(this.dataManager);
        this.tableManager = new TableManager(this.dataManager);
        this.modalManager = new ModalManager(this.dataManager);
        this.filterManager = new FilterManager(this.dataManager, this.chartManager, this.tableManager);

        this.paginationHandler = new PaginationHandler(this.tableManager, this.dataManager);

        // Setup UI
        this.setupEventListeners();
        this.updateStats();

        // Initialize charts and table
        this.chartManager.initializeCharts();
        this.paginationHandler.updateTable();

        console.log('Data Viewer initialized successfully');
    }

    initThreeJS() {
        // Get the canvas element
        const canvas = document.getElementById('stars');
        if (!canvas) {
            console.error('Canvas element with id "stars" not found');
            throw new Error('Canvas not found');
        }

        if (!(canvas instanceof HTMLCanvasElement)) {
            console.error('Element with id "stars" is not a canvas element');
            throw new Error('Element is not a canvas');
        }

        // Create scene
        this.scene = new THREE.Scene();

        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            5000
        );
        this.camera.position.z = 1000;

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            alpha: true,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
    }

    animate() {
        if (!this.renderer || !this.scene || !this.camera) return;

        requestAnimationFrame(() => this.animate());

        // Update star field
        if (this.starField) {
            this.starField.update();
        }

        // Render scene
        this.renderer.render(this.scene, this.camera);
    }

    setupEventListeners() {
        // Navigation buttons
        document.getElementById('backBtn')?.addEventListener('click', () => {
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.location.href = '../pages/exo-space.html'; // fallback URL
            }
        });

        document.getElementById('docBtn')?.addEventListener('click', () => {
            this.modalManager.showDocumentation();
        });

        document.getElementById('apiBtn')?.addEventListener('click', () => {
            this.modalManager.showAPIAccess();
        });

        document.getElementById('exportBtn')?.addEventListener('click', () => {
            this.modalManager.showExportOptions();
        });

        // Table actions
        document.getElementById('searchBox')?.addEventListener('input', (e) => {
            this.filterManager.handleSearch(e.target.value);
            this.paginationHandler.reset(); // <-- Reset to first page
        });

        document.getElementById('sortPeriodBtn')?.addEventListener('click', () => {
            this.tableManager.sortTable('period');
            this.paginationHandler.updateTable();
        });

        document.getElementById('sortTempBtn')?.addEventListener('click', () => {
            this.tableManager.sortTable('temp');
            this.paginationHandler.updateTable();
        });

        document.getElementById('exportCsvBtn')?.addEventListener('click', () => {
            this.dataManager.exportToCSV();
        });

        // Filter dropdowns
        document.getElementById('dispositionFilter')?.addEventListener('change', () => {
            this.filterManager.applyFilters();
            this.paginationHandler.reset(); // <-- Reset to first page
        });

        document.getElementById('tempFilter')?.addEventListener('change', () => {
            this.filterManager.applyFilters();
            this.paginationHandler.reset(); // <-- Reset to first page
        });

        document.getElementById('periodFilter')?.addEventListener('change', () => {
            this.filterManager.applyFilters();
            this.paginationHandler.reset(); // <-- Reset to first page
        });

        // Chart controls
        this.setupChartControls();

        // Table column sorting
        document.querySelectorAll('.data-table th[data-sort]').forEach(th => {
            th.addEventListener('click', (e) => {
                const sortKey = e.target.getAttribute('data-sort');
                this.tableManager.sortTable(sortKey);
                this.paginationHandler.updateTable(); // <-- Update table view after sorting
            });
        });

        // Modal close on outside click
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.modalManager.closeModal(e.target.id);
            }
        });

        // ESC key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.modalManager.closeAllModals();
            }
        });

        // Window resize
        window.addEventListener('resize', () => {
            if (this.camera && this.renderer) {
                this.camera.aspect = window.innerWidth / window.innerHeight;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(window.innerWidth, window.innerHeight);
            }
            this.chartManager?.resizeCharts();
        });
    }

    setupChartControls() {
        // Wait for Chart.js to be available
        if (typeof Chart === 'undefined') {
            console.error('Chart.js is not loaded');
            return;
        }

        // Period chart controls
        document.getElementById('periodBarBtn')?.addEventListener('click', () => {
            this.chartManager.switchPeriodChart('bar');
        });

        document.getElementById('periodLineBtn')?.addEventListener('click', () => {
            this.chartManager.switchPeriodChart('line');
        });

        document.getElementById('periodExportBtn')?.addEventListener('click', () => {
            this.dataManager.exportChartData('period');
        });

        // Scatter chart controls
        document.getElementById('scatterBtn')?.addEventListener('click', () => {
            this.chartManager.switchScatterChart('scatter');
        });

        document.getElementById('regressionBtn')?.addEventListener('click', () => {
            this.chartManager.switchScatterChart('regression');
        });

        // Depth chart controls
        document.getElementById('depthLineBtn')?.addEventListener('click', () => {
            this.chartManager.switchDepthChart('line');
        });

        document.getElementById('depthAreaBtn')?.addEventListener('click', () => {
            this.chartManager.switchDepthChart('area');
        });

        document.getElementById('doughnutBtn')?.addEventListener('click', () => {
            this.chartManager.switchDispositionChart('doughnut');
        });

        document.getElementById('pieBtn')?.addEventListener('click', () => {
            this.chartManager.switchDispositionChart('pie');
        });

        document.getElementById('histogramBarBtn')?.addEventListener('click', () => {
            this.chartManager.switchHistogramChart('bar');
        });

        document.getElementById('histogramLineBtn')?.addEventListener('click', () => {
            this.chartManager.switchHistogramChart('line');
        });
    }

    updateStats() {
        const data = this.dataManager.getAllData();
        if (!data || data.length === 0) return; // Guard against no data

        const stats = this.dataManager.calculateStats(data);

        document.getElementById('totalPlanets').textContent = data.length;
        document.getElementById('avgConfidence').textContent = stats.avgConfidence + '%';
        document.getElementById('tempRange').textContent = stats.tempRange;
        document.getElementById('orbitRange').textContent = stats.orbitRange;

        const periods = data.map(p => p.koi_period).filter(v => v !== null && !isNaN(v));
        const temps = data.map(p => p.koi_teq).filter(v => v !== null && !isNaN(v));
        const depths = data.map(p => p.koi_depth).filter(v => v !== null && !isNaN(v));
        const durations = data.map(p => p.koi_duration).filter(v => v !== null && !isNaN(v));

        const calculateMean = (arr) => arr.reduce((acc, val) => acc + val, 0) / arr.length;
        const calculateStdDev = (arr) => {
            const mean = calculateMean(arr);
            const variance = arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / arr.length;
            return Math.sqrt(variance);
        };

        const meanPeriod = periods.length > 0 ? calculateMean(periods).toFixed(2) : '0';
        const meanTemp = temps.length > 0 ? calculateMean(temps).toFixed(2) : '0';
        const meanDepth = depths.length > 0 ? calculateMean(depths).toFixed(2) : '0';
        const meanDuration = durations.length > 0 ? calculateMean(durations).toFixed(2) : '0';
        const sigmaPeriod = periods.length > 0 ? calculateStdDev(periods).toFixed(2) : '0';

        // Update the DOM for quick stats
        document.getElementById('meanPeriod').textContent = `${meanPeriod} d`;
        document.getElementById('meanTemp').textContent = `${meanTemp} K`;
        document.getElementById('meanDepth').textContent = `${meanDepth} ppm`;
        document.getElementById('meanDuration').textContent = `${meanDuration} hrs`;
        document.getElementById('sigmaPeriod').textContent = `${sigmaPeriod} d`;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new DataViewerApp();
    app.init().catch(error => {
        console.error('Failed to initialize Data Viewer:', error);
    });
});

export { DataViewerApp };