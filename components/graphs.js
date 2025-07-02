/**
 * Graphs Component
 * Handles SVG graph rendering for statistics
 */

class GraphsComponent {
    constructor() {
        this.colors = {
            primary: '#2563eb',
            secondary: '#64748b',
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            background: '#ffffff',
            grid: '#e2e8f0',
            text: '#64748b',
            auditGiven: '#3b82f6',      // blue for audits given
            auditReceived: '#f97316'    // orange for audits received
        };
    }

    /**
     * Render all graphs with profile data
     * @param {Object} profileData - Complete profile data
     */
    renderAllGraphs(profileData) {
        console.log('Rendering graphs with data:', profileData);
        
        try {
            this.renderXPProgressGraph(profileData.xp || []);
            this.renderAuditRatioGraph(profileData.audits || {});
        } catch (error) {
            console.error('Error rendering graphs:', error);
        }
    }

    /**
     * Render XP progress over time graph
     * @param {Array} xpData - XP transaction data
     */
    renderXPProgressGraph(xpData) {
        const container = document.getElementById('xp-progress-graph');
        if (!container) return;

        // Filter and process XP data
        const filteredXP = helpers.filterXPData(xpData);
        const cumulativeData = helpers.calculateCumulativeXP(filteredXP);

        if (cumulativeData.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No XP data available</p>';
            return;
        }

        // SVG dimensions
        const width = 500;
        const height = 300;
        const margin = { top: 20, right: 30, bottom: 50, left: 60 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        // Create SVG
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'graph-svg');
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');

        // Calculate scales
        const maxXP = Math.max(...cumulativeData.map(d => d.cumulativeXP));
        const minDate = new Date(Math.min(...cumulativeData.map(d => d.date)));
        const maxDate = new Date(Math.max(...cumulativeData.map(d => d.date)));
        const dateRange = maxDate - minDate;

        // Create background
        const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        background.setAttribute('width', width);
        background.setAttribute('height', height);
        background.setAttribute('fill', this.colors.background);
        svg.appendChild(background);

        // Create grid lines
        this.createGrid(svg, margin, chartWidth, chartHeight, 5, 4);

        // Create axes
        this.createAxes(svg, margin, chartWidth, chartHeight);

        // Create XP line
        const pathData = cumulativeData.map((d, i) => {
            const x = margin.left + (d.date - minDate) / dateRange * chartWidth;
            const y = margin.top + (1 - d.cumulativeXP / maxXP) * chartHeight;
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('class', 'graph-line');
        path.setAttribute('stroke', this.colors.primary);
        path.setAttribute('stroke-width', '3');
        path.setAttribute('fill', 'none');
        svg.appendChild(path);

        // Create area under curve
        const areaData = pathData + ` L ${margin.left + chartWidth} ${margin.top + chartHeight} L ${margin.left} ${margin.top + chartHeight} Z`;
        const area = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        area.setAttribute('d', areaData);
        area.setAttribute('class', 'graph-area');
        area.setAttribute('fill', this.colors.primary);
        area.setAttribute('fill-opacity', '0.1');
        svg.appendChild(area);

        // Create data points
        cumulativeData.forEach((d, i) => {
            const x = margin.left + (d.date - minDate) / dateRange * chartWidth;
            const y = margin.top + (1 - d.cumulativeXP / maxXP) * chartHeight;

            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y);
            circle.setAttribute('r', '4');
            circle.setAttribute('class', 'graph-point');
            circle.setAttribute('fill', this.colors.primary);
            circle.setAttribute('stroke', this.colors.background);
            circle.setAttribute('stroke-width', '2');
            
            // Add tooltip
            circle.addEventListener('mouseenter', (e) => {
                this.showTooltip(e, `${graphqlService.formatXPAmount(d.cumulativeXP)}<br>${helpers.formatDateShort(d.date)}`);
            });
            circle.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });

            svg.appendChild(circle);
        });

        // Add labels
        this.addAxisLabels(svg, width, height, margin, 'Date', 'Cumulative XP');

        // Add value labels on axes
        this.addXPAxisValues(svg, margin, chartWidth, chartHeight, maxXP, minDate, maxDate);

