export interface FlashCard {
  id: string;
  front: string; // 正面：问题/知识点名称
  back: string; // 背面：答案/详细解释
  source: string; // 原始文本
}

/**
 * 智能分割知识点文本为学习卡片
 * 支持格式：
 * 1. 编号列表：1. / 1、/ 1) / (1) / ①②③
 * 2. 符号列表：- / * / • / ·
 * 3. 问答对：Q: / A: / 问：/ 答：
 * 4. 键值对：key: value / key：value
 * 5. 定义式：term — definition / term —— definition
 * 6. 空行分段
 */
export function parseToCards(text: string): FlashCard[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  // 尝试各种解析策略，选择产出卡片最多的
  const strategies = [
    parseQA,
    parseNumberedList,
    parseBulletList,
    parseKeyValue,
    parseDefinition,
    parseParagraphs,
  ];

  let best: FlashCard[] = [];
  for (const strategy of strategies) {
    const cards = strategy(trimmed);
    if (cards.length > best.length) {
      best = cards;
    }
  }

  // 如果所有策略都只产出 0-1 张卡片，尝试按句子分割
  if (best.length <= 1) {
    const sentenceCards = parseSentences(trimmed);
    if (sentenceCards.length > best.length) {
      best = sentenceCards;
    }
  }

  return best;
}

let idCounter = 0;
function makeId(): string {
  return `card_${Date.now()}_${idCounter++}`;
}

/** 问答对解析：Q:/A: 或 问：/答： */
function parseQA(text: string): FlashCard[] {
  const qaPattern =
    /(?:^|\n)\s*(?:Q|问|问题|Question)\s*[:：]\s*(.+?)(?=\n\s*(?:A|答|答案|Answer)\s*[:：])/gis;
  const ansPattern =
    /(?:^|\n)\s*(?:A|答|答案|Answer)\s*[:：]\s*(.+?)(?=\n\s*(?:Q|问|问题|Question)\s*[:：]|$)/gis;

  const questions: string[] = [];
  const answers: string[] = [];

  let m;
  while ((m = qaPattern.exec(text)) !== null) {
    questions.push(m[1].trim());
  }
  while ((m = ansPattern.exec(text)) !== null) {
    answers.push(m[1].trim());
  }

  if (questions.length === 0 || questions.length !== answers.length) return [];

  return questions.map((q, i) => ({
    id: makeId(),
    front: q,
    back: answers[i],
    source: `Q: ${q}\nA: ${answers[i]}`,
  }));
}

/** 编号列表解析 */
function parseNumberedList(text: string): FlashCard[] {
  const lines = text.split("\n");
  const items: string[] = [];
  let current = "";

  const numPattern =
    /^\s*(?:\d+\s*[.、)）]|[（(]\d+[)）]|[①②③④⑤⑥⑦⑧⑨⑩])\s*/;

  for (const line of lines) {
    if (numPattern.test(line)) {
      if (current.trim()) items.push(current.trim());
      current = line.replace(numPattern, "");
    } else if (current) {
      current += "\n" + line;
    }
  }
  if (current.trim()) items.push(current.trim());

  if (items.length < 2) return [];
  return items.map((item) => splitItemToCard(item));
}

/** 符号列表解析 */
function parseBulletList(text: string): FlashCard[] {
  const lines = text.split("\n");
  const items: string[] = [];
  let current = "";

  const bulletPattern = /^\s*[-*•·▪◦]\s+/;

  for (const line of lines) {
    if (bulletPattern.test(line)) {
      if (current.trim()) items.push(current.trim());
      current = line.replace(bulletPattern, "");
    } else if (current) {
      current += "\n" + line;
    }
  }
  if (current.trim()) items.push(current.trim());

  if (items.length < 2) return [];
  return items.map((item) => splitItemToCard(item));
}

/** 键值对解析：key: value */
function parseKeyValue(text: string): FlashCard[] {
  const lines = text.split("\n").filter((l) => l.trim());
  const cards: FlashCard[] = [];

  const kvPattern = /^([^:：]{1,30})\s*[:：]\s*(.+)$/;

  for (const line of lines) {
    const m = line.match(kvPattern);
    if (m) {
      cards.push({
        id: makeId(),
        front: m[1].trim(),
        back: m[2].trim(),
        source: line,
      });
    }
  }

  // 至少一半的行是键值对才算有效
  if (cards.length < 2 || cards.length < lines.length * 0.5) return [];
  return cards;
}

/** 定义式解析：term — definition */
function parseDefinition(text: string): FlashCard[] {
  const lines = text.split("\n").filter((l) => l.trim());
  const cards: FlashCard[] = [];

  const defPattern = /^(.{1,40}?)\s*[—–\-]{2,}\s*(.+)$/;

  for (const line of lines) {
    const m = line.match(defPattern);
    if (m) {
      cards.push({
        id: makeId(),
        front: m[1].trim(),
        back: m[2].trim(),
        source: line,
      });
    }
  }

  if (cards.length < 2 || cards.length < lines.length * 0.5) return [];
  return cards;
}

/** 空行分段 */
function parseParagraphs(text: string): FlashCard[] {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (paragraphs.length < 2) return [];
  return paragraphs.map((p) => splitItemToCard(p));
}

/** 按句子分割（兜底策略） */
function parseSentences(text: string): FlashCard[] {
  // 中英文句子分割
  const sentences = text
    .split(/(?<=[。！？；\n.!?;])\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length > 4);

  if (sentences.length < 2) return [];
  return sentences.map((s) => ({
    id: makeId(),
    front: s,
    back: s,
    source: s,
  }));
}

/**
 * 将单个条目拆分为正反面
 * 尝试识别 "是"、"："、"-" 等分隔符
 */
function splitItemToCard(item: string): FlashCard {
  // 尝试用冒号分割
  const colonMatch = item.match(/^([^:：\n]{1,50}?)\s*[:：]\s*([\s\S]+)$/);
  if (colonMatch) {
    return {
      id: makeId(),
      front: colonMatch[1].trim(),
      back: colonMatch[2].trim(),
      source: item,
    };
  }

  // 尝试用 "是" 分割（定义型）
  const shiMatch = item.match(/^(.{2,30}?)\s*是\s*([\s\S]+)$/);
  if (shiMatch && shiMatch[2].length > 2) {
    return {
      id: makeId(),
      front: `${shiMatch[1].trim()}是什么？`,
      back: shiMatch[2].trim(),
      source: item,
    };
  }

  // 尝试用破折号分割
  const dashMatch = item.match(/^(.{1,40}?)\s*[—–]{1,2}\s*([\s\S]+)$/);
  if (dashMatch) {
    return {
      id: makeId(),
      front: dashMatch[1].trim(),
      back: dashMatch[2].trim(),
      source: item,
    };
  }

  // 无法分割，整体作为正面，提示用户回忆
  return {
    id: makeId(),
    front: item,
    back: item,
    source: item,
  };
}
