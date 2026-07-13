type SystemLogEvent = "system.cold_start" | "system.db_connection.failed"

/**
 * Structured, PII-free system/cold-path observability log — same shape as
 * `logRewardEvent`/`logAuthEvent`/`logAdminEvent`. `meta` chỉ chứa thông tin
 * kỹ thuật không định danh người dùng (ví dụ: message lỗi kết nối, không có
 * connection string/secret).
 */
export function logSystemEvent(
  event: SystemLogEvent,
  meta?: Record<string, string | number>,
) {
  console.log(JSON.stringify({ event, ts: new Date().toISOString(), ...meta }))
}
