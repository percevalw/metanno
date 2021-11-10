import React, {useRef, useEffect} from 'react';
import Autosuggest from 'react-autosuggest';
import 'react-autosuggest';
import './style.css';
import PropTypes from "prop-types";
import {blurSubscribe, hyperlinkSubscribe, preventBlurSubscribe} from "../../hyperlinkPubSub";

// Teach Autosuggest how to calculate suggestions for any given input value.
const filterSuggestions = (suggestions, value, hyperlink) => {
    const inputValue = (value.text !== undefined ? value.text : value).trim().toLowerCase();
    const inputLength = inputValue.length;

    if (hyperlink)
        return inputLength === 0 ? suggestions : suggestions.filter(suggestion =>
            (suggestion.key.toLowerCase().slice(0, inputLength) === inputValue) ||
            (suggestion.text.toLowerCase().slice(0, inputLength) === inputValue)
        );
    else
        return inputLength === 0 ? suggestions : suggestions.filter(suggestion =>
            suggestion.toLowerCase().slice(0, inputLength) === inputValue
        );
};

export const InputTag = (
    {
        value,
        inputProps = {},
        onRemoveTag = null,
        autocontain = false,
        readOnly = false,
        hyperlink = false,
        onClick = null
    }) => {
    const inputRef = useRef(null);
    const updateRef = (elem) => {
        inputRef.current = elem;
        if (inputProps.ref) {
            inputProps.ref(elem);
        }
    };
    useEffect(() => {
        // TODO this is not working apparently
        inputRef.current && inputRef.current.focus();
    }, [value, inputRef]);
    const res = (
        <div className={`input-tag ${readOnly ? '' : 'editable'}`}>
            <ul className="input-tag__tags">
                {value.map((tag, i) => (
                    <li key={i}>
                        {hyperlink
                            ? <a onClick={() => onClick(tag.key)}>{tag.text}</a>
                            : <span>{tag}</span>}
                        {readOnly ? null :
                            <button type="button" onClick={() => !!onRemoveTag && onRemoveTag(i)}>✕</button>}
                    </li>
                ))}
                {readOnly ? null : <li className="input-tag__tags__input"><input autoFocus type="text" {...inputProps}
                                                                                 ref={updateRef}/></li>}
            </ul>
        </div>
    );
    if (autocontain) {
        return <div className="input-tag-container">{res}</div>
    }
    return res;
}


class MultiInputSuggest extends React.Component {
    constructor(props) {
        super(props);

        // Autosuggest is a controlled component.
        // This means that you need to provide an input value
        // and an onChange handler that updates this value (see below).
        // Suggestions also need to be provided to the Autosuggest,
        // and they are initially empty because the Autosuggest is closed.
        this.state = {
            inputValue: "",
            filteredSuggestions: [],
            value: undefined,
        };
        this.suggestRef = React.createRef();
        this.inputTagRef = React.createRef();
        this.hyperlinkUnsubscribe = null;
        this.preventBlur = false;
    }

    componentDidMount() {
        this.hyperlinkUnsubscribe = hyperlinkSubscribe(this.addTag);
    }

    componentWillUnmount() {
        if (this.hyperlinkUnsubscribe) {
            this.hyperlinkUnsubscribe();
            this.hyperlinkUnsubscribe = null
        }
    }

    getInputNode() {
        return this.suggestRef ? this.suggestRef.current.input : null;
    }

    static getDerivedStateFromProps(props, state) {
        return {
            ...state,
            value: state.value === undefined ? props.value : state.value,
            //value: props.value,
        }
    }

    onInputChange = (event, {newValue}) => {
        this.setState(state => ({
            ...state,
            inputValue: newValue.text !== undefined ? newValue.text : newValue,
        }));
    };

    // Autosuggest will call this function every time you need to update suggestions.
    // You already implemented this logic above, so just use it.
    onSuggestionsFetchRequested = ({value}) => {
        this.setState(state => ({
            ...state,
            filteredSuggestions: (
                Array.isArray(this.props.suggestions)
                    ? filterSuggestions(this.props.suggestions, value, this.props.hyperlink)
                    : this.props.computeSuggestions === undefined
                    ? []
                    : this.props.suggestions(value)
            )
        }));
    };

    // Autosuggest will call this function every time you need to clear suggestions.
    onSuggestionsClearRequested = () => {
        this.setState(state => ({
            ...state,
            filteredSuggestions: []
        }));
    };

