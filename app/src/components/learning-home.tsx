"use client"

import { useState } from "react"
import Image from "next/image"
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleHelp,
  Menu,
  Sparkles,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"

const checkpoints = [
  {
    label: "Tôi hiểu đề bài",
    detail: "Viết lại vấn đề bằng lời của bạn, không dùng câu chữ của AI.",
  },
  {
    label: "Tôi đã có giả thuyết",
    detail: "Đưa ra ít nhất một hướng giải và lý do bạn tin vào nó.",
  },
  {
    label: "Tôi biết cần hỏi gì",
    detail: "Dùng AI để kiểm chứng điểm mù, không thay bạn suy nghĩ.",
  },
]

const lessons = [
  ["01", "Đặt câu hỏi tốt", "Tách dữ kiện, giả định và điều chưa biết."],
  ["02", "Lập luận trước", "Xây một quan điểm đủ rõ để có thể bị phản biện."],
  [
    "03",
    "Cộng tác với AI",
    "So sánh, kiểm chứng và chịu trách nhiệm cho kết quả.",
  ],
]

export function LearningHome() {
  const [checked, setChecked] = useState<boolean[]>([true, false, false])
  const [menuOpen, setMenuOpen] = useState(false)

  const completed = checked.filter(Boolean).length

  function toggleCheckpoint(index: number) {
    setChecked((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? !item : item)),
    )
  }

  return (
    <main>
      <section className="hero-shell">
        <div className="hero-image" aria-hidden="true" />
        <div className="hero-shade" aria-hidden="true" />

        <header className="site-header page-width">
          <a className="brand" href="#top" aria-label="Think First, AI Later">
            <span className="brand-mark">
              <Image src="/icon.png" alt="" width={48} height={48} priority />
            </span>
            <span>THINK FIRST</span>
            <span className="brand-divider">/</span>
            <span className="brand-ai">AI LATER</span>
          </a>

          <nav className="desktop-nav" aria-label="Điều hướng chính">
            <a href="#phuong-phap">Phương pháp</a>
            <a href="#hanh-trinh">Hành trình</a>
            <a href="#nguyen-tac">Nguyên tắc</a>
          </nav>

          <Button className="desktop-cta" variant="outline">
            Vào lớp học <ArrowRight size={16} />
          </Button>
          <button
            className="menu-button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </header>

        {menuOpen && (
          <nav className="mobile-nav" aria-label="Điều hướng di động">
            <a href="#phuong-phap" onClick={() => setMenuOpen(false)}>
              Phương pháp
            </a>
            <a href="#hanh-trinh" onClick={() => setMenuOpen(false)}>
              Hành trình
            </a>
            <a href="#nguyen-tac" onClick={() => setMenuOpen(false)}>
              Nguyên tắc
            </a>
          </nav>
        )}

        <div id="top" className="hero-content page-width">
          <div className="hero-copy">
            <p className="eyebrow">
              <span /> Giáo dục trong thời đại AI
            </p>
            <h1>
              Nghĩ cho rõ.
              <br />
              <span>Rồi mới hỏi AI.</span>
            </h1>
            <p className="hero-intro">
              Một không gian học tập giúp bạn giữ quyền làm chủ tư duy — dùng AI
              như người phản biện, không phải người làm thay.
            </p>
            <div className="hero-actions">
              <Button>
                Bắt đầu một thử thách <ArrowRight size={17} />
              </Button>
              <a className="text-link" href="#phuong-phap">
                Xem cách học <ChevronRight size={16} />
              </a>
            </div>
          </div>

          <aside className="checkpoint-card" aria-labelledby="checkpoint-title">
            <div className="card-topline">
              <span>Thinking checkpoint</span>
              <span>{completed}/3</span>
            </div>
            <div className="progress-track" aria-hidden="true">
              <span style={{ width: `${(completed / 3) * 100}%` }} />
            </div>
            <div className="checkpoint-heading">
              <div>
                <p>Trước khi mở AI</p>
                <h2 id="checkpoint-title">Bạn đã tự nghĩ chưa?</h2>
              </div>
              <CircleHelp aria-hidden="true" />
            </div>
            <div className="checkpoint-list">
              {checkpoints.map((checkpoint, index) => (
                <button
                  key={checkpoint.label}
                  className="checkpoint"
                  onClick={() => toggleCheckpoint(index)}
                  aria-pressed={checked[index]}
                >
                  <span className="check-box">
                    {checked[index] && <Check size={15} strokeWidth={3} />}
                  </span>
                  <span>
                    <strong>{checkpoint.label}</strong>
                    <small>{checkpoint.detail}</small>
                  </span>
                </button>
              ))}
            </div>
            <p className="checkpoint-note">
              <Sparkles size={15} /> AI xuất hiện sau bước 3 — đúng lúc bạn cần
              một góc nhìn thứ hai.
            </p>
          </aside>
        </div>

        <div className="hero-footer page-width" aria-hidden="true">
          <span>THINK</span>
          <span className="footer-line" />
          <span>VERIFY</span>
          <span className="footer-line orange" />
          <span>COLLABORATE</span>
        </div>
      </section>

      <section id="phuong-phap" className="method-section">
        <div className="page-width">
          <div className="section-heading">
            <p className="eyebrow dark">
              <span /> Phương pháp 3 bước
            </p>
            <h2>
              Tư duy không bị AI lấy mất.
              <br />
              Nó chỉ bị bỏ quên.
            </h2>
            <p>
              Mỗi bài học buộc bạn tạo ra một dấu vết tư duy trước khi nhận gợi
              ý. AI đến sau để mở rộng, không xóa trắng quá trình.
            </p>
          </div>

          <div id="hanh-trinh" className="lesson-grid">
            {lessons.map(([number, title, description]) => (
              <article key={number} className="lesson-card">
                <span className="lesson-number">{number}</span>
                <div className="lesson-icon" aria-hidden="true">
                  {number === "01" ? "?" : number === "02" ? "∵" : "↔"}
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
                <a href="#nguyen-tac" aria-label={`Tìm hiểu ${title}`}>
                  Khám phá <ArrowRight size={16} />
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="nguyen-tac" className="manifesto-section">
        <div className="page-width manifesto-inner">
          <p>Nguyên tắc lớp học</p>
          <blockquote>
            “Câu trả lời nhanh không quan trọng bằng một câu hỏi thuộc về bạn.”
          </blockquote>
          <Button variant="outline">Đọc tuyên ngôn học tập</Button>
        </div>
      </section>
    </main>
  )
}
