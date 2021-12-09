import React from 'react';
import { Button, notification, Tooltip } from 'antd';
import { CheckOutlined, PlusOutlined, DeleteOutlined, SyncOutlined, FilterOutlined } from '@ant-design/icons';
import moment from 'moment';
import { DEFAULT_DATE_FORMAT, DEFAULT_DATETIME_FORMAT, MSG_REQUEST_ERROR } from "./Const";
// import { ReactComponent as Status } from '../../resources/images/status.svg';
import Status from "./Status";
import requestToAPI from './Request';

export const buildSortByDefaultFromColumns = (columns) => {
    return columns
        .filter(c => c.sorter && c.defaultSortOrder)
        .map(c => { return { field: c.dataIndex, order: c.defaultSortOrder } });
}

export const drawBoolIcon = (data, _record, _index, value) => {
    if (value !== undefined) {
        return data === value ? <div className="cellContentCentered"><CheckOutlined /></div> : "";
    } else {
        return data ? <div className="cellContentCentered"><CheckOutlined /></div> : "";
    }
};
export const drawDate = (data) => data ? moment(data).format(DEFAULT_DATE_FORMAT) : "";
export const drawDateAndTime = (data) => data ? moment(data).format(DEFAULT_DATETIME_FORMAT) : "";

export const drawStatus = (color, record) => {
    if (typeof (color) !== "number" && record) {
        color = record.documentTransitColor
    }
    return typeof (color) === "number" ? (
        <div className="cellContentCentered">
            <Tooltip title={record ? record.documentTransitName : ""} mouseLeaveDelay={0}>
                <div className="statusDiv">
                    <Status color={"#" + (+color).toString(16).padStart(6, '0')} />
                </div>
            </Tooltip>
        </div >
    ) : "";
}

export const drawFloat = (data, record, _, digits) => {
    digits = typeof(digits) === "number" ? digits : 2;
    const value = data ? parseInt(data).toLocaleString() + data.toFixed(digits).slice(data.toFixed(digits).indexOf('.')) : "";
    if (record) {
        return <div className="cellContentRight">{value}</div>
    } else  {
        return value;
    }
}

export const drawInt = (data, record) => {
    const value = ((typeof(data) === "number") || data) ? parseInt(data).toLocaleString() : "";
    if (record) {
        return <div className="cellContentRight">{value}</div>
    } else  {
        return value;
    }
}

export const intFlagFromCheckboxEvent = (event) => event.target.checked ? 1 : 0;

export const buildSortFromColumns = (sorts) => {
    if (!(sorts instanceof Array)) sorts = [sorts];
    // сортируем по column.sorter.multiple
    return sorts
        .filter(c => { return c.column && c.column.sortOrder !== null })
        .sort((c1, c2) => c1.column.sorter.multiple - c2.column.sorter.multiple)
        .map(c => { return { field: c.field, order: c.order } });
}

export const rebuildColumns = (columns) => {
    columns.filter(c => c.sorter)
        .forEach((c, idx) => {
            let compare;
            if (typeof c.sorter === 'function') {
                compare = c.sorter;
            } else if (c.sorter && c.sorter.compare) {
                compare = c.sorter.compare;
            }
            c.sorter = {
                multiple: idx
            }
            if (compare) {
                c.sorter.compare = compare;
            }
        });
}


export const resetSortColumns = (columns) => {
    columns.filter(c => c.sorter)
        .forEach((c, _idx) => {
            c.sortOrder = null;
        });
}


export const parseCalId = (calId) => {
    const scal = "" + calId;
    return {
        year: parseInt(scal.substring(0, 4)),
        month: parseInt(scal.substring(4, 6)) - 1, // zero based
        day: parseInt(scal.substring(6, 9))
    }
}

export const converToCalId = (moment) => {
    return moment ? '' + moment.year() + moment.format("MM") + moment.format("DD") : undefined;
}

export const assignArrayOfObject = (array) => {
    return Array.from(array, v => Object.assign({}, v))
}

const crypto = require('crypto');

export const generateHash = (data) => {
    return crypto.createHmac('sha256', "xxx")
        .update(data)
        .digest('hex');
}

