import { useEffect, useRef, type ReactNode } from 'react'
import { VolumeX } from 'lucide-react'

// 竖屏示例视频：进入视口自动静音播放，离开暂停；尊重“减少动态效果”设置
export function VideoCard({
  video,
  poster,
  label,
  credit,
  className = '',
  variant = 'default',
}: {
  video: string
  poster: string
  label?: ReactNode
  credit?: string
  className?: string
  variant?: 'default' | 'sticker'
}) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) element.play().catch(() => {})
        else element.pause()
      },
      { threshold: 0.35 },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  if (variant === 'sticker') {
    return (
      <figure className={className}>
        <div className="relative aspect-[9/16] w-full overflow-hidden rounded-xl bg-black shadow-sm">
          <video
            ref={ref}
            src={video}
            poster={poster}
            muted
            loop
            playsInline
            preload="metadata"
            className="size-full object-cover"
          />
          <span className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur" aria-hidden>
            <VolumeX className="size-3.5" />
          </span>
          {label ? (
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-2 pt-6 pb-2 text-left text-xs font-semibold leading-tight text-white">
              {label}
            </figcaption>
          ) : null}
        </div>
        {credit ? <figcaption className="mt-1 truncate text-center text-[10px] text-muted">{credit}</figcaption> : null}
      </figure>
    )
  }

  return (
    <figure className={className}>
      <div className="relative aspect-[9/16] overflow-hidden rounded-2xl bg-bg-soft shadow-sm ring-1 ring-line">
        <video
          ref={ref}
          src={video}
          poster={poster}
          muted
          loop
          playsInline
          preload="metadata"
          className="size-full object-cover"
        />
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
