import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  CheckCircle2,
  Gift,
  SearchCheck,
  Wheat,
} from "lucide-react"

import { LearningJourney } from "@/components/learning-journey"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const principles = [
  {
    icon: BrainCircuit,
    title: "Tự nghĩ trước",
    description:
      "Viết lại vấn đề, nêu giả thuyết và nhận ra điều mình chưa biết trước khi mở AI.",
  },
  {
    icon: SearchCheck,
    title: "Kiểm chứng sau",
    description:
      "So sánh câu trả lời với dữ kiện, tìm điểm yếu và giữ quyền quyết định cuối cùng.",
  },
  {
    icon: CheckCircle2,
    title: "Chịu trách nhiệm",
    description:
      "Biết phần nào do mình làm, phần nào có AI hỗ trợ và giải thích được kết quả.",
  },
]

const productJourney = [
  {
    icon: BookOpenCheck,
    label: "Học một cách nghĩ",
    description:
      "Mỗi chủ đề chia một năng lực lớn thành các hoạt động ngắn, có ví dụ và đầu ra rõ ràng.",
  },
  {
    icon: BrainCircuit,
    label: "Thực hành trên việc thật",
    description:
      "Bạn viết câu hỏi, lập luận và tự đánh giá trước khi dùng AI để mở rộng hoặc phản biện.",
  },
  {
    icon: Wheat,
    label: "Nhận lúa khi hoàn thành",
    description:
      "Lúa ghi nhận nhịp học đều và những hoạt động đã hoàn tất; không thưởng cho việc bấm qua bài.",
  },
  {
    icon: Gift,
    label: "Đổi phần thưởng phù hợp",
    description:
      "Dùng số lúa tích lũy để đổi voucher có sẵn và theo dõi toàn bộ lịch sử đổi quà của bạn.",
  },
]

export function LearningHome() {
  return (
    <main className="landing-shell">
      <header className="landing-header page-width">
        <Link className="brand" href="/" aria-label="Think First, AI Later">
          <span className="brand-mark">
            <Image src="/icon.png" alt="" width={40} height={40} priority />
          </span>
          <span className="brand-copy">
            <strong>Think First</strong>
            <small>AI Later</small>
          </span>
        </Link>

        <nav className="landing-nav" aria-label="Điều hướng chính">
          <a href="#cach-hoc">Cách học</a>
          <Link href="/login">Đăng nhập</Link>
          <Link
            className={cn(buttonVariants(), "landing-header-cta")}
            href="/register"
          >
            Bắt đầu học
          </Link>
        </nav>
      </header>

      <section className="landing-hero page-width" aria-labelledby="hero-title">
        <div className="landing-hero-copy">
          <p className="landing-kicker">Năng lực làm việc cùng AI</p>
          <h1 id="hero-title">
            Đừng giao tay lái
            <span> cho một câu trả lời nhanh.</span>
          </h1>
          <p className="landing-lead">
            Một lộ trình thực hành ngắn giúp bạn đặt câu hỏi rõ, kiểm chứng có
            căn cứ và dùng AI như người cộng tác — không phải người làm thay.
          </p>
          <div className="landing-actions">
            <Link className={buttonVariants()} href="/register">
              Bắt đầu bài đầu tiên <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <a
              className={buttonVariants({ variant: "ghost" })}
              href="#cach-hoc"
            >
              Xem hành trình 4 bước
            </a>
          </div>
          <p className="landing-proof">
            Không cần kinh nghiệm kỹ thuật · Một hoạt động đầu tiên trong vài
            phút
          </p>
        </div>

        <aside
          className="horizon-visual"
          aria-label="Từ tư duy đến cộng tác cùng AI"
        >
          <Image
            src="/background.png"
            alt="Con đường chuyển từ bầu trời xanh của tư duy sang thành phố AI màu cam"
            width={715}
            height={515}
            sizes="(max-width: 900px) calc(100vw - 48px), 48vw"
            priority
          />
          <div className="horizon-route" aria-hidden="true">
            <span>THINK</span>
            <i />
            <span>VERIFY</span>
            <i />
            <span>AI</span>
          </div>
        </aside>
      </section>

      <section id="cach-hoc" className="principles-section">
        <div className="page-width">
          <div className="section-intro">
            <p className="section-note">Một nguyên tắc, ba thói quen</p>
            <h2>AI đến sau khi bạn đã để lại dấu vết tư duy.</h2>
            <p>
              Mỗi hoạt động là một việc nhỏ có đầu ra rõ ràng, trạng thái rõ
              ràng và một bước tiếp theo — không phải một thư viện bài đọc để tự
              mò.
            </p>
          </div>

          <div className="principle-grid">
            {principles.map(({ icon: Icon, title, description }, index) => (
              <article className="principle-card" key={title}>
                <div className="principle-topline">
                  <Icon size={22} aria-hidden="true" />
                  <span className="utility-label">0{index + 1}</span>
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>

          <div className="product-journey" aria-labelledby="journey-title">
            <div className="product-journey-intro">
              <p className="section-note">Một vòng học trọn vẹn</p>
              <h2 id="journey-title">Biết mình sẽ làm gì — và nhận được gì.</h2>
              <p>
                Bạn không cần tự đoán bước tiếp theo. Mỗi hoạt động nối việc học
                với thực hành, tiến độ và phần thưởng có thể kiểm tra lại.
              </p>
            </div>

            <ol className="product-journey-list">
              {productJourney.map(
                ({ icon: Icon, label, description }, index) => (
                  <li key={label}>
                    <span className="journey-step-icon">
                      <Icon size={21} aria-hidden="true" />
                    </span>
                    <div>
                      <span className="utility-label">BƯỚC {index + 1}</span>
                      <h3>{label}</h3>
                      <p>{description}</p>
                    </div>
                  </li>
                ),
              )}
            </ol>

            <aside
              className="journey-card"
              aria-label="Ví dụ tiến trình một chủ đề học"
            >
              <div className="journey-card-heading">
                <span className="utility-label">LỘ TRÌNH 01</span>
                <span>Khoảng 5 phút</span>
              </div>
              <h3>Từ câu hỏi đến một quyết định có căn cứ</h3>
              <LearningJourney activeStep={0} />
              <div className="journey-note">
                <span aria-hidden="true">✦</span>
                Hoàn thành hoạt động để giữ streak và nhận lúa trong ngày.
              </div>
            </aside>
          </div>

          <div className="landing-closing">
            <div>
              <p className="section-note">Học bằng việc làm</p>
              <h2>Bắt đầu với một câu hỏi thật của bạn.</h2>
            </div>
            <Link className={buttonVariants()} href="/register">
              Tạo tài khoản miễn phí <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
