export interface AspectScore { name:string; positive:number; negative:number; score:number; }
export interface ReviewIntelligence { totalReviews:number; model:string; accuracy:number; macroF1:number; weightedF1:number; sentiment:{name:string; value:number}[]; aspects:AspectScore[]; }
