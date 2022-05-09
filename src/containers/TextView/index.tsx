import React from "react";
import {useSelector} from "react-redux";
import TextComponent from "../../components/TextComponent";
import Toolbar from "../../components/Toolbar";
import Loading from "../../components/Loading";
import {memoize} from "../../utils";
import {TextData, TextMethods, ToolbarData, ToolbarMethods} from "../../types";

const TextView = ({
    id,
    onButtonPress,
    onKeyPress,
    onClickSpan,
    onMouseEnterSpan,
    onMouseLeaveSpan,
    onMouseSelect,
    registerActions,
    selectEditorState,
}: {
    id: string;
    className?: string,
    selectEditorState: (state: object, id: string) => TextData;
} & ToolbarMethods & TextMethods) => {
    const {
        spans,
        text,
        mouse_selection,
        buttons,
        styles,
        loading,
    } = useSelector(
            memoize(
            (state: object): TextData & ToolbarData & {loading: boolean}  => {
            let derived = null;
            if (selectEditorState && state) {
                derived = selectEditorState(state, id)
            }
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
        state => state,
        true
        )
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
            <TextComponent
                id={id}
                spans={spans}
                text={text}
                styles={styles}
                mouse_selection={mouse_selection}

                onKeyPress={onKeyPress}
                onClickSpan={onClickSpan}
                onMouseEnterSpan={onMouseEnterSpan}
                onMouseLeaveSpan={onMouseLeaveSpan}
                onMouseSelect={onMouseSelect}//mouse_selection => this.setState(state => ({...state, mouse_selection}))}
                registerActions={registerActions}
            />
        </div>
    )
};

export default TextView;