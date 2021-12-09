import React from 'react';
import { Button, Menu, Dropdown, Form, Space, notification } from 'antd';
import DataTable from "../../lib/DataTable";
import App from '../../App';
import ModuleHeader from "../../lib/ModuleHeader";
import { FilterPanelExt, Primary } from "../../lib/FilterPanelExt";
import { FilterButton } from '../../lib/FilterButton';
import { withRouter } from "react-router";
import { BUTTON_REFRESH_LABEL, DEFAULT_TABLE_CONTEXT } from "../../lib/Const";
import { MoreOutlined, ClockCircleOutlined, ExclamationCircleOutlined, CopyOutlined } from '@ant-design/icons';
import { drawDate, drawFloat, drawInt, drawStatus, getItemFromLocalStorage, refreshStatusList } from "../../lib/Utils";
import EditForm from "../../lib/EditForm";
import RequestForm from "./RequestForm";
import { CONTOUR_DOCUMENTS, MODULE_REQUEST } from "../../lib/ModuleConst"
import { buildPrintMenu, buildEntityPrintMenu } from '../../lib/stddialogs/PrintDialog';
import { responsiveMobileColumn, isMobile } from '../../lib/Responsive';
import Checkbox from 'antd/lib/checkbox/Checkbox';
import DataLookup from '../../lib/DataLookup';
import MultiDataSelect from '../../lib/MultiDataSelect';
import {
    STATUS_ADOPTED_DISCREPANCIES, STATUS_APPROVAL, STATUS_DRAFT,
    STATUS_RESERVE, STATUS_SHIPMENT, STATUS_ACCEPTED
} from '../../lib/tentoriumConst';
import requestToAPI from '../../lib/Request';
import { confirm } from '../../lib/Dialogs';
import { DateInputRange } from '../../lib/DateInput';
import moment from 'moment';

const MOD_TITLE = "Входящие заказы";
const MODE_HELP_ID = "/help/request";
const CONTOUR = CONTOUR_DOCUMENTS;
const MODULE = MODULE_REQUEST;

// Сущность (в CamelCase)
const ENTITY = "Request";
const ID_NAME = ENTITY.charAt(0).toLowerCase() + ENTITY.slice(1) + "Id"
// URI для использования формой со списком (текущей) и формой добавления/изменения
const URI_FOR_GET_LIST = "tentorium/documents/requestin/request/getlist";
const URI_FOR_GET_ONE = "tentorium/documents/requestin/request/get";
const URI_FOR_SAVE = "tentorium/documents/requestin/request/save";
const URI_FOR_DELETE = "tentorium/documents/requestin/request/delete";

