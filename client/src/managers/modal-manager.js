// src/managers/modal-manager.js

export class ModalManager {
    constructor(dataManager) {
        this.dataManager = dataManager; // Store the reference
        this.modals = {
            documentation: null,
            api: null,
            export: null
        };
        this.initializeModals();
    }

    initializeModals() {
        this.createDocumentationModal();
        this.createAPIModal();
        this.createExportModal();
    }

    createDocumentationModal() {
        const modal = document.getElementById('documentationModal');
        if (!modal) return;

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">Documentation</h2>
                    <button class="close-btn" onclick="this.closest('.modal').style.display='none'">×</button>
                </div>
                <div class="modal-body">
                    <h2>Overview</h2>
                    <p>The Kepler Exoplanet Archive provides access to confirmed exoplanet discoveries from the Kepler Space Telescope mission. This platform offers interactive visualization and analysis tools for exploring planetary characteristics, orbital parameters, and observational data.</p>

                    <h2>Data Sources</h2>
                    <p>All data is sourced from NASA's official Kepler mission archives and has been validated through peer-reviewed scientific processes.</p>
                    <ul>
                        <li><strong>Mission Duration:</strong> March 2009 - October 2018</li>
                        <li><strong>Data Release:</strong> DR25 (Final Release)</li>
                        <li><strong>Total Observations:</strong> 530,506 stars monitored</li>
                        <li><strong>Confirmed Planets:</strong> 2,662 exoplanets discovered</li>
                    </ul>

                    <h2>Available Features</h2>
                    <h3>Data Visualization</h3>
                    <ul>
                        <li>Interactive charts showing orbital period distribution</li>
                        <li>Temperature vs. orbital period scatter plots</li>
                        <li>Transit depth time series analysis</li>
                        <li>Real-time filtering and sorting capabilities</li>
                    </ul>

                    <h3>Data Fields</h3>
                    <ul>
                        <li><strong>koi_period:</strong> Orbital period in Earth days</li>
                        <li><strong>koi_teq:</strong> Equilibrium temperature in Kelvin</li>
                        <li><strong>koi_depth:</strong> Transit depth in parts per million (ppm)</li>
                        <li><strong>koi_duration:</strong> Transit duration in hours</li>
                        <li><strong>koi_impact:</strong> Impact parameter (0-1)</li>
                        <li><strong>koi_score:</strong> Disposition score (0-1, confidence level)</li>
                    </ul>

                    <h2>Using the Platform</h2>
                    <h3>Filtering Data</h3>
                    <p>Use the sidebar filters to narrow down results by disposition status, temperature ranges, or orbital period ranges.</p>

                    <h3>Sorting Tables</h3>
                    <p>Click any column header in the data table to sort by that parameter. Click again to reverse sort order.</p>

                    <h3>Exporting Data</h3>
                    <p>Use the "Export CSV" button to download the current filtered dataset for offline analysis.</p>

                    <h2>Scientific Citations</h2>
                    <p>When using this data in publications, please cite:</p>
                    <div class="code-block" data-lang="bibtex">
                        <div class="code-line">@article{Borucki2010,</div>
                        <div class="code-line">  author = {Borucki, W. J. et al.},</div>
                        <div class="code-line">  title = {Kepler Planet-Detection Mission},</div>
                        <div class="code-line">  journal = {Science},</div>
                        <div class="code-line">  year = {2010}</div>
                        <div class="code-line">}</div>
                    </div>

                    <h2>Support</h2>
                    <p>For technical support or data inquiries, please contact the NASA Exoplanet Archive team or consult the official documentation at <strong>exoplanetarchive.ipac.caltech.edu</strong></p>
                </div>
            </div>
        `;
    }

    createAPIModal() {
        const modal = document.getElementById('apiModal');
        if (!modal) return;

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">API Access</h2>
                    <button class="close-btn" onclick="this.closest('.modal').style.display='none'">×</button>
                </div>
                <div class="modal-body">
                    <h2>Kepler Archive API</h2>
                    <p>Access programmatic endpoints to retrieve exoplanet data for your applications, research, or analysis tools.</p>

                    <h2>Quick Start</h2>
                    <p>The API provides RESTful endpoints that return JSON-formatted data. No authentication is required for basic queries.</p>
                    <div class="api-endpoint">
                        <span class="api-method">GET</span>
                        <strong>Base URL:</strong> https://api.kepler-archive.nasa.gov/v1
                    </div>

                    <h2>Available Endpoints</h2>
                    <h3>1. Get All Planets</h3>
                    <div class="api-endpoint">
                        <span class="api-method">GET</span>
                        <code>/planets</code>
                    </div>
                    <p>Retrieves a list of all confirmed exoplanets in the archive.</p>

                    <h3>2. Get Planet by Name</h3>
                    <div class="api-endpoint">
                        <span class="api-method">GET</span>
                        <code>/planets/{name}</code>
                    </div>
                    <p>Retrieves detailed information for a specific planet.</p>

                    <h3>3. Filter Planets</h3>
                    <div class="api-endpoint">
                        <span class="api-method">GET</span>
                        <code>/planets/filter</code>
                    </div>
                    <p>Filter planets by various parameters.</p>
                    <ul>
                        <li><code>min_period</code>, <code>max_period</code> (days)</li>
                        <li><code>min_temp</code>, <code>max_temp</code> (K)</li>
                        <li><code>disposition</code> (CONFIRMED/CANDIDATE)</li>
                    </ul>

                    <h2>Response Format</h2>
                    <p>All endpoints return JSON in a structured format.</p>
                    <div class="code-block" data-lang="json">
                        <div class="code-line">{</div>
                        <div class="code-line">  "kepoi_name": "Kepler-227 b",</div>
                        <div class="code-line">  "koi_disposition": "CONFIRMED",</div>
                        <div class="code-line">  "koi_score": 1.0,</div>
                        <div class="code-line">  ...</div>
                        <div class="code-line">}</div>
                    </div>
                </div>
            </div>
        `;
    }

