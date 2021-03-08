import React, { useEffect, useRef } from 'react';
import { FormControl, IconButton, InputAdornment, InputLabel, makeStyles } from "@material-ui/core";
import ClearIcon from "@material-ui/icons/Clear";
import FilledInput from "@material-ui/core/FilledInput";
import reactiveControlFor from "./reactiveControlFor";
import OutlinedInput from "@material-ui/core/OutlinedInput";
import FormHelperText from "@material-ui/core/FormHelperText";
import { position as getCaretPosition } from 'caret-pos';
import { useSpreadState } from "../common/hooks";
import Box from "@material-ui/core/Box";
import clsx from "clsx";

const useStyles = makeStyles(theme => ({
    anchorMenu: {
        background: theme.palette.background.paper,
        position: 'absolute',
        zIndex: 2,
        '& ul': {
            cursor: 'pointer',
            margin: 0,
            padding: 0,
            listStyleType: 'none',
            '& li': {
                padding: theme.spacing(1),
                '&:hover': {
                    background: theme.palette.text.disabled,
                    color: theme.palette.getContrastText(theme.palette.text.disabled)
                },
                '&.active': {
                    background: theme.palette.text.primary,
                    color: theme.palette.getContrastText(theme.palette.text.primary)
                }
            }
        }
    }
}));

const InputControl = reactiveControlFor(
    ({
         title,
         value,
         disabled,
         readOnly,
         dynamicKey,
         error,
         onChange,
         onBlur,
         autoFocus,
         onFocus,
         onClear,
         type,
         multiline,
         variant,
         autoComplete,
         autoSuggest
     }) => {

        const inputValue = value || '';

        const [state, setState] = useSpreadState({
            options: [],
            optionIndex: 0
        });

        const { caretPosition, options, optionIndex } = state;

        const inputRef = useRef();
        const anchorStart = useRef(-1);
        const classes = useStyles();

        useEffect(() => {
            if (autoSuggest?.anchor && autoSuggest?.values) {
                const { anchor, values } = autoSuggest;
                const caretPosition = getCaretPosition(inputRef.current);
                const newState = { caretPosition };
                const pos = inputRef.current.selectionStart;
                const anchorSize = autoSuggest.anchor.length;
                const anchorLookBack = inputValue.substring(pos - anchorSize, pos);
                if (anchorLookBack === anchor) {
                    anchorStart.current = pos;
                }
                const start = anchorStart.current;
                if (start !== -1) {
                    if (pos >= start) {
                        const partial = inputValue.substring(start, pos);
                        newState.options = partial.length
                            ? values.filter(value => value.includes(partial))
                            : values;
                        newState.optionIndex = Math.max(0, Math.min(optionIndex, newState.options.length - 1));
                    } else {
                        anchorStart.current = -1;
                    }
                }
                setState(newState);
            }
        }, [inputValue, autoSuggest]);

        const handleBlur = e => {
            anchorStart.current = -1;
            if (options.length) {
                setState({ options: [] });
            }
            onBlur && onBlur(e);
        };

        const selectOption = index => () => {
            if (0 <= index && index < options.length) {
                let str = inputValue.substring(0, anchorStart.current) +
                    options[index] + (autoSuggest.tail || '');
                const newPos = str.length;
                str += inputValue.substring(caretPosition.pos, inputValue.length);
                if (onChange) {
                    onChange(str);
                } else {
                    inputRef.current.value = str;
                }
                setTimeout(() => inputRef.current.setSelectionRange(newPos, newPos))
            }
            anchorStart.current = -1;
            setState({ options: [] });
        };

        const handleKeyDown = e => {
            let handled = true;
            switch (e.keyCode) {
                case 13:
                    selectOption(optionIndex)();
                    break;
                case 27:
                    selectOption(-1)();
                    break;
                case 38:
                    setState({ optionIndex: Math.max(0, optionIndex - 1) });
                    break;
                case 40:
                    setState({ optionIndex: Math.min(options.length - 1, optionIndex + 1) });
                    break;
                default:
                    handled = false;
            }
            if (handled) {
                e.preventDefault();
                e.stopPropagation();
            }
        };

        if (variant !== 'outlined') {
            variant = 'filled';
        }

        const InputControl = variant === 'outlined'
            ? OutlinedInput
            : FilledInput;

        let anchorMenu;
        if (anchorStart.current !== -1 && options.length) {
            anchorMenu = options.map((option, index) => (
                <li key={`opt_${option}`}
                    className={clsx(index === optionIndex && 'active')}
                    onClick={selectOption(index)}>
                    {option}
                </li>
            ));
            anchorMenu = (
                <Box bgcolor="background.paper"
                     boxShadow={1}
                     className={classes.anchorMenu}
                     style={{
                         left: caretPosition.left,
                         top: caretPosition.top + caretPosition.height
                     }}>
                    <ul>
                        {anchorMenu}
                    </ul>
                </Box>
            );
        }

        return (
            <FormControl fullWidth disabled={disabled} component="div" style={{ position: 'relative' }}>
                <InputLabel htmlFor={dynamicKey} variant={variant}>{title}</InputLabel>
                <InputControl key={dynamicKey}
                              inputRef={inputRef}
                              id={dynamicKey}
                              label={title}
                              type={type}
                              readOnly={readOnly}
                              error={error}
                              value={inputValue}
                              onChange={e => onChange(e.target.value)}
                              onBlur={handleBlur}
                              onKeyDown={handleKeyDown}
                              autoFocus={autoFocus}
                              onFocus={onFocus}
                              multiline={multiline}
                              autoComplete={autoComplete}
                              endAdornment={
                                  !readOnly && !disabled && value !== undefined && value !== null &&
                                  <InputAdornment position="end" component="div">
                                      <IconButton onClick={onClear}>
                                          <ClearIcon component="svg"/>
                                      </IconButton>
                                  </InputAdornment>
                              }
                              variant={variant}/>
                {anchorMenu}
            </FormControl>
        );
    }
);

export default InputControl;
