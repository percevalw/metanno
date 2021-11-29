import React, {useEffect, useLayoutEffect as useLayoutEffect$1, useRef} from 'react';
import './style.css';


const checkboxLabel = "c1w6d5eo700-beta7";
const checkboxLabelClassname = `rdg-checkbox-label ${checkboxLabel}`;
const checkboxInput = "c1h7iz8d700-beta7";
const checkboxInputClassname = `rdg-checkbox-input ${checkboxInput}`;
const checkbox = "cc79ydj700-beta7";
const checkboxClassname = `rdg-checkbox ${checkbox}`;
const checkboxLabelDisabled = "c1e5jt0b700-beta7";
const checkboxLabelDisabledClassname = `rdg-checkbox-label-disabled ${checkboxLabelDisabled}`;

const useLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect$1;

function useFocusRef(isSelected) {
    const ref = useRef(null);
    useLayoutEffect(() => {
        var _ref$current;

        if (!isSelected) return;
        (_ref$current = ref.current) == null ? void 0 : _ref$current.focus({
            preventScroll: true
        });
    }, [isSelected]);
    return {
        ref,
        tabIndex: isSelected ? 0 : -1
    };
}

type SharedInputProps = Pick<React.InputHTMLAttributes<HTMLInputElement>, 'disabled' | 'onClick' | 'aria-label' | 'aria-labelledby'>;

declare interface SelectCellFormatterProps extends SharedInputProps {
    isCellSelected: boolean;
    value: boolean;
    onChange: (value: boolean, isShiftClick: boolean) => void;
}


export default function BooleanInput({
                                 value,
                                 isCellSelected,
                                 disabled,
                                 onClick,
                                 onChange,
                                 'aria-label': ariaLabel,
                                 'aria-labelledby': ariaLabelledBy
                             }: SelectCellFormatterProps): JSX.Element {
    const {
        ref,
        tabIndex
    } = useFocusRef(isCellSelected);

    function handleChange(e) {
        onChange(e.target.checked, e.nativeEvent.shiftKey);
    }

    return (
        <div className={'rdg-checkbox-container'}>
            <label className={`${checkboxLabelClassname} ${disabled ? checkboxLabelDisabledClassname : ''}`}>
                <input
                    aria-label={ariaLabel}
                    aria-labelledby={ariaLabelledBy}
                    ref={ref}
                    type="checkbox"
                    tabIndex={tabIndex}
                    className={checkboxInputClassname}
                    disabled={disabled}
                    checked={value}
                    onChange={handleChange} />
                <div className={checkboxClassname}/>
            </label>
        </div>);
}
