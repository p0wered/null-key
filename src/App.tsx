import { Check, Copy, Eye, EyeOff } from 'lucide-react'
import { useCallback, useState } from 'react'
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useAnimationControls,
  useReducedMotion,
  type Transition,
  type Variants,
} from 'framer-motion'
import { derivePassword } from './lib/derivePassword'

const ICON_SIZE = 24
const ICON_STROKE = 2

const MIN_LEN = 8
const MAX_LEN = 48
const DEFAULT_LEN = 16

const fieldShellClassName =
  'flex h-[62px] shrink-0 items-center rounded-[16px] border border-transparent bg-surface px-3 transition-[border-color] focus-within:border-accent lg:px-4'

const fieldInputClassName =
  'min-w-0 flex-1 bg-transparent text-[1.0625rem] leading-snug text-text outline-none placeholder:text-muted placeholder:opacity-70 lg:text-lg'

const btnPrimaryClassName =
  'w-full rounded-[16px] border-0 bg-accent py-3.5 px-4 text-[1rem] font-semibold text-white outline-none transition-colors hover:bg-accent-hover focus-visible:ring-[3px] focus-visible:ring-accent/45 disabled:cursor-not-allowed disabled:opacity-45 max-lg:min-h-12 lg:mt-6 lg:rounded-xl lg:py-[0.85rem] lg:px-5 lg:text-[1.0625rem]'

const btnIconClassName =
  'box-border flex shrink-0 items-center justify-center self-stretch rounded-[16px] outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-accent/45'

const btnIconGhostClassName = `${btnIconClassName} w-12 min-w-12 max-w-12 border border-transparent bg-surface text-muted hover:bg-[#333] hover:text-text lg:w-14 lg:min-w-14 lg:max-w-14`

const btnIconSecondaryClassName = `${btnIconClassName} w-12 min-w-12 max-w-12 border-0 bg-surface text-text hover:bg-[#3a3a3a] disabled:cursor-not-allowed disabled:opacity-45 lg:w-14 lg:min-w-14 lg:max-w-14`

const labelClassName =
  'px-1.5 text-[0.9375rem] font-medium text-muted lg:text-sm'

const inputErrorClassName =
  'border-danger focus-within:border-accent'

const fieldErrorTextClassName =
  'px-1.5 text-[0.875rem] text-danger lg:text-[0.9375rem]'

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

const errorTransition: Transition = { duration: 0.2, ease: 'easeOut' }

const iconTransition: Transition = { duration: 0.18, ease: 'easeOut' }

const passwordTransition: Transition = { duration: 0.12, ease: 'easeOut' }

const shakeKeyframes = { x: [0, -6, 6, -4, 4, 0] }
const shakeTransition: Transition = { duration: 0.4, ease: 'easeInOut' }

const tapScale = { scale: 0.97 }

type FieldErrors = { service?: string; secret?: string }

