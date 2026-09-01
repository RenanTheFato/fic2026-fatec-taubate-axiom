import type { ButtonHTMLAttributes, ReactNode } from "react"
import { Link } from "react-router-dom"
import { cn } from "../../utils/cn"

// "light" é o tom para fundo escuro (faixa ink, seção primária). Existe como
// tom, e não como classe solta em quem usa: sobrescrever cor por className
// depende da ordem do CSS gerado, não da ordem do atributo — e falha calado.
export type ButtonTone = "primary" | "success" | "partner" | "ink" | "light"
export type ButtonVariant = "solid" | "outline"
export type ButtonSize = "sm" | "md" | "lg"

type Shared = {
  tone?: ButtonTone
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  className?: string
  children: ReactNode
}

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-pill font-display font-bold " +
  "transition-[transform,background-color,color] duration-200 " +
  "hover:-translate-y-0.5 active:translate-y-0 disabled:pointer-events-none disabled:opacity-50"

// Área de toque mínima confortável (44px) já a partir do tamanho médio: é
// acessibilidade motora, e é o dedo de quem doa pelo celular.
const SIZES: Record<ButtonSize, string> = {
  sm: "min-h-9 px-4 text-sm",
  md: "min-h-11 px-6 text-base",
  lg: "min-h-13 px-8 text-lg",
}

const SOLID: Record<ButtonTone, string> = {
  primary: "bg-primary text-white hover:bg-primary-dark",
  // Branco sobre o verde claro dá 2,33:1 e reprova em AA, então o botão cheio
  // usa o verde escuro. O claro fica para preenchimento com texto ink.
  success: "bg-success-dark text-white hover:brightness-110",
  partner: "bg-partner text-white hover:bg-partner-dark",
  ink: "bg-ink text-white hover:brightness-125",
  light: "bg-white text-primary hover:brightness-95",
}

const OUTLINE: Record<ButtonTone, string> = {
  primary: "border-2 border-primary text-primary hover:bg-primary-soft",
  success: "border-2 border-success-dark text-success-dark hover:bg-success-soft",
  partner: "border-2 border-partner text-partner-dark hover:bg-partner/10",
  ink: "border-2 border-ink text-ink hover:bg-surface-muted",
  light: "border-2 border-white text-white hover:bg-white/15",
}

type ButtonStyle = Omit<Shared, "children">

function buttonClasses({ tone = "primary", variant = "solid", size = "md", fullWidth, className }: ButtonStyle) {
  return cn(
    BASE,
    SIZES[size],
    variant === "solid" ? SOLID[tone] : OUTLINE[tone],
    fullWidth && "w-full",
    className,
  )
}

type ButtonProps = Shared & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">

export function Button({ tone, variant, size, fullWidth, className, children, ...rest }: ButtonProps) {
  return (
    <button {...rest} className={buttonClasses({ tone, variant, size, fullWidth, className })}>
      {children}
    </button>
  )
}

type ButtonLinkProps = Shared & {
  to: string
  external?: boolean
  ariaLabel?: string
}

export function ButtonLink({ to, external, ariaLabel, tone, variant, size, fullWidth, className, children }: ButtonLinkProps) {
  const classes = buttonClasses({ tone, variant, size, fullWidth, className })

  if (external) {
    return (
      <a href={to} className={classes} aria-label={ariaLabel} target="_blank" rel="noreferrer">
        {children}
      </a>
    )
  }

  return (
    <Link to={to} className={classes} aria-label={ariaLabel}>
      {children}
    </Link>
  )
}
