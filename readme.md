========================================================================
机器学习知识点 PDF 生成系统 (完整包)
========================================================================

说明：
1. 下方内容包含三部分：【使用指南】、【AI 提示词模板】、【自动化编译脚本】。
2. 请将整个内容复制，然后根据指南拆分使用。
3. 本方案避免使用 Markdown 标题符号，确保复制无障碍。

========================================================================
第一部分：使用指南
========================================================================

1. 环境准备
   - 安装 MacTeX: brew install --cask mactex
   - 安装 Python3: 通常 macOS 自带
   - 验证编译器：终端输入 which xelatex 确保有输出                                                                                                          

2. 项目结构创建
   在终端执行以下命令创建目录：
   mkdir -p ml-knowledge-base/{texs,dl,ml,rl}
   cd ml-knowledge-base

3. 生成 LaTeX 源码
   - 复制下方的【AI 提示词模板】
   - 将模板中的 [知识点名称] 替换为实际内容（如 Transformer）
   - 将模板中的 [分类目录] 替换为 dl 或 ml 或 rl
   - 发送给 AI 模型
   - 将 AI 生成的内容保存为 texs/[知识点名称]/[知识点名称].tex
   - 重要：确保生成的 .tex 文件第一行包含 % 分类目录：dl 这样的注释

4. 编译单个PDF与生成合集大纲 (Book)
   - 确保项目库里使用了最新的 compile_all.py
   - 在项目根目录运行：uv run compile_all.py
   - 系统不仅会自动将单篇 PDF 归类到对应目录，还会把同一个目录下的知识点整合成一本《book.pdf》。

========================================================================
第二部分：AI 提示词模板 (复制此处内容发送给 AI)
========================================================================

角色设定
你是一位资深机器学习技术文档工程师 + LaTeX 排版专家。
任务
请围绕知识点「[知识点名称]」生成一份完备的 LaTeX 源码文档。
分类目录标记
请在文件第一行写入注释：% 分类目录：[分类目录]

内容结构要求
1. 文档类设置
   - 使用 \documentclass[12pt, a4paper]{article}
   - 必须包含 \usepackage{ctex} 支持中文
   - 必须包含 \usepackage{amsmath, amssymb} 支持公式
   - 必须包含 \usepackage{listings} 支持代码块
   - 页面边距设置为 2.5cm

2. 核心定义
   - 提供学术级别严谨的中英文对照定义
   - 提出时间/作者/原始关键论文出处
   - 技术体系定位及历史演进简述

3. 核心原理与底层逻辑
   - 分步骤文字深入推导
   - 数据流向简述（结合张量思维，明确输入维度->处理->输出维度）
   - 给出算法伪代码或执行步序

