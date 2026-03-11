<script lang="ts">
  let { style }: { style?: string } = $props();
</script>

<div class="comment-widget" {style}>
  <div class="comment-header">
    <h3 class="comment-count">3 Comments</h3>
  </div>

  <div class="comments-list">
    <div class="comment">
      <div class="comment-avatar">A</div>
      <div class="comment-body">
        <div class="comment-meta">
          <span class="comment-author">Alice</span>
          <span class="comment-time">2 hours ago</span>
        </div>
        <p class="comment-text">
          Great article! Really helped me understand the topic better.
        </p>
        <div class="comment-actions">
          <a href="#reply" class="action-link">Reply</a>
          <a href="#like" class="action-link">Like (4)</a>
        </div>
      </div>
    </div>

    <div class="comment reply">
      <div class="comment-avatar">B</div>
      <div class="comment-body">
        <div class="comment-meta">
          <span class="comment-author">Bob</span>
          <span class="comment-time">1 hour ago</span>
        </div>
        <p class="comment-text">Agreed, the examples were especially clear.</p>
        <div class="comment-actions">
          <a href="#reply" class="action-link">Reply</a>
          <a href="#like" class="action-link">Like (1)</a>
        </div>
      </div>
    </div>

    <div class="comment">
      <div class="comment-avatar">C</div>
      <div class="comment-body">
        <div class="comment-meta">
          <span class="comment-author">Charlie</span>
          <span class="comment-time">45 min ago</span>
        </div>
        <p class="comment-text">Would love to see a follow-up on this.</p>
        <div class="comment-actions">
          <a href="#reply" class="action-link">Reply</a>
          <a href="#like" class="action-link">Like (2)</a>
        </div>
      </div>
    </div>
  </div>

  <div class="add-comment">
    <textarea class="comment-input" rows="3" placeholder="Add a comment..."
    ></textarea>
    <button class="post-btn">Post Comment</button>
  </div>
</div>

<style>
  .comment-widget {
    background: var(--color-background, #fff);
    border: 1px solid var(--color-border, var(--color-muted, var(--color-text)));
    border-radius: 12px;
    padding: 20px 24px;
    font-family: system-ui, sans-serif;
    color: var(--color-text);
  }

  .comment-header {
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid
      var(--color-border, var(--color-muted, var(--color-text)));
  }

  .comment-count {
    font-size: 15px;
    font-weight: 700;
    margin: 0;
  }

  .comments-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 20px;
  }

  .comment {
    display: flex;
    gap: 10px;
  }

  .comment.reply {
    margin-left: 32px;
  }

  .comment-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--color-primary);
    color: var(--color-background, #fff);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
    flex-shrink: 0;
  }

  .comment-body {
    flex: 1;
    min-width: 0;
  }

  .comment-meta {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 4px;
  }

  .comment-author {
    font-size: 13px;
    font-weight: 600;
  }

  .comment-time {
    font-size: 11px;
    color: var(--color-muted, var(--color-text));
  }

  .comment-text {
    font-size: 13px;
    line-height: 1.45;
    margin: 0 0 6px;
  }

  .comment-actions {
    display: flex;
    gap: 12px;
  }

  .action-link {
    font-size: 12px;
    font-weight: 500;
    color: var(--color-link, var(--color-primary));
    text-decoration: none;
    cursor: pointer;
  }

  .action-link:hover {
    color: var(--color-link-variant, var(--color-link, var(--color-primary)));
    text-decoration: underline;
  }

  .add-comment {
    border-top: 1px solid
      var(--color-border, var(--color-muted, var(--color-text)));
    padding-top: 16px;
  }

  .comment-input {
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
    margin-bottom: 10px;
  }

  .comment-input:focus {
    border-color: var(--color-ring, var(--color-primary));
    box-shadow: 0 0 0 2px
      color-mix(
        in srgb,
        var(--color-ring, var(--color-primary)) 25%,
        transparent
      );
  }

  .post-btn {
    background: var(--color-primary);
    color: var(--color-background, #fff);
    border: none;
    border-radius: 8px;
    padding: 10px 20px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }

  .post-btn:hover {
    background: var(--color-primary-variant, var(--color-primary));
  }
</style>
