<script lang="ts">
  let { style }: { style?: string } = $props();
</script>

<div class="newsletter-widget" {style}>
  <div class="newsletter-icon">&#9993;</div>
  <h3 class="newsletter-title">Stay in the loop</h3>
  <p class="newsletter-desc">
    Get the latest updates delivered straight to your inbox. No spam,
    unsubscribe anytime.
  </p>

  <div class="newsletter-form">
    <input type="email" class="email-input" placeholder="you@example.com" />
    <button class="subscribe-btn">Subscribe</button>
  </div>

  <p class="privacy-note">
    By subscribing you agree to our
    <a href="#privacy" class="privacy-link">privacy policy</a>.
  </p>
</div>

<style>
  .newsletter-widget {
    background: var(--color-surface, var(--color-background, #fff));
    border: 1px solid var(--color-border, var(--color-muted, var(--color-text)));
    border-radius: 12px;
    padding: 28px 24px;
    font-family: system-ui, sans-serif;
    color: var(--color-text);
    text-align: center;
  }

  .newsletter-icon {
    font-size: 32px;
    margin-bottom: 8px;
    color: var(--color-primary);
  }

  .newsletter-title {
    font-size: 18px;
    font-weight: 700;
    margin: 0 0 8px;
  }

  .newsletter-desc {
    font-size: 13px;
    line-height: 1.5;
    color: var(--color-muted, var(--color-text));
    margin: 0 0 20px;
  }

  .newsletter-form {
    display: flex;
    gap: 8px;
  }

  .email-input {
    flex: 1;
    border: 1px solid var(--color-border, var(--color-muted, var(--color-text)));
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 13px;
    background: var(--color-background, #fff);
    color: var(--color-text);
    outline: none;
  }

  .email-input:focus {
    border-color: var(--color-ring, var(--color-primary));
    box-shadow: 0 0 0 2px
      color-mix(
        in srgb,
        var(--color-ring, var(--color-primary)) 25%,
        transparent
      );
  }

  .subscribe-btn {
    background: var(--color-primary);
    color: var(--color-background, #fff);
    border: none;
    border-radius: 8px;
    padding: 10px 20px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
  }

  .subscribe-btn:hover {
    background: var(--color-primary-variant, var(--color-primary));
  }

  .privacy-note {
    font-size: 11px;
    color: var(--color-muted, var(--color-text));
    margin: 14px 0 0;
  }

  .privacy-link {
    color: var(--color-link, var(--color-primary));
    text-decoration: underline;
  }

  .privacy-link:hover {
    color: var(--color-link-variant, var(--color-link, var(--color-primary)));
  }
</style>
