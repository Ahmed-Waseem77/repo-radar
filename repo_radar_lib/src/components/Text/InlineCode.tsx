import { styled, alpha } from '@mui/material/styles';
import Typography, { type TypographyProps } from '@mui/material/Typography';
import type { ReactElement } from 'react';
import { HourglassIcon } from '../Icons/HourglassIcon';

// Typography's `color` prop also accepts text-alpha keys (textPrimary, textDisabled, ...)
// which aren't PaletteColor objects with .main/.light/.dark - only these are.
const paletteColorKeys = ['primary', 'secondary', 'error', 'warning', 'info', 'success'] as const;
type PaletteColorKey = (typeof paletteColorKeys)[number];

function isPaletteColorKey(color: unknown): color is PaletteColorKey {
  return typeof color === 'string' && (paletteColorKeys as readonly string[]).includes(color);
}

export interface InlineCodeProps extends TypographyProps {
  // a leading icon inside the pill, alongside the text (e.g. a release-type icon) - ignored
  // while `loading`, since there's no text to lead in that state.
  startIcon?: ReactElement;
  // swaps the whole pill for a small circular badge containing just the animated HourglassIcon -
  // for content that hasn't resolved yet (e.g. a version number still being fetched), rather
  // than rendering nothing at all until it does.
  loading?: boolean;
}

const StyledInlineCode = styled(Typography)(({ theme, color }) => {
  const key = isPaletteColorKey(color) ? color : 'primary';
  const palette = theme.palette[key];

  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35em',
    fontFamily: 'Monospace',
    fontSize: '0.85em',
    fontWeight: 500,
    lineHeight: 1.4,
    padding: '0.15em 0.5em',
    borderRadius: 6,
    whiteSpace: 'nowrap',
    backgroundColor: alpha(palette.main, 0.1),
    border: `1px solid ${alpha(palette.main, 0.5)}`,
    color: palette.dark,
    ...theme.applyStyles('dark', {
      backgroundColor: alpha(palette.main, 0.16),
      color: palette.light,
    }),
  };
});

export default function InlineCode({ startIcon, loading = false, sx, children, ...props }: InlineCodeProps) {
  return (
    <StyledInlineCode
      component="code"
      variant="body2"
      {...props}
      sx={[
        loading && {
          padding: 0,
          width: '1.8em',
          height: '1.8em',
          justifyContent: 'center',
          borderRadius: '50%',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {loading ? (
        <HourglassIcon fontSize="inherit" />
      ) : (
        <>
          {startIcon}
          {children}
        </>
      )}
    </StyledInlineCode>
  );
}
