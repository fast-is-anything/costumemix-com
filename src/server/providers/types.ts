import type { Style } from '#/config/site'

export type ProviderId = 'fal' | 'yir' | 'nanoapi' | 'mock'
export type Capability = 'video' | 'image'
export type ProviderMeta = Record<string, unknown>

// 视频与图片共用同一套状态格式：completed 不带 contentType，产物类型由 generations.output_type 决定
export type ProviderStatus =
  | { state: 'pending'; next?: { requestId: string; meta: ProviderMeta } }
  | { state: 'completed'; output: { url: string } | { r2Key: string }; costCents?: number }
  | { state: 'failed'; code: string; message: string; retryable?: boolean }

export interface SubmitBase {
  generationId: string
  style: Style
  // 用户照片的签名地址；双人风格按左、右顺序
  imageUrls: readonly string[]
  webhookUrl: string
  meta: ProviderMeta
}

// 一个能力的最小接口：提交与轮询。成本估算两边参数不同（视频按秒、图片按张），留在各自的 Provider 上
export interface ProviderCapability<Input> {
  submit(input: Input): Promise<{ requestId: string; meta: ProviderMeta }>
  status(requestId: string, meta: ProviderMeta): Promise<ProviderStatus>
}
