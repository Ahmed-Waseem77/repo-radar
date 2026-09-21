import { Box, alpha, darken, getLuminance, lighten } from '@mui/material'
import type { BoxProps, Theme } from '@mui/material'
import type { ReactElement } from 'react'
import WarningTwoToneIcon from '@mui/icons-material/WarningTwoTone'
import ErrorTwoToneIcon from '@mui/icons-material/ErrorTwoTone'
import InfoTwoToneIcon from '@mui/icons-material/InfoTwoTone'

export type PillColorVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
export type PillVariant = 'default' | PillColorVariant
export type PillSize = 'small' | 'medium' | 'large'
// 'pill' fully rounds the ends (the default). 'rounded' uses the theme's own corner
// radius instead, for a squarer, chip-like look.
export type PillShape = 'pill' | 'rounded'

export interface PillProps extends Omit<BoxProps, 'color'> {
    label: string
    variant?: PillVariant
    // overrides the variant's theme color with an arbitrary one
    color?: string
    size?: PillSize
    // sizes the start/end icons independently of the label text - defaults to `size`
    iconSize?: PillSize
    shape?: PillShape
    startIcon?: ReactElement
    endIcon?: ReactElement
}

// only the alert-like variants have an obvious canonical icon - primary/secondary/success
// fall back to no icon unless the caller passes their own startIcon/endIcon
const defaultIcons: Partial<Record<PillColorVariant, ReactElement>> = {
    warning: <WarningTwoToneIcon fontSize="inherit" />,
    error: <ErrorTwoToneIcon fontSize="inherit" />,
    info: <InfoTwoToneIcon fontSize="inherit" />,
}

const sizeStyles = (theme: Theme, size: PillSize) => {
    switch (size) {
        case 'small':
            return { padding: theme.spacing(0.25, 1), fontSize: theme.typography.pxToRem(11) }
        case 'large':
            return { padding: theme.spacing(0.75, 2), fontSize: theme.typography.pxToRem(15) }
        case 'medium':
        default:
            return { padding: theme.spacing(0.5, 1.5), fontSize: theme.typography.pxToRem(13) }
    }
}

// absolute sizes (not em-relative to the label) so the icon can be tuned independently of the text
const iconSizePx: Record<PillSize, number> = {
    small: 13,
    medium: 15,
    large: 18,
}

const isColorVariant = (variant: PillVariant): variant is PillColorVariant => variant !== 'default'

// an arbitrary caller-supplied `color` (e.g. a GitHub label's own hex) has no guarantee of
// contrasting against this app's background the way the hand-picked semantic palette colors
// already do - a pale label color used as literal text in light mode (or a near-black one in
// dark mode) can end up nearly unreadable against this app's own background. Only nudging colors
// that actually cross a readability threshold keeps everything already fine (every semantic
// variant, most saturated label colors) untouched.
function readableHue(hue: string, scheme: 'light' | 'dark'): string {
    const luminance = getLuminance(hue)
    if (scheme === 'light') return luminance > 0.5 ? darken(hue, 0.45) : hue
    return luminance < 0.2 ? lighten(hue, 0.45) : hue
}

export const Pill = ({
    label,
    variant = 'default',
    color,
    size = 'medium',
    iconSize,
    shape = 'pill',
    startIcon,
    endIcon,
    sx,
    ...props
}: PillProps) => {
    const resolvedStartIcon = startIcon ?? (isColorVariant(variant) ? defaultIcons[variant] : undefined)
    const resolvedIconSize = iconSize ?? size

    return (
        <Box
            component="span"
            {...props}
            sx={[
                (theme) => {
                    // strictly tonal - a translucent tint of the hue plus a border/text in that
                    // same hue, never a solid fill - so a Pill never reads as a clickable Button
                    // at a glance.
                    const hue = readableHue(color ?? (isColorVariant(variant) ? theme.palette[variant].main : theme.palette.pillDefault.text), 'light')

                    // `hue` above is baked to whichever scheme `theme.palette` was resolved from
                    // (this theme's default/light scheme) - that's a non-issue for semantic hues
                    // since primary/secondary/etc. are identical in both schemes here, but
                    // pillDefault.text genuinely differs per scheme, so its dark-mode value needs
                    // pulling explicitly, the same way RepoOverview's inverted "Latest Commit"
                    // color does. `alpha()` also needs an actual parseable color, not a
                    // `theme.vars` CSS-variable reference string.
                    const darkHue = readableHue(
                        color ?? (isColorVariant(variant) ? theme.palette[variant].main : (theme.colorSchemes?.dark?.palette?.pillDefault?.text ?? '#EAEDEA')),
                        'dark',
                    )

                    return {
                        display: 'inline-flex',
                        alignItems: 'center',
                        width: 'fit-content',
                        gap: theme.spacing(0.5),
                        // sx's `borderRadius` treats a bare number as a *multiplier* of
                        // theme.shape.borderRadius (like spacing), not a literal px value - so 'pill'
                        // multiplies it way up to fully round, and 'rounded' needs an explicit unit to
                        // use the theme's radius as-is instead of (theme radius) * (theme radius).
                        borderRadius: shape === 'pill' ? Number(theme.shape.borderRadius) * 100 : `${theme.shape.borderRadius}px`,
                        fontFamily: theme.typography.fontFamily,
                        fontWeight: theme.typography.fontWeightMedium,
                        lineHeight: 1.4,
                        whiteSpace: 'nowrap',
                        boxSizing: 'border-box',
                        ...sizeStyles(theme, size),
                        backgroundColor: alpha(hue, 0.16),
                        border: `1px solid ${alpha(hue, 0.5)}`,
                        color: hue,
                        ...theme.applyStyles('dark', {
                            backgroundColor: alpha(darkHue, 0.16),
                            border: `1px solid ${alpha(darkHue, 0.5)}`,
                            color: darkHue,
                        }),
                        '& .Pill-icon': {
                            display: 'inline-flex',
                            fontSize: theme.typography.pxToRem(iconSizePx[resolvedIconSize]),
                        },
                    }
                },
                ...(Array.isArray(sx) ? sx : [sx]),
            ]}
        >
            {resolvedStartIcon && (
                <Box component="span" className="Pill-icon">
                    {resolvedStartIcon}
                </Box>
            )}
            <Box component="span">{label}</Box>
            {endIcon && (
                <Box component="span" className="Pill-icon">
                    {endIcon}
                </Box>
            )}
        </Box>
    )
}
