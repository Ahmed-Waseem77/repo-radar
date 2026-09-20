import { Stack, Skeleton, Typography } from '@mui/material'
import { Button } from '../Button/Button'
import { Pill } from '../Text/Pill'
import InlineCode from '../Text/InlineCode'
import StarSharpIcon from '@mui/icons-material/StarSharp'
import GavelSharpIcon from '@mui/icons-material/GavelSharp'
import type { RepoOverviewDto } from '../../types'

export interface RepoOverviewCompactProps extends RepoOverviewDto {
    loading: boolean,
    tracked: boolean
}

const CARD_WIDTH = 280

// RepoOverview stripped of LanguageDistributionBar, sized to sit in a horizontally-scrolling
// row on small screens instead of stretching to fill a table row.
export default function RepoOverviewCompact({ onTrack, onDetailedView, loading, ...props }: RepoOverviewCompactProps) {
    if (loading) {
        return (
            <Stack direction="column" spacing={1} sx={{ p: 2, width: CARD_WIDTH, flexShrink: 0 }}>
                <Skeleton variant="text" width="70%" sx={{ fontSize: '1.1rem' }} />
                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                    <Skeleton variant="rounded" width={70} height={24} />
                    <Skeleton variant="rounded" width={60} height={24} />
                </Stack>
                <Skeleton variant="text" width="100%" />
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="text" width="90%" />
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
                width: CARD_WIDTH,
                flexShrink: 0,
                cursor: 'pointer',
                borderRadius: 1,
                padding: 2,
                border: `1px solid ${theme.vars?.palette.divider ?? theme.palette.divider}`,
                transition: theme.transitions.create('background-color'),
                '&:hover': {
                    bgcolor: 'action.hover',
                },
                '&:focus-visible': {
                    outline: `2px solid ${theme.vars?.palette.primary.main ?? theme.palette.primary.main}`,
                    outlineOffset: 2,
                },
            })}
        >
            <Typography noWrap variant='h6'>{props.title}</Typography>
            <Stack direction="row" sx={{ flexWrap: 'wrap', flex:'100 0 0%', gap: 1 }}>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', maxHeight: 30 }}>
                {props.archived &&
                    <Pill
                        size='small'
                        shape='rounded'
                        variant='warning'
                        iconSize='large'
                        label={props.archivalDate ? `archived on ${props.archivalDate}` : 'archived'}
                    />
                }
                {props.license &&
                    <Pill
                        size='small'
                        shape='rounded'
                        variant='default'
                        iconSize='small'
                        startIcon={<GavelSharpIcon />}
                        label={props.license}
                    />
                }
                <Pill size='small' shape='rounded' variant='secondary' iconSize='small' startIcon={<StarSharpIcon />} label={String(props.starCount)} />
            </Stack>
            </Stack>
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
            <Stack direction='column' spacing={0}>
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
                Latest Commit: <InlineCode color='secondary'>{props.lastCommit.hash}</InlineCode>
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
            > by {props.lastCommit.developerName} on {props.lastCommit.date} </Typography>
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
            />
        </Stack>
    )
}
