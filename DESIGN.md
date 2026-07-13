---
name: "Think First, AI Later"
description: "Hành trình thực hành giúp người học giữ quyền quyết định khi làm việc cùng AI."
colors:
  horizon-blue: "#075FD8"
  horizon-blue-deep: "#064FAB"
  electric-sky: "#19B9FF"
  sunrise-orange: "#FF6B00"
  sunrise-ink: "#A83B00"
  harvest-gold: "#FFB000"
  midnight-navigation: "#031A3A"
  cloud-field: "#F6FAFF"
  white-surface: "#FFFFFF"
  muted-ink: "#34506F"
  soft-ink: "#49627E"
  boundary-line: "#CBDCED"
  sky-wash: "#E7F7FF"
  sunrise-wash: "#FFF0E5"
typography:
  display:
    fontFamily: "Be Vietnam Pro, sans-serif"
    fontSize: "clamp(3rem, 6vw, 6rem)"
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Be Vietnam Pro, sans-serif"
    fontSize: "clamp(2rem, 4vw, 4rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Be Vietnam Pro, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Be Vietnam Pro, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "normal"
  label:
    fontFamily: "Space Grotesk, monospace"
    fontSize: "0.7rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.12em"
rounded:
  control: "12px"
  container: "16px"
  signature: "16px 16px 16px 4px"
  pill: "999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  section: "48px"
components:
  button-primary:
    backgroundColor: "{colors.horizon-blue}"
    textColor: "{colors.white-surface}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.horizon-blue-deep}"
    textColor: "{colors.white-surface}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
    height: "44px"
  button-outline:
    backgroundColor: "{colors.white-surface}"
    textColor: "{colors.midnight-navigation}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
    height: "44px"
  input-default:
    backgroundColor: "{colors.white-surface}"
    textColor: "{colors.midnight-navigation}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
  navigation-active:
    backgroundColor: "{colors.sky-wash}"
    textColor: "{colors.horizon-blue}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
---

# Hệ thống thiết kế: Think First, AI Later

## Overview

**Creative North Star: “Hành trình giữ tay lái”**

Hệ thống hình ảnh biến việc học cùng AI thành một hành trình có phương hướng: xanh chân trời đại diện cho tư duy và định hướng, cam bình minh đánh dấu thành quả và điểm chuyển tiếp. Bề mặt sáng, chữ đậm và khoảng thở rộng giúp người học tập trung vào một nhiệm vụ có ý nghĩa tại mỗi thời điểm.

Không khí phải rõ ràng, khích lệ và trưởng thành. Hình ảnh con đường, đường chân trời và tiến trình chỉ xuất hiện khi chúng giải thích vị trí hoặc bước tiếp theo; chúng không phải đồ trang trí. Hệ thống từ chối dashboard SaaS chung chung, game hóa trẻ con và việc biến mọi nội dung thành thẻ.

**Đặc trưng chính:**

- Một nhiệm vụ chính nổi bật trên mỗi màn hình sản phẩm.
- Nhận diện xanh–cam lấy trực tiếp từ `background.png`.
- Bề mặt sáng, đường biên rõ và chiều sâu tiết chế.
- Typography tiếng Việt chắc chắn, dễ đọc và có nhịp.
- Trạng thái luôn có nhãn hoặc nội dung, không phụ thuộc riêng vào màu.

## Colors

Bảng màu kể một chuyển động có chủ đích từ tư duy xanh sang hành động cam; nền và chữ giữ độ tương phản để màu thương hiệu không lấn át nội dung.

### Primary

- **Xanh Chân Trời:** màu hành động chính, liên kết, focus và trạng thái đang hoạt động.
- **Xanh Chân Trời Sâu:** trạng thái hover của hành động chính; không dùng như một màu trang trí thứ hai.

### Secondary

- **Cam Bình Minh:** mốc thành quả, khu vực vận hành và thời điểm chuyển từ học sang nhận thưởng.
- **Cam Mực:** chữ cam trên bề mặt sáng khi cần đạt tương phản đọc được.
- **Vàng Mùa Gặt:** biểu đạt lúa và phần thưởng; không thay thế màu hành động chính.

### Tertiary

- **Xanh Trời Điện:** focus, chỉ dẫn hành trình trên nền tối và chi tiết phản hồi nhỏ.

