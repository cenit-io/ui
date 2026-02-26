import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: {
            light: '#64748b',
            main: '#1e293b',
            dark: '#0f172a',
            contrastText: '#f8fafc',
        },
        secondary: {
            light: '#67e8f9',
            main: '#0891b2',
            dark: '#155e75',
            contrastText: '#ecfeff',
        },
        background: {
            default: '#f1f5f9',
            paper: '#f8fafc',
        },
        text: {
            primary: '#0f172a',
            secondary: '#334155',
        },
        success: {
            light: '#86efac',
            main: '#16a34a',
            dark: '#166534',
        },
        warning: {
            light: '#fde68a',
            main: '#d97706',
            dark: '#92400e',
        },
        error: {
            light: '#fda4af',
            main: '#dc2626',
            dark: '#991b1b',
        },
    },
    shape: {
        borderRadius: 10,
    },
    shadows: [
        'none',
        '0 1px 2px rgba(15, 23, 42, 0.06), 0 1px 1px rgba(15, 23, 42, 0.04)',
        '0 2px 6px rgba(15, 23, 42, 0.07), 0 1px 2px rgba(15, 23, 42, 0.05)',
        '0 4px 10px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.06)',
        '0 8px 18px rgba(15, 23, 42, 0.09), 0 3px 8px rgba(15, 23, 42, 0.07)',
        '0 10px 24px rgba(15, 23, 42, 0.1), 0 4px 10px rgba(15, 23, 42, 0.07)',
        '0 12px 28px rgba(15, 23, 42, 0.11), 0 5px 12px rgba(15, 23, 42, 0.08)',
        '0 14px 30px rgba(15, 23, 42, 0.12), 0 6px 14px rgba(15, 23, 42, 0.09)',
        '0 16px 34px rgba(15, 23, 42, 0.13), 0 7px 16px rgba(15, 23, 42, 0.09)',
        '0 18px 38px rgba(15, 23, 42, 0.14), 0 8px 18px rgba(15, 23, 42, 0.1)',
        '0 20px 42px rgba(15, 23, 42, 0.15), 0 10px 20px rgba(15, 23, 42, 0.1)',
        '0 22px 46px rgba(15, 23, 42, 0.16), 0 11px 22px rgba(15, 23, 42, 0.11)',
        '0 24px 50px rgba(15, 23, 42, 0.17), 0 12px 24px rgba(15, 23, 42, 0.11)',
        '0 26px 54px rgba(15, 23, 42, 0.18), 0 13px 26px rgba(15, 23, 42, 0.12)',
        '0 28px 58px rgba(15, 23, 42, 0.19), 0 14px 28px rgba(15, 23, 42, 0.12)',
        '0 30px 62px rgba(15, 23, 42, 0.2), 0 15px 30px rgba(15, 23, 42, 0.13)',
        '0 32px 66px rgba(15, 23, 42, 0.21), 0 16px 32px rgba(15, 23, 42, 0.13)',
        '0 34px 70px rgba(15, 23, 42, 0.22), 0 17px 34px rgba(15, 23, 42, 0.14)',
        '0 36px 74px rgba(15, 23, 42, 0.23), 0 18px 36px rgba(15, 23, 42, 0.14)',
        '0 38px 78px rgba(15, 23, 42, 0.24), 0 19px 38px rgba(15, 23, 42, 0.15)',
        '0 40px 82px rgba(15, 23, 42, 0.25), 0 20px 40px rgba(15, 23, 42, 0.15)',
        '0 42px 86px rgba(15, 23, 42, 0.26), 0 21px 42px rgba(15, 23, 42, 0.16)',
        '0 44px 90px rgba(15, 23, 42, 0.27), 0 22px 44px rgba(15, 23, 42, 0.16)',
        '0 46px 94px rgba(15, 23, 42, 0.28), 0 23px 46px rgba(15, 23, 42, 0.17)',
        '0 48px 98px rgba(15, 23, 42, 0.29), 0 24px 48px rgba(15, 23, 42, 0.17)',
    ],
    typography: {
        fontFamily: [
            '"Manrope"',
            '"Segoe UI"',
            '"Helvetica Neue"',
            'sans-serif',
        ].join(','),
        h5: {
            fontWeight: 700,
            letterSpacing: '-0.02em',
        },
        button: {
            fontWeight: 600,
            letterSpacing: '0.01em',
            textTransform: 'none',
        },
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                '*': {
                    boxSizing: 'border-box',
                },
                '*::before, *::after': {
                    boxSizing: 'border-box',
                },
                ':focus-visible': {
                    outline: '2px solid #0891b2',
                    outlineOffset: '2px',
                },
                body: {
                    backgroundColor: '#f1f5f9',
                    color: '#0f172a',
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: '#1e293b',
                    color: '#f8fafc',
                    boxShadow: '0 3px 12px rgba(15, 23, 42, 0.22)',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    border: '1px solid rgba(30, 41, 59, 0.08)',
                },
            },
        },
        MuiTabs: {
            styleOverrides: {
                root: {
                    minHeight: 44,
                },
                indicator: {
                    height: 3,
                    borderRadius: 3,
                    backgroundColor: '#0891b2',
                },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    minHeight: 44,
                    color: '#334155',
                    transition: 'color 160ms ease, background-color 160ms ease',
                    '&.Mui-selected': {
                        color: '#0f172a',
                    },
                },
            },
        },
        MuiListItemButton: {
            styleOverrides: {
                root: {
                    borderRadius: 10,
                    transition: 'background-color 150ms ease, color 150ms ease',
                    '&:hover': {
                        backgroundColor: 'rgba(8, 145, 178, 0.08)',
                    },
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    borderRadius: 10,
                },
            },
        },
    },
});

export default theme;
