export const MAX_DYNAMIC_VILLAGES = 8

const sourceUrls = {
  latest: 'https://bdnews24.com/bangladesh/eda23461240f',
  receding: 'https://bdnews24.com/bangladesh/f529f04481b2',
  marooned: 'https://bdnews24.com/bangladesh/94ec6df52dc3',
  dailySun: 'https://www.daily-sun.com/bangladesh/885344/flood-situation-worsens-in-southern-chattogram-three-upazilas-in-crisis',
  dailyStar: 'https://www.thedailystar.net/news/environment/climate-crisis/news/southern-chattogram-reels-under-catastrophic-floods-4220591',
  tbs2023: 'https://www.tbsnews.net/bangladesh/chattogram-flood-15-upazilas-hit-hard-food-and-drinking-water-crisis-500000-marooned',
  tbs2026: 'https://www.tbsnews.net/bangladesh/floods-leave-over-75-lakh-people-marooned-ctg-1484941',
}

export const chattogramFloodLocalities = [
  { id:'V1', name:'Satkania Municipality', position:[22.08444,92.08028], coordinateNote:'Municipality centre coordinate', urgency:'Critical', population:300, foodDemand:120, medicineDemand:15, distance:4, vulnerability:1, floodContext:'Named among the worst-hit parts of Satkania; district reporting described widespread inundation and large numbers of stranded residents.', sourceLabel:'bdnews24, 9 Jul 2026', sourceUrl:sourceUrls.latest },
  { id:'V2', name:'Bajalia', position:[22.16222,92.17722], coordinateNote:'Published Bajalia field coordinate', urgency:'Critical', population:180, foodDemand:70, medicineDemand:8, distance:13, vulnerability:.95, floodContext:'Floodwater in Bajalia cut the Chattogram–Bandarban road connection during the July 2026 floods.', sourceLabel:'bdnews24, 10 Jul 2026', sourceUrl:sourceUrls.marooned },
  { id:'V3', name:'Keochia', position:[22.1156144,92.0934183], coordinateNote:'OpenStreetMap locality coordinate', urgency:'High', population:450, foodDemand:170, medicineDemand:30, distance:8, vulnerability:.85, floodContext:'A Keochia resident reported that water remained on roads and in courtyards even as water left homes.', sourceLabel:'bdnews24, 12 Jul 2026', sourceUrl:sourceUrls.receding },
  { id:'V4', name:'Dhemsa', position:[22.08771,92.0598], coordinateNote:'Published locality coordinate', urgency:'High', population:220, foodDemand:90, medicineDemand:12, distance:3, vulnerability:.8, floodContext:'Dhemsa was among the Satkania unions reported submerged during the July 2026 flood emergency.', sourceLabel:'TBS, 10 Jul 2026', sourceUrl:sourceUrls.tbs2026 },
  { id:'V5', name:'Rampur', position:[22.08547,92.04075], coordinateNote:'Published village coordinate', urgency:'Critical', population:260, foodDemand:105, medicineDemand:18, distance:5, vulnerability:1, floodContext:'A major Dolu River embankment breach at Rampur was reported to have worsened inundation in Satkania.', sourceLabel:'The Daily Star, 10 Jul 2026', sourceUrl:sourceUrls.dailyStar },
  { id:'V6', name:'Paschim Amilaish', position:[22.125,92.025], coordinateNote:'Approximate locality centre', urgency:'High', population:210, foodDemand:85, medicineDemand:11, distance:9, vulnerability:.82, floodContext:'During the 2023 Chattogram flood, a Paschim Amilaish resident reported his family relying on dry food while stranded.', sourceLabel:'TBS, 9 Aug 2023', sourceUrl:sourceUrls.tbs2023 },
  { id:'V7', name:'Charati', position:[22.035,92.105], coordinateNote:'Approximate union centre', urgency:'High', population:240, foodDemand:95, medicineDemand:14, distance:11, vulnerability:.88, floodContext:'Charati was listed among the Satkania unions submerged in July 2026 reporting.', sourceLabel:'TBS, 10 Jul 2026', sourceUrl:sourceUrls.tbs2026 },
  { id:'V8', name:'Manik Pathan, Katharia', position:[22.04,91.96], coordinateNote:'Approximate village centre', urgency:'Critical', population:195, foodDemand:80, medicineDemand:12, distance:15, vulnerability:.92, floodContext:'A resident reported that floodwater damaged most mud houses in Manik Pathan village, Katharia Union.', sourceLabel:'Daily Sun, 10 Jul 2026', sourceUrl:sourceUrls.dailySun },
]

const coreCoordinates = {
  H:[22.0764,92.0496], C:[22.122,92.078], J1:[22.09,92.035],
  J2:[22.105,92.125], C2:[22.045,92.075],
}
const connectors = ['J1','J2','J2','J1','J1','C','C2','J1']
const areaOffsets = [[.012,-.012],[.014,.012],[-.012,-.014],[-.014,.014]]

export function buildVillageScenario(requestedCount = 4) {
  const count=Math.max(1,Math.min(MAX_DYNAMIC_VILLAGES,Math.floor(Number(requestedCount)||1)))
  const graph={H:['C','J1'],C:['H','J2'],J1:['H','J2','C2'],J2:['C','J1','C2'],C2:['J1','J2']}
  const coordinates={...coreCoordinates},areas={},targets=[],edges=[['H','C'],['H','J1'],['C','J2'],['J1','J2'],['J1','C2'],['C2','J2']]
  const villages=chattogramFloodLocalities.slice(0,count)
  villages.forEach((village,index)=>{
    const connector=connectors[index];graph[village.id]=[connector];graph[connector].push(village.id);coordinates[village.id]=village.position;edges.push([connector,village.id])
    areas[village.id]=areaOffsets.map(([latOffset,lngOffset],areaIndex)=>{const area={id:`${village.id}-A${areaIndex+1}`,label:`${village.id} · Area ${areaIndex+1}`,parent:village.id,position:[village.position[0]+latOffset,village.position[1]+lngOffset]};targets.push(area.id);coordinates[area.id]=area.position;return area})
  })
  return {count,graph,coordinates,areas,targets,edges,villages,center:[22.09,92.07]}
}
