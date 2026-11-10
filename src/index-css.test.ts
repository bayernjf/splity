// P1-2 回归：index.css 只允许一套 :root 设计系统——
// 防“第二套样式块被再次粘贴进来”的结构性守护。
/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('./index.css', import.meta.url), 'utf8');

describe('index.css 单一设计系统（P1-2）', () => {
  it('只有一个顶层 :root 块', () => {
    const roots = css.match(/^:root\s*\{/gm) ?? [];
    expect(roots).toHaveLength(1);
  });

  it('没有 #root 选择器（原冲突块给输入框继承来 text-align:center）', () => {
    expect(css).not.toMatch(/^#root\s*\{/m);
  });

  it('rem 基准未被改成 18px（原冲突块 font: 18px/145%）', () => {
    expect(css).not.toMatch(/font:\s*18px/);
  });

  it('没有第二套模板变量（--text-h/--code-bg 等只存在于冲突块）', () => {
    expect(css).not.toContain('--text-h');
    expect(css).not.toContain('--code-bg');
  });
});
