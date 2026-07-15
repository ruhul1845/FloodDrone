export function buildMissionPlan(psoResult, villages) {
  if (!psoResult || !villages?.length) return []
  return villages.flatMap((village,index) => {
    const food = psoResult.food?.[index] || 0
    const medicine = psoResult.medicine?.[index] || 0
    const count = psoResult.missions?.[index] || 0
    if (!count || (!food && !medicine)) return []
    const payload = food && medicine ? 'BOTH' : food ? 'FOOD' : 'MEDICINE'
    return Array.from({ length:count }, (_,missionIndex) => ({
      target:`${village.id}-A${missionIndex % 4 + 1}`,
      payload,
      villageId:village.id,
      mission:missionIndex + 1,
    }))
  })
}
