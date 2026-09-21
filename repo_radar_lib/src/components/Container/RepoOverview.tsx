import { Box, Stack, Skeleton, Typography } from '@mui/material'
import { Button } from '../Button/Button'
import { Pill } from '../Text/Pill'
import InlineCode from '../Text/InlineCode'
import { TextLink } from '../Text/TextLink'
import { NotFoundNotice } from '../Text/NotFoundNotice'
import StarTwoToneIcon from '@mui/icons-material/StarTwoTone'
import GavelTwoToneIcon from '@mui/icons-material/GavelTwoTone'
import ChevronRightTwoToneIcon from '@mui/icons-material/ChevronRightTwoTone'
import BookmarkTwoToneIcon from '@mui/icons-material/BookmarkTwoTone'
import NewReleasesTwoToneIcon from '@mui/icons-material/NewReleasesTwoTone'
import type { RepoOverviewDto } from '../../types'
import LanguageDistributionBar from './LanguageDistributionBar'

export interface RepoOverviewLatestRelease {
    version: string
    url: string
}

export interface RepoOverviewProps extends RepoOverviewDto {
    loading: boolean,
    tracked: boolean,
    // omits the full-card "view details" overlay button below - for when this card IS the
    // detail view itself (clicking it shouldn't navigate anywhere); Track/Untrack stays fully
    // functional either way.
    disableDetailedView?: boolean,
    // omits the Track/Untrack button from its default spot at the bottom of the card - for
    // callers that want to place it elsewhere themselves (e.g. inline with other actions).
    // `onTrack` stays a required prop either way; the caller wires it to their own button instead.
    disableTrackButton?: boolean,
    // undefined: still fetching - renders InlineCode's own animated loading badge. null: fetched,
    // repo has no releases - renders nothing. An object renders the version badge/link beside the
    // title. A caller that never intends to show a release badge at all should pass `null`
    // explicitly rather than leaving this unset - leaving it `undefined` reads as "fetch in
    // flight" and shows a perpetual loading badge, since there's no way to tell "omitted" apart
    // from "explicitly undefined" once it reaches this component.
    latestRelease?: RepoOverviewLatestRelease | null,
    // forwarded to the internal LanguageDistributionBar. 'aligned' (default) matches the
    // original card layout, tying each caption to its own bar segment; the repo detail view
    // uses 'inline' instead, since it has room for a full running list of languages rather than
    // per-segment captions that get unreadable once there are many thin segments.
    languageLabelLayout?: 'aligned' | 'inline',
    languageCutoff?: number,
}

// interactive descendants (links, the Track button) need this to win hit-testing over the
// full-card overlay button below, which sits at zIndex:0 - see that button's own comment.
const interactiveSx = { position: 'relative' as const, zIndex: 1 }

