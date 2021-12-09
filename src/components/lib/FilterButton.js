import React from 'react';
import { Button, Popover, Row, Col } from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import { Primary } from './FilterPanelExt';
import {
    makeToServer, extractValuesFromInitFilters,
    createFilterItem, normalizeInputValue
} from './FilterUtils';


const alignFilterList = (filters) => {
    let curr = 0;
    while (curr < filters.length) {
        let c = filters[curr];
        if (typeof c.type != "string") {
            filters.splice(curr, 0, "");
        }
        curr += 2;
    }
}

const flatFilterList = (propfilters) => {
    let filters = [];
    React.Children.map(propfilters.props.children, c => {
        if (Primary.name == c.type.name) {
            React.Children.map(c.props.children, cc => filters.push(cc));
        } else {
            filters.push(c);
        }
    });
    return filters;
}


export const FilterButton = (props) => {
    const [config] = React.useState(extractValuesFromInitFilters(props.initValues));
    const [refs] = React.useState({});
    var [visiblePopover, setVisiblePopover] = React.useState(false);

    const changed = React.useCallback((key, val) => {
        val = normalizeInputValue(val);
        config[key] = val;
    }, [config])

    const handleOkClick = () => {
        props.onChange(makeToServer(config));
        setVisiblePopover(false);
    }
    // собираем в плоский массив
    const filters = flatFilterList(props.filters);
    const disabled = filters.length == 0;
    // выравниваем массив по парам label:input
    alignFilterList(filters);
    // создание компонентов
    let rows = [];
    let curr = 0;
    while (curr < filters.length) {
        const key = filters[curr + 1].key;
        const item = createFilterItem(filters[curr + 1], refs, props.initValues, changed);
        rows.push(<Row key={"row" + key} gutter={[8, 0]} style={{ marginBottom: 16 }}>
            <Col className="textcol" span={filters[curr] ? 6 : 0}>{filters[curr] ? React.cloneElement(filters[curr], {}) : ""}</Col>
            <Col span={18}>{item}</Col>
        </Row>);
        curr += 2;
    }
    rows.push(<Row key="_rowTotal">
        <Col span={6}></Col>
        <Col span={18}>{<Button type="primary" style={{ float: "right", marginTop: 8 }} onClick={handleOkClick}>Ok</Button>}</Col>
    </Row>);

    return disabled ? null : <Popover visible={visiblePopover}
        onVisibleChange={(value) => setVisiblePopover(value)}
        overlayStyle={{
            width: "99vw"
        }}
        placement="bottom"
        arrowPointAtCenter
        title={"Фильтр"}
        content={<>{rows.map(r => r)}</>} trigger="click">
        <Button icon={<FilterOutlined />} className="mobile-menu-button" onClick={() => {
        }} />
    </Popover>
};

