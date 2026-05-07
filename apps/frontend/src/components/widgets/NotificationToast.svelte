<script lang="ts">
  let { style }: { style?: string } = $props();
</script>

<div class="toast-stack" {style}>
  <div class="toast toast-success">
    <div class="toast-icon">&#10003;</div>
    <div class="toast-content">
      <span class="toast-title">Success</span>
      <span class="toast-message">Your changes have been saved.</span>
    </div>
    <button class="toast-dismiss">&times;</button>
  </div>

  <div class="toast toast-error">
    <div class="toast-icon">!</div>
    <div class="toast-content">
      <span class="toast-title">Error</span>
      <span class="toast-message">Something went wrong. Please try again.</span>
    </div>
    <button class="toast-dismiss">&times;</button>
  </div>

  <div class="toast toast-info">
    <div class="toast-icon">i</div>
    <div class="toast-content">
      <span class="toast-title">Info</span>
      <span class="toast-message">A new version is available.</span>
    </div>
    <button class="toast-dismiss">&times;</button>
  </div>
</div>

<style>
  .toast-stack {
    display: flex;
    flex-direction: column;
    gap: 10px;
    font-family: system-ui, sans-serif;
  }

  .toast {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 14px 16px;
    border-radius: 10px;
    border: 1px solid var(--color-border, var(--color-muted, var(--color-text)));
    background: var(--color-surface, var(--color-background, #fff));
    color: var(--color-text);
  }

  .toast-icon {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
    flex-shrink: 0;
  }

  .toast-success .toast-icon {
    background: var(--color-primary);
    color: var(--color-background, #fff);
  }

  .toast-error .toast-icon {
    background: var(--color-danger);
    color: var(--color-background, #fff);
  }

  .toast-info .toast-icon {
    background: var(--color-primary-variant, var(--color-primary));
    color: var(--color-background, #fff);
  }

  .toast-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .toast-title {
    font-size: 13px;
    font-weight: 600;
  }

  .toast-success .toast-title {
    color: var(--color-primary);
  }

  .toast-error .toast-title {
    color: var(--color-danger);
  }

  .toast-info .toast-title {
    color: var(--color-primary-variant, var(--color-primary));
  }

  .toast-message {
    font-size: 12px;
    color: var(--color-muted, var(--color-text));
    line-height: 1.4;
  }

  .toast-dismiss {
    background: none;
    border: none;
    font-size: 18px;
    color: var(--color-muted, var(--color-text));
    cursor: pointer;
    padding: 0;
    line-height: 1;
    flex-shrink: 0;
  }

  .toast-dismiss:hover {
    color: var(--color-danger-variant, var(--color-danger));
  }
</style>
