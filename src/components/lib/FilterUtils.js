import React from 'react';
import moment from 'moment';

const DEFAULT_INIT_PROP_NAME = "defaultValue";

export const getPropInitNames = (initObj) => {
    if (typeof initObj === "object") {
        let propInitNames = initObj.propInitName ? initObj.propInitName.split(',') : [DEFAULT_INIT_PROP_NAME];
        return propInitNames;
    } else {
        return [DEFAULT_INIT_PROP_NAME];
    }
}

export const getInitValues = (initObj) => {
    // объект, но не массив
    if (typeof initObj === "object" && !(initObj instanceof Array)) {
        // исключение для moment object
        if (initObj instanceof moment) {
            return [initObj];
        }
        let propInitNames = initObj.propInitName ? initObj.propInitName.split(',') : [DEFAULT_INIT_PROP_NAME];
        if (propInitNames.length > 1) {
            let initValues = initObj.initValue.split(',');
            return initValues
        } else {
            return [initObj.initValue];
        }
    } else {
        return [initObj];
    }
}

// подготовка к отправке на сервер
export const makeToServer = (config) => {
    let newconfig = { ...config };

    for (let key in newconfig) {
        let val = newconfig[key];
        // исключение с DatePicker - надо передавать timestamp
        if (val instanceof moment && moment(val).isValid()) {
            newconfig[key] = val.toDate().getTime();
        } else
            // исключение с DateRange - надо передавать массив timestamp
            if (val instanceof Array && val.length == 2 &&
                val[0] instanceof moment && moment(val[0]).isValid() &&
                val[1] instanceof moment && moment(val[1]).isValid()) {
                newconfig[key] = [val[0].toDate().getTime(), val[1].toDate().getTime()];
            } else
                // исключение с Select в режиме multiple - надо передавать массив key (проверка на соплях)
                if (val instanceof Array && val.length > 0 &&
                    val[0] instanceof Object && val[0].key) {
                    newconfig[key] = val.map(v => parseInt(v.key))
                }
    }
    return newconfig;
}

// извлечение из объекта задающего начальные значения фильтра в объект
// используемый для отправки на сервер
export const extractValuesFromInitFilters = (initFilters, toServer) => {
    let values = {}
    if (initFilters) {
        for (let key in initFilters) {
            // на первом месте должно быть значение, которе передается на сервер
            values[key] = getInitValues(initFilters[key])[0];
        }
    }
    return !toServer ? values : makeToServer(values);
}

export const createFilterItem = (comp, refs, initValues, changedProc) => {
    let options = {
        key: comp.key,
        onChange: (value) => changedProc(comp.key, value)
    }
    if (comp.type.displayName && (comp.type.displayName.indexOf("DataLookup") === 0)) {
        delete options.onChange;
        options.onSelect = (val, option) => changedProc(comp.key, option.id)
    }
    // установка начального значения
    let initObj = initValues ? initValues[comp.key] : undefined;
    const propNames = getPropInitNames(initObj);
    const values = getInitValues(initObj);
    propNames.map((p, idx) => options[p] = values[idx]);
    // сохранение ссылки на компонент
    const ref = React.createRef();
    options.ref = ref;
    refs[options.key] = ref;
    return React.cloneElement(comp, options);
}

export const normalizeInputValue = (val) => {
    // искючения для checkbox. в val передается event
    if (val && typeof val === "object" && val.target && val.target.type == "checkbox") {
        return val.target.checked ? 1 : 0;
    } if (val && typeof val === "object" && (val.value || val.title)) {
        return parseInt(val.value ?? 0);
    } else {
        return val;
    }
}

export const resetToInitValues = (refs, config, initValues) => {
    // clear config
    Object.keys(config).forEach(function (key) { delete config[key] });
    // возврат к init значениям
    for (const key in refs) {
        const initObj = initValues[key];
        const propNames = getPropInitNames(initObj);
        const values = getInitValues(initObj);
        // сбросим у компоеннтов в ref 
        propNames.map((p, idx) => refs[key].current ? refs[key].current[p] = values[idx] : "");
        // на первом месте должно быть значение, которе передается на сервер
        config[key] = values[0];
    }
}