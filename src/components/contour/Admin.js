import React from 'react';
import App from '../App';
import ModuleHeader from "../lib/ModuleHeader";
import { CONTOUR_ADMIN } from "../lib/ModuleConst";

const Admin = (props) => {
    return (
        <App subsystem={CONTOUR_ADMIN.name} menu={'none'} submenu={'none'}
            breadcrumb={[{ label: CONTOUR_ADMIN.title }]}>
            <ModuleHeader title={CONTOUR_ADMIN.title} />
            <p>
                Управление системой
            </p>
        </App>
    )
}
export default Admin;