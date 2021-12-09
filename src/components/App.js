import React from 'react';
import { useHistory } from "react-router-dom";

import '../resources/css/App.css';

import 'antd/dist/antd.css';
import { Layout, Menu, Button, Popover, Form, Drawer } from 'antd';
import {
    UserOutlined, AppstoreOutlined, LogoutOutlined,
    MenuOutlined, CloseOutlined, BankOutlined, ShopOutlined,
    QuestionCircleOutlined
} from '@ant-design/icons';
import { Link } from "react-router-dom";
import requestToAPI from "./lib/Request";
import { logout, restoreToken, userProps } from "./lib/LoginForm";
import logo from '../resources/images/logo.png';
import teg from '../resources/images/teg.png';
import {
    MODULE_CREDENTIAL, MODULE_AUDIT, MODULE_CONFIG,
    MODULE_EDIZM, MODULE_REQUEST,
    CONTOURS_WITH_MODULES, CONTOUR_ADMIN, CONTOUR_DOCUMENTS, MODULES, MODULE_PRICE
} from "./lib/ModuleConst";
import { ChangePasswordForm } from "./lib/ChangePasswordForm";
import { ShowModal } from "./lib/EditForm";
import { buildURL, buildMobileButtons, getCapClassTypeName, getItemFromLocalStorage } from "./lib/Utils";

import { DesktopOrTabletScreen, MobileScreen, setMobile } from './lib/Responsive'
import { useMediaQuery } from 'react-responsive'
import { RESOURCE_PRINTFORM, RESOURCE_NUMBERING, RESOURCE_ATTRIBUTE, RESOURCE_CONSTANT } from "./lib/CapResourceType";

const CONTOUR = CONTOUR_ADMIN;
const MODULE = MODULE_CREDENTIAL;
const ENTITY = "Proguser";

const URI_FOR_CHANGE_PSWD = buildURL(CONTOUR, MODULE, ENTITY) + "/changepswd";

const { SubMenu } = Menu;
const { Content, Sider } = Layout;

