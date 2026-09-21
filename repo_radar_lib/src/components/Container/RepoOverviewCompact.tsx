import { useEffect, useRef, useState } from 'react'
import { Box, Collapse, Stack, Skeleton, Tooltip, Typography, Button as MuiButton } from '@mui/material'
import { Pill } from '../Text/Pill'
import InlineCode from '../Text/InlineCode'
import { TextLink } from '../Text/TextLink'
import { NotFoundNotice } from '../Text/NotFoundNotice'
import StarTwoToneIcon from '@mui/icons-material/StarTwoTone'
import GavelTwoToneIcon from '@mui/icons-material/GavelTwoTone'
import WarningTwoToneIcon from '@mui/icons-material/WarningTwoTone'
import ChevronRightTwoToneIcon from '@mui/icons-material/ChevronRightTwoTone'
import BookmarkTwoToneIcon from '@mui/icons-material/BookmarkTwoTone'
import type { RepoOverviewDto } from '../../types'

export interface RepoOverviewCompactProps extends RepoOverviewDto {
    loading: boolean,
    tracked: boolean,
    // both default to the card's original fixed size - passable so callers can fit it into
    // tighter/looser layouts (e.g. the 'stripped' variant, which needs much less height)
    width?: number | string,
    height?: number | string,
    // drops the `height` floor entirely so the card sizes to exactly what its content needs -
    // e.g. a dense single-column list where every card should hug its own content instead of
    // sharing one fixed minimum height.
    fitContent?: boolean,
    // omits the description line entirely (rather than clamping/collapsing it) - for contexts
    // where the card is a compact selector, not a preview of the repo's content.
    hideDescription?: boolean,
    // highlights this card as the currently-active selection (e.g. the repo shown in an adjacent
    // detail view) - a background tint plus permanently showing the hover-only chevron
    // affordance, rather than requiring the mouse to actually be over it.
    selected?: boolean,
    // 'default' (unchanged): full card - header (title/owner + Track button), pills row,
    // description, last commit. 'stripped': last commit and the Track button are dropped
    // entirely, the archived pill collapses to a bare warning icon, and the remaining pills sit
    // beside the title/owner block (space-between) instead of their own row underneath it.
    variant?: 'default' | 'stripped',
    // omits the full-card "view details" overlay button below - for when this card IS the
    // detail view itself (clicking it shouldn't navigate anywhere); Track/Untrack stays fully
    // functional either way. Mirrors RepoOverview's own prop of the same name.
    disableDetailedView?: boolean,
}

