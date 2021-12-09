import React from 'react';
import App from './App';
import ModuleHeader from "./lib/ModuleHeader";
import { withRouter } from "react-router";

const MOD_TITLE = "Кратная справка";

const Error = (props)=>{
  return (
          <App  subsystem={'none'} menu={'none'} submenu={'none'}>
            <ModuleHeader title={MOD_TITLE}/>
              <p>Здесь система помощи. Запрашивается топик {props.location.pathname}</p>
          </App>
  )
}
export default withRouter(Error);
