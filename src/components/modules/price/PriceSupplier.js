import React from 'react';
import { Button, Menu, Dropdown, Form, Checkbox } from 'antd';
import DataTable from "../../lib/DataTable";
import App from '../../App';
import ModuleHeader from "../../lib/ModuleHeader";
import { FilterPanelExt, Primary } from "../../lib/FilterPanelExt";
import { FilterButton } from '../../lib/FilterButton';
import { withRouter } from "react-router";
import { BUTTON_REFRESH_LABEL, DEFAULT_TABLE_CONTEXT } from "../../lib/Const";
import { MoreOutlined } from '@ant-design/icons';
import { drawDate, drawFloat, drawInt } from "../../lib/Utils";
import { CONTOUR_PRICE, MODULE_PRICE } from "../../lib/ModuleConst"
import { buildPrintMenu, buildEntityPrintMenu } from '../../lib/stddialogs/PrintDialog';
import { responsiveMobileColumn, isMobile } from '../../lib/Responsive';
import { userProps } from '../../lib/LoginForm';
import SplitterLayout from 'react-splitter-layout';
import DataTree from '../../lib/DataTree';
import DataSelectObj from '../../lib/DataSelectObj';

const MOD_TITLE = "Прайс-лист поставщика";
const MODE_HELP_ID = "/help/price";
const CONTOUR = CONTOUR_PRICE;
const MODULE = MODULE_PRICE;

// Сущность (в CamelCase)
const ENTITY = "SGoodPrice";
const ID_NAME = "priceId";
// URI для использования формой со списком (текущей) и формой добавления/изменения
const URI_FOR_GET_LIST = "refbooks/sgood/sgoodprice/getlist";

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
                params={{ selfOrProviderFlag: false }}
                valueName="id"
                displayValueName="value"
                style={{ width: "120px" }}
                allowClear={false}
                key="dateForPrice" />
            <Checkbox key="strictlyOnDate">Строго на дату</Checkbox>
        </Primary>
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
const PriceSupplier = (props) => {
    const [topLayer, setTopLayer] = React.useState([]);
    const [tableInterface] = React.useState(Object.assign({}, DEFAULT_TABLE_CONTEXT));
    const [form] = Form.useForm();
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);
    const [updateRecords, setUpdateRecords] = React.useState([]);

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
        tableInterface.requestParams.filters["subjectId"] = userProps.parent ? userProps.parent.subjectId : null;
        tableInterface.requestParams.filters["modeOfChoose"] = 1;
        tableInterface.requestParams.filters["considerBlocking"] = 1;
        tableInterface.requestParams.filters["customerId"] = userProps.subject ? userProps.subject.subjectId : null;
        tableInterface.refreshData();
    }, [tableInterface])

    // меню для записи
    const recordMenu = React.useCallback((config, record) => {
        config.moduleCode = "requestout";
        return <React.Fragment>
            {buildEntityPrintMenu(ENTITY, record, config)}
        </React.Fragment>
    }, []);

    // дополнительные команды
    // если меню нет, то и кнопки нет
    const buildMenuCommand = React.useCallback((config, handleMenuClick) => {
        return <Menu onClick={handleMenuClick}>
            {buildPrintMenu(MODULE.name, config)}
        </Menu>
    }, []);

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
    }, [form, tableInterface, topLayer, buildMenuCommand])

    // тут формируются кнопки
    const buttons = [
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
                        className="mod-main-tree" />
                </div>
                <div>
                    <DataTable className="mod-main-table"
                        uri={{
                            forSelect: URI_FOR_GET_LIST
                        }}
                        columns={COLUMNS}
                        defaultFilters={initFilters}
                        autoRefresh={AUTO_REFRESH}
                        interface={tableInterface}
                        onSelectedChange={() => forceUpdate()}
                        onAfterRefresh={() => setUpdateRecords([])}
                        onBeforeRefresh={() => {
                            if (!tableInterface.requestParams.filters.dateForPrice) {
                                return false;
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
                </div>
            </SplitterLayout>
            {topLayer.map(item => item)}
        </App>
    )
}

export default withRouter(PriceSupplier);