// позиция в меню
// в subsystem - key верхнего меню
const MNU_SUBSYSTEM = CONTOUR.name;
const HREF_SUBSYSTEM = "/" + CONTOUR.name;
const NAME_SUBSYSTEM = CONTOUR.title;
// в menu - key бокового главного
const MNU_MENU = MODULE.name;
// в submenu - key бокового подменю (финальный пункт)
// его имя равно имени модуля
const MNU_SUMMENU = MODULE.name + ".sm2";
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
        disableQuickFilter: true,
        render: (_, record) => drawStatus(_, record)
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
    {
        title: 'Номер исх. заказа',
        dataIndex: 'requestoutNumber',
        sorter: true,
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
                <span style={{ display: "block", minWidth: "75px" }}>Заказчик</span>
                <DataLookup.Company key="customerId" style={{ minWidth: "500px" }} allowClear={true} />
                <Checkbox key="customerWithBranchFlag">С филиалами</Checkbox>
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

// дополнительные команды
// если меню нет, то и кнопки нет
const buildMenuCommand = (config, handleMenuClick) => {
    return <Menu onClick={handleMenuClick}>
        {buildPrintMenu(MODULE.name, config)}
    </Menu>
};

// обрабочик меню
const buildMenuHandler = (config) => {
    return (ev) => {
        console.log('click', ev);
    }
}

// меню для записи
const recordMenu = (config, record) => {
    config.moduleCode = "requestin";
    return <React.Fragment>
        {buildEntityPrintMenu(ENTITY, record, config)}
    </React.Fragment>
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
const RequestIn = (props) => {
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
    const [menuCommand] = React.useState(buildMenuCommand(buildMenuHandler({
        'topLayer': topLayer,
        'setTopLayer': setTopLayer,
        'form': form,
        'tableInterface': tableInterface,
        'destroyDialog': (dlgId) => {
            // нужно через timeout так как после вызова destroyDialog следуют обращения к state
            setTimeout(() => { setTopLayer([...topLayer.filter(c => c.props.id != dlgId)]) }, 100)
        }
    })));
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


    const callForm = React.useCallback((id) => {
        editorContext.id = id;
        editorContext.uriForGetOne = URI_FOR_GET_ONE;
        editorContext.uriForSave = URI_FOR_SAVE;
        setFormVisible(true);
    }, [editorContext])

    const changeStatusReserve = React.useCallback(() => {
        // Проверим что все выбранные заказы имеют статус из разрешенного набора статусов
        if (tableInterface.getSelectedRecords().filter(value => [STATUS_APPROVAL].indexOf(value.documentRealStatus) === -1).length > 0) {
            notification.error({ message: "В перечне выбранных заказов присутствует заказ с текущим статусом, отличным от статуса «На согласовании»" })
            return;
        }

        let ids = tableInterface.getSelectedRows();
        confirm(ids.length === 1 ? "Резервировать выбранный заказ?" : "Резервировать выбранные заказы?", () => {
            requestToAPI.post("tentorium/documents/requestin/request/reserve", {
                documentRealIds: ids
            })
                .then(() => {
                    tableInterface.refreshData();
                    notification.success({ message: ids.length === 1 ? "Заказ зарезервирован" : "Заказы зарезервированы" })
                })
                .catch(error => {
                    notification.error({
                        message: ids.length === 1 ? "Ошибка при резервировании заказа" : "Ошибка при резервировании заказов",
                        description: error.message
                    })
                })
        })
    }, [tableInterface])

    const changeStatusShipment = React.useCallback(() => {
        // Проверим что все выбранные заказы имеют статус из разрешенного набора статусов
        if (tableInterface.getSelectedRecords().filter(value => [STATUS_APPROVAL, STATUS_RESERVE].indexOf(value.documentRealStatus) === -1).length > 0) {
            notification.error({ message: "В перечне выбранных заказов присутствует заказ с текущим статусом, отличным от статусов «На согласовании»/«В резерве»" })
            return;
        }

        let ids = tableInterface.getSelectedRows();
        confirm(ids.length === 1 ? "Отгрузить выбранный заказ?" : "Отгрузить выбранные заказы?", () => {
            requestToAPI.post("tentorium/documents/requestin/request/shipment", {
                documentRealIds: ids
            })
                .then(() => {
                    tableInterface.refreshData();
                    notification.success({ message: ids.length === 1 ? "Заказ отгружен" : "Заказы отгружены" })
                })
                .catch(error => {
                    notification.error({
                        message: ids.length === 1 ? "Ошибка при отгрузке заказа" : "Ошибка при отгрузке заказов",
                        description: error.message
                    })
                })
        })
    }, [tableInterface])

    const createBy = React.useCallback(() => {
        editorContext.id = tableInterface.getSelectedRows();
        editorContext.uriForGetOne = "tentorium/documents/requestout/request/createby";
        editorContext.uriForSave = "tentorium/documents/requestout/request/save";
        setFormVisible(true);
    }, [editorContext, tableInterface])

    // тут формируются кнопки
    const buttons = [
        <Button key="changeStatusCanceled" onClick={() => changeStatusReserve()} icon={<ClockCircleOutlined />}
            disabled={tableInterface.isLoading() || tableInterface.getSelectedRows().length == 0}>Резервировать</Button>,
        <Button key="changeStatusApproval" onClick={() => changeStatusShipment()} icon={<ExclamationCircleOutlined />}
            disabled={tableInterface.isLoading() || tableInterface.getSelectedRows().length == 0}>Отгрузить</Button>,
        <Button key="createBy" onClick={() => createBy()} icon={<CopyOutlined />}
            disabled={tableInterface.isLoading() || tableInterface.getSelectedRows().length == 0}>Создать на основании</Button>,
        <Button key="refresh" onClick={() => tableInterface.refreshData()}>{BUTTON_REFRESH_LABEL}</Button>,
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

    const afterCreateBy = React.useCallback((values) => {
        requestToAPI.post("tentorium/documents/requestout/request/complete_createby", {
            requestOut: {
                number: values.documentRealNumber,
                id: values[ID_NAME]
            },
            requestInIds: tableInterface.getSelectedRows()
        })
            .then((response) => {
                // Обновим номер исх. заказа у выбранных записей
                let records = tableInterface.getSelectedRecords();
                records.forEach(value => {
                    value["requestoutNumber"] = values.documentRealNumber;
                    tableInterface.updateRecord(value);
                });
                setUpdateRecords([...updateRecords, records]);
            })
            .catch(error => {
                notification.error({
                    message: "Ошибка при связывании входящих заказов с исходящим",
                    description: error.message
                })
            })
    }, [tableInterface, updateRecords])

    return (
        <App subsystem={MNU_SUBSYSTEM} menu={MNU_MENU} submenu={MNU_SUMMENU}
            breadcrumb={[{ label: NAME_SUBSYSTEM, href: HREF_SUBSYSTEM }, { label: MOD_TITLE }]}
            afterLogin={forceUpdate}
            buttons={buttons}
            helpId={MODE_HELP_ID}>
            <div>
                <ModuleHeader
                    title={MOD_TITLE}
                    onSearch={value => {
                        tableInterface.requestParams.search = value;
                        tableInterface.refreshData();
                    }}
                    buttons={buttons}
                />
            </div>
            <div className="text">
                <FilterPanelExt onChange={(fc) => setFilters(fc)} initValues={initFilters}>
                    {buildFilters(statuses)}
                </FilterPanelExt>
            </div>
            <br />
            <DataTable className="mod-main-table"
                uri={{
                    forSelect: URI_FOR_GET_LIST,
                    forDelete: URI_FOR_DELETE
                }}
                columns={COLUMNS}
                defaultFilters={initFilters}
                autoRefresh={AUTO_REFRESH}
                editCallBack={(record) => callForm(record[ID_NAME])}
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
                    idName: ENTITY.charAt(0).toLowerCase() + ENTITY.slice(1) + "Id",
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
                    if (editorContext.uriForGetOne !== URI_FOR_GET_ONE) {
                        // Выведем сообщение о недоступных позициях заказа
                        if (response.positionsUnavailable && response.positionsUnavailable.length > 0) {
                            let text = [];
                            text.push(<span key={-1} style={{ display: "block" }}>
                                {"На " + moment(response.documentRealDate).format("DD.MM.yyyy") +
                                    " не доступны для заказа товары с наименованием и характеристикой:"}
                            </span>);
                            const sgoods = response.positionsUnavailable.map(value => value.sgood.title + ", " + value.characterCode);
                            [...new Set(sgoods)].forEach((value, index) => {
                                text.push(<span key={index} style={{ display: "block" }}>{(index + 1) + ") " + value}</span>);
                            })
                            notification.warning({ message: text, duration: 0 });
                        }
                        setTitle("Новый заказ");
                    } else {
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
                    }
                    setOnlyCloseButton([STATUS_DRAFT, STATUS_SHIPMENT, STATUS_ADOPTED_DISCREPANCIES, STATUS_ACCEPTED].indexOf(response.documentRealStatus) !== -1);
                }}
                title={title}
                onlyCloseButton={onlyCloseButton}
                beforeSave={(values) => {
                    if (typeof values["requestId"] === "object") {
                        values["requestId"] = undefined;
                    }
                    return values;
                }}
                afterSave={(response) => {
                    setFormVisible(false);
                    if (response) {
                        if (editorContext.uriForGetOne !== URI_FOR_GET_ONE) {
                            afterCreateBy(response);
                        } else if (!editorContext.id) {
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

export default withRouter(RequestIn);