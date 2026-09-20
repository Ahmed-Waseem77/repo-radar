import { Stack, Typography } from '@mui/material'
import type { TypographyProps } from '@mui/material'
import ErrorTwoToneIcon from '@mui/icons-material/ErrorTwoTone'

export interface NotFoundNoticeProps {
    // whatever failed to load, e.g. "commit" -> "commit not found"
    resource: string
    variant?: TypographyProps['variant']
}

// shared between RepoOverview and RepoOverviewCompact: when one piece of a repo's data failed
// to load (rather than the whole search/request), this replaces just that section instead of
// losing the rest of the card.
export function NotFoundNotice({ resource, variant = 'caption' }: NotFoundNoticeProps) {
    return (
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <ErrorTwoToneIcon color="error" fontSize="inherit" />
            <Typography variant={variant} color="error">
                {resource} not found
            </Typography>
        </Stack>
    )
}