export default function RepoOverview({
    onTrack,
    onDetailedView,
    loading,
    disableDetailedView = false,
    disableTrackButton = false,
    languageLabelLayout = 'aligned',
    languageCutoff = 8,
    ...props
}: RepoOverviewProps) {
    // TODO: Return a Responsive Variant for Mobile Screens
    if (loading) {
        return (
            <Stack direction="column" spacing={1} sx={{ p:2, flex: '100% 0 0' }}>
                <Stack direction="row" sx={{
                    justifyContent:"space-between",
                    alignItems:"center",
                    flexWrap: 'wrap',
                    rowGap: 1,
                }}>
                    <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                        <Skeleton variant="text" width={160} sx={{ fontSize: '1.5rem' }} />
                    </Stack>
                    <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                        <Skeleton variant="rounded" width={90} height={28} />
                        <Skeleton variant="rounded" width={70} height={28} />
                    </Stack>
                </Stack>
                <Stack
                    direction="row"
                    sx={{ minWidth: 50, flexWrap: 'wrap', columnGap: 5, rowGap: 1 }}
                >
                    <Stack spacing={1} sx={{ flex:'100 0 0%', maxWidth: 'sm', minWidth: 0 }}>
                        <Skeleton variant="text" width="100%" />
                        <Skeleton variant="text" width="100%" />
                    </Stack>
                    <Stack direction='column' spacing={1} sx={{ flex: '100 0 0%' }}>
                        <Skeleton variant="rounded" height={20} sx={{ width: '100%' }} />
                        <Skeleton variant="text" width="100%" />
                    </Stack>
                </Stack>
                <Skeleton variant="rounded" width={80} height={32} />
            </Stack>
       )
    }

    return (
        <Stack
        direction="column"
        sx={(theme) => ({
            position: 'relative',
            flex: '100% 0 0',
            borderRadius: 1,
            padding: 2,
            gap: 1,
            // both of these hint at the full-card overlay button below (a background tint and the
            // chevron sliding in) - pointless without it, so neither applies once disableDetailedView
            // removes that button.
            ...(!disableDetailedView && {
                transition: theme.transitions.create('background-color'),
                '&:hover': {
                    bgcolor: 'action.hover',
                },
                '&:hover .repo-overview-chevron': {
                    opacity: 1,
                    transform: 'translateX(0)',
                },
            }),
        })}
        >
            <Stack direction="row" sx={{
                justifyContent:"space-between",
                alignItems:"center",
                flexWrap: 'wrap',
                rowGap: 1,
            }}>
            <Stack direction="row">
            <Stack direction="column" spacing={-1} sx={{ minWidth: 0 }}>
                    <Stack direction="row" sx={{ minWidth: 0, alignItems: 'center', gap: 1 }}>
                        <TextLink href={props.url} variant='h5' noWrap sx={{ minWidth: 0, ...interactiveSx }}>
                            {props.title}
                        </TextLink>
                    </Stack>
                    <TextLink href={props.ownerUrl} variant='caption' color='textSecondary' noWrap sx={interactiveSx}>
                        {props.owner}
                    </TextLink>
                </Stack>
                        {props.latestRelease === undefined ? (
                            // still fetching - undefined specifically means "in flight" (as
                            // opposed to `null`, meaning the fetch settled and found no release).
                            // ml (wider than the row's own small base gap) is deliberate: the
                            // owner line sits directly below this one and can easily run longer
                            // than the title, so a badge sitting right up against a short title
                            // would read as misaligned with it - the extra margin keeps a
                            // consistent, generous gap regardless of how short the title is.
                            <InlineCode color='secondary' loading sx={{ ml: 2, ...interactiveSx }} />
                        ) : (
                            props.latestRelease && (
                                <TextLink href={props.latestRelease.url} sx={{ ml: 2, textDecoration: 'none', ...interactiveSx }}>
                                    <InlineCode color='secondary' startIcon={<NewReleasesTwoToneIcon fontSize='inherit' />}>
                                        {props.latestRelease.version}
                                    </InlineCode>
                                </TextLink>
                            )
                        )}
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
                                })}
                            />
                        )}
                </Stack>
                <Stack direction="row" sx={{ minWidth: 0, flexWrap: 'wrap', gap: 1 }}>
                    {props.archived &&
                        <Pill
                            size='large'
                            shape='rounded'
                            variant='warning'
                            iconSize='large'
                            label={props.archivalDate ? `archived on ${props.archivalDate}` : 'archived'}
                        />
                    }
                    {props.license &&
                        <Pill
                            size='large'
                            shape='rounded'
                            variant='default'
                            iconSize='large'
                            startIcon={<GavelTwoToneIcon />}
                            label={props.license}
                        />
                    }
                    <Pill size='large' shape='rounded' variant='secondary' iconSize='large' startIcon={<StarTwoToneIcon />} label={String(props.starCount)} />
                </Stack>
            </Stack>
            <Stack
        direction="row"
        sx={{
            minWidth:50, flexWrap: 'wrap', columnGap: 5, rowGap: 1
        }}
            >
            <Typography>{props.description}</Typography>
            {/* lifted into the positioned layer (not just its own LanguageDistributionBar segments
                individually) so its hover interactions still receive pointer events - a
                position:absolute element (the overlay button below, even at zIndex:0) paints
                above ANY non-positioned sibling regardless of z-index, which was silently
                swallowing hover on this column's plain, non-positioned content.
                maxWidth caps it at half the row's width even once it's alone on its own wrapped
                line (flex-grow would otherwise stretch it to the full row width there) - ml:'auto'
                then pushes that half-width block to the row's right edge instead of leaving it
                flush left with empty space on the right. */}
            <Stack direction='column' spacing={1} sx={{ flex: '100 0 0%', maxWidth: '50%', ml: 'auto', ...interactiveSx }}>
                <LanguageDistributionBar
                    languages={props.languageInfo.languages}
                    distribution={props.languageInfo.distribution}
                    height='sm'
                    labelLayout={languageLabelLayout}
                    languageCutoff={languageCutoff}
                />
            {props.lastCommit ? (
                <Typography
                    noWrap
                    variant='caption'
                    color='textDimmedInverted'
                >
                    Latest Commit: <TextLink href={props.lastCommit.url} sx={interactiveSx}><InlineCode color='secondary'>{props.lastCommit.hash}</InlineCode></TextLink> by{' '}
                    {props.lastCommit.authorUrl ? (
                        <TextLink href={props.lastCommit.authorUrl} sx={interactiveSx}>{props.lastCommit.developerName}</TextLink>
                    ) : (
                        props.lastCommit.developerName
                    )} on {props.lastCommit.date}
                </Typography>
            ) : (
                // the repo's commit history failed to load (e.g. GitHub 409s the commits
                // endpoint for an empty/no-history repo) - the rest of this card came straight
                // from the search/list response and is unaffected, so only this section degrades
                <NotFoundNotice resource="commit" />
            )}
            </Stack>
            </Stack>
                {!disableTrackButton && (
                    <Button
                        label={props.tracked ? 'Untrack' : 'Track'}
                        onClick={onTrack}
                        variant={props.tracked ? 'outlined' : 'contained'}
                        color={props.tracked ? 'secondary' : 'primary'}
                        size='small'
                        startIcon={<BookmarkTwoToneIcon />}
                        // without this, the outer column Stack's default cross-axis stretch would
                        // grow the button to the full width of the card instead of sizing to its
                        // own label/icon
                        sx={{ alignSelf: 'flex-start', ...interactiveSx }}
                    />
                )}
            {/* covers the whole card as the actual click target for "view details" - a real
                <button> (not role="button" on the root) so it's never an ancestor of the real
                interactive controls above (links, Track), which is what made those a nested-
                interactive-control a11y violation before. zIndex:0 is required, not cosmetic:
                CSS paints positioned elements after in-flow static content regardless of DOM
                order, so without it this would sit on top and swallow every click meant for the
                content above (see interactiveSx on each of them). Last in DOM order so keyboard/
                screen-reader users reach the specifically-labeled controls first.

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
