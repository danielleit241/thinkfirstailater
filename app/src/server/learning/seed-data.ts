/**
 * Learning catalog seed data + upsert logic (Phase 4). Extracted from
 * `prisma/seed.ts` so the same idempotent seeding logic is reusable from the
 * integration test that proves running it twice does not create duplicates.
 *
 * Every Track/Module/Activity is `upsert`-ed by its stable `slug`. Content is
 * a short "golden learning path": 3 tracks, 1 module each, a handful of real
 * (non-placeholder) LESSON/QUIZ/CHECKLIST activities — enough for a ≤5
 * minute demo, not a full course. One activity is seeded `active: false` on
 * purpose, so tests/manual checks can confirm inactive content stays hidden
 * from the catalog.
 */
import { prisma } from "@/server/db"
import {
  checklistPayloadSchema,
  lessonPayloadSchema,
  quizPayloadSchema,
} from "./schemas"

type ActivitySeed =
  | {
      slug: string
      title: string
      type: "LESSON"
      sortOrder: number
      active?: boolean
      payload: ReturnType<typeof lessonPayloadSchema.parse>
    }
  | {
      slug: string
      title: string
      type: "QUIZ"
      sortOrder: number
      active?: boolean
      payload: ReturnType<typeof quizPayloadSchema.parse>
    }
  | {
      slug: string
      title: string
      type: "CHECKLIST"
      sortOrder: number
      active?: boolean
      payload: ReturnType<typeof checklistPayloadSchema.parse>
    }

type ModuleSeed = {
  slug: string
  title: string
  description: string
  sortOrder: number
  activities: ActivitySeed[]
}

type TrackSeed = {
  slug: string
  title: string
  description: string
  sortOrder: number
  modules: ModuleSeed[]
}

