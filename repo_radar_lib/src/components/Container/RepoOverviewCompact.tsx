import { Box, Stack, Skeleton, Tooltip, Typography } from '@mui/material'
import { Button } from '../Button/Button'
import { Pill } from '../Text/Pill'
import InlineCode from '../Text/InlineCode'
import { TextLink } from '../Text/TextLink'
import { NotFoundNotice } from '../Text/NotFoundNotice'
import StarTwoToneIcon from '@mui/icons-material/StarTwoTone'
import GavelTwoToneIcon from '@mui/icons-material/GavelTwoTone'
import WarningTwoToneIcon from '@mui/icons-material/WarningTwoTone'
import ChevronRightTwoToneIcon from '@mui/icons-material/ChevronRightTwoTone'
import type { RepoOverviewDto } from '../../types'

export interface RepoOverviewCompactProps extends RepoOverviewDto {
    loading: boolean,
    tracked: boolean,
    // both default to the card's original fixed size - passable so callers can fit it into
    // tighter/looser layouts (e.g. the 'stripped' variant, which needs much less height)
    width?: number | string,
    height?: number | string,
    // 'default' (unchanged): full card - pills row, description, last commit, Track button.
    // 'stripped': last commit and the Track button are dropped entirely, the archived pill
    // collapses to a bare warning icon, and the remaining pills sit beside the title/owner
    // block (space-between) instead of their own row underneath it.
    variant?: 'default' | 'stripped',
}

const CARD_WIDTH = 280
// a self-contained floor rather than relying on a parent flex row to stretch every card to the
// tallest sibling's height (mt:'auto' on the Button below has nothing to push against
// otherwise - e.g. when a card is previewed on its own, with no taller sibling around it)
const CARD_MIN_HEIGHT = 280

// interactive descendants (links, the Track button) need this to win hit-testing over the
// full-card overlay button below, which sits at zIndex:0 - see that button's own comment.
const interactiveSx = { position: 'relative' as const, zIndex: 1 }

