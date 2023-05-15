import React, {useCallback} from "react";
import {useSelector} from "react-redux";
import Loading from "../../components/Loading";
import {cachedReconcile} from "../../utils";
import TextComponent from "../../components/TextComponent";
import ToolBar, {Button} from "../../components/ToolBar";

import './index.css';
import TableComponent from "../../components/TableComponent";
import MetannoManager from "../../manager";

class VerticalLayout {
    widgets: any[];
    protected actionWrapper: any;

    button (text, color, on_click) {
        assign: if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__];
                if (arguments.length === 4) break assign; on_click = __allkwargs0__.on_click
                if (arguments.length === 3) break assign; color = __allkwargs0__.color
                if (arguments.length === 2) break assign; text = __allkwargs0__.text
		    }
        }
        const actions = {};
        this.widgets.push(
            <div className="metanno-layout-row">
                <Button
                    onClick={this.actionWrapper(on_click)}
                    color={color}
                    text={text}
                />
            </div>
        )
        return actions;
    }

    header (text) {
        assign: if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__];
                if (arguments.length === 2) break assign; text = __allkwargs0__.text
		    }
        }
        const actions = {};
        this.widgets.push(
            <h1>{text}</h1>
        )
        return actions;
    }

    text (text) {
        assign: if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__];
                if (arguments.length === 2) break assign; text = __allkwargs0__.text
		    }
        }
        const actions = {};
        this.widgets.push(
            <p>{text}</p>
        )
        return actions;
    }
}

class HorizontalBarLayout {
    widgets: any[];
    private actionWrapper: any;

    constructor(actionWrapper) {
        this.widgets = [];
        this.actionWrapper = actionWrapper;
    }

    button (text, color, on_click) {
        assign: if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__];
                if (arguments.length === 4) break assign; on_click = __allkwargs0__.on_click
                if (arguments.length === 3) break assign; color = __allkwargs0__.color
                if (arguments.length === 2) break assign; text = __allkwargs0__.text
		    }
        }
        const actions = {};
        this.widgets.push(
            <Button onClick={this.actionWrapper(on_click)} color={color} text={text}/>
        )
        return actions;
    }
}

class SideBarLayout extends VerticalLayout {
    constructor(actionWrapper) {
        super()
        this.actionWrapper = actionWrapper;
        this.widgets = [];
    }

    button (text, color, on_click) {
        assign: if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__];
                if (arguments.length === 4) break assign; on_click = __allkwargs0__.on_click
                if (arguments.length === 3) break assign; color = __allkwargs0__.color
                if (arguments.length === 2) break assign; text = __allkwargs0__.text
		    }
        }
        const actions = {};
        this.widgets.push(
            <Button onClick={this.actionWrapper(on_click)} color={color} text={text}/>
        )
        return actions;
    }

    header (text) {
        const actions = {};
        this.widgets.push(
            <h1>{text}</h1>
        )
        return actions;
    }
}

class Layout extends VerticalLayout {
    private topbar: HorizontalBarLayout;
    private bottombar: HorizontalBarLayout;
    private sidebar: SideBarLayout;

    constructor(actionWrapper) {
        super();
        this.widgets = [];
        this.actionWrapper = actionWrapper
        this.topbar = new HorizontalBarLayout(actionWrapper);
        this.bottombar = new HorizontalBarLayout(actionWrapper);
        this.sidebar = new SideBarLayout(actionWrapper);
    }

