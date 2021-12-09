import React from 'react';
import PropTypes from 'prop-types';
import { Tree } from 'antd';
import { MSG_REQUEST_ERROR } from './Const';
import { notification } from 'antd';
import requestToAPI from "./Request";


const findTreeData = (root,id)=>{
    if(root.value==id) return root;
    const result = root.children.find(c=>!!findTreeData(c,id));
    if(result) return result;
    return;
}

const findByTitle = (root,mask,result)=>{
    if(root.title.toLowerCase().indexOf(mask.toLowerCase()) > -1) {
        result.push(root);
        let curr = root;
        while(curr.parent) {
            result.splice(0,0,curr.parent);
            curr = curr.parent;
        }
    }
    root.children.forEach(c => {
        c.parent = root;
        findByTitle(c,mask,result);
    });
}

const DataTree = React.forwardRef((props, ref) => {
    const { uri, rootElement,defaultValue, value, onChange, onSelect, ...treeprops } = props;
    let defaultValueItem;

    const [data, setData] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [currValue,setCurrValue] = React.useState([]);
    const [expandedKeys,setExpandedKeys]= React.useState([]);
    const [searchValue,setSearchValue]= React.useState();
    const [autoExpandParent,setAutoExpandParent] = React.useState(true);


    const refreshData = React.useCallback(() => {
        setLoading(true);
        requestToAPI.post(props.uri, {})
            .then(response => {
                setLoading(false);
                setData(response);
                setExpandedKeys([-1]);
            })
            .catch(error => {
                setLoading(false);
                // в случае ошибки
                setData([]);
                notification.error({
                    message: MSG_REQUEST_ERROR,
                    description: error.message
                })

            })
        // eslint-disable-next-line
    }, [props.uri])

    if (data === null) {
        setData([]);
        refreshData();
    }


    if (defaultValue) {
        if(data === null) {
            if(defaultValue instanceof Object && defaultValue['value'] != -1 ) {
                defaultValueItem = {value:defaultValue['value'],title:defaultValue['title']};
            } else {
                defaultValueItem = rootElement
            }
        } else {
            if(defaultValue instanceof Object) {
                defaultValueItem = defaultValue;
            } else {
                defaultValueItem = {value:defaultValue}
            }            
        }

    }

    const handleChange = React.useCallback((val, ev, jumpFlag) => {
        if(val.length==0) {
            return;
        }
        setCurrValue(val);
        if(onChange) {
          const obj = findTreeData(data[0],val)
          onChange(val,obj,jumpFlag);
        }
    },[data,onChange])

    const handleExpand = expandedKeys => {
        setExpandedKeys(expandedKeys);
        setAutoExpandParent(false);
    };

    if(props.interface) {
        props.interface.jump = (id)=>{
            setCurrValue([id]);
            handleChange([id],null,true);
        }

        props.interface.search = (val)=> {
            let items = [];
            if(val.length>3) {
                findByTitle(data[0],val,items);
            };
            const keys = items.map(itm=>itm.value);
            setExpandedKeys(keys);
            setSearchValue(val);
            setAutoExpandParent(false);
        }
    }


    return <Tree
        ref={ref}
        className="data-tree"
        loading={loading}
        selectedKeys={currValue}
        treeData={data || (defaultValueItem?[defaultValueItem]:[rootElement])}
        defaultExpandedKeys={defaultValueItem?[defaultValueItem.value]:undefined}
        defaultValue = {defaultValueItem?defaultValueItem.value:undefined}
        onSelect={handleChange}
        expandedKeys={expandedKeys}
        autoExpandParent={autoExpandParent}
        onExpand={handleExpand}
        filterTreeNode={(node)=>{
            if(!searchValue) return false;
            return node.title.toLowerCase().indexOf(searchValue.toLowerCase())>-1
        }}
        {...treeprops}
    />

});

DataTree.propTypes = {
    uri: PropTypes.string.isRequired,
    allowClear: PropTypes.bool,
    rootElement: PropTypes.object,
    defaultValue:PropTypes.oneOfType([PropTypes.object, PropTypes.number]),
    onChange:PropTypes.func,
    interface:PropTypes.object
}

DataTree.defaultProps = {
    style: { width: "100%" },
    showSearch: true,
    treeNodeFilterProp: "title"
}

DataTree.Subject = React.forwardRef((props, ref) => {
    const root = { title: "Объекты аналитического учета", value: -1 };
    return <DataTree ref={ref} uri={"refbooks/subject/subject/gettree"} rootElement={root} {...props} />
});

DataTree.SGood = React.forwardRef((props, ref) => {
    const root = { title: "ТМЦ", value: -1 };
    return <DataTree ref={ref} uri={"refbooks/sgood/sgood/gettree"} rootElement={root} {...props} />
});

export default DataTree;