// RepoOverview stripped of LanguageDistributionBar, sized to sit in a horizontally-scrolling
// row on small screens instead of stretching to fill a table row.
export default function RepoOverviewCompact({
    onTrack,
    onDetailedView,
    loading,
    width = CARD_WIDTH,
    height = CARD_MIN_HEIGHT,
    variant = 'default',
    ...props
}: RepoOverviewCompactProps) {
    const stripped = variant === 'stripped'

    if (loading) {
        return (
            <Stack direction="column" spacing={1} sx={{ p: 2, width, minHeight: height, flexShrink: 0 }}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                    <Skeleton variant="text" width="60%" sx={{ fontSize: '1.1rem' }} />
                    <Skeleton variant="rounded" width={60} height={24} />
                </Stack>
                {!stripped && (
                    <>
                        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                            <Skeleton variant="rounded" width={70} height={24} />
                            <Skeleton variant="rounded" width={60} height={24} />
                        </Stack>
                        <Skeleton variant="text" width="100%" />
                        <Skeleton variant="text" width="80%" />
                        <Skeleton variant="text" width="90%" />
                        <Skeleton variant="rounded" width={80} height={32} />
                    </>
                )}
            </Stack>
        )
    }

    const pillsAndArchived = (
        <>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
            {props.license &&
                <Pill
                    size='small'
                    shape='rounded'
                    variant='default'
                    iconSize='small'
                    startIcon={<GavelTwoToneIcon />}
                    label={props.license}
                />
            }
            <Pill
                size='small'
                shape='rounded'
                variant='secondary'
                iconSize='small'
                startIcon={<StarTwoToneIcon />}
                label={String(props.starCount)}
            />
        </Stack>
        {props.archived && (
            stripped ? (
                <Tooltip title={props.archivalDate ? `archived on ${props.archivalDate}` : 'archived'}>
                    <WarningTwoToneIcon color="warning" fontSize="small" aria-label="archived" />
                </Tooltip>
            ) : (
                <Pill
                    size='small'
                    shape='rounded'
                    variant='warning'
                    iconSize='small'
                    label={props.archivalDate ? `archived on ${props.archivalDate}` : 'archived'}
                />
            )
        )}
        </>
    )

    const titleAndOwner = (
        <Stack direction='column' spacing={-1} sx={{ minWidth: 0 }}>
            <Stack direction="row" sx={{ alignItems: 'center' }} spacing={1}>
                <TextLink href={props.url} variant='h6' noWrap sx={interactiveSx}>
                    {props.title}
                </TextLink>
                <ChevronRightTwoToneIcon
                    className="repo-overview-chevron"
                    sx={(theme) => ({
                        opacity: 0,
                        transform: 'translateX(-4px)',
                        transition: theme.transitions.create(['opacity', 'transform']),
                        color: 'text.secondary',
                    })}
                />
            </Stack>
            <TextLink href={props.ownerUrl} variant='caption' color='textSecondary' noWrap sx={interactiveSx}>
                {props.owner}
            </TextLink>
        </Stack>
    )

    return (
        <Stack
            direction="column"
            sx={(theme) => ({
                position: 'relative',
                width,
                minHeight: height,
                flexShrink: 0,
                borderRadius: 1,
                padding: 2,
                // gap, not the `spacing` prop: Stack's spacing prop (without useFlexGap) works
                // by injecting its own `& > :not(style) ~ :not(style) { margin-top }` rule, which
                // has enough specificity to beat a plain sx margin on a child - that silently
                // overrode the Button's own mt:'auto' below and kept it from ever reaching the
                // bottom. gap doesn't touch children's own margins at all.
                gap: 1,
                border: `1px solid ${theme.vars?.palette.divider ?? theme.palette.divider}`,
                transition: theme.transitions.create('background-color'),
                '&:hover': {
                    bgcolor: 'action.hover',
                },
                '&:hover .repo-overview-chevron': {
                    opacity: 1,
                    transform: 'translateX(0)',
                },
            })}
        >
            {stripped ? (
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                    {titleAndOwner}
                    {pillsAndArchived}
                </Stack>
            ) : (
                <>
                    {titleAndOwner}
                    {/* its own row, wrapping independently of the description below - the description
                        sits at a consistent distance from this regardless of how many pill rows there
                        are, via the outer Stack's own `spacing` rather than flex-wrap leftover space */}
                    {pillsAndArchived}
                </>
            )}
            <Typography
                variant='body2'
                sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                }}
            >
                {props.description}
            </Typography>
            {!stripped && (
                <>
                    <Stack direction='column' spacing={0}>
                        {props.lastCommit ? (
                            <>
                                <Typography
                                    variant='caption'
                                    sx={(theme) => ({
                                        // deliberately inverted from the scheme-matched text.dimmed token, matching
                                        // RepoOverview - see that component for the full rationale.
                                        color: theme.colorSchemes?.dark?.palette?.text?.dimmed ?? '#293427',
                                        ...theme.applyStyles('dark', {
                                            color: theme.colorSchemes?.light?.palette?.text?.dimmed ?? '#B3C4B3',
                                        }),
                                    })}
                                >
                                Latest Commit: <TextLink href={props.lastCommit.url} sx={interactiveSx}><InlineCode color='secondary'>{props.lastCommit.hash}</InlineCode></TextLink>
                                </Typography>
                            <Typography variant='caption'
                                    sx={(theme) => ({
                                        // deliberately inverted from the scheme-matched text.dimmed token, matching
                                        // RepoOverview - see that component for the full rationale.
                                        color: theme.colorSchemes?.dark?.palette?.text?.dimmed ?? '#293427',
                                        ...theme.applyStyles('dark', {
                                            color: theme.colorSchemes?.light?.palette?.text?.dimmed ?? '#B3C4B3',
                                        }),
                                    })}
                            > by {props.lastCommit.authorUrl ? (
                                    <TextLink href={props.lastCommit.authorUrl} sx={interactiveSx}>{props.lastCommit.developerName}</TextLink>
                                ) : (
                                    props.lastCommit.developerName
                                )} on {props.lastCommit.date} </Typography>
                            </>
                        ) : (
                            // the repo's commit history failed to load (e.g. GitHub 409s the
                            // commits endpoint for an empty/no-history repo) - the rest of this
                            // card came straight from the search/list response and is
                            // unaffected, so only this section degrades
                            <NotFoundNotice resource="commit" />
                        )}
                    </Stack>
                    <Button
                        label={props.tracked ? 'Untrack' : 'Track'}
                        onClick={onTrack}
                        variant="contained"
                        color={props.tracked ? 'secondary' : 'primary'}
                        size='small'
                        // pushes itself to the bottom instead of sitting right under the content above -
                        // cards in the same horizontally-scrolling row stretch to match the tallest one
                        // (Stack's default align-items:stretch), so a shorter card's leftover height
                        // needs somewhere to go rather than being left as a gap above the button
                        sx={{ mt: 'auto', ...interactiveSx }}
                    />
                </>
            )}
            {/* covers the whole card as the actual click target for "view details" - see
                RepoOverview.tsx for the full rationale (same pattern, applied identically here) */}
            <Box
                component="button"
                type="button"
                onClick={onDetailedView}
                aria-label={`View details for ${props.title}`}
                sx={(theme) => ({
                    position: 'absolute',
                    inset: 0,
                    zIndex: 0,
                    width: '100%',
                    height: '100%',
                    margin: 0,
                    padding: 0,
                    border: 'none',
                    borderRadius: 'inherit',
                    background: 'transparent',
                    cursor: 'pointer',
                    '&:focus-visible': {
                        outline: `2px solid ${theme.vars?.palette.primary.main ?? theme.palette.primary.main}`,
                        outlineOffset: 2,
                    },
                })}
            />
        </Stack>
    )
}
