export const percent=(value:number)=>`${value.toFixed(2)}%`; export const number=(value:number)=>new Intl.NumberFormat('en-US').format(value);
