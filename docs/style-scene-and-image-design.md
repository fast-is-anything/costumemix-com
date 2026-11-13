# 场景分类 + 图片产物：架构设计（v5 · 精简版）

状态：设计稿，未实现
前提：项目未上线、无历史数据与外部客户端；自用站点，合规与定价不在本期范围。

---

## 0. 决策摘要

| 议题 | 决定 |
| --- | --- |
| 场景字段 | `category`，新增 `SCENES` 常量；现有 `Style.scene`（yir 两步走）不动 |
| 产物类型 | `kind?: 'video' \| 'image'`，缺省 video；现有服装无需修改 |
| 选择项 | 不改接口字段：视频用 `durationId`，图片用 `variantId`；前端用一个局部 helper 统一读取，不引入 `optionId` |
| 服务商抽象 | `VideoProvider` / `ImageProvider` 两个平行接口，共享 `ProviderStatus`；错误类按能力各一个（`VideoProviderError` / `ImageProviderError`）；能力矩阵 + 显式报错 stub |
| 服务商配置 | `VIDEO_PROVIDER` / `IMAGE_PROVIDER` 选默认，`style.provider` 可选覆盖 |
| 数据 | 改 `0001_init.sql`（未上线）：`output_type`、`duration_*`/`variant_id` 按类型可空，外加 `CHECK` |
| 媒体 | 统一 `/api/generations/:id/media`，删除 `/video`；`mediaUrl` + `mediaType` |
| 不做 | 图片分享、图片输出审核、图片定价、厂商级 Provider 聚合、`MediaProvider` 大接口 |

---

## 1. 目标与非目标

**目标**

1. `style.category` 决定生成器顶部 tab；切 tab 只显示该场景的服装。
2. `style.kind: 'image'` 支持静态图片产物（证件照、婚纱照），与视频共用同一套生成器、积分、队列。
3. 每家服务商的能力显式化：不支持的产物类型给出清晰错误，而不是缺失方法或静默失败。

**非目标（本期不做）**

- 图片的公开分享 `/v/<id>`、图片输出审核、单独定价。
- 通用 Provider SDK / 厂商聚合对象 / 跨服务商统一请求体。
- 重命名现有 `duration_id` 等既有字段（避免无谓 churn）。

---

## 2. 配置模型

```ts
// src/config/site.ts
export const SCENES = ['christmas', 'halloween', 'wedding', 'id-photo', 'professional'] as const
export type SceneId = (typeof SCENES)[number]

interface StyleBase {
  id: string
  category: SceneId // tab 分组，顺序即 SCENES 顺序
  kind?: 'video' | 'image' // 缺省 video
  prompt: string | null
}

export interface VideoStyle extends StyleBase {
  kind?: 'video'
  photos?: 1 | 2
  provider?: 'fal' | 'yir' | 'nanoapi'
  durations?: readonly StyleDuration[]
  sources: Readonly<Record<string, string>>
  scene: StyleScene | null // 现有 yir 两步走
  music: Readonly<Record<string, string>> | null
  examples: { original: ExampleClip; aiVersions: readonly ExampleClip[]; madeWith: { photo: string; video: string; poster: string } }
}

export interface ImageStyle extends StyleBase {
  kind: 'image'
  photos?: 1 | 2
  provider?: 'fal' | 'yir' // 可被 IMAGE_PROVIDER 覆盖
  variants: readonly { id: string; template: string; credits: number }[]
  /** 图片产物没有视频示例，卡片用一前一后两张图 */
  examples: { photo: string; result: string; credit?: string }
}

export type Style = VideoStyle | ImageStyle
```

- 判别点 `kind === 'image'`；访问 `sources`/`durations` 前必须收窄。
- **`examples` 按类型分开**：图片风格不需要 `original/aiVersions` 视频字段，避免配置里出现无意义的视频路径。
- 变体只保留 `id / template / credits`。`template` 是**style 自己定义的文件名**（R2 `templates/` 下），项目不做统一命名或额外语义；尺寸等参数由模型与提示词决定，不进配置（YAGNI）。

