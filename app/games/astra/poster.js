const posterGame=new URLSearchParams(location.search).get('game');
const posterWorld=window.AstraWorld.create({canvas:document.getElementById('world'),game:posterGame,onPick(){}});
posterWorld.setState({bridge:4,selected:['sun','leaf','rabbit','fox'],chain:['sun','leaf','rabbit','fox'],lights:{red:true,green:true,blue:false},filter:'clear'});
window.addEventListener('pagehide',()=>posterWorld.dispose());
