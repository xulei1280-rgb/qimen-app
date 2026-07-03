# 奇门起盘分析

自用奇门遁甲起盘与 AI 分析网页。

## GitHub Pages

这是纯静态网页，发布到 GitHub Pages 时直接使用仓库根目录即可：

- Branch: `main`
- Folder: `/ (root)`

入口文件是 `index.html`。

## API Key

DeepSeek API Key 不写入源码。首次在新浏览器或手机上使用 AI 分析时，页面会提示输入 Key，并只保存到当前设备浏览器的 `localStorage`。

## 校验

修改排盘逻辑后先运行：

```bash
node check-baselines.js
```

当前基准盘通过时会输出：

```text
18 baselines ok
```
