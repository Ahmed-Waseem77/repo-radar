import { Box, Stack, Skeleton, Typography } from '@mui/material'
import { Button } from '../Button/Button'
import { Pill } from '../Text/Pill'
import InlineCode from '../Text/InlineCode'
import { TextLink } from '../Text/TextLink'
import StarTwoToneIcon from '@mui/icons-material/StarTwoTone'
import GavelTwoToneIcon from '@mui/icons-material/GavelTwoTone'
import ChevronRightTwoToneIcon from '@mui/icons-material/ChevronRightTwoTone'
import type { RepoOverviewDto } from '../../types'
import LanguageDistributionBar from './LanguageDistributionBar'

export interface RepoOverviewProps extends RepoOverviewDto {
    loading: boolean,
    tracked: boolean
}

// interactive descendants (links, the Track button) need this to win hit-testing over the
// full-card overlay button below, which sits at zIndex:0 - see that button's own comment.
const interactiveSx = { position: 'relative' as const, zIndex: 1 }

export default function RepoOverview({onTrack, onDetailedView, loading, ...props}: RepoOverviewProps) {
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
            <Stack direction="row" sx={{
                justifyContent:"space-between",
                alignItems:"center",
                flexWrap: 'wrap',
                rowGap: 1,
            }}>
                <Stack direction="column" spacing={-1} sx={{ minWidth: 0 }}>
                    <Stack direction="row" sx={{ minWidth: 0, alignItems: 'center' }} spacing={2}>
                        <TextLink href={props.url} variant='h5' noWrap sx={{ minWidth: 0, ...interactiveSx }}>
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
                    labelLayout='aligned'
                    languageCutoff={8}
                />
            <Typography
                noWrap
                variant='caption'
                sx={(theme) => ({
                    // deliberately inverted from the scheme-matched text.dimmed token: light mode
                    // shows dark mode's dimmed value and vice versa - text.dimmed itself is left
                    // untouched since other components (e.g. the empty-state label) rely on it
                    // resolving to the current scheme's own value.
                    color: theme.colorSchemes?.dark?.palette?.text?.dimmed ?? '#293427',
                    ...theme.applyStyles('dark', {
                        color: theme.colorSchemes?.light?.palette?.text?.dimmed ?? '#B3C4B3',
                    }),
                })}
            >
                Latest Commit: <TextLink href={props.lastCommit.url} sx={interactiveSx}><InlineCode color='secondary'>{props.lastCommit.hash}</InlineCode></TextLink> by{' '}
                {props.lastCommit.authorUrl ? (
                    <TextLink href={props.lastCommit.authorUrl} sx={interactiveSx}>{props.lastCommit.developerName}</TextLink>
                ) : (
                    props.lastCommit.developerName
                )} on {props.lastCommit.date}
            </Typography>
            </Stack>
            </Stack>
                <Button
                    label={props.tracked ? 'Untrack' : 'Track'}
                    onClick={onTrack}
                    variant="contained"
                    color={props.tracked ? 'secondary' : 'primary'}
                    size='small'
                    sx={{ width: 20, ...interactiveSx }}
                />
            {/* covers the whole card as the actual click target for "view details" - a real
                <button> (not role="button" on the root) so it's never an ancestor of the real
                interactive controls above (links, Track), which is what made those a nested-
                interactive-control a11y violation before. zIndex:0 is required, not cosmetic:
                CSS paints positioned elements after in-flow static content regardless of DOM
                order, so without it this would sit on top and swallow every click meant for the
                content above (see interactiveSx on each of them). Last in DOM order so keyboard/
                screen-reader users reach the specifically-labeled controls first. */}
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
