import React from 'react';
import { Button, Menu, Dropdown, Form, InputNumber } from 'antd';
import DataTable from "../../lib/DataTable";
import App from '../../App';
import ModuleHeader from "../../lib/ModuleHeader";
import { FilterPanelExt, Primary } from "../../lib/FilterPanelExt";
import { FilterButton } from '../../lib/FilterButton';
import { withRouter } from "react-router";
import {
    BUTTON_REFRESH_LABEL, DEFAULT_TABLE_CONTEXT,
    EVENT_KINDS
} from "../../lib/Const";
import { MoreOutlined } from '@ant-design/icons';
import { buildURL, drawDate } from "../../lib/Utils";
import EditForm from "../../lib/EditForm";
import { CONTOUR_ADMIN, MODULE_AUDIT } from "../../lib/ModuleConst"
import { buildPrintMenu, buildEntityPrintMenu } from '../../lib/stddialogs/PrintDialog';
import AuditForm from './AuditForm';
import { DateInputRange } from '../../lib/DateInput';
import DataLookup from '../../lib/DataLookup';
import moment from 'moment';
import 'moment-duration-format';
import AuditEventSelect from './AuditEventSelect';
import { responsiveMobileColumn, isMobile } from '../../lib/Responsive';


const MOD_TITLE = "Просмотр логов";
const MODE_HELP_ID = "/help/audit";
const CONTOUR = CONTOUR_ADMIN;
const MODULE = MODULE_AUDIT;

// Сущность (в CamelCase)
const ENTITY = "Log";
// URI для использования формой со списком (текущей) и формой добавления/изменения
const URI_FOR_GET_LIST = buildURL(CONTOUR, MODULE, ENTITY) + "/getlist";
const URI_FOR_GET_ONE = buildURL(CONTOUR, MODULE, ENTITY) + "/get";

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
const MNU_SUMMENU = MODULE.name + ".sm1";
// автоматическое обновление при монтировании компонента
const AUTO_REFRESH = true;


// колонки в таблице
const COLUMNS = [
    {
        title: 'Дата/Время',
        dataIndex: 'datetime',
        sorter: false,
        defaultSortOrder: "descend",
        render: (data) => <div>{moment(data).format("DD.MM.YYYY")}<br />
            {moment(data).format("H:mm:ss.SSS")}</div>,
        renderForFilter: drawDate,
    },
    {
        title: 'Событие',
        dataIndex: 'kind',
        ellipsis: true,
        sorter: false,
        render: (data) => EVENT_KINDS[data],
    },
    {
        title: 'Сущность/ Идентификатор',
        ellipsis: true,
        dataIndex: 'entity',
        sorter: false,
        render: (data, rec) => <div>{data ? data : "-"}<br />{rec.idValue ? " Id: " + rec.idValue[0] : ""}</div>,
        responsive: responsiveMobileColumn()
    },
    {
        title: 'Пользователь',
        dataIndex: 'proguser',
        ellipsis: true,
        sorter: false,
        render: (data) => data ? data.proguserName : "-",
        responsive: responsiveMobileColumn()
    },
    {
        title: 'Адрес',
        dataIndex: 'path',
        ellipsis: true,
        sorter: false,
        responsive: responsiveMobileColumn()
    },
    {
        title: 'Время выполнения',
        dataIndex: 'duration',
        sorter: false,
        render: (data) => {
            return moment.duration(data).format("hh [час] mm [мин] ss [сек] S [мсек]")
        },
        responsive: responsiveMobileColumn()
    },
]

// Уникальный идентификатор формы редактировавания
const EDIT_FORM_ID = ENTITY.toLowerCase() + "-frm";
// Форма для редактирования
const buildForm = (form) => {
    return <AuditForm form={form} initialValues={{}} />
}
// размер формы, -1 - по умолчанию, FORM_MAX_WIDTH - максимальная ширина
const FORM_WIDTH = isMobile() ? -1 : "50%";

