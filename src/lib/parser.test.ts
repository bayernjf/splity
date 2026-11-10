import { describe, it, expect } from "vitest";
import { parseToCards } from "./parser";

// 卡片正文断言辅助：忽略自动生成的 id
const shape = (cards: { front: string; back: string }[]) =>
  cards.map(({ front, back }) => ({ front, back }));

describe("parseToCards — 问答对格式（Q/A）", () => {
  it("英文 Q:/A: 两组 → 2 张正确卡片", () => {
    const cards = parseToCards(
      "Q: What is photosynthesis?\nA: Plants convert light into energy.\nQ: Formula of water?\nA: H2O",
    );
    expect(shape(cards)).toEqual([
      {
        front: "What is photosynthesis?",
        back: "Plants convert light into energy.",
      },
      { front: "Formula of water?", back: "H2O" },
    ]);
  });

  it("中文 问：/答： 两组 → 2 张正确卡片", () => {
    const cards = parseToCards(
      "问：什么是光合作用？\n答：植物利用光能合成有机物的过程。\n问：水的化学式是什么？\n答：H₂O",
    );
    expect(shape(cards)).toEqual([
      { front: "什么是光合作用？", back: "植物利用光能合成有机物的过程。" },
      { front: "水的化学式是什么？", back: "H₂O" },
    ]);
  });

  it("Question:/Answer: 长形式与小写 q:/a: 均识别", () => {
    expect(
      shape(parseToCards("Question: 其一？\nAnswer: 一\nQuestion: 其二？\nAnswer: 二")),
    ).toEqual([
      { front: "其一？", back: "一" },
      { front: "其二？", back: "二" },
    ]);
    expect(shape(parseToCards("q: 加？\na: 减\nq: 乘？\na: 除"))).toHaveLength(2);
  });

  it("回归：Q/A 不被键值对策略劫持（修复前产出 front=\"Q\" 的翻倍废卡）", () => {
    const cards = parseToCards(
      "Q: 问题一\nA: 答案一\nQ: 问题二\nA: 答案二\nQ: 问题三\nA: 答案三",
    );
    expect(cards).toHaveLength(3);
    expect(cards.every((c) => c.front !== "Q" && c.front !== "A")).toBe(true);
  });

  it("单个问答对也按 Q/A 解析（修复前被 2 张 KV 废卡覆盖）", () => {
    expect(shape(parseToCards("Q: 唯一问题\nA: 唯一答案"))).toEqual([
      { front: "唯一问题", back: "唯一答案" },
    ]);
  });
});

describe("parseToCards — 键值对格式", () => {
  it("半角冒号", () => {
    expect(shape(parseToCards("书名: 卡片笔记法\n作者: 申克·阿伦斯"))).toEqual([
      { front: "书名", back: "卡片笔记法" },
      { front: "作者", back: "申克·阿伦斯" },
    ]);
  });

  it("全角冒号", () => {
    expect(shape(parseToCards("名称：光合作用\n场所：叶绿体"))).toEqual([
      { front: "名称", back: "光合作用" },
      { front: "场所", back: "叶绿体" },
    ]);
  });

  it("保留键不产出键值对卡片（Q/A/问/答/问题/答案/Question/Answer）", () => {
    // 只有问答标记键 → 键值对策略判定无效，最终无结构可解析
    expect(parseToCards("Q: 没有答案的问题")) .toEqual([]);
  });
});

describe("parseToCards — 其余四种格式回归", () => {
  it("编号列表", () => {
    expect(
      shape(parseToCards("1. 维生素C：抗氧化\n2. 维生素D：促进钙吸收")),
    ).toEqual([
      { front: "维生素C", back: "抗氧化" },
      { front: "维生素D", back: "促进钙吸收" },
    ]);
  });

  it("符号列表", () => {
    expect(shape(parseToCards("- 苹果\n- 香蕉\n- 橙子"))).toHaveLength(3);
  });

  it("定义式（term —— definition）", () => {
    expect(
      shape(
        parseToCards("光合作用 —— 植物合成有机物的过程\n呼吸作用 —— 分解释放能量"),
      ),
    ).toEqual([
      { front: "光合作用", back: "植物合成有机物的过程" },
      { front: "呼吸作用", back: "分解释放能量" },
    ]);
  });

  it("空行分段", () => {
    expect(
      parseToCards("第一段知识点内容\n\n第二段知识点内容"),
    ).toHaveLength(2);
  });

  it("兜底：纯句子按句切分", () => {
    expect(
      parseToCards("光合作用很重要。呼吸作用也重要。消化吸收同样关键。"),
    ).toHaveLength(3);
  });
});

describe("parseToCards — 歧义与混合内容的确定性行为", () => {
  it("问答 + 键值散行混合：问答信号最强，按 Q/A 解析", () => {
    const cards = parseToCards("科目: 生物\nQ: 什么是细胞？\nA: 生命的基本单位");
    expect(shape(cards)).toEqual([
      { front: "什么是细胞？", back: "生命的基本单位" },
    ]);
  });

  it("编号列表内含冒号：编号优先于键值对，且编号被剥离", () => {
    const cards = parseToCards("1. 问: 这是什么\n2. 答: 测试用例");
    expect(cards).toHaveLength(2);
    // 编号策略的 source 是剥离编号后的条目；若被键值对劫持，source 会带 "1." 前缀
    expect(cards[0].source).toBe("问: 这是什么");
  });

  it("符号列表内含键值形态：符号优先于键值对", () => {
    const cards = parseToCards("- 维生素C: 抗氧化\n- 维生素D: 促钙吸收");
    expect(shape(cards)).toEqual([
      { front: "维生素C", back: "抗氧化" },
      { front: "维生素D", back: "促钙吸收" },
    ]);
  });
});

describe("parseToCards — 空与畸形输入", () => {
  it("空字符串 / 纯空白 → []", () => {
    expect(parseToCards("")).toEqual([]);
    expect(parseToCards("   \n \n  ")).toEqual([]);
  });

  it("无结构单行垃圾 → []", () => {
    expect(parseToCards("随便一句话没有结构")).toEqual([]);
  });

  it("只有问没有答（不配对）→ 不产出问答卡也不产出 Q 键值卡", () => {
    expect(parseToCards("Q: 没有答案的问题")).toEqual([]);
  });
});
