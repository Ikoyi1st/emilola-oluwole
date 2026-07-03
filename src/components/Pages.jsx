import { MINISTERS, ORDER_OF_SERVICE, HYMNS, COUPLE } from "../data/content.js";
import COUPLE_PHOTO from "../assets/couple-photo.jpg";

export function CoverPage() {
  return (
    <>
      <img className="cover-photo" src={COUPLE_PHOTO} alt={COUPLE.names.join(" and ")} />
      <div className="cover-texture" />
      <div className="cover-frame" />
      <div className="cover-inner">
        <span className="eyebrow">{COUPLE.eyebrow}</span>
        <h1 className="cover-names">
          {COUPLE.names[0]}
          <br />
          <span className="amp">&amp;</span> {COUPLE.names[1]}
        </h1>
        <span className="cover-spark">✦</span>
        <div className="cover-pill">
          <span className="eyebrow">{COUPLE.occasion}</span>
          <span className="detail">{COUPLE.date}</span>
        </div>
        <div className="cover-hint">Drag the corner to open →</div>
      </div>
    </>
  );
}

function LeafHead({ eyebrow, title }) {
  return (
    <div className="leaf-head">
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="leaf-title">{title}</h2>
    </div>
  );
}

export function MinistersPage() {
  return (
    <div className="leaf">
      <LeafHead eyebrow="With Thanks To" title="Officiating Ministers" />
      <div className="minister-list">
        {MINISTERS.map((m) => (
          <div className="minister-card" key={m.name}>
            <span className="minister-name">{m.name}</span>
            <span className="minister-role">{m.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OrderPage() {
  return (
    <div className="leaf">
      <LeafHead eyebrow="How The Day Unfolds" title="Order of Service" />
      <div className="order-list">
        {ORDER_OF_SERVICE.map((item, i) => (
          <div className="order-item" key={item}>
            <span className="order-num">{String(i + 1).padStart(2, "0")}</span>
            <span className="order-text">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HymnPage({ hymn }) {
  return (
    <div className="leaf">
      <LeafHead eyebrow="Sung In Celebration" title="The Hymns" />
      <div className="hymn-scroll">
        <span className="hymn-badge">{hymn.no}</span>
        <h3 className="hymn-title">{hymn.title}</h3>
        {hymn.parts.map((part) => (
          <div
            className={`hymn-part ${part.label === "Chorus" ? "is-chorus" : ""}`}
            key={part.label}
          >
            <span className="hymn-part-label">{part.label}</span>
            {part.lines.map((line, li) => (
              <p className="hymn-line" key={li}>
                {line}
              </p>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ClosingPage() {
  return (
    <>
      <div className="closing-frame" />
      <div className="closing-inner">
        <span className="closing-spark">✦</span>
        <h2 className="closing-title">Thank You</h2>
        <p className="closing-sub">for coming to celebrate with us</p>
      </div>
    </>
  );
}

export function buildPages() {
  return [
    { label: "Cover", className: "cover-face", content: <CoverPage /> },
    { label: "Ministers", className: "", content: <MinistersPage /> },
    { label: "Order of Service", className: "", content: <OrderPage /> },
    ...HYMNS.map((hymn) => ({
      label: hymn.title,
      className: "",
      content: <HymnPage hymn={hymn} />,
    })),
    { label: "Thank You", className: "closing-face", content: <ClosingPage /> },
  ];
}
