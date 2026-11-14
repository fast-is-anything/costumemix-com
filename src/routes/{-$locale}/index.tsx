import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowRight, Camera, Check, Clock, Coins, Film, ShieldCheck, Smartphone, Sparkles, X } from 'lucide-react'
import { Faq, faqJsonLd } from '#/components/Faq'
import { Generator } from '#/components/Generator'
import { ImageCard } from '#/components/ImageCard'
import { Pricing } from '#/components/Pricing'
import { VideoCard } from '#/components/VideoCard'
import { LocalLink } from '#/components/ui'
import { VIDEO_STYLES, STYLES, articlePath, featuredStyle, findStyle, site } from '#/config/site'
import { getContent, localeFromParam, pageHead, useContent } from '#/lib/i18n'
import { homeJsonLd, jsonLdScript } from '#/lib/seo'

// ?style=<id> 预选风格（不存在的 id 忽略）
export const Route = createFileRoute('/{-$locale}/')({
  validateSearch: (search: Record<string, unknown>): { style?: string; variant?: string } => ({
    style: typeof search.style === 'string' && findStyle(search.style) ? search.style : undefined,
    variant: typeof search.variant === 'string' ? search.variant : undefined,
  }),
  head: ({ params }) => {
    const locale = localeFromParam(params.locale)
    const c = getContent(locale)
    const head = pageHead(locale, '/', c.meta.homeTitle, c.meta.homeDescription)
    return {
      ...head,
      scripts: [
        jsonLdScript(homeJsonLd(locale, c.meta.homeDescription, { name: `${c.hero.aiVersion} – ${site.keyword}`, description: c.madeWith.body })),
        jsonLdScript(faqJsonLd(c.faq.items)),
      ],
    }
  },
  component: Home,
})

const FEATURE_ICONS = [Camera, Film, Smartphone, Clock, ShieldCheck, Coins]

