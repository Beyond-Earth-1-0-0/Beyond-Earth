// src/controllers/pagination-handler.js
export class PaginationHandler {
    constructor(tableManager, dataManager) {
        this.tableManager = tableManager;
        this.dataManager = dataManager;
        this.currentPage = 1;
        this.rowsPerPage = 10;
        this.paginationContainer = null;
    }

    /**
     * Main method to render the table and the pagination component.
     */
    updateTable() {
        const allData = this.dataManager.getCurrentData();
        const start = (this.currentPage - 1) * this.rowsPerPage;
        const end = start + this.rowsPerPage;
        const paginatedData = allData.slice(start, end);

        this.tableManager.renderTable(paginatedData);
        this._renderPagination();
    }

    /**
     * Creates and attaches the full pagination component to the DOM.
     */
    _renderPagination() {
        const tableSection = document.querySelector('.table-section');
        if (!tableSection) return;

        if (this.paginationContainer) {
            this.paginationContainer.remove();
        }

        this.paginationContainer = document.createElement('div');
        this.paginationContainer.className = 'pagination-container';

        const allData = this.dataManager.getCurrentData();
        const totalRows = allData.length;
        if (totalRows === 0) return;

        const totalPages = Math.ceil(totalRows / this.rowsPerPage);

        this.paginationContainer.innerHTML = this._createHTML(totalRows, totalPages);
        tableSection.appendChild(this.paginationContainer);
        this._attachEventListeners(totalPages);
    }

    /**
     * Generates the complete HTML string for the pagination component.
     * This now includes "First" and "Last" page buttons.
     */
    _createHTML(totalRows, totalPages) {
        const startItem = totalRows > 0 ? (this.currentPage - 1) * this.rowsPerPage + 1 : 0;
        const endItem = Math.min(startItem + this.rowsPerPage - 1, totalRows);

        // Determine disabled state for buttons
        const isFirstPage = this.currentPage === 1;
        const isLastPage = this.currentPage === totalPages;

        return `
      <div class="pagination-info">
        <span id="paginationInfo">Showing ${startItem} to ${endItem} of ${totalRows}</span>
        <select class="items-per-page" id="itemsPerPage">
          <option value="10" ${this.rowsPerPage === 10 ? 'selected' : ''}>10 per page</option>
          <option value="25" ${this.rowsPerPage === 25 ? 'selected' : ''}>25 per page</option>
          <option value="50" ${this.rowsPerPage === 50 ? 'selected' : ''}>50 per page</option>
          <option value="100" ${this.rowsPerPage === 100 ? 'selected' : ''}>100 per page</option>
        </select>
      </div>
      <div class="pagination-controls">
        <button class="pagination-btn" id="firstPageBtn" title="First page" ${isFirstPage ? 'disabled' : ''}>
          <span>⟪</span>
        </button>
        <button class="pagination-btn" id="prevPageBtn" title="Previous page" ${isFirstPage ? 'disabled' : ''}>
          <span>‹</span>
        </button>
        <div class="pagination-pages" id="paginationPages">
          ${this._createPageButtonsHTML(totalPages)}
        </div>
        <button class="pagination-btn" id="nextPageBtn" title="Next page" ${isLastPage ? 'disabled' : ''}>
          <span>›</span>
        </button>
        <button class="pagination-btn" id="lastPageBtn" title="Last page" ${isLastPage ? 'disabled' : ''}>
          <span>⟫</span>
        </button>
      </div>
    `;
    }

    /**
     * Generates the HTML for the numbered page buttons, including ellipsis.
     */
    _createPageButtonsHTML(totalPages) {
        let pagesHTML = '';
        const pageNumbers = this._getPageNumbers(totalPages);

        pageNumbers.forEach(page => {
            if (page === '...') {
                pagesHTML += `<span class="pagination-page ellipsis">...</span>`;
            } else {
                const activeClass = page === this.currentPage ? 'active' : '';
                pagesHTML += `<button class="pagination-page ${activeClass}" data-page="${page}">${page}</button>`;
            }
        });
        return pagesHTML;
    }

    /**
     * Attaches event listeners to all pagination buttons.
     */
    _attachEventListeners(totalPages) {
        // NEW listeners for first/last page buttons
        document.getElementById('firstPageBtn')?.addEventListener('click', () => this.firstPage());
        document.getElementById('prevPageBtn')?.addEventListener('click', () => this.prevPage());
        document.getElementById('nextPageBtn')?.addEventListener('click', () => this.nextPage());
        document.getElementById('lastPageBtn')?.addEventListener('click', () => this.lastPage());

        document.getElementById('itemsPerPage')?.addEventListener('change', (e) => {
            this.rowsPerPage = parseInt(e.target.value, 10);
            this.reset();
        });

        this.paginationContainer.querySelectorAll('.pagination-page[data-page]').forEach(button => {
            button.addEventListener('click', (e) => {
                const pageNum = parseInt(e.target.getAttribute('data-page'), 10);
                this.goToPage(pageNum);
            });
        });
    }

    /**
     * Navigation methods
     */
    firstPage() {
        this.goToPage(1);
    }

    prevPage() {
        if (this.currentPage > 1) {
            this.goToPage(this.currentPage - 1);
        }
    }

    nextPage() {
        const totalPages = Math.ceil(this.dataManager.getCurrentData().length / this.rowsPerPage);
        if (this.currentPage < totalPages) {
            this.goToPage(this.currentPage + 1);
        }
    }

    lastPage() {
        const totalPages = Math.ceil(this.dataManager.getCurrentData().length / this.rowsPerPage);
        this.goToPage(totalPages);
    }

    goToPage(pageNum) {
        const totalPages = Math.ceil(this.dataManager.getCurrentData().length / this.rowsPerPage);
        if (pageNum >= 1 && pageNum <= totalPages) {
            this.currentPage = pageNum;
            this.updateTable();
        }
    }

    /**
     * Resets to the first page.
     */
    reset() {
        this.currentPage = 1;
        this.updateTable();
    }

    /**
     * Helper to generate the array of page numbers and ellipses.
     */
    _getPageNumbers(totalPages) {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const sideWidth = 1; // How many numbers to show on each side of the current page
        const pageNumbers = [];

        // Always show the first page
        pageNumbers.push(1);

        // Logic for left ellipsis
        if (this.currentPage > sideWidth + 2) {
            pageNumbers.push('...');
        }

        // Numbers around the current page
        for (let i = this.currentPage - sideWidth; i <= this.currentPage + sideWidth; i++) {
            if (i > 1 && i < totalPages) {
                pageNumbers.push(i);
            }
        }

        // Logic for right ellipsis
        if (this.currentPage < totalPages - sideWidth - 1) {
            pageNumbers.push('...');
        }

        // Always show the last page
        pageNumbers.push(totalPages);

        // Remove duplicates that can occur at edges
        return [...new Set(pageNumbers)];
    }
}