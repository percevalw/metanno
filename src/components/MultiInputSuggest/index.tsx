import React from 'react';
import AutoSuggest from 'react-autosuggest';
import 'react-autosuggest';
import './style.css';
import {Hyperlink} from '../../types';

function get_text(value: (string | Hyperlink)): string {
    return typeof value === "string"
        ? value
        : (value && value.text ? value.text : "");
}


export const InputTag = ({
                             value,
                             inputProps = {},
                             autocontain = false,
                             readOnly = false,
                             hyperlink = false,
                             onRemoveTag = null,
                             onClick = null
                         }: {
    value: (string | Hyperlink)[];
    inputProps?: React.InputHTMLAttributes<HTMLInputElement> & { ref?: React.RefObject<HTMLInputElement> };
    autocontain?: boolean;
    readOnly?: boolean;
    hyperlink?: boolean;
    onRemoveTag?: (index: number) => void;
    onClick?: (key: string) => void;
}) => {
    const res = (
        <div className={`input-tag ${readOnly ? '' : 'editable'}`}>
            <ul className="input-tag__tags">
                {value.map((tag, i) => (
                    <li key={i}>
                        {hyperlink
                            ? <a onClick={() => onClick((tag as Hyperlink).key)}>{(tag as Hyperlink).text}</a>
                            : <span>{tag as string}</span>}
                        {readOnly ? null :
                            <button type="button" onClick={() => !!onRemoveTag && onRemoveTag(i)}>✕</button>}
                    </li>
                ))}
                {readOnly ? null : <li className="input-tag__tags__input"><input autoFocus type="text" {...inputProps}/></li>}
            </ul>
        </div>
    );
    if (autocontain) {
        return <div className="input-tag-container">{res}</div>
    }
    return res;
}


class MultiInputSuggest<T extends (string | Hyperlink)> extends React.Component<{
    column: string;
    inputRef?: React.RefObject<HTMLInputElement>;

    onClose?: () => void;
    onInputChange?: (value: any) => void;
    onRowChange?: (rowUpdate: object, commitChanges: boolean) => void;
    onClick?: (key: string) => void;
    registerActions?: (actions: object) => void;

    hyperlink?: boolean;
    suggestions: ((value: string) => T[]) | T[];
    value: T[];
    inputValue: (string | Hyperlink)[];
}> {
    public static defaultProps = {
        hyperlink: false,
        suggestions: [],
    }

    private needsInputScroll: boolean;

    constructor(props) {
        super(props);

        this.needsInputScroll = false;
    }

    getInputValue() {
        return Array.isArray(this.props.inputValue) ? this.props.inputValue : [];
    }

    getEditedValue() {
        return Array.isArray(this.props.inputValue) ? this.props.inputValue[this.props.inputValue.length - 1] : null;
    }

    componentDidMount() {
        this.props.onInputChange([...this.props.value, ""]);
    }

    componentWillUnmount() {
        this.props.onInputChange(null);
    }

    onInputChange = (event, {newValue}) => {
        const newTags = [...this.getInputValue() || []];
        newTags[newTags.length - 1] = newValue

        this.props.onInputChange?.(newTags);
    };

    removeTag = (i) => {
        const newTags = [...this.props.inputValue || []];
        newTags.splice(i, 1);
        this.props.onInputChange?.(newTags);
    };

    addTag = () => {
        const newTags = [...this.props.inputValue || []];
        newTags.push("");
        this.props.onInputChange(newTags);
    }

    inputKeyDown = (event) => {
        let commit = false;
        let val = event.target.value;
        const inputValue = this.getInputValue();
        if ((event.key === 'Tab' || event.key === 'Enter') && val) {
            this.addTag();

            this.needsInputScroll = true;
            event.preventDefault();
            event.stopPropagation();
        } else if (event.key === 'Backspace' && !val) {
            this.removeTag(inputValue.length - 1);
        } else if (!!this.props.suggestions && ['ArrowUp', 'ArrowDown'].includes(event.key)) {
            commit = false;
        } else if (['Enter', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
            commit = true;
        } else if (['Escape'].includes(event.key)) {
            this.props.onClose();
        }
        if (commit) {
            if (this.getEditedValue() === "") {
                this.props.onRowChange({[this.props.column]: inputValue.slice(0, inputValue.length - 1)}, true);
            } else {
                this.props.onRowChange({[this.props.column]: inputValue}, true);
            }
        }
    };

    onAutoSuggestRef = (ref) => {
        if (this.props.inputRef) {
            // @ts-ignore
            this.props.inputRef.current = ref ? ref.input : null;
            if (ref) {
                ref.input.focus();
            }
        }
    };

    renderSuggestion = (suggestion) => (
        <div>
            {this.props.hyperlink
                ? <a onClick={() => this.props.onClick?.(suggestion.key)}>{suggestion.text}</a>
                : suggestion}
        </div>
    );


    renderInput = ({hyperlink, ...inputProps}) => {
        const inputValue = this.getInputValue();
        return <InputTag
            value={inputValue.slice(0, inputValue.length - 1)}
            inputProps={inputProps}
            onRemoveTag={this.removeTag}
            hyperlink={!!hyperlink}
        />
    };

    onSuggestionsFetchRequested = () => {};
    onSuggestionsClearRequested = () => {};

    render() {
        const inputValue = get_text(this.getEditedValue());
        const inputProps = {
            placeholder: 'Type here',
            value: inputValue,
            onChange: this.onInputChange,
            onKeyDown: this.inputKeyDown,
            hyperlink: this.props.hyperlink,
        };

        return (
            <div onKeyDown={(event) => event.defaultPrevented && event.stopPropagation()}>
                <AutoSuggest
                    ref={this.onAutoSuggestRef}
                    alwaysRenderSuggestions
                    suggestions={this.props.suggestions}
                    onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
                    onSuggestionsClearRequested={this.onSuggestionsClearRequested}
                    renderInputComponent={this.renderInput}
                    getSuggestionValue={val => val}
                    renderSuggestion={this.renderSuggestion}
                    inputProps={inputProps}
                />
            </div>
        );
    }

    componentDidUpdate() {
        if (this.needsInputScroll && this.props.inputRef && this.props.inputRef.current) {
            // @ts-ignore
            this.props.inputRef.current.scrollIntoViewIfNeeded({behavior: 'smooth'});
        }
        this.needsInputScroll = false;
    }
}

export default MultiInputSuggest;