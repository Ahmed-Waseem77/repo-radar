import { useMediaQuery, useTheme } from '@mui/material'

// single source of truth for "narrow screen" layout decisions across the app - the AppBar
// (search moves to its own bottom bar, nav buttons collapse to icons) and RepoDetailView (side
// panel becomes an overlay, RepoOverview swaps for RepoOverviewCompact). `md` (900px default) is
// where the top AppBar's logo+title, two nav buttons, search field and color toggle stop having
// enough room to sit comfortably in one row.
export function useNarrowScreen(): boolean {
    const theme = useTheme()
    return useMediaQuery(theme.breakpoints.down('md'))
}
