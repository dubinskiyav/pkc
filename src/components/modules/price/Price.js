import React from 'react';
import { Button, Menu, Dropdown, Form, notification, Checkbox } from 'antd';
import DataTable,{DEFAULT_PAGE_SIZE} from "../../lib/DataTable";
import App from '../../App';
import ModuleHeader from "../../lib/ModuleHeader";
import { FilterPanelExt, Primary } from "../../lib/FilterPanelExt";
import { FilterButton } from '../../lib/FilterButton';
import { withRouter } from "react-router";
import { BUTTON_REFRESH_LABEL, DEFAULT_TABLE_CONTEXT } from "../../lib/Const";
import { MoreOutlined, LockOutlined, UnlockOutlined, CopyOutlined, DeleteOutlined } from '@ant-design/icons';
import { drawDate, drawFloat, drawInt } from "../../lib/Utils";
import EditForm, { ShowModal } from "../../lib/EditForm";
import PriceForm from "./PriceForm";
import { CONTOUR_PRICE, MODULE_PRICE } from "../../lib/ModuleConst"
import { buildPrintMenu, buildEntityPrintMenu } from '../../lib/stddialogs/PrintDialog';
import { responsiveMobileColumn, isMobile } from '../../lib/Responsive';
import { userProps } from '../../lib/LoginForm';
import SplitterLayout from 'react-splitter-layout';
import DataTree from '../../lib/DataTree';
import DataSelectObj from '../../lib/DataSelectObj';
import requestToAPI from '../../lib/Request';
import { confirm } from '../../lib/Dialogs';
import PriceCopy from './PriceCopy';

const MOD_TITLE = "Прайс-лист для реализации";
const MODE_HELP_ID = "/help/price";
const CONTOUR = CONTOUR_PRICE;
const MODULE = MODULE_PRICE;

// Сущность (в CamelCase)
const ENTITY = "SGoodPrice";
const ID_NAME = "priceId";
// URI для использования формой со списком (текущей) и формой добавления/изменения
const URI_FOR_GET_LIST = "refbooks/sgood/sgoodprice/getlist";
const URI_FOR_GET_ONE = "refbooks/sgood/sgoodprice/get";
const URI_FOR_SAVE = "refbooks/sgood/sgoodprice/save";

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
    date: ["priceSgoodSubjectDate"]
}

// колонки в таблице
const COLUMNS = [
    {
        title: 'Хар-ка',
        dataIndex: 'characterCode',
        width: "70px"
    },
    {
        title: 'Наименование',
        dataIndex: 'sgoodName',
        sorter: true,
        ellipsis: true,
        defaultSortOrder: 'ascend'
    },
    {
        title: 'Цена',
        dataIndex: 'sgoodPrice',
        render: drawFloat,
        width: "90px"
    },
    {
        title: 'Баллы',
        dataIndex: 'points',
        render: drawInt,
        width: "60px"
    },
    {
        title: 'Примечание',
        dataIndex: 'sgoodDescription',
        sorter: true,
        ellipsis: true,
        responsive: responsiveMobileColumn()
    }
]

// Уникальный идентификатор формы редактировавания
const EDIT_FORM_ID = ENTITY.toLowerCase() + "-frm";
// Форма для редактирования
const buildForm = (form) => {
    return <PriceForm form={form} initialValues={{}} />
}
// размер формы, -1 - по умолчанию, FORM_MAX_WIDTH - максимальная ширина
const FORM_WIDTH = "500px";

const selectInterface = {};

// Создание компонент для фильтров
// key это уникальное имя фильтра, попадает в REST API
const buildFilters = () => {
    return <React.Fragment>
        <Primary>
            <span style={{ display: "block", minWidth: "75px" }}>Дата</span>
            <DataSelectObj
                uri={"refbooks/sgood/sgoodprice/getpricedates"}
                afterRefresh={response => {
                    let result = {};
                    result.result = response.map(value => {
                        return { id: value, value: drawDate(value) }
                    })
                    return result;
                }}
                params={{ selfOrProviderFlag: true }}
                valueName="id"
                displayValueName="value"
                style={{ width: "120px" }}
                allowClear={false}
                key="dateForPrice"
                interface={selectInterface} />
            <Checkbox key="strictlyOnDate">Строго на дату</Checkbox>
            <Checkbox key="considerBlocking">Не отображать заблокированные</Checkbox>
        </Primary>
        <span style={{ display: "block", minWidth: "75px" }}>Прайс-лист заказчика (ФСЦ)</span>
        <DataSelectObj
            uri={"refbooks/company/company/branches"}
            params={userProps.subject.subjectId}
            afterRefresh={response => { return { result: response } }}
            valueName="companyId"
            displayValueName="companyName"
            style={{ width: "350px" }}
            allowClear={true}
            key="customerId" />
    </React.Fragment>
}

