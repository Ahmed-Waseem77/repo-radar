import { Box, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Button, Unknown404Icon } from '@radar-repo/radar-repo-lib'
import { useNavigate } from 'react-router-dom'
import { HexIconGrid } from '../components/HexIconGrid'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <Box sx={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <HexIconGrid />
      {/* vignettes the hex grid at the screen's own edges - a box-shadow on the outer container
          itself would paint BEHIND the grid's absolutely-positioned content (same reason
          Carousel's EdgeFade is its own layered sibling rather than a shadow on the track), so
          this is a separate transparent overlay, painted on top, with nothing but the shadow. */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          boxShadow: (theme) => `inset 0 0 120px 10px ${alpha(theme.palette.common.black, 0.45)}`,
        }}
      />
      {/* the icon's own container - an opaque rectangle (sized to its own content, not stretched)
          with a plain border, and a drop shadow behind it (not inset - a regular, non-inset
          box-shadow paints OUTSIDE the border edge, so it's unaffected by the grid/vignette
          layering concerns above) so it lifts cleanly off the busy hex grid behind it. */}
      <Box
        sx={(theme) => ({
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          px: 2,
          py: 500,
          bgcolor: 'background.default',
          border: `1px solid ${theme.vars?.palette.divider ?? theme.palette.divider}`,
          borderRadius: 1,
          boxShadow: `0 16px 40px ${alpha(theme.palette.common.black, 0.4)}`,
        })}
      >
        <Unknown404Icon sx={{ width: 280, height: 'auto' }} />
        <Stack spacing={1} sx={{ alignItems: 'center', textAlign: 'center' }}>
          <Typography variant="h4" color="textDimmed">Page not found</Typography>
          <Typography variant="body1" color="textDimmed">
              The page you&apos;re looking for <br></br>
              doesn&apos;t exist or may have moved.
          </Typography>
        </Stack>
        <Button label="Back to Homepage" variant="outlined" onClick={() => navigate('/')} />
      </Box>
    </Box>
  )
}
