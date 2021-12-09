import React from 'react';
import { Form, Input, Tabs, Button } from 'antd';
import MemoryDataTable from "../../lib/MemoryDataTable";
import ModuleHeader from "../../lib/ModuleHeader";
import { FilterButton } from '../../lib/FilterButton';
import { BUTTON_ADD_LABEL, BUTTON_DEL_LABEL, DEFAULT_TABLE_CONTEXT, FORM_ITEMS_LAYOUT } from "../../lib/Const";
import { drawBoolIcon, drawStatus } from "../../lib/Utils";
import EditForm from "../../lib/EditForm";
import DocumentTransitForm from "./DocumentTransitForm";
import { responsiveMobileColumn, isMobile } from '../../lib/Responsive';
import DataSelect from "../../lib/DataSelect";

const { TabPane } = Tabs;

// Сущность (в CamelCase)
const ENTITY = "DocumentTransit";
const ID_NAME = ENTITY.charAt(0).toLowerCase() + ENTITY.slice(1) + "Id"

// Конвертация значений, приходящих и уходящих через API
const CONVERTORS = {
    date: []
}

// колонки в таблице
const COLUMNS = [
    {
        title: 'Значок',
        dataIndex: 'documentTransitColor',
        render: drawStatus,
        width: "80px",
    },
    {
        title: 'Номер',
        dataIndex: 'documentTransitNumber',
        sorter: (a, b) => a.documentTransitNumber - b.documentTransitNumber,
        defaultSortOrder: "ascend",
        width: "80px",
        responsive: responsiveMobileColumn()
    },
    {
        title: 'Уровень',
        dataIndex: 'documentTransitLevel',
        sorter: (a, b) => a.documentTransitLevel - b.documentTransitLevel,
        width: "80px",
        responsive: responsiveMobileColumn()
    },
    {
        title: 'Наименование',
        dataIndex: 'documentTransitName',
        sorter: (a, b) => a.documentTransitName > b.documentTransitName ? 1 : a.documentTransitName < b.documentTransitName ? -1 : 0,
        ellipsis: true,
    },
    {
        title: 'Возможность изменения документа',
        dataIndex: 'documentTransitCanedit',
        render: drawBoolIcon,
        width: "120px",
        responsive: responsiveMobileColumn()
    },
    {
        title: 'Возможность удаления документа',
        dataIndex: 'documentTransitCandelete',
        render: drawBoolIcon,
        width: "120px",
        responsive: responsiveMobileColumn()
    },
    {
        title: 'Возможность изменения листа согласования',
        dataIndex: 'documentTransitAgreeedit',
        render: drawBoolIcon,
        width: "120px",
        responsive: responsiveMobileColumn()
    },
    {
        title: 'Администрирование',
        dataIndex: 'documentTransitUseadmin',
        render: drawBoolIcon,
        width: "120px",
        responsive: responsiveMobileColumn()
    },
    {
        title: 'Запрет повторения',
        dataIndex: 'documentTransitTwicecheck',
        render: drawBoolIcon,
        width: "120px",
        responsive: responsiveMobileColumn()
    },
    {
        title: 'Вести историю изменений',
        dataIndex: 'documentTransitFlaghistory',
        render: drawBoolIcon,
        width: "120px",
        responsive: responsiveMobileColumn()
    },
]

// Уникальный идентификатор формы редактировавания
const EDIT_FORM_ID = ENTITY.toLowerCase() + "-frm";
// Форма для редактирования
const buildForm = (form, allStatuses) => {
    return <DocumentTransitForm
        form={form}
        initialValues={{}}
        allStatuses={allStatuses} />
}
// размер формы, -1 - по умолчанию, FORM_MAX_WIDTH - максимальная ширина
const FORM_WIDTH = 800;

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