export const learningCatalogSeed: TrackSeed[] = [
  {
    slug: "dat-cau-hoi-tot",
    title: "Đặt câu hỏi tốt",
    description:
      "Tách dữ kiện, giả định và điều chưa biết trước khi hỏi AI — để câu hỏi của bạn có hướng, không phải một lời cầu cứu mơ hồ.",
    sortOrder: 0,
    modules: [
      {
        slug: "dat-cau-hoi-tot-nen-tang",
        title: "Nền tảng đặt câu hỏi",
        description:
          "Ba bước đơn giản để biến một vấn đề mơ hồ thành một câu hỏi có thể trả lời được.",
        sortOrder: 0,
        activities: [
          {
            slug: "dat-cau-hoi-tot-bai-1-tach-du-kien",
            title: "Tách dữ kiện và giả định",
            type: "LESSON",
            sortOrder: 0,
            payload: lessonPayloadSchema.parse({
              body: "Trước khi hỏi AI, hãy viết ra 3 cột: (1) Dữ kiện — điều bạn chắc chắn đúng; (2) Giả định — điều bạn đang mặc định nhưng chưa kiểm chứng; (3) Điều chưa biết — câu hỏi thật sự cần lời giải. Phần lớn câu hỏi tệ là do nhầm giả định với dữ kiện. Khi đã tách rõ, câu hỏi gửi cho AI sẽ ngắn hơn và chính xác hơn rất nhiều.",
            }),
          },
          {
            slug: "dat-cau-hoi-tot-quiz-1",
            title: "Kiểm tra nhanh: Dữ kiện hay giả định?",
            type: "QUIZ",
            sortOrder: 1,
            payload: quizPayloadSchema.parse({
              question:
                '"Chắc chắn là do server hết bộ nhớ nên app bị crash." — Đây là gì?',
              options: [
                { id: "fact", text: "Dữ kiện đã kiểm chứng" },
                { id: "assumption", text: "Giả định chưa kiểm chứng" },
                { id: "unknown", text: "Điều chưa biết" },
              ],
              correctOptionId: "assumption",
              explanation:
                'Đây là một giả định: bạn đang suy đoán nguyên nhân mà chưa xem log/metrics để xác nhận. Trước khi hỏi AI "tại sao app crash", hãy kiểm tra bộ nhớ thật trước — nếu không, AI sẽ chỉ giúp bạn kiểm chứng một giả định sai.',
            }),
          },
          {
            slug: "dat-cau-hoi-tot-checklist-1",
            title: "Tự đánh giá trước khi hỏi AI",
            type: "CHECKLIST",
            sortOrder: 2,
            payload: checklistPayloadSchema.parse({
              items: [
                {
                  id: "understand",
                  label: "Tôi hiểu đề bài",
                  detail:
                    "Viết lại vấn đề bằng lời của bạn, không dùng câu chữ của AI.",
                },
                {
                  id: "hypothesis",
                  label: "Tôi đã có giả thuyết",
                  detail:
                    "Đưa ra ít nhất một hướng giải và lý do bạn tin vào nó.",
                },
                {
                  id: "question",
                  label: "Tôi biết cần hỏi gì",
                  detail:
                    "Dùng AI để kiểm chứng điểm mù, không thay bạn suy nghĩ.",
                },
              ],
            }),
          },
          {
            // Inactive on purpose: proves the catalog filter hides it from
            // USER and lets the seed idempotency test assert its count too.
            slug: "dat-cau-hoi-tot-bai-nhap",
            title: "[Nháp] Bản mở rộng chưa xuất bản",
            type: "LESSON",
            sortOrder: 3,
            active: false,
            payload: lessonPayloadSchema.parse({
              body: "Nội dung mở rộng đang soạn thảo, chưa sẵn sàng để hiển thị cho học viên.",
            }),
          },
        ],
      },
    ],
  },
  {
    slug: "tu-duy-kiem-chung",
    title: "Tư duy và kiểm chứng",
    description:
      "Xây một quan điểm đủ rõ để có thể bị phản biện, rồi dùng AI như người phản biện — không phải người quyết định thay bạn.",
    sortOrder: 1,
    modules: [
      {
        slug: "tu-duy-kiem-chung-nen-tang",
        title: "Lập luận trước, kiểm chứng sau",
        description:
          "Cách xây một lập luận đủ cụ thể để AI có thể phản biện lại — thay vì chỉ đồng ý cho qua.",
        sortOrder: 0,
        activities: [
          {
            slug: "tu-duy-kiem-chung-bai-1",
            title: "Lập luận trước khi hỏi",
            type: "LESSON",
            sortOrder: 0,
            payload: lessonPayloadSchema.parse({
              body: 'Một lập luận tốt có 3 phần: kết luận, lý do, và bằng chứng. Trước khi mở AI, hãy tự viết ra cả ba phần này cho vấn đề của bạn — dù chỉ 2-3 câu. Sau đó, đưa lập luận đó cho AI và yêu cầu nó tìm điểm yếu, thay vì hỏi thẳng "đáp án là gì". Cách này giữ cho tư duy vẫn là của bạn, AI chỉ đóng vai trò kiểm chứng.',
            }),
          },
          {
            slug: "tu-duy-kiem-chung-quiz-1",
            title: "Kiểm tra nhanh: Phản biện đúng cách",
            type: "QUIZ",
            sortOrder: 1,
            payload: quizPayloadSchema.parse({
              question:
                "Cách nào sau đây tận dụng AI để kiểm chứng tư duy tốt nhất?",
              options: [
                {
                  id: "ask-answer",
                  text: "Hỏi thẳng AI đáp án cuối cùng và làm theo",
                },
                {
                  id: "ask-critique",
                  text: "Trình bày lập luận của bạn và nhờ AI chỉ ra điểm yếu",
                },
                { id: "ignore", text: "Không dùng AI trong bước này" },
              ],
              correctOptionId: "ask-critique",
              explanation:
                "Đưa lập luận có sẵn cho AI phản biện giúp bạn giữ quyền quyết định và phát hiện lỗ hổng, thay vì giao toàn bộ tư duy cho AI ngay từ đầu.",
            }),
          },
        ],
      },
    ],
  },
  {
    slug: "quy-trinh-cong-tac-ai",
    title: "Quy trình cộng tác với AI",
    description:
      "So sánh, kiểm chứng và chịu trách nhiệm cho kết quả cuối cùng — AI là cộng sự, người chịu trách nhiệm vẫn là bạn.",
    sortOrder: 2,
    modules: [
      {
        slug: "quy-trinh-cong-tac-ai-nen-tang",
        title: "Quy trình 3 bước cộng tác với AI",
        description:
          "Một quy trình lặp lại được: hỏi có chủ đích, so sánh nhiều góc nhìn, và tự chịu trách nhiệm trước khi dùng kết quả.",
        sortOrder: 0,
        activities: [
          {
            slug: "quy-trinh-cong-tac-ai-bai-1",
            title: "Ba bước cộng tác với AI",
            type: "LESSON",
            sortOrder: 0,
            payload: lessonPayloadSchema.parse({
              body: "Quy trình gợi ý: (1) Hỏi có chủ đích — đã tự nghĩ trước, câu hỏi rõ ràng; (2) So sánh — nếu có thể, hỏi từ hai góc nhìn khác nhau hoặc tự kiểm tra chéo với nguồn khác; (3) Chịu trách nhiệm — bạn là người quyết định dùng hay bỏ câu trả lời, không phải AI. Lặp lại quy trình này biến AI thành một cộng sự đáng tin, thay vì một hộp đen bạn phải tin tưởng mù quáng.",
            }),
          },
          {
            slug: "quy-trinh-cong-tac-ai-checklist-1",
            title: "Tự đánh giá trước khi nộp kết quả",
            type: "CHECKLIST",
            sortOrder: 1,
            payload: checklistPayloadSchema.parse({
              items: [
                {
                  id: "purposeful",
                  label: "Tôi đã hỏi có chủ đích",
                  detail:
                    "Câu hỏi gửi AI dựa trên tư duy đã có sẵn, không phải suy nghĩ đầu tiên nảy ra.",
                },
                {
                  id: "cross-check",
                  label: "Tôi đã so sánh/kiểm chứng",
                  detail:
                    "Đối chiếu câu trả lời của AI với ít nhất một nguồn hoặc góc nhìn khác.",
                },
                {
                  id: "own-result",
                  label: "Tôi chịu trách nhiệm cho kết quả",
                  detail:
                    "Tôi hiểu và có thể giải thích kết quả cuối cùng bằng lời của chính mình.",
                },
              ],
            }),
          },
        ],
      },
    ],
  },
]

