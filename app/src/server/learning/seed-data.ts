/**
 * Learning catalog seed data + upsert logic (Phase 4). Extracted from
 * `prisma/seed.ts` so the same idempotent seeding logic is reusable from the
 * integration test that proves running it twice does not create duplicates.
 *
 * Every Track/Module/Activity is `upsert`-ed by its stable `slug`. Content is
 * a "golden learning path": 3 tracks, 3 modules each, real (non-placeholder)
 * LESSON/QUIZ/CHECKLIST activities that build on one another within a track —
 * enough to make the catalog and track-detail views feel like a real
 * curriculum, not a full production course. One activity is seeded
 * `active: false` on purpose, so tests/manual checks can confirm inactive
 * content stays hidden from the catalog.
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
          "Sau chủ đề này, bạn biết tách dữ kiện, giả định và điều chưa biết để viết câu hỏi có thể kiểm chứng.",
        sortOrder: 0,
        activities: [
          {
            slug: "dat-cau-hoi-tot-bai-1-tach-du-kien",
            title: "Tách dữ kiện và giả định",
            type: "LESSON",
            sortOrder: 0,
            payload: lessonPayloadSchema.parse({
              body: "Trước khi hỏi AI, hãy viết ra 3 cột: (1) Dữ kiện — điều bạn chắc chắn đúng; (2) Giả định — điều bạn đang mặc định nhưng chưa kiểm chứng; (3) Điều chưa biết — câu hỏi thật sự cần lời giải. Phần lớn câu hỏi tệ là do nhầm giả định với dữ kiện. Khi đã tách rõ, câu hỏi gửi cho AI sẽ ngắn hơn và chính xác hơn rất nhiều.",
              objective:
                "Phân biệt điều đã biết với điều đang đoán trước khi nhờ AI hỗ trợ.",
              example: {
                before: "App chậm chắc do database. Hãy sửa giúp tôi.",
                after:
                  "Dữ kiện: API /orders tăng từ 300 ms lên 2 giây. Giả định: database là nút thắt. Điều chưa biết: bước nào chiếm thời gian? Hãy đề xuất cách kiểm chứng giả định này từ log và query plan.",
              },
              practice: {
                prompt: "Chọn một vấn đề bạn đang vướng và chia thành ba cột.",
                steps: [
                  "Viết 2 dữ kiện có thể chỉ ra nguồn kiểm chứng.",
                  "Khoanh 1 giả định bạn chưa có bằng chứng.",
                  "Đổi điều chưa biết thành một câu hỏi cụ thể cho AI.",
                ],
              },
              takeaway:
                "Câu hỏi tốt bắt đầu bằng việc không gọi giả định là dữ kiện.",
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
      {
        slug: "dat-cau-hoi-tot-rang-buoc",
        title: "Thêm ràng buộc và ngữ cảnh",
        description:
          "Sau chủ đề này, bạn biết thêm ràng buộc, ngữ cảnh và định dạng đầu ra để câu trả lời của AI dùng được ngay, không phải hỏi lại nhiều lần.",
        sortOrder: 1,
        activities: [
          {
            slug: "dat-cau-hoi-tot-bai-2-rang-buoc",
            title: "Thêm ràng buộc để câu trả lời dùng được ngay",
            type: "LESSON",
            sortOrder: 0,
            payload: lessonPayloadSchema.parse({
              body: "Một câu hỏi không có ràng buộc buộc AI phải đoán: đoán độ dài, đoán văn phong, đoán bạn đã biết gì rồi. Trước khi gửi câu hỏi, thêm 4 điều: (1) Ai sẽ đọc câu trả lời; (2) Định dạng mong muốn (đoạn văn, bảng, danh sách bước); (3) Giới hạn (độ dài, công nghệ, ngân sách); (4) Điều không nên làm. Bốn ràng buộc này biến một câu hỏi mơ hồ thành một yêu cầu có thể chấm được đúng/sai.",
              objective:
                "Thêm ràng buộc cụ thể để nhận câu trả lời dùng được ngay, không phải bản nháp cần sửa lại.",
              example: {
                before: "Viết cho tôi một email xin lỗi khách hàng.",
                after:
                  "Khách hàng bị giao hàng trễ 3 ngày do lỗi vận chuyển. Viết email xin lỗi dài tối đa 120 từ, giọng chuyên nghiệp nhưng không xin lỗi thái quá, có đề xuất một hình thức bù đắp cụ thể, không nhắc đến lỗi nội bộ của công ty.",
              },
              practice: {
                prompt: "Lấy một câu hỏi bạn từng gửi AI và thêm 4 ràng buộc.",
                steps: [
                  "Ghi rõ ai sẽ dùng kết quả này.",
                  "Chọn định dạng đầu ra cụ thể (bảng, danh sách, đoạn văn ngắn).",
                  "Thêm một giới hạn thật (độ dài, công cụ, thời gian).",
                  "Ghi rõ một điều bạn không muốn AI làm.",
                ],
              },
              takeaway:
                "Ràng buộc không giới hạn AI — nó giúp AI nhắm đúng thứ bạn cần ngay lần đầu.",
            }),
          },
          {
            slug: "dat-cau-hoi-tot-quiz-2",
            title: "Kiểm tra nhanh: Ràng buộc còn thiếu",
            type: "QUIZ",
            sortOrder: 1,
            payload: quizPayloadSchema.parse({
              question:
                '"Viết cho tôi một bài đăng về sản phẩm mới." Ràng buộc nào sau đây quan trọng nhất còn thiếu?',
              options: [
                { id: "length", text: "Không có giới hạn độ dài hoặc nền tảng đăng" },
                { id: "grammar", text: "Không có yêu cầu về chính tả" },
                { id: "emoji", text: "Không nói rõ có dùng emoji hay không" },
              ],
              correctOptionId: "length",
              explanation:
                "Nền tảng đăng (Facebook, LinkedIn, email nội bộ) và độ dài quyết định gần như toàn bộ văn phong và cấu trúc bài viết — thiếu nó, AI phải đoán và khả năng sai rất cao. Chính tả và emoji là chi tiết nhỏ hơn nhiều.",
            }),
          },
          {
            slug: "dat-cau-hoi-tot-checklist-2",
            title: "Tự kiểm tra ràng buộc trước khi gửi",
            type: "CHECKLIST",
            sortOrder: 2,
            payload: checklistPayloadSchema.parse({
              items: [
                {
                  id: "audience",
                  label: "Tôi đã nói rõ đối tượng đọc",
                  detail: "AI biết đang viết cho ai để chọn văn phong phù hợp.",
                },
                {
                  id: "format",
                  label: "Tôi đã chọn định dạng đầu ra",
                  detail: "Bảng, danh sách bước hay đoạn văn — nói rõ thay vì để AI tự chọn.",
                },
                {
                  id: "limit",
                  label: "Tôi đã thêm ít nhất một giới hạn thật",
                  detail: "Độ dài, công nghệ được phép dùng, hoặc thời hạn.",
                },
              ],
            }),
          },
        ],
      },
      {
        slug: "dat-cau-hoi-tot-tiep-noi",
        title: "Đặt câu hỏi tiếp nối",
        description:
          "Sau chủ đề này, bạn biết đặt câu hỏi tiếp nối để thu hẹp một câu trả lời mơ hồ thành thứ dùng được, thay vì hỏi lại từ đầu.",
        sortOrder: 2,
        activities: [
          {
            slug: "dat-cau-hoi-tot-bai-3-tiep-noi",
            title: "Thu hẹp câu trả lời mơ hồ bằng câu hỏi tiếp nối",
            type: "LESSON",
            sortOrder: 0,
            payload: lessonPayloadSchema.parse({
              body: 'Khi câu trả lời của AI còn mơ hồ, phản xạ phổ biến nhất là viết lại toàn bộ câu hỏi từ đầu — điều này lãng phí và thường ra kết quả tệ hơn. Thay vào đó, hãy chỉ đúng phần mơ hồ và hỏi tiếp: "Ở bước 2 bạn nói X, cụ thể là gì?" hoặc "Giả sử Y không đúng thì cách này còn ổn không?". Câu hỏi tiếp nối giữ nguyên ngữ cảnh đã có, chỉ khoan sâu vào đúng điểm bạn chưa chắc.',
              objective:
                "Dùng câu hỏi tiếp nối để khoan sâu vào phần mơ hồ, không phải hỏi lại từ đầu.",
              example: {
                before:
                  "(Sau khi AI trả lời chung) Có thể giải thích lại rõ hơn không?",
                after:
                  "Ở gợi ý thứ 2 bạn giả định traffic tăng đều — nếu traffic tăng đột biến theo giờ thì gợi ý đó còn đúng không? Nếu không, phương án nào thay thế?",
              },
              practice: {
                prompt: "Tìm một câu trả lời AI gần đây còn mơ hồ với bạn.",
                steps: [
                  "Khoanh đúng một câu hoặc một giả định còn mơ hồ.",
                  "Viết câu hỏi tiếp nối nhắc lại đúng phần đó, không viết lại toàn bộ.",
                  "Yêu cầu AI xác nhận hoặc sửa lại phần đó thay vì trả lời lại từ đầu.",
                ],
              },
              takeaway:
                "Câu hỏi tiếp nối tiết kiệm ngữ cảnh và cho câu trả lời sắc hơn một câu hỏi viết lại từ đầu.",
            }),
          },
          {
            slug: "dat-cau-hoi-tot-quiz-3",
            title: "Kiểm tra nhanh: Câu hỏi tiếp nối tốt",
            type: "QUIZ",
            sortOrder: 1,
            payload: quizPayloadSchema.parse({
              question:
                "AI vừa đề xuất 3 cách tối ưu chi phí nhưng không nói cách nào rủi ro nhất. Câu hỏi tiếp nối nào tốt nhất?",
              options: [
                {
                  id: "restart",
                  text: "Viết lại từ đầu: hãy tối ưu chi phí cho tôi",
                },
                {
                  id: "focus",
                  text: "Trong 3 cách trên, cách nào rủi ro nhất và vì sao?",
                },
                { id: "vague", text: "Trả lời hay đó, còn gì thêm không?" },
              ],
              correctOptionId: "focus",
              explanation:
                "Câu hỏi tiếp nối tốt giữ nguyên ngữ cảnh (3 cách đã có) và khoan đúng vào phần còn thiếu (mức rủi ro), thay vì viết lại từ đầu hoặc hỏi mơ hồ không có hướng cụ thể.",
            }),
          },
          {
            slug: "dat-cau-hoi-tot-checklist-3",
            title: "Tự đánh giá trước khi chấp nhận câu trả lời",
            type: "CHECKLIST",
            sortOrder: 2,
            payload: checklistPayloadSchema.parse({
              items: [
                {
                  id: "no-vague-left",
                  label: "Không còn phần nào tôi thấy mơ hồ",
                  detail: "Mọi giả định quan trọng trong câu trả lời đã được hỏi lại và làm rõ.",
                },
                {
                  id: "context-kept",
                  label: "Tôi đã giữ ngữ cảnh khi hỏi tiếp",
                  detail: "Câu hỏi tiếp nối nhắc đúng phần cần làm rõ, không viết lại từ đầu.",
                },
              ],
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
          "Sau chủ đề này, bạn biết trình bày kết luận, lý do và bằng chứng để AI phản biện đúng điểm yếu.",
        sortOrder: 0,
        activities: [
          {
            slug: "tu-duy-kiem-chung-bai-1",
            title: "Lập luận trước khi hỏi",
            type: "LESSON",
            sortOrder: 0,
            payload: lessonPayloadSchema.parse({
              body: 'Một lập luận tốt có 3 phần: kết luận, lý do, và bằng chứng. Trước khi mở AI, hãy tự viết ra cả ba phần này cho vấn đề của bạn — dù chỉ 2-3 câu. Sau đó, đưa lập luận đó cho AI và yêu cầu nó tìm điểm yếu, thay vì hỏi thẳng "đáp án là gì". Cách này giữ cho tư duy vẫn là của bạn, AI chỉ đóng vai trò kiểm chứng.',
              objective:
                "Tạo một lập luận đủ rõ để AI có thể phản biện thay vì chỉ đồng tình.",
              example: {
                before: "Có nên dời deadline không? Hãy quyết định giúp tôi.",
                after:
                  "Kết luận của tôi: nên dời deadline 2 ngày. Lý do: lỗi thanh toán còn chưa có regression test. Bằng chứng: 3/10 case đang fail. Hãy chỉ ra giả định yếu nhất và một phương án không cần dời deadline.",
              },
              practice: {
                prompt:
                  "Viết một quyết định công việc dưới dạng lập luận ba phần.",
                steps: [
                  "Nêu kết luận của bạn trong một câu.",
                  "Thêm lý do và bằng chứng có thể kiểm tra.",
                  "Yêu cầu AI tìm phản ví dụ hoặc điều kiện khiến kết luận sai.",
                ],
              },
              takeaway:
                "Tự đưa ra lập luận trước; dùng AI để tìm lỗ hổng, không để AI nghĩ thay.",
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
      {
        slug: "tu-duy-kiem-chung-diem-yeu",
        title: "Tìm điểm yếu trong lập luận",
        description:
          "Sau chủ đề này, bạn biết tự tìm giả định yếu nhất và phản ví dụ trong lập luận của mình trước khi nhờ AI chỉ ra.",
        sortOrder: 1,
        activities: [
          {
            slug: "tu-duy-kiem-chung-bai-2",
            title: "Tự đóng vai người phản biện trước",
            type: "LESSON",
            sortOrder: 0,
            payload: lessonPayloadSchema.parse({
              body: 'Trước khi đưa lập luận cho AI, hãy tự hỏi: "Điều gì sẽ chứng minh kết luận này sai?" Nếu bạn không trả lời được, lập luận có thể chưa đủ cụ thể để kiểm chứng. Sau đó, khoanh giả định yếu nhất — thường là giả định bạn tin nhiều nhất nhưng kiểm tra ít nhất. Tự làm bước này trước giúp bạn không phụ thuộc hoàn toàn vào AI để tìm lỗ hổng, và khi AI chỉ ra điểm khác, bạn dễ nhận ra AI đúng hay chỉ đang đoán.',
              objective:
                "Tự xác định giả định yếu nhất trong lập luận của mình trước khi nhờ AI phản biện.",
              example: {
                before: "Tính năng này chắc sẽ được dùng nhiều vì giao diện đẹp.",
                after:
                  "Giả định yếu nhất: 'giao diện đẹp' dẫn đến 'dùng nhiều' — chưa có dữ liệu nào chứng minh mối liên hệ này. Điều sẽ chứng minh tôi sai: người dùng thử rồi bỏ vì thiếu tính năng cốt lõi, bất kể giao diện.",
              },
              practice: {
                prompt: "Chọn một kết luận bạn đang tin và tự phản biện trước.",
                steps: [
                  'Viết câu trả lời cho: "điều gì sẽ chứng minh kết luận này sai?"',
                  "Khoanh giả định bạn tin nhiều nhất nhưng kiểm tra ít nhất.",
                  "Chỉ sau đó mới đưa lập luận cho AI để đối chiếu với điểm bạn vừa tìm.",
                ],
              },
              takeaway:
                "Tự tìm điểm yếu trước giúp bạn phân biệt được khi AI phản biện đúng và khi AI chỉ đang đoán.",
            }),
          },
          {
            slug: "tu-duy-kiem-chung-quiz-2",
            title: "Kiểm tra nhanh: Giả định yếu nhất",
            type: "QUIZ",
            sortOrder: 1,
            payload: quizPayloadSchema.parse({
              question:
                '"Đối thủ vừa giảm giá 20%, chúng ta nên giảm giá theo ngay để không mất khách." Giả định yếu nhất ở đây là gì?',
              options: [
                {
                  id: "price-sensitive",
                  text: "Khách hàng rời đi chủ yếu vì giá, không vì lý do khác",
                },
                { id: "competitor-real", text: "Đối thủ thực sự đã giảm giá 20%" },
                { id: "discount-exists", text: "Giảm giá là một chiến lược có thể thực hiện được" },
              ],
              correctOptionId: "price-sensitive",
              explanation:
                "Giả định 'khách rời đi vì giá' là điều chưa được kiểm chứng và có nhiều nguyên nhân khác có thể quan trọng hơn (chất lượng, dịch vụ, thói quen) — đây là giả định yếu nhất, đáng kiểm tra trước khi hành động theo nó.",
            }),
          },
          {
            slug: "tu-duy-kiem-chung-checklist-1",
            title: "Tự kiểm tra lập luận trước khi hoàn tất",
            type: "CHECKLIST",
            sortOrder: 2,
            payload: checklistPayloadSchema.parse({
              items: [
                {
                  id: "falsifiable",
                  label: "Tôi biết điều gì sẽ chứng minh mình sai",
                  detail: "Nếu không trả lời được, kết luận có thể chưa đủ cụ thể.",
                },
                {
                  id: "weakest-assumption",
                  label: "Tôi đã khoanh giả định yếu nhất",
                  detail: "Giả định tin nhiều nhất nhưng kiểm tra ít nhất trong lập luận.",
                },
              ],
            }),
          },
        ],
      },
      {
        slug: "tu-duy-kiem-chung-doi-chieu",
        title: "Đối chiếu nhiều nguồn",
        description:
          "Sau chủ đề này, bạn biết đối chiếu câu trả lời AI với ít nhất một nguồn độc lập trước khi tin và sử dụng cho quyết định quan trọng.",
        sortOrder: 2,
        activities: [
          {
            slug: "tu-duy-kiem-chung-bai-3",
            title: "Không dừng ở một câu trả lời AI duy nhất",
            type: "LESSON",
            sortOrder: 0,
            payload: lessonPayloadSchema.parse({
              body: "Với quyết định có hậu quả thật (tiền, sức khoẻ, hợp đồng, code chạy trên production), một câu trả lời AI duy nhất không đủ để tin. Đối chiếu bằng một trong ba cách: (1) Nguồn độc lập — tài liệu chính thức, số liệu thật; (2) Góc nhìn thứ hai — hỏi lại AI với cách đặt vấn đề khác để xem có ra kết luận giống nhau; (3) Kiểm tra thực tế nhỏ — chạy thử, đo thử trước khi áp dụng toàn bộ. Việc quan trọng hơn thì cần đối chiếu kỹ hơn, không phải mọi câu hỏi đều cần cả ba cách.",
              objective:
                "Chọn đúng mức đối chiếu cần thiết theo hậu quả thật của quyết định.",
              example: {
                before:
                  "AI nói đoạn code này an toàn để chạy trên production nên tôi deploy luôn.",
                after:
                  "AI nói đoạn code an toàn. Tôi đối chiếu bằng cách chạy test trên staging và tự đọc lại phần xử lý lỗi trước khi deploy — vì đây là thay đổi ảnh hưởng thanh toán, mức rủi ro cao.",
              },
              practice: {
                prompt: "Chọn một quyết định có hậu quả thật bạn đang cân nhắc.",
                steps: [
                  "Ước lượng mức hậu quả nếu câu trả lời AI sai.",
                  "Chọn một cách đối chiếu phù hợp với mức hậu quả đó.",
                  "Ghi lại kết quả đối chiếu trước khi quyết định dùng hay không.",
                ],
              },
              takeaway:
                "Mức đối chiếu cần thiết tăng theo hậu quả thật của quyết định, không phải theo độ tự tin của câu trả lời AI.",
            }),
          },
          {
            slug: "tu-duy-kiem-chung-quiz-3",
            title: "Kiểm tra nhanh: Chọn cách đối chiếu phù hợp",
            type: "QUIZ",
            sortOrder: 1,
            payload: quizPayloadSchema.parse({
              question:
                "AI gợi ý một liều lượng thực phẩm bổ sung cho bạn dùng hàng ngày. Cách đối chiếu phù hợp nhất là gì?",
              options: [
                {
                  id: "trust",
                  text: "Tin luôn vì AI trả lời rất tự tin và chi tiết",
                },
                {
                  id: "official",
                  text: "Đối chiếu với hướng dẫn chính thức hoặc hỏi ý kiến người có chuyên môn",
                },
                { id: "reask", text: "Hỏi lại AI cùng một câu để xem có trả lời giống không" },
              ],
              correctOptionId: "official",
              explanation:
                "Sức khoẻ là hậu quả thật và nghiêm trọng — mức đối chiếu cần cao nhất: nguồn chính thức hoặc chuyên môn thật, không chỉ hỏi lại AI cùng một nguồn kiến thức.",
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
          "Sau chủ đề này, bạn biết hỏi có chủ đích, kiểm tra chéo và tự chịu trách nhiệm trước khi dùng kết quả AI.",
        sortOrder: 0,
        activities: [
          {
            slug: "quy-trinh-cong-tac-ai-bai-1",
            title: "Ba bước cộng tác với AI",
            type: "LESSON",
            sortOrder: 0,
            payload: lessonPayloadSchema.parse({
              body: "Quy trình gợi ý: (1) Hỏi có chủ đích — đã tự nghĩ trước, câu hỏi rõ ràng; (2) So sánh — nếu có thể, hỏi từ hai góc nhìn khác nhau hoặc tự kiểm tra chéo với nguồn khác; (3) Chịu trách nhiệm — bạn là người quyết định dùng hay bỏ câu trả lời, không phải AI. Lặp lại quy trình này biến AI thành một cộng sự đáng tin, thay vì một hộp đen bạn phải tin tưởng mù quáng.",
              objective:
                "Dùng một quy trình lặp lại được để biến đầu ra AI thành quyết định có kiểm chứng.",
              example: {
                before: "AI đưa đoạn code chạy được nên tôi merge luôn.",
                after:
                  "Tôi nêu rõ ràng buộc, yêu cầu hai phương án, đối chiếu với tài liệu và test các nhánh lỗi trước khi tự quyết định merge.",
              },
              practice: {
                prompt: "Áp dụng ba bước cho một đầu ra AI bạn sắp sử dụng.",
                steps: [
                  "Ghi mục đích và ràng buộc trước khi hỏi.",
                  "So sánh câu trả lời với một nguồn hoặc một góc nhìn độc lập.",
                  "Ghi quyết định cuối cùng và bằng chứng khiến bạn chấp nhận nó.",
                ],
              },
              takeaway:
                "AI đề xuất; bạn kiểm chứng và chịu trách nhiệm cho quyết định cuối cùng.",
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
      {
        slug: "quy-trinh-cong-tac-ai-phan-vai",
        title: "Phân vai rõ giữa bạn và AI",
        description:
          "Sau chủ đề này, bạn biết phân vai: phần nào bạn tự quyết, phần nào AI chỉ hỗ trợ — để trách nhiệm không bị đổ nhầm chỗ.",
        sortOrder: 1,
        activities: [
          {
            slug: "quy-trinh-cong-tac-ai-bai-2",
            title: "Ai là người quyết định cuối cùng?",
            type: "LESSON",
            sortOrder: 0,
            payload: lessonPayloadSchema.parse({
              body: "Trước khi bắt đầu một việc có AI hỗ trợ, hãy xác định trước: việc này ai là 'người quyết' và AI chỉ là 'người hỗ trợ'. Với việc có hậu quả cao (merge code, gửi hợp đồng, chẩn đoán, quyết định tài chính), người quyết luôn phải là một người thật hiểu bối cảnh đầy đủ — AI có thể soạn, gợi ý, kiểm tra nhanh, nhưng không được là điểm dừng cuối cùng. Phân vai rõ từ đầu giúp tránh tình huống 'AI bảo vậy nên tôi làm vậy' khi có sự cố xảy ra.",
              objective:
                "Xác định trước ai là người quyết định cuối cùng cho một việc có AI hỗ trợ.",
              example: {
                before: "AI review code thấy ổn nên tôi merge thẳng vào production.",
                after:
                  "AI review giúp tôi phát hiện vài lỗi nhỏ, nhưng người quyết định merge vẫn là tôi — tôi tự chạy lại test suite và đọc phần thay đổi liên quan đến thanh toán trước khi merge.",
              },
              practice: {
                prompt: "Chọn một việc bạn đang làm cùng AI và phân vai rõ.",
                steps: [
                  "Ghi rõ việc này ai là người quyết định cuối cùng.",
                  "Ghi rõ AI được hỗ trợ phần nào, không được quyết phần nào.",
                  "Nếu có sự cố, ghi rõ ai là người chịu trách nhiệm giải trình.",
                ],
              },
              takeaway:
                "AI hỗ trợ nhiều việc, nhưng người quyết định cuối cùng cho việc có hậu quả cao vẫn phải là một người thật.",
            }),
          },
          {
            slug: "quy-trinh-cong-tac-ai-quiz-1",
            title: "Kiểm tra nhanh: Ai nên quyết định?",
            type: "QUIZ",
            sortOrder: 1,
            payload: quizPayloadSchema.parse({
              question:
                "AI đề xuất một điều khoản hợp đồng nghe hợp lý. Ai nên là người quyết định cuối cùng có dùng điều khoản đó không?",
              options: [
                { id: "ai", text: "AI, vì điều khoản đã được viết rõ ràng và hợp lý" },
                {
                  id: "person",
                  text: "Người hiểu bối cảnh pháp lý và hậu quả thật của hợp đồng",
                },
                { id: "whoever", text: "Ai đọc trước thì quyết trước cho nhanh" },
              ],
              correctOptionId: "person",
              explanation:
                "Hợp đồng có hậu quả pháp lý thật — người quyết định phải là người hiểu đủ bối cảnh và chịu trách nhiệm, AI chỉ hỗ trợ soạn và gợi ý, không phải điểm dừng cuối cùng.",
            }),
          },
          {
            slug: "quy-trinh-cong-tac-ai-checklist-2",
            title: "Tự kiểm tra phân vai trước khi bắt đầu",
            type: "CHECKLIST",
            sortOrder: 2,
            payload: checklistPayloadSchema.parse({
              items: [
                {
                  id: "decision-owner",
                  label: "Tôi đã xác định ai quyết định cuối cùng",
                  detail: "Ghi rõ trước khi bắt đầu, không để đến khi có sự cố mới hỏi.",
                },
                {
                  id: "ai-scope",
                  label: "Tôi đã giới hạn phạm vi hỗ trợ của AI",
                  detail: "AI được soạn/gợi ý/kiểm tra nhanh — không được là điểm dừng cuối cùng.",
                },
              ],
            }),
          },
        ],
      },
      {
        slug: "quy-trinh-cong-tac-ai-ghi-lai",
        title: "Ghi lại quyết định và lý do",
        description:
          "Sau chủ đề này, bạn biết ghi lại quyết định cuối cùng và lý do chấp nhận hay từ chối gợi ý AI, để tự chịu trách nhiệm và tra lại được về sau.",
        sortOrder: 2,
        activities: [
          {
            slug: "quy-trinh-cong-tac-ai-bai-3",
            title: "Một dòng ghi chú giúp bạn chịu trách nhiệm được",
            type: "LESSON",
            sortOrder: 0,
            payload: lessonPayloadSchema.parse({
              body: 'Ghi lại quyết định không cần dài: chỉ cần "AI gợi ý X, tôi chọn Y vì Z" là đủ để sau này bạn hoặc người khác hiểu vì sao. Thói quen này quan trọng nhất khi bạn TỪ CHỐI gợi ý của AI — ghi rõ lý do từ chối giúp bạn không quên bối cảnh, và nếu quyết định sai, bạn tra lại được lý do tại thời điểm đó thay vì đoán lại từ đầu.',
              objective:
                "Ghi lại ngắn gọn quyết định và lý do để có thể tự giải trình sau này.",
              example: {
                before: "(Không ghi gì, chỉ nhớ trong đầu là đã chọn cách A)",
                after:
                  "Ghi chú: AI gợi ý dùng thư viện X để xử lý ảnh, tôi chọn thư viện Y vì X chưa hỗ trợ định dạng ảnh chúng tôi cần — quyết định ngày 12/07.",
              },
              practice: {
                prompt: "Ghi lại một quyết định gần đây có AI hỗ trợ.",
                steps: [
                  "Ghi một câu: AI gợi ý gì.",
                  "Ghi một câu: bạn chọn gì và vì sao.",
                  "Nếu bạn từ chối gợi ý của AI, ghi rõ lý do từ chối.",
                ],
              },
              takeaway:
                "Một ghi chú ngắn về lý do quyết định đáng giá hơn nhiều một lời giải thích cố nhớ lại sau này.",
            }),
          },
          {
            slug: "quy-trinh-cong-tac-ai-quiz-2",
            title: "Kiểm tra nhanh: Ghi chú quyết định tốt",
            type: "QUIZ",
            sortOrder: 1,
            payload: quizPayloadSchema.parse({
              question: "Ghi chú quyết định nào sau đây hữu ích nhất để tra lại sau này?",
              options: [
                { id: "vague", text: "\"Đã dùng gợi ý của AI, ổn.\"" },
                {
                  id: "reasoned",
                  text: '"AI gợi ý cách A, tôi chọn cách B vì A không xử lý được trường hợp lỗi mạng — quyết định ngày hôm nay."',
                },
                { id: "none", text: "Không ghi gì, vì AI đã giải thích rõ trong lúc trò chuyện" },
              ],
              correctOptionId: "reasoned",
              explanation:
                "Ghi chú tốt nêu rõ gợi ý của AI, quyết định thật của bạn và lý do — đủ để tra lại mà không cần nhớ lại toàn bộ cuộc trò chuyện đã trôi qua.",
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