// здесь левое меню, в зависимости от subsystem
const getSubMenu = (sys, clsMenuName) => {
    // Получим список всех модулей выбранного контура
    let allModules = [];
    CONTOURS_WITH_MODULES.forEach((value, key) => {
        if (key.name === sys) {
            allModules.push(...value);
        }
    });
    // Получим список всех доступных пользовтелю модулей
    const modules = (JSON.parse(getItemFromLocalStorage("modules")) ?? []).map(value => value.applicationExe.toLowerCase());
    // Отфильтруем список модулей контура так, чтобы остались только доступные пользователю модули контура
    const allowModules = allModules.filter(value => modules.indexOf(value.name) !== -1);

    const clsmmenu = clsMenuName || "main-menu";

    let menuItems = [];
    let menuItemsAdmin = [];
    allowModules.forEach(value => {
        switch (value.name) {
            case MODULE_EDIZM.name:
                menuItems.push(
                    <Menu.Item className={clsmmenu} key={MODULE_EDIZM.name} icon={<AppstoreOutlined />}>
                        <Link to="/edizm">{MODULE_EDIZM.title}</Link>
                    </Menu.Item>
                );
                break;
            case MODULE_REQUEST.name:
                menuItems.push(
                    <SubMenu key={MODULE_REQUEST.name} title={MODULE_REQUEST.title} icon={MODULE_REQUEST.icon}>
                        <Menu.Item key={MODULE_REQUEST.name + ".sm1"} >
                            <Link to="/requestout">Исходящие заказы</Link>
                        </Menu.Item>
                        <Menu.Item key={MODULE_REQUEST.name + ".sm2"}>
                            <Link to="/requestin">Входящие заказы</Link>
                        </Menu.Item>
                        <Menu.Item key={MODULE_REQUEST.name + ".sm3"}>
                            <Link to="/testrequest">Заказы по реестрам ПВП</Link>
                        </Menu.Item>
                        <Menu.Item key={MODULE_REQUEST.name + ".sm4"}>
                            <Link to="/testrequest">Реестры заказов ПВП</Link>
                        </Menu.Item>
                        <SubMenu className={clsmmenu} key={MODULE_REQUEST.name + ".ref"} title="Справочники">
                            <Menu.Item key={MODULE_REQUEST.name + ".ref.137"}>
                                <Link to={"/capclass/137/" + CONTOUR_DOCUMENTS.name + "/" + MODULE_REQUEST.name}>{getCapClassTypeName(137)}</Link>
                            </Menu.Item>
                            <Menu.Item key={MODULE_REQUEST.name + ".ref.138"}>
                                <Link to={"/capclass/138/" + CONTOUR_DOCUMENTS.name + "/" + MODULE_REQUEST.name}>{getCapClassTypeName(138)}</Link>
                            </Menu.Item>
                        </SubMenu>
                    </SubMenu>
                );
                break;
            case MODULE_PRICE.name:
                menuItems.push(
                    <SubMenu key={MODULE_PRICE.name} title={MODULE_PRICE.title} icon={MODULE_PRICE.icon}>
                        {(userProps && userProps.parent) ?
                            <Menu.Item key={MODULE_PRICE.name + ".sm1"} >
                                <Link to="/pricesupplier">Прайс-лист поставщика</Link>
                            </Menu.Item> : ""}
                        <Menu.Item key={MODULE_PRICE.name + ".sm2"}>
                            <Link to="/price">Прайс-лист для реализации</Link>
                        </Menu.Item>
                    </SubMenu>
                );
                menuItems.push(
                    <Menu.Item key={"documentation"} icon={<QuestionCircleOutlined />} onClick={() => window.open('/doc.pdf')}>
                        Документация
                    </Menu.Item>
                )
                break;
            case MODULE_CREDENTIAL.name:
                menuItemsAdmin.push(
                    <SubMenu className={clsmmenu} key={MODULE_CREDENTIAL.name} title={MODULE_CREDENTIAL.title}>
                        <Menu.Item key={MODULE_CREDENTIAL.name + ".sm1"} >
                            <Link to="/proguser">Пользователи</Link>
                        </Menu.Item>
                        <Menu.Item key={MODULE_CREDENTIAL.name + ".sm2"} >
                            <Link to="/accessrole">Роли</Link>
                        </Menu.Item>
                        <Menu.Item key={MODULE_CREDENTIAL.name + ".sm3"} >
                            <Link to="/controlobject">Права</Link>
                        </Menu.Item>
                        <Menu.Item key={MODULE_CREDENTIAL.name + ".sm4"} >
                            <Link to="/applicationrole">Доступ к модулям</Link>
                        </Menu.Item>
                        <Menu.Item key={MODULE_CREDENTIAL.name + ".sm5"} >
                            <Link to="/capresourcerole">Доступ к ресурсам</Link>
                        </Menu.Item>
                    </SubMenu>
                );
                break;
            case MODULE_AUDIT.name:
                menuItemsAdmin.push(
                    <SubMenu className={clsmmenu} key={MODULE_AUDIT.name} title={MODULE_AUDIT.title}>
                        <Menu.Item key={MODULE_AUDIT.name + ".sm1"} >
                            <Link to="/audit">Просмотр логов</Link>
                        </Menu.Item>
                    </SubMenu>
                );
                break;
            case MODULE_CONFIG.name:
                menuItemsAdmin.push(
                    <>
                        <Menu.Item key={MODULE_CONFIG.name + ".sm1"} >
                            <Link to="/document">Документы</Link>
                        </Menu.Item>
                        <SubMenu className={clsmmenu} key={MODULE_CONFIG.name + ".resources"} title="Ресурсы">
                            <Menu.Item key={MODULE_CONFIG.name + ".cr" + RESOURCE_PRINTFORM}>
                                <Link to={"/capresource/" + RESOURCE_PRINTFORM}>Печатные формы</Link>
                            </Menu.Item>
                            <Menu.Item key={MODULE_CONFIG.name + ".cr" + RESOURCE_NUMBERING}>
                                <Link to={"/capresource/" + RESOURCE_NUMBERING}>Нумераторы</Link>
                            </Menu.Item>
                            <Menu.Item key={MODULE_CONFIG.name + ".cr" + RESOURCE_ATTRIBUTE}>
                                <Link to={"/capresource/" + RESOURCE_ATTRIBUTE}>Признаки</Link>
                            </Menu.Item>
                            <Menu.Item key={MODULE_CONFIG.name + ".cr" + RESOURCE_CONSTANT}>
                                <Link to={"/capresource/" + RESOURCE_CONSTANT}>Константы</Link>
                            </Menu.Item>
                        </SubMenu>
                    </>
                );
                break;
            default:
        }
    });
    if (menuItemsAdmin.length > 0) {
        menuItems.push(
            <SubMenu key={CONTOUR_ADMIN.name} title={CONTOUR_ADMIN.title} icon={CONTOUR_ADMIN.icon}>
                {menuItemsAdmin}
            </SubMenu>
        );
    }
    return menuItems;
}