export const debounce = (func, wait, immediate) => {
    var timeout;
    return function executedFunction() {
        const context = this;
        const args = arguments;
        const later = function () {
            if (!immediate) func.apply(context, args);
        };

        const callNow = immediate && !timeout;

        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }

        timeout = setTimeout(later, wait);

        if (callNow) func.apply(context, args);
    };
}

export const groupBy = (items, key) => {
    return items.reduce((groups, curr) => {
        let g = groups[curr[key]];
        if (!g) {
            g = [curr];
            groups[curr[key]] = g;
        } else {
            g.push(curr);
        }
        return groups;
    }, {});
}

export const buildURL = (contour, module, entity) => {
    return (contour.name ? contour.name.toLowerCase() + "/" : "") +
        (module.name ? module.name.toLowerCase() + "/" : "") +
        entity.toLowerCase();
}

export const genDefParamsForGetAllList = (name) => {
    return {
        "pagination": {
            "current": 1,
            "pageSize": -1
        },
        "sort": [
            {
                "field": name,
                "order": "ascend"
            }
        ]
    }
}

// создание кнопок с icon для мобильной версии
export const buildMobileButtons = (buttons, modal = false) => {
    if (!buttons) return;
    const className = modal ? "mobile-menu-button-color" : "";

    let mobilebtns = buttons.map(b => {
        let icon = b.props.icon;
        // icon для стандартных кнопок
        if (!icon) {
            switch (b.key) {
                case "add":
                    icon = <PlusOutlined />;
                    break;
                case "del":
                    icon = <DeleteOutlined />
                    break;
                case "refresh":
                    icon = <SyncOutlined />
                    break;
                case "filter":
                    icon = <FilterOutlined />
                    break;
                default:
                    break;
            }
        }
        if (icon) {
            if (b.key == "more") {
                return React.cloneElement(b, { key: b.key, className: "more-menu-button" });
            }
            if (b.key == "filter") {
                return React.cloneElement(b, { key: b.key });
            }
            return <Button disabled={b.props.disabled} onClick={b.props.onClick} key={b.key} icon={icon} className={"mobile-menu-button " + className} />
        } else {
            return <Button disabled={b.props.disabled} onClick={b.props.onClick} key={b.key} className={"mobile-menu-button " + className + " text_menu_button"}>{b.props.children}</Button>
        }
    });

    return <div>{mobilebtns}</div>;
}

export const setItemInLocalStorage = (key, value) => {
    localStorage.setItem(key + "?" + (sessionStorage.getItem("user.login") ?? localStorage.getItem("user.login")), value);
}

export const getItemFromLocalStorage = (key) => {
    return localStorage.getItem(key + "?" + (sessionStorage.getItem("user.login") ?? localStorage.getItem("user.login")));
}

const capClassTypeList = {};

export const getCapClassTypeName = (capClassTypeId) => {
    if (Object.keys(capClassTypeList).length === 0) {
        const list = JSON.parse(getItemFromLocalStorage("capClassTypeList")) ?? [];
        list.forEach(value => capClassTypeList[value.capClassTypeId] = value.capClassTypeName);
    }

    return capClassTypeList[capClassTypeId] ?? "";
}

export const refreshStatusList = (callback) => {
    requestToAPI.post("system/document/getstatuslist")
        .then(response => {
            setItemInLocalStorage("documentTransit", JSON.stringify(response));
            if (callback) callback(response);
        })
        .catch((error) => {
            notification.error({
                message: MSG_REQUEST_ERROR,
                description: error.message
            })
        })
}

const getValue = (value, field) => {
    return value[field] ?? ((value && value.record) ? value.record[field] : undefined);
}

export const getSumField = (data, field) => {
    let sum = data.length > 0 ? 0 : undefined;
    data.forEach(value => sum += getValue(value, field) ?? 0);
    return sum;
};

export const getScalarSumField = (data, fieldA, fieldB) => {
    let sum = data.length > 0 ? 0 : undefined;
    data.forEach(value => sum += (getValue(value, fieldA) ?? 0) * (getValue(value, fieldB) ?? 0));
    return sum;
}