### Neutral

- **Xanh Đêm Điều Hướng:** chữ chính và bề mặt tối có chủ đích.
- **Trắng Mây:** nền ứng dụng dịu, mang sắc xanh của thương hiệu thay vì nền kem mặc định.
- **Bề Mặt Trắng:** form và vùng nội dung cần tách khỏi nền.
- **Mực Dịu / Mực Mềm:** nội dung phụ theo hai cấp; Mực Dịu dành cho đoạn văn, Mực Mềm dành cho metadata.
- **Đường Ranh:** đường chia, border và nền progress chưa hoàn thành.
- **Lớp Trời Nhạt / Lớp Bình Minh Nhạt:** nền trạng thái có sắc thương hiệu.

**Quy tắc Một Hướng.** Xanh dẫn hành động và điều hướng; cam xác nhận thành quả hoặc chuyển vùng. Không để hai màu cùng tranh vai CTA chính.

**Quy tắc Tương Phản.** Chữ thường luôn đạt tối thiểu 4.5:1. Cam tươi không được dùng cho chữ nhỏ trên nền trắng; dùng Cam Mực.

## Typography

**Display Font:** Be Vietnam Pro, sans-serif  
**Body Font:** Be Vietnam Pro, sans-serif  
**Label/Mono Font:** Space Grotesk, monospace

**Đặc tính:** Be Vietnam Pro mang giọng nói hiện đại, chắc và tự nhiên với tiếng Việt. Space Grotesk chỉ phục vụ dữ liệu ngắn, bước hành trình và nhãn tiện ích Latin; không dùng cho đoạn văn tiếng Việt dài.

### Hierarchy

- **Display** (700, `clamp(3rem, 6vw, 6rem)`, 0.98): chỉ dành cho hero; luôn cân dòng và không siết chữ quá `-0.04em`.
- **Headline** (700, `clamp(2rem, 4vw, 4rem)`, 1.05): tiêu đề trang và section chính.
- **Title** (700, `1.25rem`, 1.3): nhiệm vụ, nhóm nội dung và tiêu đề component.
- **Body** (400, `1rem`, 1.7): nội dung giải thích; chiều dài dòng tối đa 70 ký tự.
- **Label** (700, `0.7rem`, `0.12em`, viết hoa có chọn lọc): dữ liệu, trạng thái ngắn hoặc bước tuần tự thật sự.

**Quy tắc Tiếng Việt Trước.** Không dùng Space Grotesk cho câu tiếng Việt dài và không dùng viết hoa giãn chữ như một eyebrow lặp lại trên mọi section.

**Quy tắc Không Chật Chữ.** Tracking của display tuyệt đối không nhỏ hơn `-0.04em`; tiêu đề phải được kiểm tra ở mobile trước khi tăng cỡ chữ.

## Elevation

Hệ thống phẳng theo mặc định. Phân cấp đến từ màu nền, khoảng cách và đường ranh; bóng đổ chỉ dành cho ảnh hero, shell nổi hoặc hành động chính cần tách khỏi nền. Surface có border không được đồng thời mang bóng rộng để tạo “ghost card”.

### Shadow Vocabulary

- **Điều hướng môi trường** (`0 8px 8px rgba(3, 26, 58, 0.05)`): bóng ngắn cho header cố định hoặc shell điều hướng.
- **Hành động chính** (`0 6px 8px rgba(7, 95, 216, 0.18)`): nhấn CTA chính; bỏ bóng khi component đã có border.
- **Hình ảnh chủ đạo** (`0 20px 48px rgba(3, 26, 58, 0.18)`): chỉ dành cho ảnh hero hoặc panel hình ảnh duy nhất trên màn hình.

**Quy tắc Phẳng Mặc Định.** Nếu có thể diễn đạt phân cấp bằng khoảng cách hoặc màu nền, bóng đổ bị cấm.

## Components

Component phải chắc chắn, trực tiếp và có vùng chạm rộng. Một component chỉ được tạo container khi ranh giới đó giúp người dùng hiểu nhóm, trạng thái hoặc khả năng tương tác.

### Buttons

