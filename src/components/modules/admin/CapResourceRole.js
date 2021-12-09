import React from 'react';
import { Button, Menu, Dropdown, notification, Form, Select } from 'antd';
import DataTable from "../../lib/DataTable";
import App from '../../App';
import ModuleHeader from "../../lib/ModuleHeader";
import { FilterPanelExt, Primary } from "../../lib/FilterPanelExt";
import { FilterButton } from '../../lib/FilterButton';
import { withRouter } from "react-router";
import { BUTTON_REFRESH_LABEL, DEFAULT_TABLE_CONTEXT } from "../../lib/Const";
import { MoreOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { drawBoolIcon, buildURL } from "../../lib/Utils";
import { CONTOUR_ADMIN, MODULE_CREDENTIAL } from "../../lib/ModuleConst"
import DataSelect from "../../lib/DataSelect";
import { confirm } from "../../lib/Dialogs";
import { format } from 'react-string-format';
import requestToAPI from "../../lib/Request";
import { buildPrintMenu, buildEntityPrintMenu } from '../../lib/stddialogs/PrintDialog';
import { responsiveMobileColumn, isMobile } from '../../lib/Responsive';
import { resourceTypeList } from "../../lib/CapResourceType";

const { Option } = Select;

const MOD_TITLE = "Доступ к ресурсам";
const MODE_HELP_ID = "/help/capresourcerole";
const CONTOUR = CONTOUR_ADMIN;
const MODULE = MODULE_CREDENTIAL;

// Сущность (в CamelCase)
// const ENTITY = "Capresourcerole";
const ENTITY = "ArtifactRole";
// URI для использования формой со списком (текущей) и формой добавления/изменения
const URI_FOR_GET_LIST = buildURL(CONTOUR, MODULE, ENTITY) + "/getlist";
const URI_FOR_ALLOW = buildURL(CONTOUR, MODULE, ENTITY) + "/allow";
const URI_FOR_DENY = buildURL(CONTOUR, MODULE, ENTITY) + "/drop";

// позиция в меню
// в subsystem - key верхнего меню
const MNU_SUBSYSTEM = CONTOUR.name;
const HREF_SUBSYSTEM = "/" + CONTOUR.name;
const NAME_SUBSYSTEM = CONTOUR.title;
// в menu - key бокового главного
const MNU_MENU = MODULE.name;
const NAME_MENU = MODULE.title;
// в submenu - key бокового подменю (финальный пункт)
// его имя равно имени модуля
const MNU_SUMMENU = MODULE.name + ".sm5";
// автоматическое обновление при монтировании компонента
const AUTO_REFRESH = true;

// колонки в таблице
const COLUMNS = [
    {
        title: 'Код',
        dataIndex: 'artifactCode',
        sorter: true,
        ellipsis: true,
        width: "120px",
        responsive: responsiveMobileColumn()
    },
    {
        title: 'Наименование',
        dataIndex: 'artifactName',
        sorter: true,
        ellipsis: true,
        defaultSortOrder: 'ascend',
    },
    {
        title: 'Тип',
        dataIndex: 'resourceTypeName',
        sorter: true,
        ellipsis: true,
        width: "200px",
        responsive: responsiveMobileColumn()
    },
    {
        title: 'Доступ',
        dataIndex: 'roleAllowFlag',
        sorter: true,
        render: drawBoolIcon,
        width: "80px",
    }
]

// Создание компонент для фильтров
// key это уникальное имя фильтра, попадает в REST API
const buildFilters = () => {
    return <React.Fragment>
        <Primary>
            <span>Роль</span>
            <DataSelect key="accessRoleId"
                // необязательный, используется, например, в кэше
                // componentName={MODULE.name + ".filterAccessRoleId"}
                uri={buildURL(CONTOUR, MODULE, "AccessRole") + "/getlist"}
                params={{
                    "pagination": {
                        "current": 1,
                        "pageSize": -1
                    },
                    "sort": [
                        {
                            "field": "accessRoleName",
                            "order": "ascend"
                        }
                    ]
                }}
                valueName="accessRoleId"
                displayValueName="accessRoleName"
                // пример включения долговременного кэша
                // cacheType={CacheTypes.LocalStorage}
                style={{ width: 240 }}
                allowClear={false} />
            <span>Тип</span>
            <Select key="resourceTypeId" style={{ width: 160 }} allowClear={true}>
                {resourceTypeList.map(value => <Option key={value.id} value={value.id}>{value.title}</Option>)}
            </Select>
        </Primary>
    </React.Fragment>
}
// начальное значение фильтров
// если значение фильра не объект, а простое значение,
// то значение имени свойства компонента принимается как defaultValue компонента
const initFilters = {
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
const recordMenu = (config, record) => (
    <React.Fragment>
        {buildEntityPrintMenu(ENTITY, record, config)}
    </React.Fragment>
)

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
const CapResourceRole = (props) => {
    const [topLayer, setTopLayer] = React.useState([]);
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


    const setFilters = React.useCallback((config) => {
        tableInterface.requestParams.filters = config;
        tableInterface.refreshData();
    }, [tableInterface])

    const allowAccess = React.useCallback(() => {
        let ids = tableInterface.getSelectedRows().join(',');
        confirm(format("Предоставить доступ на выбранные {0} ресурсы?", tableInterface.getSelectedRows().length), () => {
            requestToAPI.post(URI_FOR_ALLOW, {
                accessRoleId: tableInterface.requestParams.filters["accessRoleId"],
                artifactIds: ids.split(",")
            })
                .then(() => {
                    tableInterface.refreshData();
                    notification.success({ message: "Доступ предоставлен" })
                })
                .catch(error => {
                    notification.error({
                        message: "Ошибка при предоставлении доступа",
                        description: error.message
                    })
                })
        })
    }, [tableInterface])

    const denyAccess = React.useCallback(() => {
        let ids = tableInterface.getSelectedRows().join(',');
        confirm(format("Запретить доступ на выбранные {0} ресурсы?", tableInterface.getSelectedRows().length), () => {
            requestToAPI.post(URI_FOR_DENY, {
                accessRoleId: tableInterface.requestParams.filters["accessRoleId"],
                artifactIds: ids.split(",")
            })
                .then(() => {
                    tableInterface.refreshData();
                    notification.success({ message: "Доступ запрещен" })
                })
                .catch(error => {
                    notification.error({
                        message: "Ошибка при запрещении доступа",
                        description: error.message
                    })
                })
        })
    }, [tableInterface])

    // тут формируются кнопки
    const buttons = [
        <Button key="refresh" onClick={() => tableInterface.refreshData()}>{BUTTON_REFRESH_LABEL}</Button>,
        <Button key="allow" onClick={() => allowAccess()} icon={<EyeOutlined />}
            disabled={tableInterface.isLoading() || tableInterface.getSelectedRows().length == 0}>Предоставить доступ</Button>,
        <Button key="deny" onClick={() => denyAccess()} icon={<EyeInvisibleOutlined />}
            disabled={tableInterface.isLoading() || tableInterface.getSelectedRows().length == 0}>Запретить доступ</Button>
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
            breadcrumb={[{ label: NAME_SUBSYSTEM, href: HREF_SUBSYSTEM }, { label: NAME_MENU }, { label: MOD_TITLE }]}
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
            <DataTable className="mod-main-table"
                uri={{
                    forSelect: URI_FOR_GET_LIST
                }}
                columns={COLUMNS}
                autoRefresh={AUTO_REFRESH}
                editCallBack={() => { }}
                interface={tableInterface}
                onSelectedChange={() => forceUpdate()}
                onBeforeRefresh={() => tableInterface.requestParams.filters["accessRoleId"] !== undefined}
                onAfterRefresh={() => setUpdateRecords([])}
                updateRecords={updateRecords}
                recordMenu={recordMenu}
                idName="artifactId"
            />
            {topLayer.map(item => item)}
        </App>
    )
}

export default withRouter(CapResourceRole);