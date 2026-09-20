import { Box, alpha } from '@mui/material'
import type { BoxProps, Theme } from '@mui/material'
import type { ReactElement } from 'react'
import WarningSharpIcon from '@mui/icons-material/WarningSharp'
import ErrorSharpIcon from '@mui/icons-material/ErrorSharp'
import InfoSharpIcon from '@mui/icons-material/InfoSharp'

export type PillColorVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
export type PillVariant = 'default' | PillColorVariant
export type PillSize = 'small' | 'medium' | 'large'
// 'solid' fills the pill with the variant's main color.
// 'tonal' is a dark, translucent fill of the variant's hue with a brighter border of the same hue -
// it's meant for dark surfaces, so it's used automatically in dark themes unless overridden.
export type PillAppearance = 'solid' | 'tonal'
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
    // defaults to 'solid' in light themes and 'tonal' in dark themes
    appearance?: PillAppearance
    startIcon?: ReactElement
    endIcon?: ReactElement
}

// only the alert-like variants have an obvious canonical icon - primary/secondary/success
// fall back to no icon unless the caller passes their own startIcon/endIcon
const defaultIcons: Partial<Record<PillColorVariant, ReactElement>> = {
    warning: <WarningSharpIcon fontSize="inherit" />,
    error: <ErrorSharpIcon fontSize="inherit" />,
    info: <InfoSharpIcon fontSize="inherit" />,
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

export const Pill = ({
    label,
    variant = 'default',
    color,
    size = 'medium',
    iconSize,
    shape = 'pill',
    appearance,
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
                    // whether this pill has a real semantic color to draw a tonal treatment from -
                    // the neutral 'default' variant doesn't, so it draws its base solid
                    // background/text from its own dedicated theme.palette.pillDefault pair
                    // instead of approximating one from `action`/`text` tokens meant for other
                    // purposes (see theme.ts).
                    const hasHue = color !== undefined || isColorVariant(variant)
                    const hue = color ?? (isColorVariant(variant) ? theme.palette[variant].main : theme.palette.pillDefault.text)

                    const tonalStyles = {
                        backgroundColor: alpha(hue, 0.16),
                        color: hue,
                        borderColor: alpha(hue, 0.5),
                    }

                    // `hue` above is baked to whichever scheme `theme.palette` was resolved from
                    // (this theme's default/light scheme) - that's a non-issue for semantic hues
                    // since primary/secondary/etc. are identical in both schemes here, but
                    // pillDefault.text genuinely differs per scheme, so the dark-mode tonal fill
                    // needs the DARK scheme's own value pulled explicitly, the same way
                    // RepoOverview's inverted "Latest Commit" color does. `alpha()` also needs an
                    // actual parseable color, not a `theme.vars` CSS-variable reference string.
                    const defaultDarkHue = theme.colorSchemes?.dark?.palette?.pillDefault?.text ?? '#EAEDEA'
                    const defaultDarkTonalStyles = {
                        backgroundColor: alpha(defaultDarkHue, 0.16),
                        color: defaultDarkHue,
                        borderColor: alpha(defaultDarkHue, 0.5),
                    }

                    return {
                        display: 'inline-flex',
                        alignItems: 'center',
                        width: 'fit-content',
                        gap: theme.spacing(0.5),
                        border: '1px solid transparent',
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
                        backgroundColor: color ?? (isColorVariant(variant) ? theme.palette[variant].main : theme.palette.pillDefault.background),
                        color: color
                            ? theme.palette.getContrastText(color)
                            : isColorVariant(variant)
                              ? theme.palette[variant].contrastText
                              : theme.palette.pillDefault.text,
                        ...(appearance === 'tonal' && tonalStyles),
                        // no explicit appearance given: fall back to tonal automatically in dark
                        // themes, for every variant including 'default' (using its own
                        // dark-scheme-correct hue computed above).
                        ...(appearance === undefined && theme.applyStyles('dark', hasHue ? tonalStyles : defaultDarkTonalStyles)),
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
