import React from 'react';
import AutoSuggest from 'react-autosuggest';
import 'react-autosuggest';
import './style.css';
import {Hyperlink} from '../../types';

const EMPTY_ARRAY = [];

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
    onClick?: (value?: string) => void;
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



export class SingleInputSuggest<T extends (string | Hyperlink)> extends React.Component<{
    row_id: number,
    column: string;
    inputRef?: React.RefObject<HTMLInputElement>;

    onClose?: () => void;
    onInputChange?: (value: any, cause: string) => void;
    onRowChange?: (rowUpdate: object, rowIdx, commitChanges: boolean) => void;
    onClick?: (key: string) => void;
    registerActions?: (actions: object) => void;

    hyperlink?: boolean;
    suggestions: ((value: string) => T[]) | T[];
    value: T;
    inputValue?: T;
}, {
    inputValue: T;
}> {
    public static defaultProps = {
        hyperlink: false,
        suggestions: [],
    }

    constructor(props) {
        super(props);
        this.state = {
            inputValue: props.value
        };
    }

    componentDidMount() {
        this.setState({inputValue: this.props.value});
        this.props.onInputChange(this.props.value, 'mount');
    }

    componentWillUnmount() {
        this.setState({inputValue: null});
        this.props.onInputChange(null, 'unmount');
    }

    onInputChange = (event, {newValue, method}: {newValue: T, method: string}) => {
        if (method === "click") {
            this.props.onRowChange({[this.props.column]: newValue}, this.props.row_id, true);
            this.props.onClose();
        } else {
            this.setState({inputValue: newValue});
            this.props.onInputChange?.(newValue, method);
        }
    };

    inputKeyDown = (event) => {
        let stop = false;
        if ((event.key === 'Tab' || event.key === 'Enter')) {
            const inputValue = this.props.inputValue === undefined ? this.state.inputValue : this.props.inputValue;
            if (!this.props.hyperlink || typeof inputValue === 'object') {
                this.props.onRowChange({[this.props.column]: inputValue}, this.props.row_id, true);
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
            (this.props.inputRef as any).current = ref ? ref.input : null;
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
            value: get_text(this.props.inputValue === undefined ? this.state.inputValue : this.props.inputValue),
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
                    suggestions={this.props.suggestions || EMPTY_ARRAY}
                    renderInputComponent={this.renderInput}
                    getSuggestionValue={val => val}
                    renderSuggestion={this.renderSuggestion}
                    inputProps={inputProps}
                />
            </div>
        );
    }
}


export class MultiInputSuggest<T extends (string | Hyperlink)> extends React.Component<{
    column: string;
    row_id: number;
    inputRef?: React.RefObject<HTMLInputElement>;

    onClose?: () => void;
    onInputChange?: (value: any, cause: string) => void;
    onRowChange?: (rowUpdate: object, rowIdx: number, commitChanges: boolean) => void;
    onClick?: (row_id: number, name: string, key: any) => void;
    registerActions?: (actions: object) => void;

    hyperlink?: boolean;
    suggestions: ((value: string) => T[]) | T[];
    value: T[];
    inputValue: (string | Hyperlink)[];
}, {
    inputValue: (string | Hyperlink)[];
}> {
    public static defaultProps = {
        hyperlink: false,
        suggestions: [],
    }

    private needsInputScroll: boolean;

    constructor(props) {
        super(props);

        this.state = {
            inputValue: props.value
        };
        this.needsInputScroll = false;
    }

    getInputValue() {
        const inputValue = this.props.inputValue === undefined ? this.state.inputValue : this.props.inputValue;
        return Array.isArray(inputValue) ? inputValue : [];
    }

    getEditedValue() {
        const inputValue = this.props.inputValue === undefined ? this.state.inputValue : this.props.inputValue;
        return Array.isArray(inputValue) ? inputValue[inputValue.length - 1] : null;
    }

    componentDidMount() {
        this.setState({inputValue: [...this.props.value, ""]});
        this.props.onInputChange([...this.props.value, ""], "mount");
    }

    componentWillUnmount() {
        this.setState({inputValue: null});
        this.props.onInputChange(null, "unmount");
    }

    onInputChange = (event, {newValue, method}: {newValue: string, method: string}) => {
        const newTags = [...this.getInputValue() || []];
        newTags[newTags.length - 1] = newValue

        this.setState({inputValue: newTags});
        this.props.onInputChange?.(newTags, method);
    };

    removeTag = (i) => {
        const inputValue = this.props.inputValue === undefined ? this.state.inputValue : this.props.inputValue;
        const newTags = [...inputValue || []];
        newTags.splice(i, 1);
        this.setState({inputValue: newTags});
        this.props.onInputChange?.(newTags, "remove");
    };

    addTag = () => {
        const inputValue = this.props.inputValue === undefined ? this.state.inputValue : this.props.inputValue;
        const newTags = [...inputValue || []];
        newTags.push("");
        this.setState({inputValue: newTags});
        this.props.onInputChange(newTags, "add");
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
                this.props.onRowChange({[this.props.column]: inputValue.slice(0, inputValue.length - 1)}, this.props.row_id, true);
            } else {
                this.props.onRowChange({[this.props.column]: inputValue}, this.props.row_id, true);
            }
        }
    };

    onAutoSuggestRef = (ref) => {
        if (this.props.inputRef) {
            // @ts-ignore
            (this.props.inputRef as any).current = ref ? ref.input : null;
            if (ref) {
                ref.input.focus();
            }
        }
    };

    renderSuggestion = (suggestion) => (
        <div>
            {this.props.hyperlink
                ? <a onClick={() => this.props.onClick?.(this.props.row_id, this.props.column, suggestion.key)}>{suggestion.text}</a>
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
                    suggestions={this.props.suggestions || EMPTY_ARRAY}
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