const DocumentForm = (props) => {
    const firstInputRef = React.useRef(null);

    React.useEffect(() => {
        setTimeout(() => {
            firstInputRef.current.focus({
                cursor: 'end',
            })
        }, 100);
    });

    let [formVisible, setFormVisible] = React.useState(false);
    let [editorContext] = React.useState({});
    const [tableInterface] = React.useState(Object.assign({}, DEFAULT_TABLE_CONTEXT));
    const [form] = Form.useForm();
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);
    const [updateRecords, setUpdateRecords] = React.useState([]);

    const setFilters = React.useCallback((config) => {
        tableInterface.requestParams.filters = config;
        tableInterface.refreshData();
    }, [tableInterface])


    const callForm = React.useCallback((id, record) => {
        editorContext.id = id;
        editorContext.record = record;
        setFormVisible(true);
    }, [editorContext])

    // тут формируются кнопки
    const buttons = [
        <Button key="del" disabled={tableInterface.isLoading() || tableInterface.getSelectedRows().length == 0}
            onClick={() => {
                const delIds = tableInterface.getSelectedRecords().map(record => record.record["documentTransitId"]);
                tableInterface.memoryDataSet.data.forEach(value => {
                    const newTransitChildIds = value.record.transitChildIds.filter(el => delIds.indexOf(el.value) === -1);
                    if (value.record.transitChildIds.length !== newTransitChildIds.length) {
                        const newValue = value.record;
                        newValue.transitChildIds = newTransitChildIds;
                        tableInterface.updateRecord(newValue);
                    }
                });

                tableInterface.deleteData();
            }}>{BUTTON_DEL_LABEL}</Button>,
        <Button key="add" onClick={() => callForm(undefined, {
            accessRoleIds: [],
            documentTransitAgreeedit: 0,
            documentTransitCandelete: 0,
            documentTransitCanedit: 0,
            documentTransitColor: 16007990, // Первый цвет по умолчанию
            documentTransitFlaghistory: 0,
            documentTransitFlagone: 0,
            documentTransitLevel: tableInterface.getNextInField("documentTransitLevel"),
            documentTransitLocksubj: 0,
            documentTransitName: null,
            documentTransitNumber: tableInterface.getNextInField("documentTransitNumber"),
            documentTransitRequired: 0,
            documentTransitTwicecheck: 0,
            documentTransitUseadmin: 0,
            transitChildIds: []
        })} type="primary">{BUTTON_ADD_LABEL}</Button>
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
        name="formDocument"
        onFieldsChange={props.onFieldsChange}
        initialValues={props.initialValues}>
        <Form.Item
            name='documentName'
            label='Наименование'
            rules={[
                { required: true },
                { max: 50 }
            ]}>
            <Input disabled={true} />
        </Form.Item>
        <Form.Item
            name='uniqueTypeId'
            label='Уникальность'>
            <DataSelect
                ref={firstInputRef}
                uri={"system/uniquetype/getlist"}
                valueName="uniqueTypeId"
                displayValueName="uniqueTypeName"
                displayValue={props.initialValues["uniqueTypeName"]}
                allowClear={true}
            />
        </Form.Item>
        <Tabs defaultActiveKey="1">
            <TabPane tab="Статусы" key="1">
                <ModuleHeader
                    title={""}
                    showBackButton={false}
                    showButtonsInMobile={true}
                    search={false}
                    buttons={buttons}
                />
                <Form.Item
                    name='transits'
                    wrapperCol={{ offset: 0 }}>
                    <MemoryDataTable className="mod-main-table"
                        columns={COLUMNS}
                        editCallBack={(record) => callForm(record[ID_NAME], record)}
                        interface={tableInterface}
                        onSelectedChange={() => forceUpdate()}
                        onAfterRefresh={() => setUpdateRecords([])}
                        updateRecords={updateRecords}
                        idName={ID_NAME}
                    />
                </Form.Item>
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
                    {buildForm(form, props.form.getFieldValue("transits"))}
                </EditForm>
            </TabPane>
        </Tabs>
    </Form>
}

export default DocumentForm;