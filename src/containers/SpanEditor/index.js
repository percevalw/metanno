import React from "react";
import PropTypes from "prop-types";
import {connect, useSelector} from "react-redux";
import SpanComponent from "../../components/SpanComponent";
import Toolbar from "../../components/Toolbar";
import Loading from "../../components/Loading";
import {memoize} from "../../utils";

const mapStateToProps = (state, ownProps) => {
    const editorState = state.editors ? state.editors[ownProps.id] : null;
    return editorState ? {
        spans: editorState.spans,
        buttons: editorState.buttons,
        text: editorState.text,
        mouse_selection: editorState.mouse_selection,
        styles: editorState.styles,
        ...ownProps,
    } : {...ownProps, 'loading': true};
};

const SpanEditor = ({
                        id,
                        onKeyPress,
                        onClickSpan,
                        onEnterSpan,
                        onLeaveSpan,
                        onMouseSelect,
                        registerActions,
                        onButtonPress,
                        selectEditorState,
                    }) => {
    const {
        spans,
        text,
        mouse_selection,
        buttons,
        styles,
        loading,

    } = useSelector(memoize(
        state => {
            const derived = selectEditorState(state, id);
            return (derived
                ? {
                    text: '',
                    spans: [],
                    mouse_selection: [],
                    buttons: [],
                    styles: [],
                    ...derived,
                    loading: false
                }
                : {loading: true})
        },
        //? {...state.editors[id], loading: false} : {loading: true}),
        state => state,
        true
        ),
    );


    if (loading) {
        return (
            <div className={"container is-loading"}>
                <Loading/>
            </div>);
    }
    return (
        <div className={`container ${buttons.length > 0 ? "has-toolbar" : ''}`}>
            {buttons.length > 0
                ? <Toolbar
                    buttons={buttons}
                    onButtonPress={idx => onButtonPress(idx, mouse_selection)}/>
                : null}
            <SpanComponent
                id={id}
                loading={loading}
                spans={spans}
                text={text}
                styles={styles}
                mouse_selection={mouse_selection}

                onKeyPress={onKeyPress}
                onClickSpan={onClickSpan}
                onEnterSpan={onEnterSpan}
                onLeaveSpan={onLeaveSpan}
                onMouseSelect={onMouseSelect}//mouse_selection => this.setState(state => ({...state, mouse_selection}))}
                registerActions={registerActions}
            />
        </div>
    )
};

export default SpanEditor;

SpanEditor.propTypes = {
    id: PropTypes.string,
    spans: PropTypes.arrayOf(PropTypes.object),
    buttons: PropTypes.arrayOf(PropTypes.object),
    onKeyPress: PropTypes.func,
    onMouseSelect: PropTypes.func,
    onClickSpan: PropTypes.func,
    onEnterSpan: PropTypes.func,
    onLeaveSpan: PropTypes.func,
    onSetSelection: PropTypes.func,
    registerActions: PropTypes.func,
    text: PropTypes.string,
    selectEditorState: PropTypes.func,
};

SpanEditor.defaultProps = {
    spans: [],
    mouse_selection: [],
    text: "",
    buttons: [],
};