// начальное значение фильтров
// если значение фильра не объект, а простое значение,
// то значение имени свойства компонента принимается как defaultValue компонента
const initFilters = {
    strictlyOnDate: {
        propInitName: "defaultChecked",
        initValue: 0
    },
    considerBlocking: {
        propInitName: "defaultChecked",
        initValue: 1
    },
    customerId: {
        initValue: undefined
    }
}

// обрабочик меню
const buildMenuHandler = (config) => {
    return (ev) => {
        console.log('click', ev);
    }
}

let treeCurrent = -1;

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
const Price = (props) => {
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
    const [pageSize,setPageSize] = React.useState(DEFAULT_PAGE_SIZE);

    const handleSelect = (selectedKeys) => {
        treeCurrent = selectedKeys[0];
        tableInterface.requestParams.filters["parentId"] = treeCurrent != -1 ? treeCurrent : 0;
        tableInterface.refreshData();
    }

    const setFilters = React.useCallback((config) => {
        tableInterface.requestParams.filters = config;
        tableInterface.requestParams.filters["parentId"] = treeCurrent != -1 ? treeCurrent : 0;
        tableInterface.requestParams.filters["priceType"] = 6;
        tableInterface.requestParams.filters["priceTypeForPoints"] = 9;
        tableInterface.requestParams.filters["subjectId"] = userProps.subject ? userProps.subject.subjectId : null;
        tableInterface.requestParams.filters["modeOfChoose"] = 0;
        if (typeof (tableInterface.requestParams.filters["customerId"]) === "object") {
            tableInterface.requestParams.filters["customerId"] = tableInterface.requestParams.filters["customerId"].value;
        }
        tableInterface.refreshData();
    }, [tableInterface])


    const callForm = React.useCallback((id) => {
        editorContext.id = id;
        setFormVisible(true);
    }, [editorContext])

    // меню для записи
    const recordMenu = React.useCallback((config, record) => {
        config.moduleCode = "requestout";
        return <React.Fragment>
            {buildEntityPrintMenu(ENTITY, record, config)}
        </React.Fragment>
    }, []);

    const del = React.useCallback(() => {
        confirm("Удалить весь прайс-лист на " + drawDate(tableInterface.requestParams.filters["dateForPrice"]) + "?", () => {
            requestToAPI.post("refbooks/sgood/sgoodprice/delete", {
                date: tableInterface.requestParams.filters["dateForPrice"],
                forCustomerId: tableInterface.requestParams.filters["customerId"]
            })
                .then(() => {
                    tableInterface.refreshData();
                    selectInterface.refreshData();
                    notification.success({ message: "Прайс-лист удален" })
                })
                .catch(error => {
                    notification.error({
                        message: "Ошибка при удалении прайс-листа",
                        description: error.message
                    })
                })
        })
    }, [tableInterface])

    // дополнительные команды
    // если меню нет, то и кнопки нет
    const buildMenuCommand = React.useCallback((config, handleMenuClick) => {
        return <Menu onClick={handleMenuClick}>
            {buildPrintMenu(MODULE.name, config)}
            <Menu.Item key="del" onClick={() => del()} icon={<DeleteOutlined />}
                disabled={!tableInterface.requestParams || !tableInterface.requestParams.filters
                    || tableInterface.requestParams.filters["dateForPrice"] === undefined}>Удалить весь прайс-лист</Menu.Item>
        </Menu>
    }, [tableInterface.requestParams, del]);

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
    const changeDateForPrice = !tableInterface.requestParams || !tableInterface.requestParams.filters
        || tableInterface.requestParams.filters["dateForPrice"] === undefined;
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
    }, [changeStatusCancelDisabled, form, tableInterface, topLayer, buildMenuCommand, changeDateForPrice])

    const lock = React.useCallback(() => {
        let ids = tableInterface.getSelectedRows();
        confirm(ids.length === 1 ? "Заблокировать выбранную цену?" : "Заблокировать выбранные цены?", () => {
            requestToAPI.post("refbooks/sgood/sgoodprice/lock", ids)
                .then(() => {
                    tableInterface.refreshData();
                    notification.success({ message: ids.length === 1 ? "Цена заблокирована" : "Цены заблокированы" })
                })
                .catch(error => {
                    notification.error({
                        message: ids.length === 1 ? "Ошибка при блокировании цены" : "Ошибка при блокировании цен",
                        description: error.message
                    })
                })
        })
    }, [tableInterface])

    const unlock = React.useCallback(() => {
        let ids = tableInterface.getSelectedRows();
        confirm(ids.length === 1 ? "Разблокировать выбранную цену?" : "Разблокировать выбранные цены?", () => {
            requestToAPI.post("refbooks/sgood/sgoodprice/unlock", ids)
                .then(() => {
                    tableInterface.refreshData();
                    notification.success({ message: ids.length === 1 ? "Цена разблокирована" : "Цены разблокированы" })
                })
                .catch(error => {
                    notification.error({
                        message: ids.length === 1 ? "Ошибка при разблокировании цены" : "Ошибка при разблокировании цен",
                        description: error.message
                    })
                })
        })
    }, [tableInterface])

    const copy = React.useCallback(() => {
        const config = {
            'topLayer': topLayer,
            'setTopLayer': setTopLayer,
            'form': form,
            'tableInterface': tableInterface,
            'destroyDialog': (dlgId) => {
                // нужно через timeout так как после вызова destroyDialog следуют обращения к state
                setTimeout(() => { setTopLayer([...topLayer.filter(c => c.props.id != dlgId)]) }, 100)
            }
        };
        // тут можно размещать url для сохранения и загрузки
        config.editorContext = {
            uriForSave: "refbooks/sgood/sgoodprice/copy",
            record: { destDate: undefined }, // TODO destDate после копирования остается заполненным и не сбрасывается, нужно разбираться с EditForm
        }
        // формируем диалог
        const dialog = ShowModal({
            ...config,
            title: "Копирование прайс-листа",
            width: "600px",
            saveButtonTitle: "Копировать",
            afterSave: () => {
                notification.success({ message: "Прайс-лист скопирован" })
                tableInterface.refreshData();
                selectInterface.refreshData();
            },
            convertors: {
                date: ["destDate"],
                valueFromObject: ["sourceDate", "forCustomerId"]
            },
            content: <PriceCopy />
        });
        // вставляем Modal в top layer
        config.setTopLayer([...config.topLayer, dialog])
    }, [tableInterface, form, topLayer])

    // тут формируются кнопки
    const buttons = [
        <Button key="lock" onClick={() => lock()} icon={<LockOutlined />}
            disabled={tableInterface.isLoading() || tableInterface.getSelectedRows().length == 0}>Заблокировать</Button>,
        <Button key="unlock" onClick={() => unlock()} icon={<UnlockOutlined />}
            disabled={tableInterface.isLoading() || tableInterface.getSelectedRows().length == 0}>Разблокировать</Button>,
        <Button key="copy" onClick={() => copy()} icon={<CopyOutlined />}>Копировать прайс-лист</Button>,
        <Button key="refresh" onClick={() => tableInterface.refreshData()}>{BUTTON_REFRESH_LABEL}</Button>,
    ];
    if (menuCommand) {
        buttons.push(<Dropdown.Button key="more"
            className="more-dropbutton"
            trigger="click"
            overlay={menuCommand} icon={<MoreOutlined />} />);
    }
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
                {buildFilters()}
            </FilterPanelExt>
            <SplitterLayout primaryIndex={1} secondaryInitialSize={250} customClassName="mod-main-splitter">
                <div>
                    <DataTree.SGood
                        onChange={handleSelect}
                        style={{ paddingTop: 8 }}
                        className={"mod-main-tree tree-table-"+pageSize} />
                </div>
                <div>
                    <DataTable className="mod-main-table"
                        uri={{
                            forSelect: URI_FOR_GET_LIST
                        }}
                        columns={COLUMNS}
                        defaultFilters={initFilters}
                        autoRefresh={AUTO_REFRESH}
                        editCallBack={(record) => callForm(record[ID_NAME])}
                        interface={tableInterface}
                        onSelectedChange={() => forceUpdate()}
                        onAfterRefresh={() => setUpdateRecords([])}
                        onBeforeRefresh={(requestParams) => {
                            if (!tableInterface.requestParams.filters.dateForPrice) {
                                return false;
                            }
                            setPageSize(requestParams.pagination.pageSize);                            
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
                        getRowClass={(record) => record["blockFlag"] == 1 ? " record-block-flag" : ""}
                    />
                </div>
            </SplitterLayout>
            <EditForm
                id={EDIT_FORM_ID}
                copyButtonFlag={false}
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
                {buildForm(form)}
            </EditForm>
            {topLayer.map(item => item)}
        </App>
    )
}

export default withRouter(Price);