import { Stack, Skeleton, Typography, Avatar } from '@mui/material'
import { Button } from '../Button/Button'
import { Pill } from '../Text/Pill'
import InlineCode from '../Text/InlineCode'
import StarSharpIcon from '@mui/icons-material/StarSharp'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import type { RepoOverviewDto } from '../../types'
import LanguageDistributionBar from './LanguageDistributionBar'
import { themedRandomColor } from '../../util'

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
                }}>
                    <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                        <Skeleton variant="circular" width={40} height={40} />
                        <Skeleton variant="text" width={160} sx={{ fontSize: '1.5rem' }} />
                    </Stack>
                    <Stack direction="row" spacing={2}>
                        <Skeleton variant="rounded" width={120} height={28} />
                    </Stack>
                </Stack>
                <Stack
                    spacing={5}
                    direction="row"
                >
                    <Stack spacing={2} direction="column" sx={{ flex:'100 0 0%', justifyContent:'space-between', maxWidth: 'sm', minWidth: 0 }}>
                    <Stack>
                        <Skeleton variant="text" width="100%" />
                        <Skeleton variant="text" width="100%" />
                    </Stack>
                        <Skeleton variant="rounded" width='100%' height={32} />
                    </Stack>
                    <Stack direction='column' spacing={1} sx={{ flex: '100 0 0%' }}>
                        <Skeleton variant="rounded" height={20} sx={{ width: '100%' }} />
                        <Skeleton variant="text" width="100%" />
                        <Skeleton variant="rounded" width="100%" height={60} />
                    </Stack>
                </Stack>
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
                alignItems:"center"
            }}>
                <Stack direction="row" sx={{ minWidth: 0, alignItems: 'center' }} spacing={2}>
                <Avatar
                    sx={[
                        (theme) => {
                            const { light, dark } = themedRandomColor(theme, props.title)
                            return {
                                fontWeight: 600,
                                bgcolor: light,
                                ...theme.applyStyles('dark', { bgcolor: dark }),
                            }
                        },
                    ]}
                >{props.title[0].toUpperCase()}</Avatar>
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
                <Stack direction="row" sx={{ minWidth: 0}}spacing={2}>
                    {props.archived ?
                        <Pill size='large' shape='rounded' variant='warning' iconSize='large' label={'archived on ' + props.archivalDate} />
                        :''}
                        <Pill size='large' shape='rounded' variant='secondary' iconSize='large' startIcon={<StarSharpIcon />} label={String(props.starCount)} />
                </Stack>
            </Stack>
            <Stack direction="row" spacing={2}>
            </Stack>
            <Stack
                spacing={5}
                direction="row"
            >
            <Stack spacing={2} direction="column" sx={{ flex:'100 0 0%', justifyContent:'space-between', maxWidth: 'sm', minWidth: 0 }}>
                <Typography>{props.description}</Typography>
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
            <Stack direction='column' spacing={1} sx={{ flex: '100 0 0%' }}>
                <LanguageDistributionBar
                    languages={props.languageInfo.languages}
                    distribution={props.languageInfo.distribution}
                    height='sm'
                />
            <Typography sx={{ fontSize: 'medium' }}> Latest Commit: <InlineCode color='secondary'> {props.lastCommit.hash} </InlineCode></Typography>
            <Typography noWrap> by {props.lastCommit.developerName} on {props.lastCommit.date} </Typography>
            </Stack>
            </Stack>
        </Stack>
    )
}