4. 严谨数学公式与推导
   - 行内公式用 $ $ 包裹
   - 行间公式必须用 $$ $$ 包裹
   - 必须包含核心的理论推导过程，公式需附带详尽的字母与符号说明
   - 示例：
     $$
     \text{Attention}(Q,K,V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V
     $$

5. 模型结构/架构示意图
   - 不使用图片，强烈要求使用 verbatim 环境展示高质量、分层次的 ASCII 架构图
   - 示例：
     \begin{verbatim}
     [输入 Tensor: B x L x D] 
           |
     [ Embedding 层 ] 
           |
     [ Multi-Head Attention ] <--- (计算 Q, K, V)
           |
     [ 输出 Tensor: B x L x D ]
     \end{verbatim}

6. 关键代码片段 (PyTorch/Python实现)
   - 使用 listings 环境，语言设为 Python，展示最核心的内部实现(不要导包等废话)
   - 标注重要的逻辑注释以及 tensor 的 shape 变换过程。

7. 深度面试题与解答
   - 分为基础概念、进阶原理、工程实战、坑点分析
   - 提供直击要害的深度回答内容，避免套话。

8. 优缺点与适用场景
   - 使用 tabular 环境制作表格
   - 包含优势、局限、最佳适用场景、绝对慎用场景（及替代方案）

9. 参考文献与拓展
   - 列出必读的经典论文、主流框架库函数连接、推荐深入阅读的资料。

语法规范
1. 特殊字符转义
   - _ 写成 \_
   - % 写成 \%
   - & 写成 \&
   - # 写成 \#
   - $ 写成 \$
2. 章节标题
   - 使用 \section{}, \subsection{}
   - 不超过 3 级
3. 中文支持
   - 确保所有中文内容在 \usepackage{ctex} 加载后
4. 避免项
   - 不使用 TikZ 复杂绘图
   - 不引用外部图片文件
   - 不使用自定义宏命令

输出前自检
1. 第一行是否包含 % 分类目录：[分类目录]
2. 是否包含 \begin{document} 和 \end{document}
3. 所有特殊字符是否已转义
4. 公式是否闭合

开始生成
请基于以上要求，为知识点「[知识点名称]」生成完整的 LaTeX 源码。
分类目录：[分类目录]

========================================================================
第三部分：自动化编译脚本 (保存为 compile_all.py)
========================================================================

#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import subprocess
import shutil
from pathlib import Path

========================================================================
配置区域
========================================================================

ROOT_DIR = Path(__file__).parent
TEXS_DIR = ROOT_DIR / "texs"
OUTPUT_DIRS = {
    "dl": ROOT_DIR / "dl",
    "ml": ROOT_DIR / "ml",
    "rl": ROOT_DIR / "rl",
}

========================================================================
工具函数
========================================================================

def ensure_dir(path):
    path.mkdir(parents=True, exist_ok=True)

def run_xelatex(tex_file):
    cmd = ["xelatex", "-interaction=nonstopmode", str(tex_file)]
    for i in range(2):
        print(f"  编译第 {i+1} 次...")
        result = subprocess.run(
            cmd,
            cwd=tex_file.parent,
            capture_output=True,
            text=True
        )
        if result.returncode != 0:
            print(f"  警告：{result.stdout[-200:]}")
    return tex_file.with_suffix(".pdf")

def get_category_from_tex(tex_file):
    try:
        with open(tex_file, 'r', encoding='utf-8') as f:
            for line in f:
                if line.startswith("% 分类目录："):
                    return line.split(":")[1].strip()
    except:
        pass
    return "ml"

def collect_pdf(pdf_file, category):
    if category not in OUTPUT_DIRS:
        print(f"  未知分类 '{category}'，跳过")
        return
    target_dir = OUTPUT_DIRS[category]
    ensure_dir(target_dir)
    target_path = target_dir / pdf_file.name
    shutil.copy2(pdf_file, target_path)
    print(f"  PDF 已收集到：{target_path}")

========================================================================
主流程
========================================================================

def main():
    print("=" * 60)
    print("机器学习知识点 PDF 编译系统")
    print("=" * 60)
    
    for dir_path in OUTPUT_DIRS.values():
        ensure_dir(dir_path)
    
    if not TEXS_DIR.exists():
        print(f"目录不存在：{TEXS_DIR}")
        return
    
    tex_folders = [f for f in TEXS_DIR.iterdir() if f.is_dir()]
    print(f"\n发现 {len(tex_folders)} 个知识点文件夹:\n")
    
    for folder in tex_folders:
        tex_files = list(folder.glob("*.tex"))
        if not tex_files:
            continue
        
        tex_file = tex_files[0]
        print(f"\n处理：{folder.name}")
        
        try:
            pdf_file = run_xelatex(tex_file)
            if pdf_file.exists():
                print(f"  编译成功：{pdf_file.name}")
                category = get_category_from_tex(tex_file)
                print(f"  分类：{category}")
                collect_pdf(pdf_file, category)
            else:
                print(f"  编译失败：未生成 PDF")
        except FileNotFoundError:
            print(f"  错误：未找到 xelatex，请确认 MacTeX 已安装")
        except Exception as e:
            print(f"  错误：{e}")
    
    print("\n" + "=" * 60)
    print("编译完成！")
    print("=" * 60)
    
    for cat, dir_path in OUTPUT_DIRS.items():
        if dir_path.exists():
            pdfs = list(dir_path.glob("*.pdf"))
            print(f"{cat}/ : {len(pdfs)} 个 PDF")

if __name__ == "__main__":
    main()

========================================================================
第四部分：目录结构示例
========================================================================

项目根目录/
├── compile_all.py          (编译脚本)
├── dl/                     (深度学习 PDF 汇总)
│   ├── book.pdf            (全部 dl 知识点的集合成书)
│   ├── book.tex
│   └── transformer.pdf
├── ml/                     (机器学习 PDF 汇总)
│   ├── book.pdf
│   ├── book.tex
│   └── svm.pdf
├── rl/                     (强化学习 PDF 汇总)
└── texs/                   (源文件目录)
    ├── transformer/
    │   ├── transformer.tex (第一行含 % 分类目录：dl)
    │   ├── transformer.log
    │   ├── transformer.aux
    │   └── transformer.pdf
    └── svm/
        └── svm.tex

========================================================================
故障排查
========================================================================

1. xelatex 命令找不到
   解决：export PATH="/Library/TeX/Root/bin:$PATH"
   永久生效：写入 ~/.zshrc 并 source

2. 中文乱码
   解决：确认 .tex 文件包含 \usepackage{ctex}

3. 特殊字符报错
   解决：检查 _ % & # $ 是否已转义

4. 目录显示 ???
   解决：确保 xelatex 运行了两次（脚本已自动处理）

========================================================================