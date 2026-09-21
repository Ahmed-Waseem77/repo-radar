import { IconButton, Tooltip } from '@mui/material'
import RefreshTwoToneIcon from '@mui/icons-material/RefreshTwoTone'

export interface RefreshButtonProps {
    onRefresh: () => void
    refreshing: boolean
}

// shared by RepoDetailView's own wide-layout button row and, on a narrow screen, App.tsx's top
// AppBar (see its `repoRefreshControls` state) - a Tooltip-wrapped, spinning-while-refreshing
// IconButton. Wrapped in a <span> so the Tooltip still shows while disabled.
export function RefreshButton({ onRefresh, refreshing }: RefreshButtonProps) {
    return (
        <Tooltip title={refreshing ? 'Refreshing...' : 'Refresh repo details'}>
            <span>
                <IconButton size="small" onClick={onRefresh} disabled={refreshing} aria-label="Refresh repo details">
                    <RefreshTwoToneIcon
                        fontSize="small"
                        sx={{
                            animation: refreshing ? 'spin 1s linear infinite' : 'none',
                            '@keyframes spin': {
                                from: { transform: 'rotate(0deg)' },
                                to: { transform: 'rotate(360deg)' },
                            },
                        }}
                    />
                </IconButton>
            </span>
        </Tooltip>
    )
}
