import React from 'react';
import { Form } from 'antd';
import { FORM_ITEMS_LAYOUT } from "../../lib/Const";
import DataTransfer from "../../lib/DataTransfer";
import { buildURL, genDefParamsForGetAllList } from "../../lib/Utils";
import { CONTOUR_ADMIN, MODULE_CREDENTIAL } from "../../lib/ModuleConst";

export const ManageAccessRoleForm = (props) => {

    const readyForm = Object.keys(props.initialValues).length > 0;
    console.log("readyForm=", readyForm);

    return <Form
        {...FORM_ITEMS_LAYOUT}
        form={props.form}
        layout="horizontal"
        name="formManageAccessRole"
        onFieldsChange={props.onFieldsChange}
        initialValues={props.initialValues}>
        <Form.Item
            name="accessRoleIds"
            valuePropName="targetKeys"
        >
            <DataTransfer
                uri={buildURL(CONTOUR_ADMIN, MODULE_CREDENTIAL, "AccessRole") + "/getlist"}
                params={genDefParamsForGetAllList("accessRoleName")}
                onRender={item => item.accessRoleName}
                ready={readyForm}
            />
        </Form.Item>
    </Form>
}