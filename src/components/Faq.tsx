import { ArrowRight, Plus } from 'lucide-react'
import { articlePath, type ArticleKey } from '#/config/site'
import { useContent } from '#/lib/i18n'
import { LocalLink } from './ui'

// 首页 FAQ：左侧标题和联系按钮在桌面吸顶，右侧沿用原来的折叠问答列表
export function Faq() {
  const f = useContent().faq
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.6fr)] lg:items-start lg:gap-x-20">
      <div className="min-w-0 space-y-4 lg:sticky lg:top-24 lg:self-start">
        <h2 className="font-display text-4xl leading-tight">{f.title}</h2>
        <p className="max-w-md text-muted">{f.body}</p>
        <LocalLink to="/contact" className="btn-ghost w-fit">
          {f.cta}
        </LocalLink>
      </div>
      <FaqList items={f.items} />
    </div>
  )
}

// FAQ 的 FAQPage 结构化数据：首页用它，和页面上渲染的问答是同一份
export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }
}

// 折叠问答列表：首页 FAQ 和文章页共用；item.guide 只有首页的 FAQ 会用到
export function FaqList({ items }: { items: Array<{ q: string; a: string; guide?: { article: ArticleKey; label: string } }> }) {
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item) => (
        <details key={item.q} className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-medium">
            {item.q}
            <Plus className="size-4 shrink-0 transition group-open:rotate-45" />
          </summary>
          <p className="mt-3 leading-7 text-muted">{item.a}</p>
          {item.guide ? (
            <LocalLink to={articlePath(item.guide.article)} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold hover:text-accent">
              {item.guide.label} <ArrowRight className="size-4" />
            </LocalLink>
          ) : null}
        </details>
      ))}
    </div>
  )
}
