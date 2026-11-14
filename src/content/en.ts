// 英文文案。所有关键词/品牌通过 site 配置插值，上新词时通常只需改 site.ts；
// 文章与 FAQ 建议按新趋势重写，保证内容原创、贴合关键词。
import { VIDEO_STYLES } from '#/config/site'
import type { ArticleKey, site as Site } from '#/config/site'

type S = typeof Site
type StyleId = S['styles'][number]['id']
type StyleCopy = { name: string; tagline: string; variants?: Record<string, string> }
// faq 可选：有就在正文后渲染折叠问答，并输出 FAQPage 结构化数据
// 文章段落可选的表格（对比、规格），渲染在该段落的文字之后；第一列作为行标题
export type ArticleTable = { head: string[]; rows: string[][] }
export type ArticleContent = { title: string; description: string; intro: string; sections: Array<{ h: string; p: string[]; table?: ArticleTable }>; faq?: Array<{ q: string; a: string }> }
// FAQ 答案可附一条文章链接；锚文本用与文章标题不同的长尾词
type FaqItem = { q: string; a: string; guide?: { article: ArticleKey; label: string } }
// 首页可选转化区块，设为 null 就不渲染。痛点只写不用本站时的麻烦，不提产品；对比逐行写“自己做”和“用本站”，不承诺生成效果
type ProblemBlock = { eyebrow: string; title: string; items: Array<{ title: string; body: string }> }
type WithWithoutBlock = { eyebrow: string; title: string; without: string; with: string; rows: Array<{ without: string; with: string }> }
// 首页规格表：一行一个能直接引用的事实（输入、时长、格式、价格等），AI 回答常照搬这类规格。值从 site 读取或与配置一致；设为 null 就不渲染
type SpecsBlock = { eyebrow: string; title: string; rows: Array<{ label: string; value: string }> }

