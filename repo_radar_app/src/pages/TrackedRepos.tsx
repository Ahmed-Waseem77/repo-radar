import { Box, Typography } from '@mui/material'

export interface TrackedReposProps {
  trackedRepoKeys: Set<string>
}

// stub - real tracked-repos view (fetching each repo's overview by owner/repo key) isn't
// built yet, this just proves the route out
export function TrackedRepos({ trackedRepoKeys }: TrackedReposProps) {
  return (
    <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
      <Typography variant="h6">Tracked Repos</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {trackedRepoKeys.size === 0
          ? 'Track a repo to see it here.'
          : `${trackedRepoKeys.size} repo${trackedRepoKeys.size === 1 ? '' : 's'} tracked.`}
      </Typography>
    </Box>
  )
}