    renderInput = ({hyperlink, ...inputProps}) => {
        return <InputTag
            value={this.state.value || []}
            inputProps={inputProps}
            onRemoveTag={this.removeTag}
            hyperlink={!!hyperlink}
        />
    };

    renderSuggestion = (suggestion) => (
        <div>
            {this.props.hyperlink
                ? <a onClick={() => onClick(suggestion.key)}>{suggestion.text}</a>
                : suggestion}
        </div>
    );

    updateValue = (value) => {
        this.props.onRowChange({...this.props.row, [this.props.column.key]: value}, true);
    };

    removeTag = (i) => {
        const newTags = [...this.state.value || []];
        newTags.splice(i, 1);
        this.setState(state => ({
            ...state,
            value: newTags,
            filteredSuggestions: this.props.suggestions || [],
        }));
    };

    addTag = (tag) => {
        this.preventBlur = true;
        setTimeout(() => {this.preventBlur = false;}, 10);
        this.setState(state => ({
            ...state,
            value: [...(this.state.value || []), tag],
            filteredSuggestions: this.props.suggestions || [],
            inputValue: "",
        }));
    }

    inputKeyDown = (event) => {
        let commit = false;
        let val = event.target.value;
        if ((event.key === 'Tab' || event.key === 'Enter') && val) {
            this.addTag(this.props.hyperlink ? this.state.filteredSuggestions[0] : val);
            //this.updateValue([...this.state.value || [], val]);

            this.needsInputScroll = true;
            event.preventDefault();
            event.stopPropagation();
        } else if (event.key === 'Backspace' && !val) {
            this.removeTag((this.state.value || []).length - 1)
        } else if (!!this.props.suggestions && ['ArrowUp', 'ArrowDown'].includes(event.key)) {
            commit = false;
        } else if (['Enter', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
            commit = true;
        }
        else if (['Escape'].includes(event.key)) {
            this.props.onClose();
        }
        if (commit) {
            this.updateValue(this.state.value);
        }
    };

    onBlur = (event) => {
        if (this.preventBlur)
            return;
        if (this.state.inputValue) {
            this.updateValue([...this.state.value || [], this.props.hyperlink
                ? this.state.filteredSuggestions[0]
                : this.state.inputValue]);
            this.setState(state => ({...state, filteredSuggestions: this.props.suggestions || [], inputValue: ""}));
        }
        if (this.props.onClose)
            this.props.onClose(event);
    };

    onAutosuggestRef = (ref) => {
        if (ref)
            ref.input.focus();
        this.suggestRef = ref;
    };

    render() {
        const {inputValue, filteredSuggestions} = this.state;

        // Autosuggest will pass through all these props to the input.
        const inputProps = {
            placeholder: 'Type here',
            value: inputValue,
            onChange: this.onInputChange,
            onKeyDown: this.inputKeyDown,
            onBlur: this.onBlur,
            hyperlink: this.props.hyperlink,
            ref: this.inputTagRef,
        };

        // Finally, render it!
        return (
            <div onKeyDown={(event) => event.defaultPrevented && event.stopPropagation()}>
                <Autosuggest
                    ref={this.onAutosuggestRef}
                    alwaysRenderSuggestions
                    suggestions={filteredSuggestions}
                    renderInputComponent={this.renderInput}
                    onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
                    onSuggestionsClearRequested={this.onSuggestionsClearRequested}
                    getSuggestionValue={val => val}
                    renderSuggestion={this.renderSuggestion}
                    inputProps={inputProps}
                />
            </div>
        );
    }

    componentDidUpdate() {
        if (this.needsInputScroll && this.suggestRef) {
            this.suggestRef.input.scrollIntoViewIfNeeded({behavior: 'smooth'});
        }
        this.needsInputScroll = false;
    }
}

MultiInputSuggest.propTypes = {
    onChange: PropTypes.func,
    onClose: PropTypes.func,
    onBlur: PropTypes.func,
    onRowChange: PropTypes.func,
    registerActions: PropTypes.func,
    hyperlink: PropTypes.bool,
    suggestions: PropTypes.oneOfType([PropTypes.func, PropTypes.arrayOf(PropTypes.string)]),
    value: PropTypes.array,
};

MultiInputSuggest.defaultProps = {};

export default MultiInputSuggest;