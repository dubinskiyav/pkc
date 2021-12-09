import React from 'react';
import PropTypes from 'prop-types';
import { Table, Tag, notification, Menu, Popover } from 'antd';
import { ExportOutlined, CopyOutlined, MoreOutlined } from '@ant-design/icons';
import {
    buildSortByDefaultFromColumns, buildSortFromColumns,
    getScalarSumField,
    getSumField,
    rebuildColumns, resetSortColumns
} from "./Utils";
import { confirm, inputValue } from "./Dialogs";
import { format } from 'react-string-format';
import {
    MIN_INT,
    MSG_CONFIRM_DELETE, MSG_SUCCESS_COPY_TO_CLIPBOARD
} from "./Const";
import { showPropertyDialog } from "./stddialogs/PropertyDialog"
import { extractValuesFromInitFilters } from './FilterUtils'
import { isMobile } from './Responsive';
import { MemoryDataSet } from "./MemoryDataSet";
import { EditableCell, EditableRow } from './EditableComponents';

const { SubMenu } = Menu;

// кол-во записей на страницу, по умолчанию
const DEFAULT_PAGE_SIZE = 10

const SORT_DIRECTIONS = ['ascend', 'descend']

function nextSortDirection(current) {
    if (!current) {
        return SORT_DIRECTIONS[0];
    }
    return SORT_DIRECTIONS[SORT_DIRECTIONS.indexOf(current) + 1];
}

const getTableTD = (elem) => {
    while (elem.nodeName.toUpperCase() != "TD") {
        elem = elem.parentNode;
    }
    return elem;
}

const PropertyesPopupMenu = ({ record, columns, visible, x, y, tableInterface }) => visible &&
    <div className="ant-popover ant-popover-inner" style={{ left: `${x}px`, top: `${y}px`, position: "fixed" }}>
        <Menu>
            <SubMenu key={3} icon={<CopyOutlined />} title="Копировать">
                <Menu.Item key='3.1' onClick={() => { copyRecords([record], columns) }}>Текущую запись</Menu.Item>
                <Menu.Item key='3.2' onClick={() => { copyRecords(tableInterface.getSelectedRecords(), columns) }}>Отмеченные записи</Menu.Item>
            </SubMenu>
            <SubMenu key={2} icon={<ExportOutlined />} title="Экспорт">
                <Menu.Item key="2.1" onClick={() => { tableInterface.exportData(1) }}>Экспорт в CSV</Menu.Item>
                <Menu.Item key="2.2" onClick={() => { tableInterface.exportData(2) }}>Экспорт в Excel</Menu.Item>
            </SubMenu>
            <Menu.Divider />
            <Menu.Item key={1} onClick={() => { showPropertyDialog(record, columns, tableInterface) }}>Свойства...</Menu.Item>
        </Menu>
    </div>

function copyRecords(records, columns) {
    if (records.length > 0) {
        let fields = columns
            .filter(c => !c.serv)
            .map(c => c.dataIndex)
        const sbuf = records
            .map(r => fields.map(k => r[k]).join(" "))
            .join("\r\n");
        navigator.clipboard.writeText(sbuf).then(function () {
            notification.success({
                message: format(MSG_SUCCESS_COPY_TO_CLIPBOARD, records.length)
            })
        });
    }
}

function checkHiddenColumns(columns) {
    if (!isMobile()) return [];
    return columns.filter(c => c.responsive && c.responsive[0] == 'md');
}

const expandedTableColumns = [
    { title: "Колонка", dataIndex: "columnName", width: '30%', ellipsis: true },
    {
        title: "Значение", dataIndex: "value", ellipsis: true,
        render: (data, record) => record.render ? record.render(record.value, record) : data
    }
];

const handleOnChange = (onChange, memoryDataSet) => {
    if (onChange) {
        onChange({
            data: memoryDataSet.data.map(value => value.record),
            delta: memoryDataSet.delta
        });
    }
};

