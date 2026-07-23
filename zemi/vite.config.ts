import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // この値がそのまま公開URL https://mumekunx.github.io/shajitu/zemi/dist/ になる。
  // 変更すると公開URLが変わり既存リンクが全て切れるので触らないこと
  base: '/shajitu/zemi/dist/',
  plugins: [react()],
})
