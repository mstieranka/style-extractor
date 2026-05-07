<script lang="ts">
  let { style }: { style?: string } = $props();
</script>

<div class="share-widget" {style}>
  <h3 class="share-title">Share this page</h3>

  <div class="share-buttons">
    <button class="share-btn" aria-label="Share on platform 1">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"
        ><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle
          cx="18"
          cy="19"
          r="3"
        /><line
          x1="8.59"
          y1="13.51"
          x2="15.42"
          y2="17.49"
          stroke="currentColor"
          stroke-width="1.5"
        /><line
          x1="15.41"
          y1="6.51"
          x2="8.59"
          y2="10.49"
          stroke="currentColor"
          stroke-width="1.5"
        /></svg
      >
    </button>
    <button class="share-btn" aria-label="Share on platform 2">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"
        ><path
          d="M23 3a10.9 10.9 0 01-3.14 1.53A4.48 4.48 0 0012 7.5v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"
        /></svg
      >
    </button>
    <button class="share-btn" aria-label="Share on platform 3">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"
        ><path
          d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z"
        /><polyline
          points="22,6 12,13 2,6"
          fill="none"
          stroke="var(--color-background, #fff)"
          stroke-width="1.5"
        /></svg
      >
    </button>
    <button class="share-btn" aria-label="Share on platform 4">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"
        ><path
          d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"
        /><circle cx="4" cy="4" r="2" /></svg
      >
    </button>
  </div>

  <div class="share-count">
    <span class="count-number">1,247</span>
    <span class="count-label">shares</span>
  </div>

  <div class="copy-link">
    <input
      type="text"
      class="link-input"
      value="https://example.com/page"
      readonly
    />
    <button class="copy-btn">Copy</button>
  </div>
</div>

<style>
  .share-widget {
    background: var(--color-background, #fff);
    border: 1px solid var(--color-border, var(--color-muted, var(--color-text)));
    border-radius: 12px;
    padding: 20px 24px;
    font-family: system-ui, sans-serif;
    color: var(--color-text);
  }

  .share-title {
    font-size: 15px;
    font-weight: 700;
    margin: 0 0 14px;
  }

  .share-buttons {
    display: flex;
    gap: 8px;
    margin-bottom: 14px;
  }

  .share-btn {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    border: 1px solid var(--color-border, var(--color-muted, var(--color-text)));
    background: var(--color-surface, var(--color-background, #fff));
    color: var(--color-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .share-btn:hover {
    background: var(--color-primary);
    color: var(--color-background, #fff);
    border-color: var(--color-primary);
  }

  .share-count {
    display: flex;
    align-items: baseline;
    gap: 6px;
    margin-bottom: 14px;
    padding-bottom: 14px;
    border-bottom: 1px solid
      var(--color-border, var(--color-muted, var(--color-text)));
  }

  .count-number {
    font-size: 20px;
    font-weight: 700;
    color: var(--color-primary);
  }

  .count-label {
    font-size: 13px;
    color: var(--color-muted, var(--color-text));
  }

  .copy-link {
    display: flex;
    gap: 8px;
  }

  .link-input {
    flex: 1;
    border: 1px solid var(--color-border, var(--color-muted, var(--color-text)));
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 12px;
    background: var(--color-surface, var(--color-background, #fff));
    color: var(--color-muted, var(--color-text));
    outline: none;
  }

  .copy-btn {
    background: var(--color-primary);
    color: var(--color-background, #fff);
    border: none;
    border-radius: 8px;
    padding: 8px 16px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }

  .copy-btn:hover {
    background: var(--color-primary-variant, var(--color-primary));
  }
</style>
