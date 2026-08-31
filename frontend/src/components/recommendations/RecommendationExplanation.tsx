export function RecommendationExplanation({reasons}:{reasons:string[]}){return <ul className="reasons">{reasons.map(x=><li key={x}>{x}</li>)}</ul>}