    createExportModal() {
        const modal = document.getElementById('exportModal');
        if (!modal) return;

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">Export Data</h2>
                    <button class="close-btn" onclick="this.closest('.modal').style.display='none'">×</button>
                </div>
                <div class="modal-body">
                    <h2>Export Options</h2>
                    <p>Choose your preferred format to download the current dataset. All exports include the currently filtered data.</p>
                    <div class="export-options">
                        <div class="export-card" id="exportCSV">
                            <div class="export-icon">CSV</div>
                            <h3>CSV Format</h3>
                            <p>Ideal for Excel and data analysis tools</p>
                        </div>
                        <div class="export-card" id="exportJSON">
                            <div class="export-icon">JSON</div>
                            <h3>JSON Format</h3>
                            <p>Perfect for programmatic access and APIs</p>
                        </div>
                        <div class="export-card" id="exportTXT">
                            <div class="export-icon">TXT</div>
                            <h3>Text Format</h3>
                            <p>Tab-delimited for universal compatibility</p>
                        </div>
                        <div class="export-card" id="exportMD">
                            <div class="export-icon">MD</div>
                            <h3>Markdown Table</h3>
                            <p>For documentation and reports</p>
                        </div>
                    </div>
                    <h2>What's Included</h2>
                    <ul>
                        <li>All currently filtered exoplanet records</li>
                        <li>Complete observational parameters</li>
                        <li>Metadata including export date and filter settings</li>
                    </ul>
                </div>
            </div>
        `;

        this.setupExportHandlers();
    }


    setupExportHandlers() {
        // Calls now use this.dataManager instead of window.dataManager
        document.getElementById('exportCSV')?.addEventListener('click', () => {
            this.dataManager?.exportToCSV();
            this.closeModal('exportModal');
        });

        document.getElementById('exportJSON')?.addEventListener('click', () => {
            this.dataManager?.exportToJSON();
            this.closeModal('exportModal');
        });

        document.getElementById('exportTXT')?.addEventListener('click', () => {
            this.dataManager?.exportToTXT();
            this.closeModal('exportModal');
        });

        document.getElementById('exportMD')?.addEventListener('click', () => {
            this.dataManager?.exportToMarkdown();
            this.closeModal('exportModal');
        });
    }

    showDocumentation() {
        const modal = document.getElementById('documentationModal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'block';
        }
    }

    showAPIAccess() {
        const modal = document.getElementById('apiModal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'block';
        }
    }

    showExportOptions() {
        const modal = document.getElementById('exportModal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'block';
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        });
    }
}