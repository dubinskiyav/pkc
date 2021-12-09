import React from 'react';
import { Button, Form, Input, notification } from 'antd';
import DataTable from "./DataTable";
import ModuleHeader from "./ModuleHeader";
import { FilterButton } from './FilterButton';
import { BUTTON_REFRESH_LABEL, DEFAULT_TABLE_CONTEXT, FORM_ITEMS_LAYOUT, MSG_REQUEST_ERROR } from "./Const";
import { drawDateAndTime, drawStatus } from "./Utils";
import { isMobile, responsiveMobileColumn } from './Responsive';
import requestToAPI from "./Request";
import Checkbox from 'antd/lib/checkbox/Checkbox';
import { FilterPanelExt, Primary } from './FilterPanelExt';

// Сущность (в CamelCase)
const ENTITY = "DocumentRealTransit";
const ID_NAME = ENTITY.charAt(0).toLowerCase() + ENTITY.slice(1) + "Id"
// URI для использования формой со списком (текущей) и формой добавления/изменения
const URI_FOR_GET_LIST = "documents/documentreal/documentrealtransit/getlist";

// автоматическое обновление при монтировании компонента
const AUTO_REFRESH = true;

// колонки в таблице
const COLUMNS = [
    {
        title: 'Статус',
        dataIndex: 'documentTransitColor',
        width: "80px",
        render: drawStatus,
    },
    {
        title: 'Действие',
        dataIndex: 'documentRealTransitFlag',
        ellipsis: true,
        responsive: responsiveMobileColumn(),
    },
    {
        title: 'Дата установки/снятия',
        dataIndex: 'documentRealTransitDate',
        sorter: true,
        defaultSortOrder: 'descend',
        width: "130px",
        render: drawDateAndTime,
    },
    {
        title: 'Дата регистрации',
        dataIndex: 'documentRealTransitDateset',
        sorter: true,
        defaultSortOrder: 'descend',
        width: "130px",
        render: drawDateAndTime,
        responsive: responsiveMobileColumn(),
    },
    {
        title: 'Наименование',
        dataIndex: 'documentTransitName',
        ellipsis: true,
    },
    {
        title: 'Пользователь',
        dataIndex: 'progUserName',
        ellipsis: true,
    },
    {
        title: 'Примечание',
        dataIndex: 'documentRealTransitRemark',
        ellipsis: true,
    },
]

// Создание компонент для фильтров
// key это уникальное имя фильтра, попадает в REST API
const buildFilters = () => {
    return <React.Fragment>
        <Primary>
            <Checkbox key="showOnlySetStatus">Показывать только установленные в данный момент статусы</Checkbox>
        </Primary>
    </React.Fragment>
}
// начальное значение фильтров
// если значение фильра не объект, а простое значение,
// то значение имени свойства компонента принимается как defaultValue компонента
const initFilters = {
    showOnlySetStatus: {
        propInitName: "defaultChecked",
        initValue: 0
    },
}

export const DocumentRealTransits = (props) => {
    const firstInputRef = React.useRef(null);
    const [isSetDocumentName, setIsSetDocumentName] = React.useState(false);

    React.useEffect(() => {
        if (!isSetDocumentName && props.initialValues["documentRealId"]) {
            requestToAPI.post("system/documentreal/getname", props.initialValues["documentRealId"])
                .then(response => {
                    props.form.setFieldsValue({ "documentRealName": response.value });
                    setIsSetDocumentName(true);
                })
                .catch((error) => {
                    console.log(error);
                    notification.error({
                        message: MSG_REQUEST_ERROR,
                        description: error.message
                    })
                })
        }
    }, [props.initialValues, props.form, isSetDocumentName, setIsSetDocumentName])

    React.useEffect(() => {
        setTimeout(() => {
            if (firstInputRef.current)
                firstInputRef.current.focus({
                    cursor: 'end',
                })
        }, 100);
    })

    const topLayer = React.useState([]);
    const [tableInterface] = React.useState(Object.assign({}, DEFAULT_TABLE_CONTEXT));
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);
    const [updateRecords, setUpdateRecords] = React.useState([]);
    const documentRealId = props.documentRealId;

    const setFilters = React.useCallback((config) => {
        tableInterface.requestParams.filters = config;
        tableInterface.refreshData();
    }, [tableInterface])



    // тут формируются кнопки
    const buttons = [
        <Button key="refresh" onClick={() => tableInterface.refreshData()}>{BUTTON_REFRESH_LABEL}</Button>
    ];
    if (isMobile()) {
        const filters = buildFilters();
        buttons.push(<FilterButton key="filter" filters={filters}
            onChange={(fc) => setFilters(fc)}
            initValues={initFilters} />);
    }

    return <Form
        {...FORM_ITEMS_LAYOUT}
        form={props.form}
        layout="horizontal"
        name="formSample"
        onFieldsChange={props.onFieldsChange}
        initialValues={props.initialValues}>

        <Form.Item
            name='documentRealName'
            label='Наименование документа'>
            <Input disabled />
        </Form.Item>

        <ModuleHeader
            title={""}
            showBackButton={false}
            showButtonsInMobile={true}
            onSearch={value => {
                tableInterface.requestParams.search = value;
                tableInterface.refreshData();
            }}
            buttons={buttons}
        />
        <FilterPanelExt onChange={(fc) => setFilters(fc)} initValues={initFilters}>
            {buildFilters()}
        </FilterPanelExt>
        <DataTable className="mod-main-table"
            uri={{
                forSelect: URI_FOR_GET_LIST
            }}
            columns={COLUMNS}
            autoRefresh={AUTO_REFRESH}
            interface={tableInterface}
            onSelectedChange={() => forceUpdate()}
            onBeforeRefresh={() => {
                tableInterface.requestParams.filters.documentrealId = documentRealId;
                return true;
            }}
            onAfterRefresh={() => setUpdateRecords([])}
            updateRecords={updateRecords}
            // recordMenu={recordMenu}
            idName={ID_NAME}
        />
        {topLayer.map(item => item)}
    </Form>
}