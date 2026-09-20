import { Stack, Skeleton, Typography } from '@mui/material'
import { Button } from '../Button/Button'
import { Pill } from '../Text/Pill'
import InlineCode from '../Text/InlineCode'
import StarSharpIcon from '@mui/icons-material/StarSharp'
import GavelSharpIcon from '@mui/icons-material/GavelSharp'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import type { RepoOverviewDto } from '../../types'
import LanguageDistributionBar from './LanguageDistributionBar'

export interface RepoOverviewProps extends RepoOverviewDto {
    loading: boolean,
    tracked: boolean
}

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
        spacing={1}
        role="button"
        tabIndex={0}
        onClick={onDetailedView}
        onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onDetailedView(event)
            }
        }}
        sx={(theme) => ({
            flex: '100% 0 0',
            cursor: 'pointer',
            borderRadius: 1,
            padding: 2,
            transition: theme.transitions.create('background-color'),
            '&:hover': {
                bgcolor: 'action.hover',
            },
            '&:hover .repo-overview-chevron': {
                opacity: 1,
                transform: 'translateX(0)',
            },
            '&:focus-visible': {
                outline: `2px solid ${theme.vars?.palette.primary.main ?? theme.palette.primary.main}`,
                outlineOffset: 2,
            },
        })}
        >
            <Stack direction="row" sx={{
                justifyContent:"space-between",
                alignItems:"center",
                flexWrap: 'wrap',
                rowGap: 1,
            }}>
                <Stack direction="row" sx={{ minWidth: 0, alignItems: 'center' }} spacing={2}>
                <Typography noWrap variant='h5'>{props.title}</Typography>
                    <ChevronRightIcon
                        className="repo-overview-chevron"
                        sx={(theme) => ({
                            opacity: 0,
                            transform: 'translateX(-4px)',
                            transition: theme.transitions.create(['opacity', 'transform']),
                            color: 'text.secondary',
                        })}
                    />
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
                            startIcon={<GavelSharpIcon />}
                            label={props.license}
                        />
                    }
                    <Pill size='large' shape='rounded' variant='secondary' iconSize='large' startIcon={<StarSharpIcon />} label={String(props.starCount)} />
                </Stack>
            </Stack>
            <Stack direction="row" spacing={2}>
            </Stack>
            <Stack
        direction="row"
        sx={{
            minWidth:50, flexWrap: 'wrap', columnGap: 5, rowGap: 1
        }}
            >
            <Typography>{props.description}</Typography>
            <Stack direction='column' spacing={1} sx={{ flex: '100 0 0%' }}>
                <LanguageDistributionBar
                    languages={props.languageInfo.languages}
                    distribution={props.languageInfo.distribution}
                    height='sm'
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
                Latest Commit: <InlineCode color='secondary'>{props.lastCommit.hash}</InlineCode> by {props.lastCommit.developerName} on {props.lastCommit.date}
            </Typography>
            </Stack>
            </Stack>
                <Button
                    label={props.tracked ? 'Untrack' : 'Track'}
                    onClick={(event) => {
                        event.stopPropagation()
                        onTrack(event)
                    }}
                    variant="contained"
                    color={props.tracked ? 'secondary' : 'primary'}
                    size='small'
                    sx={{ width: 20 }}
                />
        </Stack>
    )
}