const CARD_WIDTH = 280
// a self-contained floor rather than relying on a parent flex row to stretch every card to the
// tallest sibling's height - keeps a lone/short card (e.g. previewed with no taller sibling
// around it) from looking clipped
const CARD_MIN_HEIGHT = 200

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
    fitContent = false,
    hideDescription = false,
    selected = false,
    variant = 'default',
    disableDetailedView = false,
    ...props
}: RepoOverviewCompactProps) {
    const stripped = variant === 'stripped'

    // drives whether the Track button is allowed to shrink on hover - only worth doing when the
    // title is actually clipped by its own noWrap ellipsis, so there's real width to hand back.
    // No CSS selector can ask "is this text truncated", so it's measured directly: the title
    // link's scrollWidth (its untruncated, natural width) exceeding clientWidth (the truncated,
    // rendered width) means the ellipsis is active. Re-measured via ResizeObserver rather than
    // once on mount, since the card's own width (and therefore how much room the title has) is
    // a prop that can change after mount.
    //
    // isHoveringTitleRef guards against a feedback loop: shrinking the button (on hover, once
    // truncated) hands the title more room, which can un-truncate it mid-hover, which would
    // un-shrink the button, which re-truncates the title, forever. Freezing the measurement
    // while the title is actively hovered breaks that loop - it only re-measures once the mouse
    // leaves and the layout has settled back to its resting state.
    const titleRowRef = useRef<HTMLDivElement>(null)
    const isHoveringTitleRef = useRef(false)
    // holds the effect's measurement function so the title's onMouseLeave (an event handler, not
    // an effect - see below) can force an immediate re-check once hovering ends, rather than
    // waiting on the ResizeObserver to happen to fire again for that particular layout change.
    const checkTruncationRef = useRef<() => void>(() => {})
    const [isTitleTruncated, setIsTitleTruncated] = useState(false)

    useEffect(() => {
        const titleEl = titleRowRef.current?.querySelector('a')
        if (!titleEl) return

        const checkTruncation = () => {
            if (isHoveringTitleRef.current) return
            setIsTitleTruncated(titleEl.scrollWidth > titleEl.clientWidth)
        }
        checkTruncationRef.current = checkTruncation
        checkTruncation()

        const observer = new ResizeObserver(checkTruncation)
        observer.observe(titleEl)
        return () => observer.disconnect()
    }, [props.title, width])

    if (loading) {
        return (
            <Stack direction="column" spacing={1} sx={{ p: 2, width, minHeight: fitContent ? undefined : height, flexShrink: 0 }}>
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

    // Inline with the title/owner block instead of its own row at the bottom - shaves height off
    // the card, at the cost of competing with the title for width. When (and only when, via
    // isTitleTruncated above) that costs the title its ellipsis, hovering it shrinks this down to
    // just the bookmark icon so the title has room to breathe - driven by a CSS-only `:has()` on
    // the shared header row (see the `.is-truncated` class below), no hover state needed. The
    // label is its own inner span so its width/opacity can transition independently of the
    // button's own padding collapsing.
    const trackButton = !stripped && (
        <MuiButton
            className="repo-overview-track-button"
            onClick={onTrack}
            variant={props.tracked ? 'outlined' : 'contained'}
            color={props.tracked ? 'secondary' : 'primary'}
            size="small"
            startIcon={<BookmarkTwoToneIcon />}
            sx={(theme) => ({
                flexShrink: 0,
                transition: theme.transitions.create(['padding-left', 'padding-right', 'min-width']),
                '& .MuiButton-startIcon': {
                    transition: theme.transitions.create('margin-right'),
                },
                ...interactiveSx,
            })}
        >
            <Box
                component="span"
                className="repo-overview-track-label"
                sx={(theme) => ({
                    display: 'inline-block',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    maxWidth: 64,
                    transition: theme.transitions.create(['max-width', 'opacity']),
                })}
            >
                {props.tracked ? 'Untrack' : 'Track'}
            </Box>
        </MuiButton>
    )

    const titleAndOwner = (
        <Stack
            className="repo-overview-header"
            direction="row"
            sx={(theme) => ({
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
                minWidth: 0,
                '&:has(.repo-overview-title.is-truncated:hover) .repo-overview-track-button': {
                    paddingLeft: theme.spacing(1),
                    paddingRight: theme.spacing(1),
                    minWidth: 0,
                },
                '&:has(.repo-overview-title.is-truncated:hover) .repo-overview-track-button .MuiButton-startIcon': {
                    marginRight: 0,
                },
                '&:has(.repo-overview-title.is-truncated:hover) .repo-overview-track-label': {
                    maxWidth: 0,
                    opacity: 0,
                },
            })}
        >
            <Stack direction='column' spacing={-1} sx={{ minWidth: 0 }}>
                <Stack direction="row" ref={titleRowRef} sx={{ alignItems: 'center', minWidth: 0 }} spacing={1}>
                    <TextLink
                        href={props.url}
                        variant='h6'
                        noWrap
                        className={`repo-overview-title${isTitleTruncated ? ' is-truncated' : ''}`}
                        onMouseEnter={() => { isHoveringTitleRef.current = true }}
                        onMouseLeave={() => {
                            isHoveringTitleRef.current = false
                            checkTruncationRef.current()
                        }}
                        sx={interactiveSx}
                    >
                        {props.title}
                    </TextLink>
                    {/* hints at the full-card overlay button below - hidden entirely alongside it
                        when disableDetailedView is set, since there's then nothing it's hinting at */}
                    {!disableDetailedView && (
                        <ChevronRightTwoToneIcon
                            className="repo-overview-chevron"
                            sx={(theme) => ({
                                opacity: 0,
                                transform: 'translateX(-4px)',
                                transition: theme.transitions.create(['opacity', 'transform']),
                                color: 'text.secondary',
                                flexShrink: 0,
                            })}
                        />
                    )}
                </Stack>
                <TextLink href={props.ownerUrl} variant='caption' color='textSecondary' noWrap sx={interactiveSx}>
                    {props.owner}
                </TextLink>
            </Stack>
            {trackButton}
        </Stack>
    )

    return (
        <Stack
            direction="column"
            sx={(theme) => ({
                position: 'relative',
                width,
                minHeight: fitContent ? undefined : height,
                flexShrink: 0,
                borderRadius: 1,
                padding: 2,
                // gap, not the `spacing` prop: Stack's spacing prop (without useFlexGap) works
                // by injecting its own `& > :not(style) ~ :not(style) { margin-top }` rule, which
                // has enough specificity to beat a plain sx margin on a child. gap doesn't touch
                // children's own margins at all.
                gap: 1,
                border: stripped ? '0px solid' : `1px solid ${theme.vars?.palette.divider ?? theme.palette.divider}`,
                transition: theme.transitions.create('background-color'),
                ...(selected && { bgcolor: 'action.selected' }),
                '&:hover': {
                    bgcolor: 'action.hover',
                },
                '&:hover .repo-overview-chevron': {
                    opacity: 1,
                    transform: 'translateX(0)',
                },
                // stays visible regardless of hover, rather than only hinting at the "view
                // details" overlay button transiently - this card IS the current selection
                ...(selected && {
                    '& .repo-overview-chevron': {
                        opacity: 1,
                        transform: 'translateX(0)',
                    },
                }),
            })}
        >
            {stripped ? (
                <>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                    {titleAndOwner}
                </Stack>
                {pillsAndArchived}
                </>
            ) : (
                <>
                    {titleAndOwner}
                    {/* its own row, wrapping independently of the description below - the description
                        sits at a consistent distance from this regardless of how many pill rows there
                        are, via the outer Stack's own `spacing` rather than flex-wrap leftover space */}
                    {pillsAndArchived}
                </>
            )}
            {/* Collapse (rather than the plain conditional this used to be) animates the height
                change instead of cutting it instantly - since Collapse continuously resizes the
                DOM node during the animation rather than just tweening a start/end CSS value, any
                sibling cards below this one in a list reflow smoothly too, as a side effect. */}
            <Collapse in={!hideDescription}>
                <Typography
                    variant='body2'
                    color='textDimmedInverted'
                    sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                    }}
                >
                    {props.description}
                </Typography>
            </Collapse>
            {!stripped && (
                <Stack direction='column' spacing={0}>
                    {props.lastCommit ? (
                        <>
                            <Typography
                                variant='caption'
                                color='textDimmedInverted'
                            >
                            Latest Commit: <TextLink href={props.lastCommit.url} sx={interactiveSx}><InlineCode color='secondary'>{props.lastCommit.hash}</InlineCode></TextLink>
                            </Typography>
                        <Typography variant='caption' color='textDimmedInverted'
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
            )}
            {/* covers the whole card as the actual click target for "view details" - see
                RepoOverview.tsx for the full rationale (same pattern, applied identically here).
                Omitted entirely when this card IS the detail view already (disableDetailedView) -
                there's nowhere further to navigate to, so the overlay would just be dead click
                area sitting on top of nothing. */}
            {!disableDetailedView && (
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
            )}
        </Stack>
    )
}
