import React from 'react';
import PropTypes from 'prop-types';
import { TreeSelect } from 'antd';
import { MSG_REQUEST_ERROR } from './Const';
import { notification } from 'antd';
import requestToAPI from "./Request";


const findTreeData = (root, id) => {
    if (root.value == id) return root;
    const result = root.children.find(c => !!findTreeData(c, id));
    if (result) return result;
    return;
}

const DataTreeSelect = React.forwardRef((props, ref) => {
    const { uri, rootElement, defaultValue, value, onChange, ...treeprops } = props;
    let defaultValueItem;

    const [data, setData] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [state] = React.useState({});


    const refreshData = React.useCallback(() => {
        setLoading(true);
        requestToAPI.post(props.uri, {})
            .then(response => {
                setLoading(false);
                setData(response);
            })
            .catch(error => {
                setLoading(false);
                // в случае ошибки
                setData([]);
                notification.error({
                    message: MSG_REQUEST_ERROR,
                    description: error.message
                })

            })
        // eslint-disable-next-line
    }, [props.uri])

    const dropdownVisibleChange = React.useCallback((open) => {
        state.open = open;
        if (open && data === null) {
            setData([]);
            refreshData();
        }
    }, [data, refreshData, state])

    const mergedValue = defaultValue ?? value;
    if (mergedValue) {
        if (data === null) {
            if (mergedValue instanceof Object && mergedValue['value'] != -1) {
                defaultValueItem = { value: mergedValue['value'], title: mergedValue['title'] };
            } else {
                defaultValueItem = rootElement
            }
        } else {
            if (mergedValue instanceof Object) {
                defaultValueItem = mergedValue;
            } else {
                defaultValueItem = { value: mergedValue }
            }
        }
    }

    const handleChange = React.useCallback((val, label) => {
        if (onChange) {
            const obj = findTreeData(data[0], val)
            onChange({ value: val }, obj);
        }
    }, [data, onChange])


    return <TreeSelect
        locale={{
            emptyText: "Нет данных"
        }}
        ref={ref}
        onDropdownVisibleChange={dropdownVisibleChange}
        loading={loading}
        treeData={data || (defaultValueItem ? [defaultValueItem] : [rootElement])}
        treeDefaultExpandedKeys={defaultValueItem ? [defaultValueItem.value] : undefined}
        defaultValue={defaultValueItem ? defaultValueItem.value : undefined}
        onChange={handleChange}
        {...treeprops}
    />

});

DataTreeSelect.propTypes = {
    uri: PropTypes.string.isRequired,
    allowClear: PropTypes.bool,
    rootElement: PropTypes.object,
    defaultValue: PropTypes.oneOfType([PropTypes.object, PropTypes.number])
}

DataTreeSelect.defaultProps = {
    style: { width: "100%" },
    showSearch: true,
    treeNodeFilterProp: "title"
}

DataTreeSelect.Subject = React.forwardRef((props, ref) => {
    const root = { title: "Объекты аналитического учета", value: -1 };
    return <DataTreeSelect ref={ref} uri={"refbooks/subject/subject/gettree"} rootElement={root} {...props} />
});

export default DataTreeSelect;
