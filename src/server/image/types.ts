import type { ProviderCapability, ProviderStatus, SubmitBase } from '../providers/types'

// 图片能力的错误类：形状与 VideoProviderError 完全一致，jobs 的重试判断要同时识别两者
export class ImageProviderError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly retryable: boolean,
  ) {
    super(message)
  }
}

export type ImageStatus = ProviderStatus

export interface ImageSubmitInput extends SubmitBase {
  variantId: string
  // variant.template 的公开 URL（templateSourceUrl）
  templateUrl: string
}

export interface ImageProvider extends ProviderCapability<ImageSubmitInput> {
  // 出一张图的估算成本（美分）；variantId 用来按变体定价
  costCents(variantId: string): number
}
