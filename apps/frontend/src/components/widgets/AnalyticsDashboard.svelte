<script lang="ts">
  let { style }: { style?: string } = $props();
</script>

<div class="analytics-widget" {style}>
  <div class="analytics-header">
    <h3 class="analytics-title">Site Overview</h3>
    <span class="analytics-period">Last 7 days</span>
  </div>

  <div class="metrics-grid">
    <div class="metric-card">
      <span class="metric-label">Visitors</span>
      <span class="metric-value">12,847</span>
      <span class="metric-trend trend-up">&#9650; 14.2%</span>
    </div>
    <div class="metric-card">
      <span class="metric-label">Page Views</span>
      <span class="metric-value">38,204</span>
      <span class="metric-trend trend-up">&#9650; 8.7%</span>
    </div>
    <div class="metric-card">
      <span class="metric-label">Bounce Rate</span>
      <span class="metric-value">42.3%</span>
      <span class="metric-trend trend-down">&#9660; 3.1%</span>
    </div>
    <div class="metric-card">
      <span class="metric-label">Avg. Duration</span>
      <span class="metric-value">2m 18s</span>
      <span class="metric-trend trend-up">&#9650; 5.4%</span>
    </div>
  </div>

  <div class="chart-section">
    <span class="chart-label">Daily visitors</span>
    <div class="chart-bars">
      <div class="chart-col">
        <div class="chart-bar" style="height: 45%"></div>
        <span class="chart-day">Mon</span>
      </div>
      <div class="chart-col">
        <div class="chart-bar" style="height: 62%"></div>
        <span class="chart-day">Tue</span>
      </div>
      <div class="chart-col">
        <div class="chart-bar" style="height: 78%"></div>
        <span class="chart-day">Wed</span>
      </div>
      <div class="chart-col">
        <div class="chart-bar" style="height: 55%"></div>
        <span class="chart-day">Thu</span>
      </div>
      <div class="chart-col">
        <div class="chart-bar" style="height: 90%"></div>
        <span class="chart-day">Fri</span>
      </div>
      <div class="chart-col">
        <div class="chart-bar" style="height: 70%"></div>
        <span class="chart-day">Sat</span>
      </div>
      <div class="chart-col">
        <div class="chart-bar chart-bar-current" style="height: 38%"></div>
        <span class="chart-day">Sun</span>
      </div>
    </div>
  </div>

  <div class="top-pages">
    <span class="section-label">Top Pages</span>
    <div class="page-row">
      <span class="page-name">/home</span>
      <div class="page-bar-track">
        <div class="page-bar-fill" style="width: 85%"></div>
      </div>
      <span class="page-count">4,210</span>
    </div>
    <div class="page-row">
      <span class="page-name">/pricing</span>
      <div class="page-bar-track">
        <div class="page-bar-fill" style="width: 58%"></div>
      </div>
      <span class="page-count">2,870</span>
    </div>
    <div class="page-row">
      <span class="page-name">/blog</span>
      <div class="page-bar-track">
        <div class="page-bar-fill" style="width: 41%"></div>
      </div>
      <span class="page-count">2,030</span>
    </div>
  </div>

  <a href="#details" class="details-link">View full report</a>
</div>

<style>
  .analytics-widget {
    background: var(--color-background, #fff);
    border: 1px solid var(--color-border, var(--color-muted, var(--color-text)));
    border-radius: 12px;
    padding: 20px 24px;
    font-family: system-ui, sans-serif;
    color: var(--color-text);
  }

  .analytics-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 16px;
  }

  .analytics-title {
    font-size: 16px;
    font-weight: 700;
    margin: 0;
  }

  .analytics-period {
    font-size: 12px;
    color: var(--color-muted, var(--color-text));
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 20px;
  }

  .metric-card {
    background: var(--color-surface, var(--color-background, #fff));
    border: 1px solid var(--color-border, var(--color-muted, var(--color-text)));
    border-radius: 8px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .metric-label {
    font-size: 11px;
    color: var(--color-muted, var(--color-text));
    font-weight: 500;
  }

  .metric-value {
    font-size: 20px;
    font-weight: 700;
  }

  .metric-trend {
    font-size: 11px;
    font-weight: 600;
  }

  .trend-up {
    color: var(--color-primary);
  }

  .trend-down {
    color: var(--color-danger);
  }

  .chart-section {
    margin-bottom: 20px;
  }

  .chart-label,
  .section-label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: var(--color-muted, var(--color-text));
    margin-bottom: 10px;
  }

  .chart-bars {
    display: flex;
    align-items: flex-end;
    gap: 6px;
    height: 80px;
  }

  .chart-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
    justify-content: flex-end;
  }

  .chart-bar {
    width: 100%;
    background: var(--color-primary);
    border-radius: 4px 4px 0 0;
  }

  .chart-bar-current {
    background: var(--color-primary-variant, var(--color-primary));
    opacity: 0.5;
  }

  .chart-day {
    font-size: 10px;
    color: var(--color-muted, var(--color-text));
    margin-top: 4px;
  }

  .top-pages {
    margin-bottom: 16px;
  }

  .page-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }

  .page-name {
    font-size: 12px;
    font-weight: 500;
    width: 65px;
    flex-shrink: 0;
  }

  .page-bar-track {
    flex: 1;
    height: 6px;
    background: var(--color-surface, var(--color-background, #fff));
    border: 1px solid var(--color-border, var(--color-muted, var(--color-text)));
    border-radius: 3px;
    overflow: hidden;
  }

  .page-bar-fill {
    height: 100%;
    background: var(--color-primary);
    border-radius: 3px;
  }

  .page-count {
    font-size: 11px;
    color: var(--color-muted, var(--color-text));
    width: 40px;
    text-align: right;
    flex-shrink: 0;
  }

  .details-link {
    display: block;
    text-align: center;
    font-size: 13px;
    font-weight: 600;
    color: var(--color-link, var(--color-primary));
    text-decoration: none;
  }

  .details-link:hover {
    color: var(--color-link-variant, var(--color-link, var(--color-primary)));
    text-decoration: underline;
  }
</style>
