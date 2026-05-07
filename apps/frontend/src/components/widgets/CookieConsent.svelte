<script lang="ts">
  let { style }: { style?: string } = $props();
</script>

<div class="cookie-banner" {style}>
  <div class="cookie-content">
    <p class="cookie-title">We value your privacy</p>
    <p class="cookie-text">
      We use cookies to enhance your browsing experience, serve personalised
      content, and analyse our traffic. By clicking "Accept All", you consent to
      our use of cookies.
    </p>
  </div>
  <div class="cookie-actions">
    <button class="btn-accept">Accept All</button>
    <button class="btn-reject">Reject All</button>
    <a href="#preferences" class="manage-link">Manage Preferences</a>
  </div>
</div>

<style>
  .cookie-banner {
    background: var(--color-surface, var(--color-background, #fff));
    border: 1px solid var(--color-border, var(--color-muted, var(--color-text)));
    border-radius: 12px;
    padding: 20px 24px;
    font-family: system-ui, sans-serif;
    color: var(--color-text);
  }

  .cookie-title {
    font-size: 16px;
    font-weight: 700;
    margin: 0 0 8px;
  }

  .cookie-text {
    font-size: 13px;
    line-height: 1.5;
    color: var(--color-muted, var(--color-text));
    margin: 0 0 16px;
  }

  .cookie-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .btn-accept {
    background: var(--color-primary);
    color: var(--color-background, #fff);
    border: none;
    border-radius: 8px;
    padding: 10px 20px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }

  .btn-accept:hover {
    background: var(--color-primary-variant, var(--color-primary));
  }

  .btn-reject {
    background: transparent;
    color: var(--color-text);
    border: 1px solid var(--color-border, var(--color-muted, var(--color-text)));
    border-radius: 8px;
    padding: 10px 20px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }

  .btn-reject:hover {
    background: var(--color-surface, var(--color-background, #fff));
  }

  .manage-link {
    font-size: 13px;
    color: var(--color-link, var(--color-primary));
    text-decoration: underline;
    cursor: pointer;
    margin-left: auto;
  }

  .manage-link:hover {
    color: var(--color-link-variant, var(--color-link, var(--color-primary)));
  }
</style>
