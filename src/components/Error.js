import React from 'react';
import App from './App';
import ModuleHeader from "./lib/ModuleHeader";

const MOD_TITLE = "Произошла ошибка";

const Error = (props)=>{
  return (
          <App  subsystem={'none'} menu={'none'} submenu={'none'}
                helpId={props.helpId}
          >
            <ModuleHeader title={MOD_TITLE}/>
              <p className="error">{props.text}</p>
          </App>
  )
}
export default Error;
