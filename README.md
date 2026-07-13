# WeNew威牛 官方网站

纯静态网站（HTML/CSS/JS），托管于 GitHub Pages，内容通过 [Pages CMS](https://app.pagescms.org) 在线编辑。

## 内容编辑后台

1. 打开 https://app.pagescms.org
2. 用 GitHub 账号登录，选择本仓库
3. 左侧即可看到：新闻 News / 演出 Live / 周边 Goods / 关于我们 About
4. 编辑保存后约 1 分钟，网站自动更新

## 多语言

网站支持 中文 / English / 日本語 / 한국어。
每条内容都有四个语言字段（如 `title_zh` / `title_en` / `title_ja` / `title_ko`）；
某语言留空时会自动回退显示中文。

## 目录结构

- `index.html` — 页面骨架
- `css/style.css` — 视觉样式
- `js/app.js` — 路由、多语言、内容渲染
- `content/*.json` — 全部可编辑内容（后台改的就是这些文件）
- `assets/` — 照片与 Logo（后台上传的图片进入 `assets/uploads/`）
- `.pages.yml` — Pages CMS 后台配置