文案（`content/en.ts`、`zh.ts`）：

```ts
scenes: Record<SceneId, { name: string; tagline?: string }>
styles[id]: { name; tagline; variants?: Record<variantId, string> }
```

`Record<SceneId, ...>` 与 `variants` 的键由 typecheck 保证齐全。

---

## 3. 生成器

### 3.1 选择项读取（不统一接口字段）

视频用 `durationId`（`short` / `medium` / `full`），图片用 `variantId`（`white-1in` / `blue-2in`）。两者语义不同，**不合成 `optionId`**，只在组件内用一个局部 helper 统一读取当前选项与积分：

```ts
const options = style.kind === 'image' ? style.variants : styleDurations(style)
const selected = style.kind === 'image' ? variantId : durationId
const credits = options.find((o) => o.id === selected)?.credits ?? 0
```

- 提交体按类型分开：视频 `{ styleId, durationId }`，图片 `{ styleId, variantId }`；服务端本来就按 `style.kind` 分支，语义更直白。
- 草稿保留 `durationId`，新增 `variantId`；切换类型时只校验对应字段。
- 不引入 `optionId` 的收益：不改提交接口、不改草稿既有字段、e2e 选择器仍按 `duration-*` / `variant-*` 命名。

### 3.2 场景 tab

```
[scene-tab: 圣诞 | 万圣节 | 婚礼 | 证件照]
[该场景下的 style 卡片]
[时长 / 变体选择器]
[照片 + 授权 + CTA]
[结果：<video> 或 <img>]
```

- tab 列表直接来自 `SCENES`（顺序即定义顺序），**不按“有没有服装”过滤**；每个场景至少一套服装由单测保证。
- `visibleStyles = DISPLAY_STYLES.filter(s => s.category === category)`。
- 切 tab 时若当前 style 不属于新场景，自动选该场景第一套。
- 首页 hero 只保留 scene tab，服装选择只在生成器内，避免两层 tab 重复。
- 结果区按 `generation.mediaType` 渲染 `<video>` / `<img>`。

### 3.3 图片风格在现有页面的落点

现有几处 UI 假定 `examples` 是视频，`ImageStyle` 用不同的 `examples` 形状，必须明确处理：

| 位置 | 现状 | 处理 |
| --- | --- | --- |
| 生成器服装卡片缩略图 | 取 `style.examples.aiVersions[0].poster` | 按 kind 取图：视频用 poster，图片用 `examples.result` |
| 首页 hero 演示区 | `original` + `aiVersions` 的 `VideoCard` | 按 kind 分支：图片渲染“照片 → 成片”两张 `<img>` |
| 首页 `Made with` 时间轴 | 用 `examples.madeWith` 的 photo/video | **只取视频风格**（`kind !== 'image'`），图片风格不进这个区块 |
| 文章页 style demo | `examples.original/aiVersions` | 只给视频风格配 `style` 字段，图片文章不配 |

原则：**只有生成器卡片和 hero 需要为图片写分支**，其余两处用“过滤/配置约束”避开，不写第二套渲染。

---

## 4. 数据模型

直接改 `migrations/0001_init.sql`（未上线），只加必要列：

```sql
output_type TEXT NOT NULL CHECK (output_type IN ('video', 'image')),
duration_id TEXT,          -- 视频
duration_seconds INTEGER,  -- 视频
variant_id TEXT,           -- 图片
...
CHECK (
  (output_type = 'video' AND duration_id IS NOT NULL AND duration_seconds IS NOT NULL AND variant_id IS NULL)
  OR
  (output_type = 'image' AND variant_id IS NOT NULL AND duration_id IS NULL AND duration_seconds IS NULL)
)
```

- **不新增 `output_content_type`**：R2 对象本身带 `httpMetadata`，媒体路由直接用 `object.writeHttpMetadata()`，少一列、少一处同步。
- **不重命名 `duration_id`**：视频侧读它的地方多，改名只会扩大 diff；图片用 `variant_id`，语义清楚。
- 运维：删除远端 D1 `costumemix` 重建 → `db:migrate:remote`；本地清 `.wrangler/state` 后重迁 + seed。

