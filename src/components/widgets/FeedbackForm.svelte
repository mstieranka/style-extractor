<script lang="ts">
  let { style }: { style?: string } = $props();
</script>

<div class="feedback-widget" {style}>
  <h3 class="feedback-title">How was your experience?</h3>
  <p class="feedback-subtitle">Your feedback helps us improve.</p>

  <div class="rating-row">
    <button class="rating-btn active">&#9733;</button>
    <button class="rating-btn active">&#9733;</button>
    <button class="rating-btn active">&#9733;</button>
    <button class="rating-btn">&#9733;</button>
    <button class="rating-btn">&#9733;</button>
  </div>

  <label class="field-label" for="feedback-comment">Comments (optional)</label>
  <textarea
    id="feedback-comment"
    class="comment-area"
    rows="3"
    placeholder="Tell us what you think..."
  ></textarea>

  <div class="feedback-actions">
    <button class="submit-btn">Submit Feedback</button>
    <button class="skip-btn">Skip</button>
  </div>

  <p class="feedback-note">
    By submitting, you agree to our <a href="#terms" class="note-link"
      >terms of service</a
    >.
  </p>
</div>

<style>
  .feedback-widget {
    background: var(--color-background, #fff);
    border: 1px solid var(--color-border, var(--color-muted, var(--color-text)));
    border-radius: 12px;
    padding: 24px;
    font-family: system-ui, sans-serif;
    color: var(--color-text);
  }

  .feedback-title {
    font-size: 16px;
    font-weight: 700;
    margin: 0 0 4px;
  }

  .feedback-subtitle {
    font-size: 13px;
    color: var(--color-muted, var(--color-text));
    margin: 0 0 16px;
  }

  .rating-row {
    display: flex;
    gap: 6px;
    margin-bottom: 16px;
  }

  .rating-btn {
    background: none;
    border: none;
    font-size: 28px;
    cursor: pointer;
    color: var(--color-border, var(--color-muted, var(--color-text)));
    padding: 0;
    line-height: 1;
  }

  .rating-btn.active {
    color: var(--color-primary);
  }

  .field-label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: var(--color-muted, var(--color-text));
    margin-bottom: 6px;
  }

  .comment-area {
    width: 100%;
    border: 1px solid var(--color-border, var(--color-muted, var(--color-text)));
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 13px;
    font-family: inherit;
    background: var(--color-surface, var(--color-background, #fff));
    color: var(--color-text);
    resize: vertical;
    outline: none;
    box-sizing: border-box;
  }

  .comment-area:focus {
    border-color: var(--color-ring, var(--color-primary));
    box-shadow: 0 0 0 2px
      color-mix(
        in srgb,
        var(--color-ring, var(--color-primary)) 25%,
        transparent
      );
  }

  .feedback-actions {
    display: flex;
    gap: 10px;
    margin-top: 16px;
  }

  .submit-btn {
    background: var(--color-primary);
    color: var(--color-background, #fff);
    border: none;
    border-radius: 8px;
    padding: 10px 20px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }

  .submit-btn:hover {
    background: var(--color-primary-variant, var(--color-primary));
  }

  .skip-btn {
    background: transparent;
    color: var(--color-muted, var(--color-text));
    border: 1px solid var(--color-border, var(--color-muted, var(--color-text)));
    border-radius: 8px;
    padding: 10px 20px;
    font-size: 13px;
    cursor: pointer;
  }

  .feedback-note {
    font-size: 11px;
    color: var(--color-muted, var(--color-text));
    margin: 12px 0 0;
  }

  .note-link {
    color: var(--color-link, var(--color-primary));
    text-decoration: underline;
  }

  .note-link:hover {
    color: var(--color-link-variant, var(--color-link, var(--color-primary)));
  }
</style>
