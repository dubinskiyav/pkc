import React from 'react';
import { Button, Menu, Dropdown, Form, Space, notification } from 'antd';
import DataTable from "../../lib/DataTable";
import App from '../../App';
import ModuleHeader from "../../lib/ModuleHeader";
import { FilterPanelExt, Primary } from "../../lib/FilterPanelExt";
import { FilterButton } from '../../lib/FilterButton';
import { withRouter } from "react-router";
import { BUTTON_ADD_LABEL, BUTTON_DEL_LABEL, BUTTON_REFRESH_LABEL, DEFAULT_TABLE_CONTEXT } from "../../lib/Const";
import { MoreOutlined, CloseCircleOutlined, SendOutlined, CopyOutlined } from '@ant-design/icons';
import { drawDate, drawFloat, drawInt, drawStatus, getItemFromLocalStorage, refreshStatusList } from "../../lib/Utils";
import EditForm from "../../lib/EditForm";
import RequestForm from "./RequestForm";
import { CONTOUR_DOCUMENTS, MODULE_REQUEST } from "../../lib/ModuleConst"
import { buildPrintMenu, buildEntityPrintMenu } from '../../lib/stddialogs/PrintDialog';
import { responsiveMobileColumn, isMobile } from '../../lib/Responsive';
import Checkbox from 'antd/lib/checkbox/Checkbox';
import DataLookup from '../../lib/DataLookup';
import MultiDataSelect from '../../lib/MultiDataSelect';
import { userProps } from '../../lib/LoginForm';
import { centralOffice, STATUS_ACCEPTED, STATUS_ADOPTED_DISCREPANCIES, STATUS_APPROVAL, STATUS_DRAFT, STATUS_RESERVE, STATUS_SHIPMENT } from '../../lib/tentoriumConst';
import requestToAPI from '../../lib/Request';
import { confirm } from "../../lib/Dialogs";
import { DateInputRange } from '../../lib/DateInput';
import moment from 'moment';

const MOD_TITLE = "Исходящие заказы";
const MODE_HELP_ID = "/help/request";
const CONTOUR = CONTOUR_DOCUMENTS;
const MODULE = MODULE_REQUEST;

// Сущность (в CamelCase)
const ENTITY = "Request";
const ID_NAME = ENTITY.charAt(0).toLowerCase() + ENTITY.slice(1) + "Id"
// URI для использования формой со списком (текущей) и формой добавления/изменения
const URI_FOR_GET_LIST = "tentorium/documents/requestout/request/getlist";
const URI_FOR_GET_ONE = "tentorium/documents/requestout/request/get";
const URI_FOR_COPY = "tentorium/documents/requestout/request/copy";
const URI_FOR_SAVE = "tentorium/documents/requestout/request/save";
const URI_FOR_SAVE_ACCEPT = "tentorium/documents/requestout/request/saveaccept";
const URI_FOR_DELETE = "tentorium/documents/requestout/request/delete";

// позиция в меню
// в subsystem - key верхнего меню
const MNU_SUBSYSTEM = CONTOUR.name;
const HREF_SUBSYSTEM = "/" + CONTOUR.name;
const NAME_SUBSYSTEM = CONTOUR.title;
// в menu - key бокового главного
const MNU_MENU = MODULE.name;
// в submenu - key бокового подменю (финальный пункт)
// его имя равно имени модуля
const MNU_SUMMENU = MODULE.name + ".sm1";
// автоматическое обновление при монтировании компонента
const AUTO_REFRESH = true;
// Конвертация значений, приходящих и уходящих через API
const CONVERTORS = {
    date: ["documentRealDate"]
}

