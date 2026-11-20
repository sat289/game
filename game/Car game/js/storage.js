const KEY = "carWorldSave_v1";
const defaults = {coins:500,gems:10,level:1,xp:0,health:100};
export function loadSave(){
  try { return {...defaults,...JSON.parse(localStorage.getItem(KEY) || "{}")}; }
  catch { return {...defaults}; }
}
export function saveGame(data){ localStorage.setItem(KEY,JSON.stringify(data)); }
export function clearSave(){ localStorage.removeItem(KEY); }
