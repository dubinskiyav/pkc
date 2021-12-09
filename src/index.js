import React from 'react';
import ReactDOM from 'react-dom';

import Main from './components/modules/Main';
import Edizm from './components/modules/edizm/Edizm';
import ReferenceBooks from "./components/contour/ReferenceBooks";
import Error from "./components/Error";
import Help from "./components/Help";
import Admin from "./components/contour/Admin";
import ProgUser from "./components/modules/admin/ProgUser";
import AccessRole from "./components/modules/admin/AccessRole";
import ControlObject from "./components/modules/admin/ControlObject";
import ApplicationRole from "./components/modules/admin/ApplicationRole";
import CapResourceRole from "./components/modules/admin/CapResourceRole";
import Audit from "./components/modules/audit/Audit";
import Document from "./components/modules/resource/Document";
import CapResource from "./components/modules/resource/CapResource";
import RecoveryPassword from "./components/lib/RecoveryPassword";
import TestRequest from "./components/modules/request/TestRequest";

import { MSG_PAGENOTFOUND, DEFAULT_DATE_FORMAT } from "./components/lib/Const";

import './resources/css/theme.less';
import './resources/css/index.css';

import { ConfigProvider } from 'antd';
import ruRU from 'antd/lib/locale/ru_RU';
import moment from 'moment';
import 'moment/locale/ru';

import { Route } from 'react-router';
import { BrowserRouter, Switch } from "react-router-dom";
import CapClass from './components/lib/CapClass';
import RequestOut from './components/modules/request/RequestOut';
import RequestIn from './components/modules/request/RequestIn';
import Price from './components/modules/price/Price';
import PriceSupplier from './components/modules/price/PriceSupplier';


document.documentElement.lang = 'ru';
moment.locale('ru');
moment().format(DEFAULT_DATE_FORMAT);

const validateMessages = {
    required: "Необходимо определить '${label}'",// eslint-disable-line
    string: {
        max: "Длина '${label}' не может быть больше ${max}"// eslint-disable-line
    }

};
console.log("environment=", process.env);

ReactDOM.render(
    <ConfigProvider locale={ruRU} form={{ validateMessages }}>
        <BrowserRouter>
            <Switch>
                <Route exact path='/'><Main /></Route>
                <Route exact path='/edizm'><Edizm /></Route>
                <Route exact path='/refbooks'><ReferenceBooks /></Route>
                {/* Контур Администрирование */}
                <Route exact path='/admin'><Admin /></Route>
                <Route exact path='/proguser'><ProgUser /></Route>
                <Route exact path='/accessrole'><AccessRole /></Route>
                <Route exact path='/controlobject'><ControlObject /></Route>
                <Route exact path='/applicationrole'><ApplicationRole /></Route>
                <Route exact path='/capresourcerole'><CapResourceRole /></Route>
                {/* Аудит */}
                <Route exact path='/audit'><Audit /></Route>
                {/* Конфигуратор */}
                <Route exact path='/document'><Document /></Route>
                <Route path='/capresource/:resourceTypeId'><CapResource /></Route>
                {/* Тестовый контур */}
                <Route exact path='/requestout'><RequestOut /></Route>
                <Route exact path='/requestin'><RequestIn /></Route>
                <Route exact path='/testrequest'><TestRequest /></Route>
                {/* Прайс-лист */}
                <Route exact path='/price'><Price /></Route>
                <Route exact path='/pricesupplier'><PriceSupplier /></Route>

                <Route path='/help'><Help /></Route>
                <Route path='/recovery/:key'><RecoveryPassword /></Route>
                <Route path='/capclass/:capClassTypeId/:contourName/:moduleName'><CapClass /></Route>
                <Route><Error text={MSG_PAGENOTFOUND} helpId="/help/pagenotfound" /></Route>
            </Switch>
        </BrowserRouter>
    </ConfigProvider>
    , document.getElementById('root')
);