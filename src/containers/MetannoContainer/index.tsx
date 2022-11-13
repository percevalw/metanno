import React, {useCallback, useMemo} from "react";
import {useSelector} from "react-redux";
import Loading from "../../components/Loading";
import {cachedReconcile} from "../../utils";

const makeComponent = (cls) => {
    return ({
        id,
        stateId,
        className,

        ...props
    }) => {
        const app = useMemo(() => {
            return cls(props);
        }, []);
        return useSelector(useCallback(cachedReconcile(
            (state: object) => {
                if (app && (!app.NEED_STATE || state && state[stateId])) {
                    app.props = props;
                    return app.render();
                }

                return (
                    <div className={"container is-loading"}>
                        <Loading/>
                    </div>
                );
            }),
            [id, app],
        ));
    }
};

export default makeComponent;