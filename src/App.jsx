import FlipBook from "./components/FlipBook.jsx";
import { buildPages } from "./components/Pages.jsx";
import { COUPLE } from "./data/content.js";
import "./App.css";

export default function App() {
  const pages = buildPages();

  return (
    <div className="app">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <div className="stage">
        <div>
          <div className="stage-eyebrow">{COUPLE.eyebrow}</div>
          <h1 className="stage-title">
            {COUPLE.names[0]} <span className="amp">&amp;</span> {COUPLE.names[1]}
          </h1>
        </div>

        <FlipBook pages={pages} />
      </div>
    </div>
  );
}
