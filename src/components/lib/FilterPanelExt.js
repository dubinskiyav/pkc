import React from 'react';
import { Space, Collapse } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';
import { DesktopOrTabletScreen } from './Responsive';
import {
    makeToServer,
    extractValuesFromInitFilters, createFilterItem, normalizeInputValue,
    resetToInitValues
} from './FilterUtils';

const { Panel } = Collapse;


export const Primary = (props) => {
    return <React.Fragment>{props.children}</React.Fragment>
}

export const FilterPanelExt = (props) => {
    const [config] = React.useState(extractValuesFromInitFilters(props.initValues));
    const [refs] = React.useState({});
    // строгая перезагрузка с размотированием компонент
    const [hardRefresh, setHardRefresh] = React.useState(false);
    React.useEffect(() => { setHardRefresh(false) }, [hardRefresh]);

    const changed = React.useCallback((key, val) => {
        val = normalizeInputValue(val);
        config[key] = val;
        props.onChange(makeToServer(config));
    }, [config, props])

    const genExtra = React.useCallback((refs, initValues) => (
        <CloseCircleOutlined style={{ dispay: "inline" }} onClick={event => {
            event.stopPropagation();
            resetToInitValues(refs, config, initValues);
            // обновление
            props.onChange(makeToServer(config));
            // необходимо размонтировать, 
            // чтобы default значения у компонент вступили в действия 
            setHardRefresh(true);
        }} />
    ), [config, props]);

    const createInnerItems = React.useCallback((items) => {
        return (
            <>
                {items.map((c, index) => {
                    if(c.type == Space) {
                        const { children, ...otherProps } = c.props;
                        if (children) {
                            otherProps.children = createInnerItems(children);
                        }
                        otherProps.key = index;
                        return React.createElement(Space, otherProps);
                    } else if (typeof c.type != "string") { // отсекаем не компоненты, для тегов span, div и т.д. это не нужно
                        return createFilterItem(c, refs, props.initValues, changed);
                    } else {
                        return React.cloneElement(c, { key: "" });
                    }
                })}
            </>
        )
    }, [props, refs, changed]);

    const buildPanel = React.useCallback((filters) => {
        return <Space onClick={ev => ev.stopPropagation()} wrap>
            {filters
                .map((c, index) => {
                    if(c.type == Space) {
                        const { children, ...otherProps } = c.props;
                        if (children) {
                            otherProps.children = createInnerItems(children);
                        }
                        otherProps.key = index;
                        return React.createElement(Space, otherProps);
                    } else if (typeof c.type != "string") { // отсекаем не компоненты, для тегов span, div и т.д. это не нужно
                        return createFilterItem(c, refs, props.initValues, changed);
                    } else {
                        return React.cloneElement(c, { key: "" });
                    }
                })}
        </Space>
    }, [props, refs, changed, createInnerItems]);

    let primaryFilters = [];
    let otherFilters = [];
    React.Children.map(props.children.props.children, c => {
        if (Primary.name == c.type.name) {
            React.Children.map(c.props.children, cc => primaryFilters.push(cc));
        } else {
            otherFilters.push(c);
        }
    });
    // если нет primary filters, а только other filters,
    // other становятся primary
    if (primaryFilters.length == 0 && otherFilters.length > 0) {
        primaryFilters = otherFilters;
        otherFilters = [];
    }

    const collapsible = otherFilters.length == 0 ? "header" : "";

    if (primaryFilters.length === 0 && otherFilters.length === 0)
        return null
    else
        return <DesktopOrTabletScreen>
            <Collapse expandIconPosition={"right"} collapsible={collapsible} bordered={false}>
                {!hardRefresh ?
                    <Panel header={buildPanel(primaryFilters)}
                        extra={genExtra(refs, props.initValues)}
                        showArrow={otherFilters.length > 0}
                        className={otherFilters.length > 0 ? "pad64" : null}>
                        <Space className="filter-panel">
                            {buildPanel(otherFilters)}
                        </Space>
                    </Panel>
                    : ""}
            </Collapse>
        </DesktopOrTabletScreen>

}

