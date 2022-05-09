import React from "react";
import {useSelector} from "react-redux";
import TextComponent from "../../components/TextComponent";
import Toolbar from "../../components/Toolbar";
import Loading from "../../components/Loading";
import {memoize} from "../../utils";
import {TextRange, ToolbarData, TextData} from "../../types";

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
    registerActions: ({
                          scroll_to_line,
                          scroll_to_span,
                          clear_current_mouse_selection,
                      }: {
        scroll_to_line: (number) => void,
        scroll_to_span: () => void,
        clear_current_mouse_selection: () => void,
    }) => void;

    onButtonPress?: (idx: number, ranges: TextRange[]) => void;
    onKeyPress?: (key: string, modkeys: string[], ranges: TextRange[]) => void;
    onClickSpan?: (span_id: any, modkeys: string[]) => void;
    onMouseEnterSpan?: (span_id: any, modkeys: string[]) => void;
    onMouseLeaveSpan?: (span_id: any, modkeys: string[]) => void;
    onMouseSelect?: (modkeys: string[], ranges: TextRange[]) => void
}) => {
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