        container.innerHTML = '';
        container.appendChild(svg);
    }

    /**
     * Render audit ratio graph (pie chart)
     * @param {Object} auditData - Audit data
     */
    renderAuditRatioGraph(auditData) {
        const container = document.getElementById('success-rate-graph');
        if (!container) return;

        if (!auditData || (auditData.auditsGiven === 0 && auditData.auditsReceived === 0)) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No audit data available</p>';
            return;
        }

        // SVG dimensions
        const width = 400;
        const height = 300;
        const radius = Math.min(width, height) / 2 - 40;
        const centerX = width / 2;
        const centerY = height / 2;

        // Create SVG
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'graph-svg');
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');

        // Create background
        const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        background.setAttribute('width', width);
        background.setAttribute('height', height);
        background.setAttribute('fill', this.colors.background);
        svg.appendChild(background);

        // Calculate angles for audit data
        const totalAudits = auditData.auditsGiven + auditData.auditsReceived;
        const givenAngle = (auditData.auditsGiven / totalAudits) * 2 * Math.PI;
        const receivedAngle = (auditData.auditsReceived / totalAudits) * 2 * Math.PI;

        // Create pie slices
        if (auditData.auditsGiven > 0) {
            const givenPath = this.createPieSlice(centerX, centerY, radius, 0, givenAngle);
            const givenSlice = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            givenSlice.setAttribute('d', givenPath);
            givenSlice.setAttribute('fill', this.colors.auditGiven);
            givenSlice.setAttribute('stroke', this.colors.background);
            givenSlice.setAttribute('stroke-width', '2');
            givenSlice.setAttribute('class', 'graph-pie-slice');

            givenSlice.addEventListener('mouseenter', (e) => {
                const givenFormatted = window.graphqlService ? window.graphqlService.formatXPAmount(auditData.auditsGiven) : auditData.auditsGiven;
                this.showTooltip(e, `Audits Given: ${givenFormatted}<br>${((auditData.auditsGiven/totalAudits)*100).toFixed(1)}%`);
            });
            givenSlice.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });

            svg.appendChild(givenSlice);
        }

        if (auditData.auditsReceived > 0) {
            const receivedPath = this.createPieSlice(centerX, centerY, radius, givenAngle, givenAngle + receivedAngle);
            const receivedSlice = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            receivedSlice.setAttribute('d', receivedPath);
            receivedSlice.setAttribute('fill', this.colors.auditReceived);
            receivedSlice.setAttribute('stroke', this.colors.background);
            receivedSlice.setAttribute('stroke-width', '2');
            receivedSlice.setAttribute('class', 'graph-pie-slice');

            receivedSlice.addEventListener('mouseenter', (e) => {
                const receivedFormatted = window.graphqlService ? window.graphqlService.formatXPAmount(auditData.auditsReceived) : auditData.auditsReceived;
                this.showTooltip(e, `Audits Received: ${receivedFormatted}<br>${((auditData.auditsReceived/totalAudits)*100).toFixed(1)}%`);
            });
            receivedSlice.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });

            svg.appendChild(receivedSlice);
        }

        // Add center text
        const centerText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        centerText.setAttribute('x', centerX);
        centerText.setAttribute('y', centerY - 10);
        centerText.setAttribute('text-anchor', 'middle');
        centerText.setAttribute('font-size', '24');
        centerText.setAttribute('font-weight', 'bold');
        centerText.setAttribute('fill', '#000000');
        centerText.textContent = auditData.auditRatio.toFixed(2);
        svg.appendChild(centerText);

        const centerSubtext = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        centerSubtext.setAttribute('x', centerX);
        centerSubtext.setAttribute('y', centerY + 15);
        centerSubtext.setAttribute('text-anchor', 'middle');
        centerSubtext.setAttribute('font-size', '12');
        centerSubtext.setAttribute('fill', '#000000');
        centerSubtext.textContent = 'Audit Ratio';
        svg.appendChild(centerSubtext);

        container.innerHTML = '';
        container.appendChild(svg);

        // Add legend
        this.addAuditRatioLegend(container, auditData);
    }

    /**
     * Create pie slice path
     * @param {number} centerX - Center X coordinate
     * @param {number} centerY - Center Y coordinate
     * @param {number} radius - Radius
     * @param {number} startAngle - Start angle in radians
     * @param {number} endAngle - End angle in radians
     * @returns {string} SVG path data
     */
    createPieSlice(centerX, centerY, radius, startAngle, endAngle) {
        const x1 = centerX + radius * Math.cos(startAngle - Math.PI / 2);
        const y1 = centerY + radius * Math.sin(startAngle - Math.PI / 2);
        const x2 = centerX + radius * Math.cos(endAngle - Math.PI / 2);
        const y2 = centerY + radius * Math.sin(endAngle - Math.PI / 2);
        
        const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;
        
        return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
    }

    /**
     * Create grid lines
     */
    createGrid(svg, margin, chartWidth, chartHeight, xLines, yLines) {
        // Vertical grid lines
        for (let i = 0; i <= xLines; i++) {
            const x = margin.left + (i / xLines) * chartWidth;
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x);
            line.setAttribute('y1', margin.top);
            line.setAttribute('x2', x);
            line.setAttribute('y2', margin.top + chartHeight);
            line.setAttribute('stroke', this.colors.grid);
            line.setAttribute('stroke-width', '1');
            svg.appendChild(line);
        }

        // Horizontal grid lines
        for (let i = 0; i <= yLines; i++) {
            const y = margin.top + (i / yLines) * chartHeight;
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', margin.left);
            line.setAttribute('y1', y);
            line.setAttribute('x2', margin.left + chartWidth);
            line.setAttribute('y2', y);
            line.setAttribute('stroke', this.colors.grid);
            line.setAttribute('stroke-width', '1');
            svg.appendChild(line);
        }
    }

    /**
     * Create axes
     */
    createAxes(svg, margin, chartWidth, chartHeight) {
        // X axis
        const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        xAxis.setAttribute('x1', margin.left);
        xAxis.setAttribute('y1', margin.top + chartHeight);
        xAxis.setAttribute('x2', margin.left + chartWidth);
        xAxis.setAttribute('y2', margin.top + chartHeight);
        xAxis.setAttribute('stroke', this.colors.text);
        xAxis.setAttribute('stroke-width', '2');
        svg.appendChild(xAxis);

        // Y axis
        const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        yAxis.setAttribute('x1', margin.left);
        yAxis.setAttribute('y1', margin.top);
        yAxis.setAttribute('x2', margin.left);
        yAxis.setAttribute('y2', margin.top + chartHeight);
        yAxis.setAttribute('stroke', this.colors.text);
        yAxis.setAttribute('stroke-width', '2');
        svg.appendChild(yAxis);
    }

    /**
     * Add axis labels
     */
    addAxisLabels(svg, width, height, margin, xLabel, yLabel) {
        // X axis label
        const xLabelEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        xLabelEl.setAttribute('x', width / 2);
        xLabelEl.setAttribute('y', height - 10);
        xLabelEl.setAttribute('text-anchor', 'middle');
        xLabelEl.setAttribute('font-size', '12');
        xLabelEl.setAttribute('fill', this.colors.text);
        xLabelEl.textContent = xLabel;
        svg.appendChild(xLabelEl);

        // Y axis label
        const yLabelEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        yLabelEl.setAttribute('x', 15);
        yLabelEl.setAttribute('y', height / 2);
        yLabelEl.setAttribute('text-anchor', 'middle');
        yLabelEl.setAttribute('font-size', '12');
        yLabelEl.setAttribute('fill', this.colors.text);
        yLabelEl.setAttribute('transform', `rotate(-90, 15, ${height / 2})`);
        yLabelEl.textContent = yLabel;
        svg.appendChild(yLabelEl);
    }

    /**
     * Add axis values for XP graph
     */
    addXPAxisValues(svg, margin, chartWidth, chartHeight, maxXP, minDate, maxDate) {
        // Y axis values (XP)
        for (let i = 0; i <= 4; i++) {
            const value = (maxXP / 4) * i;
            const y = margin.top + chartHeight - (i / 4) * chartHeight;
            
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', margin.left - 10);
            text.setAttribute('y', y + 4);
            text.setAttribute('text-anchor', 'end');
            text.setAttribute('font-size', '10');
            text.setAttribute('fill', this.colors.text);
            text.textContent = graphqlService.formatXPAmount(Math.round(value));
            svg.appendChild(text);
        }

        // X axis values (dates)
        const dateRange = maxDate - minDate;
        for (let i = 0; i <= 3; i++) {
            const date = new Date(minDate.getTime() + (dateRange / 3) * i);
            const x = margin.left + (i / 3) * chartWidth;
            
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', x);
            text.setAttribute('y', margin.top + chartHeight + 20);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-size', '10');
            text.setAttribute('fill', this.colors.text);
            text.textContent = helpers.formatDateShort(date);
            svg.appendChild(text);
        }
    }

    /**
     * Add legend for audit ratio chart
     */
    addAuditRatioLegend(container, auditData) {
        const legend = document.createElement('div');
        legend.className = 'graph-legend';

        // Format XP amounts for display
        const givenFormatted = window.graphqlService ? window.graphqlService.formatXPAmount(auditData.auditsGiven) : auditData.auditsGiven;
        const receivedFormatted = window.graphqlService ? window.graphqlService.formatXPAmount(auditData.auditsReceived) : auditData.auditsReceived;

        legend.innerHTML = `
            <div class="legend-item">
                <div class="legend-color" style="background-color: ${this.colors.auditGiven}"></div>
                <span>Given (${givenFormatted})</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background-color: ${this.colors.auditReceived}"></div>
                <span>Received (${receivedFormatted})</span>
            </div>
        `;

        container.appendChild(legend);
    }

    /**
     * Show tooltip
     */
    showTooltip(event, content) {
        let tooltip = document.getElementById('graph-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'graph-tooltip';
            tooltip.className = 'graph-tooltip';
            document.body.appendChild(tooltip);
        }
        
        tooltip.innerHTML = content;
        tooltip.style.left = event.pageX + 10 + 'px';
        tooltip.style.top = event.pageY - 10 + 'px';
        tooltip.classList.add('visible');
    }

    /**
     * Hide tooltip
     */
    hideTooltip() {
        const tooltip = document.getElementById('graph-tooltip');
        if (tooltip) {
            tooltip.classList.remove('visible');
        }
    }
}

// Create global instance
const graphsComponent = new GraphsComponent();
window.graphsComponent = graphsComponent;