// колонки в таблице
const COLUMNS = [
    {
        title: 'Статус',
        dataIndex: 'documentTransitName',
        responsive: responsiveMobileColumn(),
        width: "80px",
        render: (_, record) => drawStatus(_, record),
        disableQuickFilter: true
    },
    {
        title: 'Номер',
        dataIndex: 'documentRealNumber',
        sorter: true,
    },
    {
        title: 'Дата и время',
        dataIndex: 'documentRealDate',
        sorter: true,
        defaultSortOrder: "descend",
        render: (data) => !data ? "" :
            <Space direction="vertical">
                <span>{moment(data).format("DD.MM.YYYY")}</span>
                <span>{moment(data).format("HH:mm")}</span>
            </Space>,
        renderForFilter: drawDate
    },
    {
        title: 'СЦ/ФСЦ',
        dataIndex: 'subjectCode',
        responsive: responsiveMobileColumn(),
        disableQuickFilter: true,
        render: (_, record) =>
            <Space direction="vertical">
                <span>{record["subjectCode"]}</span>
                <span>{record["customerName"]}</span>
            </Space>
    },
    {
        title: 'Итого сумма',
        dataIndex: 'requestTotal',
        responsive: responsiveMobileColumn(),
        disableQuickFilter: true,
        render: drawFloat
    },
    {
        title: 'Итого баллы',
        dataIndex: 'requestTotalPoints',
        disableQuickFilter: true,
        render: drawInt,
        responsive: responsiveMobileColumn(),
    },
    {
        title: 'Итого вес (кг)',
        dataIndex: 'requestTotalWeight',
        disableQuickFilter: true,
        render: (value, record) => drawFloat(value, record, undefined, 3),
        responsive: responsiveMobileColumn(),
    },
]

// Уникальный идентификатор формы редактировавания
const EDIT_FORM_ID = ENTITY.toLowerCase() + "-frm";
// Форма для редактирования
const buildForm = (form) => {
    return <RequestForm form={form} initialValues={{}} additionalButtons={[]} events={{}} />
}
// размер формы, -1 - по умолчанию, FORM_MAX_WIDTH - максимальная ширина
const FORM_WIDTH = "95%";

// Создание компонент для фильтров
// key это уникальное имя фильтра, попадает в REST API
const buildFilters = (statuses) => {
    return <React.Fragment>
        <Primary>
            <span style={{ display: "block", minWidth: "75px" }}>Период</span>
            <DateInputRange key="dateRange" allowClear={false} />
        </Primary>
        <Space direction="vertical">
            <Space>
                <span style={{ display: "block", minWidth: "75px" }}>Статус</span>
                <MultiDataSelect key="statusIds"
                    // необязательный, используется, например, в кэше
                    componentName={"statusIds"}
                    data={statuses}
                    valueName="documentTransitId"
                    displayValueName="documentTransitName"
                    style={{ minWidth: "500px" }}
                    allowClear={true} />
            </Space>
            <Space>
                <span style={{ display: "block", minWidth: "75px" }}>Поставщик</span>
                <DataLookup.Company key="providerId" style={{ minWidth: "500px" }} allowClear={true} />
                <Checkbox key="providerWithBranchFlag">С филиалами</Checkbox>
            </Space>
        </Space>
    </React.Fragment>
}
// начальное значение фильтров
// если значение фильра не объект, а простое значение,
// то значение имени свойства компонента принимается как defaultValue компонента
const initFilters = {
    dateRange: [moment().add(-30, 'day'), moment()]
}

// обрабочик меню
const buildMenuHandler = (config) => {
    return (ev) => {
        console.log('click', ev);
    }
}

//===============================================================================
// Основной функциональный компонент
//===============================================================================
/**
 * Таблица передает на сервер post-запрос в теле которого
 * pagination - информация о странице
 * sort - сортировка
 * filters - фильтры (+ быстрые фильтры начинаются с quick.*)
 * search - строка полнотекстового поиска
 */
