import type { Meta, StoryObj } from '@storybook/react-vite'
import LanguageDistributionBar from './LanguageDistributionBar'

const meta: Meta<typeof LanguageDistributionBar> = {
  title: 'Components/LanguageDistributionBar',
  component: LanguageDistributionBar,
  argTypes: {
    height: { control: 'select', options: ['sm', 'md', 'lg'] },
    labelLayout: { control: 'select', options: ['aligned', 'inline'] },
  },
}
export default meta

type Story = StoryObj<typeof LanguageDistributionBar>

export const Default: Story = {
  args: {
    languages: ['TypeScript', 'CSS', 'JavaScript'],
    distribution: [82, 12, 6],
    height: 'md',
  },
}

export const ShortLanguageNames: Story = {
  args: {
    languages: ['C', 'R', 'Go'],
    distribution: [55, 25, 20],
    height: 'md',
  },
}

export const NoLanguages: Story = {
  args: {
    languages: [],
    distribution: [],
    height: 'md',
  },
}

export const AllZeroDistribution: Story = {
  args: {
    languages: ['TypeScript', 'CSS'],
    distribution: [0, 0],
    height: 'md',
  },
}

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <LanguageDistributionBar {...args} height="sm" />
      <LanguageDistributionBar {...args} height="md" />
      <LanguageDistributionBar {...args} height="lg" />
    </div>
  ),
  args: {
    languages: ['TypeScript', 'CSS', 'JavaScript'],
    distribution: [82, 12, 6],
  },
}

// Confirms the bar fills its parent's width and stays inside it instead of
// overflowing, even with a long label in a narrow container and many languages.
export const NarrowContainer: Story = {
  render: (args) => (
    <div style={{ width: 220, border: '1px dashed gray', padding: 8 }}>
      <LanguageDistributionBar {...args} />
    </div>
  ),
  args: {
    languages: ['TypeScript', 'JavaScript', 'CSS', 'HTML', 'Go'],
    distribution: [82, 45, 12, 8, 6],
    height: 'md',
  },
}

// caps the bar's own rendered width regardless of how wide the parent is
export const MaxWidth: Story = {
  args: {
    languages: ['TypeScript', 'JavaScript', 'CSS', 'HTML', 'Go'],
    distribution: [82, 45, 12, 8, 6],
    height: 'md',
    maxWidth: 240,
  },
}

// many languages, each with a small enough share to otherwise collide on color -
// demonstrates both the languageCutoff prop (top 5 only, renormalized to 100%) and
// the curated color palette staying distinct across the shown segments
export const ManyLanguagesWithCutoff: Story = {
  args: {
    languages: ['TypeScript', 'JavaScript', 'CSS', 'HTML', 'Go', 'Rust', 'Python', 'Shell', 'Dockerfile', 'Makefile'],
    distribution: [420, 210, 90, 60, 55, 40, 30, 20, 12, 8],
    height: 'md',
    languageCutoff: 5,
  },
}

// 'inline' labelLayout: one single noWrap line instead of per-segment aligned
// captions - reads better once segments get too narrow to fit their own label under
export const InlineLabels: Story = {
  render: (args) => (
    <div style={{ width: 260, border: '1px dashed gray', padding: 8 }}>
      <LanguageDistributionBar {...args} />
    </div>
  ),
  args: {
    languages: ['TypeScript', 'JavaScript', 'CSS', 'HTML', 'Go'],
    distribution: [82, 45, 12, 8, 6],
    height: 'md',
    labelLayout: 'inline',
  },
}