function App() {
  const [service, setService] = useState('')
  const [secret, setSecret] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [length, setLength] = useState(DEFAULT_LEN)
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  const prefersReducedMotion = useReducedMotion()
  const serviceShake = useAnimationControls()
  const secretShake = useAnimationControls()

  const generate = useCallback(async () => {
    setFieldErrors({})
    setError(null)
    setCopied(false)

    const next: FieldErrors = {}
    if (!service) next.service = 'Введите название сервиса.'
    if (!secret) next.secret = 'Введите секретную фразу.'
    if (next.service || next.secret) {
      setFieldErrors(next)
      setPassword('')
      if (!prefersReducedMotion) {
        if (next.service)
          void serviceShake.start({ ...shakeKeyframes, transition: shakeTransition })
        if (next.secret)
          void secretShake.start({ ...shakeKeyframes, transition: shakeTransition })
      }
      return
    }

    setBusy(true)
    try {
      const pwd = await derivePassword(service, secret, length)
      setPassword(pwd)
      setFieldErrors({})
    } catch {
      setError('Не удалось сгенерировать пароль.')
      setPassword('')
    } finally {
      setBusy(false)
    }
  }, [service, secret, length, prefersReducedMotion, serviceShake, secretShake])

  const copy = useCallback(async () => {
    if (!password) return
    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Не удалось скопировать в буфер обмена.')
    }
  }, [password])

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col lg:max-w-[40rem] lg:flex-none">
        <motion.div
          className="flex min-h-0 flex-1 flex-col gap-6 rounded-[20px] pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))] sm:gap-6 sm:px-[1.35rem] sm:py-5 sm:rounded-[24px] lg:flex-none lg:gap-5 lg:rounded-[28px] lg:px-7 lg:py-6 lg:pb-0"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <motion.div className="flex flex-col gap-2" variants={itemVariants}>
            <label className={labelClassName} htmlFor="service">
              Название сервиса
            </label>
            <motion.div
              className={`${fieldShellClassName} ${fieldErrors.service ? inputErrorClassName : ''}`}
              animate={serviceShake}
            >
              <input
                id="service"
                className={fieldInputClassName}
                type="text"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                placeholder="Введите название..."
                value={service}
                aria-invalid={fieldErrors.service ? true : undefined}
                aria-describedby={fieldErrors.service ? 'service-error' : undefined}
                onChange={(e) => {
                  setService(e.target.value)
                  setFieldErrors((f) => ({ ...f, service: undefined }))
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void generate()
                }}
              />
            </motion.div>
            <AnimatePresence initial={false}>
              {fieldErrors.service ? (
                <motion.p
                  id="service-error"
                  className={fieldErrorTextClassName}
                  role="alert"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={errorTransition}
                >
                  {fieldErrors.service}
                </motion.p>
              ) : null}
            </AnimatePresence>
          </motion.div>

          <motion.div className="flex flex-col gap-2" variants={itemVariants}>
            <label className={labelClassName} htmlFor="secret">
              Секретная фраза
            </label>
            <div className="flex h-[62px] items-stretch gap-2">
              <motion.div
                className={`${fieldShellClassName} min-h-0 min-w-0 flex-1 ${fieldErrors.secret ? inputErrorClassName : ''}`}
                animate={secretShake}
              >
                <input
                  id="secret"
                  className={fieldInputClassName}
                  type={showSecret ? 'text' : 'password'}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="Введите фразу..."
                  value={secret}
                  aria-invalid={fieldErrors.secret ? true : undefined}
                  aria-describedby={fieldErrors.secret ? 'secret-error' : undefined}
                  onChange={(e) => {
                    setSecret(e.target.value)
                    setFieldErrors((f) => ({ ...f, secret: undefined }))
                  }}
                />
              </motion.div>
              <motion.button
                type="button"
                className={btnIconGhostClassName}
                onClick={() => setShowSecret((v) => !v)}
                whileTap={tapScale}
                aria-pressed={showSecret}
                aria-label={
                  showSecret ? 'Скрыть секретную фразу' : 'Показать секретную фразу'
                }
                title={showSecret ? 'Скрыть' : 'Показать'}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={showSecret ? 'off' : 'on'}
                    className="flex items-center justify-center"
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={iconTransition}
                  >
                    {showSecret ? (
                      <EyeOff
                        size={ICON_SIZE}
                        strokeWidth={ICON_STROKE}
                        className="text-white"
                        aria-hidden
                      />
                    ) : (
                      <Eye
                        size={ICON_SIZE}
                        strokeWidth={ICON_STROKE}
                        className="text-white"
                        aria-hidden
                      />
                    )}
                  </motion.span>
                </AnimatePresence>
              </motion.button>
            </div>
            <AnimatePresence initial={false}>
              {fieldErrors.secret ? (
                <motion.p
                  id="secret-error"
                  className={fieldErrorTextClassName}
                  role="alert"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={errorTransition}
                >
                  {fieldErrors.secret}
                </motion.p>
              ) : null}
            </AnimatePresence>
          </motion.div>

          <motion.div
            className="flex flex-col gap-2 min-[480px]:justify-between"
            variants={itemVariants}
          >
            <label className={`${labelClassName} shrink-0`} htmlFor="length">
              Длина пароля
            </label>
            <div className="flex h-[62px] w-full min-h-[62px] shrink-0 items-center gap-3 rounded-[20px] bg-surface px-4 box-border">
              <input
                id="length"
                className="h-2 min-w-0 flex-1 cursor-pointer accent-accent rounded-full max-lg:h-2.5 lg:h-2"
                type="range"
                min={MIN_LEN}
                max={MAX_LEN}
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
              />
              <span
                className="min-w-[2ch] text-right text-[1rem] tabular-nums text-accent lg:min-w-[2.5ch] lg:text-base"
                aria-live="polite"
              >
                {length}
              </span>
            </div>
          </motion.div>

          <motion.div className="flex flex-col gap-2" variants={itemVariants}>
            <span className={labelClassName}>Пароль</span>
            <div className="flex h-[62px] flex-row items-stretch gap-2">
              <output
                className={`flex min-h-0 min-w-0 flex-1 items-center break-all rounded-[16px] border border-transparent bg-surface px-3 font-mono text-[1rem] leading-snug lg:px-4 lg:text-[1.0625rem] ${password ? 'text-text' : 'text-muted'}`}
                htmlFor="secret service length"
                aria-live="polite"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={password || 'empty'}
                    className="block break-all"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={passwordTransition}
                  >
                    {password || '—'}
                  </motion.span>
                </AnimatePresence>
              </output>
              <motion.button
                type="button"
                className={`${btnIconSecondaryClassName} ${copied ? 'text-accent hover:bg-surface-3 hover:text-accent-hover' : ''}`}
                disabled={!password}
                onClick={() => void copy()}
                whileTap={password ? tapScale : undefined}
                aria-label={copied ? 'Скопировано в буфер обмена' : 'Копировать пароль'}
                title={copied ? 'Скопировано' : 'Копировать'}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={copied ? 'check' : 'copy'}
                    className="flex items-center justify-center"
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={iconTransition}
                  >
                    {copied ? (
                      <Check
                        size={ICON_SIZE}
                        strokeWidth={ICON_STROKE}
                        className="text-accent"
                        aria-hidden
                      />
                    ) : (
                      <Copy size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden />
                    )}
                  </motion.span>
                </AnimatePresence>
              </motion.button>
            </div>
          </motion.div>

          <AnimatePresence initial={false}>
            {error ? (
              <motion.p
                className={fieldErrorTextClassName}
                role="alert"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={errorTransition}
              >
                {error}
              </motion.p>
            ) : null}
          </AnimatePresence>
        </motion.div>

        <div className="max-lg:border-border/80 max-lg:bg-bg/95 max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-10 max-lg:px-5 max-lg:pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] max-lg:pt-3 max-lg:backdrop-blur-md lg:relative lg:inset-auto lg:border-0 lg:bg-transparent lg:px-7 lg:pt-6 lg:pb-0 lg:backdrop-blur-none">
          <div className="mx-auto w-full mb-1 max-w-lg lg:max-w-full">
            <motion.button
              type="button"
              className={btnPrimaryClassName}
              disabled={busy}
              onClick={() => void generate()}
              whileTap={busy ? undefined : tapScale}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut', delay: 0.25 }}
            >
              Сгенерировать
            </motion.button>
          </div>
        </div>
      </div>
    </MotionConfig>
  )
}

export default App
