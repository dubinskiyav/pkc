import React from 'react';
import { Button, Form, notification } from 'antd';
import DataTable from "../../lib/DataTable";
import ModuleHeader from "../../lib/ModuleHeader";
import { FilterButton } from '../../lib/FilterButton';
import { BUTTON_ADD_LABEL, BUTTON_DEL_LABEL, BUTTON_REFRESH_LABEL, DEFAULT_TABLE_CONTEXT, FORM_ITEMS_LAYOUT } from "../../lib/Const";
import { drawDate, buildURL } from "../../lib/Utils";
import EditForm from "../../lib/EditForm";
import ConstantValueForm from "./ConstantValueForm";
import { CONTOUR_ADMIN, MODULE_CONFIG } from "../../lib/ModuleConst"
import { isMobile } from '../../lib/Responsive';
import requestToAPI from "../../lib/Request";

const CONTOUR = CONTOUR_ADMIN;
const MODULE = MODULE_CONFIG;

// Сущность (в CamelCase)
const ENTITY = "ConstantValue";
const ID_NAME = ENTITY.charAt(0).toLowerCase() + ENTITY.slice(1) + "Id"
// URI для использования формой со списком (текущей) и формой добавления/изменения
const URI_FOR_GET_LIST = buildURL(CONTOUR, MODULE, ENTITY) + "/getlist";
const URI_FOR_GET_ONE = buildURL(CONTOUR, MODULE, ENTITY) + "/get";
const URI_FOR_SAVE = buildURL(CONTOUR, MODULE, ENTITY) + "/save";
const URI_FOR_DELETE = buildURL(CONTOUR, MODULE, ENTITY) + "/delete";

// автоматическое обновление при монтировании компонента
const AUTO_REFRESH = true;
// Конвертация значений, приходящих и уходящих через API
const CONVERTORS = {
    date: ["constantValueDatebeg", "constantValueDate"]
}

// колонки в таблице
const COLUMNS = [
    {
        title: 'Дата',
        dataIndex: 'constantValueDatebeg',
        sorter: true,
        defaultSortOrder: 'descend',
        width: "120px",
        render: drawDate,
    },
    {
        title: 'Значение',
        dataIndex: 'constantValueDisplay',
        sorter: true,
        ellipsis: true,
    }
]

// Уникальный идентификатор формы редактировавания
const EDIT_FORM_ID = ENTITY.toLowerCase() + "-frm";
// Форма для редактирования
const buildForm = (form, constantId, constantTypeId) => {
    return <ConstantValueForm
        form={form}
        initialValues={{ constantId: constantId, constantTypeId: constantTypeId }} />
}
// размер формы, -1 - по умолчанию, FORM_MAX_WIDTH - максимальная ширина
const FORM_WIDTH = -1;

// Создание компонент для фильтров
// key это уникальное имя фильтра, попадает в REST API
const buildFilters = () => {
    return <React.Fragment>

    </React.Fragment>
}
// начальное значение фильтров
// если значение фильра не объект, а простое значение,
// то значение имени свойства компонента принимается как defaultValue компонента
const initFilters = {
}

export const ConstantValue = (props) => {
    const firstInputRef = React.useRef(null);

    React.useEffect(() => {
        setTimeout(() => {
            if (firstInputRef.current)
                firstInputRef.current.focus({
                    cursor: 'end',
                })
        }, 100);
    })

    let [formVisible, setFormVisible] = React.useState(false);
    const topLayer = React.useState([]);
    let [editorContext] = React.useState({
        uriForGetOne: URI_FOR_GET_ONE,
        uriForSave: URI_FOR_SAVE,
    });
    const [tableInterface] = React.useState(Object.assign({}, DEFAULT_TABLE_CONTEXT));
    const [form] = Form.useForm();
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);
    const [updateRecords, setUpdateRecords] = React.useState([]);
    const constantId = props.constantId;
    let constantTypeId = React.useRef();

    React.useEffect(() => {
        requestToAPI.post(buildURL(CONTOUR_ADMIN, MODULE_CONFIG, "Artifact") + "/get", constantId)
            .then((value) => {
                constantTypeId.current = value.constantTypeId;
            })
            .catch(error => {
                notification.error({
                    message: "Ошибка при получении константы",
                    description: error.message
                })
            })
    }, [constantId]);

    const setFilters = React.useCallback((config) => {
        tableInterface.requestParams.filters = config;
        tableInterface.refreshData();
    }, [tableInterface])


    const callForm = React.useCallback((id) => {
        editorContext.id = id;
        setFormVisible(true);
    }, [editorContext])

    // тут формируются кнопки
    const buttons = [
        <Button key="del" onClick={() => tableInterface.deleteData()}
            disabled={tableInterface.isLoading() || tableInterface.getSelectedRows().length == 0}>{BUTTON_DEL_LABEL}</Button>,
        <Button key="refresh" onClick={() => tableInterface.refreshData()}>{BUTTON_REFRESH_LABEL}</Button>,
        <Button key="add" onClick={() => callForm()}
            type="primary">{BUTTON_ADD_LABEL}</Button>
    ];
    if (isMobile()) {
        const filters = buildFilters();
        buttons.push(<FilterButton key="filter" filters={filters}
            onChange={(fc) => setFilters(fc)}
            initValues={initFilters} />);
    }

    const afterEdit = React.useCallback((values) => {
        tableInterface.updateRecord(values);
        setUpdateRecords([...updateRecords, values])
    }, [tableInterface, updateRecords])
    const afterAdd = React.useCallback((values) => {
        tableInterface.insFirstRecord(values);
        setUpdateRecords([...updateRecords, values])
    }, [tableInterface, updateRecords])

    return <Form
        {...FORM_ITEMS_LAYOUT}
        form={props.form}
        layout="horizontal"
        name="formSample"
        onFieldsChange={props.onFieldsChange}
        initialValues={props.initialValues}>

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
        <DataTable className="mod-main-table"
            uri={{
                forSelect: URI_FOR_GET_LIST,
                forDelete: URI_FOR_DELETE
            }}
            columns={COLUMNS}
            autoRefresh={AUTO_REFRESH}
            editCallBack={(record) => callForm(record[ID_NAME])}
            interface={tableInterface}
            onSelectedChange={() => forceUpdate()}
            onBeforeRefresh={() => {
                tableInterface.requestParams.filters.constantId = constantId;
                return true;
            }}
            onAfterRefresh={() => setUpdateRecords([])}
            updateRecords={updateRecords}
            // recordMenu={recordMenu}
            idName={ID_NAME}
        />
        <EditForm
            id={EDIT_FORM_ID}
            copyButtonFlag={true}
            visible={formVisible}
            form={form}
            width={FORM_WIDTH}
            editorContext={editorContext}
            afterSave={(response) => {
                setFormVisible(false);
                if (response) {
                    if (!editorContext.id) {
                        afterAdd(response)
                    } else {
                        afterEdit(response)
                    }
                }
            }}
            afterCopy={afterAdd}
            afterCancel={() => {
                setFormVisible(false);
            }}
            idName={ID_NAME}
            convertors={CONVERTORS}>
            {buildForm(form, constantId, constantTypeId.current)}
        </EditForm>
        {topLayer.map(item => item)}
    </Form>
}