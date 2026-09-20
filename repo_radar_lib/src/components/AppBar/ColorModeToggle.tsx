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

// icon-only trigger (always a sun, regardless of the active mode) that opens a menu of
// light/dark/system - built on MUI's own useColorScheme, so it needs no app-level state.
export function ColorModeToggle() {
    const { mode, setMode } = useColorScheme()
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

    return (
        <>
            <Tooltip title="Color mode">
                <IconButton
                    onClick={(event: MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget)}
                    aria-label="Color mode"
                    color="inherit"
                >
                    <LightModeTwoToneIcon />
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