- **Hình dạng:** bo vừa (`12px`), cao tối thiểu `44px`, padding ngang `20px`.
- **Primary:** Xanh Chân Trời trên chữ trắng, chỉ dùng cho hành động quan trọng nhất trong vùng nhìn hiện tại.
- **Hover / Focus:** hover chuyển sang Xanh Chân Trời Sâu; focus ring `2px` Xanh Trời Điện với offset rõ; active dịch xuống tối đa `1px`.
- **Outline / Ghost:** outline dùng bề mặt trắng và đường ranh; ghost dành cho hành động phụ trong thanh điều hướng, không dùng để che giấu CTA quan trọng.

### Chips

- **Kiểu dáng:** pill chỉ dành cho trạng thái ngắn như “Việc tiếp theo” hoặc tiến độ; nền Lớp Trời Nhạt và chữ Xanh Chân Trời.
- **Trạng thái:** luôn có nội dung văn bản; không dùng chấm màu đơn độc.

### Cards / Containers

- **Góc:** container thường tối đa `16px`; góc chữ ký `16px 16px 16px 4px` chỉ dùng tiết chế để gợi hướng đi.
- **Nền:** trắng cho nhóm tương tác, Lớp Trời Nhạt hoặc Lớp Bình Minh Nhạt cho trạng thái.
- **Bóng:** mặc định không có; dùng border Đường Ranh hoặc khác biệt nền, không dùng cả border và bóng rộng.
- **Khoảng trong:** `24px` trên desktop và `16px` trên mobile.

### Inputs / Fields

- **Kiểu dáng:** cao tối thiểu `44px`, nền trắng, border Đường Ranh, radius `12px`, padding ngang `16px`.
- **Focus:** border Xanh Chân Trời và ring cùng màu ở opacity thấp; không làm thay đổi kích thước layout.
- **Lỗi / Disabled:** lỗi có nội dung giải thích bằng chữ; disabled giảm opacity nhưng vẫn giữ nhãn đọc được.

### Navigation

Điều hướng dùng Be Vietnam Pro đậm vừa, vùng chạm tối thiểu `40px`. Trạng thái active kết hợp nền Lớp Trời Nhạt, chữ Xanh Chân Trời và `aria-current`; mobile cho phép xuống hàng thành một hàng điều hướng đầy đủ thay vì thu nhỏ chữ.

### Hành trình học

Hành trình là component chữ ký: các bước có thứ tự thật, nối bằng trục tiến trình và ghi rõ trạng thái đã xong, hiện tại hoặc sắp tới. Nó không được dùng như một timeline trang trí cho nội dung không có thứ tự.

## Do's and Don'ts

### Do:

- **Do** dùng Xanh Chân Trời cho hành động và Cam Bình Minh cho thành quả theo Quy tắc Một Hướng.
- **Do** ưu tiên một nhiệm vụ chính, đầu ra rõ và bước tiếp theo trên mỗi màn hình.
- **Do** giữ vùng chạm tối thiểu `44px`, focus ring `2px` và tương phản WCAG 2.2 AA.
- **Do** dùng khoảng cách `16/24/32/48px` để tạo nhịp trước khi thêm container hoặc bóng đổ.
- **Do** kết hợp màu với nhãn, biểu tượng hoặc mô tả trạng thái.

### Don't:

- **Don't** tạo dashboard SaaS chung chung với các khối thống kê và thẻ lặp lại nhưng thiếu một nhiệm vụ chính rõ ràng.
- **Don't** dùng game hóa trẻ con, nhân vật hoạt hình hoặc phần thưởng lấn át mục tiêu hình thành năng lực.
- **Don't** phụ thuộc vào gradient, hiệu ứng kính, bóng đổ rộng hoặc quá nhiều thẻ bo tròn để tạo cảm giác hiện đại.
- **Don't** biến sản phẩm thành thư viện nội dung dài buộc người học tự đoán thứ tự và bước tiếp theo.
- **Don't** truyền đạt trạng thái chỉ bằng màu hoặc chuyển động.
- **Don't** dùng gradient text, border sọc màu một bên, card radius lớn hơn `16px`, hoặc ghép border với shadow blur từ `16px` trở lên.
- **Don't** lặp eyebrow viết hoa giãn chữ hay số thứ tự nếu nội dung không phải một chuỗi thực sự.