export async function seedLearningCatalog() {
  for (const track of learningCatalogSeed) {
    const trackRow = await prisma.track.upsert({
      where: { slug: track.slug },
      create: {
        slug: track.slug,
        title: track.title,
        description: track.description,
        sortOrder: track.sortOrder,
      },
      update: {
        title: track.title,
        description: track.description,
        sortOrder: track.sortOrder,
      },
    })

    for (const trackModule of track.modules) {
      const moduleRow = await prisma.module.upsert({
        where: { slug: trackModule.slug },
        create: {
          slug: trackModule.slug,
          title: trackModule.title,
          description: trackModule.description,
          sortOrder: trackModule.sortOrder,
          trackId: trackRow.id,
        },
        update: {
          title: trackModule.title,
          description: trackModule.description,
          sortOrder: trackModule.sortOrder,
          trackId: trackRow.id,
        },
      })

      for (const activity of trackModule.activities) {
        await prisma.activity.upsert({
          where: { slug: activity.slug },
          create: {
            slug: activity.slug,
            title: activity.title,
            type: activity.type,
            sortOrder: activity.sortOrder,
            active: activity.active ?? true,
            payload: activity.payload,
            moduleId: moduleRow.id,
          },
          update: {
            title: activity.title,
            type: activity.type,
            sortOrder: activity.sortOrder,
            active: activity.active ?? true,
            payload: activity.payload,
            moduleId: moduleRow.id,
          },
        })
      }
    }
  }
}
