import { Box, Typography } from '@mui/material'
import type { SxProps, Theme, TypographyProps } from '@mui/material'
import { NoSearchIcon } from '../Icons/NoSearchIcon'

export interface EmptyStateProps {
    message: string
    // defaults to the original full-page size; a caller with less room (e.g. a narrow side
    // panel) passes something smaller rather than letting the icon overflow its column.
    iconWidth?: number
    variant?: TypographyProps['variant']
    sx?: SxProps<Theme>
}

const DEFAULT_ICON_WIDTH = 200

// the "nothing to show here" notice repeated across the app (a tab with no data, a filtered
// list with no matches, a side panel with nothing tracked) - NoSearchIcon plus a dimmed message,
// centered in whatever box the caller sizes via `sx` (flex/width/padding are all left to the
// caller, since that varies by context - a full tab pane vs. a fixed-width side panel column).
export function EmptyState({ message, iconWidth = DEFAULT_ICON_WIDTH, variant = 'body1', sx }: EmptyStateProps) {
    return (
        <Box
            sx={[
                { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, textAlign: 'center' },
                ...(Array.isArray(sx) ? sx : [sx]),
            ]}
        >
            <NoSearchIcon sx={{ width: iconWidth, height: 'auto' }} />
            <Typography variant={variant} color="textDimmedInverted">
                {message}
            </Typography>
        </Box>
    )
}

export default EmptyState
