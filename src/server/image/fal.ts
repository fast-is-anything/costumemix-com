import { cleanSecret } from '../util'
import { ImageProviderError, type ImageProvider } from './types'

// 占位实现：图片模型和参数还没最终选定，先按 fal queue 协议接一个通用的图生图模型。
// 单价也没定，costCents 返回 0（真实计费要等模型确定后补）。上线前必须替换成实际模型。
const FAL_IMAGE_MODEL = 'fal-ai/flux/dev/image-to-image'

// fal.ai queue API：https://docs.fal.ai/model-apis/model-endpoints/queue
// 结果始终用 API key 重新拉取，webhook 只当“该查一下了”的信号。
export function createFalImageProvider(env: Env): ImageProvider {
  const key = cleanSecret(env.FAL_KEY)
  const headers = () => {
    if (!key) throw new ImageProviderError('provider_not_configured', 'FAL_KEY missing', false)
    return { Authorization: `Key ${key}`, 'Content-Type': 'application/json' }
  }

  return {
    async submit(input) {
      if (input.imageUrls.length > 1) {
        throw new ImageProviderError('multi_photo_unsupported', 'fal image takes one photo', false)
      }
      const url = new URL(`https://queue.fal.run/${FAL_IMAGE_MODEL}`)
      url.searchParams.set('fal_webhook', input.webhookUrl)
      const response = await fetch(url, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          image_url: input.imageUrls[0],
          prompt: input.style.prompt ?? '',
          num_images: 1,
        }),
      })
      const body = (await response.json().catch(() => null)) as {
        request_id?: string
        status_url?: string
        response_url?: string
        detail?: unknown
      } | null
      if (!response.ok || !body?.request_id || !body.status_url || !body.response_url) {
        throw new ImageProviderError(
          `fal_submit_${response.status}`,
          `fal submit failed: ${JSON.stringify(body?.detail ?? body).slice(0, 300)}`,
          isRetryableStatus(response.status),
        )
      }
      return {
        requestId: body.request_id,
        meta: { statusUrl: body.status_url, responseUrl: body.response_url },
      }
    },

    async status(_requestId, meta) {
      const statusUrl = String(meta.statusUrl ?? '')
      const responseUrl = String(meta.responseUrl ?? '')
      if (!statusUrl || !responseUrl) return { state: 'failed', code: 'missing_meta', message: 'fal urls missing' }
      const statusResponse = await fetch(statusUrl, { headers: headers() })
      if (!statusResponse.ok) {
        throw new ImageProviderError(`fal_status_${statusResponse.status}`, 'fal status failed', isRetryableStatus(statusResponse.status))
      }
      const status = (await statusResponse.json()) as { status?: string; error?: string; error_type?: string }
      if (status.status !== 'COMPLETED') return { state: 'pending' }
      if (status.error) return { state: 'failed', code: status.error_type ?? 'fal_error', message: status.error.slice(0, 500) }

      const resultResponse = await fetch(responseUrl, { headers: headers() })
      const result = (await resultResponse.json().catch(() => null)) as {
        images?: { url?: string }[]
        detail?: unknown
      } | null
      if (!resultResponse.ok) {
        if (isRetryableStatus(resultResponse.status)) {
          throw new ImageProviderError(`fal_result_${resultResponse.status}`, 'fal result fetch failed', true)
        }
        return {
          state: 'failed',
          code: `fal_result_${resultResponse.status}`,
          message: JSON.stringify(result?.detail ?? result).slice(0, 500),
        }
      }
      const imageUrl = result?.images?.[0]?.url
      if (!imageUrl) return { state: 'failed', code: 'fal_no_image', message: 'fal result has no image url' }
      return { state: 'completed', output: { url: imageUrl } }
    },

    // TODO(image): 模型单价确定后按 variantId / 张数计费
    costCents: () => 0,
  }
}

function isRetryableStatus(status: number) {
  return status === 408 || status === 429 || status >= 500
}
