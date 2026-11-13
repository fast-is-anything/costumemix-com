import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { api, errorCode } from '#/lib/api'
import { useContent, useLocalePath } from '#/lib/i18n'
import { QrCode } from './QrCode'
import { ErrorText, Spinner } from './ui'

const POLL_MS = 2000
const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

function clock(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

// 桌面端的“扫码用手机上传”弹窗：取一个中转 token，二维码指向手机上传页（token 放 URL fragment，不进服务器日志和 Referer），
// 弹窗打开期间每 2 秒问一次服务器照片到了没；收到后交给 onPhoto（等同于在桌面选了这个文件）并关闭
export function PhoneUploadPanel({ onPhoto, onClose }: { onPhoto: (file: File) => void; onClose: () => void }) {
  const g = useContent().generator
  const lp = useLocalePath()
  const [session, setSession] = useState<{ token: string; expiresAt: number } | null>(null)
  const [round, setRound] = useState(0)
  const [expired, setExpired] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())
  // 轮询只在 token 变化时重启，回调始终取最新的
  const callbacks = useRef({ onPhoto, onClose })
  callbacks.current = { onPhoto, onClose }
  const closeRef = useRef<HTMLButtonElement>(null)

  // 弹窗交互：Esc 关闭、打开时锁定页面滚动、初始焦点放在关闭按钮
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') callbacks.current.onClose()
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [])

  // 取 token：打开面板和“换一个二维码”时各一次
  useEffect(() => {
    let cancelled = false
    setSession(null)
    setExpired(false)
    setError(null)
    api<{ token: string; expiresInMs: number }>('/api/handoff', { method: 'POST', json: {} })
      .then((data) => {
        if (!cancelled) setSession({ token: data.token, expiresAt: Date.now() + data.expiresInMs })
      })
      .catch((err) => {
        if (!cancelled) setError(errorCode(err))
      })
    return () => {
      cancelled = true
    }
  }, [round])

  // 轮询；关闭面板、卸载、到期或收到照片时停止
  useEffect(() => {
    if (!session || expired) return
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout>
    async function poll() {
      try {
        const response = await fetch('/api/handoff/take', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: session!.token }),
          credentials: 'same-origin',
          signal: controller.signal,
        })
        if (response.status === 200) {
          const blob = await response.blob()
          callbacks.current.onPhoto(new File([blob], `phone-photo.${EXT[blob.type] ?? 'jpg'}`, { type: blob.type }))
          callbacks.current.onClose()
          return
        }
        if (response.status === 410) return setExpired(true)
      } catch (err) {
        if (controller.signal.aborted) return
        console.warn('phone upload poll failed', err)
      }
      timer = setTimeout(poll, POLL_MS)
    }
    timer = setTimeout(poll, POLL_MS)
    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [session, expired])

  // 倒计时；到点后弹窗自动关闭（中转 token 已失效，留着只会误导）
  useEffect(() => {
    if (!session || expired) return
    const timer = setInterval(() => {
      const t = Date.now()
      if (t >= session.expiresAt) {
        setExpired(true)
        callbacks.current.onClose()
        return
      }
      setNow(t)
    }, 1000)
    return () => clearInterval(timer)
  }, [session, expired])

  const url = session ? `${location.origin}${lp('/phone-upload')}#${session.token}` : null

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center" data-testid="phone-upload-panel">
      {/* 点击遮罩关闭；遮罩本身不进 Tab 序列 */}
      <div aria-hidden className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="phone-upload-title"
        className="card relative w-full max-w-md space-y-4 p-5 shadow-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="phone-upload-title" className="font-display text-xl leading-tight">
            {g.phoneTitle}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={g.phoneCancel}
            className="grid size-8 shrink-0 place-items-center rounded-full text-muted transition hover:bg-bg-soft hover:text-fg"
            data-testid="phone-upload-close"
          >
            <X className="size-4" />
          </button>
        </div>
        {url && !expired ? (
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <QrCode text={url} label={g.phoneTitle} className="size-40 shrink-0 rounded-xl" />
            <div className="min-w-0 space-y-2 text-xs leading-5 text-muted">
              <p>{g.phoneHelp}</p>
              <p className="flex items-center gap-1.5 text-fg">
                <Spinner className="size-3.5" /> {g.phoneWaiting}
              </p>
              <p data-testid="phone-upload-countdown">{g.phoneExpiresIn(clock(session!.expiresAt - now))}</p>
              <p>
                <span className="block">{g.phoneLinkLabel}</span>
                <a href={url} target="_blank" rel="noreferrer" className="break-all underline" data-testid="phone-upload-link">
                  {url}
                </a>
              </p>
            </div>
          </div>
        ) : expired ? (
          <p className="rounded-xl bg-bg-soft p-4 text-sm" data-testid="phone-upload-expired">
            {g.phoneExpired}
          </p>
        ) : error ? null : (
          <div className="grid place-items-center py-8">
            <Spinner />
          </div>
        )}
        <ErrorText code={error} />
        <div className="flex justify-end gap-2">
          {expired || error ? (
            <button type="button" className="btn-primary px-4 py-2" onClick={() => setRound((n) => n + 1)} data-testid="phone-upload-renew">
              {g.phoneRenew}
            </button>
          ) : null}
          <button type="button" className="btn-ghost px-4 py-2" onClick={onClose} data-testid="phone-upload-cancel">
            {g.phoneCancel}
          </button>
        </div>
      </div>
    </div>
  )
}