const getUserInfo = () => (
    <span className="text-span-1">
        <Button className="user-dropdown-login" shape="circle" icon={<UserOutlined />} /> <span className="user-text-span">{requestToAPI.user ? requestToAPI.user.name : "(нет)"}</span>
    </span>);

let startFlag = false;

const App = (props) => {
    const [form] = Form.useForm();
    const [topLayer, setTopLayer] = React.useState([]);
    var [collapsed, setCollapse] = React.useState(props.defaultCollapsed);
    var [visibleUserPopover, setVisibleUserPopover] = React.useState(false);
    const [visibleMobileMenu, setVisibleMobileMenu] = React.useState(false);

    const history = useHistory();

    if (!startFlag) {
        restoreToken();
    }

    React.useEffect(() => {
        if (!startFlag) {
            if (!requestToAPI.token) {
                history.push("/");
            }
            startFlag = true;
        }
    });

    const changePassword = () => {
        setVisibleUserPopover(false);
        // тут можно размещать url для сохранения и загрузки
        // формируем диалог
        const dialog = ShowModal({
            form: form,
            title: "Сменить пароль пользователя",
            content: <ChangePasswordForm />,
            width: 688,
            editorContext: { id: requestToAPI.user.name, uriForSave: URI_FOR_CHANGE_PSWD },
            idName: "userName",
            destroyDialog: (dlgId) => {
                form.resetFields();
                setTopLayer([...topLayer.filter(c => c.props.id != dlgId)]);
            },
        });
        // вставляем Modal в top layer
        setTopLayer([dialog]);
    }

    const logoutCB = React.useCallback(() => {
        setVisibleUserPopover(false);
        logout(history, props.afterLogout);
    }, [setVisibleUserPopover, history, props.afterLogout])

    const userTitle = React.useCallback(() => {
        if (!requestToAPI.user) {
            return undefined;
        }
        return (
            <>
                <div style={{ padding: 16 }}>
                    <UserOutlined />
                    <span style={{ marginLeft: 8 }}>{requestToAPI.user.name}</span>
                </div>
                {(userProps && userProps.subject) ?
                    <div style={{ padding: 16, paddingTop: 8 }}>
                        <BankOutlined title="СЦ/ФСЦ, связанная с пользователем " />
                        <span style={{ marginLeft: 8 }}>{userProps.subject.subjectName}</span>
                    </div>
                    : ""}
                {(userProps && userProps.parent) ?
                    <div style={{ padding: 16, paddingTop: 8 }}>
                        <ShopOutlined title="Поставщик по умолчанию" />
                        <span style={{ marginLeft: 8 }}>{userProps.parent.subjectName}</span>
                    </div>
                    : ""}

            </>
        )
    }, [])

    const userContent = React.useCallback(() => {
        return <div>
            <li style={{ paddingBottom: 8 }}><Button key="changePassword" type="link" onClick={changePassword}>Сменить пароль</Button></li>
            <li><Button key="logout" type="link" icon={<LogoutOutlined />} onClick={logoutCB}>Выход</Button></li>
        </div>
        // eslint-disable-next-line
    }, [logoutCB])

    const getContours = () => {
        const modules = JSON.parse(getItemFromLocalStorage("modules"));
        const allowModules = (modules ?? []).map(value => {
            return value.applicationExe.toLowerCase();
        });
        const allowContours = [];
        CONTOURS_WITH_MODULES.forEach((value, key) => {
            const includingModules = value.map(value => {
                return allowModules.indexOf(value.name.toLowerCase()) !== -1 ? value.name.toLowerCase() : undefined;
            }).filter(value => value);
            if (includingModules.length > 0) {
                allowContours.push(key);
            }
        });
        return allowContours.map(value => {
            return (
                getSubMenu(value.name, "drawer-menu-item")
            )
        });
    }

    const isMobile = !useMediaQuery({ minWidth: 768 })
    setMobile(isMobile);

    const moduleName = MODULES[(typeof (props.menu) === "string" ? props.menu : props.menu[0])];
    document.title = moduleName ?? "АИС Web MLM";
    let defaultOpenKeys = Array.isArray(props.menu) ? props.menu : [props.menu];
    if ([MODULE_CREDENTIAL.name, MODULE_AUDIT.name, MODULE_CONFIG.name].indexOf(defaultOpenKeys[0]) !== -1) {
        if (MODULE_CONFIG.name == defaultOpenKeys[0]) {
            defaultOpenKeys.shift();
        }
        defaultOpenKeys.unshift(CONTOUR_ADMIN.name);
    }

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <DesktopOrTabletScreen>
                <Sider collapsible collapsed={collapsed} onCollapse={setCollapse} width="340px">
                    <Link to="/"><div className="logo"><img className="logo-long-img" src={logo} alt="" /><div className="teg"><img className="teg" src={teg} alt="" /><p>Web MLM</p></div></div></Link>
                    <Link to="/"><img src={logo} className="logo-img" alt="АИС Web MLM" /></Link>
                    <div>
                        <Menu
                            className="main-menu"
                            mode="inline"
                            defaultOpenKeys={defaultOpenKeys}
                            defaultSelectedKeys={props.submenu !== "none" ? [props.submenu] : (Array.isArray(props.menu) ? props.menu : [props.menu])}
                        >
                            {getContours(true)}
                        </Menu>
                        <hr />
                        <Popover visible={visibleUserPopover}
                            onVisibleChange={(value) => setVisibleUserPopover(value)}
                            placement="bottomLeft"
                            title={userTitle()}
                            content={userContent()} trigger="click">
                            <div className="user-container">
                                {getUserInfo()}
                            </div>
                        </Popover>
                    </div>
                </Sider>
            </DesktopOrTabletScreen>
            <MobileScreen>
                <Drawer
                    className="drawer-main-menu"
                    title={<div style={{ lineHeight: 2.0 }}>АИС Web MLM
                        <Button shape="circle" className="noborder align-right"
                            icon={<CloseOutlined />}
                            onClick={() => setVisibleMobileMenu(false)} /></div>
                    }
                    placement={"left"}
                    closable={false}
                    visible={visibleMobileMenu}
                    onClose={() => setVisibleMobileMenu(false)}
                >
                    <Menu mode="inline" defaultSelectedKeys={[props.subsystem]}>
                        {getContours(true)}
                    </Menu>
                    <hr />
                    <Popover visible={visibleUserPopover}
                        onVisibleChange={(value) => setVisibleUserPopover(value)}
                        placement="bottomLeft"
                        title={userTitle()}
                        content={userContent()} trigger="click">
                        <div className="user-container">
                            {getUserInfo()}
                        </div>
                    </Popover>
                </Drawer>
            </MobileScreen>
            <Layout className="site-layout">
                <MobileScreen>
                    <div className="mob-button-panel">
                        <Button className="main-menu-drawer-open" shape="circle"
                            icon={<MenuOutlined />}
                            onClick={() => setVisibleMobileMenu(true)} />
                        {buildMobileButtons(props.buttons)}
                    </div>
                </MobileScreen>
                <Content>
                    <div className="site-layout-workspace">
                        {props.children}
                    </div>
                </Content>
            </Layout>
            {topLayer.map(item => item)}
        </Layout>
    );
}


export default App;