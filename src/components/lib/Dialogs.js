import React from 'react';
import { Modal, Input } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { resq$ } from 'resq';

/**
 * Диалог в двумя кнопками
 * @param {*} title 
 * @param {*} okClick 
 */
export const confirm = (title, okClick) => {
  Modal.confirm({
    title: title,
    centered: true,
    icon: <ExclamationCircleOutlined />,
    onOk: okClick
  });
}

/**
 * Диалог в полем ввода и двумя кнопками
 * @param {*} title 
 * @param {*} text - placeholder строки ввода
 * @param {*} getValueFn - вызывается, когда осуществляется ввод. Аргшумент - введенная величина
 */
export const inputValue = (title, text, getValueFn) => {
  let _flt_node;

  const handleKeyDown = (ev) => {
    if (ev.which == 13) {
      let root = document.getElementsByClassName("ant-modal-root");
      const okBtn = resq$('Button', root[0]).byProps({ type: "primary" });
      okBtn.props.onClick(okBtn);
    }
  }

  const handleGetInputRef = (node) => {
    _flt_node = node;
    if (node != null) {
      setTimeout(() => {
        node.focus();
      }, 100);
    }
  }

  Modal.confirm({
    title: title,
    centered: true,
    content: <div onKeyDown={handleKeyDown}><Input ref={handleGetInputRef} placeholder={text} /></div>,
    onOk: (closeFn) => {
      const val = _flt_node.state.value;
      if (!val || val == '') {
        return;
      }
      getValueFn(val);
      closeFn();
    }
  });
}
