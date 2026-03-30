# Repository Instructions

This repository is for generating machine-learning knowledge-point PDFs from a short natural-language request.

When the user says something like: "请基于 XX 生成 YY 的知识点内容", treat it as a full automation request and do the following without asking for copy-pasted intermediate prompts:

1. Read `readme.md` first and follow the document structure, LaTeX constraints, folder layout, and compilation guidance in that file.
2. Infer the knowledge point name and category from the user's request.
3. Use the project-local Python environment under `.venv` or the environment already configured for this workspace. Do not ask the user to install or activate a global Python environment.
4. Generate a complete LaTeX source file at `texs/<知识点名称>/<知识点名称>.tex`.
5. Ensure the first line of the `.tex` file is `% 分类目录：<dl|ml|rl>`.
6. Compile the document to PDF using the workflow described in `readme.md`.
7. If compilation fails, fix the `.tex` source or supporting script and retry until the PDF builds successfully, unless a missing external dependency makes progress impossible.
8. Once individual PDF generation is complete, **DO NOT** run `uv run compile_all.py` unless the user explicitly asks to "re-organize the book" (整理book) or similar. Normally, only ensure the individual PDF is generated.
9. **Automatic Section Numbering**: Do not manually add numbers (e.g., "1.", "2.") in `\section`, `\subsection`, or `\subsubsection` titles. LaTeX handles numbering automatically.
10. **Strict LaTeX Syntax**: Always use `\textbf{...}` for bold text and `\textit{...}` for italics. Never use Markdown syntax like `**...**` or `*...*` inside `.tex` files.
11. Keep the user updated briefly, but do not ask them to paste prompts or perform manual file operations unless absolutely necessary.

Preferred output style:
- Be direct and action-oriented.
- Minimize back-and-forth.
- Favor automated completion over manual instruction.