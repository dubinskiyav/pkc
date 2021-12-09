import React from 'react';
import App from '../App';
import DataLookup from '../lib/DataLookup';
import DataSelect from "../lib/DataSelect";
import DataTreeSelect from '../lib/DataTreeSelect';
import ModuleHeader from "../lib/ModuleHeader";
import { CONTOUR_REFBOOKS } from "../lib/ModuleConst";
import Numbering from "../lib/Numbering";
import { userProps } from '../lib/LoginForm';
import moment from 'moment';

const ReferenceBooks = (props) => {
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);
    return (
        <App subsystem={CONTOUR_REFBOOKS.name} menu={'none'} submenu={'none'}
            afterLogin={forceUpdate}
            breadcrumb={[{ label: CONTOUR_REFBOOKS.title }]}>
            <ModuleHeader title={CONTOUR_REFBOOKS.title} />
            <p>
                Общая информация о справочниках и т.д.
            </p>
            <DataTreeSelect.Subject value={{ value: 180, title: "Вид договора" }} onChange={(arg, obj) => console.log("args=", arg, obj)} />
            <p />
            <DataLookup.Subject defaultValue={{ subjectId: 161, subjectName: "Договор купли-продажи электроэнергии" }} />
            <p />
            <DataSelect.CapCodeSelect allowClear capCodeType={13} value={1301} displayValue={"Активный"} />
            <p />
            <Numbering docEntityName="invoice" params={{ year: 2021 }} />
            <p />
            <DataLookup.SGood params={{ priceType: 6, dateForPrice: moment().unix() * 1000, subjectId: userProps.parent.subjectId, attributes: [8039] }} />
            <p />
            <DataLookup.Address />
        </App>
    )
}

export default ReferenceBooks;