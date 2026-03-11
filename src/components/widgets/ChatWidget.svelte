<script lang="ts">
  let { style }: { style?: string } = $props();
</script>

<div class="chat-widget" {style}>
  <div class="chat-header">
    <div class="agent-avatar">S</div>
    <div class="agent-info">
      <span class="agent-name">Support</span>
      <span class="agent-status">Online</span>
    </div>
  </div>

  <div class="chat-messages">
    <div class="message received">
      <div class="bubble">Hi there! How can we help you today?</div>
      <span class="timestamp">10:32 AM</span>
    </div>
    <div class="message sent">
      <div class="bubble">I have a question about my account.</div>
      <span class="timestamp">10:33 AM</span>
    </div>
    <div class="message received">
      <div class="bubble">
        Of course! I'd be happy to help. Could you share a few more details?
      </div>
      <span class="timestamp">10:33 AM</span>
    </div>
  </div>

  <div class="chat-input">
    <input type="text" placeholder="Type a message..." />
    <button class="send-btn">Send</button>
  </div>
</div>

<style>
  .chat-widget {
    background: var(--color-background, #fff);
    border: 1px solid var(--color-border, var(--color-muted, var(--color-text)));
    border-radius: 12px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    font-family: system-ui, sans-serif;
    color: var(--color-text);
  }

  .chat-header {
    background: var(--color-primary);
    color: var(--color-background, #fff);
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .agent-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--color-primary-variant, var(--color-primary));
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 14px;
  }

  .agent-info {
    display: flex;
    flex-direction: column;
  }

  .agent-name {
    font-weight: 600;
    font-size: 14px;
  }

  .agent-status {
    font-size: 11px;
    opacity: 0.85;
  }

  .chat-messages {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: var(--color-surface, var(--color-background, #fff));
  }

  .message {
    display: flex;
    flex-direction: column;
    max-width: 80%;
  }

  .message.sent {
    align-self: flex-end;
  }

  .message.received {
    align-self: flex-start;
  }

  .bubble {
    padding: 10px 14px;
    border-radius: 12px;
    font-size: 13px;
    line-height: 1.45;
  }

  .message.received .bubble {
    background: var(--color-background, #fff);
    border: 1px solid var(--color-border, var(--color-muted, var(--color-text)));
    color: var(--color-text);
  }

  .message.sent .bubble {
    background: var(--color-primary);
    color: var(--color-background, #fff);
  }

  .timestamp {
    font-size: 10px;
    color: var(--color-muted, var(--color-text));
    margin-top: 4px;
    padding: 0 4px;
  }

  .message.sent .timestamp {
    text-align: right;
  }

  .chat-input {
    display: flex;
    border-top: 1px solid
      var(--color-border, var(--color-muted, var(--color-text)));
    padding: 10px;
    gap: 8px;
    background: var(--color-background, #fff);
  }

  .chat-input input {
    flex: 1;
    border: 1px solid var(--color-border, var(--color-muted, var(--color-text)));
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 13px;
    background: var(--color-surface, var(--color-background, #fff));
    color: var(--color-text);
    outline: none;
  }

  .chat-input input:focus {
    border-color: var(--color-ring, var(--color-primary));
    box-shadow: 0 0 0 2px
      color-mix(
        in srgb,
        var(--color-ring, var(--color-primary)) 25%,
        transparent
      );
  }

  .send-btn {
    background: var(--color-primary);
    color: var(--color-background, #fff);
    border: none;
    border-radius: 8px;
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }

  .send-btn:hover {
    background: var(--color-primary-variant, var(--color-primary));
  }
</style>