---

## 5. 服务商能力抽象

### 5.1 现状

一个能力一个接口：`VideoProvider`（fal / yir / nanoapi / mock 各自实现），`VIDEO_PROVIDER` 选默认，`style.provider` 覆盖。

### 5.2 类型与错误类

**共享的类型**放 `src/server/providers/types.ts`：

```ts
export type ProviderId = 'fal' | 'yir' | 'nanoapi' | 'mock'
export type Capability = 'video' | 'image'
export type ProviderMeta = Record<string, unknown>

/** 视频与图片共用同一套状态格式；completed 不带 contentType，R2 元数据负责 */
export type ProviderStatus =
  | { state: 'pending'; next?: { requestId: string; meta: ProviderMeta } }
  | { state: 'completed'; output: { url: string } | { r2Key: string }; costCents?: number }
  | { state: 'failed'; code: string; message: string; retryable?: boolean }

export interface SubmitBase {
  generationId: string
  style: Style
  imageUrls: readonly string[]
  webhookUrl: string
  meta: ProviderMeta
}

export interface ProviderCapability<Input> {
  submit(input: Input): Promise<{ requestId: string; meta: ProviderMeta }>
  status(requestId: string, meta: ProviderMeta): Promise<ProviderStatus>
}
// 成本估算两边参数不同，放在各自的 Provider 接口上：
// VideoProvider.costCents(durationSeconds, styleId)
// ImageProvider.costCents(variantId)
```

**错误类按能力各一个，形状完全一致**（直接照抄 `VideoProviderError`）：

```ts
// src/server/video/types.ts —— 现有文件，一行不改
export class VideoProviderError extends Error {
  constructor(readonly code: string, message: string, readonly retryable: boolean) {
    super(message)
  }
}
export type VideoStatus = ProviderStatus // 旧引用继续可用
export interface VideoSubmitInput extends SubmitBase { sourceVideoUrl: string; sourceVideoKey: string; durationSeconds: number }
export type VideoProvider = ProviderCapability<VideoSubmitInput>

// src/server/image/types.ts —— P4 新增
export class ImageProviderError extends Error {
  constructor(readonly code: string, message: string, readonly retryable: boolean) {
    super(message)
  }
}
export type ImageStatus = ProviderStatus
export interface ImageSubmitInput extends SubmitBase { variant: ImageStyle['variants'][number]; templateUrl: string }
export type ImageProvider = ProviderCapability<ImageSubmitInput>
```

**唯一的约束**：`jobs.ts` 的“可重试/不可重试”判断必须同时认识两个类：

```ts
const isProviderError = (e: unknown): e is VideoProviderError | ImageProviderError =>
  e instanceof VideoProviderError || e instanceof ImageProviderError
```

两个类的字段（`code` / `retryable`）必须保持一致，否则同一个判断在两个分支上的含义会漂移。

### 5.3 能力矩阵与 getter（`src/server/providers/registry.ts`）

```ts
export const PROVIDER_CAPABILITIES = {
  fal: ['video'], // P4 接图片后加 'image'
  yir: ['video'],
  nanoapi: ['video'],
  mock: ['video'],
} as const satisfies Record<ProviderId, readonly Capability[]>

export function supports(providerId: ProviderId, capability: Capability): boolean

export function providerIdForStyle(env: Env, style: Style): ProviderId

export function getVideoProvider(env: Env, providerId: ProviderId): VideoProvider
export function getImageProvider(env: Env, providerId: ProviderId): ImageProvider
```

- 两个 getter 都返回**具体类型**，不做 `VideoProvider | ImageProvider` 联合，避免 `submit` 参数退化成交集。
- 能力不在矩阵里 → `getVideoProvider` 返回 `unsupportedVideoCapability(providerId)`、`getImageProvider` 返回 `unsupportedImageCapability(providerId)`：`submit/status` 抛出**对应能力的错误类**（`VideoProviderError` / `ImageProviderError`）的 `capability_unsupported`，不可重试；`costCents` 返回 0。
- 不再有 `supported` 字段和 `capabilityForStyle`/重载：矩阵是唯一事实来源，调用方要预检就调 `supports()`。
- `providerIdForStyle` 内部：视频 `style.provider ?? VIDEO_PROVIDER`，图片 `style.provider ?? IMAGE_PROVIDER`，非生产 mock 优先。