const MemoryDataTable = React.forwardRef((props, ref) => {
    const refOuter = React.useRef(null);
    let [data] = React.useState(props.data ?? null);
    let [loading] = React.useState(false);
    let [selectRows, setSelectRows] = React.useState([]);
    let [requestParams] = React.useState({
        // параметры запроса по умолчанию
        pagination: { current: 1, pageSize: DEFAULT_PAGE_SIZE, showSizeChanger: true },
        sort: buildSortByDefaultFromColumns(props.columns) || {},
        filters: props.defaultFilters ? extractValuesFromInitFilters(props.defaultFilters, true) : {},
    });
    const [filterColumns] = React.useState({});
    const { columns, onChange, ...otherProps } = props;
    const [popupState, setPopupState] = React.useState({
        visible: false,
        x: 0, y: 0
    });
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);
    const [hiddenColumns] = React.useState(checkHiddenColumns(columns));

    const idName = props.idName;
    const [memoryDataSet] = React.useState(Object.create(MemoryDataSet));
    React.useEffect(() => {
        memoryDataSet.setOriginalData(props.value && props.value.data ? props.value.data : [], props.value && props.value.delta ? props.value.delta : []);
    }, [memoryDataSet, props.value]);

    const handleHeaderClick = React.useCallback((ev, htmlCol) => {
        let offs = 0;
        if (props.selectable) offs = 1;
        if (hiddenColumns.length > 0) offs += 1;

        const column = columns[htmlCol.cellIndex - offs];
        const nextOrderDir = nextSortDirection(column.sortOrder);
        if (!ev.ctrlKey) {
            resetSortColumns(columns);
        }
        column.sortOrder = nextOrderDir;
    }, [columns, hiddenColumns.length, props.selectable]);

    rebuildColumns(columns);

    const renderExpandRowForMobile = (record, index, indent, expanded) => {
        if (expanded) {
            const data = hiddenColumns.map(c => {
                const data = { columnName: c.title, value: record[c.dataIndex], render: c.render };
                return data;
            });
            return (
                <Table rowKey={"columnName"}
                    columns={expandedTableColumns}
                    dataSource={data}
                    pagination={false}
                    showHeader={false}
                />
            );
        }
    }
    const expandedRowRender = hiddenColumns.length > 0 ? renderExpandRowForMobile : null;

    // ищем свойства shorthotkey у MenuItem, после этого вызываем onClick
    const handleHotKey = (event, record) => {
        const checkHotKey = (hotKey) => {
            return event.ctrlKey == !!hotKey.ctrlKey &&
                event.altKey == !!hotKey.altKey &&
                event.shiftKey == !!hotKey.shiftKey &&
                event.keyCode == hotKey.keyCode;
        }
        const handleInChildren = (children) => {
            return React.Children.map(children, mi => {
                if (mi.props && mi.props.shorthotkey && checkHotKey(mi.props.shorthotkey)) {
                    return mi;
                }
                if (mi.props && mi.props.children) {
                    return handleInChildren(mi.props.children);
                }
            })
        }
        if (props.recordMenu) {
            const mi = handleInChildren(props.recordMenu(record).props.children);
            if (mi.length > 0) {
                event.preventDefault();
                event.stopPropagation();
                mi[0].props.onClick(event, undefined, record, {});
            }
        }
    }

    const deleteData = React.useCallback(() => {
        let ids = selectRows.join(',');
        confirm(format(MSG_CONFIRM_DELETE, selectRows.length), () => {
            console.log("Delete record " + ids);
            selectRows.forEach(value => {
                memoryDataSet.data.forEach(data => {
                    if (data.record[idName] === value) {
                        memoryDataSet.delete(data.record, idName);
                    }
                })
            });
            handleOnChange(onChange, memoryDataSet);
            forceUpdate();
            if (props.onAfterDelete) {
                props.onAfterDelete();
            }
            setSelectRows([]);
        })
    }, [props, selectRows, onChange, idName, memoryDataSet])

    // для нормальной сортировки нужно установить handleHeaderClick
    React.useEffect(() => {
        if (refOuter.current) {
            const columns = refOuter.current.getElementsByClassName("ant-table-column-has-sorters");
            for (let c of columns) {
                c.onclick = (ev) => handleHeaderClick(ev, c);
            }
        }
    }, [handleHeaderClick, columns, refOuter])

    const request = React.useCallback((pagination, filters, sorter) => {
        requestParams.sort = buildSortFromColumns(sorter);
        requestParams.pagination.current = pagination.current;
        requestParams.pagination.pageSize = pagination.pageSize;
    }, [requestParams])

    const setQuickFilters = React.useCallback((column, value, suffix) => {
        const keyFilter = "quick." + column.dataIndex + "." + suffix;
        requestParams.filters[keyFilter] = value;
        filterColumns[keyFilter] = column;
        // refreshData();
    }, [requestParams, filterColumns])

    const removeQuickFilters = React.useCallback((ev) => {
        let key = ev.target.parentNode.parentNode.id;
        if (key == "") {
            key = ev.target.parentNode.parentNode.parentNode.id;
        }
        delete requestParams.filters[key];
        delete filterColumns[key];
        // refreshData();
    }, [filterColumns, requestParams.filters])

    const buildTitle = React.useCallback(() => {
        let qfilters = [];
        for (const key in requestParams.filters) {
            if (key.startsWith("quick.")) {
                qfilters.push({
                    key: key,
                    title: filterColumns[key].title,
                    value: requestParams.filters[key],
                    oper: key.endsWith(".eq") ? " = " : " содержит ",
                    operTag: key.substring(key.lastIndexOf('.') + 1)
                });
            }
        }
        return qfilters.length > 0 ?
            () => <div><span style={{ marginLeft: 8, marginRight: 16 }}>Быстрый фильтр:</span>
                {qfilters.map(f => <Tag id={f.key} key={f.key} color="blue" closable onClose={removeQuickFilters}>
                    {f.title}{f.oper}{f.operTag == "like" ? "[" : ""}{f.value}{f.operTag == "like" ? "]" : ""}</Tag>)
                }
            </div>
            : undefined;
    }, [filterColumns, requestParams.filters, removeQuickFilters]);

    const rowSelection = {
        type: props.selectType,
        selectedRowKeys: selectRows,
        onChange: (rows) => {
            setSelectRows([...rows]);
        },
        selections: [
            Table.SELECTION_ALL,
            Table.SELECTION_INVERT,
            {
                key: 'Reset',
                text: 'Убрать все отметки',
                onSelect: changableRowKeys => {
                    setSelectRows([]);
                }
            }
        ]
    };

    React.useEffect(() => {
        if (props.onSelectedChange != null) {
            props.onSelectedChange(selectRows);
        }
    }, [selectRows]); // eslint-disable-line

    const callForm = React.useCallback((record, event) => {
        if (event.altKey) {
            const column = props.columns[getTableTD(event.target).cellIndex - 1];
            if (column) {
                if (event.ctrlKey) {
                    inputValue(`Быстрый фильтр по полю "${column.title}"`,
                        "Часть текста, которая должна содержаться в данных",
                        (val) => setQuickFilters(column, val, 'like'));
                } else {
                    setQuickFilters(column, record[column.dataIndex], 'eq');
                }
            }
        } else {
            if (props.editable) {
                props.editCallBack(record);
            } else {
                if (props.selectable && props.selectType == "radio") {
                    setSelectRows([record[props.idName]]);
                }
            }
        }
    }, [props, setQuickFilters])

    // interface содержит методы, которые можно применять к функциональному компоненту 
    // в стиле компонента, построенного на классах
    if (props.interface) {
        props.interface.isLoading = () => loading;
        props.interface.getSelectedRows = () => rowSelection.selectedRowKeys;
        props.interface.setSelectedRows = (rows) => setSelectRows(rows);
        props.interface.getSelectedRecords = () => rowSelection.selectedRowKeys
            .map(idValue => memoryDataSet.data.filter(r => idValue == (r[idName] ?? r.record[idName]))[0]);
        props.interface.deleteData = deleteData;
        props.interface.requestParams = requestParams;
        props.interface.insFirstRecord = (values) => {
            // Сгенерируем случайное id для новых записей
            values[idName] = Math.ceil(Math.random() * MIN_INT);
            // Запишем новую запись в датасет
            memoryDataSet.insert(values);
            handleOnChange(onChange, memoryDataSet);
            forceUpdate();
        };
        props.interface.updateRecord = (values) => {
            memoryDataSet.update(values, idName);
            handleOnChange(onChange, memoryDataSet);
            forceUpdate();
        };
        props.interface.getProperties = () => {
            return {
                props: props
            }
        };
        props.interface.getNextInField = (field) => {
            let maxValue = 0;
            memoryDataSet.data.forEach(value => {
                if (value.record[field] > maxValue) {
                    maxValue = value.record[field];
                }
            });
            return maxValue + 1;
        };
        props.interface.getSumField = (field) => getSumField(memoryDataSet.data, field);
        props.interface.getScalarSumField = (fieldA, fieldB) => getScalarSumField(memoryDataSet.data, fieldA, fieldB);
        props.interface.memoryDataSet = memoryDataSet;
    }

    const getRowClass = React.useCallback((record) => {
        let clss = "editable-row" + (props.editable ? " table-editable-row" : "");
        const id = record[idName];
        if (props.updateRecords.find(r => r[idName] == id)) {
            clss += " table-update-row";
        }
        if (props.getRowClass) {
            clss += props.getRowClass(record) ?? "";
        }
        return clss;
    }, [idName, props]);

    const hideAllRecordMenu = () => {
        // у всей страницы сбрасываем видимость меню записи
        data.forEach(r => {
            const mnu = r["mnu"];
            if (mnu) {
                mnu.visibleMenuRecordPopover = false;
            }
        })
        forceUpdate();
    }
    const recordMenuFound = props.recordMenu;

    const menuRecordContent = (record) => (
        <Menu onClick={(ev) => hideAllRecordMenu()}>
            {props.recordMenu
                ? React.Children.map(props.recordMenu(record).props.children, mi => mi)
                : undefined}
        </Menu>
    )

    let servColumn;
    if (recordMenuFound) {
        servColumn = {
            dataIndex: "mnu",
            serv: true, // сервисная колонка
            width: 40,
            render: (data, record) => {
                if (!data) {
                    record["mnu"] = {}
                    data = record["mnu"];
                }

                if (data.visibleMenuRecordPopover) {
                    document.addEventListener(`click`, function onClickOutside() {
                        hideAllRecordMenu();
                        document.removeEventListener(`click`, onClickOutside)
                    })
                }

                return <Popover visible={data.visibleMenuRecordPopover}
                    onVisibleChange={(value) => data.visibleMenuRecordPopover = value}
                    overlayClassName="table-record-menu"
                    placement="leftTop"
                    content={() => menuRecordContent(record)}
                    trigger="click">
                    <MoreOutlined onClick={ev => {
                        ev.stopPropagation();
                        data.visibleMenuRecordPopover = true;
                        forceUpdate();
                    }} />
                </Popover>
            }
        }
    }

    const getColumns = React.useCallback(() => {
        return columns.map((col) => {
            if (!col.editable) {
                return col;
            }
            return {
                ...col,
                onCell: (record) => ({
                    record,
                    editable: col.editable,
                    dataIndex: col.dataIndex,
                    title: col.title,
                    editComponentName: col.editComponentName,
                    required: col.required ?? false,
                    handleSave: props.interface.updateRecord,
                }),
            };
        });
    }, [columns, props.interface.updateRecord]);

    return <div ref={refOuter}>
        <Table rowKey={idName}
            locale={{
                emptyText: "Нет данных"
            }}
            columns={servColumn ? [getColumns(), servColumn] : getColumns()}
            dataSource={memoryDataSet.data.map(value => value.record)}
            loading={loading}
            rowClassName={getRowClass}
            pagination={requestParams.pagination}
            rowSelection={props.selectable ? rowSelection : undefined}
            expandedRowRender={expandedRowRender}
            title={buildTitle()}
            size={"middle"}
            showSorterTooltip={false}
            onRow={(record, rowIndex) => {
                return {
                    onClick: event => callForm(record, event),
                    onContextMenu: event => {
                        // system menu
                        if (event.ctrlKey) {
                            return
                        }
                        event.preventDefault();
                        document.addEventListener(`click`, function onClickOutside() {
                            setPopupState({ visible: false })
                            document.removeEventListener(`click`, onClickOutside)
                        })
                        setPopupState({
                            record,
                            columns,
                            visible: true,
                            x: event.clientX,
                            y: event.clientY,
                            tableInterface: props.interface
                        })
                    },
                    onMouseEnter: event => {
                        // чтобы работал пробел для выделенной записи
                        const tr = event.target.parentNode || {};
                        const comp = tr.firstChild ? tr.firstChild.firstChild || {} : {};
                        if (comp.nodeName == "LABEL") {
                            const input = comp.firstChild.firstChild;
                            // Убрал чтобы фокус не терялся в формах добавления/изменения
                            // input.focus();
                            input.onkeydown = (eventKey) => handleHotKey(eventKey, record);
                        }
                    }
                };
            }}
            onChange={request}
            ref={ref}
            components={{
                body: {
                    row: EditableRow,
                    cell: EditableCell,
                }
            }}
            {...otherProps} />
        <PropertyesPopupMenu {...popupState} />
    </div>
});

MemoryDataTable.propTypes = {
    editable: PropTypes.bool,
    selectable: PropTypes.bool,
    selectType: PropTypes.string,
    editCallBack: PropTypes.func,
    defaultFilters: PropTypes.object,
    autoRefresh: PropTypes.bool,
    interface: PropTypes.object,
    onBeforeRefresh: PropTypes.func,
    onAfterRefresh: PropTypes.func,
    onAfterDelete: PropTypes.func,
    updateRecords: PropTypes.array,
    idName: PropTypes.string,
    data: PropTypes.array,
    getRowClass: PropTypes.func,
}

MemoryDataTable.defaultProps = {
    editable: true,
    autoRefresh: true,
    selectable: true,
    selectType: "checkbox",
    updateRecords: [],
    idName: "id",
    data: null
}

export default MemoryDataTable;