import type { Style } from '#/config/site'
import { ApiError, isProduction } from '../util'
import { createFalImageProvider } from '../image/fal'
import { createFalProvider } from '../video/fal'
import { createNanoapiProvider } from '../video/nanoapi'
import { createYirProvider } from '../video/yir'
import type { VideoProvider } from '../video/types'
import type { ImageProvider } from '../image/types'
import { unsupportedImageCapability, unsupportedVideoCapability } from './unsupported'
import type { Capability, ProviderId } from './types'

// mock：本地与 e2e 用。几秒后“完成”，输出直接复制该时长档位的模板源视频。
// 生成请求带 mockOutcome（仅非生产）：'fail' 模拟失败，用于验证自动退积分；'hang' 一直处理中，直到超时、死信或管理员处理。
function createMockProvider(): VideoProvider {
  return {
    async submit(input) {
      return {
        requestId: `mock_${input.generationId}`,
        meta: { ...input.meta, readyAt: Date.now() + 3000, sourceKey: input.sourceVideoKey },
      }
    },
    async status(_requestId, meta) {
      if (meta.mockOutcome === 'hang' || Date.now() < Number(meta.readyAt ?? 0)) return { state: 'pending' }
      if (meta.mockOutcome === 'fail') return { state: 'failed', code: 'mock_failure', message: 'Simulated provider failure' }
      return { state: 'completed', output: { r2Key: String(meta.sourceKey) } }
    },
    costCents: () => 0,
  }
}

// 能力矩阵是唯一事实来源：只列真实可用的能力；不支持的由 unsupportedCapability 兜底
export const PROVIDER_CAPABILITIES = {
  fal: ['video', 'image'],
  yir: ['video'],
  nanoapi: ['video'],
  mock: ['video', 'image'],
} as const satisfies Record<ProviderId, readonly Capability[]>

// 图片 mock：几秒后“完成”，产物直接复制 seed 上传的占位图（templates/sample-photo.jpg）
function createMockImageProvider(): ImageProvider {
  return {
    async submit(input) {
      return {
        requestId: `mock_image_${input.generationId}`,
        meta: { ...input.meta, readyAt: Date.now() + 2000, resultKey: 'templates/sample-photo.jpg' },
      }
    },
    async status(_requestId, meta) {
      if (meta.mockOutcome === 'hang' || Date.now() < Number(meta.readyAt ?? 0)) return { state: 'pending' }
      if (meta.mockOutcome === 'fail') return { state: 'failed', code: 'mock_failure', message: 'Simulated image failure' }
      return { state: 'completed', output: { r2Key: String(meta.resultKey) } }
    },
    costCents: () => 0,
  }
}

export function supports(providerId: ProviderId, capability: Capability): boolean {
  return (PROVIDER_CAPABILITIES[providerId] as readonly Capability[]).includes(capability)
}

export function activeVideoProviderId(env: Env): ProviderId {
  if (env.VIDEO_PROVIDER === 'fal') return 'fal'
  if (env.VIDEO_PROVIDER === 'yir') return 'yir'
  if (env.VIDEO_PROVIDER === 'nanoapi') return 'nanoapi'
  if (env.VIDEO_PROVIDER === 'mock' && !isProduction(env)) return 'mock'
  throw new ApiError(503, 'video_not_configured', `Unsupported VIDEO_PROVIDER: ${env.VIDEO_PROVIDER}`)
}

// 生成任务用哪个服务商：风格固定了就用风格的；mock（本地与 e2e）压过一切
function configuredImageProvider(env: Env): string {
  const configured = (env as Env & { IMAGE_PROVIDER?: string }).IMAGE_PROVIDER
  // 生产环境默认 fal；本地/测试默认 mock
  return configured ?? (isProduction(env) ? 'fal' : 'mock')
}

export function activeImageProviderId(env: Env): ProviderId {
  const configured = configuredImageProvider(env)
  if (configured === 'mock' && !isProduction(env)) return 'mock'
  if (configured === 'fal' || configured === 'yir') return configured
  throw new ApiError(503, 'image_not_configured', `Unsupported IMAGE_PROVIDER: ${configured}`)
}

// 生成任务用哪个服务商：按产物类型选默认服务商，style.provider 可覆盖；mock 在非生产压过一切
export function providerIdForStyle(env: Env, style: Style): ProviderId {
  if (style.kind === 'image') {
    const active = activeImageProviderId(env)
    if (active === 'mock') return 'mock'
    return style.provider ?? active
  }
  const active = activeVideoProviderId(env)
  if (active === 'mock') return 'mock'
  return style.provider ?? active
}

// 兼容旧调用点：目前只有视频产物
export const videoProviderIdForStyle = providerIdForStyle

export function getVideoProvider(env: Env, id: ProviderId = activeVideoProviderId(env)): VideoProvider {
  if (id === 'mock' && isProduction(env)) {
    throw new ApiError(503, 'provider_not_configured', 'mock provider is not available in production')
  }
  if (!supports(id, 'video')) return unsupportedVideoCapability(id)
  if (id === 'fal') return createFalProvider(env)
  if (id === 'yir') return createYirProvider(env)
  if (id === 'nanoapi') return createNanoapiProvider(env)
  return createMockProvider()
}

export function getImageProvider(env: Env, id: ProviderId): ImageProvider {
  if (id === 'mock') {
    if (isProduction(env)) throw new ApiError(503, 'provider_not_configured', 'mock provider is not available in production')
    return createMockImageProvider()
  }
  if (!supports(id, 'image')) return unsupportedImageCapability(id)
  if (id === 'fal') return createFalImageProvider(env)
  throw new ApiError(503, 'image_not_configured', `No image adapter for ${id}`)
}
