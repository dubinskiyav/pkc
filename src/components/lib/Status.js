const Status = (props) => {
    // Сгенерируем id для градиента, иначе он будет неуникальным и не получится нарисовать несколько иконок разного цвета
    // const gradientId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    return (
        <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="15" cy="15" r="12" fill={props.color} />
            <circle cx="15" cy="15" r="14.5" stroke={props.color} />
        </svg>
        // <svg className="status" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        //     <defs>
        //         <radialGradient gradientUnits="userSpaceOnUse" cx="24" cy="24" r="24" id={"RadialGradient" + gradientId} spreadMethod="pad">
        //             <stop offset="0" stopColor="white" />
        //             <stop offset="1" stopColor={props.color} />
        //         </radialGradient>
        //     </defs>
        //     <circle fill={"url(#RadialGradient" + gradientId + ")"} cx="32" cy="32" r="32" />
        // </svg>
    )
};

export default Status;