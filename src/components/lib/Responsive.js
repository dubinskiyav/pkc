import { useMediaQuery } from 'react-responsive'

export const Desktop = ({ children }) => {
  const isDesktop = useMediaQuery({ minWidth: 992 })
  return isDesktop ? children : null
}

export const Tablet = ({ children }) => {
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 991 })
  return isTablet ? children : null
}

export const MobileScreen = ({ children }) => {
  const isMobile = useMediaQuery({ maxWidth: 767 })
  return isMobile ? children : null
}

export const DesktopOrTabletScreen = ({ children }) => {
  const isNotMobile = useMediaQuery({ minWidth: 768 })
  return isNotMobile ? children : null
}

let _mobileFlag = true;

/**
 * Флаг для доступа не из компонентиов. Определяется в App.js
 * @returns 
 */
export const isMobile = ()=>_mobileFlag;

export const setMobile = (flag)=>{
    _mobileFlag=flag;
};


export const responsiveMobileColumn=()=>['md']