新增环境变量：`IMAGE_PROVIDER`（`fal | yir | mock`），与 `VIDEO_PROVIDER` 对称，落点：`wrangler.jsonc` vars、`LOCAL_DEV_VARS`、`config-health`、`docs/env.md`。密钥复用 `FAL_KEY` / `YIR_API_KEY`。

### 5.4 目录

```
src/server/providers/
  types.ts       // §5.2
  registry.ts    // 矩阵、providerIdForStyle、getVideoProvider/getImageProvider
  unsupported.ts // stub
src/server/video/    // 现有 fal.ts / yir.ts / nanoapi.ts / model-name.ts 原地不动（只改 import）
src/server/image/    // P4：types.ts（ImageProviderError / ImageProvider）、fal.ts
```

不搬家、不重写 yir 的两步状态机、不做厂商聚合对象。

### 5.5 失败闭合

`POST /api/generations` 在扣积分之前：

1. `style = findStyle(styleId)`，按 `kind` 解析 `durationId` / `variantId`
2. `providerId = providerIdForStyle(env, style)`；`if (!supports(providerId, style.kind ?? 'video'))` → `503 capability_unsupported`（不写库、不扣费）
3. 照片张数、归属、并发、每日上限
4. 写 `generations` + 扣积分（同一 `db.batch`）
5. 投递队列

### 5.6 fal 协议复用

fal 视频和图片共用 queue 协议，抽 `src/server/providers/fal/queue.ts`：`submitFalQueue` / `pollFalQueue` 只处理 HTTP 与状态码，payload 与结果解析留在各自 adapter。错误码沿用现有字符串，抽取后加“错误码对照”单测。

---

## 6. 服务端流程

- **jobs**：`const provider = generation.output_type === 'image' ? getImageProvider(env, generation.provider) : getVideoProvider(env, generation.provider)`；其余流程（抢占、`next` 推进、超时、退积分）不变。
- 图片：**超时与轮询沿用现有全局常量**（`JOB_TIMEOUT_MINUTES` 45 分钟、`POLL_DELAY_SECONDS` 按 provider 取，mock 仍 2 秒），不为新类型加分支；跳过背景音乐与 XMP；**跳过输出审核**（自用站，输入审核照旧）。
- **媒体**：`GET /api/generations/:id/media`，按 R2 `httpMetadata` 返回；删除 `/video` 及后台对应路由。
- `publicGeneration()`：`mediaUrl`、`mediaType: 'video' | 'image'`；删除 `videoUrl`。个人中心、后台、导出、e2e 同步改。
- 分享：仅视频；生成器对图片不显示分享入口。
- 保留期：按 `output_r2_key` 清理，逻辑不变。

---

## 7. Mock 与本地

- `mock` 继续实现视频（3 秒完成、复制模板源视频）。
- P4 增加图片 mock：返回 R2 里真实存在的占位图（`seed:local` 时上传），不能返回 `public/` 静态路径（那在 assets 绑定里）。
- `VIDEO_PROVIDER=mock`、`IMAGE_PROVIDER=mock`；非生产 mock 优先于 `style.provider`。

---

## 8. 测试

- 单测：`SCENES` 覆盖、`styles[id]` 文案齐全、变体 id 唯一、能力矩阵与 getter 一致、stub 抛 `capability_unsupported`、`providerIdForStyle` 的 mock 优先级。
- 视频回归：错误码、`retryable`、`provider_meta` 关键字段与改造前一致；yir 两步流程用 mock fetch 回放。
- e2e：`scene-tab-*`、`style-*`、`duration-*` / `variant-*`、`generation-video` / `generation-image`；同步 `CATALOG.md`。

---

## 9. 落地顺序

