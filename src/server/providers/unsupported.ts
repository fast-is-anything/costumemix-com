import type { ProviderCapability, ProviderId } from './types'
import { ImageProviderError } from '../image/types'
import type { ImageProvider } from '../image/types'
import { VideoProviderError } from '../video/types'
import type { VideoProvider } from '../video/types'

// 不支持的能力也返回一个完整对象：调用方不用判空，错误信息明确且不可重试。
// costCents 返回 0：能力不可用时不会走到真实计费。
function unsupportedCapability<Input>(
  providerId: ProviderId,
  capability: string,
  ErrorClass: typeof VideoProviderError | typeof ImageProviderError,
): ProviderCapability<Input> & { costCents: () => number } {
  const fail = async (): Promise<never> => {
    throw new ErrorClass('capability_unsupported', `${providerId} does not support ${capability}`, false)
  }
  return { submit: fail, status: fail, costCents: () => 0 }
}

export function unsupportedVideoCapability(providerId: ProviderId): VideoProvider {
  return unsupportedCapability(providerId, 'video', VideoProviderError)
}

export function unsupportedImageCapability(providerId: ProviderId): ImageProvider {
  return unsupportedCapability(providerId, 'image', ImageProviderError)
}
