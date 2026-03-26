#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import subprocess
import shutil
import re
from pathlib import Path

# ========================================================================
# 配置区域
# ========================================================================

ROOT_DIR = Path(__file__).parent
TEXS_DIR = ROOT_DIR / "texs"
OUTPUT_DIRS = {
    "dl": ROOT_DIR / "dl",
    "ml": ROOT_DIR / "ml",
    "rl": ROOT_DIR / "rl",
}

# 匹配 \begin{document} 和 \end{document} 之间的内容
# 使用 re.DOTALL 启用跨行匹配
CONTENT_PATTERN = re.compile(r'\\begin\{document\}(.*?)\\end\{document\}', re.DOTALL)

# ========================================================================
# 工具函数
# ========================================================================

def ensure_dir(path):
    path.mkdir(parents=True, exist_ok=True)

def run_xelatex(tex_file):
    cmd = ["xelatex", "-interaction=nonstopmode", tex_file.name]
    for i in range(2):
        print(f"  编译第 {i+1} 次: {tex_file.name}...")
        result = subprocess.run(
            cmd,
            cwd=tex_file.parent,
            capture_output=True,
            text=True
        )
        if result.returncode != 0:
            out_str = str(result.stdout) if result.stdout else ""
            print(f"  警告：包含部分错误。日志结尾: {out_str[-200:]}")
    return tex_file.with_suffix(".pdf")

def get_category_from_tex(tex_file):
    try:
        with open(tex_file, 'r', encoding='utf-8') as f:
            for line in f:
                if line.startswith("% 分类目录："):
                    return line.split("：")[1].strip() if "：" in line else line.split(":")[1].strip()
    except Exception as e:
        print(f"提取分类失败: {e}")
    return "ml"

def collect_pdf(pdf_file, category):
    if category not in OUTPUT_DIRS:
        print(f"  未知分类 '{category}'，使用默认 ml")
        category = "ml"
    target_dir = OUTPUT_DIRS[category]
    ensure_dir(target_dir)
    target_path = target_dir / pdf_file.name
    shutil.copy2(pdf_file, target_path)
    print(f"  即时单篇 PDF 已收集到：{target_path}")

def extract_tex_body(tex_file):
    try:
        with open(tex_file, 'r', encoding='utf-8') as f:
            content = f.read()
            match = CONTENT_PATTERN.search(content)
            if match:
                return match.group(1).strip()
    except Exception as e:
        print(f"提取 {tex_file.name} 内容失败: {e}")
    return ""

def generate_and_compile_book(category, tex_files):
    if category not in OUTPUT_DIRS:
        return
    
    target_dir = OUTPUT_DIRS[category]
    ensure_dir(target_dir)
    book_tex_path = target_dir / "book.tex"
    
    print(f"\n开始生成 {category} 分类的集合 Book...")
    
    # 构建 Book 源码
    book_content = [
        r"\documentclass[12pt, a4paper]{book}",
        r"\usepackage{ctex}",
        r"\usepackage{amsmath, amssymb}",
        r"\usepackage{listings}",
        r"\usepackage{geometry}",
        r"\usepackage{hyperref}",
        r"\geometry{margin=2.5cm}",
        r"\begin{document}",
        r"\tableofcontents",
        r"\newpage"
    ]
    
    for tex_file in tex_files:
        chapter_name = tex_file.parent.name.replace("_", r"\_").capitalize()
        body = extract_tex_body(tex_file)
        if body:
            book_content.append(f"\\chapter{{{chapter_name}}}")
            book_content.append(body)
            book_content.append("")
            
    book_content.append(r"\end{document}")
    
    with open(book_tex_path, "w", encoding="utf-8") as f:
        f.write("\n".join(book_content))
        
    print(f"  生成 Book 源码: {book_tex_path}")
    
    # 编译 Book
    pdf_file = run_xelatex(book_tex_path)
    if pdf_file.exists():
        print(f"  [成功] 集合 PDF 编译完成：{pdf_file}")
    else:
        print(f"  [错误] 集合 PDF 编译失败")

# ========================================================================
# 主流程
# ========================================================================

def main():
    print("=" * 60)
    print("机器学习知识点 自动化生成与编译系统")
    print("=" * 60)
    
    for dir_path in OUTPUT_DIRS.values():
        ensure_dir(dir_path)
    
    if not TEXS_DIR.exists():
        print(f"目录不存在：{TEXS_DIR}")
        return
    
    tex_folders = [f for f in TEXS_DIR.iterdir() if f.is_dir()]
    print(f"\n发现 {len(tex_folders)} 个知识点文件夹:\n")
    
    category_tex_map = {}
    
    # 步骤 1：单独编译并收集所有单独的知识点 PDF
    for folder in tex_folders:
        tex_files = list(folder.glob("*.tex"))
        if not tex_files:
            continue
        
        tex_file = tex_files[0]
        category = get_category_from_tex(tex_file)
        if category not in category_tex_map:
            category_tex_map[category] = []
        category_tex_map[category].append(tex_file)
        
        print(f"\n处理单个：{folder.name} (分类: {category})")
        
        try:
            pdf_file = run_xelatex(tex_file)
            if pdf_file.exists():
                print(f"  单个编译成功：{pdf_file.name}")
                collect_pdf(pdf_file, category)
            else:
                print(f"  单个编译失败：未生成 PDF")
        except FileNotFoundError:
            print(f"  错误：未找到 xelatex，请确认系统已安装 TeX 环境")
        except Exception as e:
            print(f"  错误：{e}")
            
    # 步骤 2：对每个分类生成完整的 Book
    print("\n" + "=" * 60)
    print("全书大连编开始")
    print("=" * 60)
    
    for category, tex_files in category_tex_map.items():
        if tex_files:
            # 纯字母顺序排序 (按文件夹名)
            tex_files.sort(key=lambda x: x.parent.name)
            generate_and_compile_book(category, tex_files)
            
    print("\n" + "=" * 60)
    print("系统运行完毕！")
    print("=" * 60)
    
    for cat, dir_path in OUTPUT_DIRS.items():
        if dir_path.exists():
            pdfs = list(dir_path.glob("*.pdf"))
            print(f"{cat}/ : 包含 {len(pdfs)} 个 PDF")

if __name__ == "__main__":
    main()
