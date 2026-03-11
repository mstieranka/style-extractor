<script lang="ts">
  let { style }: { style?: string } = $props();
</script>

<div class="rating-widget" {style}>
  <div class="rating-overview">
    <div class="rating-score">
      <span class="score-number">4.3</span>
      <div class="score-stars">
        <span class="star filled">&#9733;</span>
        <span class="star filled">&#9733;</span>
        <span class="star filled">&#9733;</span>
        <span class="star filled">&#9733;</span>
        <span class="star">&#9733;</span>
      </div>
      <span class="score-count">Based on 284 reviews</span>
    </div>

    <div class="rating-bars">
      <div class="bar-row">
        <span class="bar-label">5</span>
        <div class="bar-track">
          <div class="bar-fill" style="width: 52%"></div>
        </div>
        <span class="bar-count">148</span>
      </div>
      <div class="bar-row">
        <span class="bar-label">4</span>
        <div class="bar-track">
          <div class="bar-fill" style="width: 28%"></div>
        </div>
        <span class="bar-count">79</span>
      </div>
      <div class="bar-row">
        <span class="bar-label">3</span>
        <div class="bar-track">
          <div class="bar-fill" style="width: 12%"></div>
        </div>
        <span class="bar-count">34</span>
      </div>
      <div class="bar-row">
        <span class="bar-label">2</span>
        <div class="bar-track">
          <div class="bar-fill" style="width: 5%"></div>
        </div>
        <span class="bar-count">14</span>
      </div>
      <div class="bar-row">
        <span class="bar-label">1</span>
        <div class="bar-track">
          <div class="bar-fill bar-fill-low" style="width: 3%"></div>
        </div>
        <span class="bar-count">9</span>
      </div>
    </div>
  </div>

  <div class="review-divider"></div>

  <div class="recent-review">
    <div class="review-header">
      <div class="review-stars">
        <span class="star filled">&#9733;</span>
        <span class="star filled">&#9733;</span>
        <span class="star filled">&#9733;</span>
        <span class="star filled">&#9733;</span>
        <span class="star filled">&#9733;</span>
      </div>
      <span class="review-date">2 days ago</span>
    </div>
    <p class="review-text">
      Excellent experience! Everything worked exactly as described and the
      support team was very responsive.
    </p>
    <span class="review-author">Verified Buyer</span>
  </div>

  <a href="#write" class="write-review-link">Write a Review</a>
</div>

<style>
  .rating-widget {
    background: var(--color-background, #fff);
    border: 1px solid var(--color-border, var(--color-muted, var(--color-text)));
    border-radius: 12px;
    padding: 20px 24px;
    font-family: system-ui, sans-serif;
    color: var(--color-text);
  }

  .rating-overview {
    display: flex;
    gap: 24px;
    align-items: flex-start;
  }

  .rating-score {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
  }

  .score-number {
    font-size: 36px;
    font-weight: 700;
    line-height: 1;
  }

  .score-stars {
    margin: 6px 0;
  }

  .star {
    font-size: 16px;
    color: var(--color-border, var(--color-muted, var(--color-text)));
  }

  .star.filled {
    color: var(--color-primary);
  }

  .score-count {
    font-size: 11px;
    color: var(--color-muted, var(--color-text));
    text-align: center;
  }

  .rating-bars {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .bar-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .bar-label {
    font-size: 12px;
    width: 12px;
    text-align: right;
    color: var(--color-muted, var(--color-text));
  }

  .bar-track {
    flex: 1;
    height: 8px;
    background: var(--color-surface, var(--color-background, #fff));
    border: 1px solid var(--color-border, var(--color-muted, var(--color-text)));
    border-radius: 4px;
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    background: var(--color-primary);
    border-radius: 4px;
  }

  .bar-fill-low {
    background: var(--color-danger);
  }

  .bar-count {
    font-size: 11px;
    color: var(--color-muted, var(--color-text));
    width: 28px;
    text-align: right;
  }

  .review-divider {
    height: 1px;
    background: var(--color-border, var(--color-muted, var(--color-text)));
    margin: 16px 0;
  }

  .recent-review {
    margin-bottom: 14px;
  }

  .review-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
  }

  .review-stars .star {
    font-size: 13px;
  }

  .review-date {
    font-size: 11px;
    color: var(--color-muted, var(--color-text));
  }

  .review-text {
    font-size: 13px;
    line-height: 1.45;
    margin: 0 0 6px;
  }

  .review-author {
    font-size: 11px;
    font-weight: 600;
    color: var(--color-primary);
  }

  .write-review-link {
    display: block;
    text-align: center;
    font-size: 13px;
    font-weight: 600;
    color: var(--color-link, var(--color-primary));
    text-decoration: none;
    padding: 10px;
    border: 1px solid var(--color-border, var(--color-muted, var(--color-text)));
    border-radius: 8px;
  }

  .write-review-link:hover {
    background: var(--color-surface, var(--color-background, #fff));
    color: var(--color-link-variant, var(--color-link, var(--color-primary)));
  }
</style>