function Home() {
  const c = useContent()
  const ex = site.examples
  const search = Route.useSearch()
  // hero 标签和生成器共用同一个风格；SSR 默认显示主推风格（或 URL 指定的）
  const [styleId, setStyleId] = useState<string>(search.style ?? featuredStyle.id)
  const style = findStyle(styleId) ?? featuredStyle
  const demoCardClass = 'w-[32%] max-w-[200px] min-w-[116px] shrink-0 snap-start sm:w-[200px]'
  // hero 演示区目前按视频准备；图片风格在 P4b 接
  const videoStyle = style.kind === 'image' ? null : style
  const styleCopy = (id: string) => c.styles[id as keyof typeof c.styles]
  return (
    <>
      {/* Hero：标题与描述居中，下面是热门服装片段和生成器（上下布局） */}
      <section className="relative overflow-hidden">
        <div className="hero-glow pointer-events-none absolute inset-0" aria-hidden />
        <div className="container-page relative py-6 lg:py-8">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mt-2 font-display text-5xl font-black uppercase leading-[1.04] tracking-tight sm:text-7xl">{c.hero.title}</h1>
            <p className="mx-auto mt-3 max-w-3xl text-lg leading-8 text-muted">{c.hero.subtitle}</p>
          </div>
          <div className="mt-4 flex flex-col gap-8 lg:mt-6">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-3">
              <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm font-medium">
                <LocalLink to="/guides" className="inline-flex items-center gap-1.5 hover:text-accent">
                  {c.hero.guideLinks.guides} <ArrowRight className="size-4" />
                </LocalLink>
                <LocalLink to={articlePath('howTo')} className="inline-flex items-center gap-1.5 hover:text-accent">
                  {c.hero.guideLinks.howTo} <ArrowRight className="size-4" />
                </LocalLink>
              </div>
              {STYLES.length > 1 ? (
                <div role="tablist" aria-label={c.generator.stepStyle} className="flex flex-wrap justify-center gap-2">
                  {VIDEO_STYLES.map((s) => {
                    const active = s.id === style.id
                    return (
                      <button
                        key={s.id}
                        type="button"
                        role="tab"
                        id={`hero-tab-${s.id}`}
                        aria-selected={active}
                        aria-controls="hero-panel"
                        tabIndex={active ? 0 : -1}
                        data-testid={`hero-tab-${s.id}`}
                        onClick={() => setStyleId(s.id)}
                        onKeyDown={(event) => {
                          // 左右方向键在标签间移动并选中
                          const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
                          if (!step) return
                          event.preventDefault()
                          const next = VIDEO_STYLES[(VIDEO_STYLES.indexOf(s) + step + VIDEO_STYLES.length) % VIDEO_STYLES.length]!
                          setStyleId(next.id)
                          document.getElementById(`hero-tab-${next.id}`)?.focus()
                        }}
                        className={`sticker-sm rounded-full border-2 border-muted px-4 py-1.5 text-sm font-semibold transition ${active ? 'bg-ink text-ink-fg' : 'bg-bg-soft text-muted hover:text-fg'}`}
                      >
                        {styleCopy(s.id).name}
                      </button>
                    )
                  })}
                </div>
              ) : null}
              {videoStyle ? (
              <ul
                // 热门服装片段：手机上横向滑动，桌面居中排开
                className="-mx-5 flex snap-x snap-mandatory scroll-px-5 justify-start gap-3 overflow-x-auto px-5 pt-2 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-auto sm:max-w-4xl sm:justify-center sm:gap-5 sm:overflow-visible sm:px-0"
                {...(STYLES.length > 1 ? { id: 'hero-panel', role: 'tabpanel', 'aria-labelledby': `hero-tab-${style.id}` } : {})}
              >
                <li className={demoCardClass}>
                  <VideoCard
                    video={videoStyle.examples.original.video}
                    poster={videoStyle.examples.original.poster}
                    label={c.hero.original}
                    credit={videoStyle.examples.original.credit}
                  />
                </li>
                {videoStyle.examples.aiVersions.map((v) => (
                  <li key={v.video} className="w-[32%] max-w-[200px] min-w-[116px] shrink-0 snap-start sm:w-[200px]">
                    <VideoCard
                      video={v.video}
                      poster={v.poster}
                      credit={v.credit}
                      label={
                        <>
                          <Sparkles className="size-3" /> {c.hero.aiVersion}
                        </>
                      }
                    />
                  </li>
                ))}
              </ul>
              ) : style.kind === 'image' ? (
                <ul
                  className="-mx-5 flex snap-x snap-mandatory scroll-px-5 justify-start gap-3 overflow-x-auto px-5 pt-2 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-auto sm:max-w-4xl sm:justify-center sm:gap-5 sm:overflow-visible sm:px-0"
                  data-testid="hero-image-demo"
                >
                  <li className={demoCardClass}>
                    <ImageCard src={style.examples.photo} label={c.hero.original} credit={style.examples.credit} />
                  </li>
                  <li className={demoCardClass}>
                    <ImageCard
                      src={style.examples.result}
                      credit={style.examples.credit}
                      label={
                        <>
                          <Sparkles className="size-3" /> {c.hero.aiVersion}
                        </>
                      }
                    />
                  </li>
                </ul>
              ) : null}
            </div>
            <div className="mx-auto w-full max-w-6xl space-y-5" id="create">
              <Generator styleId={style.id} onStyleChange={setStyleId} initialVariantId={search.variant} />
            </div>
          </div>
        </div>
      </section>

      {/* What is：解释趋势本身，承接 "what is {keyword}" 信息型搜索 */}
      <section id="about" className="scroll-mt-20 border-t border-line py-20">
        <div className="container-page grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
          <div>
            <p className="eyebrow text-accent-text">{c.whatIs.eyebrow}</p>
            <h2 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">{c.whatIs.title}</h2>
            {c.whatIs.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mt-5 text-lg leading-8 text-muted">
                {paragraph}
              </p>
            ))}
            <LocalLink to="/guides" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold hover:text-accent">
              {c.whatIs.guide} <ArrowRight className="size-4" />
            </LocalLink>
          </div>
          {/* 右侧示例：和 hero 一样的图片卡（3:4、sticker 外框、左上角标签、hover 放大） */}
          <div className="mx-auto w-full max-w-xs lg:mx-0 lg:max-w-none">
            <ImageCard
              src={site.whatIsExamples.photo}
              alt={c.alt.inputPhoto}
              label={c.madeWith.photoLabel}
              credit={c.madeWith.resultLabel}
            />
          </div>
        </div>
      </section>

      {/* Problem：不用本站时的麻烦，文案设为 null 就不渲染 */}
      {c.problem ? (
        <section id="problem" className="scroll-mt-20 border-t border-line py-20">
          <div className="container-page">
            <p className="eyebrow text-accent-text">{c.problem.eyebrow}</p>
            <h2 className="mt-3 max-w-2xl font-display text-4xl leading-tight sm:text-5xl">{c.problem.title}</h2>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {c.problem.items.map((item) => (
                <div key={item.title} className="card p-6">
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 leading-7 text-muted">{item.body}</p>
                </div>
              ))}
            </div>
            <LocalLink to={articlePath('howTo')} className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold hover:text-accent">
              {c.whatIs.sectionLinks.problem} <ArrowRight className="size-4" />
            </LocalLink>
          </div>
        </section>
      ) : null}

      {/* With / Without：自己做和用本站逐行对比，文案设为 null 就不渲染 */}
      {c.withWithout ? (
        <section id="compare" className="scroll-mt-20 border-t border-line bg-bg-soft/60 py-20">
          <div className="container-page max-w-4xl">
            <p className="eyebrow text-accent-text">{c.withWithout.eyebrow}</p>
            <h2 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">{c.withWithout.title}</h2>
            <table className="mt-10 w-full table-fixed overflow-hidden rounded-2xl bg-card text-left ring-1 ring-line">
              <thead>
                <tr className="border-b border-line text-sm">
                  <th scope="col" className="p-4 font-semibold text-muted">
                    {c.withWithout.without}
                  </th>
                  <th scope="col" className="p-4 font-semibold">
                    {c.withWithout.with}
                  </th>
                </tr>
              </thead>
              <tbody>
                {c.withWithout.rows.map((row) => (
                  <tr key={row.with} className="border-b border-line last:border-0">
                    <td className="p-4 align-top text-muted">
                      <span className="flex items-start gap-2">
                        <X className="mt-1 size-4 shrink-0 text-rose-500" aria-hidden /> {row.without}
                      </span>
                    </td>
                    <td className="p-4 align-top">
                      <span className="flex items-start gap-2">
                        <Check className="mt-1 size-4 shrink-0 text-emerald-600" aria-hidden /> {row.with}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <LocalLink to={articlePath('outfits')} className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold hover:text-accent">
              {c.whatIs.sectionLinks.compare} <ArrowRight className="size-4" />
            </LocalLink>
          </div>
        </section>
      ) : null}

      {/* How to：三步流程（关键词 H2；HowTo 富结果已下线，只用语义化有序列表） */}
      <section id="how-it-works" className="scroll-mt-20 border-t border-line py-20">
        <div className="container-page">
          <p className="eyebrow text-accent-text">{c.howTo.eyebrow}</p>
          <h2 className="mt-3 max-w-2xl font-display text-4xl leading-tight sm:text-5xl">{c.howTo.title}</h2>
          <ol className="mt-12 grid gap-5 md:grid-cols-3">
            {c.howTo.steps.map((step, index) => (
              <li key={step.title} className="card p-6">
                <span className="font-display text-4xl text-accent">{index + 1}</span>
                <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 leading-7 text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm font-semibold">
            <a href="#create" className="btn-primary">
              {c.howTo.cta}
            </a>
            <LocalLink to={articlePath('howTo')} className="inline-flex items-center gap-1.5 hover:text-accent">
              {c.howTo.guide} <ArrowRight className="size-4" />
            </LocalLink>
          </div>
        </div>
      </section>

      {/* Made with：照片 → 成片。桌面左列吸顶不动，右列按服装排成时间轴随页滚动 */}
      <section id="examples" className="scroll-mt-20 border-t border-line bg-bg-soft/60 py-20">
        <div className="container-page grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start lg:gap-x-20">
          <div className="min-w-0 space-y-4 lg:sticky lg:top-24 lg:self-start">
            <p className="eyebrow text-accent-text">{c.madeWith.eyebrow}</p>
            <h2 className="font-display text-4xl leading-tight sm:text-5xl">{c.madeWith.title}</h2>
            <div aria-hidden className="h-px w-14 bg-gradient-to-r from-accent to-accent-2" />
            <p className="max-w-md text-lg leading-8 text-muted">{c.madeWith.body}</p>
            <LocalLink to={articlePath('outfits')} className="inline-flex items-center gap-1.5 text-sm font-semibold hover:text-accent">
              {c.articles.outfits.title} <ArrowRight className="size-4" />
            </LocalLink>
          </div>
          {/* 每种风格是一个时间轴节点（服务端渲染，不依赖 JS）；单风格时不显示风格名 */}
          <div className="relative min-w-0">
            <div aria-hidden className="pointer-events-none absolute inset-y-0 left-[0.4375rem] w-px bg-line" />
            <ol className="flex flex-col gap-12 lg:gap-16">
              {VIDEO_STYLES.map((s, index) => (
                <li key={s.id} className="relative grid grid-cols-[max-content_minmax(0,1fr)] items-start gap-x-4 lg:gap-x-6" data-testid={`made-with-${s.id}`}>
                  <div className="relative z-[1] flex h-full justify-center">
                    <span aria-hidden className="mt-3 block size-3.5 rounded-full bg-gradient-to-br from-accent to-accent-2 ring-4 ring-bg-soft" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase leading-none tracking-[0.15em] text-accent-text">{String(index + 1).padStart(2, '0')}</div>
                    <h3 className="mt-3 font-display text-2xl leading-tight">{styleCopy(s.id).name}</h3>
                    <p className="mt-2 text-xs font-medium uppercase tracking-[0.12em] text-muted">{styleCopy(s.id).tagline}</p>
                    <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 sm:gap-4">
                      <figure className="min-w-0">
                        <img src={s.examples.madeWith.photo} alt={c.alt.inputPhoto} width={1200} height={1600} loading="lazy" className="sticker-md aspect-[3/4] w-full rounded-2xl border-2 border-muted object-cover" />
                        <figcaption className="mt-2 text-center text-xs text-muted">{c.madeWith.photoLabel}</figcaption>
                      </figure>
                      <ArrowRight className="size-5 text-muted" aria-hidden />
                      <div className="min-w-0">
                        <VideoCard video={s.examples.madeWith.video} poster={s.examples.madeWith.poster} />
                        <p className="mt-2 text-center text-xs text-muted">{c.madeWith.resultLabel}</p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Specs：一行一个事实，方便搜索和 AI 直接引用 */}
      {c.specs ? (
        <section id="specs" className="scroll-mt-20 border-t border-line py-20">
          <div className="container-page max-w-3xl">
            <p className="eyebrow text-accent-text">{c.specs.eyebrow}</p>
            <h2 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">{c.specs.title}</h2>
            <dl className="mt-10 divide-y divide-line border-y border-line">
              {c.specs.rows.map((row) => (
                <div key={row.label} className="grid gap-1 py-4 sm:grid-cols-[12rem_1fr] sm:gap-6">
                  <dt className="font-semibold">{row.label}</dt>
                  <dd className="text-muted">{row.value}</dd>
                </div>
              ))}
            </dl>
            <LocalLink to="/pricing" className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold hover:text-accent">
              {c.nav.pricing} <ArrowRight className="size-4" />
            </LocalLink>
            <LocalLink to="/guides" className="mt-8 ml-6 inline-flex items-center gap-1.5 text-sm font-semibold hover:text-accent">
              {c.whatIs.guide} <ArrowRight className="size-4" />
            </LocalLink>
          </div>
        </section>
      ) : null}

      {/* Features */}
      <section id="features" className="scroll-mt-20 border-t border-line py-20">
        <div className="container-page">
          <p className="eyebrow text-accent-text">{c.features.eyebrow}</p>
          <h2 className="mt-3 max-w-2xl font-display text-4xl leading-tight sm:text-5xl">{c.features.title}</h2>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {c.features.items.map((item, index) => {
              const Icon = FEATURE_ICONS[index % FEATURE_ICONS.length]!
              return (
                <div key={item.title} className="card p-6">
                  <span className="grid size-10 place-items-center rounded-xl bg-bg-soft">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 leading-7 text-muted">{item.body}</p>
                </div>
              )
            })}
          </div>
          <LocalLink to="/guides" className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold hover:text-accent">
            {c.whatIs.sectionLinks.features} <ArrowRight className="size-4" />
          </LocalLink>
        </div>
      </section>

      {/* Ideas：左右交替 */}
      <section className="border-t border-line py-20">
        <div className="container-page">
          <p className="eyebrow text-accent-text">{c.ideas.eyebrow}</p>
          <h2 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">{c.ideas.title}</h2>
          <div className="mt-14 space-y-20">
            {c.ideas.items.map((idea, index) => {
              const media = ex.ideas[index % ex.ideas.length]!
              const flip = index % 2 === 1
              return (
                <div key={idea.title} className="grid items-center gap-10 md:grid-cols-2">
                  <div className={`grid grid-cols-[0.8fr_1fr] items-end gap-4 ${flip ? 'md:order-2' : ''}`}>
                    <img src={media.photo} alt={c.alt.inputPhoto} width={1200} height={1600} loading="lazy" className="sticker-md aspect-[3/4] w-full rounded-2xl border-2 border-muted object-cover" />
                    <VideoCard video={media.video} poster={media.poster} />
                  </div>
                  <div className="space-y-4">
                    <span className="font-display text-5xl text-accent">0{index + 1}</span>
                    <h3 className="font-display text-3xl">{idea.title}</h3>
                    <p className="max-w-md text-lg leading-8 text-muted">{idea.body}</p>
                    <a href="#create" className="inline-flex items-center gap-1.5 text-sm font-semibold hover:text-accent">
                      {c.ideas.cta} <ArrowRight className="size-4" />
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
          <LocalLink to="/guides" className="mt-10 inline-flex items-center gap-1.5 text-sm font-semibold hover:text-accent">
            {c.whatIs.sectionLinks.ideas} <ArrowRight className="size-4" />
          </LocalLink>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-20 border-t border-line bg-bg-soft/60 py-20">
        <div className="container-page">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="eyebrow text-accent-text">{c.pricing.eyebrow}</p>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl">{c.pricing.title}</h2>
            <p className="mt-4 text-muted">{c.pricing.subtitle}</p>
          </div>
          <Pricing />
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 py-20">
        <div className="container-page">
          <Faq />
          <LocalLink to="/guides" className="mt-10 inline-flex items-center gap-1.5 text-sm font-semibold hover:text-accent">
            {c.whatIs.sectionLinks.faq} <ArrowRight className="size-4" />
          </LocalLink>
        </div>
      </section>

      {/* Final CTA */}
      <section className="pb-24">
        <div className="container-page">
          <div className="sticker relative overflow-hidden rounded-3xl border-2 border-muted bg-ink px-6 py-16 text-center text-ink-fg sm:px-12">
            <div
              className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(50%_60%_at_20%_0%,var(--accent),transparent_70%),radial-gradient(40%_50%_at_90%_100%,var(--accent-2),transparent_70%)]"
              aria-hidden
            />
            <div className="relative space-y-5">
              <h2 className="font-display text-4xl leading-tight sm:text-5xl">{c.finalCta.title}</h2>
              <p className="mx-auto max-w-xl opacity-80">{c.finalCta.body}</p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <a
                  href="#create"
                  className="group inline-flex h-12 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-ink-fg px-7 text-base font-bold text-ink transition-all hover:opacity-90 active:translate-y-px"
                >
                  {c.finalCta.makeVideo}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </a>
                <LocalLink
                  to="/pricing"
                  className="inline-flex h-12 shrink-0 items-center justify-center whitespace-nowrap rounded-xl border-2 border-ink-fg px-7 text-base font-bold text-ink-fg transition-colors hover:bg-ink-fg/10 active:translate-y-px"
                >
                  {c.finalCta.seePricing}
                </LocalLink>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}












