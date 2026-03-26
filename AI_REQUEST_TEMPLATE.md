# AI 生成 LaTeX 文档（一句话触发版）

你以后在对话框里只要直接说这一句：

请基于 Transformer 生成 dl 的知识点内容。

其中 `Transformer` 换成你的知识点名称，`dl` 换成 `dl` / `ml` / `rl` 中的一个。

后续的工作都由 agent 自动完成：先读 [readme.md](readme.md)，再生成高质量 LaTeX 源码、写入 `texs/<知识点名称>/<知识点名称>.tex`，最后用项目内 `compile_all.py` 自动编译产出独立 PDF 并整合该分类下的所有知识点生成一整本 Book (例如 `dl/book.pdf`)；如果失败，就自动修复后继续编译。

如果你想把它做成真正可复用的 agent 指令文件，我建议下一步直接把这段内容再整理成一个专用的 `.instructions.md`，这样就不用每次打开这个模板文件了。