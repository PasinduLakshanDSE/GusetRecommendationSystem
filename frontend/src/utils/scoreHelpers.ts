export const riskClass=(level:string)=>level.toLowerCase(); export const topPreferences=(data:Record<string,number>)=>Object.entries(data).sort((a,b)=>b[1]-a[1]).slice(0,3);
