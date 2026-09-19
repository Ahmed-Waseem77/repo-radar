import { Button as MuiButton } from '@mui/material'
import type { ButtonProps as MuiButtonProps } from '@mui/material'
export interface ButtonProps extends MuiButtonProps {
    label: string,
}

export const Button = ({label, ...props }: ButtonProps) => {
    return <MuiButton {...props}>
        {label}
    </MuiButton>
}
