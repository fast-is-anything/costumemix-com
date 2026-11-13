import type { ProviderCapability, ProviderMeta, ProviderStatus, SubmitBase } from '../providers/types'

// 视频能力的输入：在共享字段之外多了源视频与时长
export interface VideoSubmitInput extends SubmitBase {
  durationSeconds: number
  sourceVideoUrl: string
  sourceVideoKey: string
}

export type VideoSubmitResult = { requestId: string; meta: ProviderMeta }

export type VideoStatus = ProviderStatus

export interface VideoProvider extends ProviderCapability<VideoSubmitInput> {
  // 出一条成片的估算成本（美分），出片后写入 generations.provider_cost_cents
  // styleId：yir 两步走按风格决定要不要加合成图的费用
  costCents(durationSeconds: number, styleId: string): number
}

// 可重试错误（网络/限流/5xx）：队列会重投；不可重试错误直接失败并退积分
export class VideoProviderError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly retryable: boolean,
  ) {
    super(message)
  }
}
