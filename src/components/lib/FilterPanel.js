import React from 'react';
import {Space} from 'antd';


const FilterPanel = (props)=>{
    const [config] = React.useState({});

    const changed = (key,val)=>{
        // искючения для checkbox. в val передается event
        if(typeof val === "object" && val.target.type=="checkbox") {
            val = val.target.checked;
        }    
        config[key] = val;
        props.onChange(config);
    }
    let allFilters =  props.children.props.children;
    if(!allFilters.length) {
        allFilters = [allFilters];
    }
    return (
        <Space className="filter-panel">
            {allFilters.map((c)=>React.cloneElement(c, {
                onChange: (value)=>changed(c.key,value),
                key:c.key
            }))}
        </Space>    
    )    
}

export default FilterPanel;
