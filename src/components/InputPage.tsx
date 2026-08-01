import { useState } from "react";

interface InputPageProps {
  onSubmit: (text: string) => void;
}

const EXAMPLE_TEXT = `1. 光合作用：植物利用光能将二氧化碳和水转化为有机物和氧气的过程
2. 细胞分裂：一个细胞分裂为两个或多个子细胞的过程，包括有丝分裂和减数分裂
3. DNA：脱氧核糖核酸，携带遗传信息的分子，由两条互补链组成双螺旋结构
4. 牛顿第一定律：物体在不受外力作用时，保持静止或匀速直线运动状态
5. 勾股定理：直角三角形中，两直角边的平方和等于斜边的平方，即 a² + b² = c²`;

export default function InputPage({ onSubmit }: InputPageProps) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text);
    }
  };

  const handleExample = () => {
    setText(EXAMPLE_TEXT);
  };

  return (
    <div className="input-page">
      <div className="input-header">
        <h1>📝 Splity</h1>
        <p className="subtitle">一张纸，写上知识点，自动分割成学习卡片</p>
      </div>

      <div className="paper-area">
        <div className="paper-decoration">
          <span className="paper-line" />
          <span className="paper-line" />
          <span className="paper-line" />
        </div>
        <textarea
          className="paper-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`在这里写下你的知识点...\n\n支持多种格式：\n• 编号列表：1. 知识点内容\n• 问答对：Q: 问题 / A: 答案\n• 键值对：名词：解释\n• 定义式：概念 —— 定义\n• 或者直接分段书写`}
          rows={14}
        />
      </div>

      <div className="input-actions">
        <button className="btn-example" onClick={handleExample}>
          💡 填入示例
        </button>
        <button
          className="btn-submit"
          onClick={handleSubmit}
          disabled={!text.trim()}
        >
          ✂️ 分割成卡片
        </button>
      </div>
    </div>
  );
}
