# detail.md — ファイル構成リファレンス

## lesson14/index.html
- 役割: 脱出ゲーム『2036: フラグメント・プロトコル』本体。単一HTMLにCSS・シナリオデータ・ゲームエンジンを全てインライン（外部依存は Google Fonts のみ）。
- 主要な構成要素:
  - `<style>`: デザイントークン（`--color-*` 等）、UI部品（`.terminal-panel` `.auth-gauge` `.choice-btn` `.stage-progress`）、グリッチ/ノイズ演出の @keyframes
  - `GAME_DATA`: 全ステージ（プロローグ＋STAGE1〜5）のテキスト・選択肢・謎データ（記事2本、シーザー暗号、3スロット統合パズル）
  - ゲームエンジン: state管理（ステージ/断片/認証スコア）、タイプライター表示、謎の正解判定、フェード遷移・グリッチ演出

## update.md / tasks/todo.md
- 役割: 進捗ログ（追記型）とタスク管理。
