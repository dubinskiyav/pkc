import React from 'react';
import { SyncOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';
import { Select } from 'antd';
import { MSG_REQUEST_ERROR, CasheTypes } from './Const';
import { generateHash } from './Utils';
import { notification, Menu } from 'antd';
import requestToAPI from "./Request";

const { Option } = Select;

const PropertyesPopupMenu = ({ record, columns, visible, x, y, selectInterface, setPopupState }) => visible &&
    <div className="ant-popover ant-popover-inner" style={{ left: `${x}px`, top: `${y}px`, position: "fixed" }}>
        <Menu>
            <Menu.Item key='1' icon={<SyncOutlined />} onClick={() => { selectInterface.refreshData(true); setPopupState({ visible: false }) }}>Обновить</Menu.Item>
        </Menu>
    </div>


const MultiDataSelect = React.forwardRef((props, ref) => {
    const [data, setData] = React.useState(props.data ?? null);
    const [loading, setLoading] = React.useState(false);
    const [dropDownFlag, setDropDownFlag] = React.useState(false);
    const [popupState, setPopupState] = React.useState({
        visible: false,
        x: 0, y: 0
    });

    if (props.data && props.data !== data) {
        setData(props.data);
    }

    let valueNameFunc = props.displayValueName;
    if (typeof props.displayValueName === 'string') {
        valueNameFunc = (r) => r ? r[props.displayValueName] : "";
    }

    const genCasheKey = React.useCallback((uri, params) => {
        return "DataSelect." +
            (props.componentName ? props.componentName + "." : "?.") +
            generateHash(uri + (params ? "#" + JSON.stringify(params) : ""));
    }, [props.componentName]);

    const getResponseFromCashe = React.useCallback((key) => {
        const storage = CasheTypes.getStorage(props.casheType);
        const sdata = storage.getItem(key);
        return sdata ? JSON.parse(sdata) : undefined;
    }, [props.casheType]);

    const saveResponseToCashe = React.useCallback((key, data) => {
        const storage = CasheTypes.getStorage(props.casheType);
        storage.setItem(key, JSON.stringify(data));
    }, [props.casheType]);

    const refreshData = React.useCallback((nocashe) => {
        // извлечение из кэша
        if (props.casheType != CasheTypes.None && !nocashe) {
            let response = getResponseFromCashe(genCasheKey(props.uri, props.params))
            if (response) {
                setData(response);
                return;
            }
        }
        setLoading(true);
        requestToAPI.post(props.uri, props.params)
            .then(response => {
                setLoading(false);
                response = response.result;
                // помещение в кэш
                if (response && props.casheType != CasheTypes.None) {
                    saveResponseToCashe(genCasheKey(props.uri, props.params), response)
                }
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
        if (open && data === null) {
            setData([]);
            refreshData();
        }
    }, [data, refreshData])

    let options;

    if (props.value && data === null) {
        // options = <Option key={props.value}>{props.displayValue}</Option>;
        options = props.value.map(d => <Option key={d.value.toString()}>{d.title}</Option>);
    }

    if (data) {
        options = data.map(d => <Option key={d[props.valueName]}>{valueNameFunc(d)}</Option>);
    }
    const handleChange = React.useCallback((val) => {
        // setDropDownFlag(false);
        if (props.onChange && data) {
            let valueObject = [];
            val.forEach(element => {
                const disp = valueNameFunc(data.find(d => d[props.valueName] == element));
                valueObject.push({ value: parseInt(element), title: disp });
            });
            props.onChange(valueObject);
        }
    }, [data, props, valueNameFunc])

    const handleKeyDown = React.useCallback((ev) => {
        if (dropDownFlag) ev.stopPropagation();

        if (ev.keyCode >= 37 && ev.keyCode <= 40) {
            setDropDownFlag(true);
        };
        if (ev.keyCode == 27 && dropDownFlag) {
            setDropDownFlag(false);
            ev.preventDefault();
        }
        if (ev.keyCode == 13) {
            setDropDownFlag(false);
        }

    }, [dropDownFlag]);

    return (<div>
        <Select {...props.SelectProps}
            open={dropDownFlag}
            locale={{
                emptyText: "Нет данных"
            }}
            allowClear={props.allowClear}
            ref={ref}
            key={props.key}
            loading={loading}
            defaultValue={props.value ? props.value.map(el => el.value.toString()) : []}
            onDropdownVisibleChange={dropdownVisibleChange}
            onChange={handleChange}
            style={{ ...props.style }}
            onKeyDown={handleKeyDown}
            onContextMenu={event => {
                // system menu
                if (event.ctrlKey) {
                    return
                }
                event.preventDefault();
                event.stopPropagation();

                document.addEventListener(`click`, function onClickOutside() {
                    setPopupState({ visible: false })
                    document.removeEventListener(`click`, onClickOutside)
                })
                setDropDownFlag(false);
                ref.current.focus();
                setPopupState({
                    visible: true,
                    x: event.clientX,
                    y: event.clientY
                })
            }}
            onClick={event => {
                if (!dropDownFlag) {
                    setPopupState({ visible: false })
                    setDropDownFlag(true);

                    document.addEventListener(`click`, function onClickOutside(event) {
                        for (const i in event.path) {
                            if (event.path[i].classList && event.path[i].classList.contains("ant-select-item")) {                                
                                return;
                            }                            
                        }
                        setDropDownFlag(false);
                        document.removeEventListener(`click`, onClickOutside)
                    })
                    event.stopPropagation();
                } else {
                    setDropDownFlag(false);
                    event.stopPropagation();
                }
            }}
            onBlur={() => {
                setDropDownFlag(false);
                setPopupState({ visible: false });
            }}
            mode="multiple">
            {options}
        </Select>
        <PropertyesPopupMenu {...popupState} selectInterface={{ refreshData: refreshData }} setPopupState={setPopupState} />
    </div>
    )
})

MultiDataSelect.propTypes = {
    params: PropTypes.object,
    componentName: PropTypes.string,
    SelectProps: PropTypes.object,
    valueName: PropTypes.string,  // default "id"
    displayValueName: PropTypes.oneOfType([PropTypes.string, PropTypes.func]).isRequired,
    displayValue: PropTypes.string,
    uri: PropTypes.string,
    allowClear: PropTypes.bool,
    value: PropTypes.object,
    casheType: PropTypes.oneOf([CasheTypes.None, CasheTypes.SessionStorage, CasheTypes.LocalStorage]),
    data: PropTypes.array
}

MultiDataSelect.defaultProps = {
    valueName: "id",
    casheType: CasheTypes.None,
    style: { width: 240 }
}

export default MultiDataSelect;