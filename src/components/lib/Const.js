export const BUTTON_ADD_LABEL = "Добавить";
export const BUTTON_DEL_LABEL = "Удалить";
export const BUTTON_REFRESH_LABEL = "Обновить";

export const MSG_PAGENOTFOUND = `Компонент по адресу ${window.location.pathname} не найден `;
export const MSG_CONFIRM_DELETE = "Вы действительно хотите удалить {0} записей";
export const MSG_CONFIRM_MODIFY = "Данные были изменены. Вы потеряете эти изменения. Продолжить?"

export const MSG_NO_RECORD_FORGETONE = "Ошибка чтения данных";
export const MSG_REQUEST_ERROR = "Ошибка получения данных с сервера";
export const MSG_DELETE_ERROR = "Ошибка удаления данных";
export const MSG_DELETE_SUCCESS = "Удаление записей выполнено успешно";
export const MSG_SAVE_ERROR = "Ошибка сохранения данных";
export const MSG_NETWORK_ERROR = "Сетевая ошибка: хост не найден, интернет соединение отсутствует или сервер не отвечает на запрос. Также возможно это ограничение политики безопасности CORS";
export const MSG_NO_ACCESS = "Отсутствует доступ или токен доступа устарел. Требуется повторный вход в систему";
export const MSG_NO_LOGIN_OR_PASSWORD = "Неверное имя пользователя или пароль";
export const MSG_SUCCESS_COPY_TO_CLIPBOARD = "Данные в количестве {0} запис(и/ей) успешно скопированы в буфер"

export const MSG_REPORT_RUNNING = "Печатная форма успешно отправлена на формирование";

export const MSG_ERROR_NUMBERING_GET = "Возникла ошибка при получении списка нумераторов";
export const MSG_ERROR_NUMBERING_RUN = "Возникла ошибка при запуске нумератора";

export const DEFAULT_DATE_FORMAT = "DD.MM.YYYY";
export const DEFAULT_DATETIME_FORMAT= "DD.MM.YYYY HH:mm";

export const DEBOUNCE_TIMEOUT = 500;

export const DEFAULT_TABLE_CONTEXT = { isLoading: () => false, getSelectedRows: () => [] };

//типы событий аудита, позиция в массиве соответсвует kind
export const EVENT_KINDS = ["-","Сис-ма безопасности","Вызов для изменения",
                "Вызов для добавления","Добавление", "Изменение", "Удаление","Подготовка отчета", 
                "Загрузка отчета", "Выполнение артефакта"]


export const FORM_ITEMS_LAYOUT = {
  labelCol: {
    xs: {
      span: 24,
    },
    sm: {
      span: 8,
    },
  },
  wrapperCol: {
    xs: {
      span: 24,
    },
    sm: {
      span: 16,
    },
  },
};

export const FORM_ITEMS_LAYOUT_FOR_PRINT = {
  labelCol: {
    xs: {
      span: 26,
    },
    sm: {
      span: 10,
    },
  },
  wrapperCol: {
    xs: {
      span: 26,
    },
    sm: {
      span: 16,
    },
  },
};

export const FORM_ITEMS_LAYOUT_WITHOUT_LABEL = {
  wrapperCol: {
    xs: {
      offset: 24,
      span: 24,
    },
    sm: {
      offset: 8,
      span: 16,
    },
  },
};

export const CasheTypes = Object.freeze({
  None:0,
  SessionStorage:1, 
  LocalStorage:2,
  getStorage:(casheType)=>{
    switch (casheType) {
      case CasheTypes.SessionStorage:
        return sessionStorage;
      case CasheTypes.LocalStorage:        
        return localStorage;
      default:
        return null;
    }
  }
})

export const MIN_INT = -2147483646;