import { useState } from 'react'
import type { MouseEvent } from 'react'
import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip } from '@mui/material'
import { useColorScheme } from '@mui/material/styles'
import LightModeTwoToneIcon from '@mui/icons-material/LightModeTwoTone'
import DarkModeTwoToneIcon from '@mui/icons-material/DarkModeTwoTone'
import SettingsBrightnessTwoToneIcon from '@mui/icons-material/SettingsBrightnessTwoTone'

const modeOptions = [
    { value: 'light', label: 'Light', icon: <LightModeTwoToneIcon fontSize="small" /> },
    { value: 'dark', label: 'Dark', icon: <DarkModeTwoToneIcon fontSize="small" /> },
    { value: 'system', label: 'System', icon: <SettingsBrightnessTwoToneIcon fontSize="small" /> },
] as const

// icon-only trigger (a moon or sun, reflecting the ACTUAL active mode - not just the raw
// setting) that opens a menu of light/dark/system - built on MUI's own useColorScheme, so it
// needs no app-level state.
export function ColorModeToggle() {
    const { mode, systemMode, setMode } = useColorScheme()
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

    // mode === 'system' doesn't say which way it's currently resolved - systemMode (only
    // populated in that case) carries the OS-level light/dark it settled on.
    const isDark = (mode === 'system' ? systemMode : mode) === 'dark'

    return (
        <>
            <Tooltip title="Color mode">
                <IconButton
                    onClick={(event: MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget)}
                    aria-label="Color mode"
                    color="inherit"
                >
                    {isDark ? <DarkModeTwoToneIcon /> : <LightModeTwoToneIcon />}
                </IconButton>
            </Tooltip>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                {modeOptions.map((option) => (
                    <MenuItem
                        key={option.value}
                        selected={(mode ?? 'system') === option.value}
                        onClick={() => {
                            setMode(option.value)
                            setAnchorEl(null)
                        }}
                    >
                        <ListItemIcon>{option.icon}</ListItemIcon>
                        <ListItemText>{option.label}</ListItemText>
                    </MenuItem>
                ))}
            </Menu>
        </>
    )
}