// Создание компонент для фильтров
// key это уникальное имя фильтра, попадает в REST API
const buildFilters = () => {
    return <React.Fragment>
        <Primary>
            <DateInputRange key="dateRange" allowClear={false} />
            <span>Пользователь:</span>
            <DataLookup.ProgUser key="proguserId" style={{ width: 280 }} allowClear={true} />
        </Primary>
        <span>События:</span>
        <AuditEventSelect key="kinds" allowClear={true} style={{ width: 280 }} />
        <span>Идентификатор:</span>
        <InputNumber key="idValue" style={{ width: 80 }} />
        <span>Выполнение более (мсек):</span>
        <InputNumber key="duration" style={{ width: 80 }} />
    </React.Fragment>
}
// начальное значение фильтров
// если значение фильра не объект, а простое значение, 
// то имя свойства компонента принимается defaultValue
const initFilters = {
    dateRange: [moment().startOf('month'), moment().endOf('month')]
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
    }
}


// меню записи
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
const Audit = (props) => {
    let [formVisible, setFormVisible] = React.useState(false);
    const [topLayer, setTopLayer] = React.useState([]);
    let [editorContext] = React.useState({
        uriForGetOne: URI_FOR_GET_ONE
    });
    const [tableInterface] = React.useState(Object.assign({}, DEFAULT_TABLE_CONTEXT));
    const [form] = Form.useForm();
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);
    const [updateRecords, setUpdateRecords] = React.useState([]);
    const menuCommand = buildMenuCommand({ form: form, forceUpdateModule: forceUpdate }, buildMenuHandler({
        topLayer,
        setTopLayer,
        form,
        tableInterface,
        destroyDialog: (dlgId) => {
            setTopLayer([...topLayer.filter(c => c.props.id != dlgId)]);
        }
    }));


    const setFilters = React.useCallback((config) => {
        tableInterface.requestParams.filters = config;
        tableInterface.refreshData();
    }, [tableInterface])


    const callForm = React.useCallback((record) => {
        editorContext.id = {
            logId: record.logId,
            datetime: record.datetime
        };
        setFormVisible(true);
    }, [editorContext])

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
            breadcrumb={[{ label: NAME_SUBSYSTEM, href: HREF_SUBSYSTEM }, { label: NAME_MENU }, { label: MOD_TITLE }]}
            afterLogin={forceUpdate}
            buttons={buttons}
            helpId={MODE_HELP_ID}>
            <ModuleHeader
                title={MOD_TITLE}
                onSearch={value => {
                    tableInterface.requestParams.search = value ? value : undefined;
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
                defaultFilters={initFilters}
                autoRefresh={AUTO_REFRESH}
                editCallBack={(record) => callForm(record)}
                interface={tableInterface}
                onSelectedChange={() => forceUpdate()}
                onAfterRefresh={() => setUpdateRecords([])}
                updateRecords={updateRecords}
                recordMenu={(record) => recordMenu({
                    topLayer,
                    setTopLayer,
                    form,
                    tableInterface,
                    idName: ENTITY.charAt(0).toLowerCase() + ENTITY.slice(1) + "Id",
                    'destroyDialog': (dlgId) => {
                        // нужно через timeout так как после вызова destroyDialog следуют обращения к state
                        setTimeout(() => { setTopLayer([...topLayer.filter(c => c.props.id != dlgId)]) }, 100)
                    }
                }, record)}
                idName={"datetime"}
            />
            <EditForm
                id={EDIT_FORM_ID}
                title={"Запись лога"}
                visible={formVisible}
                form={form}
                width={FORM_WIDTH}
                editorContext={editorContext}
                afterSave={(response) => {
                    setFormVisible(false);
                }}
                afterCancel={() => {
                    setFormVisible(false);
                }}
                idName={ENTITY.charAt(0).toLowerCase() + ENTITY.slice(1) + "Id"}
            >
                {buildForm(form)}
            </EditForm>
            {topLayer.map(item => item)}
        </App>
    )
}
export default withRouter(Audit);