    text_annotator (
                          spans,
                          text,
                          styles,
                          mouse_selection,
                          on_key_press,
                          on_click_span,
                          on_mouse_enter_span,
                          on_mouse_leave_span,
                          on_mouse_select,
                      ) {
        assign: if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__];
                if (arguments.length === 10) break assign; on_mouse_select = __allkwargs0__.on_mouse_select
                if (arguments.length === 9) break assign; on_mouse_leave_span = __allkwargs0__.on_mouse_leave_span
                if (arguments.length === 8) break assign; on_mouse_enter_span = __allkwargs0__.on_mouse_enter_span
                if (arguments.length === 7) break assign; on_click_span = __allkwargs0__.on_click_span
                if (arguments.length === 6) break assign; on_key_press = __allkwargs0__.on_key_press
                if (arguments.length === 5) break assign; mouse_selection = __allkwargs0__.mouse_selection
                if (arguments.length === 4) break assign; styles = __allkwargs0__.styles
                if (arguments.length === 3) break assign; text = __allkwargs0__.text
                if (arguments.length === 2) break assign; spans = __allkwargs0__.spans
		    }
        }
        const actions = {};
        this.widgets.push(
            <div className="metanno-layout-row">
                <TextComponent
                    actions={actions}

                    spans={spans}
                    text={text}
                    styles={styles}
                    mouseSelection={mouse_selection}

                    onKeyPress={this.actionWrapper(on_key_press)}
                    onClickSpan={this.actionWrapper(on_click_span)}
                    onMouseEnterSpan={this.actionWrapper(on_mouse_enter_span)}
                    onMouseLeaveSpan={this.actionWrapper(on_mouse_leave_span)}
                    onMouseSelect={this.actionWrapper(on_mouse_select)}
                />
            </div>
        )
        return actions;
    }

    table_annotator (
                           rows,
                           columns,
                           highlighted_rows,
                           filters,
                           row_key,
                           input_value,
                           suggestions,
                           position,
                           on_key_press,
                           on_mouse_enter_row,
                           on_mouse_leave_row,
                           on_filters_change,
                           on_position_change,
                           on_click_cell_content,
                           on_cell_change,
                           on_input_change,
                       ) {
        assign: if (arguments.length) {
			var __ilastarg0__ = arguments.length - 1;
			if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
				var __allkwargs0__ = arguments [__ilastarg0__];
                if (arguments.length === 17) break assign; on_input_change = __allkwargs0__.on_input_change
                if (arguments.length === 16) break assign; on_cell_change = __allkwargs0__.on_cell_change
                if (arguments.length === 15) break assign; on_click_cell_content = __allkwargs0__.on_click_cell_content
                if (arguments.length === 14) break assign; on_position_change = __allkwargs0__.on_position_change
                if (arguments.length === 13) break assign; on_filters_change = __allkwargs0__.on_filters_change
                if (arguments.length === 12) break assign; on_mouse_leave_row = __allkwargs0__.on_mouse_leave_row
                if (arguments.length === 11) break assign; on_mouse_enter_row = __allkwargs0__.on_mouse_enter_row
                if (arguments.length === 10) break assign; on_key_press = __allkwargs0__.on_key_press
                if (arguments.length === 9) break assign; position = __allkwargs0__.position
                if (arguments.length === 8) break assign; suggestions = __allkwargs0__.suggestions
                if (arguments.length === 7) break assign; input_value = __allkwargs0__.input_value
                if (arguments.length === 6) break assign; row_key = __allkwargs0__.row_key
                if (arguments.length === 5) break assign; filters = __allkwargs0__.filters
                if (arguments.length === 4) break assign; highlighted_rows = __allkwargs0__.highlighted_rows
                if (arguments.length === 3) break assign; columns = __allkwargs0__.columns
                if (arguments.length === 2) break assign; rows = __allkwargs0__.rows
		    }
        }
        const actions = {};
        this.widgets.push(
            <div style={{flexGrow: 1}}>
                <TableComponent
                    actions={actions}

                    rows={rows}
                    highlightedRows={highlighted_rows}
                    columns={columns}
                    filters={filters}
                    rowKey={row_key}
                    inputValue={input_value}
                    suggestions={suggestions}
                    position={position}

                    onKeyPress={this.actionWrapper(on_key_press)}
                    onMouseEnterRow={this.actionWrapper(on_mouse_enter_row)}
                    onMouseLeaveRow={this.actionWrapper(on_mouse_leave_row)}
                    onFiltersChange={this.actionWrapper(on_filters_change)}
                    onPositionChange={this.actionWrapper(on_position_change)}
                    onClickCellContent={this.actionWrapper(on_click_cell_content)}
                    onCellChange={this.actionWrapper(on_cell_change)}
                    onInputChange={this.actionWrapper(on_input_change)}
                />
            </div>
        )
        return actions;
    }

    render() {
        return <div className="metanno-layout-container">
            {this.topbar.widgets.length > 0 ? <ToolBar side="top">{this.topbar.widgets}</ToolBar> : null}
            <div className="metanno-layout-container-middle jp-RenderedHTMLCommon jp-RenderedMarkdown">
                {this.widgets}
            </div>
            {this.bottombar.widgets.length > 0 ? <ToolBar side="bottom">{this.bottombar.widgets}</ToolBar> : null}
        </div>
    }
}

const MetannoContainer = ({
                              manager,
                              view,

                              ...props
                          }: { manager: MetannoManager, view: any }) => {
    return useSelector(useCallback(cachedReconcile(
            (state: object) => {
                if (!state) {
                    return (
                        <div className={"metanno-layout-container is-loading"}>
                            <Loading/>
                        </div>
                    );
                }

                view.props = props;
                const panel = new Layout(manager.wrapAction);

                // Ugly hack to allow reconciling React elements
                const oldFreeze = Object.freeze;
                // @ts-ignore
                Object.freeze = () => {
                };
                try {
                    view(panel);
                } catch (e) {
                    return <p>manager.handleException(e)</p>;
                }
                Object.freeze = oldFreeze;
                return panel.render();
            }),
        [view],
    ));
};

export default MetannoContainer;