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

export const Input = ({
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


class SingleInputSuggest<T extends (string | Hyperlink)> extends React.Component<{
    row_id: string,
    column: string;
    inputRef?: React.RefObject<HTMLInputElement>;

    onClose?: () => void;
    onInputChange?: (value: any, cause: string) => void;
    onRowChange?: (rowUpdate: object, commitChanges: boolean) => void;
    onClick?: (key: string) => void;
    registerActions?: (actions: object) => void;

    hyperlink?: boolean;
    suggestions: ((value: string) => T[]) | T[];
    value: T;
    inputValue: T;
}> {
    public static defaultProps = {
        hyperlink: false,
        suggestions: [],
    }

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        this.props.onInputChange(this.props.value, 'mount');
    }

    componentWillUnmount() {
        this.props.onInputChange(null, 'unmount');
    }

    onInputChange = (event, {newValue, method}: {newValue: string, method: string}) => {
        if (method === "click") {
            this.props.onRowChange({[this.props.column]: newValue}, true);
            this.props.onClose();
        } else {
            this.props.onInputChange?.(newValue, method);
        }
    };

    inputKeyDown = (event) => {
        let stop = false;
        if ((event.key === 'Tab' || event.key === 'Enter')) {
            if (!this.props.hyperlink || typeof this.props.inputValue === 'object') {
                this.props.onRowChange({[this.props.column]: this.props.inputValue}, true);
            }
        } else if (['ArrowUp', 'ArrowDown'].includes(event.key) && this.props.suggestions) {
            stop = true;
        } else if (['Escape'].includes(event.key)) {
            this.props.onClose();
        }
        if (stop) {
            event.preventDefault();
            event.stopPropagation();
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
        return hyperlink
            ? <a><input {...inputProps}/></a>
            : <input {...inputProps}/>;
    };

    onSuggestionsFetchRequested = () => {};
    onSuggestionsClearRequested = () => {};

    render() {
        const inputProps = {
            placeholder: 'Type here',
            value: get_text(this.props.inputValue),
            onChange: this.onInputChange,
            onKeyDown: this.inputKeyDown,
            hyperlink: this.props.hyperlink,
        };

        return (
            <div onKeyDown={(event) => event.defaultPrevented && event.stopPropagation()}>
                <AutoSuggest
                    ref={this.onAutoSuggestRef}
                    alwaysRenderSuggestions
                    onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
                    onSuggestionsClearRequested={this.onSuggestionsClearRequested}
                    suggestions={this.props.suggestions}
                    renderInputComponent={this.renderInput}
                    getSuggestionValue={val => val}
                    renderSuggestion={this.renderSuggestion}
                    inputProps={inputProps}
                />
            </div>
        );
    }
}

export default SingleInputSuggest;