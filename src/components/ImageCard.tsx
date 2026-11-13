import type { ReactNode } from 'react'

// 竖屏示例图片：和 VideoCard 同一套卡片样式（比例、圆角、ring、标签、credit），图片场景复用
export function ImageCard({
  src,
  alt = '',
  label,
  credit,
  className = '',
}: {
  src: string
  alt?: string
  label?: ReactNode
  credit?: string
  className?: string
}) {
  return (
    <figure className={className}>
      <div className="relative aspect-[9/16] overflow-hidden rounded-2xl bg-bg-soft shadow-sm ring-1 ring-line">
        <img src={src} alt={alt} loading="lazy" className="size-full object-cover" />
        {label ? (
          <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
            {label}
          </span>
        ) : null}
      </div>
      {credit ? <figcaption className="mt-2 truncate text-xs text-muted">{credit}</figcaption> : null}
    </figure>
  )
}
