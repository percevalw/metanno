import React from 'react';
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

class SingleInputSuggest extends React.Component {
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
        };
        this.suggestRef = React.createRef();
        this.hyperlinkUnsubscribe = null;
        this.preventBlur = false;
    }

    componentDidMount() {
        this.hyperlinkUnsubscribe = hyperlinkSubscribe(this.updateValue);
    }

    componentWillUnmount() {
        if (this.hyperlinkUnsubscribe) {
            this.hyperlinkUnsubscribe();
            this.hyperlinkUnsubscribe = null
        }
    }

    static getDerivedStateFromProps(props, state) {
        return {
            ...state,
            inputValue: state.inputValue === undefined ? props.value : state.inputValue,
        }
    }

    onInputChange = (event, {newValue}) => {
        this.setState(state => ({
            ...state,
            inputValue: newValue,
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

    inputKeyDown = (event) => {
        let stop = false;
        if ((event.key === 'Tab' || event.key === 'Enter')) {
            if (!this.props.hyperlink || typeof this.state.inputValue === 'object') {
                this.updateValue(this.state.inputValue);
                console.log("UPDATE", this.state.inputValue);
            }
            // this.setState(state => ({...state, filteredSuggestions: this.props.suggestions}));
            // stop = true;
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
            value: inputValue.text || inputValue,
            onChange: this.onInputChange,
            onKeyDown: this.inputKeyDown,
            onBlur: this.onBlur,
            ref: this.inputTagRef,
        };

        // Finally, render it!
        return (
            <div onKeyDown={(event) => event.defaultPrevented && event.stopPropagation()}>
                <Autosuggest
                    ref={this.onAutosuggestRef}
                    alwaysRenderSuggestions
                    suggestions={filteredSuggestions}
                    onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
                    onSuggestionsClearRequested={this.onSuggestionsClearRequested}
                    getSuggestionValue={val => val}
                    renderSuggestion={this.renderSuggestion}
                    inputProps={inputProps}
                />
            </div>
        );
    }
}

SingleInputSuggest.propTypes = {
    onChange: PropTypes.func,
    onClose: PropTypes.func,
    onBlur: PropTypes.func,
    onRowChange: PropTypes.func,
    registerActions: PropTypes.func,
    hyperlink: PropTypes.bool,
    suggestions: PropTypes.oneOfType([PropTypes.func, PropTypes.arrayOf(PropTypes.string)]),
    value: PropTypes.any,
};

SingleInputSuggest.defaultProps = {};

export default SingleInputSuggest;