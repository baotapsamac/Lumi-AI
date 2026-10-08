export type AiMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export async function requestAiText(
  messages: AiMessage[],
  endpoint: string,
  token: string,
  model: string,
  temperature?: number
): Promise<string> {
  if (!endpoint.trim() || !model.trim()) throw new Error('Vui lòng nhập API Endpoint và tên mô hình.');
  if (!token.trim()) throw new Error('Vui lòng nhập API key. Với máy chủ nội bộ, dùng khóa giả nếu máy chủ yêu cầu.');
  const url = endpoint.trim().replace(/\/+$/, '');
  const selectedModel = model.trim();
  if (!/^https:\/\//i.test(url) && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(url)) {
    throw new Error('Chỉ cho phép HTTPS hoặc HTTP trên localhost để bảo vệ API key.');
  }
  const body: Record<string, unknown> = { model: selectedModel, messages };
  if (temperature !== undefined) body.temperature = temperature;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 700);
    if (response.status === 429) throw new Error(`API 429: Hết hạn mức hoặc vượt giới hạn tốc độ. ${detail}`);
    throw new Error(`API ${response.status}: ${detail}`);
  }
  const data = await response.json();
  const result = data.choices?.[0]?.message?.content;
  if (typeof result !== 'string' || !result.trim()) throw new Error('AI không trả về nội dung văn bản.');
  return result;
}