export function en(s: S) {
  const k = s.keyword
  // 是否在卖订阅（site.subscriptionsEnabled 且有套餐），决定订阅相关文案是否出现
  const subs = s.subscriptionsEnabled && s.plans.length > 0
  const b = s.brandName
  const { uploadDays, outputDays } = s.retention
  const photoRetention = uploadDays > 0 ? `deleted automatically ${uploadDays} days after upload` : 'kept until you delete them'
  const videoRetention = outputDays > 0 ? `kept for ${outputDays} days after they finish` : 'kept until you delete them'
  const { ga4Id, cfBeaconToken, umamiWebsiteId, clarityId } = s.analytics
  const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`
  const cheapest = [...s.packages].sort((x, y) => x.priceCents - y.priceCents)[0]!
  const typeNames: Record<string, string> = { 'image/jpeg': 'JPG', 'image/png': 'PNG', 'image/webp': 'WebP' }
  const uploadTypes = s.upload.contentTypes.map((t) => typeNames[t] ?? t).join(', ')
  const uploadMb = Math.round(s.upload.maxBytes / 1024 / 1024)
  // 每种风格的展示名和一句话介绍；site.styles 加风格时这里补一项（缺了 typecheck 报错），zh.ts 同
  const styles: Record<StyleId, StyleCopy> = {
    'santa-suit-v1': { name: 'Santa Suit', tagline: 'The classic red suit, beard included.' },
    'elf-costume-v1': { name: 'Elf Costume', tagline: 'Green tunic, pointy hat, workshop energy.' },
    'ugly-sweater-v1': { name: 'Ugly Christmas Sweater', tagline: 'Knitted, loud and party-ready.' },
    'id-photo-white-v1': {
      name: 'ID photo',
      tagline: 'Plain backdrop, head and shoulders.',
      variants: { 'white-1in': 'White background', 'blue-1in': 'Blue background' },
    },
  }
  return {
    styles,
    // 生成器顶部 tab 的展示名；键必须覆盖 site.ts 的 SCENES
    scenes: {
      christmas: { name: 'Christmas', tagline: 'Santa suits, elf costumes and ugly sweaters.' },
      'id-photo': { name: 'ID photos', tagline: 'Studio backgrounds for a clean head shot.' },
    },
    meta: {
      // 首页标题由品牌 + 主关键词 + 品类承诺组成，按 CostumeMix 品牌规范固定
      homeTitle: 'CostumeMix: AI Outfit Changer – Swap Clothes & Costumes',
      homeDescription: 'CostumeMix is an AI outfit changer: one photo plus an outfit becomes a ready-to-post image or video in minutes. For personal fun, viral posts and brand promos.',
      pricingTitle: `Pricing — ${b}`,
      pricingDescription: subs
        ? `Credit packs and monthly or yearly plans for AI outfit videos. Pack credits never expire, cancel anytime, failed renders are refunded.`
        : `Simple credit packs for AI outfit videos. Pay once, credits never expire, failed renders are refunded automatically.`,
      contactTitle: `Contact — ${b}`,
      contactDescription: `Questions about billing, refunds, a failed render or partnerships? Reach the ${b} team, we usually reply within one business day.`,
      signInTitle: `Sign in — ${b}`,
      dashboardTitle: `My videos — ${b}`,
      privacyDescription: `How ${b} collects, uses and protects the photos, videos and account data behind your ${k} videos.`,
      termsDescription: `The rules for creating ${k} videos with ${b}: consent, acceptable use, credits and liability.`,
      refundDescription: `When ${b} returns credits or refunds a credit pack, and how long refunds take to arrive.`,
      reportTitle: `Report content — ${b}`,
      reportDescription: `Report a ${b} video that shows you without consent, involves a minor or infringes your rights. We review every report within ${s.takedownSlaHours} hours.`,
      verifyTitle: `Verify a Video — Made with ${b}?`,
      verifyDescription: `Check whether a video was made with ${b}. Choose the file and we read its AI label in your browser; the file is never uploaded.`,
      ogImageAlt: `${b}: turn one photo into a new outfit video`,
      breadcrumbHome: 'Home',
    },
    alt: {
      inputPhoto: `Example input photo for an ${k} video`,
    },
    nav: {
      features: 'Features',
      examples: 'Examples',
      pricing: 'Pricing',
      signIn: 'Sign in',
      dashboard: 'My creations',
      billing: 'Billing',
      settings: 'Settings',
      admin: 'Admin',
      signOut: 'Sign out',
      language: 'Language',
      toggleTheme: 'Toggle theme',
      credits: (n: number) => `${n} credits`,
      menu: 'Menu',
    },
    hero: {
      title: `${k}`,
      subtitle: 'Want the fun of making your next viral short? Pick CostumeMix. Tired of changing clothes for it? Pick CostumeMix. The most complete one-click outfit changer online: upload a selfie, switch today’s look in seconds and get a preview video right away.',
      badge: 'Christmas costume trend',
      original: 'Original costume clip',
      aiVersion: 'Your AI version',
      chips: ['Keep your face', 'Any costume', 'Ready for Reels'],
      creditNote: 'Sample clips are placeholders for this demo. Real renders use licensed costume footage.',
      // hero 上方两个指南入口的短标签
      guideLinks: { guides: 'AI Outfit Changer Guides', howTo: 'How to Make a Funny AI Christmas Video' },
    },
    generator: {
      // 只给读屏用（sr-only），不放关键词，避免隐藏文字堆词
      title: 'Create your video',
      stepPhoto: 'Your photo',
      dropTitle: 'Drop a photo or click to upload',
      dropHint: 'JPG, PNG or WebP · up to 10 MB',
      guidance: 'Best results: one person, facing the camera, even lighting, head and shoulders visible. Avoid sunglasses, masks and heavy filters.',
      change: 'Change photo',
      photoLeft: 'Left person',
      photoRight: 'Right person',
      duoGuidance: 'Two people are in this clip: add one photo per person, left and right as they stand.',
      uploading: 'Uploading…',
      uploaded: 'Photo ready',
      stepStyle: 'Outfit',
      stepLength: 'Length',
      stepVariant: 'Background',
      seconds: (n: number) => `${n} s`,
      full: 'full',
      creditsLabel: (n: number) => `${n} credits`,
      consent: 'This photo is of me, or I have permission from the person in it. They are 18 or older and not a celebrity or public figure.',
      ctaSignUp: 'Sign up free and start',
      ctaGenerate: (n: number) => `Generate outfit video · ${n} credits`,
      ctaGenerateImage: (n: number) => `Generate photo · ${n} credits`,
      ctaBuy: 'Get credits to generate',
      ctaBuyPack: (credits: number, price: string) => `Get ${credits} credits · ${price}`,
      seePacks: 'See all packs',
      balance: (n: number) => `Balance: ${n} credits`,
      needMore: (n: number) => `You need ${n} more credits for this length.`,
      needPhoto: 'Add a photo first.',
      needConsent: 'Please confirm the consent box.',
      queued: 'In the queue…',
      processing: 'Rendering your outfit video. This usually takes a few minutes; you can leave this page.',
      succeeded: 'Your outfit video is ready',
      failed: 'This render failed.',
      refunded: 'The credits have been returned to your balance.',
      download: 'Download MP4',
      viewAll: 'Open My videos',
      makeAnother: 'Make another',
      aiNotice: 'This video is AI-generated. Keep the label and say it is AI when you share it.',
      expiresOn: (date: string) => `Download it before ${date}. Videos are deleted automatically after that.`,
      draftKept: 'Your photo and choices are kept while you sign in.',
      guestPrice: (credits: number, price: string) => `This video uses ${credits} credits · packs from ${price}`,
      phoneOpen: 'Photo on your phone? Scan to upload',
      phoneTitle: 'Upload from your phone',
      phoneHelp: 'Point your phone camera at the code and open the link, then pick or take a photo. No sign-in needed on your phone.',
      phoneWaiting: 'Waiting for your photo…',
      phoneExpiresIn: (time: string) => `Code expires in ${time}`,
      phoneExpired: 'This code has expired.',
      phoneRenew: 'Get a new code',
      phoneCancel: 'Cancel',
      // 点生成但条件不满足时的弹窗
      missingTitle: 'A couple of things first',
      missingAction: 'Got it',
      phoneLinkLabel: 'Or open this link on your phone',
    },
    phoneUpload: {
      title: 'Upload from your phone',
      noToken: 'Scan the code shown on your computer to start.',
      choose: 'Choose or take a photo',
      uploading: 'Sending to your computer…',
      done: 'Photo sent to your computer. You can close this page.',
    },
    madeWith: {
      eyebrow: `Made with ${b}`,
      title: 'One photo in, a new outfit out',
      body: 'No sewing, no fitting room, no tripod. Upload a clear photo, choose an outfit and the render puts you in it while the clip keeps its original camera moves.',
      photoLabel: 'Uploaded photo',
      resultLabel: 'Generated clip',
    },
    problem: {
      eyebrow: 'The catch',
      title: 'Why is everyone else faster at producing visuals and videos?',
      items: [
        { title: 'Outfit cost and shipping', body: 'Buying an outfit and waiting for delivery stretch the whole process, and a suit, gown or costume is usually worn once before it goes into storage.' },
        { title: 'Booking a model and a set', body: 'You chase the model’s schedule, agree on a slot, then line up a location and a photographer. Setup takes longer than the video.' },
        { title: 'Editing and rendering the effects', body: 'Then come the trims, captions and audio, endless nudges in a phone editor and a wait for the effects render — with nothing left in the tank.' },
      ],
    } as ProblemBlock | null,
    withWithout: {
      eyebrow: 'Side by side',
      title: `A real outfit shoot vs. using ${b}`,
      without: 'Do it yourself',
      with: `Get it faster with ${b}`,
      rows: [
        { without: 'Buy or rent an outfit you wear once', with: 'Pick an outfit from one photo' },
        { without: 'Book a shoot or ask a friend to film', with: 'No camera, no studio, no tripod' },
        { without: 'Learn poses and re-shoot for the light', with: 'The clip keeps its original camera moves' },
        { without: 'Edit captions and audio on your phone', with: 'Download a finished MP4' },
      ],
    } as WithWithoutBlock | null,
    // 首页关键词区块（one-page SEO）：H2 带关键词，上新词时按趋势本身重写 whatIs
    howTo: {
      eyebrow: 'How it works',
      title: 'How to change your outfit with AI in 3 steps',
      steps: [
        { title: 'Upload one clear photo', body: 'One person, facing the camera, in even light. JPG, PNG or WebP up to 10 MB.' },
        { title: 'Choose an outfit and a length', body: 'Pick a look from the outfit library, then a 6-second hook or the full 18-second clip. 1 credit = 1 second of video.' },
        { title: 'Generate and download', body: 'The render finishes in a few minutes. Download the MP4 without a watermark and post it anywhere.' },
      ],
      cta: 'Start with your photo',
      guide: 'Read the step-by-step guide',
    },
    whatIs: {
      eyebrow: 'About the trend',
      title: 'What is an AI outfit changer?',
      paragraphs: [
        'An AI outfit changer takes an ordinary photo and renders the person in it wearing a different outfit. The result is a short vertical video rather than a still image, so the clothes move with the person instead of sitting in a static edit.',
        `${b} is built around that idea: upload one photo, choose an outfit, and the model casts you into a licensed outfit clip while keeping the timing and camera work of the original. Christmas costumes are the current collection; more outfits are added by season.`,
      ],
      guide: 'Read the full AI Outfit Changer Guides',
    },
    specs: {
      eyebrow: 'At a glance',
      title: 'AI outfit changer specs',
      rows: [
        { label: 'Input', value: `One clear photo of one person, ${uploadTypes} up to ${uploadMb} MB` },
        { label: 'Outfits', value: VIDEO_STYLES.map((style) => styles[style.id as StyleId].name).join(', ') },
        { label: 'Video length', value: `${s.durations.map((d) => d.seconds).join(', ')} seconds` },
        { label: 'Output', value: `Vertical ${s.template.aspectRatio} MP4, no watermark` },
        { label: 'Price', value: `1 credit = 1 second of video; packs from ${usd(cheapest.priceCents)} for ${cheapest.credits} credits` },
        { label: 'Credits', value: subs ? 'Pack credits never expire; plan credits expire at the end of each month' : 'Never expire, no subscription' },
        { label: 'Render time', value: 'A few minutes' },
        { label: 'Failed renders', value: 'Credits refunded automatically' },
      ],
    } as SpecsBlock | null,
    features: {
      eyebrow: 'Features',
      title: 'Everything you need from an AI outfit changer',
      items: [
        { title: 'One photo is enough', body: 'A single clear selfie is all the model needs to rebuild you inside the new outfit.' },
        { title: 'The outfit stays on', body: 'The render keeps the outfit, props and set from the reference clip and puts your face and hair into it.' },
        { title: 'Vertical and ready to post', body: `Exports in ${s.template.aspectRatio} so it drops straight into Reels, Shorts or ${s.trendPlatform}.` },
        { title: 'Pick your length', body: 'Grab a short hook or the full scene. You only pay for the seconds you render.' },
        { title: 'Private by default', body: `Uploads are stored privately, used only for your render and ${photoRetention}.` },
        {
          title: 'Fair billing',
          body: subs
            ? 'Credit packs never expire and plans can be canceled anytime. If a render fails, the credits go straight back to your balance.'
            : 'Credits never expire. If a render fails, the credits go straight back to your balance.',
        },
      ],
    },
    ideas: {
      eyebrow: 'Ideas',
      title: 'AI outfit ideas: what people make',
      items: [
        { title: 'Christmas cards that move', body: 'Send a 6-second Santa clip instead of another family photo.' },
        { title: 'Party invitations', body: 'Put the host in an elf costume and drop the clip into the group chat.' },
        { title: 'Creator content in minutes', body: 'Post an outfit reel without buying the outfit or booking a shoot.' },
      ],
      cta: 'Try it with your photo',
    },
    pricing: {
      eyebrow: 'Pricing',
      title: 'AI outfit changer pricing',
      subtitle: subs
        ? '1 credit = 1 second of video. Buy a pack that never expires, or subscribe for a fresh allowance every month.'
        : '1 credit = 1 second of video. No subscription, no expiry.',
      popular: 'Most popular',
      // 锚定价（site.packages[].anchorPriceCents）的划线原价和折扣
      was: 'Regular price',
      save: (percent: number) => `Save ${percent}%`,
      buy: 'Buy credits',
      buying: 'Opening checkout…',
      // 后台“暂停收款”打开时代替购买按钮和价格说明
      paused: 'Payments opening soon',
      pausedNote: 'We’re finishing setup with our payment partner, so purchases aren’t open yet. Check back soon.',
      credits: (n: number) => `${n} credits`,
      makes: (items: { videos: number; seconds: number }[]) =>
        `Makes ${items.map((i) => `${i.videos} × ${i.seconds}s`).join(' or ')} ${items.length === 1 && items[0]!.videos === 1 ? 'video' : 'videos'}`,
      bullets: ['Credits never expire', 'All video lengths', 'HD MP4 download, no watermark', 'Automatic refund on failed renders'],
      note: 'Prices in USD. Taxes are calculated at checkout by our payment partner.',
      // 价格页底部的教程链接
      guide: 'Before you buy: how to get a great AI outfit video',
      packages: {
        starter: { name: 'Starter', tagline: 'Try the trend' },
        party: { name: 'Party', tagline: 'For you and your friends' },
        squad: { name: 'Squad', tagline: 'For creators and teams' },
      } as Record<string, { name: string; tagline: string }>,
      // 订阅套餐（site.plans）
      plansTitle: 'Subscriptions',
      plansBody: 'Credits are added at the start of every month of your plan and expire when that month ends. Cancel anytime and keep your plan until the period ends.',
      packsTitle: 'Credit packs',
      perMonth: '/ month',
      perYear: '/ year',
      monthlyCredits: (n: number) => `${n} credits every month`,
      yearlyMonthly: (price: string) => `${price} / month, billed yearly`,
      subscribe: 'Subscribe',
      planBullets: ['Credits refresh every month', 'All video lengths', 'HD MP4 download, no watermark', 'Cancel anytime'],
      plans: {
        monthly: { name: 'Monthly', tagline: 'Flexible, cancel anytime' },
        yearly: { name: 'Yearly', tagline: 'Best value for regular creators' },
      } as Record<string, { name: string; tagline: string }>,
      renewalNote: 'Subscriptions renew automatically at the price shown until you cancel. Unused monthly credits do not roll over.',
    },
    faq: {
      title: 'AI outfit changer FAQ',
      body: 'Still unsure? Our team replies within one business day.',
      cta: 'Contact support',
      items: [
        {
          q: `What is ${b}?`,
          a: `${b} is an AI outfit changer: upload one photo and get a short video of yourself in a different outfit, ready to post.`,
          guide: { article: 'trend', label: 'What an AI Christmas video is' },
        },
        {
          q: 'Which photo works best?',
          a: 'A recent photo of one person facing the camera, with even light and the head and shoulders in frame. Group shots, sunglasses and strong filters lower the quality.',
          guide: { article: 'howTo', label: 'Photo tips for a better outfit video' },
        },
        {
          q: 'Which outfits can I choose?',
          a: `Today: ${VIDEO_STYLES.map((style) => styles[style.id as StyleId].name).join(', ')}. Each one is a licensed clip, and more outfits are added each season.`,
          guide: { article: 'outfits', label: 'See the Christmas outfit ideas' },
        },
        {
          q: 'Can I make an AI Santa video or an AI elf video?',
          a: 'Yes. Pick the Santa suit for an AI Santa video, or the elf costume for an AI elf video. Both use the same single photo and render a vertical clip in minutes.',
        },
        {
          q: 'Is this also an AI costume changer or AI outfit generator?',
          a: 'It is: one AI outfit changer, AI clothes changer and AI outfit generator. Upload a photo, pick an outfit and the model puts you in it.',
        },
        { q: 'How long does a render take?', a: 'Most videos finish in 2–8 minutes depending on length and queue. You can close the page; finished videos wait in My videos.' },
        {
          q: 'How do credits work?',
          a: subs
            ? 'Each second of video costs one credit. Credits from packs never expire; subscription credits are added every month and expire at the end of that month. Renders use the credits that expire soonest first, and credits are refunded automatically if a render fails.'
            : 'Each second of video costs one credit. Credits are bought in packs, never expire and are refunded automatically if a render fails.',
        },
        ...(subs
          ? [{ q: 'How do I cancel my subscription?', a: 'Open My account → Billing and choose Cancel renewal. You won’t be charged again, and your plan and credits stay available until the end of the current period.' }]
          : []),
        { q: 'Can I use someone else’s photo?', a: 'Only with their permission, and never photos of minors, celebrities or public figures. Accounts that break this rule are closed.' },
        { q: 'What happens to my photos?', a: `Uploads are private, used only to make your video and ${photoRetention}. Finished videos are ${videoRetention}. Deleting your account removes everything right away.` },
        { q: 'Can I use the video commercially?', a: 'Yes. You can post and monetise the video on your own channels. Keep the AI label visible and do not present it as real footage of the person.' },
        { q: 'Is there a watermark?', a: 'No visible watermark. You download a vertical MP4 that is ready to post.' },
        { q: 'What happens if a render fails?', a: 'The credits are refunded automatically, so a failed render never costs you credits.' },
      ] as FaqItem[],
    },
    finalCta: {
      title: 'YOUR NEXT OUTFIT STARTS HERE',
      body: 'One photo, a few minutes, a whole new look. Pick an outfit and get a vertical clip ready to post.',
      cta: 'Create my costume video',
      makeVideo: 'Make my outfit video',
      seePricing: 'See pricing',
    },
    footer: {
      statement: `${b} is an independent project and is not affiliated with ${s.trendPlatform}, Elf Yourself or the costume brands shown in the sample clips.`,
      resources: 'Resources',
      legal: 'Legal',
      contact: 'Contact',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
      refund: 'Refund Policy',
      report: 'Report content',
      verify: 'Verify a video',
      rights: `© ${new Date().getFullYear()} ${b}. All rights reserved.`,
      // 页脚“问问 AI”：llms.txt 链接 + 几个带预填提问的 AI 按钮
      agentDocs: 'AI & agent docs',
      askAi: `See what ChatGPT, Claude, Perplexity, Gemini or Grok say about ${b}.`,
      askAiLabel: (ai: string) => `Ask ${ai} about ${b}`,
      askAiPrompt: (url: string, llms: string) => `What is ${b} (${url})? Summarize what it does, how pricing works and who it is for. Site summary for AI: ${llms}`,
    },
    support: { label: 'Help & support' },
    // 统计同意横幅：配置了 GA4 或 Clarity 时出现；bodyOptOut 用于默认开启统计 Cookie 的地区（从页脚打开时）
    consent: {
      title: 'Analytics cookies',
      body: clarityId
        ? `We use ${ga4Id ? 'Google Analytics, ' : ''}Microsoft Clarity session recordings and a first-party referral cookie to see how the site is used. Until you accept, Clarity records without cookies and nothing else is set; change it any time under “Cookie settings”.`
        : 'We use Google Analytics and a first-party referral cookie to see how the site is used. Nothing is set unless you accept; change it any time under “Cookie settings”.',
      bodyOptOut: clarityId
        ? `Analytics cookies are on by default in your region. We use ${ga4Id ? 'Google Analytics, ' : ''}Microsoft Clarity session recordings and a first-party referral cookie to see how the site is used. Choose “Reject” to turn them off; Clarity then records without cookies.`
        : 'Analytics cookies are on by default in your region. We use Google Analytics and a first-party referral cookie to see how the site is used. Choose “Reject” to turn them off.',
      learnMore: 'Privacy Policy',
      accept: 'Accept',
      reject: 'Reject',
      settings: 'Cookie settings',
      // × 只收起本次，不记录选择
      dismiss: 'Dismiss',
    },
    signIn: {
      title: `Sign in to ${b}`,
      body: 'Use your Google account. New here? An account is created automatically.',
      google: 'Continue with Google',
      devTitle: 'Developer login (local only)',
      devEmail: 'Email',
      devSubmit: 'Sign in as this email',
      legal: 'By continuing you agree to our Terms of Service and Privacy Policy.',
      notConfigured: 'Google sign-in is not configured yet.',
    },
    dashboard: {
      title: 'My account',
      tabs: { videos: 'Creations', billing: 'Billing', settings: 'Settings' },
      buyCredits: 'Buy credits',
      newVideo: 'New creation',
      empty: 'No creations yet. Upload a photo on the home page to make your first one.',
      status: { queued: 'Queued', processing: 'Rendering', succeeded: 'Ready', failed: 'Failed', expired: 'Expired', removed: 'Removed' } as Record<string, string>,
      refundedNote: 'Credits refunded',
      delete: 'Delete',
      confirmDelete: 'Delete this item permanently?',
      download: 'Download',
      seconds: (n: number) => `${n} s`,
      expired: 'Expired and deleted',
      removed: 'Removed after a content report',
      expiresOn: (date: string) => `Available until ${date}`,
      share: 'Share',
      confirmShare: 'Create a public link to this video? Anyone with the link can watch it. Your name and email are not shown, and you can stop sharing at any time.',
      sharedNote: 'Anyone with the link can watch this video.',
      openSharePage: 'Open page',
      copyLink: 'Copy link',
      linkCopied: 'Copied',
      copyPrompt: 'Copy this link:',
      stopSharing: 'Stop sharing',
      confirmStopSharing: 'Stop sharing? The current link will stop working for everyone.',
    },
    billing: {
      orders: 'Orders',
      ledger: 'Credit history',
      noOrders: 'No orders yet.',
      noLedger: 'No credit activity yet.',
      expiring: (credits: number, date: string) => `${credits} ${credits === 1 ? 'credit expires' : 'credits expire'} on ${date}.`,
      expiringHint: 'Renders use the credits that expire soonest first.',
      columns: { date: 'Date', pack: 'Pack', amount: 'Amount', status: 'Status', change: 'Change', reason: 'Reason' },
      orderStatus: { pending: 'Pending', paid: 'Paid', partially_refunded: 'Partially refunded', failed: 'Failed', refunded: 'Refunded', canceled: 'Canceled' } as Record<string, string>,
      refundedLine: (amount: string, credits: number) => `Refunded ${amount} · ${credits} credits`,
      details: 'Details',
      loadMore: 'Load more',
      order: {
        title: 'Order details',
        back: 'Back to billing',
        orderId: 'Order ID',
        status: 'Status',
        pack: 'Pack',
        price: 'Price',
        amountPaid: 'Amount paid',
        refunded: 'Refunded',
        created: 'Created',
        paidAt: 'Paid on',
        refundedAt: 'Refunded on',
        provider: 'Payment processor',
        providers: { waffo: 'Waffo', dodo: 'Dodo Payments', stripe: 'Stripe', mock: 'Test checkout' } as Record<string, string>,
        print: 'Print',
        invoiceNote: 'Payments are handled by our payment processor as the merchant of record, and it emails your receipt or tax invoice. Can’t find it? Contact support with this order ID.',
        mockNote: 'This is a test order from the local mock checkout. No money was charged and no invoice is issued.',
        unpaidNote: 'This order was not paid. If you were charged anyway, contact support with this order ID.',
        contact: 'Contact support',
      },
      reasons: {
        purchase: 'Credit purchase',
        generation: 'Video render',
        generation_refund: 'Failed render refund',
        order_refund: 'Order refunded',
        admin_adjust: 'Adjustment by support',
        expire: 'Credits expired',
        redeem: 'Redeem code',
        referral: 'Referral reward',
        referral_refund: 'Referral reward reversed (order refunded)',
        signup_bonus: 'Welcome bonus',
        account_deleted: 'Account deleted',
        subscription: 'Subscription credits',
      } as Record<string, string>,
      subscription: {
        title: 'Subscription',
        status: { active: 'Active', past_due: 'Payment failed', canceled: 'Canceled', expired: 'Ended' } as Record<string, string>,
        monthlyCredits: (n: number) => `${n} credits every month`,
        renewsOn: (date: string, price: string) => `Renews on ${date} for ${price}.`,
        endsOn: (date: string) => `Canceled. Your plan stays active until ${date} and you won’t be charged again.`,
        ended: (date: string) => `Ended on ${date}.`,
        nextGrant: (date: string) => `Next monthly credits on ${date}.`,
        pastDue: 'Your renewal payment failed. Update your payment method to keep your plan; the payment will be retried automatically.',
        cancel: 'Cancel renewal',
        confirmCancel: 'Cancel renewal? You keep your plan and credits until the end of the current period.',
        resume: 'Keep my plan',
        resumeInPortal: 'Changed your mind? Open Manage payment to resume your plan.',
        portal: 'Manage payment',
        seePlans: 'See plans',
      },
    },
    settings: {
      profile: 'Profile',
      email: 'Email',
      memberSince: 'Member since',
      signOut: 'Sign out',
      dataTitle: 'Your data',
      dataBody: 'Download a JSON copy of your account, orders, credit history, uploads, generations, messages and reports. Video files are not included; download them from your dashboard while they are kept.',
      dataButton: 'Export my data',
      dangerTitle: 'Delete account',
      dangerBody: 'Deletes your uploads and videos and signs you out everywhere. Remaining credits are forfeited. Order records are kept for accounting. Signing up again with the same email does not include the sign-up bonus.',
      confirmLabel: 'Type DELETE to confirm',
      deleteButton: 'Delete my account',
      redeemTitle: 'Redeem a code',
      redeemBody: 'Have a promo or gift code? Enter it to add credits to your account. Each code can be used once per account.',
      redeemButton: 'Redeem',
      redeemSuccess: (credits: number, expires: string | null) =>
        `Added ${credits} ${credits === 1 ? 'credit' : 'credits'}${expires ? `, valid until ${expires}` : ''}.`,
      referralTitle: 'Invite friends',
      referralBody: (credits: number) =>
        `Share your link. When a friend signs up through it and makes their first purchase, you get ${credits} ${credits === 1 ? 'credit' : 'credits'}. If that order is refunded, the reward is taken back.`,
      referralCopy: 'Copy link',
      referralCopied: 'Copied',
      referralStats: (invited: number, rewarded: number, credits: number) =>
        `Signed up: ${invited} · Purchased: ${rewarded} · Credits earned: ${credits}`,
    },
    checkout: {
      successTitle: 'Payment received',
      pendingTitle: 'Confirming your payment…',
      pendingBody: 'This usually takes a few seconds. You can keep this tab open.',
      failedTitle: 'Payment was not completed',
      failedBody: 'No charge was made. You can try again from the pricing page.',
      added: (n: number) => `${n} credits were added to your balance.`,
      slowBody: 'Still waiting for the payment provider. Credits will appear automatically; if they don’t within an hour, contact support with your order ID.',
      orderId: 'Order ID',
      start: 'Start creating',
      backToPricing: 'Back to pricing',
      mockTitle: 'Test checkout',
      mockBody: 'This is the local mock payment provider. Nothing is charged.',
      mockPay: 'Simulate successful payment',
      mockFail: 'Simulate failed payment',
    },
    contact: {
      title: 'Contact us',
      body: `Write to ${s.supportEmail} or use the form below. Include your order ID for billing questions.`,
      email: 'Your email',
      topic: 'Topic',
      topics: { general: 'General', billing: 'Billing', bug: 'Bug report', partnership: 'Partnership' } as Record<string, string>,
      message: 'Message',
      send: 'Send message',
      sent: 'Thanks! We’ll get back to you soon.',
      guides: `Photo tips and trend background: browse the ${k} guides`,
    },
    verify: {
      title: 'Verify a video',
      body: `Check whether a video was made with ${b}. Every video we generate carries a machine-readable AI label in its file metadata. Choose a file and your browser looks for that label, then we confirm it against our records. The file is read on your device and is never uploaded.`,
      choose: 'Choose a video file',
      checking: 'Checking…',
      foundTitle: `Made with ${b}`,
      foundBody: 'This video carries our AI label and the label matches a video we generated.',
      foundByIdBody: 'This ID matches a video we generated. Choose the file to check that it carries our label.',
      fields: { generator: 'Generator', model: 'Model', created: 'Created', id: 'Video ID' },
      notFoundTitle: 'No matching record',
      notFoundBody: 'The label points to a video we have no record of. It may have been deleted, or the label may have been copied from another file.',
      noMarkerTitle: 'No AI label found',
      noMarkerBody: `We did not find a ${b} AI label in this file. Videos that a platform re-compressed or re-uploaded usually lose their metadata, so this does not prove the video is real or made by someone else.`,
      readError: 'We could not read this file. Choose an MP4 video.',
      lookupError: 'We could not reach our records right now. Please try again in a minute.',
      caveat: 'The label is metadata: it can be removed, and it can be copied onto another file. A match shows the label belongs to a real generation, not that the pictures are unchanged.',
    },
    report: {
      title: 'Report content or request removal',
      body: `If a video made with ${b} shows you without your consent, involves a minor, impersonates someone or infringes your rights, tell us here. A person reviews every report and qualifying content is removed within ${s.takedownSlaHours} hours. Removed photos are blocked from being uploaded again.`,
      name: 'Your full name',
      signature: 'Electronic signature (type your full name)',
      email: 'Email we can reach you at',
      contentRef: 'Where is the content?',
      contentRefHint: 'Paste a link or the file name (downloaded files contain an ID such as gen_…), or describe where you saw it.',
      reason: 'Reason',
      reasons: {
        intimate: 'Intimate or sexual content without consent',
        impersonation: 'Impersonation or a deceptive deepfake',
        minor: 'It shows a minor',
        copyright: 'Copyright or trademark',
        other: 'Something else',
      } as Record<string, string>,
      details: 'Details (optional)',
      isDepicted: 'I am the person shown, or I am authorised to act on their behalf.',
      attest: 'I believe in good faith that this content was made or shared without the consent of the person shown, and the information in this report is accurate.',
      submit: 'Send report',
      sent: (id: string) => `Report received. Your reference is ${id}. We may contact you at the email above if we need more information.`,
      urgent: 'If someone is in immediate danger, contact local emergency services. Child sexual abuse material should also be reported to the NCMEC CyberTipline or your national hotline.',
      cybertip: 'NCMEC CyberTipline',
    },
    // 成片公开分享页 /v/<id>
    share: {
      title: `An AI video made with ${b}`,
      goneTitle: `Video unavailable — ${b}`,
      description: 'Watch this AI-generated Christmas costume video, then turn one photo into your own.',
      heading: `Made with ${b}`,
      body: 'This Christmas costume video was generated by AI from a single photo. Upload yours to make your own.',
      disclosure: 'This video is AI-generated and does not show real events.',
      cta: 'Make your own',
      reportPrompt: 'Shows you without consent or breaks our rules?',
      report: 'Report this video',
      gone: { missing: 'This link doesn’t work', expired: 'This video has expired', removed: 'This video was removed' },
      goneBody: 'The video may have been deleted or expired, or its owner stopped sharing it.',
    },
    common: {
      loading: 'Loading…',
      retry: 'Try again',
      home: 'Back to home',
      notFoundTitle: 'Page not found',
      notFoundBody: 'The page you are looking for does not exist or has moved.',
      errorTitle: 'Something went wrong',
      errorBody: `Please try again. If it keeps happening, email ${s.supportEmail}.`,
      errorRef: (id: string) => `Error ID: ${id} (include it when you contact us)`,
      signInRequired: 'Please sign in to continue.',
      lastUpdated: 'Last updated',
      aiGenerated: 'AI-generated',
      breadcrumb: 'Breadcrumb',
      maintenance: 'We’re doing some maintenance. New videos and purchases are paused for a short while; your videos and credits are safe.',
    },
    // 文章列表页 /guides
    guides: {
      nav: 'Guides',
      title: 'AI outfit guides',
      metaTitle: `AI Outfit & Christmas Video Guides — ${b}`,
      description: `Guides to AI outfit videos and Christmas costume clips: where the trend came from, which photos work best, outfit ideas and step-by-step tips.`,
      intro: 'Background on AI outfit videos and practical tips for turning one photo into a new look.',
      related: 'Related guides',
      styleDemo: 'See the costume clips in action',
      faqTitle: 'FAQ',
    },
    errors: {
      unauthorized: 'Please sign in first.',
      insufficient_credits: 'Not enough credits for this length.',
      invalid_code: 'This code is invalid or has expired.',
      code_used_up: 'This code has been fully redeemed.',
      already_redeemed: 'You have already redeemed this code.',
      too_many_active_jobs: 'You already have 3 videos rendering. Please wait for one to finish.',
      maintenance: 'We’re doing some maintenance. Please try again in a little while.',
      checkout_paused: 'Payments aren’t open yet. Please check back soon.',
      daily_limit: 'We’ve hit today’s rendering capacity. Please try again tomorrow; your credits were not used.',
      rate_limited: 'Too many requests. Please wait a minute and try again.',
      file_too_large: 'That file is larger than 10 MB.',
      photo_too_small: `That photo is too small for the face to come through. Please use one at least ${s.upload.minSide} px on its shorter side.`,
      photo_bad_ratio: `That photo is too narrow or too wide for the video model. Please pick one whose long side is at most ${s.upload.maxRatio}× its short side, like a normal portrait or selfie (crop long screenshots first).`,
      length_required: 'Your browser sent the file in a way we can’t accept. Please try again in another browser.',
      unsupported_file_type: 'Please upload a JPG, PNG or WebP image.',
      invalid_upload: 'Please upload the photo again.',
      invalid_style: 'That costume isn’t available. Please pick another one.',
      queue_unavailable: 'Our render queue is busy. Your credits were returned; please try again.',
      payment_not_configured: 'Payments are not available right now.',
      payment_provider_error: 'The payment provider did not respond. Please try again.',
      invalid_email: 'Please enter a valid email address.',
      invalid_message: 'Please write between 10 and 5000 characters.',
      generation_in_progress: 'This video is still rendering.',
      google_not_configured: 'Google sign-in is not configured.',
      oauth_state: 'Sign-in expired. Please try again.',
      oauth_failed: 'Google sign-in failed. Please try again.',
      network_error: 'Network error. Check your connection and try again.',
      content_rejected: 'This photo can’t be used. Choose a different photo that follows our content rules.',
      moderation_unavailable: 'We couldn’t check this photo right now. Please try again in a minute.',
      moderation_not_configured: 'Uploads are temporarily unavailable.',
      captcha_required: 'Please complete the verification.',
      captcha_failed: 'Verification failed. Please try again.',
      captcha_unavailable: 'The verification service is unavailable. Please try again.',
      captcha_not_configured: `Verification is not available. Please email ${s.supportEmail} instead.`,
      media_expired: 'This video has expired and was deleted.',
      subscription_exists: 'You already have an active subscription. Manage it under My account → Billing.',
      subscription_active: 'Cancel your subscription renewal under Billing before deleting your account.',
      subscription_not_found: 'No active subscription was found.',
      subscription_resume_in_portal: 'Open Manage payment to resume your plan.',
      subscription_portal_unsupported: 'Payment management isn’t available for this subscription. Please contact support.',
      subscription_cancel_unsupported: 'This subscription can’t be canceled here. Please contact support.',
      media_removed: 'This video was removed after a content report.',
      share_rejected: 'This video can’t be shared publicly because it didn’t pass our content check.',
      invalid_report: 'Please fill in every required field, sign and confirm the statement.',
      consent_required: 'Please confirm the consent box before generating.',
      not_found: 'We couldn’t find that. It may belong to a different account.',
      handoff_expired: 'This code has expired. Get a new one on your computer.',
      handoff_used: 'A photo was already sent with this code.',
      internal_error: 'Unexpected error. Please try again.',
      account_disabled: `This account has been disabled. Email ${s.supportEmail} if you think this is a mistake.`,
      account_conflict: `This email is linked to a different Google account. Sign in with that account, or email ${s.supportEmail} for help.`,
    } as Record<string, string>,
    legal: {
      updated: '2026-10-21',
      privacy: {
        title: 'Privacy Policy',
        sections: [
          { h: 'What we collect', p: [`When you sign in we receive your name, email address and profile picture from Google. When you create a video we store the photo you upload and the video we generate. Payment details are handled by our payment partner; ${b} never sees your card number.`] },
          { h: 'How we use it', p: ['Your photo is used only to render the video you request. We use your email to operate your account, send receipts and service notices (such as when your video is ready or a report you filed is resolved) and answer support requests. We do not send marketing email. We do not sell personal data and do not use your photos to train models.'] },
          { h: 'Storage and retention', p: [`Files are stored with our infrastructure provider in encrypted form. Uploaded photos are ${photoRetention} and generated videos are ${videoRetention}, unless you delete them or your account sooner. Order and payment records are kept as required for tax and accounting. When you delete your account we keep only a one-way hash of your email address, so the same email cannot claim the sign-up bonus twice.`, 'A photo you pick before signing in or buying credits is kept only in your browser and deleted once a render starts or after 24 hours. A photo sent from your phone by QR code passes through our server: it is deleted as soon as it reaches your computer and kept for 1 hour at most.'] },
          { h: 'Safety checks', p: ['Before a photo is used it may be checked by an automated content-safety classifier. The check runs only to enforce our rules, and its result is not used for anything else. Public forms are protected by a bot-detection service that may process your IP address and browser signals. Finished videos may be checked in the same way: a few still frames are taken from the video and sent to the classifier before the video is delivered, and a video that fails the check is not delivered and its credits are refunded.'] },
          {
            h: 'Cookies and analytics',
            p: [
              'The site uses a few cookies and similar browser storage that it needs to work, such as your sign-in session and your light or dark theme preference.',
              'We also set a first-party cookie (vt_attr, kept for 90 days) that records how you first and most recently reached us, such as a referring website or campaign link. We use it only to see which channels lead to sign-ups and purchases, and we do not share it with advertising networks.' +
                (ga4Id || clarityId ? ' It is only set while analytics cookies are on, and turning them off deletes it.' : ''),
              ga4Id || clarityId
                ? 'If you visit from the European Economic Area, the United Kingdom or Switzerland, or we cannot tell where you are visiting from, analytics cookies stay off until you accept them in the banner. Elsewhere they are on by default. Wherever you are, you can turn them on or off at any time under “Cookie settings” in the footer; turning them off deletes them.'
                : '',
              s.referralRewardCredits > 0
                ? 'If you open a friend’s invite link, we set a cookie (vt_ref, kept for up to 30 days and removed once you sign up) so the invite can be credited. To prevent abuse of invite rewards, we store a salted hash of your IP address with the invite, not the address itself. Neither of you can see the other’s account details.'
                : '',
              ga4Id || cfBeaconToken || umamiWebsiteId || clarityId ? '' : 'We do not use third-party analytics or advertising cookies.',
              cfBeaconToken ? 'We count page views with Cloudflare Web Analytics, which does not use cookies or track you across websites.' : '',
              umamiWebsiteId
                ? 'We count visits with Umami, a cookie-free analytics tool loaded from our own domain. It does not set cookies or store your IP address; your IP address is only used to determine your country and to count unique visits.'
                : '',
              clarityId
                ? 'We use Microsoft Clarity to understand how visitors use the site through heatmaps and session recordings of clicks, scrolling and page changes. Text you type into forms is masked and not recorded. While analytics cookies are off, Clarity sets no cookies and cannot link one page view to the next; while they are on, it sets cookies (such as _clck and _clsk) to connect your visits. Microsoft processes this data, including your IP address and device information, on our behalf. Turning analytics cookies off under “Cookie settings” in the footer deletes these cookies.'
                : '',
              ga4Id
                ? 'While analytics cookies are on, we also use Google Analytics. It sets cookies (such as _ga) and lets Google process your IP address and device information to produce usage reports for us. Google Analytics is not loaded while they are off, and turning them off under “Cookie settings” in the footer also deletes these cookies.'
                : '',
            ].filter(Boolean),
          },
          ...(s.share.enabled
            ? [
                {
                  h: 'Shared videos',
                  p: [
                    'If you share a video, anyone with the link can watch it. The share page does not show your name or email and asks search engines not to index it. To make link previews, your browser takes a still frame from the video and we store it with the video. Stopping sharing or deleting the video disables the link and deletes that image; the link also stops working when the video expires or is removed after a report.',
                  ],
                },
              ]
            : []),
          { h: 'Service providers', p: [`We rely on a small number of processors: cloud hosting, storage and email delivery, an AI rendering provider that processes your photo only for your request, a content-safety classifier, a payment provider acting as merchant of record${ga4Id || cfBeaconToken || umamiWebsiteId || clarityId ? ', and the analytics services described above' : ''}.`] },
          { h: 'Children', p: [`${b} is not directed to children under 13 and requires users to be 18 or older. We do not knowingly collect personal data from children under 13. If we learn that we have, we delete it. Email ${s.supportEmail} if you believe a child has given us personal data.`] },
          { h: 'Your rights', p: [`You can download or delete your videos at any time. In Settings you can export a copy of your data as JSON or delete your account. For any other privacy request, email ${s.supportEmail}.`] },
        ],
      },
      terms: {
        title: 'Terms of Service',
        sections: [
          { h: 'Using the service', p: [`${b} lets you create short AI videos from a photo. You must be at least 18 years old, or the age of majority where you live, to use it.`] },
          { h: 'Your content and consent', p: ['Only upload photos of yourself or of adults who have given you permission. Do not upload photos of minors, celebrities or public figures, and do not use the service to harass, impersonate or deceive anyone. We may remove content and close accounts that break these rules.'] },
          { h: 'Generated videos', p: [`You may use the videos you create for personal and social media purposes. AI output can contain mistakes; review a video before sharing it. Videos are labelled as AI-generated: keep that label, say the video is AI-generated when you share it and never present it as real footage of an event.${s.aiMetadata.enabled ? ' Each video file also contains machine-readable AI metadata (an XMP label with the generator, model, creation time and a video ID, but no personal information); you can check a file on our Verify page.' : ''}`] },
          { h: 'Reports and removal', p: [`Anyone can report content through our report page. We review reports and remove content that breaks these terms or someone’s rights within ${s.takedownSlaHours} hours. Removed photos are blocked from being uploaded again, and accounts involved in serious or repeated violations may be closed without a refund of used credits.`] },
          {
            h: 'Credits and payments',
            p: [
              'Credit packs are one-time purchases. Credits have no cash value, and credits from packs do not expire while the service is operating. Payments are processed by our merchant-of-record partner, whose terms also apply.',
              subs
                ? 'Subscriptions renew automatically at the end of each billing period (monthly or yearly) at the price you subscribed at, until you cancel. You can cancel at any time under Billing in your account; cancellation takes effect at the end of the current period and you keep your plan until then. Subscription credits are added once a month (yearly plans receive them month by month), expire at the end of that month and do not roll over.'
                : '',
            ].filter(Boolean),
          },
          { h: 'Availability and liability', p: ['We work to keep the service available but provide it as is. To the extent permitted by law, our liability is limited to the amount you paid in the 12 months before a claim.'] },
          { h: 'Changes', p: ['We may update these terms. Continued use after an update means you accept the new terms.'] },
        ],
      },
      refund: {
        title: 'Refund Policy',
        sections: [
          { h: 'Failed renders', p: ['If a video fails to render, the credits are returned to your balance automatically. No action is needed.'] },
          { h: 'Unused credits', p: [`You can request a refund of a credit pack within 14 days of purchase if none of its credits have been used. Email ${s.supportEmail} with your order ID.`] },
          ...(subs
            ? [
                {
                  h: 'Subscriptions',
                  p: [
                    `You can request a refund of a subscription payment within 14 days of the charge if none of its credits have been used. Email ${s.supportEmail} with the order ID from Billing. Refunded credits are removed from your balance.`,
                    'Canceling stops future renewals. The current period is not refunded automatically, and you keep your plan until it ends.',
                  ],
                },
              ]
            : []),
          { h: 'Quality issues', p: ['If a finished video is clearly broken (for example corrupted or missing the face), contact us with the video ID and we will restore the credits after review.'] },
          { h: 'How refunds are paid', p: ['Approved refunds go back to the original payment method through our payment partner and may take 5–10 business days to appear.'] },
        ],
      },
    },
    articles: {
      trend: {
        title: 'AI Christmas Video Generator',
        description: 'What an AI Christmas video is, why costume clips fill the feed every December, and how to make your own from a single photo.',
        intro:
          'Every December the feed fills with people who suddenly own a Santa suit, a pointy elf hat or the loudest knitted sweater in the family. Most of those clips were never filmed in a costume at all: they were generated from one photo. Here is what an AI Christmas video actually is and how the trick works.',
        sections: [
          {
            h: 'Why AI Christmas videos took over the feed',
            p: [
              'A costume clip is the perfect short video: one person, one costume, a familiar holiday scene and a punchline the viewer gets in under three seconds. It is also expensive to shoot. A Santa suit costs more than most people spend on the whole holiday, and a good elf costume needs a shoot, a background and someone to hold the phone.',
              'An AI Christmas video removes the production. You keep the photo you already have, and the model puts you inside a clip that was filmed with the costume, the set and the camera move already in place. That is why the format spreads so fast: the effort is a selfie, and the result still looks like a costume shoot.',
            ],
          },
          {
            h: 'What you actually get',
            p: [
              'The output is a vertical 9:16 MP4, six to eighteen seconds long, with no watermark. Your face and hair come from the photo; the costume, the props and the room come from the reference clip. The result is an AI-generated video, not a photograph, so treat it as a bit of holiday fun rather than proof that you own a Santa suit.',
              'Because the model is rebuilding a person it has only seen once, small details move: glasses can soften, long hair can change shape and a hat can sit differently. A sharp, front-facing photo with even light gives the cleanest result, and a quick look at the finished clip before you post it avoids surprises.',
            ],
          },
          {
            h: 'Santa, elf or ugly sweater',
            p: [
              `The three costumes people ask for most are the ones ${b} ships with: a red Santa suit with the beard, a green elf costume with the pointy hat, and an ugly Christmas sweater that looks like it came from a office party. Each one is a different clip with its own camera move, so the same photo gives a different video depending on the costume you pick.`,
              'For a group chat, the six-second version is usually enough. For a post or a Story, the twelve or eighteen-second cut gives the scene room to breathe.',
            ],
          },
          {
            h: 'Make one from a single photo',
            p: [
              `With ${b}, upload one photo, choose a costume and a length, confirm that the photo is yours or that you have permission, and start the render. Most clips finish in a few minutes and land in My videos, ready to download and post.`,
            ],
          },
        ],
        faq: [
          { q: 'Is an AI Christmas video the same as a costume photo edit?', a: 'No. A photo edit changes a still image; an AI Christmas video renders a moving clip where the costume, the set and the camera move come from a filmed reference.' },
          { q: 'Do I need to own the costume?', a: 'No. The costume comes from the reference clip. You only need a clear photo of your face.' },
        ],
      },
      howTo: {
        title: 'How to Make an AI Christmas Video',
        description: 'A step-by-step guide to making a Christmas costume video from one photo: which picture to pick, which costume to choose and how to post it.',
        intro: 'You can make a Christmas costume video in about five minutes. Here is the full process, plus the details that make the difference between a clip that looks like you and one that looks like a filter.',
        sections: [
          {
            h: '1. Pick the right photo',
            p: [
              'Choose a recent, sharp photo of one person looking at the camera. Daylight or a bright room works best. Avoid sunglasses, hats that cover the face and heavy beauty filters; the model has to find your face and keep it consistent for every frame.',
              'A head-and-shoulders portrait is ideal. A full-body shot works too, but the face gets fewer pixels, so the result is softer.',
            ],
          },
          {
            h: '2. Choose a costume and a length',
            p: [
              'Pick the Santa suit for the classic look, the elf costume for something sillier, or the ugly sweater if you want the joke to be the outfit itself. Then choose a length: shorter clips render faster and cost fewer credits, while the full cut gives the scene time to play out.',
            ],
            table: { head: ['Length', 'Credits'], rows: s.durations.map((d) => [`${d.seconds} seconds`, String(d.credits)]) },
          },
          {
            h: '3. Confirm consent and generate',
            p: [
              'Tick the consent box to confirm the photo is yours or that you have permission, then start the render. You can leave the page while it works; the video waits in My videos when it is done.',
            ],
          },
          {
            h: '4. Download and share',
            p: [
              'When the clip is ready, download the MP4 and post it. Keep the AI label and mention that the video is AI-generated: it is part of the deal, and it keeps the joke honest.',
            ],
          },
        ],
        faq: [
          { q: 'How long does an AI Christmas video take to make?', a: 'Most videos finish in 2–8 minutes depending on length and queue. You can close the page while it renders.' },
          { q: 'How many credits does a video cost?', a: `Each second of video costs one credit, so ${s.durations.map((d) => `${d.seconds} seconds is ${d.credits} credits`).join(', ')}. Credits are refunded automatically if a render fails.` },
          { q: 'Which photo gives the best result?', a: 'A recent, sharp photo of one person facing the camera in even light. Avoid sunglasses, hats that cover the face and beauty filters.' },
        ],
      },
      outfits: {
        title: 'Christmas Outfit Ideas',
        description: 'Santa suits, elf costumes and ugly Christmas sweaters: the three AI costume ideas people use most, and how to choose the one that fits your clip.',
        intro:
          'A Christmas outfit is a costume, a joke and a personality test in one. If you are putting yourself in a holiday video, the outfit decides the tone. These are the three costumes the clips are built around, what each one is good for and how to pick between them.',
        sections: [
          {
            h: 'The Santa suit',
            p: [
              'The default for a reason. A red suit, white trim and a beard read as Christmas from across the room, and the joke works for every age. It suits family cards, work-chat surprises and anyone who wants the classic look without buying a suit they will wear once.',
            ],
          },
          {
            h: 'The elf costume',
            p: [
              'Greener, sillier and a little chaotic. The elf costume is the one people use for party invitations, group-chat jokes and clips where the punchline is the pointy hat. It plays well with dancing, waving and anything that does not take itself seriously.',
            ],
          },
          {
            h: 'The ugly Christmas sweater',
            p: [
              'The lowest-effort costume and often the funniest. A loud knitted sweater says “I am at the office party and I know it”. It works for dry humour, for people who would never wear a full costume, and for clips where the face does the acting.',
            ],
          },
          {
            h: 'How to choose',
            p: [
              'Pick the Santa suit when you want the clip to be immediately readable. Pick the elf when the clip should be playful. Pick the sweater when the joke should be understated or when you want a costume that does not dominate the frame.',
              'Whichever you choose, the photo stays the same: one person, facing the camera, even light. The costume comes from the clip, the face comes from you.',
            ],
            table: {
              head: ['Costume', 'Vibe', 'Best for'],
              rows: [
                ['Santa suit', 'Classic, warm, instantly readable', 'Family cards, work chats'],
                ['Elf costume', 'Playful and silly', 'Party invites, group jokes'],
                ['Ugly sweater', 'Deadpan, low-effort', 'Dry humour, office parties'],
              ],
            },
          },
        ],
        faq: [
          { q: 'Can I combine costumes in one video?', a: 'One costume per clip. Make a second video with another costume if you want to compare them.' },
          { q: 'Do the costumes work on any photo?', a: 'Any clear photo of one adult facing the camera works. The clip keeps the costume and the set; your photo supplies the face, so the better the photo, the better the match.' },
        ],
      },
      elfAlt: {
        title: 'Elf Yourself Alternative',
        description: 'Looking for an Elf Yourself alternative? Compare the classic elf videos with a photo-to-video tool and make an elf costume clip from one photo.',
        intro:
          'Elf Yourself-style videos have been a holiday staple since the mid-2000s: upload a face, watch it land on a dancing elf, send it to the group chat. The idea is still fun, but the tools around it have changed. If you are looking for an alternative this December, here is what to compare.',
        sections: [
          {
            h: 'What people actually want from an elf video',
            p: [
              'Three things: their own face, a recognisable elf costume and a clip short enough to send. The original format delivered all three with a cartoon body and a fixed dance. Newer AI tools keep the idea but replace the cartoon with a filmed costume clip, so the result looks like a video shoot rather than a sticker.',
            ],
          },
          {
            h: 'Where the older tools fall short',
            p: [
              'Most Elf Yourself-style tools are built around one template: the same dance, the same body, the same green outfit. That is fine for a joke, but it stops being funny when everyone in the chat sends the identical clip. Some also ask for a photo of a child or an elaborate sign-up before you see anything.',
              `A photo-to-video tool like ${b} takes a different route: you pick the costume, the clip keeps its own camera move, and the output is a normal vertical MP4 you can post anywhere. The trade-off is that it is a real render, so it takes minutes rather than seconds.`,
            ],
          },
          {
            h: 'How to make an elf clip from a photo',
            p: [
              'Upload a clear photo of one adult facing the camera, choose the elf costume, pick a length and confirm consent. The render puts your face and hair into the costume scene and returns a vertical MP4. Nothing else is needed: no costume, no shoot, no editing app.',
              'Keep the AI label on the clip and say it is AI-generated when you share it. It is a holiday joke, not a record of a real event.',
            ],
          },
          {
            h: 'What to check before you pick a tool',
            p: [
              'Look for a tool that states what happens to your photo, how long it is kept and whether the output is downloadable. Check that the costume clips are licensed and that the site asks you to confirm you have permission to use the face in the photo. Those three points matter more than the number of templates.',
            ],
          },
        ],
        faq: [
          { q: 'Is this the same as Elf Yourself?', a: 'No. Elf Yourself is a separate brand. CostumeMix is an independent AI video tool with its own costume clips, and it is not affiliated with Elf Yourself.' },
          { q: 'Can I make an elf video without a costume?', a: 'Yes. The elf costume comes from the reference clip, so you only need a photo of your face.' },
        ],
      },
    } satisfies Record<ArticleKey, ArticleContent>,
  }
}

export type Content = ReturnType<typeof en>






