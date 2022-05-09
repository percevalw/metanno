import React, {useCallback, useLayoutEffect, useRef} from 'react';
import {useDrag, useDrop} from 'react-dnd';

import {HeaderRendererProps} from 'react-data-grid';

function useCombinedRefs(...refs) {
    return useCallback(handle => {
        for (const ref of refs) {
            if (typeof ref === 'function') {
                ref(handle);
            } else if (ref !== null && 'current' in ref) {
                ref.current = handle;
            }
        }
    }, refs);
}


export function useFocusRef<T extends HTMLOrSVGElement>(isSelected: boolean) {
    const ref = useRef<T>(null);

    useLayoutEffect(() => {
        if (!isSelected) return;
        ref.current?.focus({preventScroll: true});
    }, [isSelected]);

    return {
        ref,
        tabIndex: isSelected ? 0 : -1
    };
}


function HeaderRenderer<R, SR, T extends HTMLOrSVGElement>({
                                                               isCellSelected,
                                                               column,
                                                               children,
                                                               onColumnsReorder,
                                                           }: HeaderRendererProps<R, SR> & {
    onColumnsReorder: (source: string, target: string) => void,
    children?: (args: {
        ref: React.RefObject<T>;
        tabIndex: number;
    }) => React.ReactElement;
}) {
    const {ref, tabIndex} = useFocusRef<T>(isCellSelected);


    const [{isDragging}, drag] = useDrag({
        item: {key: column.key, type: 'COLUMN_DRAG'},
        collect: monitor => ({
            isDragging: !!monitor.isDragging()
        })
    });

    const [{isOver}, drop] = useDrop({
        accept: 'COLUMN_DRAG',
        // @ts-ignore
        drop({key, type}) {
            if (type === 'COLUMN_DRAG') {
                onColumnsReorder(key, column.key);
            }
        },
        collect: monitor => ({
            isOver: !!monitor.isOver(),
            canDrop: !!monitor.canDrop()
        })
    });

    return (
        <div
            ref={useCombinedRefs(drag, drop)}
            style={{
                opacity: isDragging ? 0.5 : 1,
                backgroundColor: isOver ? '#ececec' : 'transparent',
                cursor: 'move'
            }}>
            <div>{column.name}</div>
            {children ? <div> {children({ref, tabIndex})} </div> : null}
        </div>
    );
}

export default HeaderRenderer;