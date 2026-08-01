import { useState } from "react";
import InputPage from "./components/InputPage";
import CardView from "./components/CardView";
import { parseToCards, type FlashCard } from "./lib/parser";

type AppView = "input" | "cards";

export default function App() {
  const [view, setView] = useState<AppView>("input");
  const [cards, setCards] = useState<FlashCard[]>([]);

  const handleSubmit = (text: string) => {
    const parsed = parseToCards(text);
    if (parsed.length > 0) {
      setCards(parsed);
      setView("cards");
    }
  };

  return (
    <div className="app">
      {view === "input" ? (
        <InputPage onSubmit={handleSubmit} />
      ) : (
        <CardView cards={cards} onBack={() => setView("input")} />
      )}
    </div>
  );
}