const RequestOut = (props) => {
    let [formVisible, setFormVisible] = React.useState(false);
    const [topLayer, setTopLayer] = React.useState([]);
    let [editorContext] = React.useState({
        uriForGetOne: URI_FOR_GET_ONE,
        uriForSave: URI_FOR_SAVE,
    });
    const [tableInterface] = React.useState(Object.assign({}, DEFAULT_TABLE_CONTEXT));
    const [form] = Form.useForm();
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);
    const [updateRecords, setUpdateRecords] = React.useState([]);
    const [onlyCloseButton, setOnlyCloseButton] = React.useState(false);

    const [statuses, setStatuses] = React.useState(() => {
        let documentTransit = JSON.parse(getItemFromLocalStorage("documentTransit"));
        if (!documentTransit) {
            refreshStatusList(response => {
                setStatuses(response[200]);
            });
            return [];
        } else {
            return documentTransit[200];
        }
    });

    const [title, setTitle] = React.useState();

    const setFilters = React.useCallback((config) => {
        if (JSON.stringify(initFilters.dateRange) == JSON.stringify(config.dateRange)) {
            initFilters.dateRange = [moment().add(-30, 'day'), moment()];
            config.dateRange = initFilters.dateRange;
        }
        tableInterface.requestParams.filters = config;
        tableInterface.refreshData();
    }, [tableInterface])


    const callForm = React.useCallback((id, record, copyFlag) => {
        editorContext.id = id;
        editorContext.uriForGetOne = URI_FOR_GET_ONE;
        editorContext.uriForSave = URI_FOR_SAVE;
        if (copyFlag) {
            editorContext.uriForGetOne = URI_FOR_COPY;
        } else if (record && [STATUS_SHIPMENT, STATUS_ACCEPTED, STATUS_ADOPTED_DISCREPANCIES].indexOf(record["documentRealStatus"]) !== -1) {
            editorContext.uriForSave = URI_FOR_SAVE_ACCEPT;
        }
        setFormVisible(true);
    }, [editorContext])

    // меню для записи
    const recordMenu = React.useCallback((config, record) => {
        config.moduleCode = "requestout";
        return <React.Fragment>
            {buildEntityPrintMenu(ENTITY, record, config)}
            <Menu.Divider />
            <Menu.Item key="copy" icon={<CopyOutlined />}
                onClick={(ev) => {
                    ev.domEvent.stopPropagation(); // чтобы предовратить запуск окна редактирования
                    callForm(record[ID_NAME], record, true);
                }}>Копировать...</Menu.Item>
        </React.Fragment>
     },[callForm]);

    const changeStatusCancel = React.useCallback(() => {
        // Проверим что все выбранные заказы имеют статус из разрешенного набора статусов
        if (tableInterface.getSelectedRecords().filter(value => [STATUS_APPROVAL].indexOf(value.documentRealStatus) === -1).length > 0) {
            notification.error({ message: "В перечне выбранных заказов присутствует заказ с текущим статусом, отличным от статуса «На согласовании»" })
            return;
        }

        let ids = tableInterface.getSelectedRows();
        confirm("Отмененные заказы нельзя отправить повторно. " + (ids.length === 1 ? "Отменить выбранный заказ?" : "Отменить выбранные заказы?"), () => {
            requestToAPI.post("tentorium/documents/requestout/request/cancel", {
                documentRealIds: ids
            })
                .then(() => {
                    tableInterface.refreshData();
                    notification.success({ message: ids.length === 1 ? "Заказ отменен" : "Заказы отменены" })
                })
                .catch(error => {
                    notification.error({
                        message: ids.length === 1 ? "Ошибка при отмене заказа" : "Ошибка при отмене заказов",
                        description: error.message
                    })
                })
        })
    }, [tableInterface])

    const changeStatusSubmit = React.useCallback(() => {
        // Проверим что все выбранные заказы имеют статус из разрешенного набора статусов
        if (tableInterface.getSelectedRecords().filter(value => [STATUS_DRAFT].indexOf(value.documentRealStatus) === -1).length > 0) {
            notification.error({ message: "В перечне выбранных заказов присутствует заказ с текущим статусом, отличным от статуса «Черновик»" })
            return;
        }

        let ids = tableInterface.getSelectedRows();
        confirm(ids.length === 1 ? "Отправить выбранный заказ?" : "Отправить выбранные заказы?", () => {
            requestToAPI.post("tentorium/documents/requestout/request/submit", {
                documentRealIds: ids
            })
                .then(() => {
                    tableInterface.refreshData();
                    notification.success({ message: ids.length === 1 ? "Заказ отправлен" : "Заказы отправлены" })
                })
                .catch(error => {
                    notification.error({
                        message: ids.length === 1 ? "Ошибка при отправке заказа" : "Ошибка при отправке заказов",
                        description: error.message
                    })
                })
        })
    }, [tableInterface])

    // дополнительные команды
    // если меню нет, то и кнопки нет
    const buildMenuCommand = React.useCallback((config, handleMenuClick) => {
        return <Menu onClick={handleMenuClick}>
            <Menu.Item key="changeStatusCancel" onClick={() => changeStatusCancel()} icon={<CloseCircleOutlined />}
                disabled={!tableInterface.isLoading || tableInterface.isLoading() || tableInterface.getSelectedRows().length == 0}>Отменить</Menu.Item>
            {buildPrintMenu(MODULE.name, config)}
        </Menu>
    }, [tableInterface, changeStatusCancel]);

    const [menuCommand, setMenuCommand] = React.useState(buildMenuCommand(buildMenuHandler({
        'topLayer': topLayer,
        'setTopLayer': setTopLayer,
        'form': form,
        'tableInterface': tableInterface,
        'destroyDialog': (dlgId) => {
            // нужно через timeout так как после вызова destroyDialog следуют обращения к state
            setTimeout(() => { setTopLayer([...topLayer.filter(c => c.props.id != dlgId)]) }, 100)
        }
    })));

    const changeStatusCancelDisabled = tableInterface.isLoading() || tableInterface.getSelectedRows().length == 0;
    React.useEffect(() => {
        setMenuCommand(buildMenuCommand(buildMenuHandler({
            'topLayer': topLayer,
            'setTopLayer': setTopLayer,
            'form': form,
            'tableInterface': tableInterface,
            'destroyDialog': (dlgId) => {
                // нужно через timeout так как после вызова destroyDialog следуют обращения к state
                setTimeout(() => { setTopLayer([...topLayer.filter(c => c.props.id != dlgId)]) }, 100)
            }
        })));
    }, [changeStatusCancelDisabled, form, tableInterface, topLayer, buildMenuCommand])

    // тут формируются кнопки
    const buttons = [
        <Button key="del" onClick={() => tableInterface.deleteData()}
            disabled={tableInterface.isLoading() || tableInterface.getSelectedRows().length == 0}>{BUTTON_DEL_LABEL}</Button>,
        <Button key="changeStatusApproval" onClick={() => changeStatusSubmit()} icon={<SendOutlined />}
            disabled={tableInterface.isLoading() || tableInterface.getSelectedRows().length == 0}>Отправить</Button>,
        <Button key="refresh" onClick={() => tableInterface.refreshData()}>{BUTTON_REFRESH_LABEL}</Button>,
        <Button key="add" onClick={() => callForm()}
            type="primary">{BUTTON_ADD_LABEL}</Button>
    ];
    if (menuCommand) {
        buttons.push(<Dropdown.Button key="more"
            className="more-dropbutton"
            trigger="click"
            overlay={menuCommand} icon={<MoreOutlined />} />);
    }
    if (isMobile()) {
        const filters = buildFilters(statuses);
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

    const getColumns = () => {
        if (!userProps || userProps.userKind !== centralOffice) {
            return COLUMNS.filter(value => value.dataIndex !== "subjectCode");
        }
        return COLUMNS;
    }

    return (
        <App subsystem={MNU_SUBSYSTEM} menu={MNU_MENU} submenu={MNU_SUMMENU}
            breadcrumb={[{ label: NAME_SUBSYSTEM, href: HREF_SUBSYSTEM }, { label: MOD_TITLE }]}
            afterLogin={forceUpdate}
            buttons={buttons}
            helpId={MODE_HELP_ID}>
            <ModuleHeader
                title={MOD_TITLE}
                onSearch={value => {
                    tableInterface.requestParams.search = value;
                    tableInterface.refreshData();
                }}
                buttons={buttons}
            />
            <FilterPanelExt onChange={(fc) => setFilters(fc)} initValues={initFilters}>
                {buildFilters(statuses)}
            </FilterPanelExt>
            <DataTable className="mod-main-table"
                uri={{
                    forSelect: URI_FOR_GET_LIST,
                    forDelete: URI_FOR_DELETE
                }}
                columns={getColumns()}
                defaultFilters={initFilters}
                autoRefresh={AUTO_REFRESH}
                editCallBack={(record) => callForm(record[ID_NAME], record)}
                interface={tableInterface}
                onSelectedChange={() => forceUpdate()}
                onAfterRefresh={() => setUpdateRecords([])}
                onBeforeRefresh={() => {
                    if (tableInterface.requestParams.filters
                        && tableInterface.requestParams.filters.statusIds
                        && (typeof (tableInterface.requestParams.filters.statusIds[0]) !== "number")) {
                        tableInterface.requestParams.filters.statusIds = tableInterface.requestParams.filters.statusIds.map(value => value.value);
                    }
                    return true;
                }}
                updateRecords={updateRecords}
                recordMenu={(record) => recordMenu({
                    topLayer,
                    setTopLayer,
                    form,
                    tableInterface,
                    idName: ID_NAME,
                    destroyDialog: (dlgId) => {
                        setTopLayer([...topLayer.filter(c => c.props.id != dlgId)])
                    }
                }, record)}
                idName={ID_NAME}
            />
            <EditForm
                id={EDIT_FORM_ID}
                copyButtonFlag={false}
                visible={formVisible}
                form={form}
                width={FORM_WIDTH}
                editorContext={editorContext}
                onAfterLoad={response => {
                    if (editorContext.uriForGetOne === URI_FOR_COPY) {
                        editorContext.id = null;
                        editorContext.record = null;
                        response.requestId = null;
                        response.documentRealStatus = null;
                        response.documentTransitColor = null;
                        response.documentTransitName = null;
                        // Выведем сообщение о недоступных позициях заказа
                        if (response.positionsUnavailable && response.positionsUnavailable.length > 0) {
                            let text = [];
                            text.push(<span style={{ display: "block" }}>
                                {"На " + moment(response.documentRealDate).format("DD.MM.yyyy") +
                                    " не доступны для заказа товары с наименованием и характеристикой:"}
                            </span>);
                            const sgoods = response.positionsUnavailable.map(value => value.sgood.title + ", " + value.characterCode);
                            [...new Set(sgoods)].forEach((value, index) => {
                                text.push(<span style={{ display: "block" }}>{(index + 1) + ") " + value}</span>);
                            })
                            notification.warning({ message: text, duration: 0 });
                        }
                    }
                    setTitle((editorContext.id || editorContext.record)
                        ? (
                            <>
                                <span>
                                    {"Изменение заказа" + (response.documentTransitName ? " (статус: " : "")}
                                </span>
                                <span style={{ display: "inline-block", padding: "0px 4px" }}>
                                    {response.documentTransitColor && drawStatus(response.documentTransitColor)}
                                </span>
                                <span>
                                    {response.documentTransitName ? response.documentTransitName + ")" : ""}
                                </span>
                            </>
                        ) : "Новый заказ");
                    setOnlyCloseButton([STATUS_APPROVAL, STATUS_RESERVE, STATUS_ACCEPTED].indexOf(response.documentRealStatus) !== -1);
                }}
                title={title}
                onlyCloseButton={onlyCloseButton}
                beforeSave={(values) => {
                    if (editorContext.uriForSave === URI_FOR_SAVE_ACCEPT) {
                        // Преобразуем параметры для передачи в saveaccept
                        values["accepts"] = { data: [], delta: [] };
                        values["positions"].data.forEach(value => {
                            ((value.accepts && value.accepts.data) ? value.accepts.data : []).forEach(el => {
                                values["accepts"].data.push(Object.assign({}, el));
                            });
                            ((value.accepts && value.accepts.delta) ? value.accepts.delta : []).forEach(el => {
                                const newObj = Object.assign({}, el);
                                if (el.oldRecord) {
                                    newObj.oldRecord = Object.assign({}, el.oldRecord);
                                }
                                newObj.record = Object.assign({}, el.record);
                                values["accepts"].delta.push(newObj);
                            })
                        })
                        values["accepts"].data.map(value => {
                            value["requestAcceptDate"] = value["requestAcceptDate"].valueOf();
                            return value;
                        })
                        values["accepts"].delta.map(value => {
                            if (value.oldRecord) {
                                value.oldRecord["requestAcceptDate"] = value.oldRecord["requestAcceptDate"].valueOf();
                            }
                            value.record["requestAcceptDate"] = value.record["requestAcceptDate"].valueOf();
                            return value;
                        })
                    }
                    return values;
                }}
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
                {buildForm(form)}
            </EditForm>
            {topLayer.map(item => item)}
        </App>
    )
}

export default withRouter(RequestOut);