| 阶段 | 内容 | 验收 |
| --- | --- | --- |
| P0 | `SCENES` / `category` / `kind` 类型；现有 3 套打标 `category: 'christmas'`；`scenes` 文案 | 编译通过，页面行为不变 |
| P1 | ~~scene tab + 选择项统一~~（已并入 P4：等第二个场景和图片产物到位再一起验证） | — |
| P2 | `providers/types.ts` + `registry.ts` + `unsupported.ts` + `image/types.ts`；视频 adapter 一行不改，`jobs.ts` 改为双错误类识别 | 视频 e2e/sandbox 行为不变 |
| P3 | `0001` 表结构、`output_type`、`mediaUrl` 契约、`/media` 路由、后台/导出 | 视频全链路回归 |
| P4 | `image/fal.ts`（图生图）+ getter 返回真实实现 + mock + 结果区 `<img>` + 一个证件照风格 | 本地出图、失败退款 |

---

## 10. 仍需决策与难点

### 10.1 待决策：已清空

四个候选问题已确认不是决策点：

- **图片参考图（`variant.template`）**：由 style 自己在配置里定文件名，项目不做统一命名或语义约定。
- **图片尺寸**：不属于本期范围，配置里不出现尺寸参数。
- **多图支持**：后续由运维选择支持多图的 provider 接入，不影响本设计的接口与能力矩阵。
- **场景 tab**：按 `SCENES` 定义渲染，不按“有没有服装”过滤；用单测保证每个场景至少一套服装。

### 10.2 难点（按风险排序）

1. **两个错误类必须同时被识别**：`jobs.ts` 的判断要从 `instanceof VideoProviderError` 扩成“两个类都算”，漏掉图片类会让图片任务卡到死信才退款；两个类的构造函数签名要保持一致，否则同一个判断在两个分支上含义会漂移。
2. **媒体契约改造**：`videoUrl → mediaUrl` 会牵动个人中心、分享页、后台、导出、e2e；`ShareView` 与后台 SQL 不会被 TS 拦住，需 `git grep videoUrl` 清零。
3. **重建 D1 不可逆**：丢测试数据、R2 旧产物变孤儿、KV `settings:v1` 残留，需在重建后清理。
4. **fal 错误码漂移**：抽取 queue 时保留 6 种错误码与 `retryable` 映射，用对照单测锁住。
5. **mock 图片占位**：必须真实存在于 R2，否则本地/CI 图片用例全部 `output_missing`。

---

## 11. 已砍掉的设计（避免过度设计）

| 砍掉 | 原因 |
| --- | --- |
| 厂商级 `Provider { video, image }` 聚合对象 | 需求是“服务商接入图片能力”，不是重组视频 adapter；聚合会把 yir 两步状态机卷进重构 |
| `ProviderStatus.contentType` / `generations.output_content_type` | R2 `httpMetadata` 已经是事实来源，多一列就多一处同步 |
| `capabilityForStyle` + `getCapability` 重载 | 两个具体 getter（`getVideoProvider` / `getImageProvider`）+ `supports()` 更直白，也避开联合类型参数交集问题 |
| 能力对象上的 `supported` 字段 | 矩阵是唯一事实来源，字段会造成双份真相 |
| `sceneTabs` / `featuredCategory` 额外常量 | `SCENES` 顺序即 tab 顺序，默认第一个场景即可 |
| `ImageVariant.size` | 尺寸不进配置，由模型与提示词决定；需要时再加 |
| 图片分享 / 图片输出审核 / 图片定价 | 自用站本期不需要；分享仅视频，审核仅输入 |
| 统一 `MediaProvider` 大接口 | 两种能力的入参、超时、成本口径不同，统一只会让类型变宽 |
| 统一 `ProviderError` 基类/改名 | 按能力各一个错误类（直接照抄现有类），现有 adapter 与单测零改动；`jobs.ts` 多一个双识别判断即可 |
| 图片单独的超时/轮询 | 沿用现有常量（mock 2 秒、真实 20 秒、45 分钟超时），少一套分支 |
| 重命名 `duration_id` → `option_id` | 视频侧读取点多，改名扩大 diff；保留原列 + 新增 `variant_id` 即可 |

