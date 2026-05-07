<script lang="ts">
  let { style }: { style?: string } = $props();
</script>

<div class="player-widget" {style}>
  <div class="player-display">
    <div class="play-icon">&#9654;</div>
  </div>

  <div class="player-info">
    <span class="player-title">Episode 12: Design Systems at Scale</span>
    <span class="player-subtitle">The Design Podcast</span>
  </div>

  <div class="progress-section">
    <div class="progress-bar">
      <div class="progress-fill"></div>
    </div>
    <div class="time-labels">
      <span class="time-current">12:34</span>
      <span class="time-total">38:20</span>
    </div>
  </div>

  <div class="player-controls">
    <button class="control-btn">&#9664;&#9664;</button>
    <button class="control-btn play-btn">&#9654;</button>
    <button class="control-btn">&#9654;&#9654;</button>
    <div class="volume-group">
      <button class="control-btn volume-btn">&#128266;</button>
      <div class="volume-bar">
        <div class="volume-fill"></div>
      </div>
    </div>
  </div>
</div>

<style>
  .player-widget {
    background: var(--color-background, #fff);
    border: 1px solid var(--color-border, var(--color-muted, var(--color-text)));
    border-radius: 12px;
    overflow: hidden;
    font-family: system-ui, sans-serif;
    color: var(--color-text);
  }

  .player-display {
    background: var(--color-surface, var(--color-background, #fff));
    height: 140px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: 1px solid
      var(--color-border, var(--color-muted, var(--color-text)));
  }

  .play-icon {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--color-primary);
    color: var(--color-background, #fff);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    padding-left: 4px;
  }

  .player-info {
    padding: 14px 16px 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .player-title {
    font-size: 14px;
    font-weight: 600;
  }

  .player-subtitle {
    font-size: 12px;
    color: var(--color-muted, var(--color-text));
  }

  .progress-section {
    padding: 12px 16px 0;
  }

  .progress-bar {
    width: 100%;
    height: 4px;
    background: var(--color-border, var(--color-muted, var(--color-text)));
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-fill {
    width: 33%;
    height: 100%;
    background: var(--color-primary);
    border-radius: 2px;
  }

  .time-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 4px;
  }

  .time-current,
  .time-total {
    font-size: 10px;
    color: var(--color-muted, var(--color-text));
  }

  .player-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 14px 16px;
  }

  .control-btn {
    background: none;
    border: none;
    color: var(--color-text);
    font-size: 14px;
    cursor: pointer;
    padding: 0;
  }

  .control-btn:hover {
    color: var(--color-primary);
  }

  .play-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--color-primary);
    color: var(--color-background, #fff);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    padding-left: 2px;
  }

  .play-btn:hover {
    background: var(--color-primary-variant, var(--color-primary));
  }

  .volume-group {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-left: auto;
  }

  .volume-btn {
    font-size: 16px;
  }

  .volume-bar {
    width: 50px;
    height: 4px;
    background: var(--color-border, var(--color-muted, var(--color-text)));
    border-radius: 2px;
    overflow: hidden;
  }

  .volume-fill {
    width: 70%;
    height: 100%;
    background: var(--color-primary);
    border-radius: 2px;
  }
</style>
