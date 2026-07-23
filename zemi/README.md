# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## デプロイ

- 公開URL: https://mumekunx.github.io/shajitu/zemi/dist/ （固定。変わらない）
- 仕組み: GitHub Pages が `main` ブランチを直接配信している(Actions は使用しない)。`zemi/dist/` の中身がそのまま公開URL配下に表示される。
- 更新手順:
  1. 作業ブランチでコードを修正する
  2. `cd zemi && npm run build`
  3. `zemi/dist/` の変更も一緒にコミットする(`.gitignore` から外してあるので通常の `git add` でよい)
  4. PR を作って `main` にマージする → 数分で反映される
  5. 反映されない場合はスーパーリロード(⌘+Shift+R)する。JS/CSS はハッシュ付きファイル名なので中身は確実に切り替わるが、`index.html` がブラウザにキャッシュされることがある
- 注意: `vite.config.ts` の `base` を変更すると公開URLそのものが変わってしまうため、変更しないこと。

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
