import React from 'react';
import { Button, Menu, Dropdown, Checkbox, Form } from 'antd';
import DataTable from "../../lib/DataTable";
import App from '../../App';
import ModuleHeader from "../../lib/ModuleHeader";
import { FilterPanelExt, Primary } from "../../lib/FilterPanelExt";
import { FilterButton } from '../../lib/FilterButton';
import { withRouter } from "react-router";
import { BUTTON_ADD_LABEL, BUTTON_DEL_LABEL, BUTTON_REFRESH_LABEL, DEFAULT_TABLE_CONTEXT } from "../../lib/Const";
import { MoreOutlined } from '@ant-design/icons';
import { drawBoolIcon, buildURL } from "../../lib/Utils";
import EditForm from "../../lib/EditForm";
import EdizmForm from "./EdizmForm";
import { CONTOUR_REFBOOKS, MODULE_EDIZM } from "../../lib/ModuleConst"
import { buildPrintMenu, buildEntityPrintMenu } from '../../lib/stddialogs/PrintDialog';
import { responsiveMobileColumn, isMobile } from '../../lib/Responsive';

const MOD_TITLE = "Единицы измерения";
const MODE_HELP_ID = "/help/edizm";
const CONTOUR = CONTOUR_REFBOOKS;
const MODULE = MODULE_EDIZM;

// Сущность (в CamelCase)
const ENTITY = "Edizm";
// URI для использования формой со списком (текущей) и формой добавления/изменения
const URI_FOR_GET_LIST = buildURL(CONTOUR, MODULE, ENTITY) + "/getlist";
const URI_FOR_GET_ONE = buildURL(CONTOUR, MODULE, ENTITY) + "/get";
const URI_FOR_SAVE = buildURL(CONTOUR, MODULE, ENTITY) + "/save";
const URI_FOR_DELETE = buildURL(CONTOUR, MODULE, ENTITY) + "/delete";

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
// const MNU_SUMMENU = MODULE.name + ".sm1";
const MNU_SUMMENU = "none";
// автоматическое обновление при монтировании компонента
const AUTO_REFRESH = true;

// колонки в таблице
const COLUMNS = [
    {
        title: 'Код',
        dataIndex: 'edizmCode',
        sorter: true,
        defaultSortOrder: "ascend",
    },
    {
        title: 'Обозначение',
        dataIndex: 'edizmNotation',
        sorter: true,
    },
    {
        title: 'Наименование',
        ellipsis: true,
        dataIndex: 'edizmName',
        sorter: true,
        responsive: responsiveMobileColumn()
    },
    {
        title: 'Блокировка',
        dataIndex: 'edizmBlockFlag',
        render: drawBoolIcon,
        sorter: true,
        responsive: responsiveMobileColumn()
    },
]

// Уникальный идентификатор формы редактировавания
const EDIT_FORM_ID = ENTITY.toLowerCase() + "-frm";
// Форма для редактирования
const buildForm = (form) => {
    return <EdizmForm form={form} initialValues={{}} />
}
// размер формы, -1 - по умолчанию, FORM_MAX_WIDTH - максимальная ширина
const FORM_WIDTH = -1;

// Создание компонент для фильтров
// key это уникальное имя фильтра, попадает в REST API
const buildFilters = () => {
    return <React.Fragment>
        <Primary>
            {/* <span>Измерение</span>
      <DataSelect key="measureunit"
        // необязательный, используется, например, в кэше
        componentName="edizm.filterMeasureUnit"
        //uri={MEASURE_UNITS}
        displayValueName="measureunitName"
        // пример включения долговременного кэша
        cacheType={CacheTypes.LocalStorage}
        style={{ width: 240 }}
        allowClear={true} /> */}
            <Checkbox key="onlyNotBlock">Не показывать заблокированные</Checkbox>
        </Primary>
        {/* <span>Интервал дат</span>
    <DateInputRange key="exampleRange" />
    <span>Дата</span>
    <DateInput key="exampleDate" /> */}
    </React.Fragment>
}
// начальное значение фильтров
// если значение фильра не объект, а простое значение, 
// то имя свойства компонента принимается defaultValue
const initFilters = {
    // сложный фильтр, задает имя свойства с помощью 
    // которого CheckBox устанавливает начальное значение
    onlyNotBlock: {
        propInitName: "defaultChecked",
        initValue: 0
    },
    // сложный фильтр, задает имена свойств с помощью 
    // которого DataSelect устанавливает начальное значение
    // measureunit: {
    //   propInitName: "value,displayValue",
    //   initValue: "4, Расстояние"
    // },
    // exampleDate: moment().startOf('day'),
    // exampleRange: [moment().startOf('month'), moment().endOf('month')]
}

// дополнительные команды
// если меню нет, то и кнопки нет
const buildMenuCommand = (config, handleMenuClick) => {
    return <Menu onClick={handleMenuClick}>
        {buildPrintMenu(MODULE.name, config)}
        {/*        
        <Menu.Divider />
        <Menu.Item key="1">Список измерений...</Menu.Item>
        <Menu.Item key="2">Еще одна команда</Menu.Item>
*/}
    </Menu>
};

// обрабочик меню
const buildMenuHandler = (config) => {
    return (ev) => {
        console.log('click', ev);
        /*        
                switch (ev.key) {
                    case '1':
                        //TODO: Это пример
                        // обращение к контексту таблицы
                        console.log('selected rows count', config.tableInterface.getSelectedRows().length)
                        // тут можно размещать url для сохранения и загрузки
                        config.editorContext = {}
                        // формируем диалог
                        const dialog = ShowModal({
                            ...config,
                            title: "Список измерений",
                            content: <SampleForm />
                        });
                        // вставляем Modal в top layer
                        config.setTopLayer([...config.topLayer, dialog])
                        break;
        
                    default:
                        break;
                }
        */
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
const Edizm = (props) => {
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
                    forSelect: URI_FOR_GET_LIST,
                    forDelete: URI_FOR_DELETE
                }}
                columns={COLUMNS}
                autoRefresh={AUTO_REFRESH}
                editCallBack={(record) => callForm(record.edizmId)}
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
                idName={ENTITY.charAt(0).toLowerCase() + ENTITY.slice(1) + "Id"}
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
                idName={ENTITY.charAt(0).toLowerCase() + ENTITY.slice(1) + "Id"}
            >
                {buildForm(form)}
            </EditForm>
            {topLayer.map(item => item)}
        </App>
    )
}
export default withRouter(Edizm);