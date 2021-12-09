import React from 'react';
import { Table, Modal } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { Tabs } from 'antd';

const { TabPane } = Tabs;


export const showPropertyDialog = (record, columns,tableInterface) => {
    const data = Object.keys(record).map(k => {
        const col = columns.find(c => c.dataIndex == k);
        return {
            key: k,
            dataIndex: k,
            visible: col != null,
            name: (col || {}).title,
            value: record[k]
        }
    })
    const tableprop = tableInterface.getProperties();
    Modal.info({
        centered:true,
        title: 'Свойства таблицы',
        width: 600,
        content: (
            <Tabs defaultActiveKey="1">
                {tableprop.props.uri && tableprop.props.uri.forSelect && (
                    <TabPane tab="Общие" key="1">
                        <div>Точка доступа: <b>{tableprop.props.uri.forSelect}</b></div>
                    </TabPane>
                )}   
                <TabPane tab="Список полей" key="2">
                    <Table
                        pagination={{ pageSize: 5}}
                        columns={[
                            {
                                title: 'Программное имя',
                                dataIndex: 'dataIndex',
                                ellipsis:true
                            },
                            {
                                title: 'Видимость',
                                dataIndex: 'visible',
                                render: (data) => data ? <CheckOutlined /> : "",
                            },
                            {
                                title: 'Наименование',
                                dataIndex: 'name'
                            },
                            {
                                title: 'Значение',
                                dataIndex: 'value',
                                ellipsis:true
                            },
                        ]}
                        dataSource={data}
                    />

                </TabPane>
            </Tabs>

        )
    });
}