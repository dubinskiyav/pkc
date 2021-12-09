import React from 'react';
import App from '../App';
import ModuleHeader from "../lib/ModuleHeader";
import { CONTOUR_DOCUMENTS } from "../lib/ModuleConst";

const Documents = (props) => {
    return (
        <App subsystem={CONTOUR_DOCUMENTS.name} menu={'none'} submenu={'none'}
            breadcrumb={[{ label: CONTOUR_DOCUMENTS.title }]}>
            <ModuleHeader title={CONTOUR_DOCUMENTS.title} />
            <p>
                Тестовый контур
            </p>
        </App>
    )
}
export default Documents;