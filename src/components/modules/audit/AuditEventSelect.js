import React from 'react';
import { Select } from 'antd';
import {EVENT_KINDS} from "../../lib/Const";

const { Option } = Select;


const AuditEventSelect = React.forwardRef((props, ref) => {
    const {...otherprops} = props;

    return <Select labelInValue
        mode="multiple"
        maxTagCount='responsive'
        ref={ref}
        {...otherprops}>
        {EVENT_KINDS.slice(1).map((name,idx)=><Option key={idx+1}>{name}</Option>)}        
    </Select>
});

export default AuditEventSelect;
