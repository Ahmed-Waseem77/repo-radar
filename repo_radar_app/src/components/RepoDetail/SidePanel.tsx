import { Carousel, EmptyState, RepoOverviewCompact, getRepoKey } from '@radar-repo/radar-repo-lib'
import type { SidePanelState } from '../../hooks/useSidePanelRepos'

export const SIDE_PANEL_WIDTH = 300
const SIDE_PANEL_LOADING_COUNT = 6

// dummy-but-complete RepoOverviewDto fields, same convention Homepage/TrackedRepos already use
// for their own loading placeholder cards - RepoOverviewCompact's `loading` prop only skips
// RENDERING these, it still requires the full shape.
function SidePanelLoading() {
    return (
        <>
            {Array.from({ length: SIDE_PANEL_LOADING_COUNT }, (_, index) => (
                <RepoOverviewCompact
                    key={`side-panel-loading-${index}`}
                    title={`loading-${index}`}
                    owner=""
                    url=""
                    ownerUrl=""
                    description=""
                    lastCommit={{ hash: '', date: '', developerName: '', url: '' }}
                    starCount={0}
                    languageInfo={{ languages: [], distribution: [] }}
                    topics={[]}
                    archived={false}
                    onTrack={() => {}}
                    onDetailedView={() => {}}
                    variant="stripped"
                    fitContent
                    loading
                    tracked={false}
                />
            ))}
        </>
    )
}

export interface SidePanelProps {
    sidePanelState: SidePanelState
    // the repo currently shown in the main pane - highlighted in the list, its own description
    // hidden since the full detail is already visible elsewhere.
    selectedRepoKey: string
}

// the side panel's content (message/loading skeletons/Carousel of cards) - reused both as a
// permanent fixed-width column on a wide screen and as the content of a slide-in overlay on a
// narrow one (see RepoDetailView for each).
export function SidePanel({ sidePanelState, selectedRepoKey }: SidePanelProps) {
    // `width` (a real Carousel prop, not just wrapping it in a sized Box) is required here, not
    // optional: this is a 'grid' layout, and a plain CSS `width: fit-content` on a wrapping flex
    // container sizes from its UNWRAPPED max-content width (every card side by side in one
    // line), not the actually-wrapped rendered width - so it blows out far wider than one card.
    // `flexShrink: 0` (set internally whenever `width` is passed) is what actually keeps this
    // fixed regardless of how little/much room the row beside it wants.
    // error/empty/notFound render a plain sized EmptyState INSTEAD of the Carousel, rather than
    // feeding it a non-card child - Carousel's 'grid' layout assumes card-shaped children, so a
    // single big message box doesn't measure/lay out the same way a card would.
    if (sidePanelState.status === 'error') {
        return (
            <EmptyState
                message={`Something went wrong loading repos: ${sidePanelState.error.message}`}
                iconWidth={120}
                variant="body2"
                sx={{ width: SIDE_PANEL_WIDTH, flexShrink: 0, px: 2, py: 4 }}
            />
        )
    }
    if (sidePanelState.status === 'empty' || sidePanelState.status === 'notFound') {
        return <EmptyState message={sidePanelState.message} iconWidth={120} variant="body2" sx={{ width: SIDE_PANEL_WIDTH, flexShrink: 0, px: 2, py: 4 }} />
    }

    return (
        <Carousel width={SIDE_PANEL_WIDTH} orientation="vertical" layout="grid" autoScroll={false} gutter={2} divider>
            {sidePanelState.status === 'loading' ? (
                <SidePanelLoading />
            ) : (
                sidePanelState.repos.map((sidePanelRepo) => {
                    const isSelected = getRepoKey(sidePanelRepo) === selectedRepoKey
                    return (
                        <RepoOverviewCompact
                            key={getRepoKey(sidePanelRepo)}
                            {...sidePanelRepo}
                            variant="stripped"
                            fitContent
                            hideDescription={isSelected}
                            selected={isSelected}
                        />
                    )
                })
            )}
        </Carousel>
    )
}
