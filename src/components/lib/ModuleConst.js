import { TeamOutlined, NotificationOutlined, DollarOutlined } from '@ant-design/icons';

// Контуры (в lowerCase)
export const CONTOUR_ADMIN = { name: "admin", title: "Администрирование", icon: <TeamOutlined /> };
export const CONTOUR_REFBOOKS = { name: "refbooks", title: "НСИ" };
export const CONTOUR_DOCUMENTS = { name: "documents", title: "Заказы" };
export const CONTOUR_PRICE = { name: "price", title: "Прайс-лист" };

export const CONTOURS = {
    "refbooks": "НСИ",
    //"documents": "Заказы",
    "admin": "Администрирование",
}

// Модули (в lowerCase)
// В контуре "Администрирование"
export const MODULE_CREDENTIAL = { name: "credential", title: "Учетные данные" };
export const MODULE_AUDIT = { name: "audit", title: "Аудит" };
export const MODULE_CONFIG = { name: "config", title: "Конфигуратор" };
// В контуре "НСИ"
export const MODULE_EDIZM = { name: "edizm", title: "Единицы измерения" };
export const MODULE_CAPCLASS = { name: "capclass", title: "Справочники" };
// В контуре "Тестовый контур"
export const MODULE_REQUEST = { name: "request", title: "Заказы", icon: <NotificationOutlined /> };
export const MODULE_PRICE = { name: "price", title: "Прайс-лист", icon: <DollarOutlined /> };

export const NONE = {};

export let MODULES = {};
MODULES[MODULE_CREDENTIAL.name] = MODULE_CREDENTIAL.title;
MODULES[MODULE_AUDIT.name] = MODULE_AUDIT.title;
MODULES[MODULE_CONFIG.name] = MODULE_CONFIG.title;
MODULES[MODULE_EDIZM.name] = MODULE_EDIZM.title;
MODULES[MODULE_CAPCLASS.name] = MODULE_CAPCLASS.title;
MODULES[MODULE_REQUEST.name] = MODULE_REQUEST.title;
MODULES[MODULE_PRICE.name] = MODULE_PRICE.title;

export const CONTOURS_WITH_MODULES = new Map([
    //[CONTOUR_REFBOOKS, [MODULE_EDIZM, MODULE_CAPCLASS]],
    [CONTOUR_DOCUMENTS, [MODULE_REQUEST]],
    [CONTOUR_PRICE, [MODULE_PRICE]],
    [CONTOUR_ADMIN, [MODULE_CREDENTIAL, MODULE_AUDIT, MODULE_CONFIG]],
]);