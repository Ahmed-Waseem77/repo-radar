import Link from '@mui/material/Link'
import type { LinkProps } from '@mui/material/Link'

export interface TextLinkProps extends LinkProps {
    href: string
}

// Looks like plain text at rest, picks up the theme's secondary color and an underline on
// hover - used for the repo title/owner/commit-hash/commit-author links in RepoOverview and
// RepoOverviewCompact. Always external (GitHub), so target/rel are fixed rather than exposed.
export function TextLink({ color = 'inherit', underline = 'hover', sx, ...props }: TextLinkProps) {
    return (
        <Link
            target="_blank"
            rel="noopener noreferrer"
            color={color}
            underline={underline}
            {...props}
            sx={[
                (theme) => ({
                    '&:hover': {
                        color: theme.vars?.palette.secondary.main ?? theme.palette.secondary.main,
                    },
                }),
                ...(Array.isArray(sx) ? sx : [sx]),
            ]}
        />
    )
}
